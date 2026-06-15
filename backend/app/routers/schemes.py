"""
Government Schemes API Router.

Endpoints:
    GET  /schemes                          — List all schemes (optional state filter)
    GET  /schemes/search?q=               — Search schemes by keyword
    GET  /schemes/{scheme_name}            — Get a specific scheme by name
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.schemes_service import SchemesService

router = APIRouter(prefix="/schemes", tags=["schemes"])


# --------------------------------------------------------------------------- #
# Response models
# --------------------------------------------------------------------------- #

class Scheme(BaseModel):
    name: str
    state: str
    description: str
    eligibility: str
    benefits: str
    documents_required: list[str] = []
    official_link: str = ""


class SchemeListResponse(BaseModel):
    count: int
    items: list[Scheme]


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #

@router.get("", response_model=SchemeListResponse, summary="List all government schemes")
async def list_schemes(
    state: str | None = Query(default=None, description="Filter by state, e.g. 'National' or 'Odisha'")
) -> SchemeListResponse:
    """GET /schemes or GET /schemes?state=Odisha"""
    svc = SchemesService.get_instance()
    items = svc.list_schemes(state)
    return SchemeListResponse(count=len(items), items=[Scheme(**s) for s in items])


@router.get("/search", response_model=SchemeListResponse, summary="Search schemes by keyword")
async def search_schemes(
    q: str = Query(..., min_length=1, description="Search keyword — matches name, description, benefits, eligibility")
) -> SchemeListResponse:
    """GET /schemes/search?q=health"""
    svc = SchemesService.get_instance()
    items = svc.search_schemes(q)
    return SchemeListResponse(count=len(items), items=[Scheme(**s) for s in items])


@router.get("/{scheme_name}", response_model=Scheme, summary="Get a government scheme by name")
async def get_scheme(scheme_name: str) -> Scheme:
    """GET /schemes/Ayushman%20Bharat — supports fuzzy/substring matching."""
    svc = SchemesService.get_instance()
    scheme = svc.get_scheme(scheme_name)
    if scheme is None:
        raise HTTPException(status_code=404, detail=f"No scheme found matching '{scheme_name}'")
    return Scheme(**scheme)
