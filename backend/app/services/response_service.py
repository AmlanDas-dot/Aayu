"""
Response Service — Sprint 2 Template-Based Implementation.

Generates structured, patient-facing health guidance from:
    - Triage result (risk level + matched rules)
    - Retrieved knowledge-base documents

NO diagnosis.
NO prescription medications.
NO treatment recommendations beyond basic first aid guidance.

Format contract (consumed by frontend):
    {
        "risk_level": "routine|urgent|emergency",
        "response": "<formatted text>",
        "retrieved_documents": [...],
        "confidence": 1.0,
        "disclaimer": "..."
    }
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# Standard disclaimer — must appear on all medical guidance responses
MEDICAL_DISCLAIMER = (
    "⚠️ Disclaimer: AAYU provides general health information and guidance only. "
    "It does not diagnose medical conditions or replace professional medical advice. "
    "Always consult a qualified healthcare professional for diagnosis and treatment."
)


# ---------------------------------------------------------------------------
# Per-risk-level action templates
# ---------------------------------------------------------------------------

_EMERGENCY_ACTIONS: dict[str, str] = {
    "snake_bite": (
        "🐍 Snake Bite — Emergency Action:\n"
        "• Call emergency services (108) immediately.\n"
        "• Keep the person calm and still — movement spreads venom faster.\n"
        "• Immobilise the bitten limb below heart level.\n"
        "• Remove rings, watches, tight clothing near the bite.\n"
        "• Do NOT cut, suck, or apply a tourniquet.\n"
        "• Do NOT apply ice.\n"
        "• Bring the patient to the nearest hospital with anti-venom."
    ),
    "dog_bite": (
        "🐕 Dog Bite — Emergency Action:\n"
        "• Wash the wound immediately with soap and water for 15 minutes.\n"
        "• Go to the nearest hospital or PHC immediately.\n"
        "• Anti-rabies vaccination must be started within 24 hours.\n"
        "• Do NOT delay — rabies is fatal once symptoms appear.\n"
        "• If the animal is available, do not kill it — it will be observed."
    ),
    "not_breathing": (
        "🚨 Not Breathing — Emergency Action:\n"
        "• Call 108 immediately.\n"
        "• Begin CPR if trained: 30 chest compressions then 2 rescue breaths.\n"
        "• Do NOT leave the person alone.\n"
        "• Continue CPR until help arrives or the person responds."
    ),
    "chest_pain": (
        "❤️ Chest Pain — Emergency Action:\n"
        "• Call 108 immediately.\n"
        "• Have the person sit or lie down in a comfortable position.\n"
        "• Loosen tight clothing.\n"
        "• Do NOT give the person food or water.\n"
        "• Stay with the person until ambulance arrives."
    ),
    "stroke_symptoms": (
        "🧠 Possible Stroke — Emergency Action (FAST test):\n"
        "• Face — Is one side drooping?\n"
        "• Arms — Can they raise both arms?\n"
        "• Speech — Is speech slurred or strange?\n"
        "• Time — Call 108 immediately if any symptom present.\n"
        "• Every minute matters. Do NOT wait."
    ),
    "seizure": (
        "⚡ Seizure — Emergency Action:\n"
        "• Keep the person safe — clear space, place on side.\n"
        "• Do NOT hold down, put anything in the mouth, or give water.\n"
        "• Time the seizure. If >5 minutes, call 108.\n"
        "• Stay until fully conscious."
    ),
    "poisoning": (
        "☠️ Poisoning — Emergency Action:\n"
        "• Call 108 immediately.\n"
        "• Do NOT induce vomiting unless told by a doctor.\n"
        "• Note what was consumed, how much, and when.\n"
        "• Bring the container/label to the hospital."
    ),
    "drowning": (
        "💧 Drowning — Emergency Action:\n"
        "• Remove from water safely (do not risk yourself).\n"
        "• Call 108 immediately.\n"
        "• Begin CPR if trained and person is unresponsive.\n"
        "• Keep warm — risk of hypothermia."
    ),
    "unconscious": (
        "😶 Unconscious Person — Emergency Action:\n"
        "• Call 108 immediately.\n"
        "• Check for breathing — tilt head, lift chin.\n"
        "• If breathing, place in recovery position (on side).\n"
        "• If not breathing, begin CPR if trained.\n"
        "• Do NOT give anything by mouth."
    ),
    "severe_bleeding": (
        "🩸 Severe Bleeding — Emergency Action:\n"
        "• Apply firm, direct pressure with a clean cloth.\n"
        "• Do NOT remove the cloth — add more on top if soaked.\n"
        "• Call 108 immediately.\n"
        "• Elevate the injured part above heart level if possible.\n"
        "• Keep the person warm and calm."
    ),
    "anaphylaxis": (
        "⚠️ Severe Allergic Reaction — Emergency Action:\n"
        "• Call 108 immediately.\n"
        "• If person has an adrenaline auto-injector (EpiPen), use it now.\n"
        "• Have person sit up or lie with legs raised.\n"
        "• Do NOT give anything by mouth if swallowing is difficult."
    ),
}

_URGENT_ACTIONS: dict[str, str] = {
    "persistent_fever": (
        "🌡️ Persistent Fever Guidance:\n"
        "• See a doctor within 24 hours.\n"
        "• Give paracetamol to reduce fever (follow dosage on pack).\n"
        "• Ensure adequate hydration — water, ORS, coconut water.\n"
        "• Use a damp cloth on forehead for comfort.\n"
        "• Watch for rash, vomiting, or difficulty breathing."
    ),
    "dehydration": (
        "💧 Dehydration Guidance:\n"
        "• Give ORS (Oral Rehydration Solution) immediately.\n"
        "• Small sips every 5–10 minutes if nauseated.\n"
        "• See a doctor if not improving within 2–3 hours.\n"
        "• Watch for sunken eyes, dry mouth, very dark urine."
    ),
    "dengue": (
        "🦟 Possible Dengue Guidance:\n"
        "• See a doctor today for a blood test (platelet count).\n"
        "• Rest and maintain hydration with ORS/fluids.\n"
        "• Do NOT take aspirin or ibuprofen — use only paracetamol.\n"
        "• Watch for warning signs: bleeding gums, stomach pain, vomiting blood."
    ),
    "malaria": (
        "🦟 Possible Malaria Guidance:\n"
        "• See a doctor immediately for a blood test.\n"
        "• Do not self-treat — malaria needs specific anti-malarial medication.\n"
        "• Rest and maintain hydration.\n"
        "• Use mosquito nets and repellent."
    ),
    "dog_rabies_concern": (
        "🐕 Dog Bite / Rabies Risk Guidance:\n"
        "• Visit a doctor or PHC within 24 hours for anti-rabies vaccination.\n"
        "• Clean the wound thoroughly with soap and water.\n"
        "• Report the animal to local health authorities."
    ),
    "mental_health_urgent": (
        "💙 Mental Health Crisis Guidance:\n"
        "• Speak to someone you trust immediately.\n"
        "• Call iCall helpline: 9152987821\n"
        "• Call Vandrevala Foundation: 1860-2662-345 (24/7)\n"
        "• Do NOT leave the person alone.\n"
        "• Go to the nearest hospital if there is immediate risk."
    ),
}

_DEFAULT_ROUTINE_GUIDANCE = [
    "Monitor your symptoms over the next 24–48 hours.",
    "Maintain adequate hydration — drink 8–10 glasses of water per day.",
    "Rest sufficiently — 7–8 hours of sleep per night.",
    "Eat a balanced diet with fruits, vegetables, and whole grains.",
    "Visit your nearest Primary Health Centre (PHC) if symptoms worsen.",
]

_ROUTINE_GUIDANCE: dict[str, list[str]] = {
    "nutrition": [
        "Include all food groups: grains, proteins, dairy, fruits, and vegetables.",
        "Limit processed foods, excess salt, and sugar.",
        "Stay hydrated — at least 8 glasses of water daily.",
        "Consider government schemes like PMJAY for nutrition support.",
        "Consult an ASHA worker or ANM for free nutrition counselling.",
    ],
    "mild_fever": [
        "Rest and maintain hydration with water, coconut water, or ORS.",
        "Paracetamol can help reduce fever (follow package dosage).",
        "Monitor for temperature rising above 101°F / 38.3°C.",
        "See a doctor if fever persists beyond 3 days.",
        "Do not self-prescribe antibiotics.",
    ],
    "common_cold": [
        "Rest and stay warm.",
        "Drink warm fluids — ginger tea, warm water with honey.",
        "Steam inhalation can relieve congestion.",
        "Most colds resolve in 7–10 days without treatment.",
        "See a doctor if you have high fever, earache, or symptoms worsening.",
    ],
    "lifestyle": [
        "Aim for 30 minutes of moderate exercise daily.",
        "Practice deep breathing or yoga for stress reduction.",
        "Maintain consistent sleep and wake times.",
        "Reduce screen time before bed.",
        "Consult a wellness centre for personalised lifestyle guidance.",
    ],
    "vaccination": [
        "Consult your nearest PHC for the immunisation schedule.",
        "Government provides free vaccines under the Universal Immunisation Programme.",
        "Keep a vaccination record card for all family members.",
        "ASHA workers can assist with vaccination appointments.",
    ],
}


# ---------------------------------------------------------------------------
# HealthResponse model
# ---------------------------------------------------------------------------

class HealthResponse:
    """Structured response returned to the frontend."""

    def __init__(
        self,
        risk_level: str,
        response: str,
        retrieved_documents: list[dict[str, Any]],
        confidence: float = 1.0,
        matched_rules: list[str] | None = None,
        disclaimer: str = MEDICAL_DISCLAIMER,
    ) -> None:
        self.risk_level = risk_level
        self.response = response
        self.retrieved_documents = retrieved_documents
        self.confidence = confidence
        self.matched_rules = matched_rules or []
        self.disclaimer = disclaimer

    def to_dict(self) -> dict[str, Any]:
        return {
            "risk_level": self.risk_level,
            "response": self.response,
            "retrieved_documents": self.retrieved_documents,
            "confidence": self.confidence,
            "matched_rules": self.matched_rules,
            "disclaimer": self.disclaimer,
        }


# ---------------------------------------------------------------------------
# Template-based response builder
# ---------------------------------------------------------------------------

class TemplateResponseService:
    """
    Builds structured health guidance from triage results and search context.

    No LLM required.
    """

    def format_response(
        self,
        query: str,
        triage: dict[str, Any],
        context_chunks: list[dict[str, Any]],
    ) -> HealthResponse:
        risk_level   = triage.get("risk_level", "routine")
        matched_rules = triage.get("matched_rules", [])

        response_text = self._build_response_text(
            query=query,
            risk_level=risk_level,
            matched_rules=matched_rules,
            context_chunks=context_chunks,
        )

        # Format retrieved docs for frontend display
        retrieved_docs = [
            {
                "title":      chunk.get("title", "Reference"),
                "content":    chunk.get("content", "")[:300],
                "score":      round(chunk.get("score", 0.0), 3),
                "collection": chunk.get("collection", "knowledge_base"),
                "category":   chunk.get("category", ""),
                "source":     chunk.get("source", ""),
            }
            for chunk in context_chunks[:5]
        ]

        return HealthResponse(
            risk_level=risk_level,
            response=response_text,
            retrieved_documents=retrieved_docs,
            confidence=triage.get("confidence", 1.0),
            matched_rules=matched_rules,
        )

    # ── private helpers ─────────────────────────────────────────────────────

    def _build_response_text(
        self,
        query: str,
        risk_level: str,
        matched_rules: list[str],
        context_chunks: list[dict[str, Any]],
    ) -> str:
        parts: list[str] = []

        # ── Risk Level header ────────────────────────────────────────────────
        level_labels = {
            "emergency": "🚨 Risk Level: EMERGENCY",
            "urgent":    "⚠️  Risk Level: URGENT",
            "routine":   "✅ Risk Level: ROUTINE",
        }
        parts.append(level_labels.get(risk_level, "ℹ️ Risk Level: INFORMATIONAL"))
        parts.append("")  # blank line

        # ── Specific action (emergency or urgent) ────────────────────────────
        specific_action = self._find_specific_action(risk_level, matched_rules)
        if specific_action:
            parts.append("Recommended Action:")
            parts.append(specific_action)
            parts.append("")

        # ── Generic action for emergency if no specific match ────────────────
        elif risk_level == "emergency":
            parts.append("Recommended Action:")
            parts.append(
                "🚨 This appears to be a medical emergency.\n"
                "• Call emergency services (108) immediately.\n"
                "• Do NOT delay seeking professional medical help.\n"
                "• Keep the person calm and still until help arrives."
            )
            parts.append("")

        elif risk_level == "urgent":
            parts.append("Recommended Action:")
            parts.append(
                "⚠️ Please seek medical attention within 24 hours.\n"
                "• Visit your nearest Primary Health Centre (PHC) or clinic.\n"
                "• Monitor symptoms closely for any worsening.\n"
                "• Maintain hydration and rest."
            )
            parts.append("")

        # ── Relevant guidance from knowledge base ────────────────────────────
        kb_guidance = self._extract_kb_guidance(context_chunks)
        if kb_guidance:
            parts.append("Relevant Guidance:")
            for bullet in kb_guidance:
                parts.append(f"• {bullet}")
            parts.append("")

        # ── Routine guidance ─────────────────────────────────────────────────
        if risk_level == "routine":
            routine_bullets = self._get_routine_bullets(matched_rules)
            parts.append("General Health Advice:")
            for bullet in routine_bullets:
                parts.append(f"• {bullet}")
            parts.append("")

        # ── When to escalate ─────────────────────────────────────────────────
        if risk_level != "emergency":
            parts.append("Important Notes:")
            parts.append(self._escalation_note(risk_level))
            parts.append("")

        return "\n".join(parts).strip()

    def _find_specific_action(
        self, risk_level: str, matched_rules: list[str]
    ) -> str:
        if risk_level == "emergency":
            for rule in matched_rules:
                if rule in _EMERGENCY_ACTIONS:
                    return _EMERGENCY_ACTIONS[rule]
        elif risk_level == "urgent":
            for rule in matched_rules:
                if rule in _URGENT_ACTIONS:
                    return _URGENT_ACTIONS[rule]
        return ""

    @staticmethod
    def _extract_kb_guidance(chunks: list[dict[str, Any]]) -> list[str]:
        """Pull up to 3 concise sentences from the top retrieved documents."""
        bullets: list[str] = []
        for chunk in chunks[:3]:
            content = chunk.get("content", "").strip()
            if not content:
                continue
            # Take the first sentence or first 150 chars
            first_sentence = content.split(".")[0].strip()
            if len(first_sentence) > 10:
                bullets.append(first_sentence[:200])
        return bullets

    @staticmethod
    def _get_routine_bullets(matched_rules: list[str]) -> list[str]:
        for rule in matched_rules:
            if rule in _ROUTINE_GUIDANCE:
                return _ROUTINE_GUIDANCE[rule]
        return _DEFAULT_ROUTINE_GUIDANCE

    @staticmethod
    def _escalation_note(risk_level: str) -> str:
        if risk_level == "urgent":
            return (
                "Seek immediate emergency care if you experience: "
                "difficulty breathing, loss of consciousness, "
                "severe chest pain, or uncontrolled bleeding."
            )
        return (
            "Visit a doctor if symptoms worsen, persist beyond 3 days, "
            "or if you develop high fever, difficulty breathing, or severe pain."
        )


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_service_instance: TemplateResponseService | None = None


def get_response_service() -> TemplateResponseService:
    """Return the shared TemplateResponseService singleton."""
    global _service_instance
    if _service_instance is None:
        _service_instance = TemplateResponseService()
    return _service_instance
