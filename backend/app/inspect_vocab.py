from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained(
    "ai4bharat/indictrans2-indic-en-1B",
    trust_remote_code=True
)

src_vocab = tokenizer.get_src_vocab()

for token in src_vocab:
    if "guj" in token.lower() or "hin" in token.lower() or "ory" in token.lower():
        print(token)