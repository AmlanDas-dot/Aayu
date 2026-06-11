"""
Whisper model service — singleton loader with GPU/CPU auto-detection.

GPU Memory Strategy (RTX 4050 Laptop — 6 GB VRAM):
    Whisper "medium" in float16 uses ≈1.5 GB VRAM.
    The model is loaded lazily on first transcription request, not at import time.
    This leaves VRAM headroom for the sentence-transformer embedding model
    (≈0.1 GB) loaded at startup and IndicTrans2 (≈2–3 GB) loaded on first
    translation request.

    Approximate VRAM budget:
        Whisper medium (float16)         ≈ 1.5 GB  (lazy)
        all-MiniLM-L6-v2                 ≈ 0.1 GB  (eager — tiny, safe)
        IndicTrans2-1B (float16, lazy)   ≈ 2.5 GB  (lazy)
        ──────────────────────────────────────────
        Total (all loaded)               ≈ 4.1 GB  ✓ within 6 GB budget

Pipeline (current):
    Voice → Whisper → translate_to_english() → Semantic Search → User

Future:
    Voice → Whisper → IndicTrans2 (→ English)
          → Semantic Search → LLM
          → IndicTrans2 (← user language) → TTS
"""

import logging
import os
import time

from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

_model: WhisperModel | None = None


def get_whisper_model() -> WhisperModel:
    """Return the Whisper singleton, loading it on first call."""
    global _model

    if _model is None:
        _model = _load_model()

    return _model


def _load_model() -> WhisperModel:
    """Load Whisper model with GPU/CPU auto-detection."""
    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        device = "cpu"

    # float16 on CUDA is faster and uses less VRAM; int8 on CPU avoids float errors
    compute_type = "float16" if device == "cuda" else "int8"

    # Model size can be overridden via environment variable for CI or low-memory environments
    model_size = os.getenv("WHISPER_MODEL", "medium")

    logger.info(
        "[Whisper] Loading Whisper '%s' on %s (compute_type=%s)…",
        model_size, device, compute_type,
    )

    t0 = time.time()
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    elapsed = round(time.time() - t0, 2)

    logger.info(
        "[Whisper] Whisper '%s' loaded in %.2f s on %s.", model_size, elapsed, device
    )

    return model


def get_whisper_status() -> dict:
    """Return whisper model load status for diagnostics."""
    return {
        "loaded": _model is not None,
        "model_size": os.getenv("WHISPER_MODEL", "medium"),
    }