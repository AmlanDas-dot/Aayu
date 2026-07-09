"""
Chat Router — Strict Deterministic Routing.
"""

from __future__ import annotations

import logging
import time
import re
import traceback
import json

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.services.rule_based_triage import get_triage_engine
from app.services.response_service import get_response_service, MEDICAL_DISCLAIMER
from app.services.search_service import SearchService
from app.services.translation_service import translate_to_english, translate_from_english
from app.services.llm_service import (
    get_llm_response, check_connectivity,
    PROMPT_CASUAL_CHAT, PROMPT_DISEASE_INFO, PROMPT_GENERAL_HEALTH,
    PROMPT_MENTAL_HEALTH, PROMPT_NUTRITION, PROMPT_SCHEMES
)
from app.services.emergency_service import EmergencyClassifier
from app.services.screening_service import (
    start_screening,
    submit_answer,
    is_screening_active,
    TOTAL_QUESTIONS,
    _DISEASE_META
)
from app.services.nutrition_service import NutritionService
from app.services.schemes_service import SchemesService

logger = logging.getLogger(__name__)

# Build a dynamic set of disease keywords from _DISEASE_META
_DISEASE_KEYWORDS = set()
for m in _DISEASE_META.values():
    n = m.get('name', '').lower()
    n = re.sub(r'[^a-z ]', ' ', n)
    words = n.split()
    if len(words) == 1:
        _DISEASE_KEYWORDS.add(words[0])
    else:
        _DISEASE_KEYWORDS.add(' '.join(words))
        for w in words:
            if len(w) > 4:
                _DISEASE_KEYWORDS.add(w)

_STOP_WORDS = {
    'elderly', 'disease', 'disorder', 'syndrome', 'acute', 'chronic', 'severe', 'mild',
    'pregnancy', 'child', 'infant', 'neonatal', 'adult', 'women', 'management', 'screening',
    'prevention', 'health', 'care', 'treatment', 'symptoms', 'causes', 'what', 'about',
    'explain', 'condition', 'effects', 'infections', 'infection', 'viral', 'bacterial', 'fungal',
    'possible', 'suspected', 'probable', 'known', 'history', 'family', 'related', 'associated'
}
_DISEASE_KEYWORDS = _DISEASE_KEYWORDS - _STOP_WORDS

# ---------------------------------------------------------------------------
# Deterministic Keyword Detectors
# ---------------------------------------------------------------------------

_SCREENING_TRIGGER_PATTERN = re.compile(
    r"\b(fever|temperature|bukhar|tez bukhar|headache|sir dard|body ache|chills|"
    r"dengue|malaria|typhoid|flu|influenza|thanda lagana|sardard|vomiting|diarrhea|cough|breathing difficulty|dizzy|nauseous|nausea|weak|weakness|fatigue|pain|rash|rashes|stomach ache|stomach pain|chest pain|joint pain|muscle pain|eye pain|toothache|bleeding|swelling|itch|itching|sweating|sneezing|बुखार|सिरदर्द|दर्द|चकत्ते|खुजली|उल्टी|दस्त|खांसी)\b",
    re.IGNORECASE,
)

_SICK_QUALIFIER = re.compile(
    r"\b(have|having|has|feel|feeling|suffering|experiencing|getting|got|diagnosed|since|days|week|ill|sick|my|me|husband|wife|"
    r"child|baby|mujhe|mujhko|hain|ho raha|lag raha|है|मुझे)\b",
    re.IGNORECASE,
)

_NUTRITION_PATTERN = re.compile(
    r"\b(food|diet|nutrition|eat|protein|vitamin|calorie|meal|recipes|weight|lose weight|gain weight)\b",
    re.IGNORECASE,
)

_SCHEMES_PATTERN = re.compile(
    r"\b(scheme|ayushman|pmjay|government|insurance|benefit|card|yojana|kalia)\b",
    re.IGNORECASE,
)

_HOSPITALS_PATTERN = re.compile(
    r"\b(hospital|clinic|phc|chc|doctor|nearby|nearest|ambulance)\b",
    re.IGNORECASE,
)

_DISEASE_PATTERN = re.compile(
    r"\b(what is|tell me about|explain|symptoms of|causes of|treatment for|disease|condition)\b",
    re.IGNORECASE,
)

