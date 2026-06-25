"""
Voice Pipeline Orchestrator — Sprint 2 Architecture Scaffold.

This module defines the full pipeline interface for voice-driven medical Q&A.
It is ARCHITECTURE ONLY — no LLM or medical reasoning is implemented here.

Pipeline:
    Voice (audio blob)
        ↓  [1] STT Pipeline          → raw transcript (user language)
        ↓  [2] IndicTrans2           → English transcript
        ↓  [3] Semantic Search       → top-k knowledge chunks
        ↓  [4] Context Assembly      → prompt-ready context string
        ↓  [5] [LLM SLOT]            → NOT IMPLEMENTED — placeholder only
        ↓  [6] Response formatting   → HealthResponse (structured)

Usage (future Sprint 2 /chat endpoint):
    from app.services.pipeline import VoicePipeline
    pipeline = VoicePipeline()
    response = await pipeline.process(audio_bytes=..., language="hi")

Extension points:
    - Swap MockLLM for OllamaLLM in step 5
    - Add triage classification between steps 4 and 5
    - Add response back-translation (English → user language) after step 6
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Pipeline result container
# --------------------------------------------------------------------------- #

@dataclass
class PipelineResult:
    """Complete result from one pass through the voice pipeline."""

    # Step 1 & 2 outputs
    original_transcript: str = ""
    english_transcript: str = ""
    detected_language: str = "en"
    transcription_ms: int = 0

    # Step 3 output
    search_results: list[dict[str, Any]] = field(default_factory=list)
    search_collection: str = "all"

    # Step 4 output
    assembled_context: str = ""

    # Step 5 output — LLM placeholder
    llm_response: str = ""         # Will be populated when LLM is integrated
    llm_implemented: bool = False  # Flag: frontend can check this to show placeholder

    # Step 6 output
    formatted_response: dict[str, Any] = field(default_factory=dict)

    # Diagnostics
    total_ms: int = 0
    error: str = ""


# --------------------------------------------------------------------------- #
# Pipeline stages (interfaces)
# --------------------------------------------------------------------------- #

class _STTStage:
    """
    Stage 1: Voice → raw transcript (via Sarvam/STT service).
    Stage 2: raw transcript → English (via IndicTrans2 lazy loader).
    """

    def run(self, audio_path: str, language: str) -> tuple[str, str, str]:
        """
        Returns (original_text, english_text, detected_language).
        IndicTrans2 is lazy-loaded.
        """
        from app.services.speech.stt_service import transcribe_audio
        from app.services.translation_service import translate_to_english

        original = transcribe_audio(audio_path, language)
        english = translate_to_english(original, language)

        return original, english, language


class _SearchStage:
    """Stage 3: English text → top-k knowledge chunks from ChromaDB."""

    def run(
        self,
        query: str,
        collection: str = "all",
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        from app.services.search_service import SearchService
        svc = SearchService.get_instance()
        return svc.search(query=query, collection=collection, top_k=top_k)


class _ContextAssemblyStage:
    """Stage 4: Format retrieved chunks into a prompt-ready context string."""

    MAX_CONTEXT_CHARS = 2000  # Keep context within reasonable LLM context window

    def run(self, search_results: list[dict[str, Any]]) -> str:
        if not search_results:
            return "No relevant information found in the knowledge base."

        parts: list[str] = []
        chars_used = 0
        for i, result in enumerate(search_results, start=1):
            chunk = (
                f"[{i}] {result.get('title', 'Reference')}\n"
                f"Category: {result.get('category', 'General')}\n"
                f"Content: {result.get('content', '')}\n"
                f"Relevance: {result.get('score', 0):.0%}\n"
            )
            if chars_used + len(chunk) > self.MAX_CONTEXT_CHARS:
                break
            parts.append(chunk)
            chars_used += len(chunk)

        return "\n---\n".join(parts)


class _LLMSlot:
    """
    Stage 5: LLM — NOT IMPLEMENTED.

    This is a placeholder slot. When Sprint 2 implements Ollama integration,
    replace this class with OllamaLLMStage. The interface contract is:
        run(query: str, context: str, language: str) -> str
    """

    def run(self, query: str, context: str, language: str) -> str:  # noqa: ARG002
        logger.debug("[Pipeline] LLM stage is a placeholder — Sprint 2 will implement Ollama.")
        return ""  # Empty — caller should check PipelineResult.llm_implemented


class _ResponseFormatterStage:
    """Stage 6: Format pipeline output into a structured HealthResponse dict."""

    def run(
        self,
        query: str,
        search_results: list[dict[str, Any]],
        llm_response: str,
    ) -> dict[str, Any]:
        from app.services.rule_based_triage import get_triage_engine
        from app.services.response_service import get_response_service

        triage_engine = get_triage_engine()
        triage_result = triage_engine.assess(query)

        response_svc = get_response_service()
        health_resp = response_svc.format_response(
            query=query,
            triage=triage_result.to_dict(),
            context_chunks=search_results,
        )
        return health_resp.to_dict()


# --------------------------------------------------------------------------- #
# VoicePipeline orchestrator
# --------------------------------------------------------------------------- #

class VoicePipeline:
    """
    Orchestrates the full Voice → Response pipeline.

    Sprint 1 capabilities:
        ✓ Native + Sarvam STT
        ✓ IndicTrans2 translation (lazy loaded)
        ✓ Semantic Search (ChromaDB)
        ✓ Context Assembly
        ✓ Mock Response Formatting (HealthResponse)
        ✗ LLM (Sprint 2)

    Sprint 2 integration point:
        Replace _LLMSlot with OllamaLLMStage and wire its output
        into _ResponseFormatterStage.
    """

    def __init__(self) -> None:
        self._stt = _STTStage()
        self._search = _SearchStage()
        self._context = _ContextAssemblyStage()
        self._llm = _LLMSlot()
        self._formatter = _ResponseFormatterStage()

    def process_text(
        self,
        english_text: str,
        collection: str = "all",
        top_k: int = 5,
    ) -> PipelineResult:
        """
        Run stages 3–6 on pre-transcribed English text.

        This is the primary Sprint 1 entry point — called after the
        /transcribe endpoint has already handled stages 1–2.
        """
        result = PipelineResult(english_transcript=english_text)

        # Stage 3 — Search
        result.search_results = self._search.run(
            query=english_text, collection=collection, top_k=top_k
        )
        result.search_collection = collection

        # Stage 4 — Context assembly
        result.assembled_context = self._context.run(result.search_results)

        # Stage 5 — LLM (placeholder)
        result.llm_response = self._llm.run(
            query=english_text,
            context=result.assembled_context,
            language="en",
        )
        result.llm_implemented = False

        # Stage 6 — Format response
        result.formatted_response = self._formatter.run(
            query=english_text,
            search_results=result.search_results,
            llm_response=result.llm_response,
        )

        return result


# Singleton
_pipeline_instance: VoicePipeline | None = None

def get_pipeline() -> VoicePipeline:
    """Return the shared VoicePipeline singleton."""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = VoicePipeline()
    return _pipeline_instance
