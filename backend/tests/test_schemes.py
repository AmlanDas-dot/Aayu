"""
tests/test_schemes.py

Run with:
    python -m pytest backend/tests/test_schemes.py -v
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app.services.schemes_service import SchemesService


@pytest.fixture(scope="module")
def svc() -> SchemesService:
    return SchemesService.get_instance()


def test_data_loaded(svc: SchemesService) -> None:
    assert svc.count > 0


def test_get_scheme_exact_and_fuzzy(svc: SchemesService) -> None:
    scheme = svc.get_scheme("kalia")
    assert scheme is not None
    assert "KALIA" in scheme["name"]


def test_get_scheme_not_found(svc: SchemesService) -> None:
    assert svc.get_scheme("nonexistent scheme xyz") is None


def test_list_schemes_filter_by_state(svc: SchemesService) -> None:
    odisha = svc.list_schemes("Odisha")
    assert len(odisha) > 0
    assert all(s["state"] == "Odisha" for s in odisha)


def test_list_schemes_national(svc: SchemesService) -> None:
    national = svc.list_schemes("National")
    assert len(national) > 0


def test_search_schemes(svc: SchemesService) -> None:
    results = svc.search_schemes("health")
    assert len(results) > 0


def test_all_schemes_have_required_fields(svc: SchemesService) -> None:
    for scheme in svc.list_schemes():
        assert "name" in scheme
        assert "state" in scheme
        assert "description" in scheme
