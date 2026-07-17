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

export async function searchNearbyHealthcare({ lat, lng, radius, categories }: SearchNearbyParams): Promise<NormalizedFacility[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key is missing.");
  }

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const payload = {
    includedTypes: categories,
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
