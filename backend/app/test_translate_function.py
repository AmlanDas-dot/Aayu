from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)

text = "guj_Gujr eng_Latn મને ભૂખ લાગી છે"

inputs = tokenizer(
    text,
    return_tensors="pt"
).to(device)

generated_tokens = model.generate(
    **inputs,
    max_new_tokens=256
)

translation = tokenizer.batch_decode(
    generated_tokens,
    skip_special_tokens=True
)

print(translation)