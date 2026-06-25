"""
BM25 keyword search service.

Builds an in-memory BM25 index from the same documents already stored in
ChromaDB. Used alongside vector search for hybrid retrieval.

Hybrid merge strategy: Reciprocal Rank Fusion (RRF).
"""

from __future__ import annotations

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer."""
    return re.findall(r"\b\w+\b", text.lower())


class BM25Index:
    """BM25 index for one ChromaDB collection."""

    def __init__(self, documents: list[str], ids: list[str], metadatas: list[dict]) -> None:
        from rank_bm25 import BM25Okapi
        self._ids = ids
        self._documents = documents
        self._metadatas = metadatas
        tokenized = [_tokenize(d) for d in documents]
        self._bm25 = BM25Okapi(tokenized)

    def search(self, query: str, top_k: int = 10) -> list[dict[str, Any]]:
        tokens = _tokenize(query)
        if not tokens:
            return []
        scores = self._bm25.get_scores(tokens)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]
        results = []
        for idx, score in ranked:
            if score > 0:
                results.append({
                    "id": self._ids[idx],
                    "document": self._documents[idx],
                    "metadata": self._metadatas[idx],
                    "bm25_score": float(score),
                })
        return results


class BM25Service:
    """Manages BM25 indexes for all ChromaDB collections."""

    _instance: "BM25Service | None" = None
    _indexes: dict[str, BM25Index] = {}

    @classmethod
    def get_instance(cls) -> "BM25Service":
        if cls._instance is None:
            cls._instance = cls()
            cls._instance._build_all_indexes()
        return cls._instance

    def _build_all_indexes(self) -> None:
        """Build BM25 index for every collection in ChromaDB."""
        from app.services.vector_db_service import VectorDBService
        from app.services.indexer import list_knowledge_collections

        db = VectorDBService.get_instance()
        collections = list(list_knowledge_collections()) + ["nutrition", "schemes"]

        for name in collections:
            try:
                col = db.get_or_create_collection(name)
                data = col.get(include=["documents", "metadatas"])
                docs = data.get("documents") or []
                ids  = data.get("ids") or []
                metas = data.get("metadatas") or []
                if docs:
                    self._indexes[name] = BM25Index(docs, ids, metas)
                    logger.info("[BM25] Built index for '%s' (%d docs).", name, len(docs))
            except Exception as exc:
                logger.warning("[BM25] Could not build index for '%s': %s", name, exc)

    def search(self, query: str, collection: str = "all", top_k: int = 10) -> list[dict[str, Any]]:
        if collection == "all":
            all_results: list[dict] = []
            for idx in self._indexes.values():
                all_results.extend(idx.search(query, top_k=5))
            all_results.sort(key=lambda x: x["bm25_score"], reverse=True)
            return all_results[:top_k]
        if collection in self._indexes:
            return self._indexes[collection].search(query, top_k)
        return []
