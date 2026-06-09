from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)