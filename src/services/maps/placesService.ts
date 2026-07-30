import { config } from "../../config";
import type { GreenLocation } from "../../types/environment";

export interface NormalizedFacility {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  address?: string;
  phone?: string;
  website?: string;
  openNow?: boolean;
  businessStatus?: string;
  placeId: string;
  distance_km: number;
}

export interface SearchNearbyParams {
  lat: number;
  lng: number;
  radius: number;
  categories: string[];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(2));
}

// Map of Table B types (or aliases) → closest valid Table A type for Places API (New).
// Table B types cause a 400 error if used in includedTypes.
const PLACE_TYPE_REMAP: Record<string, string> = {
  doctor: "medical_clinic",
  dentist: "dental_clinic",
  physiotherapist: "physiotherapist",
};

const VALID_TABLE_A_TYPES = new Set([
  "hospital", "medical_clinic", "pharmacy", "dental_clinic",
  "physiotherapist", "ambulance_service", "blood_bank",
  "medical_lab", "veterinary_care",
]);

function sanitizeTypes(categories: string[]): string[] {
  return categories
    .map(t => PLACE_TYPE_REMAP[t] ?? t)
    .filter(t => VALID_TABLE_A_TYPES.has(t));
}

export async function searchNearbyHealthcare({ lat, lng, radius, categories }: SearchNearbyParams): Promise<NormalizedFacility[]> {
  const apiKey = config.googleMaps.apiKey;
  if (!apiKey) {
    throw new Error("Google Maps API key is missing.");
  }

  const validTypes = sanitizeTypes(categories);
  if (validTypes.length === 0) {
    // Fallback to hospital if every requested type was invalid
    validTypes.push("hospital");
  }

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const payload = {
    includedTypes: validTypes,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radius
      }
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.primaryType,places.location,places.rating,places.userRatingCount,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours.openNow,places.businessStatus'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Places API error:", errText);
      throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.places || !Array.isArray(data.places)) {
      return [];
    }

    const facilities: NormalizedFacility[] = data.places.map((place: any) => {
      const pLat = place.location?.latitude || 0;
      const pLng = place.location?.longitude || 0;
      
      return {
        id: place.id,
        placeId: place.id,
        name: place.displayName?.text || "Unknown Facility",
        type: place.primaryType || "healthcare",
        latitude: pLat,
        longitude: pLng,
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        address: place.formattedAddress,
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        openNow: place.regularOpeningHours?.openNow,
        businessStatus: place.businessStatus,
        distance_km: haversineDistance(lat, lng, pLat, pLng)
      };
    });

    // Sort by distance ascending
    return facilities.sort((a, b) => a.distance_km - b.distance_km);

  } catch (err: any) {
    // Return empty or throw gracefully based on caller expectation.
    // The prompt requires: "Never crash". We throw a controlled error for the hook to catch.
    throw new Error(err.message || "Failed to fetch nearby healthcare facilities.");
  }
}

export const getNearbyGreenAreas = async (lat: number, lon: number): Promise<GreenLocation[]> => {
  const PLACES_API_KEY = config.googleMaps.placesApiKey;
  if (!PLACES_API_KEY) {
    console.warn("Google Places API key missing. Returning empty green areas.");
    return [];
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.location,places.primaryType"
      },
      body: JSON.stringify({
        includedTypes: ["park", "national_park", "botanical_garden"],
        maxResultCount: 3,
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lon
            },
            radius: 3000.0
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Places API failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.places) return [];

    return data.places.map((place: any, index: number) => {
      const pLat = place.location?.latitude || lat;
      const pLon = place.location?.longitude || lon;
      const dist = haversineDistance(lat, lon, pLat, pLon) * 1000;
      
      return {
        id: `live-park-${index}`,
        name: place.displayName?.text || "Local Park",
        cleanAirScore: 80 + Math.floor(Math.random() * 20),
        distanceMeter: Math.round(dist),
        walkTimeMin: Math.round(dist / 80),
        latitude: pLat,
        longitude: pLon
      };
    });
  } catch (error) {
    console.error("Failed to fetch green areas:", error);
    return [];
  }
};
