from datetime import datetime, timezone
import torch
from app.services.food_vision_service import FoodVisionService
from app.services.translation_service import _state as translation_state, _device as translation_device, _INDIC_AVAILABLE
from app.services.speech.stt_service import get_whisper_status
import app.services.llm_service as llm_service
from app.services.vector_db_service import VectorDBService

async def get_system_health():
    # 1. GPU VRAM Monitoring
    gpu_stats = {}
    if torch.cuda.is_available():
        gpu_stats = {
            "available": True,
            "device_name": torch.cuda.get_device_name(0),
            "allocated_mb": round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2),
            "reserved_mb": round(torch.cuda.memory_reserved(0) / (1024 * 1024), 2),
            "max_memory_mb": round(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024), 2),
        }
    else:
        gpu_stats = {"available": False}

    # 2. Food Vision
    try:
        vision_svc = FoodVisionService.get_instance()
        vision_status = vision_svc.get_status()
        if hasattr(vision_svc, '_last_inference_time'):
            vision_status['last_inference_time_ms'] = getattr(vision_svc, '_last_inference_time')
    except Exception as e:
        vision_status = {"error": str(e)}

    # 3. Translation (IndicTrans2)
    trans_status = {
        "installed": _INDIC_AVAILABLE,
        "state": translation_state,
        "device": translation_device
    }

    # 4. Whisper (STT)
    try:
        whisper_status = get_whisper_status()
    except Exception as e:
        whisper_status = {"error": str(e)}

    # 5. LLM Fallback Chain
    try:
        llm_status = {
            "active_provider": "openai" if llm_service.OPENAI_API_KEY else "ollama",
            "openai_enabled": bool(llm_service.OPENAI_API_KEY),
            "local_enabled": bool(llm_service.OLLAMA_BASE_URL)
        }
    except Exception as e:
        llm_status = {"error": str(e)}

    # 6. RAG / Vector DB
    try:
        vdb = VectorDBService.get_instance()
        vdb_status = {
            "collections": len(vdb._collections) if hasattr(vdb, '_collections') else 0,
            "initialized": True
        }
    except Exception as e:
        vdb_status = {"error": str(e)}

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "hardware": {
            "gpu": gpu_stats
        },
        "services": {
            "api": "online",
            "llm_chain": llm_status,
            "vector_db": vdb_status,
            "food_vision": vision_status,
            "translation": trans_status,
            "whisper_stt": whisper_status
        }
    }
