from fastapi import APIRouter

from app.services.alert_service import AlertService
from app.services.public_health_intelligence_engine import PublicHealthIntelligenceEngine

router = APIRouter()

@router.get("", response_model=list[dict])
async def get_active_alerts():
    """
    Returns the active public health alerts.
    """
    return AlertService.get_active_alerts()

@router.post("/refresh")
async def force_refresh_alerts():
    """
    Forces the public health intelligence engine to fetch and normalize fresh data.
    """
    summary = await PublicHealthIntelligenceEngine.refresh_all()
    return {"message": "Successfully refreshed public health intelligence.", "summary": summary}


@router.post("/refresh/{source}")
async def force_refresh_source(source: str):
    source_jobs = {
        "weather": PublicHealthIntelligenceEngine.refresh_weather,
        "aqi": PublicHealthIntelligenceEngine.refresh_aqi,
        "news": PublicHealthIntelligenceEngine.refresh_news,
        "outbreak": PublicHealthIntelligenceEngine.refresh_outbreak,
        "who": PublicHealthIntelligenceEngine.refresh_who,
        "idsp": PublicHealthIntelligenceEngine.refresh_idsp,
        "predictions": PublicHealthIntelligenceEngine.refresh_predictions,
    }
    job = source_jobs.get(source)
    if not job:
        return {"message": f"Unknown refresh source '{source}'.", "available": list(source_jobs)}

    result = await PublicHealthIntelligenceEngine.run_job(f"manual_{source}", job)
    return {"message": f"Refreshed {source}.", "count": len(result) if isinstance(result, list) else 1}
