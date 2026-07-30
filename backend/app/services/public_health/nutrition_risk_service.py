from typing import List
from .models import NutritionRisk, WeatherData, EnvironmentData
from .cache_service import nutrition_cache

def get_nutrition_risks(weather: WeatherData, env: EnvironmentData) -> List[NutritionRisk]:
    risks = []
    
    if weather and weather.temp_c > 35:
        risks.append(NutritionRisk(
            condition="Dehydration Risk",
            prevalence="High",
            pct=85.0,
            trend="↑",
            color="red"
        ))
    
    if env and env.aqi > 150:
        risks.append(NutritionRisk(
            condition="Vitamin D / Antioxidant Deficiency",
            prevalence="Moderate",
            pct=60.0,
            trend="↑",
            color="orange"
        ))
        
    if not risks:
        risks.append(NutritionRisk(
            condition="General Nutrition",
            prevalence="Low",
            pct=20.0,
            trend="↓",
            color="green"
        ))
        
    return risks
