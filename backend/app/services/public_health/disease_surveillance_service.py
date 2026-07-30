import os
import aiohttp
from typing import List
from dotenv import load_dotenv
from .models import DiseaseOutbreak
from .cache_service import disease_cache
import logging
from datetime import datetime

load_dotenv()
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

logger = logging.getLogger(__name__)

async def get_disease_outbreaks(lat: float, lon: float) -> List[DiseaseOutbreak]:
    cache_key = f"disease_{round(lat, 1)}_{round(lon, 1)}"
    cached = disease_cache.get(cache_key)
    if cached is not None:
        return cached

    if not NEWSDATA_API_KEY:
        logger.error("NEWSDATA_API_KEY not found.")
        return []

    url = f"https://newsdata.io/api/1/news?apikey={NEWSDATA_API_KEY}&q=disease OR outbreak OR dengue OR malaria&country=in&language=en"
    
    outbreaks = []
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    articles = data.get('results', [])[:3]
                    
                    for article in articles:
                        outbreaks.append(DiseaseOutbreak(
                            disease=article.get('title', 'Unknown Health Event'),
                            cases=0,
                            source=article.get('source_id', 'NewsData.io'),
                            timestamp=article.get('pubDate', datetime.now().isoformat())
                        ))
                    
                    disease_cache.set(cache_key, outbreaks)
                    return outbreaks
                else:
                    logger.error(f"NewsData API returned {response.status}")
    except Exception as e:
        logger.error(f"Error fetching disease data: {e}")
        
    return outbreaks
