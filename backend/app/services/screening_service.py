"""
Screening Service — Hackathon MVP (v2).

Lightweight, in-memory conversational screener for four febrile illness pathways:
  • Dengue  • Malaria  • Influenza  • Typhoid

Changes vs v1:
  - Improved scoring weights with proper per-answer deltas
  - Question payload now includes running_scores for live narrowing
  - calculate_result returns structured data (not just raw text)
  - _build_summary_text produces rich, human-readable output
  - Friendly conversational tone throughout
"""

from __future__ import annotations

import time
import logging
from typing import Any

logger = logging.getLogger(__name__)

import os
import json
import glob

# ---------------------------------------------------------------------------
# Screening questions
# ---------------------------------------------------------------------------

QUESTIONS: list[dict[str, Any]] = [
    {
        "id": "fever_duration",
        "text": "Have you been experiencing a fever, and if so, for how long?",
        "hint": "Fever duration helps narrow down the most likely cause.",
        "options": ["Less than 24 hours", "1–3 days", "More than 3 days", "No fever"],
    },
    {
        "id": "respiratory_symptoms",
        "text": "Are you experiencing a cough, sore throat, runny nose, or difficulty breathing?",
        "hint": "These indicate respiratory involvement.",
        "options": ["Yes", "No", "Not sure"],
    },
    {
        "id": "gi_symptoms",
        "text": "Are you experiencing nausea, vomiting, diarrhea, or stomach pain?",
        "hint": "Gastrointestinal symptoms can indicate specific infections or conditions.",
        "options": ["Yes", "No", "Not sure"],
    },
    {
        "id": "pain_symptoms",
        "text": "Do you have a severe headache, body aches, joint pain, or pain behind your eyes?",
        "hint": "These pains are hallmarks of certain viral and bacterial infections.",
        "options": ["Yes", "No", "Not sure"],
    },
    {
        "id": "skin_systemic_symptoms",
        "text": "Have you noticed any rashes, severe weakness, chills, or sudden sweating?",
        "hint": "Systemic symptoms can point to generalized infections or specific diseases.",
        "options": ["Yes", "No", "Not sure"],
    },
]

TOTAL_QUESTIONS = len(QUESTIONS)

# ---------------------------------------------------------------------------
# Scoring system & Disease Metadata
# ---------------------------------------------------------------------------
_BASE_SCORES: dict[str, float] = {}
_SCORE_MATRIX: dict[str, dict[str, dict[str, float]]] = {
    "fever_duration": {
        "less than 24 hours": {},
        "1–3 days": {},
        "more than 3 days": {},
        "no fever": {},
    },
    "respiratory_symptoms": {"yes": {}, "no": {}, "not sure": {}},
    "gi_symptoms": {"yes": {}, "no": {}, "not sure": {}},
    "pain_symptoms": {"yes": {}, "no": {}, "not sure": {}},
    "skin_systemic_symptoms": {"yes": {}, "no": {}, "not sure": {}},
}
_DISEASE_META: dict[str, dict[str, Any]] = {}

