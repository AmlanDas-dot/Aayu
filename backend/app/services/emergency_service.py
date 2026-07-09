"""
Emergency Classification Service.

Classifies user queries into risk levels and generates emergency summaries.
Builds on the existing RuleBasedTriageEngine but adds structured emergency output.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

_EMERGENCY_PATTERNS: list[tuple[str, str]] = [
    (r"\b(heart attack|chest pain|chest tightness|myocardial|seene mein dard|chhati me dard|seena dard|छाती में दर्द|सीने में दर्द|dil ka daura|दिल का दौरा)\b", "Possible Heart Attack"),
    (r"\b(stroke|sudden weakness|face drooping|arm weakness|speech|lakwa|लकवा|paralysis)\b", "Possible Stroke"),
    (r"\b(snake bite|snakebite|snake bit|saamp ne kata|सांप ने काटा|सांप)\b", "Snake Bite"),
    (r"\b(seizure|convulsion|fits|epilepsy|shaking uncontrolled|daura|दौरा|मिरगी)\b", "Seizure"),
    (r"\b(unconscious|unresponsive|not breathing|no pulse|collapsed|behosh|बेहोश)\b", "Unconscious Patient"),
    (r"\b(severe bleeding|bleeding won.t stop|heavy blood loss|khoon|खून|bleeding)\b", "Severe Bleeding"),
    (r"\b(anaphylaxis|severe allergic|throat closing|can.t breathe|saans lene mein|सांस लेने में)\b", "Anaphylaxis"),
    (r"\b(choking|can.t swallow|airway blocked|gala rukh|गला रुंध)\b", "Choking"),
    (r"\b(drowning|near drowning|doob|डूब)\b", "Drowning"),
    (r"\b(severe burn|burns over|chemical burn|jal gaya|जल गया|aag|आग)\b", "Severe Burn"),
    (r"\b(suicide|kill myself|end my life|want to die|suicide|आत्महत्या|मरना|marne)\b", "Mental Health Crisis"),
    (r"\b(labour|giving birth|baby coming|water broke|contractions|delivery|pain|डिलीवरी|प्रसव)\b", "Emergency Childbirth"),
]

_RISK_LEVELS = {
    "critical": ["Possible Heart Attack", "Possible Stroke", "Unconscious Patient",
                 "Anaphylaxis", "Choking", "Drowning", "Emergency Childbirth"],
    "high":     ["Snake Bite", "Seizure", "Severe Bleeding", "Severe Burn", "Mental Health Crisis"],
}


@dataclass
class EmergencyResult:
    is_emergency: bool
    risk_level: str              # "critical" | "high" | "medium" | "low"
    detected_conditions: list[str] = field(default_factory=list)
    call_108: bool = False
    summary: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "is_emergency": self.is_emergency,
            "risk_level": self.risk_level,
            "detected_conditions": self.detected_conditions,
            "call_108": self.call_108,
            "summary": self.summary,
            "timestamp": self.timestamp,
        }


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
        combined = text.lower()
        if symptoms:
            combined += " " + " ".join(symptoms).lower()

        detected: list[str] = []
        for pattern, condition_name in self._patterns:
            if pattern.search(combined):
                detected.append(condition_name)

        if not detected:
            return EmergencyResult(is_emergency=False, risk_level="low")

        # Determine overall risk level
        risk = "medium"
        for condition in detected:
            if condition in _RISK_LEVELS["critical"]:
                risk = "critical"
                break
            if condition in _RISK_LEVELS["high"]:
                risk = "high"

        call_108 = risk == "critical"

        # Build summary
        conditions_str = " and ".join(detected)
        summary = (
            f"⚠️ POSSIBLE EMERGENCY DETECTED\n\n"
            f"Condition(s): {conditions_str}\n"
            f"Risk Level: {risk.upper()}\n"
            f"Time: {datetime.now().strftime('%H:%M, %d %b %Y')}\n\n"
        )
        if call_108:
            summary += "🚨 CALL 108 IMMEDIATELY — This may be life-threatening."
        else:
            summary += "⚠️ Seek medical attention urgently. Consider calling 108."

        return EmergencyResult(
            is_emergency=True,
            risk_level=risk,
            detected_conditions=detected,
            call_108=call_108,
            summary=summary,
        )
