import { useState, useEffect } from "react";
import { getUserLocation } from "../services/api";

export interface LocationState {
  lat: number;
  lng: number;
}

export interface UseCurrentLocationResult {
  location: LocationState | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchLocation = async () => {
      try {
        setLoading(true);
        const { lat, lon } = await getUserLocation();
        if (mounted) {
          setLocation({ lat, lng: lon });
          setLoading(false);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          console.warn("Location fetch failed:", err);
          setError(err.message || "Failed to retrieve location.");
          setLoading(false);
        }
      }
    };

    fetchLocation();

    return () => {
      mounted = false;
    };
  }, []);

  return { location, loading, error };
}