def _init_screening_data():
    global _BASE_SCORES, _DISEASE_META, _SCORE_MATRIX
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "healthknowledge")
    json_files = glob.glob(os.path.join(data_dir, "*.json"))
    
    # Mapping for keywords to our questions
    respiratory_kw = {"cough", "sore throat", "runny nose", "congestion", "sneezing", "breathing", "shortness of breath", "wheezing"}
    gi_kw = {"nausea", "vomiting", "diarrhea", "stomach", "abdominal pain", "cramps", "constipation"}
    pain_kw = {"headache", "body ache", "joint pain", "muscle", "eye pain"}
    skin_kw = {"rash", "itching", "redness", "weakness", "chills", "sweats", "fatigue"}
    
    for file_path in json_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    did = item.get("id")
                    if not did:
                        continue
                    
                    _BASE_SCORES[did] = 1.0
                    
                    # Create meta
                    _DISEASE_META[did] = {
                        "name": item.get("category", did.replace("_", " ").title()),
                        "icon": "🩺",
                        "urgency": item.get("urgency", "routine"),
                        "risk_label": "🟡 Moderate Risk" if item.get("urgency") != "low" else "🟢 Low Risk",
                        "actions": item.get("guidance", "Consult a doctor for further advice.").split(". ")[:3],
                        "warning_signs": item.get("precautions", []),
                    }
                    
                    # Update score matrix
                    symptoms_list = item.get("symptoms", [])
                    symptoms = " ".join(symptoms_list).lower() if isinstance(symptoms_list, list) else ""
                    
                    # Fever
                    if "fever" in symptoms:
                        _SCORE_MATRIX["fever_duration"]["less than 24 hours"][did] = 1.0
                        _SCORE_MATRIX["fever_duration"]["1–3 days"][did] = 2.0
                        _SCORE_MATRIX["fever_duration"]["more than 3 days"][did] = 3.0
                    else:
                        _SCORE_MATRIX["fever_duration"]["no fever"][did] = 1.0
                        
                    # Respiratory
                    if any(kw in symptoms for kw in respiratory_kw):
                        _SCORE_MATRIX["respiratory_symptoms"]["yes"][did] = 3.0
                        _SCORE_MATRIX["respiratory_symptoms"]["not sure"][did] = 1.0
                    else:
                        _SCORE_MATRIX["respiratory_symptoms"]["no"][did] = 0.5
                        
                    # GI
                    if any(kw in symptoms for kw in gi_kw):
                        _SCORE_MATRIX["gi_symptoms"]["yes"][did] = 3.0
                        _SCORE_MATRIX["gi_symptoms"]["not sure"][did] = 1.0
                    else:
                        _SCORE_MATRIX["gi_symptoms"]["no"][did] = 0.5
                        
                    # Pain
                    if any(kw in symptoms for kw in pain_kw):
                        _SCORE_MATRIX["pain_symptoms"]["yes"][did] = 3.0
                        _SCORE_MATRIX["pain_symptoms"]["not sure"][did] = 1.0
                    else:
                        _SCORE_MATRIX["pain_symptoms"]["no"][did] = 0.5
                        
                    # Skin / Systemic
                    if any(kw in symptoms for kw in skin_kw):
                        _SCORE_MATRIX["skin_systemic_symptoms"]["yes"][did] = 3.0
                        _SCORE_MATRIX["skin_systemic_symptoms"]["not sure"][did] = 1.0
                    else:
                        _SCORE_MATRIX["skin_systemic_symptoms"]["no"][did] = 0.5
                        
        except Exception as e:
            logger.error(f"Failed to load {file_path}: {e}")

_init_screening_data()

# ---------------------------------------------------------------------------
# In-memory session store
# ---------------------------------------------------------------------------
_SESSION_TTL = 1800.0

_sessions: dict[str, dict[str, Any]] = {}


def _cleanup() -> None:
    now = time.time()
    expired = [sid for sid, s in _sessions.items() if now - s["last_active"] > _SESSION_TTL]
    for sid in expired:
        del _sessions[sid]


def _compute_running_scores(answers: dict[str, str]) -> dict[str, float]:
    """Compute current disease scores from answers collected so far."""
    scores = dict(_BASE_SCORES)
    for q_id, answer in answers.items():
        answer_key = answer.lower()
        q_matrix = _SCORE_MATRIX.get(q_id, {})
        deltas = q_matrix.get(answer_key, {})
        for disease, delta in deltas.items():
            scores[disease] = scores.get(disease, 0.0) + delta
    return scores


def _rank_conditions(scores: dict[str, float]) -> list[dict[str, Any]]:
    """Return ranked list of conditions with normalised scores and labels."""
    max_score = max(scores.values()) if scores else 1.0
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    result = []
    for disease_id, raw_score in ranked:
        norm = raw_score / max_score
        meta = _DISEASE_META[disease_id]
        result.append({
            "id": disease_id,
            "name": meta["name"],
            "icon": meta["icon"],
            "score": round(norm, 3),
            "raw_score": round(raw_score, 2),
            "likelihood": _label_likelihood(norm),
        })
    return result


