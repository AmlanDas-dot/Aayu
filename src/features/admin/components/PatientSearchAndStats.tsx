import { useState } from "react";

const STATS = [
  { label: "Total Registrations", value: "12,45,678", delta: "+8.7%", icon: "👥", color: "#0d9488" },
  { label: "Active This Month", value: "1,25,430", delta: "+6.3%", icon: "✅", color: "#10b981" },
  { label: "Health Facilities", value: "8,765", delta: "+4.1%", icon: "🏥", color: "#3b82f6" },
  { label: "Health Camps", value: "234", delta: "+5.2%", icon: "⛺", color: "#7c3aed" },
];

export function PatientSearchAndStats() {
  const [registrationId, setRegistrationId] = useState("");

  return (
    <section className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">📋 Access Patient Records</h2>
      </div>
      <div className="patient-record-layout">
        <div className="patient-record-form">
          <p className="patient-record-sub">Search by Registration ID to view profile, screenings, or health records.</p>
          <div className="record-input-row">
            <input
              type="text"
              className="record-id-input"
              placeholder="Enter Registration ID (AAYU ID)"
              value={registrationId}
              onChange={e => setRegistrationId(e.target.value)}
            />
            <button className="record-access-btn">🔍 Access Record</button>
          </div>
          <p className="record-secure-note">🔒 Secure access to patient data. Your activity is logged for audit.</p>
        </div>
        <div className="stats-row">
          {STATS.map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-delta" style={{ color: "#10b981" }}>↑ {s.delta} from Apr 2024</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
