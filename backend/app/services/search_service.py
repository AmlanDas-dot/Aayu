"""
Semantic Search Service.

Accepts English natural-language queries, searches ChromaDB collections,
and returns ranked documents with similarity scores.

Design goals:
- Clean abstraction layer over VectorDBService
- Future datasets (medical, drug, scheme, triage) can be added as new
  SearchTarget entries without touching the core logic
- Scoring, filtering, and re-ranking can be extended here

Usage:
    from app.services.search_service import SearchService
    svc = SearchService.get_instance()
    results = await svc.search(query="fever and headache", collection="medical_guidance", top_k=5)
"""

from __future__ import annotations

import logging
from typing import Any

from app.services.vector_db_service import VectorDBService

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Search targets — add new knowledge bases here
# --------------------------------------------------------------------------- #

AVAILABLE_COLLECTIONS = {
    "first_aid": "First aid procedures and emergency responses",
    "medical_guidance": "General medical guidance and symptom information",
    "emergency_guidance": "Emergency situations and when to seek immediate care",
    "all": "Search across all available knowledge bases",
}

_ALL_REAL_COLLECTIONS = [k for k in AVAILABLE_COLLECTIONS if k != "all"]


# --------------------------------------------------------------------------- #
# Result model
# --------------------------------------------------------------------------- #

class SearchResult:
    """Structured result from semantic search."""

    def __init__(
        self,
        doc_id: str,
        content: str,
        metadata: dict[str, Any],
        score: float,
        distance: float,
        collection: str,
    ) -> None:
        self.id = doc_id
        self.content = content
        self.metadata = metadata
        self.score = score
        self.distance = distance
        self.collection = collection

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "title": self.metadata.get("title", ""),
            "category": self.metadata.get("category", ""),
            "source": self.metadata.get("source", self.collection),
            "tags": self.metadata.get("tags", []),
            "score": self.score,
            "distance": self.distance,
            "collection": self.collection,
        }


# --------------------------------------------------------------------------- #
# SearchService
# --------------------------------------------------------------------------- #

class SearchService:
    """
    Semantic search across one or more ChromaDB collections.

    Future hooks:
        - Re-ranking with a cross-encoder
        - Query expansion (synonym injection)
        - Language-specific preprocessing
        - Metadata filters (category, severity, language)
    """

    _instance: "SearchService | None" = None

    def __init__(self) -> None:
        self._db = VectorDBService.get_instance()

    @classmethod
    def get_instance(cls) -> "SearchService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def search(
        self,
        query: str,
        collection: str = "all",
        top_k: int = 5,
        min_score: float = 0.0,
        metadata_filter: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search for semantically similar documents.

        Parameters
        ----------
        query           : English-language query string
        collection      : collection name or "all" to search every collection
        top_k           : max results to return (per collection when searching all)
        min_score       : filter out results below this cosine similarity score
        metadata_filter : ChromaDB where-clause for metadata filtering

        Returns
        -------
        List of result dicts sorted by score descending.
        """
        if not query.strip():
            return []

        query = query.strip()

        if collection == "all":
            return self._search_all(query, top_k, min_score, metadata_filter)

        return self._search_single(query, collection, top_k, min_score, metadata_filter)

    def get_collections(self) -> dict[str, Any]:
        """Return info about available collections and their document counts."""
        info: dict[str, Any] = {}
        for name, description in AVAILABLE_COLLECTIONS.items():
            if name == "all":
                continue
            count = self._db.collection_count(name)
            info[name] = {"description": description, "document_count": count}
        return info

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #

    def _search_single(
        self,
        query: str,
        collection: str,
        top_k: int,
        min_score: float,
        metadata_filter: dict[str, Any] | None,
    ) -> list[dict[str, Any]]:
        raw = self._db.search(
            collection_name=collection,
            query=query,
            top_k=top_k,
            where=metadata_filter,
        )
        results = []
        for hit in raw:
            if hit["score"] >= min_score:
                results.append(
                    SearchResult(
                        doc_id=hit["id"],
                        content=hit["document"],
                        metadata=hit["metadata"],
                        score=hit["score"],
                        distance=hit["distance"],
                        collection=collection,
                    ).to_dict()
                )
        return results

    def _search_all(
        self,
        query: str,
        top_k: int,
        min_score: float,
        metadata_filter: dict[str, Any] | None,
    ) -> list[dict[str, Any]]:
        all_results: list[dict[str, Any]] = []
        for col_name in _ALL_REAL_COLLECTIONS:
            try:
                hits = self._search_single(query, col_name, top_k, min_score, metadata_filter)
                all_results.extend(hits)
            except Exception as exc:
                logger.warning("[Search] Collection '%s' search failed: %s", col_name, exc)

        # Merge and sort by score across all collections
        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:top_k]
