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

# ---------------------------------------------------------------------------
# Screening questions
# ---------------------------------------------------------------------------

QUESTIONS: list[dict[str, Any]] = [
    {
        "id": "fever_duration",
        "text": "How long have you been experiencing this fever?",
        "hint": "Duration helps narrow down the most likely cause.",
        "options": ["Less than 24 hours", "1–3 days", "More than 3 days"],
    },
    {
        "id": "eye_pain",
        "text": "Do you have pain behind your eyes or an intense headache that worsens with eye movement?",
        "hint": "This is a distinctive sign of certain conditions.",
        "options": ["Yes", "No", "Not sure"],
    },
    {
        "id": "shaking_chills",
        "text": "Do you experience shaking chills or alternating episodes of sweating and high fever?",
        "hint": "Cyclical fever patterns are clinically significant.",
        "options": ["Yes", "No", "Not sure"],
    },
    {
        "id": "cold_symptoms",
        "text": "Do you have a sore throat, runny nose, or severe body and muscle aches?",
        "hint": "These are typical upper respiratory symptoms.",
        "options": ["Yes", "No", "Not sure"],
    },
    {
        "id": "gi_symptoms",
        "text": "Do you have stomach pain, constipation, or did your fever develop gradually over several days?",
        "hint": "Gastrointestinal symptoms can indicate specific infections.",
        "options": ["Yes", "No", "Not sure"],
    },
]

TOTAL_QUESTIONS = len(QUESTIONS)

# ---------------------------------------------------------------------------
# Scoring system
# ---------------------------------------------------------------------------
# Base scores — all conditions start equal
_BASE_SCORES: dict[str, float] = {
    "dengue":    1.0,
    "malaria":   1.0,
    "influenza": 1.0,
    "typhoid":   1.0,
}

# Per-question, per-answer, per-disease score deltas
# Structure: { question_id: { answer_text_lower: { disease: delta } } }
_SCORE_MATRIX: dict[str, dict[str, dict[str, float]]] = {
    "fever_duration": {
        "less than 24 hours": {
            "influenza": 2.0,   # flu often starts suddenly
            "dengue":    1.5,
            "malaria":   0.5,
            "typhoid":   0.0,   # typhoid is gradual
        },
        "1–3 days": {
            "dengue":    3.0,
            "influenza": 2.5,
            "malaria":   1.5,
            "typhoid":   0.5,
        },
        "more than 3 days": {
            "typhoid":   4.0,   # typhoid step-ladder fever
            "malaria":   3.0,   # malaria persists
            "dengue":    1.5,
            "influenza": 0.5,
        },
    },
    "eye_pain": {
        "yes": {
            "dengue":    4.0,   # hallmark of dengue — "breakbone"
            "influenza": 1.0,   # mild headache common
            "malaria":   0.5,
            "typhoid":   0.0,
        },
        "not sure": {
            "dengue":    1.5,
            "influenza": 0.5,
            "malaria":   0.0,
            "typhoid":   0.0,
        },
        "no": {},  # no delta
    },
    "shaking_chills": {
        "yes": {
            "malaria":   4.5,   # pathognomonic for malaria
            "influenza": 1.5,   # flu can cause chills
            "dengue":    0.5,
            "typhoid":   0.5,
        },
        "not sure": {
            "malaria":   2.0,
            "influenza": 0.5,
            "dengue":    0.0,
            "typhoid":   0.0,
        },
        "no": {},
    },
    "cold_symptoms": {
        "yes": {
            "influenza": 4.5,   # defining feature of flu
            "dengue":    0.5,   # slight body aches can occur
            "malaria":   0.0,
            "typhoid":   0.0,
        },
        "not sure": {
            "influenza": 2.0,
            "dengue":    0.5,
            "malaria":   0.0,
            "typhoid":   0.0,
        },
        "no": {},
    },
    "gi_symptoms": {
        "yes": {
            "typhoid":   4.5,   # hallmark of typhoid
            "malaria":   1.0,   # can cause GI symptoms
            "dengue":    0.5,
            "influenza": 0.0,
        },
        "not sure": {
            "typhoid":   2.0,
            "malaria":   0.5,
            "dengue":    0.0,
            "influenza": 0.0,
        },
        "no": {},
    },
}

# ---------------------------------------------------------------------------
# Disease metadata
# ---------------------------------------------------------------------------
_DISEASE_META: dict[str, dict[str, Any]] = {
    "dengue": {
        "name": "Dengue Fever",
        "icon": "🦟",
        "urgency": "urgent",
        "risk_label": "🟡 Moderate–High Risk",
        "actions": [
            "See a doctor today for a CBC blood test (platelet count)",
            "Use only paracetamol for fever — do NOT take aspirin or ibuprofen",
            "Rest completely and drink ORS or plenty of fluids",
        ],
        "warning_signs": [
            "Bleeding gums or nose",
            "Severe stomach pain or vomiting",
            "Blood in urine or stools",
            "Sudden drop in alertness or confusion",
        ],
    },
    "malaria": {
        "name": "Malaria",
        "icon": "🦠",
        "urgency": "urgent",
        "risk_label": "🟡 Moderate–High Risk",
        "actions": [
            "See a doctor immediately for a blood smear or Rapid Diagnostic Test (RDT)",
            "Do NOT self-treat — specific anti-malarial medication is required",
            "Sleep under a treated mosquito net tonight",
        ],
        "warning_signs": [
            "Severe confusion or disorientation",
            "Extreme weakness or inability to stand",
            "Seizures",
            "High fever above 40°C / 104°F",
        ],
    },
    "influenza": {
        "name": "Influenza (Flu)",
        "icon": "🤧",
        "urgency": "routine",
        "risk_label": "🟢 Low–Moderate Risk",
        "actions": [
            "Rest at home and isolate to prevent spreading",
            "Drink plenty of warm fluids and stay hydrated",
            "Paracetamol can help with fever and body aches",
        ],
        "warning_signs": [
            "Difficulty breathing or shortness of breath",
            "Chest pain or pressure",
            "Symptoms worsen significantly after Day 3",
            "Confusion or unusual behaviour",
        ],
    },
    "typhoid": {
        "name": "Typhoid Fever",
        "icon": "🌡️",
        "urgency": "urgent",
        "risk_label": "🟡 Moderate–High Risk",
        "actions": [
            "See a doctor for a Widal blood test or blood culture",
            "Only a doctor can prescribe the correct antibiotic — do not self-medicate",
            "Drink only boiled or sealed bottled water",
        ],
        "warning_signs": [
            "Intestinal bleeding or perforation (severe abdominal pain)",
            "Extreme confusion or delirium",
            "Do NOT stop antibiotics early — complete the full course",
            "Rash of rose-coloured spots on the torso",
        ],
    },
}

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
    if answers.get("eye_pain", "").lower() == "yes":
        confirmed_symptoms.append("Pain behind eyes")
    if answers.get("shaking_chills", "").lower() == "yes":
        confirmed_symptoms.append("Shaking chills / cyclical fever")
    if answers.get("cold_symptoms", "").lower() == "yes":
        confirmed_symptoms.append("Sore throat / body aches / runny nose")
    if answers.get("gi_symptoms", "").lower() == "yes":
        confirmed_symptoms.append("Stomach pain / constipation")

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
