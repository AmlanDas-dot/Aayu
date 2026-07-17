"""
Emergency Classification Service — Phase 3.

New in Phase 3:
  - Symptom normalization (common phrases → canonical medical terms)
  - Three-tier severity: CRITICAL / URGENT / ROUTINE
  - EmergencyResult carries severity string for structured responses
  - Internal reasoning trace logged for debugging
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Step 1 — Symptom normalization
# Ordered longest-first so more specific phrases win over substrings.
# ---------------------------------------------------------------------------

_NORMALIZATIONS: list[tuple[re.Pattern, str]] = [
    # Breathing
    # Phase 6: Context-Aware Emergency Regex - ignore exertional breathlessness
    (re.compile(r"\b(can'?t breathe|cannot breathe|difficulty in breathing|trouble breathing|hard to breathe|breathless(?!\s+(when|after)\s+(climbing|walking|exercising|running))|no breath)\b", re.I), "difficulty breathing"),
    (re.compile(r"\b(not breathing|stopped breathing|no breathing)\b", re.I), "not breathing"),
    # Consciousness
    (re.compile(r"\b(passing out|passed out|fainted|fainting|collapsed|loss of consciousness|unconscious|not waking up|unresponsive)\b", re.I), "loss of consciousness"),
    # Chest
    (re.compile(r"\b(pain in (the |my )?chest|chest is (hurting|aching|tight)|heart is hurting|pressure in chest|crushing pain|crushing chest)\b", re.I), "chest pain"),
    # Speech / neuro
    (re.compile(r"\b(cannot speak|can'?t speak|can'?t talk|sudden (loss of )?speech|suddenly (cannot|can'?t) speak|slurred speech|words not coming out)\b", re.I), "sudden speech loss"),
    (re.compile(r"\b(face drooping|drooping face|one side of face|face falling|face numb)\b", re.I), "face drooping"),
    (re.compile(r"\b(sudden numbness|arm (is )?weak|one arm weak|one-sided weakness)\b", re.I), "arm weakness"),
    # Seizure
    (re.compile(r"\b(fits|convulsions?|shaking uncontrolled|jerking)\b", re.I), "seizure"),
    # Bleeding
    (re.compile(r"\b(throwing up blood|blood in vomit|vomiting blood|coughing blood|coughing up blood)\b", re.I), "hematemesis"),
    (re.compile(r"\b(blood in stool|black stool|tarry stool|bloody stool)\b", re.I), "melena"),
    (re.compile(r"\b(blood in urine|red urine|pink urine)\b", re.I), "hematuria"),
    (re.compile(r"\b(bleeding won'?t stop|heavy bleeding|severe bleeding|bleed(ing)? heavily|blood gushing|bleeding from ears|severe nose bleed|severe pregnancy bleeding)\b", re.I), "severe bleeding"),
    # Allergic
    (re.compile(r"\b(lips? (are |is )swelling|throat swelling|swollen throat|tongue swelling|face swelling after|swelling after medicine|allergic reaction)\b", re.I), "anaphylaxis"),
    # Burns
    (re.compile(r"\b(severe burn|major burn|large burn|chemical burn|electrical burn|deep burn)\b", re.I), "severe burn"),
    # Snake / animal
    (re.compile(r"\b(snake (bit|bite|attack)|bitten by (a )?snake|saamp)\b", re.I), "snake bite"),
    # Stroke shorthand
    (re.compile(r"\b(stroke|lakwa|paralysis|sudden (arm|leg|face) (numb|weak|droop))\b", re.I), "possible stroke"),
]


def normalize_symptoms(text: str) -> str:
    """
    Replace common emergency lay-phrases with canonical medical terms.
    Returns the normalized text (original text if nothing matched).
    """
    normalized = text
    for pattern, replacement in _NORMALIZATIONS:
        normalized = pattern.sub(replacement, normalized)
    # Remove consecutive duplicate words that can appear after substitution
    # e.g. "chest pain pain" → "chest pain"
    normalized = re.sub(r'\b(\w+)\s+\1\b', r'\1', normalized, flags=re.IGNORECASE)
    if normalized != text:
        logger.debug("[Emergency] Normalized: '%s' → '%s'", text[:60], normalized[:60])
    return normalized


# ---------------------------------------------------------------------------
# Emergency patterns (matched against the NORMALIZED text)
# ---------------------------------------------------------------------------

_EMERGENCY_PATTERNS: list[tuple[str, str]] = [
    (r"\b(heart attack|chest pain|chest tightness|myocardial|severe chest pain|seene mein dard|chhati me dard|seena dard|छाती में दर्द|सीने में दर्द|dil ka daura|दिल का दौरा)\b", "Possible Heart Attack"),
    (r"\b(possible stroke|stroke|stroke symptoms|sudden weakness|face drooping|arm weakness|sudden speech loss|lakwa|लकवा|paralysis)\b", "Possible Stroke"),
    (r"\b(snake bite|snakebite|snake bit|saamp ne kata|सांप ने काटा|सांप)\b", "Snake Bite"),
    (r"\b(seizure|seizures|epilepsy attack|fits|convulsion|daura|दौरा|मिरगी)\b", "Seizure"),
    (r"\b(loss of consciousness|unconscious|unresponsive|not breathing|severe breathing difficulty|no pulse|collapsed|behosh|बेहोश)\b", "Unconscious / Not Breathing"),
    (r"\b(hematemesis|severe bleeding|heavy blood loss|khoon|खून बह)\b", "Severe Bleeding"),
    (r"\b(anaphylaxis|severe allergic|throat swelling|swollen throat|can'?t breathe|difficulty breathing|saans lene mein|सांस लेने में)\b", "Anaphylaxis / Airway Emergency"),
    (r"\b(choking|can'?t swallow|airway blocked|gala rukh|गला रुंध)\b", "Choking"),
    (r"\b(drowning|near drowning|doob|डूब)\b", "Drowning"),
    (r"\b(severe burn|chemical burn|jal gaya|जल गया)\b", "Severe Burn"),
    (r"\b(severe trauma|major trauma|car accident|hit by a car|fall from a height|head injury|severe head injury)\b", "Severe Trauma"),
    (r"\b(suicide|kill myself|end my life|want to die|आत्महत्या|मरना chahu)\b", "Mental Health Crisis"),
    (r"\b(labour|giving birth|baby coming|water broke|contractions|delivery pain|डिलीवरी|प्रसव)\b", "Emergency Childbirth"),
    (r"\b(melena|blood in stool|black stool|tarry stool)\b", "GI Bleed"),
]

# ---------------------------------------------------------------------------
# Step 2 — Three-tier severity
# ---------------------------------------------------------------------------

# CRITICAL: life-threatening within minutes, call 108 immediately
_CRITICAL_CONDITIONS = {
    "Possible Heart Attack", "Possible Stroke", "Unconscious / Not Breathing",
    "Anaphylaxis / Airway Emergency", "Choking", "Drowning",
    "Emergency Childbirth", "Severe Bleeding", "GI Bleed",
    "Severe Trauma",
}

# URGENT: serious, needs care within hours
_URGENT_CONDITIONS = {
    "Snake Bite", "Seizure", "Severe Burn", "Mental Health Crisis",
}

# Anything else matched is MODERATE (still emergency, less immediately lethal)

def _get_severity(detected: list[str]) -> str:
    for c in detected:
        if c in _CRITICAL_CONDITIONS:
            return "CRITICAL"
    for c in detected:
        if c in _URGENT_CONDITIONS:
            return "URGENT"
    return "MODERATE"


# ---------------------------------------------------------------------------
# Emergency result
# ---------------------------------------------------------------------------

@dataclass
class EmergencyResult:
    is_emergency: bool
    risk_level: str              # "critical" | "high" | "medium" | "low"
    severity: str = "NONE"       # Phase 3: "CRITICAL" | "URGENT" | "MODERATE" | "NONE"
    detected_conditions: list[str] = field(default_factory=list)
    normalized_text: str = ""    # Phase 3: the normalized version of the input
    matched_patterns: list[str] = field(default_factory=list)   # Phase 3: pattern names
    call_108: bool = False
    summary: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "is_emergency": self.is_emergency,
            "risk_level": self.risk_level,
            "severity": self.severity,
            "detected_conditions": self.detected_conditions,
            "call_108": self.call_108,
            "summary": self.summary,
            "timestamp": self.timestamp,
        }


# ---------------------------------------------------------------------------
# Classifier
# ---------------------------------------------------------------------------

class EmergencyClassifier:
    _instance: "EmergencyClassifier | None" = None

    def __init__(self) -> None:
        self._patterns = [
            (re.compile(pat, re.IGNORECASE), name)
            for pat, name in _EMERGENCY_PATTERNS
        ]

    @classmethod
    def get_instance(cls) -> "EmergencyClassifier":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def classify(self, text: str, symptoms: list[str] | None = None) -> EmergencyResult:
        # --- Phase 3: normalize first ---
        normalized = normalize_symptoms(text)
        combined = normalized.lower()
        if symptoms:
            combined += " " + " ".join(symptoms).lower()

        detected: list[str] = []
        matched_patterns: list[str] = []
        for pattern, condition_name in self._patterns:
            if pattern.search(combined):
                detected.append(condition_name)
                matched_patterns.append(pattern.pattern[:50])

        if not detected:
            return EmergencyResult(
                is_emergency=False,
                risk_level="low",
                severity="NONE",
                normalized_text=normalized,
            )

        severity = _get_severity(detected)
        risk = "critical" if severity == "CRITICAL" else ("high" if severity == "URGENT" else "medium")
        call_108 = severity in ("CRITICAL", "URGENT")

        # --- Phase 6: structured internal log (added matched patterns for debug) ---
        logger.warning(
            "[Emergency] DETECTED | severity=%s | conditions=%s | normalized='%s' | patterns=%s",
            severity, detected, normalized[:80], matched_patterns
        )

        # Build response summary
        conditions_str = " and ".join(detected)
        summary = (
            f"⚠️ POSSIBLE MEDICAL EMERGENCY\n\n"
            f"Detected: {conditions_str}\n"
            f"Severity: {severity}\n"
            f"Time: {datetime.now().strftime('%H:%M, %d %b %Y')}\n\n"
        )
        if severity == "CRITICAL":
            summary += "🚨 CALL 108 IMMEDIATELY — This may be life-threatening."
        elif severity == "URGENT":
            summary += "⚠️ Seek medical attention urgently within the next hour. Call 108 if symptoms worsen."
        else:
            summary += "⚠️ This situation needs prompt medical attention. Please visit a nearby clinic or call 104."

        return EmergencyResult(
            is_emergency=True,
            risk_level=risk,
            severity=severity,
            detected_conditions=detected,
            normalized_text=normalized,
            matched_patterns=matched_patterns,
            call_108=call_108,
            summary=summary,
        )
