from typing import List
from .models import Alert, WeatherData, EnvironmentData, DiseaseOutbreak
import uuid
from datetime import datetime, timedelta

def generate_alerts(weather: WeatherData, env: EnvironmentData, outbreaks: List[DiseaseOutbreak]) -> List[Alert]:
    alerts = []
    now = datetime.now().isoformat()
    expires = (datetime.now() + timedelta(hours=24)).isoformat()
    
    if weather and weather.temp_c > 40:
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            title="Severe Heatwave Alert",
            summary="Temperatures exceeding 40°C",
            description="Extreme heat condition detected in your area. Avoid outdoor activities.",
            category="Weather",
            severity="Critical",
            state="Active",
            district="Current District",
            village="Current Village",
            created_at=now,
            expires_at=expires,
            source="WeatherAPI",
            status="active",
            recommendations=["Stay indoors", "Stay hydrated"],
            ai_summary="Heatwave poses a severe health risk to elderly and children."
        ))
        
    if env and env.aqi > 200:
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            title="Hazardous Air Quality",
            summary=f"AQI is {env.aqi}",
            description="Air quality is highly hazardous. Wear N95 masks if stepping out.",
            category="Environment",
            severity="High",
            state="Active",
            district="Current District",
            village="Current Village",
            created_at=now,
            expires_at=expires,
            source="Open-Meteo",
            status="active",
            recommendations=["Wear N95 Mask", "Use Air Purifier"],
            ai_summary="Poor air quality increases risk of respiratory issues."
        ))
        
    for outbreak in outbreaks:
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            title=f"Health Event: {outbreak.disease[:30]}",
            summary="Recent news regarding health in your region.",
            description=outbreak.disease,
            category="Disease",
            severity="Medium",
            state="Active",
            district="Current District",
            village="Current Village",
            created_at=now,
            expires_at=expires,
            source=outbreak.source,
            status="active",
            recommendations=["Follow local health guidelines"],
            ai_summary="Stay updated on local health advisories."
        ))
        
    return alerts
