import { HospitalMap } from "@/features/hospitals/components/HospitalMap";
import { type HospitalFacility } from "@/services/api";

const HEALTHCARE_REFS = [
  { name: "Primary Health Centre – Shindwadi", type: "PHC", dist: "2.1 km", hours: "Open 24x7" },
  { name: "Community Health Centre – Haveli", type: "CHC", dist: "6.8 km", hours: "Open 24x7" },
  { name: "Sahyadri Hospital – Pune", type: "Hospital", dist: "12.3 km", hours: "Open 24x7" },
];

const MOCK_USER_LOCATION = { lat: 18.5204, lon: 73.8567 };
const HEALTHCARE_FACILITIES: HospitalFacility[] = [
  { name: "Primary Health Centre – Shindwadi", address: "Shindwadi", type: "PHC", lat: 18.51, lon: 73.84, distance_km: 2.1, phone: "Not listed" },
  { name: "Community Health Centre – Haveli", address: "Haveli", type: "CHC", lat: 18.55, lon: 73.89, distance_km: 6.8, phone: "Not listed" },
  { name: "Sahyadri Hospital – Pune", address: "Pune", type: "Hospital", lat: 18.52, lon: 73.86, distance_km: 12.3, phone: "Not listed" },
];

export function ReferralMap() {
  return (
    <section className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">📍 Nearest Healthcare Access</h2>
        <button className="admin-view-all">View Referral Map →</button>
      </div>
      <div className="healthcare-map-placeholder admin-map-wrapper" style={{ margin: "16px 0", borderRadius: "12px", overflow: "hidden", height: "180px", display: "block" }}>
        <HospitalMap 
          userLocation={MOCK_USER_LOCATION} 
          facilities={HEALTHCARE_FACILITIES} 
          selectedFacility={null} 
        />
      </div>
      <div className="healthcare-refs">
        {HEALTHCARE_REFS.map(h => (
          <div key={h.name} className="href-item">
            <div className="href-icon">{h.type === "PHC" ? "🏛️" : h.type === "CHC" ? "🏥" : "🏢"}</div>
            <div className="href-info">
              <div className="href-name">{h.name}</div>
              <div className="href-type">{h.type} · {h.hours}</div>
            </div>
            <div className="href-dist">{h.dist}</div>
          </div>
        ))}
      </div>
      <p className="referral-tip">Tap "View Referral Map" to see full network & route</p>
    </section>
  );
}
