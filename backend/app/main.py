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



from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.transcribe import router as transcribe_router
from app.routers.search import router as search_router
from app.routers.chat import router as chat_router
from app.routers.nutrition import router as nutrition_router
from app.routers.schemes import router as schemes_router
from app.routers.hospitals import router as hospitals_router
from app.routers.records import router as records_router
from app.routers.alerts import router as alerts_router
from app.routers.recovery import router as recovery_router
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

    # ── External APIs Validation ───────────────────────────────────────────
    logger.info("┌─ External APIs & Services")
    try:
        from app.services.firebase_service import get_firestore_client
        if get_firestore_client():
            logger.info("│  ✓ Firebase Admin authenticated")
        else:
            logger.warning("│  ⚠ Firebase Admin failed to initialize")
            
        import os
        if os.getenv("GEMINI_API_KEY"):
            logger.info("│  ✓ Gemini API Key present")
        else:
            logger.warning("│  ⚠ Gemini API Key missing (AI services degraded)")
            
        if os.getenv("WEATHERAPI_KEY"):
            logger.info("│  ✓ Weather API Key present")
        else:
            logger.warning("│  ⚠ Weather API Key missing (mock data will be used)")
            
        if os.getenv("NEWSDATA_API_KEY"):
            logger.info("│  ✓ News API Key present")
        else:
            logger.warning("│  ⚠ News API Key missing (mock data will be used)")
            
        if os.getenv("VITE_GOOGLE_MAPS_API_KEY"):
            logger.info("│  ✓ Google Maps API Key present")
        else:
            logger.warning("│  ⚠ Google Maps API Key missing")
            
    except Exception as exc:
        logger.error("│  ✗ External API validation failed: %s", exc)
    logger.info("└──────────────────────────────")

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
        indexed = index_knowledge_base(force_reindex=False)  # temporary — change back to False after first successful run
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

    # ── Alerts Scheduler ─────────────────────────────────────────────────────
    logger.info("┌─ Public Health Intelligence")
    try:
        from app.services.alert_scheduler import AlertScheduler
        AlertScheduler.start()
        logger.info("│  ✓ Alert Scheduler started")
    except Exception as exc:
        logger.error("│  ✗ Alert Scheduler failed: %s", exc)
    logger.info("└──────────────────────────────")

    # ── FoodVisionService Pre-Loading ────────────────────────────────────────
    logger.info("┌─ Food Vision Pipeline")
    try:
        from app.services.food_vision_service import FoodVisionService
        await FoodVisionService.get_instance().load_model()
        logger.info("│  ✓ FoodVisionService model loaded into GPU")
    except Exception as exc:
        logger.error("│  ✗ FoodVisionService init failed: %s", exc)
    logger.info("└──────────────────────────────")

    # ── Ready ─────────────────────────────────────────────────────────────────
    logger.info("┌─ Lazy-Loaded Services (zero VRAM until first request)")
    logger.info("│  ◌ IndicTrans2 .......... loads on first non-English audio")
    logger.info("└──────────────────────────────")

    elapsed = round(time.time() - t_start, 2)
    _banner(f"AAYU Backend Ready  ({elapsed}s)")

    yield

    try:
        from app.services.alert_scheduler import AlertScheduler
        AlertScheduler.stop()
    except Exception as exc:
        pass

    _banner("AAYU Backend Shutdown Complete")

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

app.include_router(transcribe_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(nutrition_router, prefix="/api")
app.include_router(schemes_router, prefix="/api", tags=["Schemes"])
app.include_router(hospitals_router, prefix="/api", tags=["Hospitals"])
app.include_router(records_router, prefix="/api", tags=["Records"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(recovery_router, prefix="/api/recovery", tags=["Recovery"])


# --------------------------------------------------------------------------- #
# Health check
# --------------------------------------------------------------------------- #

@app.get("/api/", tags=["health"])
@app.get("/", tags=["health"])
def root():
    return {
        "status": "running",
        "service": "AAYU Backend",
        "version": "0.4.0",
        "endpoints": {
            "chat": "POST /api/chat",
            "transcribe": "POST /api/transcribe",
            "search_get": "GET /api/search?q=",
            "search_post": "POST /api/search",
        },
    }


@app.get("/api/health", tags=["health"])
@app.get("/health", tags=["health"])
async def health_check():
    """Detailed health check for all platform services."""
    try:
        from app.services.system_health import get_system_health
        return await get_system_health()
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}