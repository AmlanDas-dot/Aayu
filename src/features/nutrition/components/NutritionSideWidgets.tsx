import { NutritionProfileFinder } from "./NutritionProfileFinder";

const COMMUNITY_INSIGHTS = [
  { condition: "Anemia", prevalence: "High prevalence", pct: 42, color: "#ef4444", trend: "↑" },
  { condition: "Protein Deficiency", prevalence: "Nationwide risk intake", pct: 33, color: "#f59e0b", trend: "↓" },
  { condition: "Undernutrition in Children", prevalence: "Under 5 Years", pct: 28, color: "#0d9488", trend: "↓" },
];

export function NutritionSideWidgets({ profileType, setProfileType }: any) {
  return (
    <aside className="nutrition-rail">
      <NutritionProfileFinder profileType={profileType} setProfileType={setProfileType} />
      <div className="rail-card">
        <h3 className="rail-title">Community Insights</h3>
        <p className="rail-sub">(Local data)</p>
        {COMMUNITY_INSIGHTS.map((ci) => (
          <div key={ci.condition} className="community-insight-item">
            <span className="ci-icon" style={{ color: ci.color }}>⚠️</span>
            <div className="ci-text">
              <div className="ci-condition">{ci.condition}</div>
              <div className="ci-prevalence" style={{ color: ci.color }}>{ci.prevalence}</div>
            </div>
            <span className="ci-pct" style={{ color: ci.color }}>{ci.trend}{ci.pct}%</span>
          </div>
        ))}
        <button className="rail-link">See More Insights</button>
      </div>

      <div className="rail-card rail-teal-card">
        <h3 className="rail-teal-title">Stay Ahead, Stay Healthy!</h3>
        <p className="rail-teal-sub">Real-time updates: Nutrition tips & local health alerts.</p>
        <button className="rail-teal-btn">View All Updates</button>
      </div>

      <div className="rail-card">
        <h3 className="rail-title">Why Good Nutrition?</h3>
        <ul className="why-nutrition-list">
          <li className="why-n-item"><span>❤️</span> Improves immunity and energy</li>
          <li className="why-n-item"><span>📈</span> Supports growth and development</li>
          <li className="why-n-item"><span>🛡️</span> Helps prevent diseases</li>
          <li className="why-n-item"><span>🌟</span> Promotes better overall health</li>
        </ul>
      </div>
    </aside>
  );
}
