// @ts-nocheck
import { workspaceRegistry } from '../data/workspaceRegistry';
import { Jurisdiction } from '../types/Jurisdiction';
import { generateDynamicJurisdiction } from '../data/demoData';
import { loadJurisdictionGeoJson } from './gisLoaderService';

export interface LocationInfo {
  state: string;
  district: string;
  subDistrict: string;
  lat: number;
  lng: number;
}

export const reverseGeocode = async (lat: number, lng: number): Promise<LocationInfo> => {
  if (!window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  const geocoder = new google.maps.Geocoder();
  const response = await geocoder.geocode({ location: { lat, lng } });

  if (!response.results || response.results.length === 0) {
    throw new Error('No results found');
  }

  const result = response.results[0];
  let state = 'Unknown State';
  let district = 'Unknown District';
  let subDistrict = 'Unknown Area';

  for (const component of result.address_components) {
    if (component.types.includes('administrative_area_level_1')) {
      state = component.long_name;
    }
    if (component.types.includes('administrative_area_level_2')) {
      district = component.long_name;
    }
    if (component.types.includes('administrative_area_level_3') || component.types.includes('locality')) {
      subDistrict = component.long_name;
    }
  }

  return { state, district, subDistrict, lat, lng };
};

export const getJurisdiction = async (workspaceId: string): Promise<Jurisdiction> => {
  const workspace = workspaceRegistry.find(w => w.id === workspaceId);
  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  // Simulate network delay
  await new Promise(r => setTimeout(r, 400));

  // Generate the jurisdiction properties (villages, facilities, bounds)
  const jurisdiction = generateDynamicJurisdiction(workspace);
  
  // Explicitly fetch real GeoJSON polygons via the new GIS Loader pipeline
  // If the file doesn't exist, this cleanly sets geoJson to null, which skips polygon rendering.
  const geoJsonData = await loadJurisdictionGeoJson(workspaceId);
  jurisdiction.geoJson = geoJsonData;

  return jurisdiction;
};
