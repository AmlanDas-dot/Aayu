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

    def list_schemes(self, state: Optional[str] = None, age: Optional[str] = None, gender: Optional[str] = None) -> list[dict[str, Any]]:
        """All schemes, or only those for a given state (e.g. 'National', 'Odisha')."""
        results = self._schemes
        
        if state and state.lower().strip() != "all":
            target_state = state.lower().strip()
            results = [s for s in results if s.get("state", "").lower() == target_state]

        if gender:
            target_gender = gender.lower().strip()
            if target_gender == "female":
                keywords = ["women", "girl", "mother", "maternity", "pregnant", "lactating", "female", "beti", "matru"]
                # Match if keywords exist in any of the fields
                results = [s for s in results if any(kw in str(s).lower() for kw in keywords)]
            elif target_gender == "male":
                keywords_exclude = ["maternity", "pregnant", "lactating", "matru"]
                results = [s for s in results if not any(kw in s.get("eligibility", "").lower() for kw in keywords_exclude)]

        if age:
            target_age = age.lower().strip()
            if "0-5" in target_age:
                keywords = ["child", "infant", "baby", "children", "0-5", "pediatric"]
                results = [s for s in results if any(kw in str(s).lower() for kw in keywords)]
            elif "6-18" in target_age:
                keywords = ["student", "school", "adolescent", "girl child", "education"]
                # Include general schemes too, but try to prioritize
                matched = [s for s in results if any(kw in str(s).lower() for kw in keywords)]
                if matched: results = matched
            elif "45+" in target_age or "senior" in target_age:
                keywords = ["senior", "elderly", "pension", "old age"]
                matched = [s for s in results if any(kw in str(s).lower() for kw in keywords)]
                if matched: results = matched

        return results

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
