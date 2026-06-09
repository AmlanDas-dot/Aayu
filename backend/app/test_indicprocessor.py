from IndicTransToolkit import IndicProcessor
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

device = "cuda" if torch.cuda.is_available() else "cpu"

print("Loading processor...")
ip = IndicProcessor(inference=True)

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

print("Loading model...")
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
).to(device)

sentence = "મને ભૂખ લાગી છે"

batch = ip.preprocess_batch(
    [sentence],
    src_lang="guj_Gujr",
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

print(translations[0])