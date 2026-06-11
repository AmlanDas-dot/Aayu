"""
AAYU Backend — FastAPI entry point.

Startup pipeline:
  1. Initialise ChromaDB (creates persistent storage if not exists)
  2. Load JSON knowledge base files
  3. Generate embeddings with all-MiniLM-L6-v2
  4. Upsert into ChromaDB (idempotent — safe for restarts)

GPU memory note — lazy-loaded services (zero VRAM at startup):
  • Whisper:     loaded on first POST /transcribe
  • IndicTrans2: loaded on first non-English transcription

Services loaded at startup (minimal VRAM):
  • all-MiniLM-L6-v2 embedding model (≈0.1 GB — runs on CPU)

Future architecture plug-in points:
  Voice → Whisper → IndicTrans2 → ChromaDB → Triage Engine → Ollama → Response
"""

import logging
import time

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.transcribe import router as transcribe_router
from app.routers.search import router as search_router

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
        logger.info("│  ✓ all-MiniLM-L6-v2 embedding model loaded")
    except Exception as exc:
        logger.error("│  ✗ Vector DB init failed: %s", exc)
    logger.info("└──────────────────────────────")

    # ── Knowledge Base Indexing ──────────────────────────────────────────────
    logger.info("┌─ Knowledge Base")
    try:
        from app.services.indexer import index_knowledge_base
        indexed = index_knowledge_base(force_reindex=False)
        total = sum(indexed.values())
        for col, count in indexed.items():
            logger.info("│  ✓ %-28s %d docs", col, count)
        logger.info("│  ─────────────────────────────")
        logger.info("│  Total documents indexed: %d", total)
    except Exception as exc:
        logger.error("│  ✗ Indexing failed: %s", exc)
    logger.info("└──────────────────────────────")

    # ── Lazy-Loaded Services ─────────────────────────────────────────────────
    logger.info("┌─ Lazy-Loaded Services (zero VRAM until first request)")
    logger.info("│  ◌ Whisper .............. loads on POST /transcribe")
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
    version="0.2.0",
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


# --------------------------------------------------------------------------- #
# Health check
# --------------------------------------------------------------------------- #

@app.get("/", tags=["health"])
def root():
    return {
        "status": "running",
        "service": "AAYU Backend",
        "version": "0.2.0",
        "endpoints": {
            "transcribe": "POST /transcribe",
            "search_get": "GET /search?q=",
            "search_post": "POST /search",
            "search_collections": "GET /search/collections",
            "search_status": "GET /search/status",
        },
    }


@app.get("/health", tags=["health"])
def health_check():
    """Detailed health check including ChromaDB and model status."""
    from app.services.indexer import get_index_status
    from app.services.translation_service import get_model_status, is_model_loaded
    from app.services.whisper_service import get_whisper_status

    whisper = get_whisper_status()
    return {
        "status": "healthy",
        "knowledge_base": get_index_status(),
        "whisper": {
            "loaded": whisper["loaded"],
            "model_size": whisper["model_size"],
            "note": "Lazy — loads on first /transcribe request",
        },
        "translation": {
            "state": get_model_status(),
            "loaded": is_model_loaded(),
            "note": "Lazy — loads on first non-English transcription",
        },
    }