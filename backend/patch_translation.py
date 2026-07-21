import re

filepath = r"d:\Aayu\backend\app\services\translation_service.py"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace torch.no_grad() with torch.inference_mode() and add memory cleanup for translate_to_english
to_eng_pattern = re.compile(r"with torch\.no_grad\(\):.*?return translations\[0\]", re.DOTALL)
new_to_eng = """with torch.inference_mode():
            with torch.autocast("cuda", dtype=torch.float16) if _device == "cuda" else torch.autocast("cpu", enabled=False):
                generated = _model.generate(**inputs, max_new_tokens=256)

        translations = _tokenizer.batch_decode(generated, skip_special_tokens=True)
        translations = _ip.postprocess_batch(translations, lang="eng_Latn")
        
        # Cleanup memory
        del inputs, generated, batch
        if _device == "cuda":
            torch.cuda.empty_cache()
            
        return translations[0]"""

match = to_eng_pattern.search(content)
if match:
    content = content[:match.start()] + new_to_eng + content[match.end():]

# Replace torch.no_grad() with torch.inference_mode() and add memory cleanup for translate_from_english
from_eng_pattern = re.compile(r"with torch\.no_grad\(\):.*?return _ip_en\.postprocess_batch\(decoded, lang=indic_lang\)\[0\]", re.DOTALL)
new_from_eng = """with torch.inference_mode():
                with torch.autocast("cuda", dtype=torch.float16) if _device == "cuda" else torch.autocast("cpu", enabled=False):
                    generated_tokens = _model_en.generate(
                        **inputs,
                        use_cache=True,
                        min_length=0,
                        max_length=256,
                        num_beams=5,
                        num_return_sequences=1,
                    )
            with _tokenizer_en.as_target_tokenizer():
                decoded = _tokenizer_en.batch_decode(
                    generated_tokens.detach().cpu().tolist(),
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=True,
                )
            
            # Cleanup memory
            del inputs, generated_tokens, batch
            if _device == "cuda":
                torch.cuda.empty_cache()
                
            return _ip_en.postprocess_batch(decoded, lang=indic_lang)[0]"""

match = from_eng_pattern.search(content)
if match:
    content = content[:match.start()] + new_from_eng + content[match.end():]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Translation patch applied.")
