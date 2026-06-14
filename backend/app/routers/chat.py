"""
Chat Router — Sprint 2.

POST /chat

Executes the full pipeline:
    User text (+ optional language)
        → Translation (if non-English)
        → Semantic Search (ChromaDB)
        → Rule-Based Triage Engine
        → Template Response Service
        → Structured JSON response

No LLM. No Ollama. No external API calls.
Everything runs locally.

Request:
    {
        "message": "Someone got bitten by a snake",
        "language": "en"          // optional, default "en"
    }

Response:
    {
        "risk_level": "emergency",
        "retrieved_documents": [...],
        "response": "...",
        "confidence": 1.0,
        "matched_rules": [...],
        "disclaimer": "..."
    }
"""

from __future__ import annotations

import logging
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rule_based_triage import get_triage_engine
from app.services.response_service import get_response_service
from app.services.search_service import SearchService
from app.services.translation_service import translate_to_english

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


# --------------------------------------------------------------------------- #
# Request / Response models
# --------------------------------------------------------------------------- #

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="User's health query (any supported language)",
    )
    language: str = Field(
        default="en",
        description="BCP-47 language code: en | hi | gu | or",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Max knowledge-base documents to retrieve",
    )
    collection: str = Field(
        default="all",
        description="ChromaDB collection to search",
    )


class RetrievedDocument(BaseModel):
    title: str
    content: str
    score: float
    collection: str
    category: str
    source: str


class ChatResponse(BaseModel):
    risk_level: str                      # "emergency" | "urgent" | "routine"
    response: str                        # Formatted guidance text
    retrieved_documents: list[RetrievedDocument]
    confidence: float
    matched_rules: list[str]
    original_message: str
    english_message: str
    processing_time_ms: int
    disclaimer: str


# --------------------------------------------------------------------------- #
# Endpoint
# --------------------------------------------------------------------------- #

@router.post("/chat", response_model=ChatResponse, summary="Full health pipeline")
async def chat(body: ChatRequest) -> ChatResponse:
    """
    Execute the complete AAYU health pipeline:

    1. Translate (if non-English)
    2. Semantic search across knowledge base
    3. Rule-based triage classification
    4. Template response generation

    No LLM, no external APIs — fully local.
    """
    t_start = time.time()

    # ── Step 1: Translation ──────────────────────────────────────────────────
    original_message = body.message.strip()
    english_message  = original_message

    if body.language and body.language != "en":
        try:
            english_message = translate_to_english(original_message, body.language)
            logger.info(
                "[Chat] Translated (%s→en): '%s' → '%s'",
                body.language, original_message[:60], english_message[:60],
            )
        except Exception as exc:
            logger.warning(
                "[Chat] Translation failed (%s), using original text. Error: %s",
                body.language, exc,
            )
            english_message = original_message  # Graceful fallback

    # ── Step 2: Semantic Search ──────────────────────────────────────────────
    search_results: list[dict] = []
    try:
        svc = SearchService.get_instance()
        search_results = svc.search(
            query=english_message,
            collection=body.collection,
            top_k=body.top_k,
        )
        logger.info("[Chat] Search returned %d documents.", len(search_results))
    except Exception as exc:
        logger.error("[Chat] Search failed: %s", exc)
        # Continue without search results — triage + fallback response still works

    # ── Step 3: Rule-Based Triage ────────────────────────────────────────────
    try:
        engine = get_triage_engine()
        triage = engine.assess(english_message)
        logger.info(
            "[Chat] Triage → %s (rules: %s)",
            triage.risk_level, triage.matched_rules,
        )
    except Exception as exc:
        logger.error("[Chat] Triage failed: %s", exc)
        raise HTTPException(status_code=500, detail="Triage classification failed.")

    # ── Step 4: Response Generation ──────────────────────────────────────────
    try:
        response_svc = get_response_service()
        health_resp = response_svc.format_response(
            query=english_message,
            triage=triage.to_dict(),
            context_chunks=search_results,
        )
    except Exception as exc:
        logger.error("[Chat] Response formatting failed: %s", exc)
        raise HTTPException(status_code=500, detail="Response generation failed.")

    # ── Build API response ───────────────────────────────────────────────────
    processing_time_ms = round((time.time() - t_start) * 1000)
    resp_dict = health_resp.to_dict()

    logger.info(
        "[Chat] Done in %d ms — risk=%s, docs=%d",
        processing_time_ms,
        resp_dict["risk_level"],
        len(resp_dict["retrieved_documents"]),
    )

    return ChatResponse(
        risk_level=resp_dict["risk_level"],
        response=resp_dict["response"],
        retrieved_documents=[
            RetrievedDocument(**doc) for doc in resp_dict["retrieved_documents"]
        ],
        confidence=resp_dict["confidence"],
        matched_rules=resp_dict["matched_rules"],
        original_message=original_message,
        english_message=english_message,
        processing_time_ms=processing_time_ms,
        disclaimer=resp_dict["disclaimer"],
    )
