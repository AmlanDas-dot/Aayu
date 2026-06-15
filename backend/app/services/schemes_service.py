"""
Government Schemes Service.

Loads the local schemes database (backend/app/data/schemes/schemes.json)
covering National schemes plus Odisha state schemes
(BSKY, KALIA, Mission Shakti, Mamata, etc.)

Usage:
    from app.services.schemes_service import SchemesService
    svc = SchemesService.get_instance()
    scheme = svc.get_scheme("Ayushman Bharat")
    results = svc.search_schemes("maternity")
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "schemes")
_SCHEMES_FILE = "schemes.json"


class SchemesService:
    """Singleton wrapper around the government schemes dataset."""

    _instance: Optional["SchemesService"] = None

    def __init__(self) -> None:
        self._schemes: list[dict[str, Any]] = self._load_schemes()

    @classmethod
    def get_instance(cls) -> "SchemesService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_schemes(self) -> list[dict[str, Any]]:
        path = os.path.join(_DATA_DIR, _SCHEMES_FILE)
        if not os.path.exists(path):
            logger.warning("[Schemes] Data file not found: %s", path)
            return []
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    @property
    def count(self) -> int:
        return len(self._schemes)

    # ------------------------------------------------------------------ #
    # Queries
    # ------------------------------------------------------------------ #

    def list_schemes(self, state: Optional[str] = None) -> list[dict[str, Any]]:
        """All schemes, or only those for a given state (e.g. 'National', 'Odisha')."""
        if state is None:
            return self._schemes
        target = state.lower().strip()
        return [s for s in self._schemes if s.get("state", "").lower() == target]

    def get_scheme(self, name: str) -> Optional[dict[str, Any]]:
        """Exact match first, then substring match (handles 'kalia' -> 'KALIA Scheme')."""
        target = name.lower().strip()

        for s in self._schemes:
            if s["name"].lower() == target:
                return s

        for s in self._schemes:
            sname = s["name"].lower()
            if target in sname or sname in target:
                return s

        return None

    def search_schemes(self, keyword: str) -> list[dict[str, Any]]:
        """Search across name, description, benefits, eligibility, and state."""
        target = keyword.lower().strip()
        return [
            s for s in self._schemes
            if target in s["name"].lower()
            or target in s.get("description", "").lower()
            or target in s.get("benefits", "").lower()
            or target in s.get("eligibility", "").lower()
            or target in s.get("state", "").lower()
        ]
