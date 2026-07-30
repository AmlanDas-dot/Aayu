import aiohttp
from .models import EnvironmentData
from .cache_service import env_cache
import logging

logger = logging.getLogger(__name__)

def _get_aqi_category(aqi: float) -> str:
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Moderate"
    if aqi <= 150: return "Unhealthy for Sensitive Groups"
    if aqi <= 200: return "Unhealthy"
    if aqi <= 300: return "Very Unhealthy"
    return "Hazardous"

async def get_environmental_data(lat: float, lon: float) -> EnvironmentData:
    cache_key = f"env_{round(lat, 2)}_{round(lon, 2)}"
    cached = env_cache.get(cache_key)
    if cached:
        return cached

    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    current = data.get('current', {})
                    
                    aqi = current.get('us_aqi', 0.0)
                    
                    env = EnvironmentData(
                        aqi=aqi,
                        pm2_5=current.get('pm2_5', 0.0),
                        pm10=current.get('pm10', 0.0),
                        no2=current.get('nitrogen_dioxide', 0.0),
                        ozone=current.get('ozone', 0.0),
                        category=_get_aqi_category(aqi)
                    )
                    env_cache.set(cache_key, env)
                    return env
                else:
                    logger.error(f"Open-Meteo returned {response.status}")
    except Exception as e:
        logger.error(f"Error fetching environmental data: {e}")
        
    return None
