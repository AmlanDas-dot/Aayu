"""
Triage Service Interface.

CONTRACT — skeleton only. Do NOT implement medical logic yet.

Pipeline slot:
    Retrieved knowledge → [THIS SERVICE] → Urgency classification + structured output

This service will:
  1. Classify urgency (emergency / urgent / routine / informational)
  2. Identify red-flag symptoms
  3. Recommend escalation pathway (self-care / PHC / hospital / emergency)
  4. Provide rationale for triage decision

IMPORTANT: This is NOT a diagnostic service. It guides care-seeking behaviour only.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Triage levels
# --------------------------------------------------------------------------- #

class TriageLevel(str, Enum):
    """Urgency classification aligned with WHO IMCI / ACS triage standards."""

    EMERGENCY = "emergency"       # Call ambulance / go to ER immediately
    URGENT = "urgent"             # See doctor within 24 hours
    ROUTINE = "routine"           # Schedule appointment within a week
    SELF_CARE = "self_care"       # Manage at home with guidance
    INFORMATIONAL = "informational"  # No action needed; education only


class TriageResult:
    """Structured output from triage assessment."""

    def __init__(
        self,
        level: TriageLevel,
        rationale: str,
        red_flags: list[str],
        recommendation: str,
        escalation_path: str,
    ) -> None:
        self.level = level
        self.rationale = rationale
        self.red_flags = red_flags
        self.recommendation = recommendation
        self.escalation_path = escalation_path

    def to_dict(self) -> dict[str, Any]:
        return {
            "level": self.level.value,
            "rationale": self.rationale,
            "red_flags": self.red_flags,
            "recommendation": self.recommendation,
            "escalation_path": self.escalation_path,
        }


# --------------------------------------------------------------------------- #
# Abstract base
# --------------------------------------------------------------------------- #

class BaseTriageService(ABC):
    """
    Abstract triage service.

    Implementations:
        - RuleBasedTriageService     (simple heuristics — Phase 2)
        - LLMTriageService           (Ollama-powered — Phase 3)
        - MockTriageService          (dev/test)
    """

    @abstractmethod
    def assess(
        self,
        symptoms: str,
        context_chunks: list[dict[str, Any]],
        patient_profile: dict[str, Any] | None = None,
    ) -> TriageResult:
        """
        Assess urgency from symptom description and retrieved context.

        Parameters
        ----------
        symptoms        : free-text symptom description (English)
        context_chunks  : knowledge chunks from RetrievalService
        patient_profile : optional dict with age, gender, conditions, etc.
        """


# --------------------------------------------------------------------------- #
# Mock implementation
# --------------------------------------------------------------------------- #

class MockTriageService(BaseTriageService):
    """Returns a fixed INFORMATIONAL result — safe for testing."""

    def assess(
        self,
        symptoms: str,
        context_chunks: list[dict[str, Any]],
        patient_profile: dict[str, Any] | None = None,
    ) -> TriageResult:
        logger.debug("[Triage] MockTriageService — returning placeholder result.")
        return TriageResult(
            level=TriageLevel.INFORMATIONAL,
            rationale="Triage engine not yet implemented. Please consult a healthcare professional.",
            red_flags=[],
            recommendation="Consult a local healthcare provider for proper evaluation.",
            escalation_path="Visit your nearest Primary Health Centre (PHC).",
        )


# --------------------------------------------------------------------------- #
# Factory
# --------------------------------------------------------------------------- #

from app.core.config import settings

def get_triage_service() -> BaseTriageService:
    if settings.ENVIRONMENT == "development":
        return MockTriageService()
    raise NotImplementedError("Production TriageService is not yet implemented.")
