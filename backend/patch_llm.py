import re

filepath = r"d:\Aayu\backend\app\services\llm_service.py"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update get_llm_response signature
old_sig = """async def get_llm_response(
    query: str,
    context: str,
    language: str = "en",
    prefer_online: bool = False,
    history: list[dict[str, str]] = None,
    system_prompt: str = None,
    max_tokens: int = 300,
) -> tuple[str, str]:"""

new_sig = """async def get_llm_response(
    query: str,
    context: str,
    language: str = "en",
    prefer_online: bool = False,
    history: list[dict[str, str]] = None,
    system_prompt: str = None,
    max_tokens: int = 300,
    response_format: str = "text",
) -> tuple[str, str]:"""
content = content.replace(old_sig, new_sig)

# Update _openai signature
old_openai_sig = """async def _openai(query: str, context: str, history: list[dict[str, str]] = None, system_prompt: str = None, max_tokens: int = 300) -> str:"""
new_openai_sig = """async def _openai(query: str, context: str, history: list[dict[str, str]] = None, system_prompt: str = None, max_tokens: int = 300, response_format: str = "text") -> str:"""
content = content.replace(old_openai_sig, new_openai_sig)

# Update _openai body to include response_format
old_openai_body = """        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=max_tokens,
        )"""

new_openai_body = """        kwargs = {
            "model": OPENAI_MODEL,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": max_tokens,
        }
        if response_format == "json_object":
            kwargs["response_format"] = {"type": "json_object"}
            
        response = client.chat.completions.create(**kwargs)"""
content = content.replace(old_openai_body, new_openai_body)

# Update _ollama signature
old_ollama_sig = """async def _ollama(query: str, context: str, history: list[dict[str, str]] = None, system_prompt: str = None, max_tokens: int = 300) -> str:"""
new_ollama_sig = """async def _ollama(query: str, context: str, history: list[dict[str, str]] = None, system_prompt: str = None, max_tokens: int = 300, response_format: str = "text") -> str:"""
content = content.replace(old_ollama_sig, new_ollama_sig)

# Update _ollama body to include format: "json"
old_ollama_body = """    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": max_tokens},
    }"""
new_ollama_body = """    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": max_tokens},
    }
    if response_format == "json_object":
        payload["format"] = "json\""""
content = content.replace(old_ollama_body, new_ollama_body)

# Update get_llm_response calls
old_call1 = """text = await _openai(query, context, history, system_prompt, max_tokens)"""
new_call1 = """text = await _openai(query, context, history, system_prompt, max_tokens, response_format)"""
content = content.replace(old_call1, new_call1)

old_call2 = """text = await _ollama(query, context, history, system_prompt, max_tokens)"""
new_call2 = """text = await _ollama(query, context, history, system_prompt, max_tokens, response_format)"""
content = content.replace(old_call2, new_call2)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("LLM patch applied.")
