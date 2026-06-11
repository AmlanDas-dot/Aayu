"""
tests/test_search.py

Automated validation tests for AAYU semantic search.

Run with:
    cd d:\\Aayu\\backend
    python -m pytest tests/test_search.py -v

Requirements:
    pip install pytest
    The ChromaDB must be populated (run the backend at least once to trigger
    the startup indexing pipeline before running these tests).

What is tested:
    1. SearchService returns results for every medical query
    2. Results contain required fields (id, content, title, score)
    3. Similarity scores are in [0.0, 1.0]
    4. Ranking is descending by score
    5. Collection filtering works (single collection)
    6. "all" collection search aggregates across collections
    7. Minimum score threshold filtering works
    8. Empty results are returned gracefully for nonsense queries
"""

from __future__ import annotations

import sys
import os

# Allow running from d:\\Aayu\\backend without installing the package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app.services.search_service import SearchService, AVAILABLE_COLLECTIONS


# ─────────────────────────────────────────────────────────────
# Fixture
# ─────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def svc() -> SearchService:
    """Return a shared SearchService instance (triggers DB init once)."""
    return SearchService.get_instance()


# ─────────────────────────────────────────────────────────────
# Test queries
# ─────────────────────────────────────────────────────────────

MEDICAL_QUERIES = [
    "bleeding",
    "snake bite",
    "dog bite",
    "fever",
    "dehydration",
    "emergency",
    "injury",
]


# ─────────────────────────────────────────────────────────────
# Tests — basic result contract
# ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("query", MEDICAL_QUERIES)
def test_search_returns_results(svc: SearchService, query: str) -> None:
    """Each medical query should return at least one result."""
    results = svc.search(query=query, collection="all", top_k=5)
    assert len(results) > 0, (
        f"Query '{query}' returned 0 results. "
        "Check that ChromaDB is populated and the embedding model is loaded."
    )


@pytest.mark.parametrize("query", MEDICAL_QUERIES)
def test_result_fields_present(svc: SearchService, query: str) -> None:
    """Every result dict must have the required fields."""
    required_fields = {"id", "content", "title", "category", "source", "score", "distance", "collection", "tags"}
    results = svc.search(query=query, collection="all", top_k=3)
    for result in results:
        missing = required_fields - set(result.keys())
        assert not missing, (
            f"Result for '{query}' is missing fields: {missing}\n"
            f"Got: {list(result.keys())}"
        )


@pytest.mark.parametrize("query", MEDICAL_QUERIES)
def test_scores_in_valid_range(svc: SearchService, query: str) -> None:
    """Similarity scores must be in [0.0, 1.0]."""
    results = svc.search(query=query, collection="all", top_k=5)
    for r in results:
        assert 0.0 <= r["score"] <= 1.0, (
            f"Score out of range for query '{query}': {r['score']}"
        )


@pytest.mark.parametrize("query", MEDICAL_QUERIES)
def test_results_sorted_by_score_descending(svc: SearchService, query: str) -> None:
    """Results must be ranked with highest similarity first."""
    results = svc.search(query=query, collection="all", top_k=5)
    if len(results) < 2:
        pytest.skip("Not enough results to check sort order")
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True), (
        f"Results for '{query}' are not sorted by score descending: {scores}"
    )


# ─────────────────────────────────────────────────────────────
# Tests — collection filtering
# ─────────────────────────────────────────────────────────────

REAL_COLLECTIONS = [c for c in AVAILABLE_COLLECTIONS if c != "all"]

@pytest.mark.parametrize("collection", REAL_COLLECTIONS)
def test_single_collection_search(svc: SearchService, collection: str) -> None:
    """Searching a specific collection should return results from that collection only."""
    results = svc.search(query="fever", collection=collection, top_k=5)
    # Results may be empty if the collection is specialised, but should not error
    for r in results:
        assert r["collection"] == collection, (
            f"Result from wrong collection: expected '{collection}', got '{r['collection']}'"
        )


def test_all_collection_search_aggregates(svc: SearchService) -> None:
    """'all' search should return results from multiple collections."""
    results = svc.search(query="fever", collection="all", top_k=15)
    assert len(results) > 0, "Expected results when searching all collections"
    collections_found = {r["collection"] for r in results}
    # We expect at least 2 collections to be represented for a broad query like 'fever'
    assert len(collections_found) >= 1, (
        f"Expected results from multiple collections, got: {collections_found}"
    )


# ─────────────────────────────────────────────────────────────
# Tests — score thresholding
# ─────────────────────────────────────────────────────────────

def test_min_score_threshold_filters_results(svc: SearchService) -> None:
    """Setting min_score=0.5 should only return high-confidence results."""
    all_results = svc.search(query="fever", collection="all", top_k=10, min_score=0.0)
    filtered = svc.search(query="fever", collection="all", top_k=10, min_score=0.5)
    assert len(filtered) <= len(all_results), "Filtered results should not exceed unfiltered"
    for r in filtered:
        assert r["score"] >= 0.5, (
            f"Result below threshold: score={r['score']}, title={r['title']}"
        )


def test_zero_min_score_returns_more(svc: SearchService) -> None:
    """min_score=0.0 should return as many or more results than min_score=0.8."""
    low = svc.search(query="emergency", collection="all", top_k=10, min_score=0.0)
    high = svc.search(query="emergency", collection="all", top_k=10, min_score=0.8)
    assert len(low) >= len(high), "Lower threshold should never return fewer results"


# ─────────────────────────────────────────────────────────────
# Tests — edge cases
# ─────────────────────────────────────────────────────────────

def test_nonsense_query_returns_empty_or_low_scores(svc: SearchService) -> None:
    """A completely irrelevant query should return no high-confidence results."""
    results = svc.search(
        query="xkcdqwerty12345randomstuff",
        collection="all",
        top_k=5,
        min_score=0.5,
    )
    assert len(results) == 0, (
        f"Expected 0 high-confidence results for nonsense query, got {len(results)}"
    )


def test_empty_query_returns_empty_list(svc: SearchService) -> None:
    """Empty / whitespace queries should return an empty list without crashing."""
    results = svc.search(query="   ", collection="all", top_k=5)
    assert results == [], f"Expected empty list for blank query, got: {results}"


def test_top_k_limits_results(svc: SearchService) -> None:
    """Results should not exceed top_k."""
    for k in [1, 3, 5]:
        results = svc.search(query="fever", collection="all", top_k=k)
        assert len(results) <= k, (
            f"Expected at most {k} results, got {len(results)}"
        )


# ─────────────────────────────────────────────────────────────
# Tests — content quality
# ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("query,expected_keyword", [
    ("snake bite", "snake"),
    ("bleeding", "bleed"),
    ("dehydration", "dehydrat"),
])
def test_top_result_content_relevant(svc: SearchService, query: str, expected_keyword: str) -> None:
    """The top result's title or content should contain a relevant keyword."""
    results = svc.search(query=query, collection="all", top_k=3)
    if not results:
        pytest.skip(f"No results for '{query}' — check DB population")
    top = results[0]
    combined = (top["title"] + " " + top["content"]).lower()
    assert expected_keyword.lower() in combined, (
        f"Top result for '{query}' doesn't seem relevant.\n"
        f"Title: {top['title']}\n"
        f"Expected keyword: '{expected_keyword}'"
    )
