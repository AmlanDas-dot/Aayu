"""
Chat Router — Sprint 2 + Screening Mode.

POST /chat
    Normal chat pipeline with symptom-trigger detection.
    If febrile symptoms detected and no active screening → start screening.
    If screening active → this should not be called; use /chat/screening/answer.

POST /chat/screening/answer
    Submit an answer during an active screening session.

DELETE /chat/session/{session_id}
    Clear conversation history.
"""

from __future__ import annotations

import logging
import time
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rule_based_triage import get_triage_engine
from app.services.response_service import get_response_service, MEDICAL_DISCLAIMER
from app.services.search_service import SearchService
from app.services.translation_service import translate_to_english, translate_from_english
from app.services.llm_service import get_llm_response, check_connectivity
from app.services.memory_service import get_history, add_turn
from app.services.emergency_service import EmergencyClassifier
from app.services.screening_service import (
    start_screening,
    submit_answer,
    is_screening_active,
    TOTAL_QUESTIONS,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Greeting detection
# ---------------------------------------------------------------------------

_GREETING_PATTERNS = re.compile(
    r"^\s*(hi+|hello+|hey+|namaste|namaskar|hola|howdy|good\s*(morning|evening|afternoon|night)|"
    r"how are you|what.?s up|thank(s| you)|ok+|okay|bye|goodbye|hii+)\s*[!?.]*\s*$",
    re.IGNORECASE,
)

_MIN_RELEVANCE_SCORE = 0.58


def _is_greeting(text: str) -> bool:
    return bool(_GREETING_PATTERNS.match(text.strip()))


def _is_medical_query(text: str) -> bool:
    return not _is_greeting(text) and len(text.strip()) > 4


# ---------------------------------------------------------------------------
# Symptom trigger detection for screening
# ---------------------------------------------------------------------------

# These trigger the screening flow — must include fever as an anchor
_SCREENING_TRIGGER_PATTERN = re.compile(
    r"\b(fever|temperature|bukhar|tez bukhar|headache|sir dard|body ache|chills|"
    r"dengue|malaria|typhoid|flu|influenza|thanda lagana|sardard)\b",
    re.IGNORECASE,
)

# Must also contain at least one "sick" qualifier to avoid false positives
_SICK_QUALIFIER = re.compile(
    r"\b(have|has|feel|feeling|suffering|since|days|week|ill|sick|my|me|husband|wife|"
    r"child|baby|mujhe|mujhko|hain|ho raha|lag raha)\b",
    re.IGNORECASE,
)


def _should_trigger_screening(text: str) -> tuple[bool, list[str]]:
    """Return (should_trigger, detected_symptoms)."""
    trigger_matches = _SCREENING_TRIGGER_PATTERN.findall(text)
    if not trigger_matches:
        return False, []
    has_qualifier = bool(_SICK_QUALIFIER.search(text))
    # Need at least one trigger AND a qualifier, OR 2+ symptom words
    if not has_qualifier and len(trigger_matches) < 2:
        return False, []
    symptoms = [m.lower() for m in trigger_matches]
    return True, list(set(symptoms))


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

    # ── Screening fields (optional — only present during screening) ──────────
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

@router.post("/chat", response_model=ChatResponse, summary="Full health pipeline")
async def chat(body: ChatRequest) -> ChatResponse:
    t_start = time.time()

    # ── Emergency pre-check ──────────────────────────────────────────────────
    emergency_classifier = EmergencyClassifier.get_instance()
    emergency_result = emergency_classifier.classify(body.message)

    # ── Step 1: Translation ──────────────────────────────────────────────────
    original_message = body.message.strip()
    english_message = original_message

    if body.language and body.language != "en":
        try:
            english_message = translate_to_english(original_message, body.language)
            logger.info("[Chat] Translated (%s→en): '%s'", body.language, english_message[:60])
        except Exception as exc:
            logger.warning("[Chat] Translation failed: %s", exc)
            english_message = original_message

    # ── Greeting fast-path ────────────────────────────────────────────────────
    if _is_greeting(english_message):
        processing_time_ms = round((time.time() - t_start) * 1000)
        return ChatResponse(
            risk_level="low",
            response=(
                "Namaste! 🙏 I am AAYU, your health assistant. "
                "You can ask me about symptoms, diseases, nutrition, "
                "or government health schemes. How can I help you today?"
            ),
            retrieved_documents=[],
            confidence=1.0,
            matched_rules=[],
            original_message=original_message,
            english_message=english_message,
            processing_time_ms=processing_time_ms,
            disclaimer=MEDICAL_DISCLAIMER,
            mode="offline",
            llm_provider="template",
            emergency=None,
        )

    # ── Screening intercept ───────────────────────────────────────────────────
    # If this session already has an active screening, don't restart it —
    # just remind the user to answer using the chips.
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

    # Check whether this new message should trigger screening
    if body.session_id and not emergency_result.is_emergency:
        should_screen, detected_symptoms = _should_trigger_screening(english_message)
        if should_screen:
            processing_time_ms = round((time.time() - t_start) * 1000)
            payload = start_screening(body.session_id, detected_symptoms)
            logger.info("[Chat] Screening started for session %s — %s", body.session_id, detected_symptoms)
            # Friendly, conversational intro
            symptom_list = detected_symptoms
            if len(symptom_list) == 1:
                symptom_display = symptom_list[0]
            elif len(symptom_list) == 2:
                symptom_display = f"{symptom_list[0]} and {symptom_list[1]}"
            else:
                symptom_display = ", ".join(symptom_list[:-1]) + f", and {symptom_list[-1]}"
            intro = (
                f"I can see you're experiencing symptoms such as {symptom_display}.\n\n"
                "To better understand what might be causing them, I'd like to ask you "
                f"a few quick questions — this will only take a moment.\n\n"
                "Please tap the option that best describes your experience."
            )
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

    # ── Step 2: Semantic Search ───────────────────────────────────────────────
    search_results: list[dict] = []
    if _is_medical_query(english_message):
        try:
            svc = SearchService.get_instance()
            raw_results = svc.hybrid_search(
                query=english_message,
                collection=body.collection,
                top_k=body.top_k + 5,
            )
            search_results = [r for r in raw_results if r.get("score", 0) >= _MIN_RELEVANCE_SCORE]
            search_results = search_results[:body.top_k]
        except Exception as exc:
            logger.error("[Chat] Hybrid search failed: %s", exc)

    # ── Step 3: Rule-Based Triage ─────────────────────────────────────────────
    try:
        engine = get_triage_engine()
        triage = engine.assess(english_message)
    except Exception as exc:
        logger.error("[Chat] Triage failed: %s", exc)
        raise HTTPException(status_code=500, detail="Triage classification failed.")

    # ── Session memory ────────────────────────────────────────────────────────
    history = get_history(body.session_id) if body.session_id else []

    # ── Step 3.5: LLM Generation ──────────────────────────────────────────────
    llm_response_text = ""
    llm_provider = "template"
    is_online = await check_connectivity()

    context_parts = [
        f"{doc.get('title', '')}: {doc.get('content', '')}"
        for doc in search_results[:5]
    ]
    llm_context = "\n\n".join(context_parts) if context_parts else "No specific knowledge found."

    try:
        llm_response_text, llm_provider = await get_llm_response(
            query=english_message,
            context=llm_context,
            language=body.language,
            prefer_online=is_online,
            history=history,
        )
        if llm_response_text and body.language and body.language != "en":
            try:
                llm_response_text = translate_from_english(llm_response_text, body.language)
            except Exception as te:
                logger.warning("[Chat] Back-translation failed: %s", te)
    except Exception as exc:
        logger.warning("[Chat] LLM generation failed: %s — falling back to template.", exc)

    if body.session_id and llm_response_text:
        add_turn(body.session_id, original_message, llm_response_text)

    # ── Step 4: Response Generation ───────────────────────────────────────────
    try:
        response_svc = get_response_service()
        health_resp = response_svc.format_response(
            query=english_message,
            triage=triage.to_dict(),
            context_chunks=search_results,
            llm_response=llm_response_text,
        )
    except Exception as exc:
        logger.error("[Chat] Response formatting failed: %s", exc)
        raise HTTPException(status_code=500, detail="Response generation failed.")

    processing_time_ms = round((time.time() - t_start) * 1000)
    resp_dict = health_resp.to_dict()

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
        disclaimer=resp_dict["disclaimer"],
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
    """
    Called by the frontend when the user taps an answer chip.
    Returns either:
      - The next question payload (screening_mode: true)
      - The final screening result (screening_complete: true)
    """
    t_start = time.time()

    payload = submit_answer(body.session_id, body.question_id, body.answer)

    processing_time_ms = round((time.time() - t_start) * 1000)

    # Map payload keys → ChatResponse fields
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
    from app.services.memory_service import clear_session as cs
    from app.services.screening_service import _sessions as screening_sessions
    cs(session_id)
    screening_sessions.pop(session_id, None)
    return {"cleared": True, "session_id": session_id}
