async def get_system_health():
    return {
        "status": "healthy",
        "timestamp": "2026-07-20T11:00:00Z",
        "services": {
            "api": "online",
            "database": "online",
            "llm": "online",
            "vector_db": "online"
        }
    }
