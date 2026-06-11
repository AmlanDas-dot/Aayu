from app.services.translation_service import translate_to_english
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.services.whisper_service import get_whisper_model
import tempfile
import os
import time

router = APIRouter()

# ---------------------------------------------------------------------------
# Supported language codes — must match src/constants/languages.ts
# ---------------------------------------------------------------------------
SUPPORTED_LANGUAGES: set[str] = {"en", "hi", "gu", "or"}

WHISPER_LANGUAGE_MAP = {
    "en": "en",
    "hi": "hi",
    "gu": "gu",

    # Whisper doesn't officially support Odia.
    # Let Whisper auto-detect instead.
    "or": None,
}


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en"),
):
    """
    Transcribe an audio file using Faster-Whisper with a user-selected language.

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
        text                – transcribed text
        processing_time_ms  – wall-clock milliseconds for transcription
    """
    print("Received file:", file.filename)
    print("Selected language:", language)

    # ---- Language validation (silent fallback) ----
    if language not in SUPPORTED_LANGUAGES:
        print(f"Warning: unsupported language '{language}', falling back to 'en'")
        language = "en"

    # ---- Write upload to a temp file ----
    suffix = os.path.splitext(file.filename or ".webm")[1] or ".webm"
    temp_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            temp_path = tmp.name

        print("Temp file:", temp_path)
        print("Starting transcription")

        # ---- Transcribe ----
        model = get_whisper_model()
        start_time = time.time()

        whisper_language = WHISPER_LANGUAGE_MAP.get(language)

        segments, info = model.transcribe(
            temp_path,
            language=whisper_language,
            task="transcribe",
            beam_size=5
        )

        # Materialise lazy generator before measuring time
        text = " ".join(seg.text for seg in segments).strip()

        english_text = translate_to_english(
            text,
            language
        )

        processing_time_ms = round((time.time() - start_time) * 1000)

        print("Detected language:", info.language)
        print("Detected language probability:", info.language_probability)
        print("Whisper detected:", text)
        print("Language probability:", info.language_probability)

        if info.language_probability < 0.7:
            print("Warning: low language confidence — transcription may be inaccurate")

        print("Final text:", text)
        print("English text:", english_text)

        return {
            "selected_language": language,
            "detected_language": info.language,

            "original_text": text,
            "english_text": english_text,

            "processing_time_ms": processing_time_ms,
        }

    except Exception as exc:
        print("Transcription error:", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Transcription failed. Please try again."},
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)