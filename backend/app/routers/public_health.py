from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from ..services.public_health import (
    get_public_health_intelligence,
    PublicHealthResponse,
    WeatherData,
    EnvironmentData,
    DiseaseOutbreak,
    Alert,
    NutritionRisk
)
from ..services.public_health.weather_service import get_weather_data
from ..services.public_health.environmental_service import get_environmental_data
from ..services.public_health.disease_surveillance_service import get_disease_outbreaks
from ..services.public_health.nutrition_risk_service import get_nutrition_risks
from ..services.public_health.alert_service import generate_alerts

router = APIRouter(prefix="/api/public-health", tags=["Public Health"])

@router.get("", response_model=PublicHealthResponse)
async def get_full_public_health_dashboard(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    try:
        return await get_public_health_intelligence(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary", response_model=PublicHealthResponse)
async def get_public_health_summary(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    try:
        return await get_public_health_intelligence(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather", response_model=Optional[WeatherData])
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    return await get_weather_data(lat, lon)

@router.get("/environment", response_model=Optional[EnvironmentData])
async def get_environment(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    return await get_environmental_data(lat, lon)

@router.get("/disease", response_model=List[DiseaseOutbreak])
async def get_disease(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    return await get_disease_outbreaks(lat, lon)

@router.get("/nutrition", response_model=List[NutritionRisk])
async def get_nutrition(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    weather = await get_weather_data(lat, lon)
    env = await get_environmental_data(lat, lon)
    return get_nutrition_risks(weather, env)

@router.get("/alerts", response_model=List[Alert])
async def get_alerts(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    weather = await get_weather_data(lat, lon)
    env = await get_environmental_data(lat, lon)
    outbreaks = await get_disease_outbreaks(lat, lon)
    return generate_alerts(weather, env, outbreaks)