_SCREENING_EXPLICIT_PATTERN = re.compile(
    r"\b(screen|screening|diagnose|diagnosis|checkup|test)\b",
    re.IGNORECASE,
)

def _should_trigger_screening(text: str) -> tuple[bool, list[str]]:
    text_lower = text.lower()
    
    # Always trigger if they explicitly ask for a screening
    is_explicit = bool(_SCREENING_EXPLICIT_PATTERN.search(text))
    
    trigger_matches = _SCREENING_TRIGGER_PATTERN.findall(text)
    
    # Check dynamic backend disease keywords
    text_words = set(re.findall(r'\b[a-z]+\b', text_lower))
    matched_diseases = text_words.intersection(_DISEASE_KEYWORDS)
    for dk in _DISEASE_KEYWORDS:
        if ' ' in dk and dk in text_lower:
            matched_diseases.add(dk)
            
    if is_explicit:
        symptoms = [m.lower() for m in trigger_matches] if trigger_matches else []
        symptoms.extend(list(matched_diseases))
        return True, list(set(symptoms))
        
    if not trigger_matches and not matched_diseases:
        return False, []
        
    has_qualifier = bool(_SICK_QUALIFIER.search(text))
    total_triggers = len(trigger_matches) + len(matched_diseases)
    
    if not has_qualifier and total_triggers < 2:
        return False, []
        
    symptoms = [m.lower() for m in trigger_matches] + list(matched_diseases)
    return True, list(set(symptoms))

def _is_nutrition_query(text: str) -> bool:
    return bool(_NUTRITION_PATTERN.search(text))

def _is_schemes_query(text: str) -> bool:
    return bool(_SCHEMES_PATTERN.search(text))

def _is_hospital_query(text: str) -> bool:
    return bool(_HOSPITALS_PATTERN.search(text))

def _is_disease_query(text: str) -> bool:
    # also matching specific names
    disease_names = re.compile(r"\b(dengue|malaria|typhoid|flu|influenza|anemia)\b", re.IGNORECASE)
    return bool(_DISEASE_PATTERN.search(text)) or bool(disease_names.search(text))


router = APIRouter(tags=["chat"])

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(default="en")
    top_k: int = Field(default=5, ge=1, le=10)
    collection: str = Field(default="all")
    session_id: str = Field(default="")
    history: list[dict[str, str]] = Field(default=[])

class TitleRequest(BaseModel):
    message: str

class ScreeningAnswerRequest(BaseModel):
    session_id: str = Field(..., description="Session ID returned from /chat")
    question_id: str = Field(..., description="The id field from the question object")
    answer: str = Field(..., description="The selected option text")

class RetrievedDocument(BaseModel):
    title: str
    content: str
    score: float
    collection: str
    category: str
    source: str

class ScreeningQuestion(BaseModel):
    id: str
    text: str
    hint: str = ""
    options: list[str]

class ChatResponse(BaseModel):
    risk_level: str
    response: str
    retrieved_documents: list[RetrievedDocument]
    confidence: float
    matched_rules: list[str]
    original_message: str
    english_message: str
    processing_time_ms: int
    disclaimer: str
    mode: str = "offline"
    llm_provider: str = "template"
    emergency: dict | None = None

    # ── Screening fields ──────────
    screening_mode: bool = False
    screening_complete: bool = False
    question_index: int | None = None
    total_questions: int | None = None
    question: ScreeningQuestion | None = None
    reported_symptoms: list[str] | None = None
    possible_conditions: list[dict] | None = None
    primary_condition: dict | None = None
    running_scores: list[dict] | None = None
    confidence_label: str | None = None
    referral_facilities: list[dict] | None = None


