"""
Translation Service Interface.

CONTRACT — do NOT implement yet.

Pipeline slot:
    User Voice → Whisper (raw text) → [THIS SERVICE] → English text → ChromaDB search

When implemented this will wrap IndicTrans2 for Indic → English and English → Indic.
The existing whisper pipeline calls translate_to_english() which is currently the
IndicTrans2 model.  Future: this service adds a clean interface for bidirectional
translation and exposes a normalised API for all downstream consumers.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Language code registry — single source of truth
# --------------------------------------------------------------------------- #

SUPPORTED_LANGUAGES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "gu": "Gujarati",
    "or": "Odia",
    # Add more as IndicTrans2 support expands
}


# --------------------------------------------------------------------------- #
# Abstract base (contract)
# --------------------------------------------------------------------------- #

class BaseTranslationService(ABC):
    """
    Abstract translation service.

    Implementations:
        - IndicTrans2TranslationService  (production — future)
        - PassthroughTranslationService  (dev/test — always returns original text)
    """

    @abstractmethod
    def translate_to_english(self, text: str, source_lang: str) -> str:
        """
        Translate text from source_lang to English.

        Parameters
        ----------
        text        : raw transcribed text
        source_lang : BCP-47 language code (e.g. "hi", "gu")

        Returns
        -------
        English translation, or the original text if already English / unsupported.
        """

    @abstractmethod
    def translate_from_english(self, text: str, target_lang: str) -> str:
        """
        Translate text from English to target_lang.

        Used for sending AI responses back to the user's language.
        """

    @abstractmethod
    def detect_language(self, text: str) -> str:
        """Return detected BCP-47 language code."""


# --------------------------------------------------------------------------- #
# Passthrough implementation (placeholder)
# --------------------------------------------------------------------------- #

class PassthroughTranslationService(BaseTranslationService):
    """
    No-op translation service for development / testing.

    Returns the original text unchanged — safe to use when IndicTrans2
    is not available.
    """

    def translate_to_english(self, text: str, source_lang: str) -> str:
        logger.debug(
            "[Translation] Passthrough: returning original text (lang=%s).", source_lang
        )
        return text

    def translate_from_english(self, text: str, target_lang: str) -> str:
        logger.debug(
            "[Translation] Passthrough: returning original text (lang=%s).", target_lang
        )
        return text

    def detect_language(self, text: str) -> str:
        return "en"


# --------------------------------------------------------------------------- #
# Factory
# --------------------------------------------------------------------------- #

def get_translation_service() -> BaseTranslationService:
    """
    Return the active translation service.

    Future: swap PassthroughTranslationService for IndicTrans2TranslationService
    once the model is available and tested.
    """
    # TODO: return IndicTrans2TranslationService() when ready
    return PassthroughTranslationService()
