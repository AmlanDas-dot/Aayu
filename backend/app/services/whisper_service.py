"""
Whisper model service — singleton loader with GPU/CPU auto-detection.

Pipeline (current):
    Voice → Whisper → Medical LLM → User

Future:
    Voice → Whisper → IndicTrans2 → Medical LLM
                              ↓
                    IndicTrans2 → User Language
"""

from faster_whisper import WhisperModel
import os

_model: WhisperModel | None = None


def get_whisper_model() -> WhisperModel:
    global _model

    if _model is None:
        _model = _load_model()

    return _model


def _load_model() -> WhisperModel:
    try:
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"

    except ImportError:
        device = "cpu"

    compute_type = "float16" if device == "cuda" else "int8"

    # Easily switch between small / medium
    #model_size = os.getenv("WHISPER_MODEL", "medium")
    model_size = "medium"

    print(
        f"[Whisper] Loading Whisper {model_size} "
        f"on {device} (compute_type={compute_type})"
    )

    model = WhisperModel(
        model_size,
        device=device,
        compute_type=compute_type,
    )

    print(
        f"[Whisper] Whisper {model_size} loaded successfully on {device}"
    )

    return model