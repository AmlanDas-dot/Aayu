import { useEffect, useState } from "react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { searchNearbyHealthcare, type NormalizedFacility } from "@/services/maps/placesService";
import type { HealthcareRecommendation } from "../types/chat";

interface EmergencyNearbyCareProps {
  recommendation: HealthcareRecommendation;
}

export function EmergencyNearbyCare({ recommendation }: EmergencyNearbyCareProps) {
  const { location, loading: locationLoading, error: locationError } = useCurrentLocation();
  const [facilities, setFacilities] = useState<NormalizedFacility[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchFacilities() {
      if (!location) return;
      setFetching(true);
      setError("");
      
      try {
        const results = await searchNearbyHealthcare({
          lat: location.lat,
          lng: location.lng,
          radius: recommendation.radius || 10000,
          categories: recommendation.facility_types || ["hospital"],
        });
        
        if (active) {
          // Slice top 3
          setFacilities(results.slice(0, 3));
        }
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load nearby facilities.");
      } finally {
        if (active) setFetching(false);
      }
    }

    if (location && recommendation.enabled) {
      fetchFacilities();
    }

    return () => {
      active = false;
    };
  }, [location, recommendation]);

  if (!recommendation.enabled) return null;

  const getUrgencyColor = () => {
    switch (recommendation.urgency) {
      case "critical": return "#ef4444"; // red-500
      case "urgent": return "#f97316"; // orange-500
      default: return "#3b82f6"; // blue-500
    }
  };

  const color = getUrgencyColor();

  return (
    <div style={{
      marginTop: "16px",
      borderRadius: "12px",
      border: `1px solid ${color}40`,
      background: "#ffffff",
      overflow: "hidden",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      width: "100%",
    }}>
      {/* Header */}
      <div style={{
        background: `${color}15`,
        padding: "12px 16px",
        borderBottom: `1px solid ${color}20`,
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <i className="fa-solid fa-truck-medical" style={{ color }}></i>
        <div>
          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
            {recommendation.title}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            {recommendation.message || "Based on your current location"}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Location Error State */}
        {locationError && !location && (
          <div style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            padding: "12px",
            borderRadius: "8px",
            color: "#92400e",
            fontSize: "13px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            textAlign: "center"
          }}>
            <i className="fa-solid fa-location-dot" style={{ fontSize: "20px" }}></i>
            <div>
              <strong>📍 Location access required.</strong>
              <div style={{ marginTop: "4px", fontSize: "12px", color: "#b45309" }}>
                Please enable location access in your browser settings to find nearby hospitals.
              </div>
            </div>

          </div>
        )}

        {/* Loading State */}
        {(locationLoading || fetching) && !locationError && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f1f5f9", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ height: "12px", background: "#f1f5f9", borderRadius: "4px", width: "70%", animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "4px", width: "40%", animation: "pulse 1.5s infinite" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data Error State */}
        {error && location && (
          <div style={{ color: "#b91c1c", fontSize: "13px", padding: "12px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", textAlign: "center" }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "18px", marginBottom: "8px" }}></i>
            <div style={{ fontWeight: 600 }}>Cannot load nearby facilities</div>
            <div style={{ marginTop: "4px", color: "#991b1b" }}>{error === "Failed to fetch" ? "Please check your internet connection." : error}</div>
          </div>
        )}

        {/* Facilities List */}
        {!fetching && !locationLoading && facilities.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {facilities.map((f, idx) => {
              const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`;
              return (
                <div key={f.id || idx} style={{
                  display: "flex",
                  gap: "12px",
                  paddingBottom: idx !== facilities.length - 1 ? "16px" : "0",
                  borderBottom: idx !== facilities.length - 1 ? "1px solid #f1f5f9" : "none"
                }}>
                  <div style={{
                    width: "36px", height: "36px",
                    borderRadius: "10px", background: `${color}15`,
                    color, display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: "18px"
                  }}>
                    {f.type?.toLowerCase().includes("pharmacy") ? "💊" : "🏥"}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {f.name}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b", marginTop: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "#0f766e" }}>{f.distance_km.toFixed(1)} km</span>
                      
                      <span style={{ color: "#cbd5e1" }}>•</span>
                      <span style={{ fontWeight: 600, color: "#475569" }}>
                        <i className="fa-solid fa-car"></i> ~{Math.max(1, Math.round(f.distance_km * 3))} min drive
                      </span>
                      
                      {f.rating && (
                        <>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <span style={{ color: "#d97706", fontWeight: 600 }}>⭐ {f.rating}</span>
                        </>
                      )}
                      
                      {f.openNow !== undefined && (
                        <>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <span style={{ color: f.openNow ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            {f.openNow ? "🟢 Open" : "🔴 Closed"}
                          </span>
                        </>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: color, color: "white", padding: "6px 12px",
                          borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px"
                        }}
                      >
                        <i className="fa-solid fa-location-arrow"></i> Navigate
                      </a>
                      
                      {f.phone && (
                        <a
                          href={`tel:${f.phone}`}
                          style={{
                            background: "#f1f5f9", color: "#334155", padding: "6px 12px",
                            borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px"
                          }}
                        >
                          <i className="fa-solid fa-phone"></i> Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!fetching && !locationLoading && location && !error && facilities.length === 0 && (
          <div style={{ textAlign: "center", color: "#64748b", fontSize: "13px", padding: "8px 0" }}>
            No nearby facilities found.
          </div>
        )}
      </div>
    </div>
  );
}
