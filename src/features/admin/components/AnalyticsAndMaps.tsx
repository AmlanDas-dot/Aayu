import mapsImage from "@/assets/maps.jpeg";

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
