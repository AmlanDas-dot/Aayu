import { useState, useEffect } from "react";
import { useHealthContext } from "@/hooks/useHealthContext";
import { getUserLocation } from "@/services/api";
import type { NormalizedFacility } from "@/services/maps/placesService";

import { GoogleMapView } from "@/components/Map/GoogleMapView";
import type { MapMarker } from "@/types/MapMarker";
import { useHospitalMarkers } from "@/features/hospitals/hooks/useHospitalMarkers";
import { HospitalHero } from "@/features/hospitals/components/HospitalHero";
import { HospitalFilters } from "@/features/hospitals/components/HospitalFilters";
import { HospitalCards } from "@/features/hospitals/components/HospitalCards";
import { HospitalStatus } from "@/features/hospitals/components/HospitalStatus";
import "@/features/hospitals/components/HospitalMap.css";

export function HospitalPage() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [filter, setFilter] = useState("all");
  const [radius, setRadius] = useState(5000);
  const [selectedFacility, setSelectedFacility] = useState<NormalizedFacility | null>(null);
  const [fetched, setFetched] = useState(false);
  const [processingStage, setProcessingStage] = useState<{icon: string, text: string} | null>(null);

  const { selectedMember } = useHealthContext();

  const { 
    center, 
    markers, 
    facilities, 
    locationLoading, 
    locationError, 
    isSearching, 
    searchError, 
    searchHealthcare 
  } = useHospitalMarkers({
    userLocation: coords,
    filter,
  });

  function handleMarkerClick(marker: MapMarker) {
    if (marker.isUser) return;
    const matched = facilities.find((f) => f.id === marker.id);
    if (matched) {
      setSelectedFacility(matched);
      // Auto-scroll sidebar
      const card = document.getElementById(`facility-card-${matched.id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  async function handleFind() {
    try {
      setProcessingStage({ icon: "📍", text: "Obtaining your location..." });
      const loc = await getUserLocation();
      setCoords(loc);
      setProcessingStage({ icon: "🏥", text: "Searching nearby healthcare..." });
      await searchHealthcare(radius);
      setFetched(true);
    } catch (e: any) {
      console.error(e);
    } finally {
      setProcessingStage(null);
    }
  }

  // Handle URL parameters for automatic search (Screening -> Hospital Flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoSearch") === "true" && !fetched && !isSearching && !coords) {
      handleFind();
    }
  }, []);

  async function handleRefresh() {
    if (!coords) {
      return handleFind();
    }
    setProcessingStage({ icon: "🏥", text: "Searching nearby healthcare..." });
    await searchHealthcare(radius);
    setProcessingStage(null);
  }

  const showMapAndResults = fetched && !searchError && (facilities.length > 0 || isSearching);

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
            Find Nearby Healthcare for {selectedMember.name}
          </div>
        ) : (
           <div style={{ padding: '16px 24px', background: '#fef9c3', color: '#854d0e', fontWeight: 600, borderBottom: '1px solid #fef08a', borderRadius: '12px 12px 0 0' }}>
            General Healthcare Discovery
          </div>
        )}
        <HospitalHero />

        <HospitalFilters 
          filter={filter}
          setFilter={setFilter}
          radius={radius}
          setRadius={setRadius}
          loading={isSearching}
          fetched={fetched}
          onFind={fetched ? handleRefresh : handleFind}
        />

        <HospitalStatus 
          loading={isSearching}
          fetched={fetched}
          error={searchError}
          coords={coords}
          processingStage={processingStage}
          facilityCount={facilities.length}
        />

        {showMapAndResults && (
          <div className="nc-results-layout">
            {/* Interactive Map */}
            <div className="nc-map-area">
              {locationLoading ? (
                <div className="hospital-map-container hospital-map-loading">
                  <span className="hospital-map-spinner" />
                  <p>Detecting your location…</p>
                </div>
              ) : (
                <div className="hospital-map-container">
                  {locationError && (
                    <div className="hospital-map-location-notice">
                      📍 {locationError}
                    </div>
                  )}
                  <GoogleMapView
                    center={selectedFacility ? { lat: selectedFacility.latitude, lng: selectedFacility.longitude } : center}
                    markers={markers}
                    zoom={selectedFacility ? 16 : 14}
                    height="100%"
                    selectedMarkerId={selectedFacility?.id}
                    onMarkerClick={handleMarkerClick}
                  />
                </div>
              )}
            </div>

            {/* Results Sidebar */}
            <div className="nc-results-list">
              <HospitalCards 
                facilities={facilities}
                radius={radius}
                selectedFacility={selectedFacility}
                onSelectFacility={setSelectedFacility}
                isSearching={isSearching}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
