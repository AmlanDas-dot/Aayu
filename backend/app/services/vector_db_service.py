"""
Vector Database Service — ChromaDB + Sentence Transformers.

Architecture:
    Document → Embedding (all-MiniLM-L6-v2) → ChromaDB collection → Similarity search

This is a generic, reusable service. Future modules (medical triage, symptom search,
drug lookup, scheme recommendations) can use it without modification.

Usage:
    from app.services.vector_db_service import VectorDBService
    db = VectorDBService.get_instance()
    db.add_documents("my_collection", documents=[...], ids=[...], metadatas=[...])
    results = db.search("my_collection", query="headache", top_k=5)
"""

from __future__ import annotations

import logging
import os
from typing import Any

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #

# Persisted on disk — survives server restarts
_CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db")
_EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"


# --------------------------------------------------------------------------- #
# Embedding function adapter for ChromaDB
# --------------------------------------------------------------------------- #

class _SentenceTransformerEmbeddingFn(chromadb.EmbeddingFunction):  # type: ignore[type-arg]
    """Wraps sentence-transformers so ChromaDB can call it natively."""

    def __init__(self, model_name: str = _EMBEDDING_MODEL) -> None:
        logger.info("[VectorDB] Loading embedding model: %s", model_name)
        self._model = SentenceTransformer(model_name)
        logger.info("[VectorDB] Embedding model loaded.")

    def __call__(self, input: list[str]) -> list[list[float]]:  # noqa: A002
        embeddings = self._model.encode(input, convert_to_numpy=True)
        return embeddings.tolist()


# --------------------------------------------------------------------------- #
# VectorDBService
# --------------------------------------------------------------------------- #

class VectorDBService:
    """
    Generic ChromaDB wrapper.

    All collections use the same embedding model (all-MiniLM-L6-v2).
    Collections are created on demand and are persisted to disk.
    """

    _instance: "VectorDBService | None" = None

    def __init__(self) -> None:
        os.makedirs(_CHROMA_PATH, exist_ok=True)
        self._client = chromadb.PersistentClient(
            path=_CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
        self._embedding_fn = _SentenceTransformerEmbeddingFn()
        logger.info("[VectorDB] ChromaDB client initialised at: %s", _CHROMA_PATH)

    # ------------------------------------------------------------------ #
    # Singleton accessor
    # ------------------------------------------------------------------ #

    @classmethod
    def get_instance(cls) -> "VectorDBService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ------------------------------------------------------------------ #
    # Collection management
    # ------------------------------------------------------------------ #

    def get_or_create_collection(self, name: str) -> chromadb.Collection:
        """Return existing collection or create a new one with the shared embedding fn."""
        col = self._client.get_or_create_collection(
            name=name,
            embedding_function=self._embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
        logger.debug("[VectorDB] Collection '%s' ready (%d docs).", name, col.count())
        return col

    def delete_collection(self, name: str) -> None:
        """Delete an entire collection (irreversible)."""
        self._client.delete_collection(name)
        logger.info("[VectorDB] Collection '%s' deleted.", name)

    def list_collections(self) -> list[str]:
        """Return names of all existing collections."""
        return [c.name for c in self._client.list_collections()]

    def collection_count(self, name: str) -> int:
        col = self.get_or_create_collection(name)
        return col.count()

    # ------------------------------------------------------------------ #
    # Document operations
    # ------------------------------------------------------------------ #

    def add_documents(
        self,
        collection_name: str,
        documents: list[str],
        ids: list[str],
        metadatas: list[dict[str, Any]] | None = None,
    ) -> None:
        """
        Embed and insert documents.

        Parameters
        ----------
        collection_name : str
        documents       : raw text chunks to embed
        ids             : unique string IDs (one per document)
        metadatas       : optional dicts attached to each doc (filterable)
        """
        col = self.get_or_create_collection(collection_name)
        col.add(
            documents=documents,
            ids=ids,
            metadatas=metadatas or [{} for _ in documents],
        )
        logger.info("[VectorDB] Added %d docs to '%s'.", len(documents), collection_name)

    def update_documents(
        self,
        collection_name: str,
        documents: list[str],
        ids: list[str],
        metadatas: list[dict[str, Any]] | None = None,
    ) -> None:
        """Update existing documents (re-embeds them)."""
        col = self.get_or_create_collection(collection_name)
        col.update(
            documents=documents,
            ids=ids,
            metadatas=metadatas or [{} for _ in documents],
        )
        logger.info("[VectorDB] Updated %d docs in '%s'.", len(documents), collection_name)

    def upsert_documents(
        self,
        collection_name: str,
        documents: list[str],
        ids: list[str],
        metadatas: list[dict[str, Any]] | None = None,
    ) -> None:
        """Insert or update documents (idempotent — safe for re-indexing)."""
        col = self.get_or_create_collection(collection_name)
        col.upsert(
            documents=documents,
            ids=ids,
            metadatas=metadatas or [{} for _ in documents],
        )
        logger.info("[VectorDB] Upserted %d docs in '%s'.", len(documents), collection_name)

    def delete_documents(self, collection_name: str, ids: list[str]) -> None:
        """Remove specific documents by ID."""
        col = self.get_or_create_collection(collection_name)
        col.delete(ids=ids)
        logger.info("[VectorDB] Deleted %d docs from '%s'.", len(ids), collection_name)

    # ------------------------------------------------------------------ #
    # Search
    # ------------------------------------------------------------------ #

    def search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Semantic similarity search.

        Returns a list of result dicts, each with:
            id         – document ID
            document   – original text
            metadata   – attached metadata dict
            distance   – cosine distance (lower = more similar)
            score      – 1 - distance (higher = more similar)
        """
        col = self.get_or_create_collection(collection_name)
        if col.count() == 0:
            return []

        kwargs: dict[str, Any] = {
            "query_texts": [query],
            "n_results": min(top_k, col.count()),
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        result = col.query(**kwargs)

        hits: list[dict[str, Any]] = []
        for i, doc_id in enumerate(result["ids"][0]):
            distance = result["distances"][0][i]
            hits.append(
                {
                    "id": doc_id,
                    "document": result["documents"][0][i],
                    "metadata": result["metadatas"][0][i],
                    "distance": round(distance, 4),
                    "score": round(1.0 - distance, 4),
                }
            )
        return hits

    def get_document(self, collection_name: str, doc_id: str) -> dict[str, Any] | None:
        """Retrieve a specific document by ID."""
        col = self.get_or_create_collection(collection_name)
        result = col.get(ids=[doc_id], include=["documents", "metadatas"])
        if not result["ids"]:
            return None
        return {
            "id": result["ids"][0],
            "document": result["documents"][0],
            "metadata": result["metadatas"][0],
        }
