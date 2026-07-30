from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class WeatherData(BaseModel):
    temp_c: float
    humidity: float
    uv: float
    wind_kph: float
    condition: str
    heat_index_c: Optional[float] = None
    precip_mm: Optional[float] = None

class EnvironmentData(BaseModel):
    aqi: float
    pm2_5: float
    pm10: float
    no2: float
    ozone: float
    category: str

class Alert(BaseModel):
    id: str
    title: str
    summary: str
    description: str
    category: str
    severity: str # Critical, High, Medium, Low
    state: str
    district: str
    village: str
    created_at: str
    expires_at: str
    source: str
    status: str
    recommendations: List[str]
    ai_summary: str

class NutritionRisk(BaseModel):
    condition: str
    prevalence: str
    pct: float
    trend: str # '↑' or '↓'
    color: str

class DiseaseOutbreak(BaseModel):
    disease: str
    cases: int
    source: str
    timestamp: str

class ClinicalSummary(BaseModel):
    todaysPatients: int
    pendingPrescriptions: int
    followUpsNeeded: int
    highRiskPatients: int

class PublicHealthResponse(BaseModel):
    location: Dict[str, str]
    weather: Optional[WeatherData] = None
    environment: Optional[EnvironmentData] = None
    disease_outbreaks: List[DiseaseOutbreak] = []
    alerts: List[Alert] = []
    nutrition_risks: List[NutritionRisk] = []
    summary: Optional[ClinicalSummary] = None
    severity_score: Dict[str, Any] = {}
    last_updated: str
