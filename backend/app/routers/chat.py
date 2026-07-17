"""
Chat Router — Strict Deterministic Routing.
"""

from __future__ import annotations

import logging
import time
import re
import traceback
import json

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
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
    cancel_screening,
    clear_controller_prompt,
    get_session,
    start_screening,
    restart_screening,
    resolve_controller_prompt,
    set_controller_prompt,
    submit_answer,
    is_screening_active,
    get_current_question_payload,
    TOTAL_QUESTIONS,
)
from app.services.conversation_service import (
    build_active_screening_reminder,
    build_general_chat_during_screening_message,
    build_new_complaint_choice_message,
    build_patient_switch_message,
    build_question_clarification_response,
    build_question_reason_response,
    build_restart_screening_message,
    build_stop_screening_message,
    build_user_question_response,
    classify_active_screening_message,
    extract_clinical_findings,
    extract_patient_context_from_message,
    INTENT_CHANGE_PATIENT,
    INTENT_CLARIFICATION_REQUEST,
    INTENT_CONTROLLER_CONTINUE,
    INTENT_CONTROLLER_START_NEW,
    INTENT_GENERAL_CHAT,
    INTENT_NEW_EMERGENCY,
    INTENT_NEW_MEDICAL_COMPLAINT,
    INTENT_NOT_SURE,
    INTENT_NO,
    INTENT_RESTART_SCREENING,
    INTENT_STOP_SCREENING,
    INTENT_USER_QUESTION,
    INTENT_YES,
)
from app.services.nutrition_service import NutritionService
from app.services.schemes_service import SchemesService
from app.services.clinical_nlp_service import extract_clinical_entities
import logging

logger = logging.getLogger(__name__)

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
    # Always trigger if they explicitly ask for a screening
    is_explicit = bool(_SCREENING_EXPLICIT_PATTERN.search(text))
    
    nlp_payload = extract_clinical_entities(text)
    symptoms = nlp_payload.get("symptoms", [])
    
    if is_explicit or symptoms:
        return True, symptoms
        
    return False, []

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
    message: str = Field(..., description="The user's input message")
    language: str = Field("en", description="Target language code")
    top_k: int = Field(5, description="Number of results to retrieve from RAG")
    collection: str = Field("all", description="ChromaDB collection to search")
    session_id: str = Field("", description="Unique session identifier for contextual chat")
    history: list[dict] = Field(default_factory=list, description="Recent conversation history")
    patient_records: str = Field("", description="Serialized patient medical records context")
    # Phase 4: Patient context from frontend HealthContext.
    # Accepted fields: age, gender, conditions, allergies, medications, village, member_name
    patient_context: dict | None = Field(default=None)

class TitleRequest(BaseModel):
    message: str

class ScreeningAnswerRequest(BaseModel):
    session_id: str = Field(..., description="Session ID returned from /chat")
    question_id: str = Field(..., description="The id field from the question object")
    answer: str = Field(..., description="The selected option text")
    language: str = Field(default="en")

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

class HealthcareRecommendation(BaseModel):
    enabled: bool = False
    urgency: str = "routine"
    facility_types: list[str] = ["hospital"]
    radius: int = 5000
    title: str = "Nearby Healthcare Facilities"
    message: str = ""

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
    healthcare_recommendation: HealthcareRecommendation | None = None

    # ── Screening fields ──────────
    screening_mode: bool = False
    screening_complete: bool = False
    show_risk_level: bool = False
    question_index: int | None = None
    total_questions: int | None = None
    question: ScreeningQuestion | None = None
    reported_symptoms: list[str] | None = None
    possible_conditions: list[dict] | None = None
    primary_condition: dict | None = None
    running_scores: list[dict] | None = None
    confidence_label: str | None = None
    referral_facilities: list[dict] | None = None


