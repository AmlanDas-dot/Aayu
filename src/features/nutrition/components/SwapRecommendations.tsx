import { type NutritionProfile } from "@/features/nutrition/types";

export function SwapRecommendations({ profile }: { profile: NutritionProfile }) {
  return (
    <section className="nutrition-swap-section">
      <h2 className="section-heading">What to Add or Swap?</h2>
      <p className="section-sub">Small changes, big impact.</p>
      <div className="swap-grid">
        {profile.swaps.map((item, i: number) => (
          <div key={i} className="swap-card">
            <div className="swap-item">
              <div className="swap-food-icon">{item.from.icon}</div>
              <div className="swap-food-name">{item.from.name}</div>
              <div className="swap-food-note">{item.from.note}</div>
            </div>
            <div className="swap-arrow-wrap">
              <span className="swap-arrow-label">Swap This</span>
              <span className="swap-arrow-icon">→</span>
              <span className="swap-with-label">With This</span>
            </div>
            <div className="swap-item swap-to">
              <div className="swap-food-icon">{item.to?.icon ?? "🥛"}</div>
              <div className="swap-food-name">{item.to?.name ?? "Buttermilk"}</div>
              <div className="swap-food-note swap-note-green">{item.to?.note ?? "Good for gut & hydration"}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="view-more-link">View More Add & Swap Ideas →</button>
    </section>
  );
}
