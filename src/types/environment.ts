export interface AirQualityData {
  aqi: number;
  status: "Good" | "Moderate" | "Poor" | "Unhealthy" | "Hazardous";
  lungLoadPercentage: number;
  insight: string;
}

export interface HeatData {
  temperature: number; // in Celsius
  humidity: number; // percentage
  feelsLike: number;
  heatIndex: number;
  riskBadge: "Safe" | "Caution" | "Moderate" | "Extreme" | "Danger";
  recommendation: string;
}

export interface UVData {
  index: number;
  status: "Low" | "Moderate" | "High" | "Very High" | "Extreme";
}

export interface TimelineSlot {
  time: string; // e.g., "6-8 AM"
  status: "Green" | "Yellow" | "Red";
  recommendation: string;
}

export interface GreenLocation {
  id: string;
  name: string;
  cleanAirScore: number;
  distanceMeter: number;
  walkTimeMin: number;
  latitude?: number;
  longitude?: number;
}

export interface EnvironmentData {
  airQuality: AirQualityData;
  heat: HeatData;
  uv: UVData;
  outdoorScore: {
    score: number;
    status: string;
  };
  airTimeline: TimelineSlot[];
  heatTimeline: TimelineSlot[];
  nearbyGreenAreas: GreenLocation[];
}

