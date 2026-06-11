"""
Response Service Interface.

CONTRACT — skeleton only. Do NOT implement medical response generation yet.

Pipeline slot:
    Triage result + Retrieved context → [THIS SERVICE] → Structured final response → Translation

This service will:
  1. Format the AI response in a structured, readable way
  2. Include: summary, guidance, precautions, when-to-seek-help
  3. Localise tone for rural / low-literacy audiences
  4. Attach a standard disclaimer
  5. Pass the response to TranslationService for back-translation
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)

# Standard disclaimer — must appear on all medical guidance responses
MEDICAL_DISCLAIMER = (
    "⚠️ Disclaimer: AAYU provides general health information and guidance only. "
    "It does not diagnose medical conditions or replace professional medical advice. "
    "Always consult a qualified healthcare professional for diagnosis and treatment."
)


# --------------------------------------------------------------------------- #
# Response model
# --------------------------------------------------------------------------- #

class HealthResponse:
    """Structured response returned to the frontend."""

    def __init__(
        self,
        summary: str,
        guidance: list[str],
        precautions: list[str],
        when_to_seek_help: str,
        triage_level: str,
        sources: list[dict[str, Any]],
        disclaimer: str = MEDICAL_DISCLAIMER,
    ) -> None:
        self.summary = summary
        self.guidance = guidance
        self.precautions = precautions
        self.when_to_seek_help = when_to_seek_help
        self.triage_level = triage_level
        self.sources = sources
        self.disclaimer = disclaimer

    def to_dict(self) -> dict[str, Any]:
        return {
            "summary": self.summary,
            "guidance": self.guidance,
            "precautions": self.precautions,
            "when_to_seek_help": self.when_to_seek_help,
            "triage_level": self.triage_level,
            "sources": self.sources,
            "disclaimer": self.disclaimer,
        }


# --------------------------------------------------------------------------- #
# Abstract base
# --------------------------------------------------------------------------- #

class BaseResponseService(ABC):
    """
    Abstract response formatter.

    Implementations:
        - TemplateResponseService    (rule-based templates — Phase 2)
        - OllamaResponseService      (LLM-generated — Phase 3)
        - MockResponseService        (dev/test)
    """

    @abstractmethod
    def format_response(
        self,
        query: str,
        triage_result: dict[str, Any],
        context_chunks: list[dict[str, Any]],
        language: str = "en",
    ) -> HealthResponse:
        """
        Generate and format a user-facing health response.

        Parameters
        ----------
        query           : original user query (English)
        triage_result   : output from TriageService.assess()
        context_chunks  : retrieved knowledge chunks
        language        : target display language (for future translation)
        """


# --------------------------------------------------------------------------- #
# Mock implementation
# --------------------------------------------------------------------------- #

class MockResponseService(BaseResponseService):
    """Returns placeholder response — safe for frontend testing."""

    def format_response(
        self,
        query: str,
        triage_result: dict[str, Any],
        context_chunks: list[dict[str, Any]],
        language: str = "en",
    ) -> HealthResponse:
        logger.debug("[Response] MockResponseService — returning placeholder.")
        return HealthResponse(
            summary=f"You asked about: {query[:100]}",
            guidance=[
                "Stay hydrated and rest.",
                "Monitor your symptoms over the next 24–48 hours.",
                "Consult a healthcare provider if symptoms worsen.",
            ],
            precautions=[
                "Do not self-medicate without professional advice.",
                "Keep a record of symptoms and their onset times.",
            ],
            when_to_seek_help=(
                "Seek immediate medical attention if you experience: "
                "difficulty breathing, chest pain, high fever (>103°F / 39.4°C), "
                "loss of consciousness, or severe pain."
            ),
            triage_level=triage_result.get("level", "informational"),
            sources=[
                {"title": r.get("title", "Knowledge Base"), "score": r.get("score", 0)}
                for r in context_chunks[:3]
            ],
        )


# --------------------------------------------------------------------------- #
# Factory
# --------------------------------------------------------------------------- #

def get_response_service() -> BaseResponseService:
    # TODO: Replace with TemplateResponseService or OllamaResponseService
    return MockResponseService()
