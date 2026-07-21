import {
  EnvironmentData,
  AirQualityData,
  HeatData,
  UVData,
  mockEnvironmentData
} from "./environmentMock";
import { getNearbyGreenAreas } from "./maps/placesService";

// Helper for Lung Load
const calculateLungLoad = (pm25: number, pm10: number): number => {
  const load = Math.round((pm25 / 50 + pm10 / 100) * 50);
  return Math.min(100, Math.max(0, load));
};

// Helper for Heat Risk Badge
const getHeatRiskBadge = (heatIndex: number): "Safe" | "Caution" | "Moderate" | "Extreme" | "Danger" => {
  if (heatIndex < 27) return "Safe";
  if (heatIndex < 32) return "Caution";
  if (heatIndex < 41) return "Moderate";
  if (heatIndex < 54) return "Extreme";
  return "Danger";
};

// Helper for UV Status
const getUVStatus = (uv: number): "Low" | "Moderate" | "High" | "Very High" | "Extreme" => {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
};

// Helper for AQI Status
const getAqiStatus = (aqiLevel: number): "Good" | "Moderate" | "Poor" | "Unhealthy" | "Hazardous" => {
  switch(aqiLevel) {
    case 1: return "Good";
    case 2: return "Moderate";
    case 3: return "Poor";
    case 4: return "Unhealthy";
    case 5: return "Hazardous";
    case 6: return "Hazardous";
    default: return "Moderate";
  }
};

export const getCurrentEnvironment = async (lat: number, lon: number): Promise<EnvironmentData> => {
  const WEATHER_API_KEY = import.meta.env.VITE_WEATHERAPI_API_KEY;
  if (!WEATHER_API_KEY) {
    console.warn("WeatherAPI key not found, falling back to mock data.");
    return mockEnvironmentData;
  }

  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&aqi=yes`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("WeatherAPI fetch failed");
    
    const data = await res.json();
    const current = data.current;
    const air = current.air_quality;

    const pm25 = air?.pm2_5 || 10;
    const pm10 = air?.pm10 || 20;
    const epaIndex = air?.["us-epa-index"] || 1;

    // Build Air Quality
    const airQuality: AirQualityData = {
      aqi: Math.round(pm25), // Proxy AQI using PM2.5 for simplicity
      status: getAqiStatus(epaIndex),
      lungLoadPercentage: calculateLungLoad(pm25, pm10),
      insight: epaIndex > 2 ? "Air pollution is elevated. Consider wearing a mask outdoors." : "Air quality is good for outdoor activities.",
    };

    // Build Heat Data
    const heatIndex = current.heatindex_c || current.feelslike_c;
    const heatBadge = getHeatRiskBadge(heatIndex);
    const heat: HeatData = {
      temperature: current.temp_c,
      humidity: current.humidity,
      feelsLike: current.feelslike_c,
      heatIndex: heatIndex,
      riskBadge: heatBadge,
      recommendation: heatBadge === "Safe" ? "Weather is comfortable." : "Hydrate well and limit strenuous outdoor activities during peak hours."
    };

    // Build UV
    const uv: UVData = {
      index: current.uv,
      status: getUVStatus(current.uv)
    };

    // Calculate generic Outdoor Score (0-100)
    let score = 100;
    score -= (epaIndex - 1) * 15;
    if (heatIndex > 30) score -= (heatIndex - 30) * 2;
    if (current.uv > 5) score -= (current.uv - 5) * 2;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const outdoorStatus = score > 80 ? "Excellent" : score > 60 ? "Good" : score > 40 ? "Fair" : "Poor";

    // Fetch Green Areas
    const greenAreas = await getNearbyGreenAreas(lat, lon);

    // Timelines (Mocked contextually for now since we only fetch current)
    const mockTimeline = mockEnvironmentData.airTimeline;
    const mockHeatTimeline = mockEnvironmentData.heatTimeline;

    return {
      airQuality,
      heat,
      uv,
      outdoorScore: { score, status: outdoorStatus },
      airTimeline: mockTimeline,
      heatTimeline: mockHeatTimeline,
      nearbyGreenAreas: greenAreas.length > 0 ? greenAreas : mockEnvironmentData.nearbyGreenAreas,
    };
  } catch (error) {
    console.error("Failed to fetch live environment data:", error);
    return mockEnvironmentData;
  }
};

