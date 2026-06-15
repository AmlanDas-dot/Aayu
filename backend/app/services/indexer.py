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


def index_nutrition_and_schemes(force_reindex: bool = False) -> dict[str, int]:
    """
    Index nutrition foods and government schemes into ChromaDB.

    Nutrition foods -> collection 'nutrition'
    Government schemes -> collection 'schemes'

    Both datasets use a different schema from the medical knowledge base,
    so they are handled separately from index_knowledge_base().
    """
    import os as _os
    db = VectorDBService.get_instance()
    indexed: dict[str, int] = {}

    # ── Nutrition ──────────────────────────────────────────────────────────
    nutrition_path = _os.path.join(_DATA_DIR, "nutrition", "foods.json")
    try:
        with open(nutrition_path, encoding="utf-8") as f:
            import json as _json
            foods = _json.load(f)

        if force_reindex:
            try:
                db.delete_collection("nutrition")
            except Exception:
                pass

        documents: list[str] = []
        ids: list[str] = []
        metadatas: list[dict] = []

        for food in foods:
            name = food.get("name", "")
            if not name:
                continue
            # Build a rich text document for embedding
            good_for = ", ".join(food.get("good_for", []))
            rich_in  = ", ".join(food.get("rich_in", []))
            doc_text = (
                f"{name}. Category: {food.get('category', '')}. "
                f"Rich in: {rich_in}. Good for: {good_for}. "
                f"Avoid if: {', '.join(food.get('avoid_if', []))}."
            )
            doc_id = f"nutrition_{name.lower().replace(' ', '_').replace('(', '').replace(')', '')[:40]}"
            documents.append(doc_text)
            ids.append(doc_id)
            metadatas.append({
                "title": name,
                "category": food.get("category", ""),
                "source": "AAYU Nutrition Database",
                "tags": rich_in,
                "collection": "nutrition",
            })

        if documents:
            db.upsert_documents("nutrition", documents, ids, metadatas)
            logger.info("[Indexer] Upserted %d food items into 'nutrition'.", len(documents))
        indexed["nutrition"] = len(documents)

    except FileNotFoundError:
        logger.warning("[Indexer] Nutrition data not found at %s — skipping.", nutrition_path)
        indexed["nutrition"] = 0
    except Exception as exc:
        logger.error("[Indexer] Failed to index nutrition: %s", exc)
        indexed["nutrition"] = 0

    # ── Schemes ────────────────────────────────────────────────────────────
    schemes_path = _os.path.join(_DATA_DIR, "schemes", "schemes.json")
    try:
        with open(schemes_path, encoding="utf-8") as f:
            import json as _json
            schemes = _json.load(f)

        if force_reindex:
            try:
                db.delete_collection("schemes")
            except Exception:
                pass

        documents = []
        ids = []
        metadatas = []

        for scheme in schemes:
            name = scheme.get("name", "")
            if not name:
                continue
            doc_text = (
                f"{name}. State: {scheme.get('state', '')}. "
                f"{scheme.get('description', '')} "
                f"Eligibility: {scheme.get('eligibility', '')}. "
                f"Benefits: {scheme.get('benefits', '')}."
            )
            doc_id = f"scheme_{name.lower().replace(' ', '_').replace('(', '').replace(')', '')[:40]}"
            documents.append(doc_text)
            ids.append(doc_id)
            metadatas.append({
                "title": name,
                "category": scheme.get("state", ""),
                "source": "AAYU Government Schemes Database",
                "tags": scheme.get("state", ""),
                "collection": "schemes",
            })

        if documents:
            db.upsert_documents("schemes", documents, ids, metadatas)
            logger.info("[Indexer] Upserted %d schemes into 'schemes'.", len(documents))
        indexed["schemes"] = len(documents)

    except FileNotFoundError:
        logger.warning("[Indexer] Schemes data not found at %s — skipping.", schemes_path)
        indexed["schemes"] = 0
    except Exception as exc:
        logger.error("[Indexer] Failed to index schemes: %s", exc)
        indexed["schemes"] = 0

    return indexed


def get_index_status() -> dict[str, Any]:
    """Return current document counts for all collections (medical KB + nutrition + schemes)."""
    db = VectorDBService.get_instance()
    status: dict[str, Any] = {}
    all_collections = list(DATA_FILES.keys()) + ["nutrition", "schemes"]
    for collection_name in all_collections:
        try:
            count = db.collection_count(collection_name)
            status[collection_name] = {"indexed": True, "document_count": count}
        except Exception:
            status[collection_name] = {"indexed": False, "document_count": 0}
    return status
