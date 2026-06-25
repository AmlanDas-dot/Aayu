"""
AAYU Backend — FastAPI entry point.

Startup pipeline:
  1. Initialise ChromaDB (creates persistent storage if not exists)
  2. Load JSON knowledge base files
  3. Generate embeddings with all-MiniLM-L6-v2
  4. Upsert into ChromaDB (idempotent — safe for restarts)

GPU memory note — lazy-loaded services (zero VRAM at startup):
  • IndicTrans2: loaded on first non-English transcription

Services loaded at startup (minimal VRAM):
  • all-MiniLM-L6-v2 embedding model (≈0.1 GB — runs on CPU)
  • NutritionService (JSON file — negligible RAM)
  • SchemesService   (JSON file — negligible RAM)

Future architecture plug-in points:
  Voice → STT → IndicTrans2 → ChromaDB → Triage Engine → Ollama → Response
"""

import logging
import time

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

#========================REMOVE THIS==============================#
print("=" * 60)
print("Loaded .env from:", BASE_DIR / ".env")
print("SARVAM_API_KEY:", os.getenv("SARVAM_API_KEY"))
print("=" * 60)
#========================REMOVE THIS==============================#

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.transcribe import router as transcribe_router
from app.routers.search import router as search_router
from app.routers.chat import router as chat_router
from app.routers.nutrition import router as nutrition_router
from app.routers.schemes import router as schemes_router
from app.routers.hospitals import router as hospitals_router
import httpx

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


