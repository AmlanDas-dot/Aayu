import time
from typing import Any, Dict, Tuple

class SimpleCache:
    def __init__(self):
        self._cache: Dict[str, Tuple[Any, float]] = {}

    def get(self, key: str) -> Any:
        if key in self._cache:
            value, expires_at = self._cache[key]
            if time.time() < expires_at:
                return value
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 1800):
        self._cache[key] = (value, time.time() + ttl_seconds)

    def clear(self):
        self._cache.clear()

# Global instances for different TTLs
weather_cache = SimpleCache()
env_cache = SimpleCache()
disease_cache = SimpleCache()
nutrition_cache = SimpleCache()
