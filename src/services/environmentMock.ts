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

export const mockEnvironmentData: EnvironmentData = {
  airQuality: {
    aqi: 45,
    status: "Good",
    lungLoadPercentage: 42,
    insight: "Most of today's exposure occurred during your morning commute.",
  },
  heat: {
    temperature: 38,
    humidity: 65,
    feelsLike: 42,
    heatIndex: 40,
    riskBadge: "Moderate",
    recommendation: "High humidity is increasing today's heat stress. Avoid strenuous activity between 12 PM and 4 PM. Drink at least 250 mL of water every 20 minutes if working outdoors.",
  },
  uv: {
    index: 7,
    status: "High",
  },
  outdoorScore: {
    score: 82,
    status: "Excellent",
  },
  airTimeline: [
    {
      time: "6–8 AM",
      status: "Green",
      recommendation: "Excellent air quality. Ideal for walking. Hydration normal.",
    },
    {
      time: "8–10 AM",
      status: "Yellow",
      recommendation: "Moderate air quality due to traffic. Limit intense outdoor exercise.",
    },
    {
      time: "10 AM–12 PM",
      status: "Yellow",
      recommendation: "Moderate air quality. Safe for normal activities.",
    },
    {
      time: "12–4 PM",
      status: "Red",
      recommendation: "Avoid prolonged outdoor activity. Use mask if pollution increases.",
    },
    {
      time: "4–6 PM",
      status: "Yellow",
      recommendation: "Air quality slightly improving. Safe for light activities.",
    },
    {
      time: "6–8 PM",
      status: "Green",
      recommendation: "Good air quality. Safe for evening walks.",
    }
  ],
  heatTimeline: [
    {
      time: "6–8 AM",
      status: "Green",
      recommendation: "Coolest part of the day. Best time for outdoor activities.",
    },
    {
      time: "8–10 AM",
      status: "Yellow",
      recommendation: "Temperature rising. Stay hydrated if outdoors.",
    },
    {
      time: "10 AM–12 PM",
      status: "Red",
      recommendation: "High heat stress. Seek shade and reduce physical exertion.",
    },
    {
      time: "12–4 PM",
      status: "Red",
      recommendation: "Peak heat hours. Stay indoors if possible. Hydrate constantly.",
    },
    {
      time: "4–6 PM",
      status: "Yellow",
      recommendation: "Heat subsiding but still warm. Light clothing recommended.",
    },
    {
      time: "6–8 PM",
      status: "Green",
      recommendation: "Temperatures dropping. Safe for outdoor activities.",
    }
  ],
  nearbyGreenAreas: [
    {
      id: "g1",
      name: "Eco Park",
      cleanAirScore: 92,
      distanceMeter: 650,
      walkTimeMin: 8,
    },
    {
      id: "g2",
      name: "City Botanical Gardens",
      cleanAirScore: 88,
      distanceMeter: 1200,
      walkTimeMin: 15,
    }
  ]
};
