"""
Transcribe Router.

POST /transcribe

Pipeline (Sprint 1):
    Voice (webm) → Whisper → translate_to_english() → {original_text, english_text}

Architecture for Sprint 2 (ready — LLM not implemented):
    Voice (webm)
        → Whisper              (whisper_service.py)
        → IndicTrans2          (translation_service.py — lazy loaded)
        → Semantic Search      (search_service.py + vector_db_service.py)
        → Retrieved Context    (retrieval_service.py)
        → [LLM SLOT]           (response_service.py — MockResponseService for now)
        → Response

The /transcribe endpoint returns english_text which the frontend or a future
/chat endpoint can pipe directly into SearchService.search().
"""

import logging
import os
import tempfile
import time

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.services.whisper_service import get_whisper_model
from app.services.translation_service import translate_to_english

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Supported language codes — must match src/constants/languages.ts
# ---------------------------------------------------------------------------
SUPPORTED_LANGUAGES: set[str] = {"en", "hi", "gu", "or"}

WHISPER_LANGUAGE_MAP = {
    "en": "en",
    "hi": "hi",
    "gu": "gu",
    # Whisper doesn't officially support Odia; let it auto-detect instead.
    "or": None,
}


@router.post("/transcribe", tags=["transcription"])
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en"),
):
    """
    Transcribe an audio file using Faster-Whisper.

    Parameters
    ----------
    file : UploadFile
        Raw audio (webm, wav, mp4, ogg — any format ffmpeg supports).
    language : str
        BCP-47 language code selected in the frontend UI.
        Must be one of: en, hi, gu, or.  Falls back to "en" if invalid.

    Returns
    -------
    JSON
        selected_language   – the language that was requested
        detected_language   – the language Whisper inferred from audio
        original_text       – transcribed text in source language
        english_text        – translated English text (or original if already English)
        processing_time_ms  – wall-clock milliseconds for transcription + translation
    """
    logger.info("[Transcribe] Received file: %s | language: %s", file.filename, language)

    # ── Language validation (silent fallback) ────────────────────────────────
    if language not in SUPPORTED_LANGUAGES:
        logger.warning(
            "[Transcribe] Unsupported language '%s', falling back to 'en'.", language
        )
        language = "en"

    # ── Write upload to a temp file ──────────────────────────────────────────
    suffix = os.path.splitext(file.filename or ".webm")[1] or ".webm"
    temp_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            temp_path = tmp.name

        logger.debug("[Transcribe] Temp file: %s", temp_path)

        # ── Transcribe ───────────────────────────────────────────────────────
        model = get_whisper_model()
        start_time = time.time()

        whisper_language = WHISPER_LANGUAGE_MAP.get(language)

        segments, info = model.transcribe(
            temp_path,
            language=whisper_language,
            task="transcribe",
            beam_size=5,
        )

        # Materialise lazy generator before measuring time
        text = " ".join(seg.text for seg in segments).strip()

        # ── Translate ────────────────────────────────────────────────────────
        # translate_to_english() is a no-op for English and lazy-loads IndicTrans2
        # on first call for a non-English language.
        english_text = translate_to_english(text, language)

        processing_time_ms = round((time.time() - start_time) * 1000)

        if info.language_probability < 0.7:
            logger.warning(
                "[Transcribe] Low language confidence (%.2f) — transcription may be inaccurate.",
                info.language_probability,
            )

        logger.info(
            "[Transcribe] Done in %d ms | detected=%s (%.2f) | chars=%d",
            processing_time_ms,
            info.language,
            info.language_probability,
            len(text),
        )

        return {
            "selected_language": language,
            "detected_language": info.language,
            "original_text": text,
            "english_text": english_text,
            "processing_time_ms": processing_time_ms,
        }

    except Exception as exc:
        logger.error("[Transcribe] Error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Transcription failed. Please try again."},
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)