"""
AAYU Backend — FastAPI entry point.

Startup pipeline:
  1. Initialise ChromaDB (creates persistent storage if not exists)
  2. Load JSON knowledge base files
  3. Generate embeddings with all-MiniLM-L6-v2
  4. Upsert into ChromaDB (idempotent — safe for restarts)

Future architecture plug-in points:
  Whisper → IndicTrans2 → ChromaDB → Triage Engine → Ollama → Response
"""

import logging

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
    logger.info("=" * 60)
    logger.info("AAYU Backend starting up...")
    logger.info("=" * 60)

    try:
        from app.services.indexer import index_knowledge_base
        indexed = index_knowledge_base(force_reindex=False)
        total = sum(indexed.values())
        logger.info("[Startup] Knowledge base indexed: %d documents total.", total)
        for col, count in indexed.items():
            logger.info("  ✓ %s — %d documents", col, count)
    except Exception as exc:
        # Non-fatal — server starts even if indexing fails
        logger.error("[Startup] Knowledge base indexing failed: %s", exc)

    logger.info("=" * 60)
    logger.info("AAYU Backend ready.")
    logger.info("=" * 60)

    yield

    logger.info("AAYU Backend shutting down.")


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
    """Detailed health check including ChromaDB status."""
    from app.services.indexer import get_index_status
    return {
        "status": "healthy",
        "knowledge_base": get_index_status(),
    }