"""
Search API Router.

Endpoints:
    GET  /search?q=<query>&collection=<name>&top_k=<n>
    POST /search
    GET  /search/collections  — collection metadata
    GET  /search/status       — vector DB health + diagnostics
"""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.search_service import SearchService, AVAILABLE_COLLECTIONS
from app.services.indexer import get_index_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


# --------------------------------------------------------------------------- #
# Request / Response models
# --------------------------------------------------------------------------- #

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Search query in English")
    collection: str = Field(default="all", description="Collection to search: all | first_aid | medical_guidance | emergency_guidance")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of results to return")
    min_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Minimum similarity score threshold")


class SearchResultItem(BaseModel):
    id: str
    content: str
    title: str
    category: str
    source: str
    tags: Any
    score: float
    distance: float
    collection: str


class SearchResponse(BaseModel):
    query: str
    collection: str
    total_results: int
    results: list[SearchResultItem]
    message: str = ""


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #

@router.get("", response_model=SearchResponse, summary="Semantic search via query string")
async def search_get(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    collection: str = Query(default="all", description="Collection name or 'all'"),
    top_k: int = Query(default=5, ge=1, le=20, description="Max results"),
    min_score: float = Query(default=0.0, ge=0.0, le=1.0, description="Min similarity score"),
) -> SearchResponse:
    """
    GET /search?q=fever+headache&collection=all&top_k=5

    Returns semantically matched documents ranked by cosine similarity.
    """
    return await _perform_search(q, collection, top_k, min_score)


@router.post("", response_model=SearchResponse, summary="Semantic search via request body")
async def search_post(body: SearchRequest) -> SearchResponse:
    """
    POST /search

    Same as GET but accepts a JSON request body — preferred for longer queries.
    """
    return await _perform_search(
        body.query, body.collection, body.top_k, body.min_score
    )


@router.get("/collections", summary="List available knowledge collections")
async def list_collections() -> dict[str, Any]:
    """Return metadata about all available search collections."""
    svc = SearchService.get_instance()
    collections = svc.get_collections()
    return {
        "collections": collections,
        "available_names": list(AVAILABLE_COLLECTIONS.keys()),
    }


@router.get("/status", summary="Vector database health and diagnostics")
async def vector_db_status() -> dict[str, Any]:
    """
    GET /search/status

    Returns comprehensive diagnostics for the vector database:
      - Collection names and document counts
      - Embedding model in use
      - ChromaDB storage path
      - Overall health status
    """
    from app.services.vector_db_service import VectorDBService, _CHROMA_PATH, _EMBEDDING_MODEL

    status = "ok"
    collections_info: dict[str, Any] = {}
    document_counts: dict[str, int] = {}
    total_docs = 0

    try:
        db = VectorDBService.get_instance()
        index_status = get_index_status()

        for col_name, col_info in index_status.items():
            count = col_info.get("document_count", 0)
            document_counts[col_name] = count
            total_docs += count
            collections_info[col_name] = {
                "indexed": col_info.get("indexed", False),
                "document_count": count,
                "status": "ready" if count > 0 else "empty",
            }

        chroma_path = os.path.abspath(_CHROMA_PATH)

    except Exception as exc:
        logger.error("[Search Status] Failed to retrieve status: %s", exc)
        status = "error"
        chroma_path = "unknown"
        collections_info = {}
        document_counts = {}

    return {
        "status": status,
        "collections": collections_info,
        "document_counts": document_counts,
        "total_documents": total_docs,
        "embedding_model": _EMBEDDING_MODEL,
        "database_path": chroma_path,
        "available_collections": list(AVAILABLE_COLLECTIONS.keys()),
    }


# --------------------------------------------------------------------------- #
# Internal helper
# --------------------------------------------------------------------------- #

async def _perform_search(
    query: str, collection: str, top_k: int, min_score: float
) -> SearchResponse:
    if collection not in AVAILABLE_COLLECTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown collection '{collection}'. Available: {list(AVAILABLE_COLLECTIONS.keys())}",
        )

    try:
        svc = SearchService.get_instance()
        results = svc.search(
            query=query,
            collection=collection,
            top_k=top_k,
            min_score=min_score,
        )

        items = [SearchResultItem(**r) for r in results]
        msg = "" if items else "No relevant documents found. Try broadening your query."

        return SearchResponse(
            query=query,
            collection=collection,
            total_results=len(items),
            results=items,
            message=msg,
        )

    except Exception as exc:
        logger.error("[Search API] Error: %s", exc)
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")