def _screening_payload_to_chat_response(
    payload: dict,
    original_message: str,
    english_message: str,
    processing_time_ms: int,
    language: str = "en",
) -> ChatResponse:
    q_data = payload.get("question")
    response_text = payload.get("response", "")
    
    if language != "en":
        try:
            if response_text:
                response_text = translate_from_english(response_text, language)
            if q_data:
                q_data["text"] = translate_from_english(q_data["text"], language)
                if q_data.get("hint"):
                    q_data["hint"] = translate_from_english(q_data["hint"], language)
                q_data["options"] = [translate_from_english(opt, language) for opt in q_data["options"]]
        except Exception as e:
            logger.error("[Chat] Translation failed in _screening_payload_to_chat_response: %s", str(e))

    return ChatResponse(
        risk_level=payload.get("risk_level", "routine"),
        response=response_text,
        retrieved_documents=[],
        confidence=payload.get("confidence", 1.0),
        matched_rules=payload.get("matched_rules", []),
        original_message=original_message,
        english_message=english_message,
        processing_time_ms=processing_time_ms,
        disclaimer=payload.get("disclaimer", ""),
        mode="offline",
        llm_provider="template",
        emergency=None,
        screening_mode=payload.get("screening_mode", False),
        screening_complete=payload.get("screening_complete", False),
        show_risk_level=payload.get("show_risk_level", False),
        question_index=payload.get("question_index"),
        total_questions=payload.get("total_questions"),
        question=ScreeningQuestion(
            id=q_data["id"],
            text=q_data["text"],
            hint=q_data.get("hint", ""),
            options=q_data["options"],
        ) if q_data else None,
        reported_symptoms=payload.get("reported_symptoms"),
        possible_conditions=payload.get("possible_conditions"),
        primary_condition=payload.get("primary_condition"),
        running_scores=payload.get("running_scores"),
        confidence_label=payload.get("confidence_label"),
        referral_facilities=payload.get("referral_facilities"),
    )


def _build_emergency_chat_response(
    emergency_result,
    body: ChatRequest,
    original_message: str,
    english_message: str,
    t_start: float,
) -> ChatResponse:
    processing_time_ms = round((time.time() - t_start) * 1000)
    severity = emergency_result.severity
    conditions = ", ".join(emergency_result.detected_conditions)

    if severity == "CRITICAL":
        emerg_response = (
            "I am concerned that the symptoms you described could represent a medical emergency.\n"
            f"This pattern can be seen in {conditions}.\n"
            "Please seek immediate medical care or call 108 now.\n"
            "Keep the person as still as possible.\n"
            "If the person is unconscious or not breathing, start CPR only if you are trained."
        )
    elif severity == "URGENT":
        emerg_response = (
            "I am concerned that this needs urgent medical attention.\n"
            f"This pattern can be seen in {conditions}.\n"
            "Please go to the nearest PHC, CHC, or hospital now.\n"
            "If the symptoms worsen on the way, call 108.\n"
            "Keep the person seated and as comfortable as possible."
        )
    else:
        emerg_response = (
            "I am concerned that this should be assessed by a clinician soon.\n"
            f"This pattern can be seen in {conditions}.\n"
            "Please visit your nearest clinic or PHC as soon as possible.\n"
            "If the symptoms worsen, call 104 or 108."
        )

    rec_title = "Nearest Emergency Hospitals" if severity == "CRITICAL" else "Nearby Healthcare Facilities"
    rec_message = "Please proceed to the nearest emergency hospital immediately." if severity == "CRITICAL" else "Please visit your nearest clinic or hospital soon."

    if body.language and body.language != "en":
        try:
            emerg_response = translate_from_english(emerg_response, body.language)
            rec_title = translate_from_english(rec_title, body.language)
            rec_message = translate_from_english(rec_message, body.language)
        except Exception:
            logger.error("[Emergency] Back-translation failed:\n%s", traceback.format_exc())

    logger.warning(
        "[Chat] EMERGENCY SHORT-CIRCUIT | severity=%s | session=%s | conditions=%s",
        severity, body.session_id, conditions,
    )

    recommendation = HealthcareRecommendation(
        enabled=True,
        urgency=severity.lower(),
        facility_types=["hospital", "medical_clinic"],
        radius=10000,
        title=rec_title,
        message=rec_message
    )

    return ChatResponse(
        risk_level=emergency_result.risk_level,
        response=emerg_response,
        retrieved_documents=[],
        confidence=1.0,
        matched_rules=emergency_result.detected_conditions,
        original_message=original_message,
        english_message=english_message,
        processing_time_ms=processing_time_ms,
        disclaimer="⚠️ AAYU is an AI assistant, NOT a substitute for emergency medical care. Call 108 immediately in a life-threatening situation.",
        mode="offline",
        llm_provider="emergency_template",
        emergency=emergency_result.to_dict(),
        healthcare_recommendation=recommendation,
        show_risk_level=True
    )


