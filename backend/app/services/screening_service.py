"""
Screening Service — Clinical Reasoning Engine (v4).

Phase 4 redesign:
  - Specialty routing before retrieval (targeted ChromaDB collections)
  - Weighted disease ranking (vector + overlap + urgency + patient context)
  - Maximum-information-gain question selection (differential diagnosis)
  - Per-hypothesis confidence tracking across answers
  - Intelligent stop conditions (convergence detection)
  - Internal reasoning trace logged for debugging

Backward-compatible API preserved for chat.py.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from app.services.search_service import SearchService
from app.services.clinical_reasoning_service import (
    get_specialty_collections,
    rank_candidates,
    select_next_question,
    update_hypothesis_scores,
    should_stop_screening,
    build_reasoning_trace,
    format_question_text,
    get_question_explanation,
    normalize_symptom_concept,
)
from app.services.conversation_service import (
    CLARIFYING,
    LISTENING,
    REASONING,
    SUMMARIZING,
    build_closing_line,
    build_question_turn_intro,
    build_summary_opening,
    describe_symptom,
    extract_clinical_findings,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants & backward-compat aliases
# ---------------------------------------------------------------------------
_SESSION_TTL   = 1800.0
MAX_QUESTIONS  = 5           # increased from 4 for better differential resolution
TOTAL_QUESTIONS = MAX_QUESTIONS   # legacy alias
QUESTIONS: list[dict] = []        # dynamic system — kept empty for compat
_DISEASE_META: dict = {}           # legacy stub; disease data lives in ChromaDB


def _compute_running_scores(answers: dict) -> dict:
    """Legacy stub — superseded by update_hypothesis_scores."""
    return {}


def _rank_conditions(scores: dict) -> list:
    """Legacy stub — superseded by rank_candidates."""
    return []


# ---------------------------------------------------------------------------
# In-memory session store
# ---------------------------------------------------------------------------
_sessions: dict[str, dict[str, Any]] = {}


def _cleanup() -> None:
    now = time.time()
    expired = [sid for sid, s in _sessions.items() if now - s["last_active"] > _SESSION_TTL]
    for sid in expired:
        del _sessions[sid]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def start_screening(
    session_id: str,
    reported_symptoms: list[str],
    patient_context: dict | None = None,
    denied_symptoms: list[str] | None = None,
) -> dict[str, Any]:
    """
    Begin a clinical reasoning session.

    Args:
        session_id        : Unique session identifier (from chat request)
        reported_symptoms : Initial symptoms extracted from user message
        patient_context   : Optional patient metadata (age, gender, conditions, etc.)
    """
    _cleanup()
    normalized_reported = _dedupe_concepts(reported_symptoms)
    normalized_denied = _dedupe_concepts(denied_symptoms or [])
    _sessions[session_id] = {
        "initial_reported_symptoms": list(normalized_reported),
        "initial_denied_symptoms": list(normalized_denied),
        "reported_symptoms": normalized_reported,
        "denied_symptoms":   [s for s in normalized_denied if s not in normalized_reported],
        "answers":           {},
        "current_index":     0,
        "patient_context":   patient_context or {},
        "conversation_state": LISTENING,
        "controller_prompt": None,
        # Clinical engine state
        "top_diseases":      [],      # list[dict] — current ranked hypotheses
        "hypothesis_scores": {},      # {disease_id: float} — confidence per hypothesis
        "last_active":       time.time(),
    }
    logger.info("[Screening] Clinical session started: %s | symptoms=%s | context_keys=%s",
                session_id, normalized_reported, list((patient_context or {}).keys()))
    return _build_question_payload(session_id)


def submit_answer(session_id: str, question_id: str, answer: str) -> dict[str, Any]:
    _cleanup()
    if session_id not in _sessions:
        return {
            "screening_mode": False, "screening_complete": False,
            "error": "Session expired. Please describe your symptoms again to restart.",
            "response": "Your screening session has expired. Please describe your symptoms again to start a new assessment.",
            "risk_level": "routine", "retrieved_documents": [],
            "confidence": 0.0, "matched_rules": [], "disclaimer": "",
        }

    sess = _sessions[session_id]
    concept_id = normalize_symptom_concept(question_id)
    sess["answers"][concept_id] = answer
    sess["last_active"] = time.time()
    sess["conversation_state"] = REASONING

    ans_lower = answer.lower().strip()

    # Update reported / denied lists
    if ans_lower == "yes":
        if concept_id not in sess["reported_symptoms"]:
            sess["reported_symptoms"].append(concept_id)
        sess["denied_symptoms"] = [sym for sym in sess["denied_symptoms"] if sym != concept_id]
    elif ans_lower == "no":
        if concept_id not in sess["denied_symptoms"]:
            sess["denied_symptoms"].append(concept_id)
        sess["reported_symptoms"] = [sym for sym in sess["reported_symptoms"] if sym != concept_id]

    # --- Phase 4: Update hypothesis confidence scores ---
    sess["hypothesis_scores"] = update_hypothesis_scores(
        hypothesis_scores=sess["hypothesis_scores"],
        question_id=concept_id,
        answer=answer,
        top_diseases=sess["top_diseases"],
    )

    sess["current_index"] += 1

    # --- Phase 4: Intelligent stop conditions ---
    stop, stop_reason = should_stop_screening(
        hypothesis_scores=sess["hypothesis_scores"],
        questions_asked=sess["current_index"],
        max_questions=MAX_QUESTIONS,
    )
    if stop:
        logger.info("[Screening] Stopping: %s | session=%s", stop_reason, session_id)
        result = calculate_result(session_id)
        _sessions.pop(session_id, None)
        return result

    return _build_question_payload(session_id)


def is_screening_active(session_id: str) -> bool:
    return session_id in _sessions


def get_session(session_id: str) -> dict[str, Any] | None:
    return _sessions.get(session_id)


def get_current_question_payload(session_id: str) -> dict[str, Any] | None:
    """
    Return the current question payload for an active session without advancing.
    Used by chat.py when a user sends free-text mid-screening.
    """
    if session_id not in _sessions:
        return None
    controller_payload = _build_controller_payload(session_id)
    if controller_payload is not None:
        return controller_payload
    return _build_question_payload(session_id)


def clear_session(session_id: str) -> None:
    _sessions.pop(session_id, None)


def cancel_screening(session_id: str) -> None:
    _sessions.pop(session_id, None)


def restart_screening(
    session_id: str,
    reported_symptoms: list[str] | None = None,
    patient_context: dict | None = None,
    denied_symptoms: list[str] | None = None,
) -> dict[str, Any]:
    sess = _sessions.get(session_id, {})
    next_reported = reported_symptoms if reported_symptoms is not None else sess.get("initial_reported_symptoms", [])
    next_denied = denied_symptoms if denied_symptoms is not None else sess.get("initial_denied_symptoms", [])
    next_context = patient_context if patient_context is not None else sess.get("patient_context")
    return start_screening(session_id, list(next_reported), next_context, list(next_denied))


def set_controller_prompt(
    session_id: str,
    prompt_type: str,
    response: str,
    options: list[str],
    data: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    sess = _sessions.get(session_id)
    if not sess:
        return None
    sess["controller_prompt"] = {
        "type": prompt_type,
        "response": response,
        "options": options,
        "data": data or {},
    }
    sess["last_active"] = time.time()
    return _build_controller_payload(session_id)


def clear_controller_prompt(session_id: str) -> None:
    sess = _sessions.get(session_id)
    if sess:
        sess["controller_prompt"] = None


def get_controller_prompt(session_id: str) -> dict[str, Any] | None:
    sess = _sessions.get(session_id)
    if not sess:
        return None
    return sess.get("controller_prompt")


def resolve_controller_prompt(session_id: str, answer: str) -> dict[str, Any]:
    sess = _sessions.get(session_id)
    controller = get_controller_prompt(session_id) or {}
    prompt_type = controller.get("type")
    answer_lower = answer.lower().strip()

    if not sess or not prompt_type:
        return {
            "screening_mode": False,
            "screening_complete": False,
            "response": "The current assessment session is no longer active.",
            "risk_level": "routine",
            "retrieved_documents": [],
            "confidence": 0.0,
            "matched_rules": [],
            "disclaimer": "",
        }

    if prompt_type == "new_complaint_choice":
        data = controller.get("data", {})
        if "continue" in answer_lower:
            clear_controller_prompt(session_id)
            payload = _build_question_payload(session_id)
            payload["response"] = (
                "Understood.\n"
                "We will continue the current assessment."
            )
            return payload

        if "start" in answer_lower or "new assessment" in answer_lower:
            payload = restart_screening(
                session_id,
                reported_symptoms=data.get("reported_symptoms", []),
                patient_context=data.get("patient_context"),
                denied_symptoms=data.get("denied_symptoms", []),
            )
            payload["response"] = (
                "Understood.\n"
                "I will start a new assessment for the new symptom."
            )
            return payload

    return _build_controller_payload(session_id) or {
        "screening_mode": False,
        "screening_complete": False,
        "response": "Please choose one of the available options to continue.",
        "risk_level": "routine",
        "retrieved_documents": [],
        "confidence": 0.0,
        "matched_rules": [],
        "disclaimer": "",
    }


def calculate_result(session_id: str) -> dict[str, Any]:
    sess = _sessions.get(session_id, {})
    reported     = sess.get("reported_symptoms", [])
    top_diseases = sess.get("top_diseases", [])
    hyp_scores   = sess.get("hypothesis_scores", {})
    patient_context = sess.get("patient_context", {})
    sess["conversation_state"] = SUMMARIZING

    # Re-rank using final hypothesis scores if available
    if hyp_scores and top_diseases:
        for d in top_diseases:
            if d["id"] in hyp_scores:
                d["clinical_score"] = hyp_scores[d["id"]]
        top_diseases.sort(key=lambda x: x.get("clinical_score", 0), reverse=True)

    # Fallback: fresh search if no candidates stored
    if not top_diseases:
        search_svc = SearchService.get_instance()
        query = " ".join(reported) if reported else "general illness symptoms"
        raw = search_svc.hybrid_search(query, collection="all", top_k=10)
        top_diseases = rank_candidates(raw, reported, sess.get("patient_context"))

    if not top_diseases:
        return _empty_result(reported)

    top = top_diseases[0]
    confidence_score = top.get("clinical_score", top.get("score", 0.5))

    # Build possible_conditions list (top 3–5 with >= 0.40 score)
    possible_conditions = [
        {
            "id":         d["id"],
            "name":       d.get("title", d["id"]),
            "icon":       "\U0001fa7a",
            "score":      round(d.get("clinical_score", d.get("score", 0)), 3),
            "raw_score":  round(d.get("clinical_score", d.get("score", 0)), 2),
            "likelihood": _likelihood_label(d.get("clinical_score", d.get("score", 0))),
        }
        for d in top_diseases[:5]
        if d.get("clinical_score", d.get("score", 0)) >= 0.40
    ]
    if not possible_conditions:
        possible_conditions = [
            {
                "id": d["id"], "name": d.get("title", d["id"]), "icon": "\U0001fa7a",
                "score": round(d.get("clinical_score", d.get("score", 0)), 3),
                "raw_score": round(d.get("clinical_score", d.get("score", 0)), 2),
                "likelihood": _likelihood_label(d.get("clinical_score", d.get("score", 0))),
            }
            for d in top_diseases[:2]
        ]

    # Extract actions + warning signs from document content
    content = top.get("content", "")
    actions, warning_signs = _extract_from_content(content)

    urgency = top.get("urgency", "").lower()
    primary_condition = {
        "id":           top["id"],
        "name":         top.get("title", top["id"]),
        "icon":         "\U0001fa7a",
        "risk_label":   "Higher urgency" if urgency in ("high", "emergency") else "Moderate urgency",
        "actions":      actions,
        "warning_signs": warning_signs,
    }

    risk_level       = "urgent" if urgency in ("high", "emergency") else "routine"
    confidence_label = "High" if confidence_score > 0.80 else ("Medium" if confidence_score > 0.60 else "Low")

    running_scores = [
        {
            "id": d["id"], "name": d.get("title", d["id"]), "icon": "\U0001fa7a",
            "score": round(d.get("clinical_score", d.get("score", 0)), 3),
            "raw_score": round(d.get("clinical_score", d.get("score", 0)), 2),
            "likelihood": _likelihood_label(d.get("clinical_score", d.get("score", 0))),
        }
        for d in top_diseases[:5]
    ]

    return {
        "screening_mode":     False,
        "screening_complete": True,
        "risk_level":         risk_level,
        "reported_symptoms":  reported,
        "possible_conditions": possible_conditions,
        "primary_condition":  primary_condition,
        "running_scores":     running_scores,
        "confidence_label":   confidence_label,
        "response":           _build_summary_text(
            symptoms=reported,
            conditions=possible_conditions,
            primary_meta=primary_condition,
            risk_level=risk_level,
            patient_context=patient_context,
            top_disease=top,
        ),
        "confidence":         round(confidence_score, 3),
        "matched_rules":      [top["id"]],
        "disclaimer": (
            "\u26a0\ufe0f This assessment is informational only and does NOT replace a qualified "
            "healthcare professional\u2019s diagnosis. Please seek medical care for testing and treatment."
        ),
        "retrieved_documents": [],
        "referral_facilities": _referral_facilities(),
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_question_payload(session_id: str) -> dict[str, Any]:
    sess = _sessions[session_id]
    sess["controller_prompt"] = None
    idx              = sess["current_index"]
    reported         = sess["reported_symptoms"]
    denied           = sess["denied_symptoms"]
    patient_context  = sess.get("patient_context", {})

    # Build search query from all confirmed symptoms
    query = " ".join(reported) if reported else "general illness symptoms"

    search_svc = SearchService.get_instance()

    # --- Phase 4: Specialty routing ---
    specialty_cols = get_specialty_collections(query)
    logger.info("[Screening] Specialty collections: %s | query='%s'", specialty_cols, query[:50])

    # Search targeted collections first, fallback to global if needed
    results: list[dict] = []
    if specialty_cols == ["all"]:
        results = search_svc.hybrid_search(query, collection="all", top_k=20)
    else:
        # Targeted search across top 3 specialty collections
        for col in specialty_cols[:3]:
            try:
                hits = search_svc.search(query, collection=col, top_k=8)
                results.extend(hits)
            except Exception as exc:
                logger.warning("[Screening] Collection '%s' search failed: %s", col, exc)
        # Dedup by id, keep highest score
        seen: dict[str, dict] = {}
        for r in results:
            rid = r["id"]
            if rid not in seen or r.get("score", 0) > seen[rid].get("score", 0):
                seen[rid] = r
        results = list(seen.values())
        # If we got fewer than 10, supplement with global search
        if len(results) < 10:
            global_hits = search_svc.hybrid_search(query, collection="all", top_k=10)
            for r in global_hits:
                if r["id"] not in seen:
                    results.append(r)
                    seen[r["id"]] = r

    if not results:
        logger.warning("[Screening] No results found. Finishing early.")
        result = calculate_result(session_id)
        _sessions.pop(session_id, None)
        return result

    # --- Phase 4: Weighted disease ranking ---
    ranked = rank_candidates(results, reported, patient_context)

    # Store top candidates in session for confidence tracking
    sess["top_diseases"] = ranked[:20]

    # Initialize hypothesis_scores from clinical_score if not yet set
    if not sess["hypothesis_scores"]:
        sess["hypothesis_scores"] = {
            d["id"]: d.get("clinical_score", d.get("score", 0.5))
            for d in ranked[:10]
        }

    # --- Phase 4: Differential question selection ---
    # Exclude: initial reported symptoms + denied answers + all prior question IDs
    prior_question_ids = list(sess.get("answers", {}).keys())
    top_for_diff = ranked[:5]   # compare top 5 hypotheses
    next_question_data = select_next_question(
        top_for_diff,
        reported + prior_question_ids,   # already known / asked
        denied,
    )

    if not next_question_data:
        logger.info("[Screening] No differentiating question found. Finishing.")
        result = calculate_result(session_id)
        _sessions.pop(session_id, None)
        return result
        
    next_symptom = next_question_data["symptom"]
    question_reason = next_question_data["reason"]

    # --- Phase 4: Reasoning trace ---
    trace = build_reasoning_trace(
        intent="clinical_screening",
        symptoms=reported,
        specialty_collections=specialty_cols,
        top_diseases=ranked,
        selected_question=next_symptom,
        hypothesis_scores=sess["hypothesis_scores"],
        patient_context=patient_context,
        denied_symptoms=denied,
    )
    logger.info("[ClinicalReasoning] %s\nReasoning: %s", trace, question_reason)

    # Build running_scores for frontend live display
    running_scores = [
        {
            "id": d["id"], "name": d.get("title", d["id"]), "icon": "\U0001fa7a",
            "score": round(d.get("clinical_score", d.get("score", 0)), 3),
            "raw_score": round(d.get("clinical_score", d.get("score", 0)), 2),
            "likelihood": _likelihood_label(d.get("clinical_score", d.get("score", 0))),
        }
        for d in ranked[:5]
    ]

    confidence_label = "High" if running_scores and running_scores[0]["score"] > 0.80 else "Medium"

    sess["conversation_state"] = CLARIFYING
    return {
        "screening_mode":     True,
        "screening_complete": False,
        "question_index":     idx,
        "total_questions":    MAX_QUESTIONS,
        "question": {
            "id":      next_symptom,
            "text":    format_question_text(next_symptom),
            "hint":    question_reason,
            "options": ["Yes", "No", "Not sure"],
        },
        "running_scores":    running_scores,
        "confidence_label":  confidence_label,
        "response":          build_question_turn_intro(patient_context, idx + 1),
        "risk_level":        "routine",
        "retrieved_documents": [],
        "confidence":        1.0,
        "matched_rules":     [],
        "disclaimer":        "",
    }


def _build_controller_payload(session_id: str) -> dict[str, Any] | None:
    sess = _sessions.get(session_id)
    if not sess:
        return None
    controller = sess.get("controller_prompt")
    if not controller:
        return None
    return {
        "screening_mode": True,
        "screening_complete": False,
        "question_index": sess.get("current_index", 0),
        "total_questions": MAX_QUESTIONS,
        "question": {
            "id": f"controller:{controller['type']}",
            "text": controller["response"],
            "hint": "",
            "options": controller.get("options", []),
        },
        "running_scores": [],
        "confidence_label": "",
        "response": controller["response"],
        "risk_level": "routine",
        "retrieved_documents": [],
        "confidence": 1.0,
        "matched_rules": [],
        "disclaimer": "",
    }


def _extract_from_content(content: str) -> tuple[list[str], list[str]]:
    """Parse guidance/precautions from raw document text."""
    actions: list[str] = []
    warning_signs: list[str] = []

    if "Guidance:" in content:
        g = content.split("Guidance:")[1]
        if "Precautions:" in g:
            g = g.split("Precautions:")[0]
        elif "First Aid:" in g:
            g = g.split("First Aid:")[0]
        actions = [a.strip() for a in g.split(".") if a.strip()][:3]

    if "Precautions:" in content:
        p = content.split("Precautions:")[1]
        if "First Aid:" in p:
            p = p.split("First Aid:")[0]
        warning_signs = [w.strip() for w in p.split(".") if w.strip()][:3]

    if not actions:
        actions = ["Consult a doctor for further advice."]

    return actions, warning_signs


def _likelihood_label(score: float) -> str:
    if score >= 0.85:
        return "More likely"
    if score >= 0.65:
        return "Possible"
    if score >= 0.45:
        return "Less likely"
    return "Lower possibility"


def _empty_result(reported: list[str]) -> dict[str, Any]:
    return {
        "screening_mode": False, "screening_complete": True,
        "risk_level": "routine", "reported_symptoms": reported,
        "possible_conditions": [], "primary_condition": None,
        "running_scores": [], "confidence_label": "Low",
        "response": (
            f"{build_summary_opening()}\n\n"
            "I cannot narrow this down to one likely explanation from the available information.\n"
            "Please arrange a clinical evaluation if the symptoms continue."
        ),
        "confidence": 0.0, "matched_rules": [],
        "disclaimer": "\u26a0\ufe0f This assessment is informational only. Please seek medical care.",
        "retrieved_documents": [], "referral_facilities": _referral_facilities(),
    }


def _referral_facilities() -> list[dict]:
    return [
        {"name": "Primary Health Centre (PHC)", "type": "PHC", "icon": "\U0001f3e5",
         "distance_km": 3.2, "address": "Nearest PHC — walk-in or consult",
         "phone": "104", "available": "Mon\u2013Sat, 8 AM\u20132 PM"},
        {"name": "Community Health Centre (CHC)", "type": "CHC", "icon": "\U0001f3e8",
         "distance_km": 7.5, "address": "Block-level CHC — 24\xd77 emergency",
         "phone": "108", "available": "24 \xd7 7"},
        {"name": "District Hospital", "type": "DH", "icon": "\U0001f3db\ufe0f",
         "distance_km": 12.0, "address": "District General Hospital",
         "phone": "108", "available": "24 \xd7 7"},
    ]


def _build_summary_text(
    symptoms: list[str],
    conditions: list[dict],
    primary_meta: dict,
    risk_level: str,
    patient_context: dict | None = None,
    top_disease: dict | None = None,
) -> str:
    lines = [
        "Based on everything you've told me, these are the most likely explanations.",
        ""
    ]
    
    if conditions:
        lead_cond = conditions[0]
        lines.append("1.")
        lines.append(lead_cond["name"])
        confidence = "High" if lead_cond.get("score", 0) > 0.8 else ("Medium" if lead_cond.get("score", 0) > 0.6 else "Low")
        lines.append(f"Confidence: {confidence}")
        
        if symptoms:
            lines.append("")
            lines.append("Supporting symptoms")
            for symptom in symptoms:
                lines.append(f"✓ {symptom.capitalize()}")
                
        if top_disease:
            from app.services.clinical_reasoning_service import _split_candidate_values, normalize_symptom_concept
            
            tags_raw = str(top_disease.get("question_candidates", "") or top_disease.get("tags", ""))
            all_tags = [normalize_symptom_concept(t) for t in _split_candidate_values(tags_raw)]
            
            reported_norm = {normalize_symptom_concept(s) for s in symptoms}
            unconfirmed = [t for t in all_tags if t not in reported_norm and len(t) > 3]
            
            if unconfirmed:
                lines.append("")
                lines.append("Need confirmation")
                for u in unconfirmed[:3]:
                    lines.append(f"• {u.capitalize().replace('_', ' ')}")
                    
    lines.append("")
    lines.append("Recommended next step")
    for action in primary_meta.get("actions", [])[:1]:
        lines.append(f"{action}")
        
    lines.append("")
    lines.append("This is NOT a diagnosis.")
    
    return "\n".join(lines)


def _dedupe_concepts(symptoms: list[str]) -> list[str]:
    unique: list[str] = []
    seen: set[str] = set()
    for symptom in symptoms:
        text = str(symptom).strip()
        extracted_reported, _ = extract_clinical_findings(text)
        concepts = extracted_reported or [normalize_symptom_concept(text)]
        for concept in concepts:
            if concept in seen:
                continue
            seen.add(concept)
            unique.append(concept)
    return unique
