import { GreenLocation } from "./environmentMock";

export const getNearbyGreenAreas = async (lat: number, lon: number): Promise<GreenLocation[]> => {
  const PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
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
            radius: 3000.0 // 3km radius
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
      // Calculate a rough distance for the UI based on lat/lon
      const pLat = place.location?.latitude || lat;
      const pLon = place.location?.longitude || lon;
      const dist = getDistanceFromLatLonInKm(lat, lon, pLat, pLon) * 1000;
      
      return {
        id: `live-park-${index}`,
        name: place.displayName?.text || "Local Park",
        cleanAirScore: 80 + Math.floor(Math.random() * 20), // Proxy score for now
        distanceMeter: Math.round(dist),
        walkTimeMin: Math.round(dist / 80), // ~80m per minute walking speed
        latitude: pLat,
        longitude: pLon
      };
    });
  } catch (error) {
    console.error("Failed to fetch green areas:", error);
    return [];
  }
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
