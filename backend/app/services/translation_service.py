"""
Translation Service — IndicTrans2 with lazy loading.

GPU Memory Strategy:
    - IndicTrans2 is NOT loaded at import time.
    - IndicTrans2 is NOT loaded during FastAPI startup.
    - Model is loaded only on the FIRST translation request (lazy singleton).
    - Whisper and the sentence-transformer embedding model both use GPU; loading
      IndicTrans2 at startup on a 6 GB VRAM card (RTX 4050) would exhaust memory
      before any request is served. Lazy loading defers that allocation until it
      is actually needed.
    - After first load, the model stays resident (cached singleton) so subsequent
      calls pay zero load time.

Singleton state machine:
    _state = "unloaded"  → model has never been touched
    _state = "loaded"    → model is in GPU memory and ready
    _state = "failed"    → model load was attempted but errored;
                           subsequent calls fall back to passthrough
"""

from __future__ import annotations

import logging
import time
import threading
from typing import Optional

_logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────────────────────
# Singleton state — all mutation protected by _lock
# ───────────────────────────────────────────────────────────────

_lock = threading.Lock()
_state: str = "unloaded"   # "unloaded" | "loaded" | "failed"
_INDIC_AVAILABLE: bool | None = None  # None = unchecked, True/False = result cached

# Actual model objects — populated on first use
_ip = None        # IndicProcessor
_tokenizer = None
_model = None
_device: str = "cpu"

import os

# Priority: env var (set in .env or shell) → HuggingFace auto-download cache.
# Set INDICTRANS2_MODEL_PATH to a local snapshot folder if you have it downloaded;
# otherwise the model is downloaded from HuggingFace on first use.
MODEL_PATH: str = os.getenv(
    "INDICTRANS2_MODEL_PATH",
    "ai4bharat/indictrans2-indic-en-1B",   # HuggingFace repo ID — auto-downloads
)
_LOCAL_ONLY: bool = os.path.isabs(MODEL_PATH)  # True only if user gave a real path

LANGUAGE_MAP: dict[str, str] = {
    "gu": "guj_Gujr",
    "gujarati": "guj_Gujr",
    "hi": "hin_Deva",
    "hindi": "hin_Deva",
    "or": "ory_Orya",
    "odia": "ory_Orya",
    "oriya": "ory_Orya",
}


# ───────────────────────────────────────────────────────────────
# Internal loader — called at most once
# ───────────────────────────────────────────────────────────────

def _load_model() -> None:
    """
    Actually import and load IndicTrans2 into GPU/CPU memory.

    Called lazily on the first translation request.
    Protected by _lock so concurrent requests don't double-load.
    """
    global _state, _ip, _tokenizer, _model, _device

    global _INDIC_AVAILABLE
    if _INDIC_AVAILABLE is None:
        try:
            import IndicTransToolkit  # noqa: F401
            _INDIC_AVAILABLE = True
        except ImportError:
            _INDIC_AVAILABLE = False
            _state = "unavailable"
            _logger.warning(
                "[Translation] IndicTransToolkit not installed. "
                "Translation disabled — English passthrough only. "
                "Install with: pip install IndicTransToolkit"
            )
            return

    # --- check under lock whether another thread already loaded ---
    if _state != "unloaded":
        return

    _logger.info("[Translation] Loading IndicTrans2 model (first request)…")
    t0 = time.time()

    try:
        # Imports are deferred here — at module import time zero GPU is used.
        from IndicTransToolkit import IndicProcessor
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        import torch

        _device = "cuda" if torch.cuda.is_available() else "cpu"
        _logger.info("[Translation] Device selected: %s", _device)

        _ip = IndicProcessor(inference=True)

        _tokenizer = AutoTokenizer.from_pretrained(
            MODEL_PATH,
            trust_remote_code=True,
            local_files_only=_LOCAL_ONLY,
        )

        # Load to CPU first, then move to GPU — avoids a double-allocation spike
        # that can blow past the VRAM ceiling on a 6 GB card.
        _model = AutoModelForSeq2SeqLM.from_pretrained(
            MODEL_PATH,
            trust_remote_code=True,
            local_files_only=_LOCAL_ONLY,
        )
        _model = _model.to(_device)
        _model.eval()  # Disable dropout — slightly faster inference

        elapsed = round(time.time() - t0, 2)
        _state = "loaded"
        _logger.info(
            "[Translation] IndicTrans2 loaded in %.2f s on %s.", elapsed, _device
        )

    except Exception as exc:
        _state = "failed"
        _logger.warning(
            "[Translation] IndicTrans2 failed to load — falling back to passthrough. "
            "Error: %s",
            exc,
        )


