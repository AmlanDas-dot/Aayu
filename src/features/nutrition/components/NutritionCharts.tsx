export function NutritionCharts({ profile }: { profile: any }) {
  return (
    <section className="nutrient-breakdown-section">
      <div className="nutrient-breakdown-grid">
        <div className="nutrient-left">
          <h2 className="section-heading">Nutrient Breakdown</h2>
          <p className="section-sub">Your intake vs recommended.</p>
          <div className="donut-chart-wrap">
            <svg viewBox="0 0 120 120" className="donut-svg">
              <circle cx="60" cy="60" r="44" fill="none" stroke="#3b82f6" strokeWidth="22" strokeDasharray="110 167" strokeDashoffset="-10" />
              <circle cx="60" cy="60" r="44" fill="none" stroke="#0d9488" strokeWidth="22" strokeDasharray="40 237" strokeDashoffset="-120" />
              <circle cx="60" cy="60" r="44" fill="none" stroke="#10b981" strokeWidth="22" strokeDasharray="26 251" strokeDashoffset="-160" />
              <circle cx="60" cy="60" r="44" fill="none" stroke="#f59e0b" strokeWidth="22" strokeDasharray="20 257" strokeDashoffset="-186" />
              <text x="60" y="58" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="800">1,650</text>
              <text x="60" y="70" textAnchor="middle" fill="#64748b" fontSize="6">kcal</text>
            </svg>
            <div className="donut-legend">
              <div className="legend-row"><span className="legend-swatch" style={{ background: "#3b82f6" }} />Carbohydrates (57%)</div>
              <div className="legend-row"><span className="legend-swatch" style={{ background: "#0d9488" }} />Protein (20%)</div>
              <div className="legend-row"><span className="legend-swatch" style={{ background: "#10b981" }} />Healthy Fats (11%)</div>
              <div className="legend-row"><span className="legend-swatch" style={{ background: "#f59e0b" }} />Fibre (12%)</div>
            </div>
          </div>
        </div>

        <div className="nutrient-right">
          <h3 className="section-heading">Top Nutrients</h3>
          <p className="section-sub">Your intake vs recommended.</p>
          {profile.topNutrients.map((n: any) => (
            <div key={n.name} className="top-nutrient-row">
              <span className="tn-name">{n.name}</span>
              <span className="tn-values">{n.current} / {n.target}</span>
              <div className="tn-bar-track">
                <div className="tn-bar-fill" style={{ width: `${n.pct}%`, background: n.color }} />
              </div>
              <span className="tn-pct" style={{ color: n.color }}>{n.pct}%</span>
            </div>
          ))}
          <p className="nutrient-tip">{profile.tip}</p>
        </div>
      </div>
    </section>
  );
}