def _label_likelihood(norm_score: float) -> str:
    if norm_score >= 0.85:
        return "High Confidence"
    elif norm_score >= 0.60:
        return "Moderate Confidence"
    elif norm_score >= 0.35:
        return "Low Confidence"
    else:
        return "Unlikely"


def _confidence_label(ranked: list[dict]) -> str:
    """Overall screening confidence based on spread between top two."""
    if len(ranked) < 2:
        return "High"
    gap = ranked[0]["score"] - ranked[1]["score"]
    if gap >= 0.30:
        return "High"
    elif gap >= 0.15:
        return "Medium"
    else:
        return "Low"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def start_screening(session_id: str, reported_symptoms: list[str]) -> dict[str, Any]:
    _cleanup()
    _sessions[session_id] = {
        "reported_symptoms": reported_symptoms,
        "answers": {},
        "current_index": 0,
        "last_active": time.time(),
    }
    logger.info("[Screening] Started session %s — symptoms: %s", session_id, reported_symptoms)
    return _build_question_payload(session_id)


def submit_answer(session_id: str, question_id: str, answer: str) -> dict[str, Any]:
    _cleanup()
    if session_id not in _sessions:
        return {
            "screening_mode": False,
            "screening_complete": False,
            "error": "Session expired. Please describe your symptoms again to restart.",
            "response": "Your screening session has expired. Please describe your symptoms again to start a new assessment.",
            "risk_level": "routine",
            "retrieved_documents": [],
            "confidence": 0.0,
            "matched_rules": [],
            "disclaimer": "",
        }

    sess = _sessions[session_id]
    sess["answers"][question_id] = answer
    sess["current_index"] += 1
    sess["last_active"] = time.time()

    if sess["current_index"] >= TOTAL_QUESTIONS:
        result = calculate_result(session_id)
        _sessions.pop(session_id, None)
        return result

    return _build_question_payload(session_id)


def calculate_result(session_id: str) -> dict[str, Any]:
    sess = _sessions.get(session_id, {})
    answers: dict[str, str] = sess.get("answers", {})
    reported: list[str] = sess.get("reported_symptoms", [])

    scores = _compute_running_scores(answers)
    ranked = _rank_conditions(scores)
    top = ranked[0]
    top_meta = _DISEASE_META[top["id"]]

    # Build confirmed symptom list
    confirmed_symptoms = [s.title() for s in reported]
    
    if answers.get("fever_duration", "").lower() in ["less than 24 hours", "1–3 days", "more than 3 days"]:
        confirmed_symptoms.append("Fever")
    if answers.get("respiratory_symptoms", "").lower() == "yes":
        confirmed_symptoms.append("Cough / Sore throat / Breathing issues")
    if answers.get("gi_symptoms", "").lower() == "yes":
        confirmed_symptoms.append("Stomach pain / Nausea / Diarrhea")
    if answers.get("pain_symptoms", "").lower() == "yes":
        confirmed_symptoms.append("Severe Headache / Body aches")
    if answers.get("skin_systemic_symptoms", "").lower() == "yes":
        confirmed_symptoms.append("Rashes / Weakness / Chills")

    # Only show conditions that have meaningful likelihood
    possible_conditions = [c for c in ranked if c["score"] >= 0.45]
    if not possible_conditions:
        possible_conditions = ranked[:2]

    risk_level = "urgent" if top_meta["urgency"] == "urgent" else "routine"

    # ── Mock referral facilities ─────────────────────────────────────────
    # TODO: Replace with real data from Google Maps / OpenStreetMap /
    #       NHM (National Health Mission) facility registry API.
    referral_facilities = [
        {
            "name": "Primary Health Centre (PHC)",
            "type": "PHC",
            "icon": "🏥",
            "distance_km": 3.2,
            "address": "Nearest PHC — walk-in or consult",
            "phone": "104",
            "available": "Mon–Sat, 8 AM–2 PM",
        },
        {
            "name": "Community Health Centre (CHC)",
            "type": "CHC",
            "icon": "🏨",
            "distance_km": 7.5,
            "address": "Block-level CHC — 24×7 emergency",
            "phone": "108",
            "available": "24 × 7",
        },
        {
            "name": "District Hospital",
            "type": "DH",
            "icon": "🏛️",
            "distance_km": 12.0,
            "address": "District General Hospital",
            "phone": "108",
            "available": "24 × 7",
        },
    ]

    return {
        "screening_mode": False,
        "screening_complete": True,
        "risk_level": risk_level,
        "reported_symptoms": confirmed_symptoms,
        "possible_conditions": possible_conditions,
        "primary_condition": {
            "id": top["id"],
            "name": top_meta["name"],
            "icon": top_meta["icon"],
            "risk_label": top_meta["risk_label"],
            "actions": top_meta["actions"],
            "warning_signs": top_meta["warning_signs"],
        },
        "running_scores": ranked,
        "confidence_label": _confidence_label(ranked),
        "response": _build_summary_text(confirmed_symptoms, possible_conditions, top_meta, risk_level),
        "confidence": top["score"],
        "matched_rules": [top["id"]],
        "disclaimer": (
            "⚠️ This assessment is informational only and does NOT replace a qualified "
            "healthcare professional's diagnosis. Please seek medical care for testing and treatment."
        ),
        "retrieved_documents": [],
        "referral_facilities": referral_facilities,
    }


