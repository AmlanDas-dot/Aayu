import { useState, useEffect } from "react";

export interface LocationState {
  lat: number;
  lng: number;
}

export interface UseCurrentLocationResult {
  location: LocationState | null;
  loading: boolean;
  error: string | null;
}

// Bhubaneswar fallback
const FALLBACK_LOCATION: LocationState = {
  lat: 20.2961,
  lng: 85.8245,
};

export function useCurrentLocation(): UseCurrentLocationResult {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported. Showing Bhubaneswar.");
      setLocation(FALLBACK_LOCATION);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (_err) => {
        setError("Location permission denied. Showing Bhubaneswar.");
        setLocation(FALLBACK_LOCATION);
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { location, loading, error };
}
