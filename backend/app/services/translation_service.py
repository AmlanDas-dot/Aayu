from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

device = "cuda" if torch.cuda.is_available() else "cpu"

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
    "hi": "hin_Deva",
    "or": "ory_Orya",
}


def translate_to_english(text: str, source_lang: str) -> str:

    if source_lang == "en":
        return text

    src_lang = LANGUAGE_MAP[source_lang]

    formatted_text = f"{src_lang} eng_Latn {text}"

    inputs = tokenizer(
        formatted_text,
        return_tensors="pt"
    ).to(device)

    generated_tokens = model.generate(
        **inputs,
        max_new_tokens=256
    )

    translation = tokenizer.batch_decode(
        generated_tokens,
        skip_special_tokens=True
    )[0]

    return translation