# ---------------------------------------------------------------------------
# /chat  — main endpoint
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse, summary="Strict deterministic routing chat")
async def chat(body: ChatRequest, request: Request) -> ChatResponse:
    t_start = time.time()
    logger.info("========== CHAT REQUEST RECEIVED ==========")
    logger.info("Request body: %s", body.model_dump_json())

    # ── Step 1: Translation ──────────────────────────────────────────────────
    raw_message = body.message.strip()
    original_message, patient_context = extract_patient_context_from_message(
        raw_message,
        body.patient_context,
    )
    english_message = original_message

    if body.language and body.language != "en":
        try:
            english_message = translate_to_english(original_message, body.language)
            logger.info("[Chat] Translated (%s→en): '%s'", body.language, english_message[:60])
        except Exception as exc:
            logger.error("[Chat] Translation failed:\n%s", traceback.format_exc())
            english_message = original_message

    # ── Step 1.5: Emergency Detection + Normalization ────────────────────────
    # Phase 3: normalize lay phrases → canonical terms BEFORE classification.
    from app.services.emergency_service import normalize_symptoms
    normalized_message = normalize_symptoms(english_message)
    emergency_classifier = EmergencyClassifier.get_instance()
    emergency_result = emergency_classifier.classify(normalized_message)

    # ── Step 1.6: Emergency Short-Circuit ────────────────────────────────────
    # If ANY emergency is detected, return immediately.
    # No screening, no hybrid search, no LLM reasoning, no casual chat.
    if emergency_result.is_emergency:
        if body.session_id and is_screening_active(body.session_id):
            cancel_screening(body.session_id)
        return _build_emergency_chat_response(
            emergency_result=emergency_result,
            body=body,
            original_message=original_message,
            english_message=english_message,
            t_start=t_start,
        )


    # ── Step 2: Active Screening Controller ───────────────────────────────────
    if body.session_id and is_screening_active(body.session_id):
        session = get_session(body.session_id) or {}
        payload = await get_current_question_payload(body.session_id)
        processing_time_ms = round((time.time() - t_start) * 1000)
        if payload is not None:
            current_question = payload.get("question", {})
            intent_result = classify_active_screening_message(
                normalized_message,
                session,
                current_question,
            )
            logger.info(
                "[ScreeningController] intent=%s | prev_state=%s | route=%s | reason=%s | session=%s",
                intent_result.intent,
                session.get("conversation_state"),
                intent_result.intent,
                intent_result.reason,
                body.session_id,
            )

            if intent_result.intent == INTENT_NEW_EMERGENCY:
                cancel_screening(body.session_id)
                emergency_now = emergency_classifier.classify(english_message)
                return _build_emergency_chat_response(
                    emergency_result=emergency_now,
                    body=body,
                    original_message=original_message,
                    english_message=english_message,
                    t_start=t_start,
                )

            if intent_result.intent in {INTENT_YES, INTENT_NO, INTENT_NOT_SURE}:
                clear_controller_prompt(body.session_id)
                answer_payload = await submit_answer(
                    body.session_id,
                    current_question.get("id", ""),
                    intent_result.normalized_answer or "Not sure",
                )
                return _screening_payload_to_chat_response(
                    answer_payload,
                    original_message,
                    english_message,
                    int((time.time() - t_start) * 1000),
                    body.language,
                )

            if intent_result.intent in {INTENT_CONTROLLER_CONTINUE, INTENT_CONTROLLER_START_NEW}:
                choice = "Continue current assessment" if intent_result.intent == INTENT_CONTROLLER_CONTINUE else "Start new assessment"
                controller_payload = resolve_controller_prompt(body.session_id, choice)
                return _screening_payload_to_chat_response(
                    controller_payload,
                    original_message,
                    english_message,
                    int((time.time() - t_start) * 1000),
                    body.language,
                )

            if intent_result.intent == INTENT_CLARIFICATION_REQUEST:
                payload["response"] = build_question_clarification_response(current_question, english_message)
                return _screening_payload_to_chat_response(
                    payload,
                    original_message,
                    english_message,
                    processing_time_ms,
                    body.language,
                )

            if intent_result.intent == INTENT_USER_QUESTION:
                hint = current_question.get("hint", "")
                if "why" in english_message.lower() and hint:
                    payload["response"] = build_question_reason_response(hint)
                else:
                    payload["response"] = build_user_question_response(english_message, current_question)
                return _screening_payload_to_chat_response(
                    payload,
                    original_message,
                    english_message,
                    processing_time_ms,
                    body.language,
                )

            if intent_result.intent == INTENT_STOP_SCREENING:
                cancel_screening(body.session_id)
                return ChatResponse(
                    risk_level="routine",
                    response=build_stop_screening_message(),
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
                    screening_mode=False,
                    screening_complete=True,
                )

            if intent_result.intent == INTENT_RESTART_SCREENING:
                restarted = await restart_screening(body.session_id)
                restarted["response"] = build_restart_screening_message()
                return _screening_payload_to_chat_response(
                    restarted,
                    original_message,
                    english_message,
                    processing_time_ms,
                    body.language,
                )

            if intent_result.intent == INTENT_CHANGE_PATIENT:
                next_context = dict(session.get("patient_context", {}))
                next_context.update(intent_result.updated_patient_context or {})
                restarted = await restart_screening(body.session_id, patient_context=next_context)
                restarted["response"] = build_patient_switch_message(next_context)
                return _screening_payload_to_chat_response(
                    restarted,
                    original_message,
                    english_message,
                    processing_time_ms,
                    body.language,
                )

            if intent_result.intent == INTENT_NEW_MEDICAL_COMPLAINT:
                controller_payload = set_controller_prompt(
                    body.session_id,
                    prompt_type="new_complaint_choice",
                    response=build_new_complaint_choice_message(),
                    options=["Continue current assessment", "Start new assessment"],
                    data={
                        "reported_symptoms": intent_result.reported_findings or [english_message],
                        "denied_symptoms": intent_result.denied_findings or [],
                        "patient_context": patient_context or session.get("patient_context", {}),
                    },
                )
                if controller_payload is not None:
                    return _screening_payload_to_chat_response(
                        controller_payload,
                        original_message,
                        english_message,
                        processing_time_ms,
                        body.language,
                    )

            payload["response"] = build_general_chat_during_screening_message()
            return _screening_payload_to_chat_response(
                payload,
                original_message,
                english_message,
                processing_time_ms,
                body.language,
            )


    # ── Step 3: Screening Trigger ────────────────────────────────────────────
    should_screen, detected_symptoms = _should_trigger_screening(normalized_message)
    if body.session_id and not emergency_result.is_emergency and should_screen:
        symptoms = detected_symptoms
        if not symptoms:
            symptoms = [normalized_message]
            
        # Get full NLP payload to pass demographic data if any
        nlp_data = extract_clinical_entities(normalized_message)
        
        # Merge NLP age/gender into patient context if found
        if patient_context is None:
            patient_context = {}
        if nlp_data.get("age"):
            patient_context["age"] = nlp_data["age"]
        if nlp_data.get("gender"):
            patient_context["gender"] = nlp_data["gender"]
        patient_context["nlp_data"] = nlp_data
            
        # Phase 4: pass patient_context to clinical reasoning engine
        # Phase 10: Using NLP extracted denied symptoms
        payload = await start_screening(body.session_id, symptoms, patient_context, nlp_data.get("negated_symptoms", []))
        logger.info("[Chat] Screening started for session %s — %s", body.session_id, symptoms)
        response_text = payload.get("response", "")
        if body.language and body.language != "en" and response_text:
            try:
                response_text = translate_from_english(response_text, body.language)
            except Exception:
                logger.error("[Chat] Intro translation failed:\n%s", traceback.format_exc())

        processing_time_ms = round((time.time() - t_start) * 1000)
        q_data = payload.get("question", {})
        return ChatResponse(
            risk_level="routine",
            response=response_text,
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
            
    # Step 8: Everything Else — Medical Intent Detection before falling to casual chat.
    # Phase 4: Before giving up to casual chat, run a semantic search.
    # If any result scores >= 0.55, the query is medical → enter clinical reasoning.
    else:
        _MEDICAL_CONFIDENCE_THRESHOLD = 0.55
        clinical_triggered = False

        if body.session_id and not emergency_result.is_emergency:
            try:
                from app.services.clinical_reasoning_service import get_specialty_collections
                svc = SearchService.get_instance()
                specialty_cols = get_specialty_collections(english_message)
                # Quick semantic probe: search top specialty collection
                probe_col = specialty_cols[0] if specialty_cols != ["all"] else "all"
                probe_results = svc.hybrid_search(english_message, collection=probe_col, top_k=5)
                top_probe_score = probe_results[0].get("score", 0) if probe_results else 0

                if top_probe_score >= _MEDICAL_CONFIDENCE_THRESHOLD:
                    # Medical relevance detected — enter clinical reasoning
                    intent = "clinical_screening"
                    symptoms = reported_findings[:] or detected_symptoms[:] or [english_message]
                    payload = await start_screening(body.session_id, symptoms, patient_context, denied_findings)
                    logger.info(
                        "[Chat] Medical intent detected (score=%.3f) → clinical screening | session=%s",
                        top_probe_score, body.session_id,
                    )
                    response_text = payload.get("response", "")
                    if body.language and body.language != "en" and response_text:
                        try:
                            response_text = translate_from_english(response_text, body.language)
                        except Exception:
                            pass
                    processing_time_ms = round((time.time() - t_start) * 1000)
                    q_data = payload.get("question", {})
                    return ChatResponse(
                        risk_level="routine",
                        response=response_text,
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

                clinical_triggered = True  # searched but score too low
            except Exception:
                logger.error("[Chat] Medical intent probe failed:\n%s", traceback.format_exc())

        # Genuine non-medical query → casual chat
        intent = "general_chat"
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
    if body.patient_records:
        llm_context = f"{llm_context}\n\n[USER'S MEDICAL RECORDS (USE ONLY IF RELEVANT)]:\n{body.patient_records}"

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

    if body.question_id.startswith("controller:"):
        payload = resolve_controller_prompt(body.session_id, body.answer)
    else:
        payload = await submit_answer(body.session_id, body.question_id, body.answer)

    processing_time_ms = round((time.time() - t_start) * 1000)

    return _screening_payload_to_chat_response(
        payload,
        "",
        "",
        processing_time_ms,
        body.language,
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


# ---------------------------------------------------------------------------
# /image-chat  — Chat with image endpoint
# ---------------------------------------------------------------------------

class ImageChatResponse(BaseModel):
    success: bool
    image_description: str
    answer: str
    triage: str
    warnings: list[str]
    confidence: str
    is_medical_record: bool = False

@router.post("/image-chat", response_model=ImageChatResponse, summary="Analyze image with Gemini Vision and answer using RAG")
async def image_chat(
    request: Request,
    image: UploadFile = File(...),
    question: str | None = Form(None),
    language: str | None = Form(None),
    session_id: str | None = Form(None),
    history: str | None = Form(None),
) -> ImageChatResponse:
    logger.info("========== IMAGE CHAT REQUEST RECEIVED ==========")
    
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="No image file provided.")

    try:
        from app.services.gemini_vision import GeminiVisionService
        
        # Read bytes
        image_bytes = await image.read()
        
        # Call Gemini Vision Service
        vision_svc = GeminiVisionService.get_instance()
        warnings = []
        try:
            description, warnings_list, is_medical_record = await vision_svc.generate_description(
                image_bytes, image.filename, image.content_type
            )
            warnings.extend(warnings_list)
        except ValueError as ve:
            logger.warning("[ImageChat] Image validation failed: %s", ve)
            raise HTTPException(status_code=400, detail=str(ve))
        except RuntimeError as re:
            logger.error("[ImageChat] Gemini execution failed: %s", re)
            raise HTTPException(status_code=500, detail=str(re))
            
        # Normalize and translate question
        user_q = (question or "").strip()
        if not user_q:
            user_q = "Describe this image."
            
        english_question = user_q
        if language and language != "en":
            try:
                english_question = translate_to_english(user_q, language)
                logger.info("[ImageChat] Translated question (%s→en): '%s'", language, english_question[:60])
            except Exception:
                logger.error("[ImageChat] Question translation failed:\n%s", traceback.format_exc())

        # RAG Search: Query ChromaDB with findings and question
        rag_query = f"Question: {english_question}. Visible findings: {description}"
        search_results = []
        llm_context = "No specific knowledge found."
        
        try:
            svc = SearchService.get_instance()
            raw_results = svc.hybrid_search(
                query=rag_query,
                collection="all",
                top_k=5,
            )
            _MIN_RELEVANCE_SCORE = 0.58
            search_results = [r for r in raw_results if r.get("score", 0) >= _MIN_RELEVANCE_SCORE][:5]
            context_parts = [f"{doc.get('title', '')}: {doc.get('content', '')}" for doc in search_results]
            if context_parts:
                llm_context = "\n\n".join(context_parts)
        except Exception as exc:
            logger.error("[ImageChat] RAG Search failed:\n%s", traceback.format_exc())

        # Emergency & Triage Check
        emergency_classifier = EmergencyClassifier.get_instance()
        emergency_result = emergency_classifier.classify(english_question)
        
        intent = "disease_information"
        system_prompt = PROMPT_DISEASE_INFO
        
        # LLM Response generation
        llm_query = (
            f"User question: {english_question}\n"
            f"Observable findings from patient's uploaded image: {description}\n"
            "Please provide clear, safe, non-diagnostic guidance answering their question using the findings and context."
        )
        
        parsed_history = []
        if history:
            try:
                parsed_history = json.loads(history)
            except Exception:
                logger.error("[ImageChat] Failed to parse history JSON")

        is_online = await check_connectivity()
        try:
            llm_response_text, llm_provider = await get_llm_response(
                query=llm_query,
                context=llm_context,
                language=language,
                prefer_online=is_online,
                history=parsed_history,
                system_prompt=system_prompt
            )
            
            # Back-translation
            if llm_response_text and language and language != "en":
                try:
                    llm_response_text = translate_from_english(llm_response_text, language)
                except Exception as te:
                    logger.error("[ImageChat] Back-translation failed:\n%s", traceback.format_exc())
        except Exception as exc:
            logger.error("[ImageChat] LLM generation failed:\n%s", traceback.format_exc())
            llm_response_text = "The AI service is currently unavailable."
            llm_provider = "none"

        # Format final answer with Response Service
        try:
            engine = get_triage_engine()
            triage_obj = engine.assess(english_question)
            t_dict = triage_obj.to_dict() if triage_obj else {
                "risk_level": "routine",
                "matched_rules": [],
                "urgency": "low",
                "confidence": 1.0
            }
            
            response_svc = get_response_service()
            health_resp = response_svc.format_response(
                query=english_question,
                triage=t_dict,
                context_chunks=search_results,
                llm_response=llm_response_text,
            )
            resp_dict = health_resp.to_dict()
            final_answer = resp_dict["response"]
            risk_level = resp_dict["risk_level"]
            confidence_val = str(resp_dict["confidence"])
        except Exception as exc:
            logger.error("[ImageChat] Response formatting failed:\n%s", traceback.format_exc())
            final_answer = llm_response_text
            risk_level = "routine"
            confidence_val = "1.0"
            
        # Append disclaimer
        disclaimer = MEDICAL_DISCLAIMER
        if language and language != "en":
            try:
                disclaimer = translate_from_english(MEDICAL_DISCLAIMER, language)
            except Exception:
                pass
                
        if disclaimer not in final_answer:
            final_answer = f"{final_answer}\n\n{disclaimer}"

        # Map confidence
        try:
            c_float = float(confidence_val)
            if c_float < 0.6:
                confidence_str = "low"
            elif c_float < 0.8:
                confidence_str = "medium"
            else:
                confidence_str = "high"
        except Exception:
            confidence_str = "low"

        return ImageChatResponse(
            success=True,
            image_description=description,
            answer=final_answer,
            triage=risk_level,
            warnings=warnings,
            confidence=confidence_str,
            is_medical_record=is_medical_record
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[ImageChat] Unhandled error during image chat execution: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal image chat server error: {e}")
