const SCHEME_ALERTS = [
  { name: "PM Matru Vandana Yojana", desc: "New updated increase in benefit amount.", color: "#f59e0b", badge: "New" },
  { name: "Ayushman Bharat Yojana", desc: "Free treatment cover up to ₹5 lakh per family.", color: "#0d9488", badge: "New" },
];

export function SchemeAlerts() {
  return (
    <div className="rail-card">
      <div className="rail-title">Scheme Alerts</div>
      <div className="scheme-alerts-list">
        {SCHEME_ALERTS.map((a, i) => (
          <div key={a.name} className={`scheme-alert-item ${i < SCHEME_ALERTS.length - 1 ? "alert-item-border" : ""}`}>
            <span className="sal-icon" style={{ color: a.color }}>🔔</span>
            <div className="sal-text">
              <div className="sal-name-row">
                <span className="sal-name">{a.name}</span>
                {a.badge && <span className="sal-badge">{a.badge}</span>}
              </div>
              <p className="sal-desc">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="rail-link">View All Alerts →</button>
    </div>
  );
}
