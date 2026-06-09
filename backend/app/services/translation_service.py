from IndicTransToolkit import IndicProcessor
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

device = "cuda" if torch.cuda.is_available() else "cpu"

ip = IndicProcessor(inference=True)

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
).to(device)

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