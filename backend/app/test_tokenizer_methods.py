# test_tokenizer_methods.py

from transformers import AutoTokenizer

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

print(type(tokenizer))
print("\nMethods containing 'lang':")

for item in dir(tokenizer):
    if "lang" in item.lower():
        print(item)