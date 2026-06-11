import logging
_logger = logging.getLogger(__name__)

# IndicTrans2 dependencies — graceful fallback if not installed
try:
    from IndicTransToolkit import IndicProcessor
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    import torch

    MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"
    MODEL_PATH = r"D:\AI_Models\hub\models--ai4bharat--indictrans2-indic-en-1B\snapshots\ac3daf0ecd37be3b6957764a9179ab2b07fa9d6a"

    device = "cuda" if torch.cuda.is_available() else "cpu"

    ip = IndicProcessor(inference=True)

    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_PATH,
        trust_remote_code=True,
        local_files_only=True
    )

    model = AutoModelForSeq2SeqLM.from_pretrained(
        MODEL_PATH,
        trust_remote_code=True,
        local_files_only=True
    ).to(device)

    _INDIC_AVAILABLE = True
    _logger.info("[Translation] IndicTrans2 loaded successfully.")

except Exception as _e:
    _INDIC_AVAILABLE = False
    ip = None
    tokenizer = None
    model = None
    device = "cpu"
    _logger.warning("[Translation] IndicTrans2 not available (%s). Using passthrough.", _e)

LANGUAGE_MAP = {
    "gu": "guj_Gujr",
    "gujarati": "guj_Gujr",

    "hi": "hin_Deva",
    "hindi": "hin_Deva",

    "or": "ory_Orya",
    "odia": "ory_Orya",
    "oriya": "ory_Orya",
}

def translate_to_english(text: str, source_lang: str):

    if source_lang == "en":
        return text

    if not _INDIC_AVAILABLE:
        _logger.debug("[Translation] IndicTrans2 unavailable — returning original text.")
        return text

    src_lang = LANGUAGE_MAP.get(source_lang)

    if not src_lang:
        return text


    batch = ip.preprocess_batch(
        [text],
        src_lang=src_lang,
        tgt_lang="eng_Latn"
    )

    inputs = tokenizer(
        batch,
        padding=True,
        truncation=True,
        return_tensors="pt"
    ).to(device)

    generated = model.generate(
        **inputs,
        max_new_tokens=256
    )

    translations = tokenizer.batch_decode(
        generated,
        skip_special_tokens=True
    )

    translations = ip.postprocess_batch(
        translations,
        lang="eng_Latn"
    )

    return translations[0]