def get_session(session_id: str) -> dict[str, Any] | None:
    return _sessions.get(session_id)


def is_screening_active(session_id: str) -> bool:
    return session_id in _sessions


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_question_payload(session_id: str) -> dict[str, Any]:
    sess = _sessions[session_id]
    idx = sess["current_index"]
    q = QUESTIONS[idx]
    answers_so_far = sess["answers"]

    # Compute running scores to enable live narrowing on frontend
    running_scores = _rank_conditions(_compute_running_scores(answers_so_far))
    confidence = _confidence_label(running_scores)

    return {
        "screening_mode": True,
        "screening_complete": False,
        "question_index": idx,
        "total_questions": TOTAL_QUESTIONS,
        "question": {
            "id": q["id"],
            "text": q["text"],
            "hint": q.get("hint", ""),
            "options": q["options"],
        },
        "running_scores": running_scores,
        "confidence_label": confidence,
        # Standard fields
        "response": "",
        "risk_level": "routine",
        "retrieved_documents": [],
        "confidence": 1.0,
        "matched_rules": [],
        "disclaimer": "",
    }


def _build_summary_text(
    symptoms: list[str],
    conditions: list[dict],
    primary_meta: dict,
    risk_level: str,
) -> str:
    lines = ["🩺 Screening Summary", ""]
    lines.append("Based on your responses, here is your assessment:\n")

    lines.append("📋 Reported Symptoms:")
    for s in symptoms:
        lines.append(f"  ✓ {s}")

    lines.append("")
    lines.append("🔍 Most Likely Conditions:")
    for i, c in enumerate(conditions[:3], 1):
        lines.append(f"  {i}. {c['icon']} {c['name']} — {c['likelihood']}")

    risk_label = {
        "urgent": "🟡 Moderate–High Risk — See a doctor within 24 hours",
        "routine": "🟢 Low–Moderate Risk — Monitor at home",
        "emergency": "🔴 Emergency — Seek immediate care",
    }.get(risk_level, "🟡 Moderate Risk")

    lines.append("")
    lines.append(f"⚡ Risk Level: {risk_label}")

    lines.append("")
    lines.append("💊 Recommended Actions:")
    for action in primary_meta.get("actions", []):
        lines.append(f"  • {action}")

    lines.append("")
    lines.append("🚨 Seek urgent care if you experience:")
    for warning in primary_meta.get("warning_signs", []):
        lines.append(f"  • {warning}")

    return "\n".join(lines)
