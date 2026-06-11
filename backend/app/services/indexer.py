"""
Knowledge Base Indexer.

Loads JSON data files → generates embeddings → stores in ChromaDB.
Called during FastAPI startup.

Design:
  - Uses upsert to prevent duplicate documents on repeated restarts
  - Collections map 1:1 to JSON files
  - Metadata from each JSON entry is preserved in ChromaDB for filtering
  - Future datasets: add an entry to DATA_FILES dict — no other changes needed
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from app.services.vector_db_service import VectorDBService

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Data file registry — add new knowledge bases here
# --------------------------------------------------------------------------- #

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

DATA_FILES: dict[str, str] = {
    "first_aid": "first_aid.json",
    "medical_guidance": "medical_guidance.json",
    "emergency_guidance": "emergency_guidance.json",
}


# --------------------------------------------------------------------------- #
# Indexer
# --------------------------------------------------------------------------- #

def _load_json(filename: str) -> list[dict[str, Any]]:
    path = os.path.join(_DATA_DIR, filename)
    if not os.path.exists(path):
        logger.warning("[Indexer] Data file not found: %s", path)
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def index_knowledge_base(force_reindex: bool = False) -> dict[str, int]:
    """
    Index all knowledge base files into ChromaDB.

    Parameters
    ----------
    force_reindex : if True, deletes and recreates each collection before indexing.
                    Use for schema changes or data updates.
                    Default False — uses upsert (safe for restarts).

    Returns
    -------
    dict mapping collection_name → number of documents indexed.
    """
    db = VectorDBService.get_instance()
    indexed: dict[str, int] = {}

    for collection_name, filename in DATA_FILES.items():
        try:
            entries = _load_json(filename)
            if not entries:
                logger.warning("[Indexer] No entries in %s — skipping.", filename)
                continue

            if force_reindex:
                logger.info("[Indexer] Force reindex: dropping collection '%s'.", collection_name)
                try:
                    db.delete_collection(collection_name)
                except Exception:
                    pass  # Collection might not exist yet

            documents: list[str] = []
            ids: list[str] = []
            metadatas: list[dict[str, Any]] = []

            for entry in entries:
                doc_id = entry.get("id", "")
                content = entry.get("content", "")
                if not doc_id or not content:
                    continue

                # Combine title + content for richer embeddings
                full_text = f"{entry.get('title', '')}. {content}"

                documents.append(full_text)
                ids.append(doc_id)
                metadatas.append(
                    {
                        "title": entry.get("title", ""),
                        "category": entry.get("category", ""),
                        "source": entry.get("source", ""),
                        "tags": ", ".join(entry.get("tags", [])),
                        "collection": collection_name,
                    }
                )

            db.upsert_documents(
                collection_name=collection_name,
                documents=documents,
                ids=ids,
                metadatas=metadatas,
            )

            indexed[collection_name] = len(documents)
            logger.info(
                "[Indexer] Indexed %d documents into '%s'.",
                len(documents),
                collection_name,
            )

        except Exception as exc:
            logger.error("[Indexer] Failed to index '%s': %s", collection_name, exc)
            indexed[collection_name] = 0

    return indexed


def get_index_status() -> dict[str, Any]:
    """Return current document counts for all collections."""
    db = VectorDBService.get_instance()
    status: dict[str, Any] = {}
    for collection_name in DATA_FILES:
        try:
            count = db.collection_count(collection_name)
            status[collection_name] = {"indexed": True, "document_count": count}
        except Exception:
            status[collection_name] = {"indexed": False, "document_count": 0}
    return status
