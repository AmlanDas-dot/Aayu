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
