import {
  EnvironmentData,
  AirQualityData,
  HeatData,
  GreenLocation,
  mockEnvironmentData,
} from "./environmentMock";

// TODO: Replace with Open-Meteo API, AQI API, Google Maps API, etc. in Phase 2
// For now, this service simply returns mock data.

export const getCurrentEnvironment = async (): Promise<EnvironmentData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockEnvironmentData);
    }, 800); // Simulate network latency
  });
};

export const getAirQuality = async (): Promise<AirQualityData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockEnvironmentData.airQuality);
    }, 500);
  });
};

export const getHeatIndex = async (): Promise<HeatData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockEnvironmentData.heat);
    }, 500);
  });
};

export const getGreenZones = async (): Promise<GreenLocation[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockEnvironmentData.nearbyGreenAreas);
    }, 500);
  });
};

export const getRecommendations = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockEnvironmentData.outdoorScore.status);
    }, 500);
  });
};