# ───────────────────────────────────────────────────────────────
# Public API
# ───────────────────────────────────────────────────────────────

def translate_to_english(text: str, source_lang: str) -> str:
    """
    Translate *text* from *source_lang* to English.

    Behaviour:
      - If source_lang == "en", returns text unchanged (zero cost).
      - On first call for a non-English language, triggers a one-time model load.
      - If model load fails, returns original text (safe passthrough).
      - Subsequent calls use the cached singleton — no reload cost.

    GPU memory note:
        IndicTrans2 (1B) uses ~2–3 GB VRAM on float16.
        Whisper "medium" uses ~1.5 GB VRAM on float16.
        all-MiniLM-L6-v2 embedding model uses ~0.1 GB.
        Total under full load ≈ 4.5–5 GB — within the 6 GB budget of RTX 4050.
        By lazy-loading translation we avoid exceeding VRAM during startup.
    """
    global _ip, _tokenizer, _model, _device

    # Fast path: no translation needed
    if source_lang == "en":
        return text

    if _state == "unavailable":
        return text   # passthrough — no repeated warnings

    # Lazy-load under lock — thread-safe singleton init
    with _lock:
        if _state == "unloaded":
            _load_model()

    # If model failed to load, fall back gracefully
    if _state != "loaded":
        _logger.debug(
            "[Translation] Passthrough (model %s) — returning original text.", _state
        )
        return text

    src_lang_code = LANGUAGE_MAP.get(source_lang)
    if not src_lang_code:
        _logger.debug(
            "[Translation] Unsupported language '%s' — returning original text.", source_lang
        )
        return text

    try:
        import torch

        batch = _ip.preprocess_batch(
            [text],
            src_lang=src_lang_code,
            tgt_lang="eng_Latn",
        )

        inputs = _tokenizer(
            batch,
            padding=True,
            truncation=True,
            return_tensors="pt",
        ).to(_device)

        with torch.no_grad():  # Disable gradient tracking — saves memory during inference
            generated = _model.generate(**inputs, max_new_tokens=256)

        translations = _tokenizer.batch_decode(generated, skip_special_tokens=True)
        translations = _ip.postprocess_batch(translations, lang="eng_Latn")
        return translations[0]

    except Exception as exc:
        _logger.error("[Translation] Inference failed: %s", exc)
        return text


def translate_from_english(text: str, target_lang: str) -> str:
    """
    Translate English text to the target language using IndicTrans2.
    Falls back to the original English text if translation fails or model is not loaded.
    """
    if _state == "unavailable":
        return text   # passthrough — no repeated warnings

    _load_model()

    if _state != "loaded":
        return text

    if target_lang == "en":
        return text

    indic_lang = LANGUAGE_MAP.get(target_lang)
    if not indic_lang:
        _logger.warning("[Translation] Unknown target language: %s", target_lang)
        return text

    with _lock:
        try:
            import torch
            batch = _ip.preprocess_batch(
                [text],
                src_lang="eng_Latn",
                tgt_lang=indic_lang,
            )
            inputs = _tokenizer(
                batch,
                truncation=True,
                padding="longest",
                return_tensors="pt",
                return_attention_mask=True,
            ).to(_device)
            with torch.no_grad():
                generated_tokens = _model.generate(
                    **inputs,
                    use_cache=True,
                    min_length=0,
                    max_length=256,
                    num_beams=5,
                    num_return_sequences=1,
                )
            with _tokenizer.as_target_tokenizer():
                decoded = _tokenizer.batch_decode(
                    generated_tokens.detach().cpu().tolist(),
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=True,
                )
            return _ip.postprocess_batch(decoded, lang=indic_lang)[0]
        except Exception as exc:
            _logger.error("[Translation] translate_from_english failed: %s", exc)
            return text


def is_model_loaded() -> bool:
    """Return True if IndicTrans2 has been successfully loaded."""
    return _state == "loaded"


def get_model_status() -> str:
    """Return human-readable model state: 'unloaded', 'loaded', or 'failed'."""
    return _state