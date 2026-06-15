import { useState, useMemo } from "react";
import {
  getAllFoods,
  getFoodsForCondition,
  suggestHighProteinFoods,
  suggestLowCalorieFoods,
  suggestWeightLossFoods,
  suggestWeightGainFoods,
  type FoodNutrition,
} from "../services/nutrition";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  Grains: "🌾",
  Legumes: "🫘",
  Dairy: "🥛",
  Vegetables: "🥦",
  Fruits: "🍎",
  "Meat & Fish": "🐟",
  "Nuts & Seeds": "🥜",
  Spices: "🌶️",
  Oils: "🫙",
};

const DIET_MODES = [
  { id: "all", label: "All Foods" },
  { id: "high-protein", label: "High Protein" },
  { id: "low-calorie", label: "Low Calorie" },
  { id: "weight-loss", label: "Weight Loss" },
  { id: "weight-gain", label: "Weight Gain" },
];

const QUICK_CONDITIONS = [
  "anemia", "diabetes", "pregnancy", "weakness", "digestion",
  "bone health", "immunity", "heart",
];

function NutritionBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        borderRadius: "9999px",
        padding: "2px 10px",
        fontSize: "0.7rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function MacroBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
      <span style={{ width: 70, color: "var(--text-muted, #888)" }}>{label}</span>
      <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 6 }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: 6, transition: "width 0.4s" }} />
      </div>
      <span style={{ width: 36, textAlign: "right", fontWeight: 600 }}>{value}g</span>
    </div>
  );
}

function FoodCard({ food }: { food: FoodNutrition }) {
  const icon = CATEGORY_ICONS[food.category] ?? "🍽️";
  return (
    <div className="search-result-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">{icon} {food.name}</h3>
          <span className="card-category">{food.category} · {food.serving_size}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent, #10b981)" }}>
            {food.calories}
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted, #888)" }}>kcal</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <MacroBar value={food.protein} max={30} color="#6366f1" label="Protein" />
        <MacroBar value={food.carbs} max={60} color="#f59e0b" label="Carbs" />
        <MacroBar value={food.fat} max={25} color="#ef4444" label="Fat" />
        <MacroBar value={food.fiber} max={10} color="#10b981" label="Fibre" />
      </div>

      {food.rich_in.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {food.rich_in.slice(0, 4).map((r) => (
            <NutritionBadge key={r} label={r} color="#6366f1" />
          ))}
        </div>
      )}

      {food.good_for.length > 0 && (
        <div>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted, #888)", marginBottom: 4 }}>✅ Good for</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {food.good_for.slice(0, 4).map((g) => (
              <NutritionBadge key={g} label={g} color="#059669" />
            ))}
          </div>
        </div>
      )}

      {food.avoid_if.length > 0 && (
        <div>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted, #888)", marginBottom: 4 }}>⚠️ Avoid if</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {food.avoid_if.slice(0, 3).map((a) => (
              <NutritionBadge key={a} label={a} color="#dc2626" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function NutritionPage() {
  const [query, setQuery] = useState("");
  const [dietMode, setDietMode] = useState("all");
  const allFoods = useMemo(() => getAllFoods(), []);

  const displayed = useMemo(() => {
    let base: FoodNutrition[];
    if (query.trim().length >= 2) {
      base = getFoodsForCondition(query.trim());
      if (base.length === 0) {
        const q = query.toLowerCase();
        base = allFoods.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.category.toLowerCase().includes(q)
        );
      }
    } else {
      switch (dietMode) {
        case "high-protein": base = suggestHighProteinFoods(); break;
        case "low-calorie":  base = suggestLowCalorieFoods(); break;
        case "weight-loss":  base = suggestWeightLossFoods(); break;
        case "weight-gain":  base = suggestWeightGainFoods(); break;
        default:             base = allFoods;
      }
    }
    return base;
  }, [query, dietMode, allFoods]);

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1 className="search-hero-title">🥗 Nutrition Guide</h1>
        <p className="search-hero-sub">
          Regional Indian food database — {allFoods.length} items with macros, micronutrients, and health recommendations
        </p>
      </div>

      {/* Search bar */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <input
            id="nutrition-search-input"
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food or condition: anemia, diabetes, pregnancy, roti…"
          />
          {query && (
            <button
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0 8px" }}
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick condition chips */}
        <div className="search-suggestions">
          {QUICK_CONDITIONS.map((c) => (
            <button
              key={c}
              className="suggestion-chip"
              onClick={() => { setQuery(c); setDietMode("all"); }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Diet mode tabs (hidden when searching) */}
      {!query.trim() && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {DIET_MODES.map((m) => (
            <button
              key={m.id}
              id={`diet-mode-${m.id}`}
              onClick={() => setDietMode(m.id)}
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                background: dietMode === m.id ? "var(--accent, #10b981)" : "rgba(255,255,255,0.08)",
                color: dietMode === m.id ? "#fff" : "var(--text-muted, #aaa)",
                transition: "all 0.2s",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {query.trim() && (
        <p className="results-count">
          {displayed.length} result{displayed.length !== 1 ? "s" : ""} for "{query}"
        </p>
      )}

      {displayed.length === 0 ? (
        <div className="search-empty">
          <span className="empty-icon">🍽️</span>
          <h3>No foods found</h3>
          <p>Try a different search term or condition name.</p>
        </div>
      ) : (
        <div className="results-grid">
          {displayed.map((food) => (
            <FoodCard key={food.name} food={food} />
          ))}
        </div>
      )}

      <p style={{ fontSize: "0.7rem", color: "var(--text-muted, #888)", marginTop: "1.5rem", textAlign: "center" }}>
        ⚠️ Nutritional values are approximate. Consult a dietitian for personalised advice.
      </p>
    </div>
  );
}
