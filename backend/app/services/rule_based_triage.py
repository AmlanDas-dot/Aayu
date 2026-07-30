"""
Rule-Based Triage Engine — Sprint 2.

Keyword-based urgency classification.

Pipeline slot:
    (user text + search results) → [THIS SERVICE] → TriageLevel + matched rules

Design principles:
    - Deterministic — same input always produces same output
    - Explainable  — matched_rules shows exactly why a level was chosen
    - No LLM       — pure keyword matching, no probabilistic black box
    - Easy to extend — just add keywords to the RULES dict

Priority order: emergency > urgent > routine (first match wins on the
highest-priority tier that has any keyword match).

IMPORTANT: This is NOT a diagnostic service.
           It guides care-seeking behaviour only.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Rule tables
# ---------------------------------------------------------------------------

# Each tier is a dict of {rule_name: [keyword_patterns]}
# Patterns are matched case-insensitively against the query.
# Longer / more specific phrases before shorter ones to avoid false positives.

EMERGENCY_RULES: dict[str, list[str]] = {
    "not_breathing": [
        "not breathing", "stopped breathing", "no breathing",
        "cannot breathe", "can't breathe", "cant breathe",
        "difficulty breathing", "shortness of breath", "breathless",
    ],
    "unconscious": [
        "unconscious", "unresponsive", "passed out", "fainted",
        "collapse", "collapsed", "not waking up",
    ],
    "severe_bleeding": [
        "severe bleeding", "heavy bleeding", "bleeding heavily",
        "blood gushing", "uncontrolled bleeding", "major bleed",
    ],
    "snake_bite": [
        "snake bite", "snakebite", "snake attack", "bitten by snake",
        "snake venom", "venomous snake",
    ],
    "dog_bite": [
        "dog bite", "dog attacked", "bitten by dog", "dog attack",
        "animal bite",
    ],
    "poisoning": [
        "poisoning", "swallowed poison", "consumed poison",
        "pesticide ingestion", "chemical ingestion", "overdose",
        "accidental ingestion",
    ],
    "chest_pain": [
        "chest pain", "chest pressure", "chest tightness",
        "heart attack", "cardiac arrest", "heart pain",
        "crushing chest",
    ],
    "stroke_symptoms": [
        "stroke", "face drooping", "arm weakness", "slurred speech",
        "sudden numbness", "sudden confusion", "sudden vision loss",
        "sudden severe headache",
    ],
    "drowning": [
        "drowning", "drowned", "near drowning",
    ],
    "severe_burn": [
        "severe burn", "major burn", "large burn", "deep burn",
        "chemical burn", "electrical burn",
    ],
    "anaphylaxis": [
        "anaphylaxis", "severe allergic reaction", "throat swelling",
        "swelling throat", "can't swallow",
    ],
    "head_injury": [
        "head injury", "head trauma", "skull fracture",
        "concussion severe", "head bleeding",
    ],
    "seizure": [
        "seizure", "epilepsy attack", "fits", "convulsion",
    ],
    "pregnancy_emergency": [
        "labour pain", "labor pain", "water broke", "waters broke",
        "baby coming", "miscarriage bleeding", "heavy vaginal bleeding",
        "severe abdominal pain pregnant", "pregnant severe headache",
        "ectopic", "preeclampsia",
    ],
    "neonatal_emergency": [
        "baby not waking", "infant lethargic", "bulging fontanelle",
        "baby not feeding", "infant very weak", "baby blue",
    ],
    "medication_reaction": [
        "wrong medicine", "accidental overdose", "allergic to medicine",
        "severe reaction to drug", "took too much medicine", "took wrong pill",
    ],
}

URGENT_RULES: dict[str, list[str]] = {
    "persistent_fever": [
        "fever for", "high fever", "persistent fever", "fever since",
        "fever 3 days", "fever 4 days", "fever 5 days",
        "fever many days", "prolonged fever",
        "103 fever", "104 fever", "105 fever",
    ],
    "dehydration": [
        "dehydration", "severe dehydration", "sunken eyes",
        "not urinating", "no urination", "very thirsty",
        "dry mouth severe", "diarrhea and vomiting",
        "repeated vomiting", "vomiting continuously",
    ],
    "moderate_injury": [
        "broken bone", "fracture", "sprain severe", "deep cut",
        "deep wound", "wound not healing", "dislocated",
        "moderate injury", "swollen joint",
    ],
    "pregnancy_warning": [
        "pregnancy complication", "pregnant and bleeding",
        "pregnant high fever", "pregnant vomiting",
        "reduced fetal movement", "baby not moving",
        "preeclampsia", "swollen legs pregnancy",
    ],
    "child_sick": [
        "child not eating", "baby not eating", "infant fever",
        "newborn sick", "child unconscious", "child fits",
        "child breathing fast",
    ],
    "mental_health_urgent": [
        "suicidal", "suicide", "self harm", "self-harm",
        "wants to die", "want to die",
    ],
    "eye_emergency": [
        "eye injury", "chemical in eye", "sudden vision loss",
        "eye bleeding", "foreign body eye",
    ],
    "infection_signs": [
        "pus", "abscess", "wound infected", "red streaks",
        "spreading redness", "cellulitis",
    ],
    "hypertension_signs": [
        "very high blood pressure", "bp very high", "200 bp",
        "severe headache and bp", "nose bleeding and bp",
    ],
    "jaundice": [
        "jaundice", "yellow eyes", "yellow skin", "liver problem",
    ],
    "dengue": [
        "dengue", "dengue fever", "platelet low", "dengue symptoms",
    ],
    "malaria": [
        "malaria", "chills and fever", "shivering fever",
    ],
    "typhoid": [
        "typhoid", "prolonged stomach pain",
    ],
    "dog_rabies_concern": [
        "stray dog bite", "unvaccinated dog", "rabies concern",
    ],
}

ROUTINE_RULES: dict[str, list[str]] = {
    "nutrition": [
        "nutrition", "diet", "healthy food", "what to eat",
        "balanced diet", "vitamins", "minerals", "protein",
        "calories", "weight loss", "weight gain", "food advice",
        "healthy eating", "diet plan",
    ],
    "mild_fever": [
        "mild fever", "low grade fever", "slight fever",
        "temperature 99", "temperature 100",
        "fever 99", "fever 100",
    ],
    "lifestyle": [
        "exercise", "yoga", "sleep", "stress", "meditation",
        "lifestyle", "work life balance", "mental health tips",
        "relaxation", "anxiety mild",
    ],
    "common_cold": [
        "common cold", "runny nose", "blocked nose", "stuffy nose",
        "sneezing", "sore throat mild", "cough mild",
    ],
    "general_inquiry": [
        "how to prevent", "what is", "tell me about",
        "information about", "health tips",
    ],
    "vaccination": [
        "vaccine", "vaccination", "immunization",
        "when to vaccinate", "which vaccine",
    ],
    "pregnancy_general": [
        "pregnancy tips", "during pregnancy", "prenatal",
        "antenatal", "pregnancy diet",
    ],
}


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class RuleTriageResult:
    """Output from the rule-based triage engine."""

    risk_level: str                      # "emergency" | "urgent" | "routine"
    matched_rules: list[str] = field(default_factory=list)
    matched_keywords: list[str] = field(default_factory=list)
    confidence: float = 1.0              # Always 1.0 — deterministic engine

    def to_dict(self) -> dict[str, Any]:
        return {
            "risk_level": self.risk_level,
            "matched_rules": self.matched_rules,
            "matched_keywords": self.matched_keywords,
            "confidence": self.confidence,
        }


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class RuleBasedTriageEngine:
    """
    Keyword-based triage engine.

    Usage:
        engine = RuleBasedTriageEngine()
        result = engine.assess("Someone got bitten by a snake")
        # result.risk_level == "emergency"
        # result.matched_rules == ["snake_bite"]
    """

    def __init__(self) -> None:
        # Compile patterns once for efficiency
        self._emergency = self._compile(EMERGENCY_RULES)
        self._urgent    = self._compile(URGENT_RULES)
        self._routine   = self._compile(ROUTINE_RULES)

    @staticmethod
    def _compile(
        rules: dict[str, list[str]],
    ) -> dict[str, list[re.Pattern[str]]]:
        """Return {rule_name: [compiled_pattern, ...]}."""
        compiled: dict[str, list[re.Pattern[str]]] = {}
        for rule_name, keywords in rules.items():
            compiled[rule_name] = [
                re.compile(r"\b" + re.escape(kw) + r"\b", re.IGNORECASE)
                for kw in keywords
            ]
        return compiled

    def _match_tier(
        self,
        text: str,
        tier: dict[str, list[re.Pattern[str]]],
    ) -> tuple[list[str], list[str]]:
        """
        Find all rule names and keywords that match in *text*.

        Returns (matched_rule_names, matched_keyword_strings).
        """
        matched_rules: list[str] = []
        matched_keywords: list[str] = []
        for rule_name, patterns in tier.items():
            for pattern in patterns:
                if pattern.search(text):
                    matched_rules.append(rule_name)
                    matched_keywords.append(pattern.pattern.replace(r"\b", "").replace(r"\ ", " "))
                    break  # One match per rule is enough
        return matched_rules, matched_keywords

    def assess(self, query: str) -> RuleTriageResult:
        """
        Classify the urgency of *query*.

        Priority: emergency > urgent > routine.
        Falls back to "routine" if no keywords match.
        """
        if not query or not query.strip():
            return RuleTriageResult(risk_level="routine")

        text = query.strip()

        # --- Emergency tier ---
        em_rules, em_kw = self._match_tier(text, self._emergency)
        if em_rules:
            logger.info(
                "[Triage] EMERGENCY — rules=%s, keywords=%s", em_rules, em_kw
            )
            return RuleTriageResult(
                risk_level="emergency",
                matched_rules=em_rules,
                matched_keywords=em_kw,
            )

        # --- Urgent tier ---
        urg_rules, urg_kw = self._match_tier(text, self._urgent)
        if urg_rules:
            logger.info(
                "[Triage] URGENT — rules=%s, keywords=%s", urg_rules, urg_kw
            )
            return RuleTriageResult(
                risk_level="urgent",
                matched_rules=urg_rules,
                matched_keywords=urg_kw,
            )

        # --- Routine tier ---
        rout_rules, rout_kw = self._match_tier(text, self._routine)
        logger.info(
            "[Triage] ROUTINE — rules=%s, keywords=%s", rout_rules, rout_kw
        )
        return RuleTriageResult(
            risk_level="routine",
            matched_rules=rout_rules,
            matched_keywords=rout_kw,
        )


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_engine_instance: RuleBasedTriageEngine | None = None


def get_triage_engine() -> RuleBasedTriageEngine:
    """Return the shared triage engine singleton (zero-cost after first call)."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = RuleBasedTriageEngine()
    return _engine_instance
