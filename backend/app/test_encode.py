from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained(
    "ai4bharat/indictrans2-indic-en-1B",
    trust_remote_code=True
)

text = "guj_Gujr: મને ભૂખ લાગી છે"

encoded = tokenizer.encode(text)

print(encoded[:20])