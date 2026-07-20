import { FeatureCollection } from 'geojson';
/**
 * Clean GIS Loader Pipeline
 * Responsibilities:
 * - Load official GeoJSON boundary data
 * - Parse and Validate geometry
 * - Cache for performance
 * 
 * Note: Since official datasets are currently unavailable, this gracefully
 * falls back to null, forcing the map to render only facilities/markers.
 */

const gisCache = new Map<string, FeatureCollection>();

export const loadJurisdictionGeoJson = async (jurisdictionId: string): Promise<FeatureCollection | null> => {
  // Check cache first
  if (gisCache.has(jurisdictionId)) {
    return gisCache.get(jurisdictionId) || null;
  }

  try {
    // Simulated network request to a static GIS directory
    // In production, this would fetch from a CDN or backend endpoint
    const response = await fetch(`/data/gis/${jurisdictionId}.geojson`);
    
    if (!response.ok) {
      console.warn(`GIS Data unavailable for jurisdiction: ${jurisdictionId}. Defaulting to markers-only view.`);
      return null;
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`GIS Data unavailable for jurisdiction: ${jurisdictionId}. Server returned non-JSON.`);
      return null;
    }

    const data: FeatureCollection = await response.json();
    
    // Basic validation
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error("Invalid GeoJSON format");
    }

    // Cache the validated data
    gisCache.set(jurisdictionId, data);
    return data;
  } catch (error) {
    console.warn(`Failed to load GIS data for ${jurisdictionId}:`, error);
    return null;
  }
};
