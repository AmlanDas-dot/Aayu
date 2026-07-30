import { config } from '../config';

export const getDoctorSummary = async (lat: number = 0, lon: number = 0): Promise<any | null> => {
  try {
    const url = `${config.apiBaseUrl}/public-health/summary?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.summary) {
        return data.summary;
      }
    }
  } catch (error) {
    console.error("Error fetching doctor summary from API:", error);
  }
  return null;
};

export const getPatientDatabase = async (): Promise<Record<string, any> | null> => {
  return null;
};
