# inspect_tokenizer.py

from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained(
    "ai4bharat/indictrans2-indic-en-1B",
    trust_remote_code=True
)

print(tokenizer)

print("\nTokenizer attributes:")
for item in dir(tokenizer):
    if not item.startswith("_"):
        print(item)