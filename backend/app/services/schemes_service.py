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
_SCHEMES_FILE = None  # deprecated — now auto-discovers all *.json files in schemes/


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
        """Load all schemes from all JSON files in the schemes/ directory."""
        import glob
        pattern = os.path.join(_DATA_DIR, "*.json")
        files = sorted(glob.glob(pattern))
        if not files:
            logger.warning("[Schemes] No scheme files found in: %s", _DATA_DIR)
            return []
        all_schemes: list[dict[str, Any]] = []
        for filepath in files:
            try:
                with open(filepath, encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        all_schemes.extend(data)
                    logger.info("[Schemes] Loaded %d schemes from %s", len(data), os.path.basename(filepath))
            except Exception as exc:
                logger.warning("[Schemes] Failed to load %s: %s", filepath, exc)
        logger.info("[Schemes] Total schemes loaded: %d", len(all_schemes))
        return all_schemes

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
