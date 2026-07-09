import { useState, useEffect } from "react";
import {
  findNearbyHospitals,
  getUserLocation,
  type HospitalFacility,
} from "@/services/api";
import { LoadingStatus } from "@/components/LoadingStatus";
import { HospitalMap } from "@/features/hospitals/components/HospitalMap";

const TYPE_ICONS: Record<string, string> = {
  Hospital: "🏥",
  Clinic: "🏪",
  "Primary Health Centre": "🏛️",
  Doctor: "👨‍⚕️",
  Pharmacy: "💊",
};

const FACILITY_FILTERS = [
  { id: "all",           label: "All",          icon: "" },
  { id: "hospital",      label: "Hospitals",    icon: "fa-solid fa-hospital" },
  { id: "clinic",        label: "Clinics",      icon: "fa-solid fa-stethoscope" },
  { id: "health_centre", label: "PHCs",         icon: "fa-solid fa-house-medical" },
  { id: "pharmacy",      label: "Pharmacies",   icon: "fa-solid fa-pills" },
];

const RADIUS_OPTIONS = [
  { value: 2000,  label: "2 km" },
  { value: 5000,  label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
];

function FacilityCard({ f, onClick, isSelected }: { f: HospitalFacility; onClick?: () => void; isSelected?: boolean }) {
  const icon = TYPE_ICONS[f.type] ?? "🏥";
  const distClass = f.distance_km <= 1 ? "close" : f.distance_km <= 3 ? "mid" : "far";
  
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`;

  return (
    <div className={`nc-facility-card ${isSelected ? "selected" : ""}`} onClick={onClick}>
      <div className="nc-facility-icon">{icon}</div>
      <div className="nc-facility-info">
        <div className="nc-facility-name">{f.name}</div>
        <div className="nc-facility-meta">
          <span className="nc-facility-type">{f.type}</span>
          {f.open_now !== undefined && f.open_now !== null && (
            <span className={`nc-facility-status ${f.open_now ? "open" : "closed"}`}>
              {f.open_now ? "🟢 Open Now" : "🔴 Closed"}
            </span>
          )}
        </div>
        {f.address && (
          <div className="nc-facility-address">📍 {f.address}</div>
        )}
        <div className="nc-facility-actions">
          {f.phone && (
            <a
              href={`tel:${f.phone}`}
              className="nc-action-link phone"
              onClick={(e) => e.stopPropagation()}
            >
              📞 {f.phone}
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="nc-action-link directions"
            onClick={(e) => e.stopPropagation()}
          >
            🗺️ Directions
          </a>
        </div>
      </div>
      <div className="nc-facility-distance">
        <span className={`nc-distance-value ${distClass}`}>
          {f.distance_km}
        </span>
        <span className="nc-distance-unit">km away</span>
      </div>
    </div>
  );
}

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

        {/* Header */}
        <div className="nc-tool-header">
          <div className="nc-title-wrapper">
            <div className="nc-icon-box">
              <i className="fa-solid fa-hospital-user"></i>
            </div>
            <div>
              <h2>Nearby Healthcare</h2>
              <p>Find hospitals, clinics, PHCs and pharmacies near you</p>
            </div>
          </div>
        </div>

        {/* Controls / Filters */}
        <div className="nc-tool-controls">
          <div className="nc-filter-pills">
            {FACILITY_FILTERS.map((f) => (
              <button
                key={f.id}
                className={`nc-pill ${filter === f.id ? "active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.icon && <i className={f.icon}></i>}
                {f.label}
              </button>
            ))}
          </div>

          <div className="nc-action-group">
            <select
              className="nc-radius-select"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <button
              id="hospital-find-btn"
              className="nc-btn-primary"
              onClick={fetched ? handleRefresh : handleFind}
              disabled={loading}
            >
              <i className={loading ? "fa-solid fa-spinner fa-spin" : fetched ? "fa-solid fa-rotate" : "fa-solid fa-map-pin"}></i>
              {loading ? "Searching..." : fetched ? "Refresh" : "Find Near Me"}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="nc-status-container">
          {coords && (
            <div className="nc-location-status">
              <i className="fa-solid fa-location-crosshairs"></i>
              Using your location: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
            </div>
          )}

          {error && (
            <div className="nc-error-banner">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && processingStage && (
          <div className="nc-loading-wrap">
            <LoadingStatus icon={processingStage.icon} status={processingStage.text} />
          </div>
        )}

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

        {/* Empty State (before search) */}
        {!fetched && !loading && (
          <div className="nc-empty-state">
            <div className="nc-empty-content">
              <div className="nc-pin-icon">
                <i className="fa-solid fa-map-location-dot"></i>
              </div>
              <h3>Find Healthcare Near You</h3>
              <p>📍 Find nearby hospitals, PHCs and pharmacies using your current location.</p>
              <span className="nc-sub-text">Requires internet connection and location permission.</span>
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && fetched && facilities.length === 0 && (
          <div className="nc-no-results">
            <span className="nc-no-icon">🏥</span>
            <h3>No facilities found</h3>
            <p>Try increasing the search radius or check your internet connection.</p>
          </div>
        )}

        {/* Results */}
        {!loading && facilities.length > 0 && (
          <>
            <p className="nc-results-header">
              {facilities.length} facilit{facilities.length !== 1 ? "ies" : "y"} within {radius / 1000} km
            </p>
            <div className="nc-results-grid">
              {facilities.map((f, i) => (
                <FacilityCard
                  key={`${f.name}-${i}`}
                  f={f}
                  onClick={() => setSelectedFacility(f)}
                  isSelected={selectedFacility?.name === f.name}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
