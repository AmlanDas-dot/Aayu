import asyncio
from typing import Dict, Any
from datetime import datetime
from .models import PublicHealthResponse, ClinicalSummary
from .weather_service import get_weather_data
from .environmental_service import get_environmental_data
from .disease_surveillance_service import get_disease_outbreaks
from .nutrition_risk_service import get_nutrition_risks
from .alert_service import generate_alerts

async def get_public_health_intelligence(lat: float, lon: float) -> PublicHealthResponse:
    weather, env, outbreaks = await asyncio.gather(
        get_weather_data(lat, lon),
        get_environmental_data(lat, lon),
        get_disease_outbreaks(lat, lon)
    )
    
    nutrition_risks = get_nutrition_risks(weather, env)
    alerts = generate_alerts(weather, env, outbreaks)
    
    severity_score = {
        "score": max(0, 100 - (len(alerts) * 10)),
        "status": "Good" if len(alerts) == 0 else "Moderate" if len(alerts) < 3 else "Poor"
    }
    
    return PublicHealthResponse(
        location={"lat": str(lat), "lon": str(lon)},
        weather=weather,
        environment=env,
        disease_outbreaks=outbreaks,
        alerts=alerts,
        nutrition_risks=nutrition_risks,
        summary=ClinicalSummary(
            todaysPatients=12,
            pendingPrescriptions=4,
            followUpsNeeded=3,
            highRiskPatients=2
        ),
        severity_score=severity_score,
        last_updated=datetime.now().isoformat()
    )
