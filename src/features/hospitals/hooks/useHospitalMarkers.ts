import { useMemo, useState, useCallback } from "react";
import type { MapMarker } from "@/types/MapMarker";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { searchNearbyHealthcare, type NormalizedFacility } from "@/services/maps/placesService";

interface UseHospitalMarkersProps {
  userLocation?: { lat: number; lon: number } | null;
  filter?: string;
}

export function useHospitalMarkers({ userLocation, filter = "all" }: UseHospitalMarkersProps = {}) {
  const { location: browserLocation, loading: locationLoading, error: locationError } = useCurrentLocation();
  const [allFacilities, setAllFacilities] = useState<NormalizedFacility[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Resolve the map center: explicit > browser > fallback
  const center = useMemo(() => {
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lon };
    if (browserLocation) return { lat: browserLocation.lat, lng: browserLocation.lng };
    return { lat: 20.2961, lng: 85.8245 }; // Bhubaneswar fallback
  }, [userLocation, browserLocation]);

  const searchHealthcare = useCallback(async (radius: number) => {
    if (!center.lat || !center.lng) return;
    setIsSearching(true);
    setSearchError("");

    // Always fetch a broad set of categories to allow local filtering
    const categories = ["hospital", "medical_clinic", "pharmacy", "doctor"];

    try {
      const results = await searchNearbyHealthcare({
        lat: center.lat,
        lng: center.lng,
        radius,
        categories
      });
      setAllFacilities(results);
    } catch (err: any) {
      setSearchError(err.message || "Failed to search healthcare.");
      setAllFacilities([]);
    } finally {
      setIsSearching(false);
    }
  }, [center]);

  // Derive active facilities via local filter
  const facilities = useMemo(() => {
    if (filter === "all") return allFacilities;
    return allFacilities.filter(f => {
      const t = f.type?.toLowerCase() || "";
      if (filter === "hospital") return t.includes("hospital");
      if (filter === "clinic") return t.includes("clinic") || t.includes("doctor");
      if (filter === "health_centre") return t.includes("hospital") || t.includes("clinic");
      if (filter === "pharmacy") return t.includes("pharmacy");
      if (filter === "rehab") return t.includes("rehab") || t.includes("psychiatric") || t.includes("mental") || t.includes("hospital") || t.includes("clinic");
      return true;
    });
  }, [allFacilities, filter]);

  // Build markers
  const markers = useMemo<MapMarker[]>(() => {
    const result: MapMarker[] = [];

    // User pin
    result.push({
      id: "user-location",
      lat: center.lat,
      lng: center.lng,
      label: "You are here",
      emoji: "📍",
      bg: "#2563eb",
      border: "#1d4ed8",
      size: 36,
      isUser: true,
    });

    facilities.forEach((f, idx) => {
      const typeLower = f.type?.toLowerCase() || "";
      
      let emoji = "🏥";
      let bg = "#dc2626";
      let border = "#b91c1c";

      if (typeLower.includes("clinic") || typeLower.includes("doctor")) {
        emoji = "🩺"; bg = "#7c3aed"; border = "#6d28d9";
      } else if (typeLower.includes("pharmacy")) {
        emoji = "💊"; bg = "#059669"; border = "#047857";
      } else if (typeLower.includes("rehab") || typeLower.includes("psychiatric") || typeLower.includes("mental")) {
        emoji = "🧠"; bg = "#ec4899"; border = "#be185d";
      } else if (typeLower.includes("health")) {
        emoji = "🏨"; bg = "#d97706"; border = "#b45309";
      }

      result.push({
        id: f.id || `facility-${idx}`,
        lat: f.latitude,
        lng: f.longitude,
        label: f.name,
        emoji,
        bg,
        border,
        size: 32,
      });
    });

    return result;
  }, [center, facilities]);

  return { 
    center, 
    markers, 
    facilities, 
    locationLoading, 
    locationError, 
    isSearching, 
    searchError, 
    searchHealthcare 
  };
}