# ---------------------------------------------------------------------------
# /chat  — main endpoint
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse, summary="Strict deterministic routing chat")
async def chat(body: ChatRequest, request: Request) -> ChatResponse:
    t_start = time.time()
    logger.info("========== CHAT REQUEST RECEIVED ==========")
    logger.info("Request body: %s", body.model_dump_json())

    # ── Step 1: Translation ──────────────────────────────────────────────────
    original_message = body.message.strip()
    english_message = original_message

    if body.language and body.language != "en":
        try:
            english_message = translate_to_english(original_message, body.language)
            logger.info("[Chat] Translated (%s→en): '%s'", body.language, english_message[:60])
        except Exception as exc:
            logger.error("[Chat] Translation failed:\n%s", traceback.format_exc())
            english_message = original_message

    # ── Step 1.5: Emergency pre-check ────────────────────────────────────────
    emergency_classifier = EmergencyClassifier.get_instance()
    emergency_result = emergency_classifier.classify(english_message)

    # ── Step 2: Active Screening check ────────────────────────────────────────
    if body.session_id and is_screening_active(body.session_id):
        processing_time_ms = round((time.time() - t_start) * 1000)
        from app.services.screening_service import get_session, QUESTIONS, _rank_conditions, _compute_running_scores
        sess = get_session(body.session_id)
        idx = sess["current_index"] if sess else 0
        q = QUESTIONS[idx] if idx < len(QUESTIONS) else QUESTIONS[-1]
        running = _rank_conditions(_compute_running_scores(sess.get("answers", {}))) if sess else []
        return ChatResponse(
            risk_level="routine",
            response="Please answer the current question using the options shown below.",
            retrieved_documents=[],
            confidence=1.0,
            matched_rules=[],
            original_message=original_message,
            english_message=english_message,
            processing_time_ms=processing_time_ms,
            disclaimer="",
            mode="offline",
            llm_provider="template",
            emergency=None,
            screening_mode=True,
            screening_complete=False,
            question_index=idx,
            total_questions=len(QUESTIONS),
            question=ScreeningQuestion(id=q["id"], text=q["text"], hint=q.get("hint", ""), options=q["options"]),
            running_scores=running,
        )

    # ── Step 3: Screening Trigger ────────────────────────────────────────────
    should_screen, detected_symptoms = _should_trigger_screening(english_message)
    if body.session_id and not emergency_result.is_emergency and should_screen:
        symptoms = detected_symptoms if detected_symptoms else [english_message]
        payload = start_screening(body.session_id, symptoms)
        logger.info("[Chat] Screening started for session %s — %s", body.session_id, symptoms)
        
        intro = "It sounds like you're experiencing symptoms that are suitable for a structured health screening. I'll ask a few questions to better understand your situation."
        
        # Translate intro if needed
        if body.language and body.language != "en":
            try:
                intro = translate_from_english(intro, body.language)
            except Exception:
                logger.error("[Chat] Intro translation failed:\n%s", traceback.format_exc())
                pass

        processing_time_ms = round((time.time() - t_start) * 1000)
        q_data = payload.get("question", {})
        return ChatResponse(
            risk_level="routine",
            response=intro,
            retrieved_documents=[],
            confidence=1.0,
            matched_rules=[],
            original_message=original_message,
            english_message=english_message,
            processing_time_ms=processing_time_ms,
            disclaimer="",
            mode="offline",
            llm_provider="template",
            emergency=None,
            screening_mode=True,
            screening_complete=False,
            question_index=payload.get("question_index"),
            total_questions=payload.get("total_questions"),
            question=ScreeningQuestion(
                id=q_data["id"],
                text=q_data["text"],
                hint=q_data.get("hint", ""),
                options=q_data["options"],
            ) if q_data else None,
            running_scores=payload.get("running_scores"),
            confidence_label=payload.get("confidence_label"),
        )

    # ── Routing Selection ────────────────────────────────────────────────────
    llm_context = ""
    system_prompt = PROMPT_GENERAL_HEALTH
    search_results = []
    intent = "chat"
    
    # Step 4: Nutrition
    if _is_nutrition_query(english_message):
        intent = "nutrition"
        system_prompt = PROMPT_NUTRITION
        try:
            n_svc = NutritionService.get_instance()
            foods = n_svc.search_foods(english_message)[:5]
            if foods:
                context_parts = [f"{f['display_name']}: {f.get('guidance', '')} Good for: {', '.join(f.get('recommended_foods', []))}" for f in foods]
                llm_context = "\n\n".join(context_parts)
            else:
                llm_context = "No specific nutrition data found."
        except Exception as e:
            logger.error("[Chat] Nutrition search failed:\n%s", traceback.format_exc())
            llm_context = "No specific nutrition data found."
            
    # Step 5: Schemes
    elif _is_schemes_query(english_message):
        intent = "schemes"
        system_prompt = PROMPT_SCHEMES
        try:
            s_svc = SchemesService.get_instance()
            schemes_res = s_svc.search_schemes(english_message)[:3]
            if schemes_res:
                context_parts = [f"Scheme: {s['name']}\nDesc: {s.get('description', '')}\nBenefits: {s.get('benefits', '')}" for s in schemes_res]
                llm_context = "\n\n".join(context_parts)
            else:
                llm_context = "No specific scheme data found."
        except Exception as e:
            logger.error("[Chat] Schemes search failed:\n%s", traceback.format_exc())
            llm_context = "No specific scheme data found."
            
    # Step 6: Hospitals
    elif _is_hospital_query(english_message):
        intent = "hospitals"
        llm_context = "The user is asking for nearby hospitals. Tell them to click the 'Nearby Hospitals' feature in the menu to share their location, as you cannot access their GPS directly from chat."
        system_prompt = PROMPT_GENERAL_HEALTH
        
    # Step 7: Disease Information
    elif _is_disease_query(english_message):
        intent = "disease_information"
        system_prompt = PROMPT_DISEASE_INFO
        try:
            svc = SearchService.get_instance()
            raw_results = svc.hybrid_search(
                query=english_message,
                collection=body.collection,
                top_k=body.top_k + 5,
            )
            _MIN_RELEVANCE_SCORE = 0.58
            search_results = [r for r in raw_results if r.get("score", 0) >= _MIN_RELEVANCE_SCORE][:body.top_k]
            context_parts = [f"{doc.get('title', '')}: {doc.get('content', '')}" for doc in search_results[:5]]
            llm_context = "\n\n".join(context_parts) if context_parts else "No specific knowledge found."
        except Exception as exc:
            logger.error("[Chat] Hybrid search failed:\n%s", traceback.format_exc())
            llm_context = "No specific knowledge found."
            
    # Step 8: Everything Else
    else:
        intent = "general_chat"
        # We can use mental health or casual chat based on keywords, or a unified prompt
        if any(w in english_message.lower() for w in ["scared", "anxious", "lonely", "sad", "failed", "lost", "die"]):
            system_prompt = PROMPT_MENTAL_HEALTH
        else:
            system_prompt = PROMPT_CASUAL_CHAT

    logger.info("[Chat] Routing decision: intent='%s'", intent)


    # ── Rule-Based Triage (Background classification) ─────────────────────────
    try:
        engine = get_triage_engine()
        triage = engine.assess(english_message)
    except Exception as exc:
        logger.error("[Chat] Triage failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Triage classification failed.")

    # ── LLM Generation ────────────────────────────────────────────────────────
    is_online = await check_connectivity()
    history = body.history
    llm_response_text = ""
    llm_provider = "template"
    logger.info("[Chat] Calling get_llm_response...")

    try:
        llm_response_text, llm_provider = await get_llm_response(
            query=english_message,
            context=llm_context,
            language=body.language,
            prefer_online=is_online,
            history=history,
            system_prompt=system_prompt
        )

        if llm_response_text and body.language and body.language != "en":
            try:
                llm_response_text = translate_from_english(llm_response_text, body.language)
            except Exception as te:
                logger.error("[Chat] Back-translation failed:\n%s", traceback.format_exc())
    except Exception as exc:
        logger.error("[Chat] LLM generation failed:\n%s", traceback.format_exc())
        llm_response_text = "The AI service is currently unavailable."

    logger.info("[Chat] LLM provider selected: %s", llm_provider)
    logger.info("[Chat] LLM raw response: %s", llm_response_text)

    # ── Response Generation ───────────────────────────────────────────────────
    try:
        response_svc = get_response_service()
        # Pass empty triage dict if intent isn't disease so we don't hallucinate triage risks for casual chat
        t_dict = triage.to_dict() if intent in ["disease_information", "screening", "emergency"] else {
            "risk_level": "routine",
            "matched_rules": [],
            "urgency": "low",
            "confidence": 1.0
        }
        
        health_resp = response_svc.format_response(
            query=english_message,
            triage=t_dict,
            context_chunks=search_results,
            llm_response=llm_response_text,
        )
    except Exception as exc:
        logger.error("[Chat] Response formatting failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Response generation failed.")

    processing_time_ms = round((time.time() - t_start) * 1000)
    resp_dict = health_resp.to_dict()
    
    logger.info("========== CHAT RESPONSE ==========")
    logger.info(resp_dict)
    return ChatResponse(
        risk_level=resp_dict["risk_level"],
        response=resp_dict["response"],
        retrieved_documents=[
            RetrievedDocument(**doc) for doc in resp_dict["retrieved_documents"]
        ],
        confidence=resp_dict["confidence"],
        matched_rules=resp_dict["matched_rules"],
        original_message=original_message,
        english_message=english_message,
        processing_time_ms=processing_time_ms,
        disclaimer=MEDICAL_DISCLAIMER if intent in ["disease_information", "screening", "emergency"] else "",
        mode="online" if is_online and llm_provider == "gemini" else "offline",
        llm_provider=llm_provider,
        emergency=emergency_result.to_dict() if emergency_result.is_emergency else None,
    )

