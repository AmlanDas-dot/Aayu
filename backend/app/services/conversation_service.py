"""
Conversation helpers for the clinical chat flow.

Keeps the medical reasoning untouched while improving tone, memory, and
patient-facing phrasing around the existing screening engine.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from app.services.clinical_reasoning_service import normalize_symptom_concept
from app.services.emergency_service import EmergencyClassifier

GREETING = "greeting"
LISTENING = "listening"
REASONING = "reasoning"
EMERGENCY = "emergency"
CLARIFYING = "clarifying"
SUMMARIZING = "summarizing"
ADVICE = "advice"
CLOSING = "closing"

INTENT_YES = "yes"
INTENT_NO = "no"
INTENT_NOT_SURE = "not_sure"
INTENT_NEW_MEDICAL_COMPLAINT = "new_medical_complaint"
INTENT_NEW_EMERGENCY = "new_emergency"
INTENT_USER_QUESTION = "user_question"
INTENT_CLARIFICATION_REQUEST = "clarification_request"
INTENT_STOP_SCREENING = "stop_screening"
INTENT_RESTART_SCREENING = "restart_screening"
INTENT_CHANGE_PATIENT = "change_patient"
INTENT_GENERAL_CHAT = "general_chat"
INTENT_CONTROLLER_CONTINUE = "controller_continue"
INTENT_CONTROLLER_START_NEW = "controller_start_new"

CONVERSATION_STATES = {
    GREETING,
    LISTENING,
    REASONING,
    EMERGENCY,
    CLARIFYING,
    SUMMARIZING,
    ADVICE,
    CLOSING,
}

_SYSTEM_MEMBER_PATTERN = re.compile(
    r"^\[System:\s*The user is asking on behalf of their family member:\s*"
    r"(?P<name>[^,\]]+),\s*Age:\s*(?P<age>[^,\]]+),\s*Conditions:\s*"
    r"(?P<conditions>[^,\]]*?),\s*Allergies:\s*(?P<allergies>[^\]]*)\]\s*",
    re.IGNORECASE,
)

_NEGATION_PATTERN = re.compile(
    r"\b(no|not|never|don't|do not|didn't|did not|without|cannot|can't|"
    r"haven't|have not|hasn't|has not|isn't|is not|aren't|are not|denies|denied)\b",
    re.IGNORECASE,
)

_SYMPTOM_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("abdominal pain", re.compile(r"\b(stomach pain|stomach ache|abdominal pain|belly pain)\b", re.I)),
    ("polyphagia", re.compile(r"\b(always hungry|constantly hungry|more hungry than usual|unusually hungry)\b", re.I)),
    ("polydipsia", re.compile(r"\b(always thirsty|very thirsty|thirsty all the time|much thirstier than usual)\b", re.I)),
    ("polyuria", re.compile(r"\b(frequent urination|urinating frequently|urinating much more often|urinating more often|passing urine often|peeing a lot)\b", re.I)),
    ("weight loss", re.compile(r"\b(weight loss|unintentional weight loss|losing weight|lost weight|lost \d+\s*(kg|kgs|kilograms|lb|lbs|pounds)?)\b", re.I)),
    ("fatigue", re.compile(r"\b(fatigue|very tired|tired all the time|exhausted|weakness|feeling weak)\b", re.I)),
    ("fever", re.compile(r"\b(fever|high temperature|temperature)\b", re.I)),
    ("diarrhea", re.compile(r"\b(diarrhea|diarrhoea|loose stools|watery stools|dast)\b", re.I)),
    ("vomiting", re.compile(r"\b(vomiting|throwing up|vomit|ultee)\b", re.I)),
    ("nausea", re.compile(r"\b(nausea|feeling sick|queasy)\b", re.I)),
    ("headache", re.compile(r"\b(headache|head pain|severe headache)\b", re.I)),
    ("chest pain", re.compile(r"\b(chest pain|chest tightness|chest discomfort|pain in the chest)\b", re.I)),
    ("dyspnea", re.compile(r"\b(shortness of breath|difficulty breathing|breathless|breathlessness|trouble breathing)\b", re.I)),
    ("orthopnea", re.compile(r"\b(difficulty breathing when lying flat|breathless when lying flat|cannot breathe when lying down)\b", re.I)),
    ("melena", re.compile(r"\b(black stools|black stool|tarry stools|tarry stool)\b", re.I)),
    ("steatorrhea", re.compile(r"\b(oily stools|greasy stools|difficult to flush stools)\b", re.I)),
    ("hematuria", re.compile(r"\b(blood in urine|bloody urine|red urine|pink urine)\b", re.I)),
    ("memory loss", re.compile(r"\b(memory loss|forgetting names|forgetfulness|getting confused|memory problems)\b", re.I)),
    ("joint pain", re.compile(r"\b(joint pain|painful joints|knee pain|knee hurts|left knee hurts|right knee hurts|my knee hurts)\b", re.I)),
    ("joint stiffness", re.compile(r"\b(joint stiffness|stiff joints|joints feel stiff)\b", re.I)),
    ("back pain", re.compile(r"\b(back pain|my back hurts|lower back pain)\b", re.I)),
    ("persistent cough", re.compile(r"\b(persistent cough|cough for \d+|cough for many days|cough for weeks|long cough|chronic cough)\b", re.I)),
    ("cough", re.compile(r"\b(cough|khansi)\b", re.I)),
    ("anxiety", re.compile(r"\b(anxiety|anxious|panic|panicky|worried all the time)\b", re.I)),
    ("depressed mood", re.compile(r"\b(depressed|very sad|low mood|lost interest|do not want to do anything)\b", re.I)),
    ("leg swelling", re.compile(r"\b(swollen feet|swollen legs|ankle swelling|leg swelling|feet swelling)\b", re.I)),
    ("blurred vision", re.compile(r"\b(blurred vision|blurry vision)\b", re.I)),
    ("rash", re.compile(r"\b(rash|rashes)\b", re.I)),
    ("eye swelling", re.compile(r"\b(eye is swollen|swollen eye|eye swelling)\b", re.I)),
]

_DISPLAY_NAMES = {
    "polyphagia": "feeling unusually hungry",
    "polydipsia": "feeling unusually thirsty",
    "polyuria": "urinating much more often than usual",
    "weight loss": "unintentional weight loss",
    "fatigue": "unusual tiredness",
    "fever": "fever",
    "diarrhea": "loose or watery stools",
    "vomiting": "vomiting",
    "nausea": "nausea",
    "headache": "headache",
    "chest pain": "chest pain",
    "dyspnea": "shortness of breath",
    "orthopnea": "breathlessness when lying flat",
    "melena": "black or tar-like stools",
    "steatorrhea": "oily stools",
    "hematuria": "blood in the urine",
    "memory loss": "memory problems",
    "joint pain": "joint pain",
    "joint stiffness": "joint stiffness",
    "back pain": "back pain",
    "persistent cough": "a cough lasting for many days or weeks",
    "cough": "cough",
    "anxiety": "anxiety",
    "depressed mood": "low mood",
    "leg swelling": "swelling in the legs or feet",
    "blurred vision": "blurred vision",
    "abdominal pain": "stomach or abdominal pain",
    "rash": "rash",
    "eye swelling": "swelling around the eye",
}

_CONCEPT_EXPLANATIONS = {
    "nausea": "Nausea means feeling sick to your stomach or feeling like you may vomit.",
    "vomiting": "Vomiting means bringing food or fluid back up from the stomach.",
    "diarrhea": "Diarrhea means loose or watery stools more often than usual.",
    "fever": "Fever means feeling unusually hot or having a raised body temperature.",
    "polyphagia": "This means feeling much hungrier than usual.",
    "polydipsia": "This means feeling much thirstier than usual.",
    "polyuria": "This means passing urine much more often than usual.",
    "weight loss": "This means losing weight without trying to.",
    "dyspnea": "This means feeling short of breath or having trouble breathing.",
    "orthopnea": "This means finding it hard to breathe when lying flat.",
    "melena": "This means stools that look black or tar-like.",
    "steatorrhea": "This means oily or greasy stools that may be hard to flush.",
    "hematuria": "This means blood in the urine.",
    "memory loss": "This means forgetting recent events, names, or familiar things more than usual.",
    "joint stiffness": "This means the joints feel tight or hard to move, especially after rest.",
    "persistent cough": "This means a cough that keeps going for many days or weeks.",
    "leg swelling": "This means swelling in the feet, ankles, or legs.",
}

_YES_PATTERN = re.compile(
    r"^\s*(yes|yeah|yep|correct|exactly|definitely|sure|okay|ok|alright|affirmative)\s*[.!]?\s*$",
    re.IGNORECASE,
)
_NO_PATTERN = re.compile(
    r"^\s*(no|nope|nah|not really|never)\s*[.!]?\s*$",
    re.IGNORECASE,
)
_NOT_SURE_PATTERN = re.compile(
    r"^\s*(not sure|i don'?t know|dont know|do not know|maybe|perhaps|hard to tell|unknown|sometimes|occasionally|rarely)\s*[.!]?\s*$",
    re.IGNORECASE,
)
_STOP_PATTERN = re.compile(
    r"\b(stop|cancel|quit|end screening|end the session|never mind|leave it|leave it now)\b",
    re.IGNORECASE,
)
_RESTART_PATTERN = re.compile(
    r"\b(start over|restart|begin again|let'?s begin again|forget previous answers|discard the session|start again)\b",
    re.IGNORECASE,
)
_CHANGE_PATIENT_PATTERN = re.compile(
    r"\b(actually this is about|this is actually about|this is about my|now i want to ask about|for my daughter|for my son|for my father|for my mother|for my wife|for my husband|for my child|for my baby)\b",
    re.IGNORECASE,
)
_GREETING_PATTERN = re.compile(
    r"^\s*(hello|hi|good morning|good evening|thanks|thank you|okay thanks|ok thanks|bye)\s*[.!]?\s*$",
    re.IGNORECASE,
)
_CLARIFICATION_PATTERN = re.compile(
    r"\b(what does that mean|what do you mean|i don'?t understand|can you explain|what does nausea mean|what does vomiting mean|what does diarrhea mean|what does fever mean|what is nausea|what is vomiting|what is diarrhea|what is fever|what is that)\b",
    re.IGNORECASE,
)
_WHY_PATTERN = re.compile(
    r"\b(why|why are you asking|what is the reason for this question)\b",
    re.IGNORECASE,
)
_QUESTION_PATTERN = re.compile(r"\?\s*$|^\s*(can|could|does|do|is|are|will|what|why|how|when)\b", re.IGNORECASE)
_CONTINUE_PATTERN = re.compile(
    r"\b(continue|keep going|current assessment|same assessment|continue current)\b",
    re.IGNORECASE,
)
_START_NEW_PATTERN = re.compile(
    r"\b(start new|new assessment|for the new symptom|new symptom|restart with this|start over with this)\b",
    re.IGNORECASE,
)


@dataclass
class ScreeningIntentResult:
    intent: str
    reason: str
    normalized_answer: str | None = None
    reported_findings: list[str] | None = None
    denied_findings: list[str] | None = None
    updated_patient_context: dict[str, Any] | None = None


def _parse_csv_list(raw: str) -> list[str]:
    parts = [part.strip() for part in raw.split(",")]
    return [part for part in parts if part and part.lower() not in {"none", "nil", "na", "n/a"}]


def extract_patient_context_from_message(
    message: str,
    existing_context: dict[str, Any] | None = None,
) -> tuple[str, dict[str, Any]]:
    """Pull hidden frontend patient context out of the message prefix if present."""
    context = dict(existing_context or {})
    clean_message = message.strip()

    match = _SYSTEM_MEMBER_PATTERN.match(clean_message)
    if match:
        clean_message = clean_message[match.end():].strip()
        context.setdefault("member_name", match.group("name").strip())
        try:
            context.setdefault("age", int(match.group("age").strip()))
        except (TypeError, ValueError):
            pass
        if not context.get("conditions"):
            context["conditions"] = _parse_csv_list(match.group("conditions"))
        if not context.get("allergies"):
            context["allergies"] = _parse_csv_list(match.group("allergies"))

    lowered = clean_message.lower()
    if any(word in lowered for word in ["my child", "my baby", "my son", "my daughter"]):
        context.setdefault("relationship", "child")
    elif "my mother" in lowered or "my father" in lowered or "my grandmother" in lowered or "my grandfather" in lowered:
        context.setdefault("relationship", "elder_family_member")

    if "pregnan" in lowered or "28 weeks" in lowered or "trimester" in lowered:
        context.setdefault("pregnancy_related", True)

    return clean_message, context


def extract_clinical_findings(text: str) -> tuple[list[str], list[str]]:
    """
    Extract simple positive and negative symptom concepts from the user's text.

    This is intentionally lightweight. It improves concept memory and negation
    handling without changing the downstream ranking logic.
    """
    reported: list[str] = []
    denied: list[str] = []
    seen_reported: set[str] = set()
    seen_denied: set[str] = set()

    clauses = re.split(r"[.;,\n]|\bbut\b|\bhowever\b|\bexcept\b", text.lower())
    for clause in clauses:
        clause = clause.strip()
        if not clause:
            continue
        is_negative = bool(_NEGATION_PATTERN.search(clause))
        for concept, pattern in _SYMPTOM_PATTERNS:
            if not pattern.search(clause):
                continue
            canonical = normalize_symptom_concept(concept)
            if is_negative:
                if canonical not in seen_denied:
                    denied.append(canonical)
                    seen_denied.add(canonical)
                continue
            if canonical not in seen_reported:
                reported.append(canonical)
                seen_reported.add(canonical)

    denied = [concept for concept in denied if concept not in seen_reported]
    return reported, denied


def describe_symptom(concept: str) -> str:
    return _DISPLAY_NAMES.get(normalize_symptom_concept(concept), concept.replace("_", " "))


def explain_symptom_concept(concept: str) -> str:
    normalized = normalize_symptom_concept(concept)
    if normalized in _CONCEPT_EXPLANATIONS:
        return _CONCEPT_EXPLANATIONS[normalized]
    return f"It means {describe_symptom(normalized)}."


def personalize_subject(patient_context: dict[str, Any] | None = None) -> str:
    ctx = patient_context or {}
    if ctx.get("relationship") == "child":
        return "your child"
    member_name = str(ctx.get("member_name", "")).strip()
    if member_name:
        return member_name
    return "you"


def build_screening_intro(patient_context: dict[str, Any] | None = None) -> str:
    ctx = patient_context or {}
    subject = personalize_subject(ctx)

    if ctx.get("relationship") == "child":
        return (
            "I am sorry your child is unwell.\n"
            "I would like to ask a few short questions so I can judge how serious this may be."
        )
    if ctx.get("pregnancy_related"):
        return (
            "I understand.\n"
            "Because this may be pregnancy-related, I would like to ask a few short questions first."
        )
    if subject != "you":
        return (
            f"I understand. I will keep {subject}'s assessment focused and simple.\n"
            "I would like to ask a few short questions to narrow this down."
        )
    return (
        "I understand.\n"
        "I would like to ask a few short questions to narrow this down."
    )


def build_question_turn_intro(
    patient_context: dict[str, Any] | None = None,
    question_number: int = 1,
) -> str:
    if question_number <= 1:
        return build_screening_intro(patient_context)
    return (
        "Thank you. That helps.\n"
        "I have another short question."
    )


def build_active_screening_reminder() -> str:
    return (
        "I am still working through the current assessment.\n"
        "Please choose the option that fits best below."
    )


def build_new_complaint_choice_message() -> str:
    return (
        "I noticed that you mentioned a different health concern.\n"
        "Would you like to continue the current assessment, or start a new assessment for the new symptom?"
    )


def build_stop_screening_message() -> str:
    return (
        "That is okay.\n"
        "I have ended the current assessment. You can describe a symptom again whenever you want to restart."
    )


def build_general_chat_during_screening_message() -> str:
    return (
        "You are welcome.\n"
        "Whenever you are ready, please answer the current question so I can continue the assessment."
    )


def build_restart_screening_message() -> str:
    return (
        "Understood.\n"
        "I will start the assessment again from the beginning."
    )


def build_patient_switch_message(patient_context: dict[str, Any] | None = None) -> str:
    subject = personalize_subject(patient_context)
    if subject == "you":
        return "Understood. I will start a fresh assessment for you."
    return f"Understood. I will start a fresh assessment for {subject}."


def build_question_reason_response(question_hint: str) -> str:
    return (
        f"{question_hint}\n"
        "Please answer the current question when you are ready."
    )


def build_question_clarification_response(current_question: dict[str, Any] | None, message: str) -> str:
    question = current_question or {}
    question_id = str(question.get("id", "")).strip()
    question_text = str(question.get("text", "")).strip()
    mentioned_reported, _ = extract_clinical_findings(message)
    if mentioned_reported:
        explanation = explain_symptom_concept(mentioned_reported[0])
        return (
            f"{explanation}\n"
            "Please answer the current question when you are ready."
        )
    if question_id:
        explanation = explain_symptom_concept(question_id)
        return (
            f"{explanation}\n"
            f"The question means: {question_text}\n"
            "Please choose the option that fits best."
        )
    return (
        "I can explain the question in simpler words.\n"
        "Please choose the option that fits best."
    )


def build_user_question_response(message: str, current_question: dict[str, Any] | None) -> str:
    lowered = message.lower().strip()
    if "diabetes" in lowered:
        return (
            "In some situations it can, but I would like to finish these short questions first so I can judge whether it fits your symptoms.\n"
            "Please answer the current question when you are ready."
        )
    if "why" in lowered:
        hint = str((current_question or {}).get("hint", "")).strip()
        if hint:
            return build_question_reason_response(hint)
    return (
        "That is a reasonable question.\n"
        "I would like to finish this short assessment first so I can answer more safely in context.\n"
        "Please answer the current question when you are ready."
    )


def build_summary_opening() -> str:
    return "Thank you. I have enough information now."


def build_closing_line(risk_level: str) -> str:
    if risk_level == "urgent":
        return "Please seek medical care soon, even if the symptoms stay the same."
    if risk_level == "emergency":
        return "Please seek immediate medical care or call 108 now."
    return "Please seek medical care sooner if the symptoms worsen or new symptoms appear."


def classify_active_screening_message(
    message: str,
    session: dict[str, Any],
    current_question: dict[str, Any] | None = None,
) -> ScreeningIntentResult:
    text = message.strip()
    lowered = text.lower()
    controller_prompt = session.get("controller_prompt") or {}

    if controller_prompt.get("type") == "new_complaint_choice":
        if _CONTINUE_PATTERN.search(lowered):
            return ScreeningIntentResult(INTENT_CONTROLLER_CONTINUE, "matched controller continue choice")
        if _START_NEW_PATTERN.search(lowered):
            return ScreeningIntentResult(INTENT_CONTROLLER_START_NEW, "matched controller start-new choice")
        if _YES_PATTERN.match(text):
            return ScreeningIntentResult(INTENT_CONTROLLER_START_NEW, "interpreted yes as start new for controller choice")
        if _NO_PATTERN.match(text):
            return ScreeningIntentResult(INTENT_CONTROLLER_CONTINUE, "interpreted no as continue current for controller choice")

    if _STOP_PATTERN.search(lowered):
        return ScreeningIntentResult(INTENT_STOP_SCREENING, "matched stop-screening phrase")

    if _RESTART_PATTERN.search(lowered):
        return ScreeningIntentResult(INTENT_RESTART_SCREENING, "matched restart-screening phrase")

    if _CHANGE_PATIENT_PATTERN.search(lowered):
        clean_message, updated_context = extract_patient_context_from_message(text, {})
        return ScreeningIntentResult(
            INTENT_CHANGE_PATIENT,
            "matched patient-switch phrase",
            updated_patient_context=updated_context,
        )

    emergency_result = EmergencyClassifier.get_instance().classify(text)
    if emergency_result.is_emergency:
        return ScreeningIntentResult(INTENT_NEW_EMERGENCY, "emergency classifier triggered")

    reported_findings, denied_findings = extract_clinical_findings(text)

    if _YES_PATTERN.match(text):
        return ScreeningIntentResult(INTENT_YES, "matched yes answer", normalized_answer="Yes")

    if _NO_PATTERN.match(text):
        return ScreeningIntentResult(INTENT_NO, "matched no answer", normalized_answer="No")

    if _NOT_SURE_PATTERN.match(text):
        return ScreeningIntentResult(INTENT_NOT_SURE, "matched not-sure answer", normalized_answer="Not sure")

    if _CLARIFICATION_PATTERN.search(lowered):
        return ScreeningIntentResult(INTENT_CLARIFICATION_REQUEST, "matched clarification phrase")

    if _WHY_PATTERN.search(lowered):
        return ScreeningIntentResult(INTENT_USER_QUESTION, "matched why-question phrase")

    if _GREETING_PATTERN.match(text):
        return ScreeningIntentResult(INTENT_GENERAL_CHAT, "matched general-chat phrase")

    known_concepts = {
        normalize_symptom_concept(symptom)
        for symptom in session.get("reported_symptoms", []) + session.get("denied_symptoms", []) + list(session.get("answers", {}).keys())
    }
    new_concepts = [concept for concept in reported_findings if concept not in known_concepts]

    if new_concepts:
        return ScreeningIntentResult(
            INTENT_NEW_MEDICAL_COMPLAINT,
            "detected new symptom concept during active screening",
            reported_findings=reported_findings,
            denied_findings=denied_findings,
        )

    if reported_findings and not _QUESTION_PATTERN.search(text):
        return ScreeningIntentResult(
            INTENT_NEW_MEDICAL_COMPLAINT,
            "detected symptom-bearing free text instead of a direct answer",
            reported_findings=reported_findings,
            denied_findings=denied_findings,
        )

    if _QUESTION_PATTERN.search(text):
        return ScreeningIntentResult(INTENT_USER_QUESTION, "matched question-like message")

    return ScreeningIntentResult(INTENT_GENERAL_CHAT, "fell back to non-answer active-screening message")
