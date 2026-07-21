import re

filepath = r"d:\Aayu\backend\app\services\vector_db_service.py"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import_pattern = re.compile(r"import logging\nimport os\nfrom typing import Any")
new_imports = "import logging\nimport os\nimport threading\nfrom typing import Any\nimport torch"
content = import_pattern.sub(new_imports, content)

fn_pattern = re.compile(r"class _SentenceTransformerEmbeddingFn\(chromadb\.EmbeddingFunction\):\s*.*?def __call__\(self, input: list\[str\]\) -> list\[list\[float\]\]:  # noqa: A002\s*(.*?)\s*return embeddings\.tolist\(\)", re.DOTALL)

def replace_call(match):
    original = match.group(0)
    new_code = """class _SentenceTransformerEmbeddingFn(chromadb.EmbeddingFunction):  # type: ignore[type-arg]
    \"\"\"Wraps sentence-transformers so ChromaDB can call it natively.\"\"\"

    def __init__(self, model_name: str = _EMBEDDING_MODEL) -> None:
        logger.info("[VectorDB] Loading embedding model: %s", model_name)
        self._model = SentenceTransformer(model_name)
        self._lock = threading.Lock()
        logger.info("[VectorDB] Embedding model loaded.")

    def __call__(self, input: list[str]) -> list[list[float]]:  # noqa: A002
        with self._lock:
            with torch.inference_mode():
                embeddings = self._model.encode(input, convert_to_numpy=True)
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
        return embeddings.tolist()"""
    return new_code

content = fn_pattern.sub(replace_call, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("VectorDB patch applied.")
