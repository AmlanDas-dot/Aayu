"""
Nearby Healthcare Finder — OpenStreetMap Overpass API.
Searches node + way elements (Indian hospitals are often mapped as buildings/ways).
"""

from __future__ import annotations
import logging
import math
import httpx
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/hospitals", tags=["hospitals"])
logger = logging.getLogger(__name__)

_OVERPASS_URL = "https://overpass-api.de/api/interpreter"

_AMENITY_MAP = {
    "hospital":      "Hospital",
    "clinic":        "Clinic",
    "health_centre": "Primary Health Centre (PHC)",
    "doctors":       "Doctor / Clinic",
    "pharmacy":      "Pharmacy",
    "dentist":       "Dentist",
}


class HospitalResult(BaseModel):
    name: str
    type: str
    lat: float
    lon: float
    address: str = ""
    phone: str = ""
    distance_km: float = 0.0


class HospitalResponse(BaseModel):
    count: int
    facilities: list[HospitalResult]
    query_lat: float
    query_lon: float
    radius_km: float


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _build_overpass_query(lat: float, lon: float, radius: int, facility_type: str) -> str:
    """
    Build Overpass query searching both node and way elements.
    `out center` returns center coordinates for way elements.
    """
    amenities = list(_AMENITY_MAP.keys()) if facility_type == "all" else [facility_type]
    lines = []
    for amenity in amenities:
        lines.append(f'  node[amenity={amenity}](around:{radius},{lat},{lon});')
        lines.append(f'  way[amenity={amenity}](around:{radius},{lat},{lon});')
    inner = "\n".join(lines)
    return f"[out:json][timeout:30];\n(\n{inner}\n);\nout center;"


@router.get("/nearby", response_model=HospitalResponse, summary="Find nearby healthcare facilities")
async def find_nearby(
    lat: float = Query(..., description="Latitude (from GPS)"),
    lon: float = Query(..., description="Longitude (from GPS)"),
    radius: int = Query(default=10000, ge=500, le=50000, description="Search radius in metres"),
    facility_type: str = Query(default="all", description="all | hospital | clinic | health_centre | pharmacy"),
):
    if facility_type not in list(_AMENITY_MAP.keys()) + ["all"]:
        facility_type = "all"

    query = _build_overpass_query(lat, lon, radius, facility_type)
    logger.info("[Hospitals] Querying OSM: lat=%.4f lon=%.4f radius=%dm type=%s", lat, lon, radius, facility_type)

    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(_OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="OpenStreetMap took too long. Try a smaller radius.")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"OpenStreetMap error: {exc.response.status_code}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Hospital search failed: {exc}")

    facilities: list[HospitalResult] = []
    seen_names: set[str] = set()

    for element in data.get("elements", []):
        tags = element.get("tags", {})

        # Get coordinates — node has lat/lon directly, way has center object
        if element.get("type") == "node":
            f_lat = element.get("lat", 0.0)
            f_lon = element.get("lon", 0.0)
        else:
            center = element.get("center", {})
            f_lat = center.get("lat", 0.0)
            f_lon = center.get("lon", 0.0)

        if f_lat == 0.0 or f_lon == 0.0:
            continue

        name = (
            tags.get("name")
            or tags.get("name:en")
            or tags.get("name:hi")
            or tags.get("operator")
            or "Unnamed Facility"
        )

        # Deduplicate by name+type
        dedup_key = f"{name}_{tags.get('amenity', '')}"
        if dedup_key in seen_names:
            continue
        seen_names.add(dedup_key)

        amenity_type = tags.get("amenity", "")
        address_parts = [
            tags.get("addr:housename", ""),
            tags.get("addr:street", ""),
            tags.get("addr:suburb", ""),
            tags.get("addr:city", ""),
        ]
        address = ", ".join(p for p in address_parts if p)
        phone = tags.get("phone") or tags.get("contact:phone") or tags.get("contact:mobile") or ""

        facilities.append(HospitalResult(
            name=name,
            type=_AMENITY_MAP.get(amenity_type, amenity_type.replace("_", " ").title()),
            lat=f_lat,
            lon=f_lon,
            address=address,
            phone=phone,
            distance_km=round(_haversine(lat, lon, f_lat, f_lon), 2),
        ))

    facilities.sort(key=lambda f: f.distance_km)
    result_count = len(facilities)
    logger.info("[Hospitals] Found %d facilities within %dkm.", result_count, radius // 1000)

    return HospitalResponse(
        count=result_count,
        facilities=facilities[:25],
        query_lat=lat,
        query_lon=lon,
        radius_km=radius / 1000,
    )
