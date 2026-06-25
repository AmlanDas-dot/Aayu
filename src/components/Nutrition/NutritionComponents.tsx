import { useState, useEffect } from "react";
import doctorImg from "../../assets/doctor-leaves.png";
import { getAllFoods, type FoodNutrition } from "../../services/api";

export function NutritionHero() {
  return (
    <section className="nutrition-hero">
      <div className="nutrition-hero-text">
        <h1 className="nutrition-hero-title">Your Nutrition Assistant</h1>
        <p className="nutrition-hero-sub">
          Personalized nutrition guidance based on your app, health conditions, local availability and affordability.
        </p>
        <div className="nutrition-badges">
          <span className="n-badge">📍 Local & Seasonal</span>
          <span className="n-badge">💰 Affordable Options</span>
          <span className="n-badge">🩺 Personalized for You</span>
          <span className="n-badge">⚖️ Backed by Science</span>
        </div>
        <button className="nutrition-ask-btn">💬 Ask Nutrition Assistant</button>
      </div>
      <div className="nutrition-hero-img">
        <img src={doctorImg} alt="Nutrition Assistant" className="nutrition-doc-img" />
      </div>
    </section>
  );
}

export function NutritionSnapshot() {
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
              <text x="40" y="44" textAnchor="middle" fill="#0d9488" fontSize="14" fontWeight="800">72</text>
            </svg>
          </div>
          <div className="snap-label">Nutrition Score</div>
          <div className="snap-sub-label">out of 100</div>
          <span className="snap-tag snap-good">Good</span>
          <p className="snap-note">Small daily changes can make a big difference.</p>
        </div>

        <div className="snap-card">
          <div className="snap-big">1,650 <span className="snap-unit">kcal</span></div>
          <div className="snap-label">Calories Estimate</div>
          <div className="snap-progress-bar">
            <div className="snap-bar-fill" style={{ width: "82%", background: "#f59e0b" }} />
          </div>
          <div className="snap-sub-label">302 kcal remaining</div>
        </div>

        <div className="snap-card">
          <div className="snap-big">56 <span className="snap-unit">g</span></div>
          <div className="snap-label">Protein Intake</div>
          <div className="snap-progress-bar">
            <div className="snap-bar-fill" style={{ width: "69%", background: "#0d9488" }} />
          </div>
          <div className="snap-sub-label">69% of goal</div>
        </div>

        <div className="snap-card">
          <div className="snap-big">12 <span className="snap-unit">mg</span></div>
          <div className="snap-label">Iron Intake</div>
          <div className="snap-progress-bar">
            <div className="snap-bar-fill" style={{ width: "71%", background: "#ef4444" }} />
          </div>
          <div className="snap-sub-label">71% of goal</div>
        </div>
      </div>
    </section>
  );
}

const SWAP_IDEAS = [
  { from: { icon: "🥬", name: "Leafy Greens", note: "Dairy" }, to: { icon: "🌽", name: "Roasted Chana", note: "Rich in protein & fibre" } },
  { from: { icon: "🍟", name: "Chips", note: "(High in fat & salt)" }, to: { icon: "🧃", name: "Sugary Drinks", note: "(High in sugar)" } },
  { from: { icon: "🥛", name: "Buttermilk", note: "(Good for gut & hydration)" }, to: null },
];

