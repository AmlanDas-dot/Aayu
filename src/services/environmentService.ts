import type {
  EnvironmentData,
  AirQualityData,
  HeatData,
  UVData,
} from "../types/environment";
import { getNearbyGreenAreas } from "./maps/placesService";
import { config } from "../config";


// Helper for Lung Load
const calculateLungLoad = (pm25: number, pm10: number): number => {
  const load = Math.round((pm25 / 50 + pm10 / 100) * 50);
  return Math.min(100, Math.max(0, load));
};

// Helper for Heat Risk Badge
const getHeatRiskBadge = (heatIndex: number): HeatData["riskBadge"] => {
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
const getAqiStatus = (aqiLevel: number): AirQualityData["status"] => {
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
  try {
    const url = `${config.apiBaseUrl}/public-health/summary?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Backend API fetch failed");
    
    const data = await res.json();
    const weather = data.weather;
    const env = data.environment;

    const pm25 = env?.pm2_5 || 10;
    const pm10 = env?.pm10 || 20;

    const airQuality: AirQualityData = {
      aqi: env?.aqi || Math.round(pm25),
      status: getAqiStatus(Math.ceil((env?.aqi || 0) / 50)),
      lungLoadPercentage: calculateLungLoad(pm25, pm10),
      insight: (env?.aqi || 0) > 100 ? "Air pollution is elevated. Consider wearing a mask outdoors." : "Air quality is good for outdoor activities.",
    };

    const heatIndex = weather?.heat_index_c || weather?.temp_c || 0;
    const heatBadge = getHeatRiskBadge(heatIndex);
    const heat: HeatData = {
      temperature: weather?.temp_c || 0,
      humidity: weather?.humidity || 0,
      feelsLike: weather?.heat_index_c || weather?.temp_c || 0,
      heatIndex: heatIndex,
      riskBadge: heatBadge,
      recommendation: heatBadge === "Safe" ? "Weather is comfortable." : "Hydrate well and limit strenuous outdoor activities during peak hours."
    };

    const uv: UVData = {
      index: weather?.uv || 0,
      status: getUVStatus(weather?.uv || 0)
    };

    const score = data.severity_score?.score ?? 100;
    const outdoorStatus = score > 80 ? "Excellent" : score > 60 ? "Good" : score > 40 ? "Fair" : "Poor";

    const greenAreas = await getNearbyGreenAreas(lat, lon);

    return {
      airQuality,
      heat,
      uv,
      outdoorScore: { score, status: outdoorStatus },
      airTimeline: [],
      heatTimeline: [],
      nearbyGreenAreas: greenAreas,
    };
  } catch (error) {
    console.error("Failed to fetch live environment data:", error);
    throw new Error("Live environment data is unavailable.");
  }
};

