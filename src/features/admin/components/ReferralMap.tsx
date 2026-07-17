// 


const HEALTHCARE_REFS = [
  { name: "Primary Health Centre – Shindwadi", type: "PHC", dist: "2.1 km", hours: "Open 24x7" },
  { name: "Community Health Centre – Haveli", type: "CHC", dist: "6.8 km", hours: "Open 24x7" },
  { name: "Sahyadri Hospital – Pune", type: "Hospital", dist: "12.3 km", hours: "Open 24x7" },
];

export function ReferralMap() {
  return (
    <section className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">📍 Nearest Healthcare Access</h2>
        <button className="admin-view-all">View Referral Map →</button>
      </div>
      <div className="healthcare-map-placeholder admin-map-wrapper" style={{ margin: "16px 0", borderRadius: "12px", overflow: "hidden", height: "180px", display: "block" }}>
        // <div>Map View Disabled</div>
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
