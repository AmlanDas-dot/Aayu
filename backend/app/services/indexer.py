"""
Knowledge Base Indexer.

Loads JSON data files → generates embeddings → stores in ChromaDB.
Called during FastAPI startup.

Design:
  - Uses upsert to prevent duplicate documents on repeated restarts
  - Collections auto-discovered from healthknowledge/ directory
  - Metadata from each JSON entry is preserved in ChromaDB for filtering
  - Schema detection: "content" key → document schema, "symptoms"/"guidance" → structured schema
  - Add new JSON files to healthknowledge/ directory — indexer picks them up automatically
"""

from __future__ import annotations

import glob
import json
import logging
import os
from typing import Any

from app.services.symptom_dictionary import build_question_candidates
from app.services.vector_db_service import VectorDBService

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Data directory paths
# --------------------------------------------------------------------------- #

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_KNOWLEDGE_DIR = os.path.join(_DATA_DIR, "healthknowledge")


# --------------------------------------------------------------------------- #
# Auto-discovery of knowledge collections
# --------------------------------------------------------------------------- #

def list_knowledge_collections() -> dict[str, str]:
    """
    Discover all JSON files in healthknowledge/ directory.
    
    Returns
    -------
    dict mapping collection_name → friendly_description
    """
    collections = {}
    
    if not os.path.exists(_KNOWLEDGE_DIR):
        logger.warning("[Indexer] Knowledge directory not found: %s", _KNOWLEDGE_DIR)
        return collections
    
    # Find all .json files
    json_files = glob.glob(os.path.join(_KNOWLEDGE_DIR, "*.json"))
    
    for filepath in json_files:
        # Extract collection name from filename (without .json)
        filename = os.path.basename(filepath)
        collection_name = os.path.splitext(filename)[0]
        
        # Build a friendly description from filename
        friendly_desc = collection_name.replace("_", " ").title()
        collections[collection_name] = friendly_desc
    
    return collections


