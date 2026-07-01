import { useState, useEffect } from "react";
import doctorImg from "../../assets/doctor-leaves.png";
import { getAllFoods, searchNutrition, type FoodNutrition } from "../../services/api";

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

export function SwapRecommendations({ profile }: { profile: any }) {
  return (
    <section className="nutrition-swap-section">
      <h2 className="section-heading">What to Add or Swap?</h2>
      <p className="section-sub">Small changes, big impact.</p>
      <div className="swap-grid">
        {profile.swaps.map((item: any, i: number) => (
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

export function MealPlanGrid({ profile }: { profile: any }) {
  const [selectedBudget, setSelectedBudget] = useState(100);
  const totalCost = profile.mealPlan.reduce((sum: number, m: any) => sum + m.price, 0);

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
        {profile.mealPlan.map((meal: any) => (
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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        let res = [];
        if (query.trim().length >= 2) {
          res = await searchNutrition(query.trim());
        } else {
          res = await getAllFoods();
        }
        if (active) setFoods(res);
      } catch (e) {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    const t = setTimeout(run, query ? 300 : 0);
    return () => { active = false; clearTimeout(t); };
  }, [query]);

  return (
    <section className="local-foods-section">
      <div className="section-row">
        <div>
          <h2 className="section-heading">Local & Seasonal Foods Near You</h2>
          <p className="section-sub">Nutritious, affordable and easy to find.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search foods..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>
      </div>
      <div className="local-foods-scroll">
        {loading ? (
          <div style={{ padding: '20px', color: '#64748b' }}>Searching foods...</div>
        ) : foods.length > 0 ? (
          foods.map((f) => (
            <div key={f.id} className="local-food-card">
              <div className="local-food-icon">🍏</div>
              <div className="local-food-name">{f.display_name}</div>
              <div className="local-food-cal" style={{fontSize: "0.8rem", color: "#64748b", marginTop: "4px"}}>{f.guidance.substring(0, 40)}...</div>
            </div>
          ))
        ) : query.trim().length >= 2 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', width: '100%' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🥗</div>
            <p>Search foods, nutrients and healthy meal suggestions.</p>
          </div>
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

export const NUTRITION_PROFILES = {
  default: {
    score: 72,
    calories: { val: "1,650", max: 2000, pct: 82, remaining: "350 kcal" },
    protein: { val: "56", max: 60, pct: 69 },
    iron: { val: "12", max: 18, pct: 71 },
    swaps: [
      { from: { icon: "🍟", name: "Chips", note: "(High in fat)" }, to: { icon: "🌽", name: "Roasted Chana", note: "(Rich in protein & fibre)" } },
      { from: { icon: "🧃", name: "Sugary Drinks", note: "(High sugar)" }, to: { icon: "🥛", name: "Buttermilk", note: "(Good for gut & hydration)" } },
      { from: { icon: "🥬", name: "Leafy Greens", note: "Dairy" }, to: { icon: "🌽", name: "Roasted Chana", note: "Rich in protein & fibre" } },
    ],
    mealPlan: [
      { meal: "Breakfast", name: "Poha + Milk", icon: "🍚", price: 20, note: "Energy-rich start" },
      { meal: "Mid-Morning", name: "Guava", icon: "🍈", price: 10, note: "Rich in Vitamin C" },
      { meal: "Lunch", name: "Rice + Dal + Seasonal Salad", icon: "🥗", price: 35, note: "Balanced & filling" },
      { meal: "Evening Snack", name: "Roasted Chana + Banana", icon: "🍌", price: 15, note: "Keeps you active" },
      { meal: "Dinner", name: "2 Rotis + Mixed Vegetables", icon: "🫓", price: 20, note: "Light & nutritious" },
    ],
    topNutrients: [
      { name: "Protein", current: "51g", target: "60g", pct: 85, color: "#0d9488" },
      { name: "Iron", current: "10mg", target: "18mg", pct: 55, color: "#f59e0b" },
      { name: "Calcium", current: "450mg", target: "1000mg", pct: 45, color: "#3b82f6" },
      { name: "Fibre", current: "14g", target: "25g", pct: 56, color: "#10b981" },
    ],
    tip: "💡 Eat more iron-rich foods like leafy greens, dates and millets."
  },
  pregnant: {
    score: 65,
    calories: { val: "2,100", max: 2500, pct: 84, remaining: "400 kcal" },
    protein: { val: "68", max: 75, pct: 90 },
    iron: { val: "15", max: 27, pct: 55 },
    swaps: [
      { from: { icon: "☕", name: "Tea/Coffee with meals", note: "(Blocks iron)" }, to: { icon: "🍋", name: "Lemon Water", note: "(Boosts iron absorption)" } },
      { from: { icon: "🍚", name: "White Rice", note: "(Low nutrient)" }, to: { icon: "🌾", name: "Ragi/Millets", note: "(High Calcium & Iron)" } },
    ],
    mealPlan: [
      { meal: "Breakfast", name: "Ragi Dosa + Egg", icon: "🥞", price: 25, note: "High protein & calcium" },
      { meal: "Mid-Morning", name: "Amla + Dates", icon: "🫐", price: 15, note: "Iron + Vitamin C combo" },
      { meal: "Lunch", name: "Rice + Spinach Dal", icon: "🍛", price: 40, note: "Folic acid rich" },
      { meal: "Evening Snack", name: "Sprouted Moong Salad", icon: "🥗", price: 15, note: "Easy to digest" },
      { meal: "Dinner", name: "Rotis + Paneer/Soybean", icon: "🫓", price: 30, note: "Protein rich" },
    ],
    topNutrients: [
      { name: "Protein", current: "68g", target: "75g", pct: 90, color: "#0d9488" },
      { name: "Iron", current: "15mg", target: "27mg", pct: 55, color: "#ef4444" },
      { name: "Calcium", current: "800mg", target: "1000mg", pct: 80, color: "#3b82f6" },
      { name: "Folic Acid", current: "400mcg", target: "600mcg", pct: 66, color: "#10b981" },
    ],
    tip: "💡 Iron is crucial right now! Pair your iron supplements with vitamin C (like lemon juice) and avoid tea/coffee with meals."
  },
  child: {
    score: 80,
    calories: { val: "1,200", max: 1400, pct: 85, remaining: "200 kcal" },
    protein: { val: "30", max: 35, pct: 85 },
    iron: { val: "8", max: 10, pct: 80 },
    swaps: [
      { from: { icon: "🍬", name: "Candies/Chocolates", note: "(Empty calories)" }, to: { icon: "🥜", name: "Peanut Chikki", note: "(Protein & Iron rich)" } },
      { from: { icon: "🍞", name: "White Bread", note: "(Low fibre)" }, to: { icon: "🌾", name: "Dalia/Oats", note: "(Complex carbs)" } },
    ],
    mealPlan: [
      { meal: "Breakfast", name: "Milk + Upma", icon: "🥣", price: 20, note: "Energy for the day" },
      { meal: "Mid-Morning", name: "Apple/Banana", icon: "🍎", price: 10, note: "Natural sugars" },
      { meal: "Lunch", name: "Khichdi + Curd", icon: "🍛", price: 25, note: "Easy to digest" },
      { meal: "Evening Snack", name: "Boiled Egg/Chana", icon: "🥚", price: 10, note: "Muscle growth" },
      { meal: "Dinner", name: "Roti + Dal + Veggies", icon: "🫓", price: 25, note: "Balanced nutrition" },
    ],
    topNutrients: [
      { name: "Protein", current: "30g", target: "35g", pct: 85, color: "#0d9488" },
      { name: "Iron", current: "8mg", target: "10mg", pct: 80, color: "#f59e0b" },
      { name: "Calcium", current: "500mg", target: "600mg", pct: 83, color: "#3b82f6" },
      { name: "Vitamin A", current: "300mcg", target: "400mcg", pct: 75, color: "#10b981" },
    ],
    tip: "💡 Growing kids need protein and calcium. Ensure 2 servings of dairy/eggs/pulses daily!"
  }
};

export function NutritionProfileFinder({ profileType, setProfileType }: any) {
  return (
    <div className="rail-card">
      <div className="rail-title">Nutrition Profile</div>
      <p className="rail-sub">View customized nutrition plan</p>
      <div className="find-scheme-fields">
        <label className="find-scheme-label">
          <span className="fsl-text">Profile Type</span>
          <select className="fsl-select" value={profileType} onChange={e => setProfileType(e.target.value)}>
            <option value="default">Adult (General Health)</option>
            <option value="pregnant">Pregnant/Lactating Mother</option>
            <option value="child">Child (0-12 Years)</option>
          </select>
        </label>
      </div>
    </div>
  );
}
