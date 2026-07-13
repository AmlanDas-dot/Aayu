import { useState, useEffect } from "react";
import { useHealthContext } from "@/hooks/useHealthContext";
import {
  findNearbyHospitals,
  getUserLocation,
  type HospitalFacility,
} from "@/services/api";

import { HospitalMap } from "@/features/hospitals/components/HospitalMap";
import { HospitalHero } from "@/features/hospitals/components/HospitalHero";
import { HospitalFilters } from "@/features/hospitals/components/HospitalFilters";
import { HospitalCards } from "@/features/hospitals/components/HospitalCards";
import { HospitalStatus } from "@/features/hospitals/components/HospitalStatus";

export function HospitalPage() {
  const [facilities, setFacilities] = useState<HospitalFacility[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [fetched, setFetched]       = useState(false);
  const [filter, setFilter]         = useState("all");
  const [radius, setRadius]         = useState(5000);
  const [coords, setCoords]         = useState<{ lat: number; lon: number } | null>(null);
  const [processingStage, setProcessingStage] = useState<{icon: string, text: string} | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<HospitalFacility | null>(null);
  const { selectedMember } = useHealthContext();

  async function handleFind() {
    setLoading(true);
    setProcessingStage({ icon: "📍", text: "Finding nearby healthcare..." });
    setError("");
    try {
      setProcessingStage({ icon: "📍", text: "Obtaining your location..." });
      const loc = await getUserLocation();
      setCoords(loc);
      setProcessingStage({ icon: "🏥", text: "Searching nearby facilities..." });
      const resp = await findNearbyHospitals(loc.lat, loc.lon, radius, filter);
      setProcessingStage({ icon: "💬", text: "Preparing results..." });
      setFacilities(resp.facilities);
      setFetched(true);
    } catch (e: any) {
      const msg = e.message ?? "";
      if (msg.includes("fetch")) {
        setError("Backend server is offline. Start it with: python -m uvicorn app.main:app --reload");
      } else if (msg.includes("502") || msg.includes("504")) {
        setError("Hospital search timed out. OpenStreetMap may be slow — try again in a moment.");
      } else {
        setError(msg || "Hospital search failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle URL parameters for automatic search (Screening -> Hospital Flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoSearch") === "true" && !fetched && !loading && !coords) {
      handleFind();
    }
  }, []);

  async function handleRefresh() {
    if (!coords) return handleFind();
    setLoading(true);
    setProcessingStage({ icon: "🏥", text: "Searching nearby facilities..." });
    setError("");
    try {
      const resp = await findNearbyHospitals(coords.lat, coords.lon, radius, filter);
      setProcessingStage({ icon: "💬", text: "Preparing results..." });
      setFacilities(resp.facilities);
    } catch (e: any) {
      const msg = e.message ?? "";
      if (msg.includes("fetch")) {
        setError("Backend server is offline. Start it with: python -m uvicorn app.main:app --reload");
      } else if (msg.includes("502") || msg.includes("504")) {
        setError("Hospital search timed out. OpenStreetMap may be slow — try again in a moment.");
      } else {
        setError(msg || "Hospital search failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nc-page-container">

      {/* Disclaimer Banner */}
      <div className="nc-warning-banner">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <p>AAYU provides general health information and guidance only. It does not diagnose conditions or replace professional medical advice. Always consult a qualified healthcare professional.</p>
      </div>

      {/* Main Tool Card */}
      <div className="nc-tool-card">

        {selectedMember ? (
          <div style={{ padding: '16px 24px', background: '#f0fdfa', color: '#0f766e', fontWeight: 600, borderBottom: '1px solid #ccfbf1', borderRadius: '12px 12px 0 0' }}>
            Find Nearby Hospitals for {selectedMember.name}
          </div>
        ) : (
           <div style={{ padding: '16px 24px', background: '#fef9c3', color: '#854d0e', fontWeight: 600, borderBottom: '1px solid #fef08a', borderRadius: '12px 12px 0 0' }}>
            General Hospital Search (Select a member in Family for personalized routing)
          </div>
        )}
        <HospitalHero />

        <HospitalFilters 
          filter={filter}
          setFilter={setFilter}
          radius={radius}
          setRadius={setRadius}
          loading={loading}
          fetched={fetched}
          onFind={fetched ? handleRefresh : handleFind}
        />

        <HospitalStatus 
          loading={loading}
          fetched={fetched}
          error={error}
          coords={coords}
          processingStage={processingStage}
          facilityCount={facilities.length}
        />

        {/* Interactive Map */}
        {!loading && fetched && coords && facilities.length > 0 && (
          <div className="nc-map-area">
            <HospitalMap
              userLocation={coords}
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={setSelectedFacility}
            />
          </div>
        )}

        {/* Results */}
        {!loading && (
          <HospitalCards 
            facilities={facilities}
            radius={radius}
            selectedFacility={selectedFacility}
            onSelectFacility={setSelectedFacility}
          />
        )}

      </div>
    </div>
  );
}