def _load_json(filepath: str) -> list[dict[str, Any]]:
    """Load JSON from file, handling errors gracefully."""
    if not os.path.exists(filepath):
        logger.warning("[Indexer] Data file not found: %s", filepath)
        return []
    try:
        with open(filepath, encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("[Indexer] Failed to load JSON from %s: %s", filepath, exc)
        return []


def _build_doc(entry: dict[str, Any], collection_name: str) -> tuple[str | None, str, dict[str, Any]]:
    """
    Build a document from an entry, detecting schema automatically.
    
    Supports two schemas:
    1. "document" schema: {id, title, category, content, tags, source, ...}
    2. "structured" schema: {id, category, symptoms, guidance, precautions, urgency, [first_aid], ...}
    
    Returns (doc_id, full_text, metadata) or (None, "", {}) if document invalid.
    """
    doc_id = entry.get("id", "")
    if not doc_id:
        return None, "", {}
    
    # Detect schema: "content" key = document schema, otherwise = structured
    if "content" in entry:
        # Document schema
        title = entry.get("title", "")
        content = entry.get("content", "")
        category = entry.get("category", "")
        tags = entry.get("tags", [])
        source = entry.get("source", "")
        urgency = entry.get("urgency", "")
        question_candidates, candidate_issues = build_question_candidates(
            [str(tag) for tag in tags] if isinstance(tags, list) else [str(tags)]
        )
        
        # Build rich text for embedding
        full_text = f"{title}. {content}"
        
        metadata = {
            "title": title,
            "category": category,
            "source": source,
            "tags": ", ".join(tags) if tags else "",
            "question_candidates": " || ".join(question_candidates),
            "raw_symptoms": " || ".join(str(tag) for tag in tags) if tags else "",
            "question_candidate_count": len(question_candidates),
            "question_issue_count": len(candidate_issues),
            "doc_schema": "document",
            "urgency": urgency,
            "collection": collection_name,
        }
    else:
        # Structured schema: medical/health guidance
        category = entry.get("category", "")
        symptoms = entry.get("symptoms", [])
        guidance = entry.get("guidance", "")
        precautions = entry.get("precautions", [])
        urgency = entry.get("urgency", "")
        first_aid = entry.get("first_aid", "")
        question_candidates, candidate_issues = build_question_candidates(
            [str(symptom) for symptom in symptoms]
        )
        
        # Build rich text for embedding
        symptoms_text = ". ".join(symptoms) if symptoms else ""
        candidate_text = ". ".join(question_candidates) if question_candidates else symptoms_text
        precautions_text = ". ".join(precautions) if precautions else ""
        full_text = (
            f"{category}. Symptoms: {symptoms_text}. "
            f"Observable findings: {candidate_text}. "
            f"Guidance: {guidance}. Precautions: {precautions_text}."
        )
        if first_aid:
            full_text += f" First Aid: {first_aid}."
        
        metadata = {
            "title": category,
            "category": category,
            "source": "AAYU Health Knowledge Base",
            "tags": ", ".join(question_candidates[:5]) if question_candidates else ", ".join(symptoms[:3]),
            "raw_symptoms": " || ".join(symptoms),
            "question_candidates": " || ".join(question_candidates),
            "question_candidate_count": len(question_candidates),
            "question_issue_count": len(candidate_issues),
            "guidance_text": guidance,
            "precautions_text": " || ".join(precautions),
            "first_aid_text": first_aid,
            "doc_schema": "structured",
            "urgency": urgency,
            "collection": collection_name,
        }
    
    return doc_id, full_text, metadata


# --------------------------------------------------------------------------- #
# Main indexing functions
# --------------------------------------------------------------------------- #

def index_knowledge_base(force_reindex: bool = False) -> dict[str, int]:
    """
    Auto-discover and index all knowledge base files from healthknowledge/ directory.

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
    
    # Auto-discover collections
    collections = list_knowledge_collections()
    logger.info("[Indexer] Discovered %d health knowledge collections.", len(collections))
    
    for collection_name in collections:
        try:
            filepath = os.path.join(_KNOWLEDGE_DIR, f"{collection_name}.json")
            entries = _load_json(filepath)
            
            if not entries:
                logger.warning("[Indexer] No entries in %s — skipping.", collection_name)
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
            seen_ids: set[str] = set()
            
            for entry in entries:
                result = _build_doc(entry, collection_name)
                if result is None:
                    continue
                doc_id, full_text, metadata = result
                if not doc_id or not full_text:
                    continue

                # ── Dedup: prefix with collection name to guarantee uniqueness ──
                safe_id = f"{collection_name}__{doc_id}"
                if safe_id in seen_ids:
                    logger.warning(
                        "[Indexer] Duplicate ID '%s' in '%s' — skipping duplicate.",
                        doc_id, collection_name,
                    )
                    continue
                seen_ids.add(safe_id)
                
                documents.append(full_text)
                ids.append(safe_id)
                metadatas.append(metadata)
            
            if not documents:
                logger.warning("[Indexer] No valid documents in %s.", collection_name)
                continue
            
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
    db = VectorDBService.get_instance()
    indexed: dict[str, int] = {}

    # -- Nutrition (auto-discover all *.json files in nutrition/) ─────────────
    nutrition_dir = os.path.join(_DATA_DIR, "nutrition")
    try:
        import glob as _glob
        nutrition_files = sorted(_glob.glob(os.path.join(nutrition_dir, "*.json")))
        if not nutrition_files:
            logger.warning("[Indexer] No nutrition files in %s — skipping.", nutrition_dir)
            indexed["nutrition"] = 0
        else:
            if force_reindex:
                try:
                    db.delete_collection("nutrition")
                except Exception:
                    pass

            documents, ids, metas = [], [], []
            seen_ids: set[str] = set()

            for nf in nutrition_files:
                source_name = os.path.splitext(os.path.basename(nf))[0]
                with open(nf, encoding="utf-8") as f:
                    items = json.load(f)

                for item in items:
                    item_id = str(item.get("id", ""))
                    if not item_id:
                        continue

                    # Prefix with filename to guarantee uniqueness across files
                    safe_id = f"nutrition__{source_name}__{item_id}"
                    if safe_id in seen_ids:
                        continue
                    seen_ids.add(safe_id)

                    # Schema 1: disease-diet mapping {disease, recommended_foods, avoid_foods}
                    if "disease" in item:
                        disease = item.get("disease", "")
                        rec = item.get("recommended_foods", [])
                        avoid = item.get("avoid_foods", [])
                        guidance = item.get("guidance", "")
                        doc_text = (
                            f"Nutrition for {disease}. "
                            f"Recommended: {', '.join(rec)}. "
                            f"Avoid: {', '.join(avoid)}. "
                            f"Guidance: {guidance}"
                        )
                        title = f"Diet for {disease}"
                        tags = ", ".join(rec[:5])

                    # Schema 2: pregnancy nutrition {category, focus, recommended_foods}
                    elif "focus" in item:
                        category = item.get("category", "")
                        focus = item.get("focus", "")
                        rec = item.get("recommended_foods", [])
                        avoid = item.get("avoid_foods", [])
                        guidance = item.get("guidance", "")
                        doc_text = (
                            f"Pregnancy nutrition — {category}: {focus}. "
                            f"Recommended: {', '.join(rec)}. "
                            f"Avoid: {', '.join(avoid)}. {guidance}"
                        )
                        title = f"Pregnancy: {category}"
                        tags = ", ".join(rec[:5])

                    # Schema 3: food item {name, nutrients, benefits, good_for}
                    else:
                        name = item.get("name", item_id.replace("_", " ").title())
                        nutrients = item.get("nutrients", {})
                        benefits = item.get("benefits", [])
                        good_for = item.get("good_for", [])
                        best_time = item.get("best_time", "")
                        nutrient_str = (
                            ", ".join(f"{k}: {v}" for k, v in nutrients.items())
                            if isinstance(nutrients, dict) else str(nutrients)
                        )
                        doc_text = (
                            f"{name}. Nutrients: {nutrient_str}. "
                            f"Benefits: {', '.join(benefits)}. "
                            f"Good for: {', '.join(good_for)}. "
                            f"Best time to eat: {best_time}."
                        )
                        title = name
                        tags = ", ".join(good_for[:5])

                    documents.append(doc_text)
                    ids.append(safe_id)
                    metas.append({
                        "title": title,
                        "category": source_name,
                        "source": "AAYU Nutrition",
                        "tags": tags,
                        "urgency": item.get("urgency", "low"),
                        "collection": "nutrition",
                    })

            if documents:
                db.upsert_documents("nutrition", documents, ids, metas)
                logger.info("[Indexer] Upserted %d nutrition entries.", len(documents))
            indexed["nutrition"] = len(documents)

    except Exception as exc:
        logger.error("[Indexer] Failed to index nutrition: %s", exc)
        indexed["nutrition"] = 0

    # -- Schemes (auto-discover all *.json files in schemes/) ────────────────
    schemes_dir = os.path.join(_DATA_DIR, "schemes")
    try:
        import glob as _glob
        scheme_files = sorted(_glob.glob(os.path.join(schemes_dir, "*.json")))
        if not scheme_files:
            logger.warning("[Indexer] No scheme files found in %s — skipping.", schemes_dir)
            indexed["schemes"] = 0
        else:
            if force_reindex:
                try:
                    db.delete_collection("schemes")
                except Exception:
                    pass

            documents, ids, metas = [], [], []
            for sf in scheme_files:
                with open(sf, encoding="utf-8") as f:
                    schemes = json.load(f)
                source_name = os.path.splitext(os.path.basename(sf))[0]
                for scheme in schemes:
                    name = scheme.get("name", "")
                    if not name:
                        continue
                    doc_text = (
                        f"{name}. State: {scheme.get('state', '')}. "
                        f"Category: {scheme.get('category', '')}. "
                        f"{scheme.get('description', '')} "
                        f"Eligibility: {scheme.get('eligibility', '')}. "
                        f"Benefits: {scheme.get('benefits', '')}."
                    )
                    doc_id = f"scheme_{name.lower().replace(' ', '_').replace('(','').replace(')','')[:50]}"
                    documents.append(doc_text)
                    ids.append(doc_id)
                    metas.append({
                        "title": name,
                        "category": scheme.get("state", ""),
                        "source": source_name,
                        "tags": scheme.get("category", ""),
                        "collection": "schemes",
                    })

            if documents:
                db.upsert_documents("schemes", documents, ids, metas)
                logger.info("[Indexer] Upserted %d schemes into 'schemes'.", len(documents))
            indexed["schemes"] = len(documents)

    except Exception as exc:
        logger.error("[Indexer] Failed to index schemes: %s", exc)
        indexed["schemes"] = 0

    return indexed


def get_index_status() -> dict[str, Any]:
    """Return current document counts for all collections (health KB + nutrition + schemes)."""
    db = VectorDBService.get_instance()
    status: dict[str, Any] = {}
    
    # Get status of auto-discovered health knowledge collections
    all_collections = list(list_knowledge_collections().keys()) + ["nutrition", "schemes"]
    
    for collection_name in all_collections:
        try:
            count = db.collection_count(collection_name)
            status[collection_name] = {"indexed": True, "document_count": count}
        except Exception:
            status[collection_name] = {"indexed": False, "document_count": 0}
    
    return status
