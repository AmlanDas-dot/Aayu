import { WorkspaceFacility } from '../data/workspaceRegistry';
import type { MapMarkerData } from '../components/Map/MapMarkers';

export interface VillageData {
  id: string;
  name: string;
  type?: string;
  population: number;
  families?: number;
  healthScore?: number;
  riskScore: number;
  mapCoordinates: [number, number]; // lat, lng
  aiInsight: string;
  trend: 'Improving' | 'Declining' | 'Stable';
  dominantDisease: string;
  vaccinationCoverage: number;
  heatRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  
  // Specific locations
  district: string;
  chc: string;
  phc: string;
  facilityId: string;
  
  // Demographics
  pregnantWomen: number;
  elderly: number;
  children: number;
  
  nearestDhh: string;
  nearestChc: string;
  nearestPhc: string;
  
  recentCases: number;
  recommendations: string[];
  assignedWorkers: number;
  maternalHealth: string;
  waterSafety: string;
  colorStatus: string;
  highRiskPatients: number;
  airQuality: string;
  environmentalRisk?: string;
  childrenUnderMonitoring?: number;
  medicationAdherence?: number;
  aiHealthScore?: number;
  unregisteredCitizens?: number;
  travelTime?: string;
  nearestHospital?: string;
  commonSymptoms?: string[];
  lastAshaVisit?: string;
}

export interface JurisdictionBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Jurisdiction {
  workspace: WorkspaceFacility;
  center: { lat: number; lng: number };
  bounds: JurisdictionBounds;
  villages: VillageData[];
  facilities: MapMarkerData[];
  geoJson: any; // FeatureCollection for polygons
}