# --------------------------------------------------------------------------- #
# Startup — index knowledge base
# --------------------------------------------------------------------------- #

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: initialise ChromaDB and index knowledge base.
    Shutdown: nothing to clean up (ChromaDB handles persistence).
    """
    _banner("AAYU Backend Starting")

    t_start = time.time()

    # ── Vector DB + Embedding Model ─────────────────────────────────────────
    logger.info("┌─ Vector Database")
    try:
        from app.services.vector_db_service import VectorDBService
        VectorDBService.get_instance()  # triggers ChromaDB init + model load
        logger.info("│  ✓ ChromaDB initialised")
        logger.info("│  ✓ BAAI/bge-small-en-v1.5 embedding model loaded")
    except Exception as exc:
        logger.error("│  ✗ Vector DB init failed: %s", exc)
    logger.info("└──────────────────────────────")

    # ── Knowledge Base Indexing ──────────────────────────────────────────────
    logger.info("┌─ Knowledge Base")
    try:
        from app.services.indexer import index_knowledge_base
        indexed = index_knowledge_base(force_reindex=True)  # temporary — change back to False after first successful run
        total = sum(indexed.values())
        for col, count in indexed.items():
            logger.info("│  ✓ %-28s %d docs", col, count)
        logger.info("│  ─────────────────────────────")
        logger.info("│  Total documents indexed: %d", total)
    except Exception as exc:
        logger.error("│  ✗ Indexing failed: %s", exc)
    logger.info("└──────────────────────────────")

    # ── Nutrition & Schemes Indexing ─────────────────────────────────────────
    logger.info("┌─ Nutrition & Schemes")
    try:
        from app.services.indexer import index_nutrition_and_schemes
        from app.services.nutrition_service import NutritionService
        from app.services.schemes_service import SchemesService
        ns_indexed = index_nutrition_and_schemes(force_reindex=False)
        for col, count in ns_indexed.items():
            logger.info("│  ✓ %-28s %d docs", col, count)
        n_svc = NutritionService.get_instance()
        s_svc = SchemesService.get_instance()
        logger.info("│  ✓ NutritionService (%d foods) SchemesService (%d schemes)", n_svc.count, s_svc.count)
    except Exception as exc:
        logger.error("│  ✗ Nutrition/Schemes init failed: %s", exc)
    logger.info("└──────────────────────────────")

    # ── BM25 Index ───────────────────────────────────────────────────────────
    logger.info("┌─ BM25 Keyword Index")
    try:
        from app.services.bm25_service import BM25Service
        bm25 = BM25Service.get_instance()
        logger.info("│  ✓ BM25 indexes built for %d collections", len(bm25._indexes))
    except Exception as exc:
        logger.error("│  ✗ BM25 init failed: %s", exc)
    logger.info("└──────────────────────────────")

    # ── Lazy-Loaded Services ─────────────────────────────────────────────────
    logger.info("┌─ Lazy-Loaded Services (zero VRAM until first request)")
    logger.info("│  ◌ IndicTrans2 .......... loads on first non-English audio")
    logger.info("└──────────────────────────────")

    elapsed = round(time.time() - t_start, 2)
    _banner(f"AAYU Backend Ready  ({elapsed}s)")

    yield

    logger.info("=" * 44)
    logger.info("  AAYU Backend shutting down.")
    logger.info("=" * 44)


def _banner(title: str) -> None:
    """Print a clean section banner to the log."""
    bar = "=" * 44
    logger.info(bar)
    logger.info("  %s", title)
    logger.info(bar)


# --------------------------------------------------------------------------- #
# App
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="AAYU Backend",
    description=(
        "Multilingual rural healthcare assistant API. "
        "Provides voice transcription, semantic search, and health guidance."
    ),
    version="0.3.0",
    lifespan=lifespan,
)


# --------------------------------------------------------------------------- #
# CORS — allow Vite dev server and production origins
# --------------------------------------------------------------------------- #

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev
        "http://localhost:3000",   # Alternative dev port
        "http://localhost:4173",   # Vite preview
        "http://localhost:5174",   # Vite dev alternate
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Routers
# --------------------------------------------------------------------------- #

app.include_router(transcribe_router)
app.include_router(search_router)
app.include_router(chat_router)
app.include_router(nutrition_router)
app.include_router(schemes_router)
app.include_router(hospitals_router)


# --------------------------------------------------------------------------- #
# Health check
# --------------------------------------------------------------------------- #

@app.get("/", tags=["health"])
def root():
    return {
        "status": "running",
        "service": "AAYU Backend",
        "version": "0.4.0",
        "endpoints": {
            "chat": "POST /chat",
            "transcribe": "POST /transcribe",
            "search_get": "GET /search?q=",
            "search_post": "POST /search",
            "search_collections": "GET /search/collections",
            "search_status": "GET /search/status",
            "nutrition_all": "GET /nutrition",
            "nutrition_search": "GET /nutrition/search?q=",
            "nutrition_food": "GET /nutrition/food/{name}",
            "nutrition_diet": "GET /nutrition/diet-plan/{goal}",
            "schemes_all": "GET /schemes",
            "schemes_search": "GET /schemes/search?q=",
            "schemes_by_name": "GET /schemes/{name}",
        },
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Detailed health check including ChromaDB, model status, and connectivity."""
    from app.services.indexer import get_index_status
    from app.services.translation_service import get_model_status, is_model_loaded
    from app.services.nutrition_service import NutritionService
    from app.services.schemes_service import SchemesService
    from app.services.llm_service import check_connectivity, OLLAMA_BASE_URL, GEMINI_API_KEY

    is_online = await check_connectivity()

    # Check Ollama
    ollama_status = "unavailable"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            ollama_status = "running" if r.status_code == 200 else "error"
    except Exception:
        pass

    return {
        "status": "healthy",
        "knowledge_base": get_index_status(),
        "translation": {
            "state": get_model_status(),
            "loaded": is_model_loaded(),
            "note": "Lazy — loads on first non-English transcription",
        },
        "nutrition": {
            "loaded": True,
            "food_items": NutritionService.get_instance().count,
        },
        "schemes": {
            "loaded": True,
            "scheme_count": SchemesService.get_instance().count,
        },
        "connectivity": "online" if is_online else "offline",
        "llm": {
            "preferred": "gemini" if is_online and GEMINI_API_KEY else "ollama",
            "ollama": ollama_status,
            "gemini": "configured" if GEMINI_API_KEY else "no_key",
        },
    }