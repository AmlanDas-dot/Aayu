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
import os
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

router = APIRouter(prefix="/hospitals", tags=["hospitals"])
logger = logging.getLogger(__name__)

_GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"

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

@router.get("/nearby", response_model=HospitalResponse, summary="Find nearby healthcare facilities")
async def find_nearby(
    lat: float = Query(..., description="Latitude (from GPS)"),
    lon: float = Query(..., description="Longitude (from GPS)"),
    radius: int = Query(default=10000, ge=500, le=50000, description="Search radius in metres"),
    facility_type: str = Query(default="all", description="all | hospital | clinic | health_centre | pharmacy"),
):
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured on server.")

    headers = {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.location,places.formattedAddress,places.primaryType,places.nationalPhoneNumber"
    }

    body = {
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat,
                    "longitude": lon
                },
                "radius": float(radius)
            }
        }
    }
    
    if facility_type == "hospital":
        body["includedTypes"] = ["hospital"]
    elif facility_type == "pharmacy":
        body["includedTypes"] = ["pharmacy"]
    elif facility_type == "clinic":
        body["includedTypes"] = ["medical_clinic"]
    elif facility_type == "health_centre":
        body["includedTypes"] = ["medical_clinic", "hospital"]
    else:
        body["includedTypes"] = ["hospital", "pharmacy", "medical_clinic", "doctor"]

    logger.info("[Hospitals] Querying Google Places (New): lat=%.4f lon=%.4f radius=%dm type=%s", lat, lon, radius, facility_type)

    import json
    import traceback

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            
            # 1. Exact request URL
            print(f"\n[DEBUG] Request URL: {_GOOGLE_PLACES_URL}")
            
            # 2. Complete request headers (masking API key)
            masked_key = GOOGLE_PLACES_API_KEY[:4] + "*" * (len(GOOGLE_PLACES_API_KEY) - 8) + GOOGLE_PLACES_API_KEY[-4:]
            debug_headers = headers.copy()
            debug_headers["X-Goog-Api-Key"] = masked_key
            print(f"[DEBUG] Headers: {json.dumps(debug_headers, indent=2)}")
            
            # 3. Complete JSON request body
            print(f"[DEBUG] Request Body: {json.dumps(body, indent=2)}")

            resp = await client.post(_GOOGLE_PLACES_URL, json=body, headers=headers)
            
            # 4. HTTP status code returned by Google
            print(f"[DEBUG] HTTP Status Code: {resp.status_code}")
            
            # 5. Complete JSON response from Google
            try:
                data = resp.json()
                print(f"[DEBUG] Response JSON: {json.dumps(data, indent=2)}")
            except Exception:
                print(f"[DEBUG] Response text (not JSON): {resp.text}")
                data = {}
                
            resp.raise_for_status()
            
            if "error" in data:
                logger.error(f"Google API Error: {data['error'].get('status')} - {data['error'].get('message')}")
                raise HTTPException(status_code=502, detail=f"Google Places error: {data['error'].get('status')}")
    except httpx.TimeoutException:
        print("[DEBUG] Exception: TimeoutException")
        raise HTTPException(status_code=504, detail="Google Places took too long. Try a smaller radius.")
    except httpx.HTTPStatusError as exc:
        print(f"[DEBUG] HTTPStatusError: {exc.response.status_code}")
        print(f"[DEBUG] Error response text: {exc.response.text}")
        raise HTTPException(status_code=502, detail=f"Google Places error: {exc.response.status_code}")
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        print(f"[DEBUG] Exception:\n{traceback.format_exc()}")
        raise HTTPException(status_code=502, detail=f"Hospital search failed: {exc}")

    facilities: list[HospitalResult] = []
    seen_names: set[str] = set()

    for element in data.get("places", []):
        f_lat = element.get("location", {}).get("latitude", 0.0)
        f_lon = element.get("location", {}).get("longitude", 0.0)

        if f_lat == 0.0 or f_lon == 0.0:
            continue

        name = element.get("displayName", {}).get("text") or "Unnamed Facility"

        if name in seen_names:
            continue
        seen_names.add(name)

        address = element.get("formattedAddress", "")
        phone = element.get("nationalPhoneNumber", "")
        
        primary_type = element.get("primaryType", "")
        if primary_type == "hospital":
            display_type = "Hospital"
        elif primary_type == "pharmacy":
            display_type = "Pharmacy"
        elif primary_type in ["medical_clinic", "doctor", "health"]:
            display_type = "Clinic"
        elif primary_type:
            display_type = primary_type.replace("_", " ").title()
        else:
            display_type = "Healthcare Facility"

        facilities.append(HospitalResult(
            name=name,
            type=display_type,
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
