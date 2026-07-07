export function NutritionSnapshot({ profile }: { profile: any }) {
  return (
    <section className="nutrition-snapshot">
      <h2 className="section-heading">Your Nutrition Snapshot</h2>
      <p className="section-sub">Small changes, big impact.</p>

      <div className="snapshot-cards">
        <div className="snap-card snap-score">
          <div className="score-ring-wrap">
            <svg viewBox="0 0 80 80" className="score-ring-svg">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="#0d9488" strokeWidth="7"
                strokeDasharray={`${(72 / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
              <text x="40" y="44" textAnchor="middle" fill="#0d9488" fontSize="14" fontWeight="800">{profile.score}</text>
            </svg>
          </div>
          <div className="snap-label">Nutrition Score</div>
          <div className="snap-sub-label">out of 100</div>
          <span className="snap-tag snap-good">Good</span>
          <p className="snap-note">Small daily changes can make a big difference.</p>
        </div>

        <div className="snap-card">
          <div className="snap-big">{profile.calories.val} <span className="snap-unit">kcal</span></div>
          <div className="snap-label">Calories Estimate</div>
          <div className="snap-progress-bar">
            <div className="snap-bar-fill" style={{ width: `${profile.calories.pct}%`, background: "#f59e0b" }} />
          </div>
          <div className="snap-sub-label">{profile.calories.remaining} remaining</div>
        </div>

        <div className="snap-card">
          <div className="snap-big">{profile.protein.val} <span className="snap-unit">g</span></div>
          <div className="snap-label">Protein Intake</div>
          <div className="snap-progress-bar">
            <div className="snap-bar-fill" style={{ width: `${profile.protein.pct}%`, background: "#0d9488" }} />
          </div>
          <div className="snap-sub-label">{profile.protein.pct}% of goal</div>
        </div>

        <div className="snap-card">
          <div className="snap-big">{profile.iron.val} <span className="snap-unit">mg</span></div>
          <div className="snap-label">Iron Intake</div>
          <div className="snap-progress-bar">
            <div className="snap-bar-fill" style={{ width: `${profile.iron.pct}%`, background: "#ef4444" }} />
          </div>
          <div className="snap-sub-label">{profile.iron.pct}% of goal</div>
        </div>
      </div>
    </section>
  );
}
