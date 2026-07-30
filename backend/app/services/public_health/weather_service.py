import os
import aiohttp
from dotenv import load_dotenv
from .models import WeatherData
from .cache_service import weather_cache
import logging

load_dotenv()
WEATHERAPI_API_KEY = os.getenv("WEATHERAPI_API_KEY")

logger = logging.getLogger(__name__)

async def get_weather_data(lat: float, lon: float) -> WeatherData:
    cache_key = f"weather_{round(lat, 2)}_{round(lon, 2)}"
    cached = weather_cache.get(cache_key)
    if cached:
        return cached

    if not WEATHERAPI_API_KEY:
        logger.error("WEATHERAPI_API_KEY not found.")
        return None

    url = f"http://api.weatherapi.com/v1/current.json?key={WEATHERAPI_API_KEY}&q={lat},{lon}"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    current = data.get('current', {})
                    
                    weather = WeatherData(
                        temp_c=current.get('temp_c', 0.0),
                        humidity=current.get('humidity', 0.0),
                        uv=current.get('uv', 0.0),
                        wind_kph=current.get('wind_kph', 0.0),
                        condition=current.get('condition', {}).get('text', 'Unknown'),
                        heat_index_c=current.get('heatindex_c') or current.get('feelslike_c'),
                        precip_mm=current.get('precip_mm')
                    )
                    weather_cache.set(cache_key, weather)
                    return weather
                else:
                    logger.error(f"WeatherAPI returned {response.status}")
    except Exception as e:
        logger.error(f"Error fetching weather data: {e}")
        
    return None
