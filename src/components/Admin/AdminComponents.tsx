import { useState } from "react";
import { HospitalMap } from "../Map/HospitalMap";
import { type HospitalFacility } from "../../services/api";
import mapsImage from "../../assets/maps.jpeg";

const ALERTS = [
  { id: "dengue", title: "Dengue Outbreak", desc: "High risk in 8 districts of Maharashtra", priority: "High Priority", color: "#ef4444", icon: "🦟", bg: "#fef2f2" },
  { id: "malnutrition", title: "Malnutrition Cases", desc: "Rising cases in Bihar & Jharkhand", priority: "Medium Priority", color: "#f59e0b", icon: "⚠️", bg: "#fffbeb" },
  { id: "respiratory", title: "Respiratory Infection Surge", desc: "Increases reported in North-East region", priority: "Medium Priority", color: "#f59e0b", icon: "🫁", bg: "#fffbeb" },
  { id: "immunization", title: "Low Immunization Coverage", desc: "Coverage below 60% in 12 months", priority: "Low Priority", color: "#10b981", icon: "💉", bg: "#f0fdf4" },
];

export function AdminAlertCards() {
  return (
    <div className="admin-top-grid">
      <section className="admin-card admin-alerts-card">
        <div className="admin-section-header">
          <h2 className="admin-section-title">🔔 Alerts & Outbreaks</h2>
          <button className="admin-view-all">View All Alerts →</button>
        </div>
        <div className="alerts-outbreak-grid">
          {ALERTS.map(alert => (
            <div key={alert.id} className="outbreak-card" style={{ background: alert.bg, borderTop: `3px solid ${alert.color}` }}>
              <div className="outbreak-icon">{alert.icon}</div>
              <div className="outbreak-title">{alert.title}</div>
              <p className="outbreak-desc">{alert.desc}</p>
              <span className="outbreak-priority" style={{ background: alert.color + "22", color: alert.color }}>{alert.priority}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card admin-ai-card">
        <div className="admin-section-header">
          <h2 className="admin-section-title">🤖 AI Prediction & Early Warning</h2>
          <button className="admin-view-all">View Details →</button>
        </div>
        <div className="ai-prediction-body">
          <div className="ai-map-placeholder">
            <div className="map-placeholder-box"></div>
          </div>
          <div className="ai-alert-box">
            <p className="ai-alert-text">AI predicts elevated dengue risk in <strong>3 districts</strong> in the next 2 weeks.</p>
            <span className="ai-risk-badge">🔴 High Risk</span>
          </div>
        </div>
      </section>
    </div>
  );
}

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

const SCREENING_DATA = {
  registered: 45689,
  screened: 28764,
  positive: 2013,
  rate: "7.00%",
};

const RISK_DISTRICTS = [
  { name: "Pune, Maharashtra", risk: "Very High", color: "#0b537c" },
  { name: "Thane, Maharashtra", risk: "High", color: "#2b7a9b" },
  { name: "Nagpur, Maharashtra", risk: "High", color: "#2b7a9b" },
  { name: "Patna, Bihar", risk: "High", color: "#2b7a9b" },
  { name: "Nashik, Maharashtra", risk: "Medium", color: "#5c9eb2" },
];

export function AnalyticsAndMaps() {
  return (
    <>
      <section className="admin-card">
        <div className="admin-section-header">
          <h2 className="admin-section-title">📊 Endemic Disease Screening Overview ℹ️</h2>
        </div>
        <div className="screening-overview">
          <div className="screening-focus">
            🔬 <strong>Current Focus: Dengue</strong> · Hotspot: Maharashtra
          </div>
          <div className="screening-stats-row">
            <div className="sc-stat"><div className="sc-stat-icon">👥</div><div className="sc-stat-val">{SCREENING_DATA.registered.toLocaleString()}</div><div className="sc-stat-label">Registered in Hotspot</div></div>
            <div className="sc-stat"><div className="sc-stat-icon">🩺</div><div className="sc-stat-val">{SCREENING_DATA.screened.toLocaleString()}</div><div className="sc-stat-label">Screened</div></div>
            <div className="sc-stat danger-stat"><div className="sc-stat-icon">🦟</div><div className="sc-stat-val">{SCREENING_DATA.positive.toLocaleString()}</div><div className="sc-stat-label">Positive Cases</div></div>
            <div className="sc-stat"><div className="sc-stat-icon">📈</div><div className="sc-stat-val">{SCREENING_DATA.rate}</div><div className="sc-stat-label">Positive Screening Rate ℹ️</div></div>
          </div>
          <div className="trend-chart-wrap">
            <div className="trend-chart-title">Dengue Screening Trend <span>■ Screened ■ Positive</span></div>
            <div className="trend-chart-area">
              <div className="trend-y-labels">
                <span>40k</span><span>30k</span><span>20k</span><span>10k</span><span>0</span>
              </div>
              <div className="trend-bars">
                {[
                  { label: "01 May", screened: 65, positive: 18 },
                  { label: "08 May", screened: 72, positive: 22 },
                  { label: "15 May", screened: 80, positive: 28 },
                  { label: "22 May", screened: 76, positive: 32 },
                  { label: "29 May", screened: 85, positive: 35 },
                ].map(d => (
                  <div key={d.label} className="trend-bar-group">
                    <div className="trend-bar-screened" style={{ height: `${d.screened}%` }} />
                    <div className="trend-bar-positive" style={{ height: `${d.positive}%` }} />
                    <div className="trend-bar-label">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="trend-update">Last updated: 31 May 2024</p>
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-section-header">
          <h2 className="admin-section-title">🧬 Endemic Intelligence</h2>
          <button className="admin-view-all">View Map →</button>
        </div>
        <p className="endemic-map-label">Dengue Risk Map (India)</p>
        <div className="endemic-map-placeholder">
          <div className="map-placeholder-box" style={{ padding: 0, border: "none" }}>
            <img src={mapsImage} alt="Dengue Risk Map" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} />
          </div>
          <div className="map-legend-endemic">
            <div className="mle-item"><span className="mle-dot" style={{ background: "#0b537c", borderRadius: "4px" }} />Very High</div>
            <div className="mle-item"><span className="mle-dot" style={{ background: "#2b7a9b", borderRadius: "4px" }} />High</div>
            <div className="mle-item"><span className="mle-dot" style={{ background: "#5c9eb2", borderRadius: "4px" }} />Medium</div>
            <div className="mle-item"><span className="mle-dot" style={{ background: "#d2e8ef", borderRadius: "4px" }} />Low</div>
            <div className="mle-item"><span className="mle-dot" style={{ background: "#cccccc", borderRadius: "4px" }} />No Data</div>
          </div>
        </div>
        <div className="top-risk-districts">
          <div className="trd-header">Top 5 High Risk Districts <button className="admin-view-all">View All →</button></div>
          {RISK_DISTRICTS.map(d => (
            <div key={d.name} className="trd-item">
              <span className="trd-dot" style={{ background: d.color }} />
              <span className="trd-name">{d.name}</span>
              <span className="trd-risk" style={{ color: d.color }}>{d.risk}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const RESOURCE_STOCK = [
  { item: "Dengue RDT Kits", stock: "6 days", status: "Low Stock", statusColor: "#ef4444" },
  { item: "ORS Packets", stock: "10 days", status: "Adequate", statusColor: "#10b981" },
  { item: "Iron Folic Tablets", stock: "21 days", status: "Adequate", statusColor: "#10b981" },
  { item: "Vaccine Carrier Boxes", stock: "18 days", status: "Adequate", statusColor: "#10b981" },
];

export function ResourceAllocation() {
  return (
    <section className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">📦 Resource Needs & Logistics</h2>
        <span className="ai-tag-badge">🤖 AI</span>
      </div>
      <h4 className="resource-subtitle">Allocation Overview</h4>
      <div className="allocation-layout">
        <div className="allocation-donut">
          <svg viewBox="0 0 100 100" className="alloc-svg">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="18" strokeDasharray="152 87" strokeDashoffset="-15" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray="54 185" strokeDashoffset="-167" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="18" strokeDasharray="33 206" strokeDashoffset="-221" />
            <text x="50" y="47" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="800" className="alloc-text-center">72%</text>
            <text x="50" y="57" textAnchor="middle" fill="#64748b" fontSize="5" className="alloc-text-center">Optimal Allocation</text>
          </svg>
          <div className="alloc-legend">
            <div className="al-item"><span className="al-dot" style={{ background: "#10b981" }} />Optimal (1,234)</div>
            <div className="al-item"><span className="al-dot" style={{ background: "#f59e0b" }} />Under-Allocated (314)</div>
            <div className="al-item"><span className="al-dot" style={{ background: "#ef4444" }} />Over-Allocated (172)</div>
          </div>
        </div>
        <div className="resource-stock-table">
          <div className="rst-header-row">
            <span>Item</span><span>Stock</span><span>Status</span>
          </div>
          {RESOURCE_STOCK.map(r => (
            <div key={r.item} className="rst-row">
              <span className="rst-item">{r.item}</span>
              <span className="rst-stock">{r.stock}</span>
              <span className="rst-status" style={{ color: r.statusColor }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="resource-why-card">
        ⚠️ Adequate stock ensures timely response to outbreaks and routine needs.
        <div className="resource-why-alert">🔴 2 items need attention</div>
      </div>
      <button className="view-plan-btn">View Allocation Plan →</button>
    </section>
  );
}

const NGOS = [
  { name: "Smile Foundation", category: "Nutrition & Education", dist: "2.8 km", icon: "💚" },
  { name: "HelpAge India", category: "Elderly Care & Support", dist: "3.6 km", icon: "💙" },
  { name: "CARE India", category: "Maternal & Child Health", dist: "4.2 km", icon: "❤️" },
  { name: "Goonj", category: "Community Support", dist: "5.1 km", icon: "🟠" },
];

export function NgoSection() {
  return (
    <>
      <section className="admin-card">
        <div className="admin-section-header">
          <h2 className="admin-section-title">👩‍⚕️ ASHA & Community Worker Overview</h2>
        </div>
        <p className="admin-card-sub">Village: Shindwadi, Pune ▾</p>
        <div className="asha-stats-row">
          <div className="asha-stat"><div className="asha-val">12</div><div className="asha-label">Active ASHA Workers</div></div>
          <div className="asha-stat"><div className="asha-val">248</div><div className="asha-label">Households Covered</div></div>
          <div className="asha-stat"><div className="asha-val">1,286</div><div className="asha-label">Total Population</div></div>
          <div className="asha-stat"><div className="asha-val">37</div><div className="asha-label">Pending Follow-ups</div></div>
        </div>
        <div className="asha-health-grid">
          <div className="asha-health-col">
            <div className="asha-health-title">Maternal Health (This Month)</div>
            <div className="asha-row"><span>Pregnant Women Registered</span><span className="asha-num">38</span></div>
            <div className="asha-row"><span>ANC Visits Completed</span><span className="asha-num urgent-num">41</span></div>
            <div className="asha-row"><span>Institutional Deliveries</span><span className="asha-num">19</span></div>
            <div className="asha-row"><span>Postnatal Visits</span><span className="asha-num">23</span></div>
          </div>
          <div className="asha-health-col">
            <div className="asha-health-title">Child Health (This Month)</div>
            <div className="asha-row"><span>Children (6-5 yrs)</span><span className="asha-num">84</span></div>
            <div className="asha-row"><span>Fully Immunized</span><span className="asha-num urgent-num">62</span></div>
            <div className="asha-row"><span>Vitamin A Given</span><span className="asha-num">44</span></div>
            <div className="asha-row"><span>Growth Monitoring Done</span><span className="asha-num">38</span></div>
          </div>
        </div>
        <button className="view-plan-btn">View All ASHA Activities →</button>
      </section>

      <section className="admin-card">
        <div className="admin-section-header">
          <h2 className="admin-section-title">🤝 NGO Support Network</h2>
          <button className="admin-view-all">View All NGOs →</button>
        </div>
        <p className="admin-card-sub">Good NGOs near you</p>
        <div className="ngo-list">
          {NGOS.map(ngo => (
            <div key={ngo.name} className="ngo-item">
              <span className="ngo-icon">{ngo.icon}</span>
              <div className="ngo-info">
                <div className="ngo-name">{ngo.name}</div>
                <div className="ngo-category">{ngo.category}</div>
              </div>
              <span className="ngo-dist">{ngo.dist}</span>
            </div>
          ))}
        </div>
        <button className="view-plan-btn">Connect with NGOs →</button>
      </section>
    </>
  );
}

const HEALTHCARE_REFS = [
  { name: "Primary Health Centre – Shindwadi", type: "PHC", dist: "2.1 km", hours: "Open 24x7" },
  { name: "Community Health Centre – Haveli", type: "CHC", dist: "6.8 km", hours: "Open 24x7" },
  { name: "Sahyadri Hospital – Pune", type: "Hospital", dist: "12.3 km", hours: "Open 24x7" },
];

const MOCK_USER_LOCATION = { lat: 18.5204, lon: 73.8567 };
const HEALTHCARE_FACILITIES: HospitalFacility[] = [
  { name: "Primary Health Centre – Shindwadi", address: "Shindwadi", type: "PHC", lat: 18.51, lon: 73.84, distance_km: 2.1 },
  { name: "Community Health Centre – Haveli", address: "Haveli", type: "CHC", lat: 18.55, lon: 73.89, distance_km: 6.8 },
  { name: "Sahyadri Hospital – Pune", address: "Pune", type: "Hospital", lat: 18.52, lon: 73.86, distance_km: 12.3 },
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
