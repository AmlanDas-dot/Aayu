from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

print("Loading model...")
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)

print(f"Running on {device}")

tests = [
    "મને ભૂખ લાગી છે",
    "મારું નામ અમ્લાન છે",
    "હું ગુજરાતી પરીક્ષણ કરી રહ્યો છું"
]

for text in tests:
    formatted = f"guj_Gujr eng_Latn {text}"

    inputs = tokenizer(
        formatted,
        return_tensors="pt"
    ).to(device)

    generated = model.generate(
        **inputs,
        max_new_tokens=256
    )

    translation = tokenizer.batch_decode(
        generated,
        skip_special_tokens=True
    )[0]

    print("\n--------------------")
    print("INPUT :", text)
    print("OUTPUT:", translation)