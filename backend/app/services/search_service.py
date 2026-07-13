"""
Semantic Search Service.

Accepts English natural-language queries, searches ChromaDB collections,
and returns ranked documents with similarity scores.

Design goals:
- Clean abstraction layer over VectorDBService
- Auto-discovers health knowledge collections from indexer
- Supports searching specific collection or all collections
- Scoring, filtering, and re-ranking can be extended here

Usage:
    from app.services.search_service import SearchService
    svc = SearchService.get_instance()
    results = await svc.search(query="fever and headache", collection="common_diseases", top_k=5)
"""

from __future__ import annotations

import logging
from typing import Any

from app.services.indexer import list_knowledge_collections
from app.services.vector_db_service import VectorDBService

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Dynamic collection discovery
# --------------------------------------------------------------------------- #

def _build_available_collections() -> dict[str, str]:
    """
    Build AVAILABLE_COLLECTIONS dict dynamically from discovered health knowledge files.
    Also includes nutrition and schemes collections.
    """
    collections = {}
    
    # Get auto-discovered health knowledge collections
    health_collections = list_knowledge_collections()
    for col_name, description in health_collections.items():
        collections[col_name] = description
    
    # Add special collections
    collections["nutrition"] = "Nutrition information and food guidance"
    collections["schemes"] = "Government health and social schemes"
    collections["all"] = "Search across all available knowledge bases"
    
    return collections


# Initialize available collections
AVAILABLE_COLLECTIONS = _build_available_collections()

# Build list of real collections (excluding "all" virtual collection)
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
            "raw_symptoms": self.metadata.get("raw_symptoms", ""),
            "question_candidates": self.metadata.get("question_candidates", ""),
            "question_candidate_count": self.metadata.get("question_candidate_count", 0),
            "question_issue_count": self.metadata.get("question_issue_count", 0),
            "guidance_text": self.metadata.get("guidance_text", ""),
            "precautions_text": self.metadata.get("precautions_text", ""),
            "first_aid_text": self.metadata.get("first_aid_text", ""),
            "doc_schema": self.metadata.get("doc_schema", ""),
            "urgency": self.metadata.get("urgency", ""),
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

    Dynamically discovers health knowledge collections from healthknowledge/ directory.
    Also searches nutrition and schemes collections.

    Future hooks:
        - Re-ranking with a cross-encoder
        - Query expansion (synonym injection)
        - Language-specific preprocessing
        - Metadata filters (category, severity, language)
    """

    _instance: "SearchService | None" = None

    def __init__(self) -> None:
        self._db = VectorDBService.get_instance()
        # Rebuild available collections on init in case new files were added
        global AVAILABLE_COLLECTIONS, _ALL_REAL_COLLECTIONS
        AVAILABLE_COLLECTIONS = _build_available_collections()
        _ALL_REAL_COLLECTIONS = [k for k in AVAILABLE_COLLECTIONS if k != "all"]

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

    def hybrid_search(
        self,
        query: str,
        collection: str = "all",
        top_k: int = 5,
        bm25_weight: float = 0.3,
        vector_weight: float = 0.7,
    ) -> list[dict[str, Any]]:
        """
        Reciprocal Rank Fusion of BM25 + vector results.

        bm25_weight + vector_weight should equal 1.0.
        BM25 is better for exact disease/drug name matches.
        Vector search is better for symptom/concept queries.
        """
        from app.services.bm25_service import BM25Service

        vector_results = self.search(query, collection, top_k=top_k * 2)
        bm25_results   = BM25Service.get_instance().search(query, collection, top_k=top_k * 2)

        # Build score maps: doc_id → (score, result_dict)
        scores: dict[str, float] = {}
        results_by_id: dict[str, dict] = {}

        # RRF constant k=60 is standard
        K = 60

        for rank, r in enumerate(vector_results):
            doc_id = r["id"]
            scores[doc_id] = scores.get(doc_id, 0.0) + vector_weight * (1.0 / (K + rank + 1))
            results_by_id[doc_id] = r

        for rank, r in enumerate(bm25_results):
            doc_id = r["id"]
            # Normalise BM25 score to [0,1] range relative to top result
            max_bm25 = bm25_results[0]["bm25_score"] if bm25_results else 1.0
            normalised = r["bm25_score"] / max(max_bm25, 1e-9)
            scores[doc_id] = scores.get(doc_id, 0.0) + bm25_weight * (1.0 / (K + rank + 1))
            if doc_id not in results_by_id:
                # BM25 found a doc vector search missed — convert to standard format
                results_by_id[doc_id] = {
                    "id": doc_id,
                    "content": r.get("document", ""),
                    "title": r.get("metadata", {}).get("title", ""),
                    "category": r.get("metadata", {}).get("category", ""),
                    "source": r.get("metadata", {}).get("source", collection),
                    "tags": r.get("metadata", {}).get("tags", []),
                    "raw_symptoms": r.get("metadata", {}).get("raw_symptoms", ""),
                    "question_candidates": r.get("metadata", {}).get("question_candidates", ""),
                    "question_candidate_count": r.get("metadata", {}).get("question_candidate_count", 0),
                    "question_issue_count": r.get("metadata", {}).get("question_issue_count", 0),
                    "guidance_text": r.get("metadata", {}).get("guidance_text", ""),
                    "precautions_text": r.get("metadata", {}).get("precautions_text", ""),
                    "first_aid_text": r.get("metadata", {}).get("first_aid_text", ""),
                    "doc_schema": r.get("metadata", {}).get("doc_schema", ""),
                    "urgency": r.get("metadata", {}).get("urgency", ""),
                    "score": normalised,
                    "distance": 1.0 - normalised,
                    "collection": collection,
                }

        merged = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return [results_by_id[doc_id] for doc_id, _ in merged if doc_id in results_by_id]

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