export function SwapRecommendations() {
  return (
    <section className="nutrition-swap-section">
      <h2 className="section-heading">What to Add or Swap?</h2>
      <p className="section-sub">Small changes, big impact.</p>
      <div className="swap-grid">
        {SWAP_IDEAS.map((item, i) => (
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

const BUDGET_OPTIONS = [50, 100, 150, 200];

const MEAL_PLAN = [
  { meal: "Breakfast", name: "Poha + Milk", icon: "🍚", price: 20, note: "Energy-rich start" },
  { meal: "Mid-Morning", name: "Guava", icon: "🍈", price: 10, note: "Rich in Vitamin C" },
  { meal: "Lunch", name: "Rice + Dal + Seasonal Salad", icon: "🥗", price: 35, note: "Balanced & filling" },
  { meal: "Evening Snack", name: "Roasted Chana + Banana", icon: "🍌", price: 15, note: "Keeps you active" },
  { meal: "Dinner", name: "2 Rotis + Mixed Vegetables", icon: "🫓", price: 20, note: "Light & nutritious" },
];

export function MealPlanGrid() {
  const [selectedBudget, setSelectedBudget] = useState(100);
  const totalCost = MEAL_PLAN.reduce((sum, m) => sum + m.price, 0);

  return (
    <section className="meal-plan-section">
      <div className="meal-plan-header">
        <div>
          <h2 className="section-heading">Meal Plans & Budget Planner</h2>
          <p className="section-sub">For your location and local ingredients.</p>
        </div>
        <div className="budget-selector">
          <span className="budget-label">Select Budget</span>
          <div className="budget-btns">
            {BUDGET_OPTIONS.map((b) => (
              <button
                key={b}
                className={`budget-btn ${selectedBudget === b ? "budget-btn-active" : ""}`}
                onClick={() => setSelectedBudget(b)}
              >
                ₹{b}<span className="budget-per">Per Day</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="meal-tabs">
        <button className="meal-tab meal-tab-active">Daily Plan</button>
        <button className="meal-tab">Weekly Plan</button>
        <button className="meal-tab">Family Plan</button>
      </div>

      <div className="meal-cards-grid">
        {MEAL_PLAN.map((meal) => (
          <div key={meal.meal} className="meal-card">
            <div className="meal-time">{meal.meal}</div>
            <div className="meal-icon">{meal.icon}</div>
            <div className="meal-name">{meal.name}</div>
            <div className="meal-price">₹{meal.price}</div>
            <div className="meal-note">{meal.note}</div>
          </div>
        ))}
      </div>

      <div className="meal-total-row">
        <div className="meal-total-text">
          Total Cost: <strong>₹{totalCost} /day</strong>
          <span className="meal-note-small"> 🛈 These are customized for you based on age, activity level and health goals.</span>
        </div>
        <button className="view-plan-btn">View Full Weekly Plan →</button>
      </div>
    </section>
  );
}

const TOP_NUTRIENTS = [
  { name: "Protein", current: "51g", target: "77g", pct: 66, color: "#0d9488" },
  { name: "Iron", current: "10mg", target: "21mg", pct: 48, color: "#f59e0b" },
  { name: "Calcium", current: "450mg", target: "1000mg", pct: 45, color: "#3b82f6" },
  { name: "Fibre", current: "14g", target: "25g", pct: 56, color: "#10b981" },
];

export function NutritionCharts() {
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
          {TOP_NUTRIENTS.map((n) => (
            <div key={n.name} className="top-nutrient-row">
              <span className="tn-name">{n.name}</span>
              <span className="tn-values">{n.current} / {n.target}</span>
              <div className="tn-bar-track">
                <div className="tn-bar-fill" style={{ width: `${n.pct}%`, background: n.color }} />
              </div>
              <span className="tn-pct" style={{ color: n.color }}>{n.pct}%</span>
            </div>
          ))}
          <p className="nutrient-tip">💡 Eat more iron-rich foods like leafy greens, dates and millets.</p>
        </div>
      </div>
    </section>
  );
}

const LOCAL_FOODS_MOCK = [
  { name: "Spinach", icon: "🥬", price: "₹20/bunch", cal: "₹10 / 100g" },
  { name: "Pumpkin", icon: "🎃", price: "₹15/kg", cal: "₹2/1kg" },
  { name: "Banana", icon: "🍌", price: "₹40/dozen", cal: "₹15/doz" },
  { name: "Moong Dal", icon: "🫘", price: "₹80/kg", cal: "₹13/100g" },
  { name: "Groundnut", icon: "🥜", price: "₹120/kg", cal: "₹25/250g" },
  { name: "Drumstick", icon: "🌿", price: "₹30/bunch", cal: "₹10/piece" },
];

export function FoodCarousel() {
  const [foods, setFoods] = useState<FoodNutrition[]>([]);

  useEffect(() => {
    getAllFoods().then(setFoods).catch(() => {});
  }, []);

  return (
    <section className="local-foods-section">
      <div className="section-row">
        <div>
          <h2 className="section-heading">Local & Seasonal Foods Near You</h2>
          <p className="section-sub">Nutritious, affordable and easy to find.</p>
        </div>
        <button className="view-all-link">View All Arrivals</button>
      </div>
      <div className="local-foods-scroll">
        {foods.length > 0 ? (
          foods.map((f) => (
            <div key={f.id} className="local-food-card">
              <div className="local-food-icon">🍏</div>
              <div className="local-food-name">{f.display_name}</div>
              <div className="local-food-cal" style={{fontSize: "0.8rem", color: "#64748b", marginTop: "4px"}}>{f.guidance.substring(0, 30)}...</div>
            </div>
          ))
        ) : (
          LOCAL_FOODS_MOCK.map((f) => (
            <div key={f.name} className="local-food-card">
              <div className="local-food-icon">{f.icon}</div>
              <div className="local-food-name">{f.name}</div>
              <div className="local-food-price">{f.price}</div>
              <div className="local-food-cal">{f.cal}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const COMMUNITY_INSIGHTS = [
  { condition: "Anemia", prevalence: "High prevalence", pct: 42, color: "#ef4444", trend: "↑" },
  { condition: "Protein Deficiency", prevalence: "Nationwide risk intake", pct: 33, color: "#f59e0b", trend: "↓" },
  { condition: "Undernutrition in Children", prevalence: "Under 5 Years", pct: 28, color: "#0d9488", trend: "↓" },
];

export function NutritionSideWidgets() {
  return (
    <aside className="nutrition-rail">
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

export function FooterBanner() {
  return (
    <section className="nutrition-wa-banner">
      <div className="wa-banner-text">
        <h3 className="wa-banner-title">Need personalized diet tips or have questions?</h3>
        <p className="wa-banner-sub">Chat with AAYU on WhatsApp for simple, practical nutrition guidance.</p>
        <button className="wa-banner-btn">💬 Chat on WhatsApp</button>
      </div>
      <div className="wa-banner-art">
        <img src={doctorImg} alt="Nutrition Help" className="wa-banner-doc" />
      </div>
    </section>
  );
}
