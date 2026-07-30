import traceback
import asyncio
from datetime import datetime, timezone
import os

async def get_system_health():
    status = {
        "status": "healthy",
        "database": "unhealthy",
        "firebase": "unhealthy",
        "vector_db": "unhealthy",
        "llm": {
            "groq": "offline",
            "openai": "offline",
            "ollama": "offline"
        },
        "foodModel": "offline",
        "medicalModel": "offline",
        "translation": "offline",
        "whisper_stt": "offline",
        "gpu": "unhealthy",
        "errors": {}
    }

    # 1. GPU Check
    try:
        import torch
        if torch.cuda.is_available():
            status["gpu"] = "healthy"
        else:
            status["gpu"] = "offline"
    except Exception as e:
        status["gpu"] = "unhealthy"
        status["errors"]["gpu"] = str(e)

    # 2. Firebase / Database
    try:
        from app.services.firebase_service import get_firestore_client
        db = get_firestore_client()
        if db:
            status["database"] = "healthy"
            status["firebase"] = "healthy"
        else:
            status["database"] = "unhealthy"
            status["firebase"] = "unhealthy"
            status["errors"]["firebase"] = "Firebase Admin SDK failed to initialize"
    except Exception as e:
        status["database"] = "unhealthy"
        status["firebase"] = "unhealthy"
        status["errors"]["firebase"] = str(e)

    # 3. Vector DB
    try:
        from app.services.vector_db_service import VectorDBService
        # Check if instance is already created to avoid hanging on SQLite DB lock in concurrent environments
        if VectorDBService._instance is not None:
            status["vector_db"] = "healthy"
        else:
            status["vector_db"] = "degraded"
            status["errors"]["vector_db"] = "VectorDB not initialized yet"
    except Exception as e:
        status["vector_db"] = "unhealthy"
        status["errors"]["vector_db"] = str(e)

    # 4. LLMs
    try:
        from app.core.config import settings
        status["llm"]["openai"] = "healthy" if settings.OPENAI_API_KEY else "offline"
        status["llm"]["groq"] = "healthy" if settings.GROQ_API_KEY else "offline"
        status["llm"]["ollama"] = "healthy" if settings.OLLAMA_BASE_URL else "offline"
    except Exception as e:
        status["errors"]["llm"] = str(e)

    # 5. FoodVision
    try:
        from app.services.food_vision_service import FoodVisionService
        # Get instance doesn't load model immediately, it just returns singleton
        vision_svc = FoodVisionService.get_instance()
        if vision_svc.is_ready():
            status["foodModel"] = "healthy"
        else:
            status["foodModel"] = "offline"
    except Exception as e:
        status["foodModel"] = "offline"
        status["errors"]["foodModel"] = str(e)

    # 6. MedicalVision
    try:
        from app.core.config import settings
        if settings.OPENAI_API_KEY:
            status["medicalModel"] = "healthy"
        else:
            status["medicalModel"] = "offline"
    except Exception as e:
        status["medicalModel"] = "offline"
        status["errors"]["medicalModel"] = str(e)

    # 7. Translation
    try:
        from app.services.translation_service import _state as translation_state, _INDIC_AVAILABLE
        if _INDIC_AVAILABLE:
            status["translation"] = "healthy" if translation_state == "loaded" else "offline"
        else:
            status["translation"] = "offline"
    except Exception as e:
        status["translation"] = "offline"
        status["errors"]["translation"] = str(e)

    # 8. Whisper / STT
    try:
        from app.core.config import settings
        if settings.SARVAM_API_KEY:
            status["whisper_stt"] = "healthy"
        else:
            status["whisper_stt"] = "offline"
    except Exception as e:
        status["whisper_stt"] = "offline"
        status["errors"]["whisper_stt"] = str(e)

    # Calculate overall status
    is_critical_failure = (
        status["database"] == "unhealthy" or 
        status["firebase"] == "unhealthy" or 
        status["vector_db"] == "unhealthy"
    )
    
    is_degraded = (
        status["foodModel"] == "offline" or
        status["medicalModel"] == "offline" or
        status["translation"] == "offline" or
        status["whisper_stt"] == "offline" or
        status["gpu"] == "unhealthy" or
        status["vector_db"] == "degraded"
    )
    
    if is_critical_failure:
        status["status"] = "unhealthy"
    elif is_degraded:
        status["status"] = "degraded"
    else:
        status["status"] = "healthy"

    return status