# ---------------------------------------------------------------------------
# /chat/screening/answer  — answer submission endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/chat/screening/answer",
    response_model=ChatResponse,
    summary="Submit an answer during active screening",
)
async def screening_answer(body: ScreeningAnswerRequest) -> ChatResponse:
    t_start = time.time()

    payload = submit_answer(body.session_id, body.question_id, body.answer)

    processing_time_ms = round((time.time() - t_start) * 1000)

    docs = [RetrievedDocument(**d) for d in payload.get("retrieved_documents", [])]
    question_data = payload.get("question")

    return ChatResponse(
        risk_level=payload.get("risk_level", "routine"),
        response=payload.get("response", ""),
        retrieved_documents=docs,
        confidence=payload.get("confidence", 1.0),
        matched_rules=payload.get("matched_rules", []),
        original_message="",
        english_message="",
        processing_time_ms=processing_time_ms,
        disclaimer=payload.get("disclaimer", ""),
        mode="offline",
        llm_provider="template",
        emergency=None,
        screening_mode=payload.get("screening_mode", False),
        screening_complete=payload.get("screening_complete", False),
        question_index=payload.get("question_index"),
        total_questions=payload.get("total_questions"),
        question=ScreeningQuestion(
            id=question_data["id"],
            text=question_data["text"],
            hint=question_data.get("hint", ""),
            options=question_data["options"],
        ) if question_data else None,
        reported_symptoms=payload.get("reported_symptoms"),
        possible_conditions=payload.get("possible_conditions"),
        primary_condition=payload.get("primary_condition"),
        running_scores=payload.get("running_scores"),
        confidence_label=payload.get("confidence_label"),
        referral_facilities=payload.get("referral_facilities"),
    )

# ---------------------------------------------------------------------------
# Clear session
# ---------------------------------------------------------------------------

@router.delete("/chat/session/{session_id}", summary="Clear conversation history")
async def clear_session(session_id: str):
    from app.services.screening_service import _sessions as screening_sessions
    screening_sessions.pop(session_id, None)
    return {"cleared": True, "session_id": session_id}

# ---------------------------------------------------------------------------
# /chat/title  — Generate conversation title
# ---------------------------------------------------------------------------

@router.post("/chat/title", summary="Generate a short conversation title")
async def generate_title(body: TitleRequest):
    is_online = await check_connectivity()
    prompt = f"Generate a concise conversation title. Requirements: Maximum 5 words. No punctuation. No quotation marks. Use title case. Summarize the conversation topic, not the user's sentence. Based on this message: {body.message}"
    title, _ = await get_llm_response(
        query=prompt,
        context="",
        prefer_online=is_online,
        system_prompt="You are a helpful assistant that generates short, concise titles for health conversations.",
        max_tokens=20
    )
    if not title:
        title = "Health Chat"
    
    # cleanup punctuation
    title = title.replace('"', '').replace("'", "").strip()
    if title.endswith('.'):
        title = title[:-1]
    return {"title": title}

