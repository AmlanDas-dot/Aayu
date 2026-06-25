import { useState } from "react";
import {
  findNearbyHospitals,
  getUserLocation,
  type HospitalFacility,
} from "../services/api";

const TYPE_ICONS: Record<string, string> = {
  Hospital: "🏥",
  Clinic: "🏪",
  "Primary Health Centre": "🏛️",
  Doctor: "👨‍⚕️",
  Pharmacy: "💊",
};

const FACILITY_FILTERS = [
  { id: "all",          label: "All" },
  { id: "hospital",     label: "🏥 Hospitals" },
  { id: "clinic",       label: "🏪 Clinics" },
  { id: "health_centre",label: "🏛️ PHCs" },
  { id: "pharmacy",     label: "💊 Pharmacies" },
];

const RADIUS_OPTIONS = [
  { value: 2000,  label: "2 km" },
  { value: 5000,  label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
];

function FacilityCard({ f }: { f: HospitalFacility }) {
  const icon = TYPE_ICONS[f.type] ?? "🏥";
  return (
    <div className="search-result-card" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">{icon} {f.name}</h3>
          <span className="card-category">{f.type} · {f.distance_km} km away</span>
        </div>
        <span style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: f.distance_km <= 1 ? "#10b981" : f.distance_km <= 3 ? "#f59e0b" : "#6b7280",
        }}>
          {f.distance_km} km
        </span>
      </div>

      {f.address && (
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #aaa)", margin: 0 }}>
          📍 {f.address}
        </p>
      )}

      {f.phone && (
        <a
          href={`tel:${f.phone}`}
          style={{
            fontSize: "0.82rem",
            color: "#10b981",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          📞 {f.phone}
        </a>
      )}
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

  async function handleFind() {
    setLoading(true);
    setError("");
    try {
      const loc = await getUserLocation();
      setCoords(loc);
      const resp = await findNearbyHospitals(loc.lat, loc.lon, radius, filter);
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

  async function handleRefresh() {
    if (!coords) return handleFind();
    setLoading(true);
    setError("");
    try {
      const resp = await findNearbyHospitals(coords.lat, coords.lon, radius, filter);
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
    <div className="search-page">
      <div className="search-hero">
        <h1 className="search-hero-title">🏥 Nearby Healthcare</h1>
        <p className="search-hero-sub">
          Find hospitals, clinics, PHCs and pharmacies near you using OpenStreetMap
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: "1.25rem", alignItems: "center" }}>
        {/* Facility type filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FACILITY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.78rem",
                background: filter === f.id ? "var(--accent, #10b981)" : "rgba(255,255,255,0.08)",
                color: filter === f.id ? "#fff" : "var(--text-muted, #aaa)",
                transition: "all 0.2s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Radius select */}
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="search-collection-select"
          style={{ minWidth: 90 }}
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        {/* Search button */}
        <button
          id="hospital-find-btn"
          className="search-submit-btn"
          onClick={fetched ? handleRefresh : handleFind}
          disabled={loading}
          style={{ padding: "8px 20px" }}
        >
          {loading ? "⏳" : fetched ? "🔄 Refresh" : "📍 Find Near Me"}
        </button>
      </div>

      {coords && (
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted, #888)", marginBottom: "0.75rem" }}>
          📍 Using your location: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
        </p>
      )}

      {error && <div className="search-error">⚠️ {error}</div>}

      {loading && (
        <div className="search-loading">
          <div className="loading-spinner" />
          <p>Searching nearby facilities…</p>
        </div>
      )}

      {!loading && fetched && facilities.length === 0 && (
        <div className="search-empty">
          <span className="empty-icon">🏥</span>
          <h3>No facilities found</h3>
          <p>Try increasing the search radius or check your internet connection.</p>
        </div>
      )}

      {!loading && facilities.length > 0 && (
        <>
          <p className="results-count">
            {facilities.length} facilit{facilities.length !== 1 ? "ies" : "y"} within {radius / 1000} km
          </p>
          <div className="results-grid">
            {facilities.map((f, i) => (
              <FacilityCard key={`${f.name}-${i}`} f={f} />
            ))}
          </div>
        </>
      )}

      {!fetched && !loading && (
        <div className="search-placeholder">
          <span className="placeholder-icon">📍</span>
          <h3>Find Healthcare Near You</h3>
          <p>Click "Find Near Me" to locate hospitals, clinics, and pharmacies using your GPS location.</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted, #aaa)", marginTop: 8 }}>
            Requires internet connection and location permission.
          </p>
        </div>
      )}
    </div>
  );
}
