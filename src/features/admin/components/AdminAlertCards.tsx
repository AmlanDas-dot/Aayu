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
