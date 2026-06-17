import { useState, useMemo } from "react";
import {
  Search,
  X,
  Flame,
  Droplets,
  Wheat,
  Apple,
  Leaf,
  Heart,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  getAllFoods,
  getFoodsForCondition,
  suggestHighProteinFoods,
  suggestLowCalorieFoods,
  suggestWeightLossFoods,
  suggestWeightGainFoods,
  type FoodNutrition,
} from "../services/nutrition";

/* ── Data ──────────────────────────────────────────────────────── */

const CATEGORY_ICONS: Record<string, string> = {
  Grains: "🌾",     Legumes: "🫘",      Dairy: "🥛",
  Vegetables: "🥦", Fruits: "🍎",       "Meat & Fish": "🐟",
  "Nuts & Seeds": "🥜", Spices: "🌶️", Oils: "🫙",
};

const CATEGORIES = [
  "All", "Grains", "Legumes", "Dairy", "Vegetables", "Fruits",
  "Meat & Fish", "Nuts & Seeds", "Spices", "Oils",
];

const DIET_MODES = [
  { id: "all",          label: "All Foods",    icon: Apple },
  { id: "high-protein", label: "High Protein", icon: Flame },
  { id: "low-calorie",  label: "Low Calorie",  icon: Leaf },
  { id: "weight-loss",  label: "Weight Loss",  icon: Droplets },
  { id: "weight-gain",  label: "Weight Gain",  icon: Wheat },
];

const QUICK_CONDITIONS = [
  "anemia", "diabetes", "pregnancy", "weakness",
  "digestion", "bone health", "immunity", "heart",
];

const RECOMMENDED_COMBOS = [
  { title: "Iron Booster", desc: "Spinach + Lemon + Jaggery", tag: "For Anemia" },
  { title: "Protein Power", desc: "Dal + Rice + Curd", tag: "Muscle Building" },
  { title: "Immunity Mix", desc: "Turmeric + Ginger + Honey", tag: "Daily Wellness" },
];

/* ── Sub-components ────────────────────────────────────────────── */

function MacroBar({ value, max, color, label, icon: Icon }: {
  value: number; max: number; color: string; label: string; icon: typeof Flame;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-20 text-xs text-slate-500">
        <Icon size={12} className={color} />
        <span>{label}</span>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-10 text-right">{value}g</span>
    </div>
  );
}

function FoodCard({ food }: { food: FoodNutrition }) {
  const icon = CATEGORY_ICONS[food.category] ?? "🍽️";
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60 hover:shadow-lg hover:border-teal-200 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="truncate">{food.name}</span>
          </h3>
          <p className="text-2xs text-slate-400 mt-0.5">{food.category} · {food.serving_size}</p>
        </div>
        <div className="text-right shrink-0 ml-3">
          <div className="text-xl font-bold text-teal-600">{food.calories}</div>
          <div className="text-2xs text-slate-400">kcal</div>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <MacroBar value={food.protein} max={30} color="#6366f1" label="Protein" icon={Flame} />
        <MacroBar value={food.carbs} max={60} color="#f59e0b" label="Carbs" icon={Wheat} />
        <MacroBar value={food.fat} max={25} color="#ef4444" label="Fat" icon={Droplets} />
        <MacroBar value={food.fiber} max={10} color="#10b981" label="Fibre" icon={Leaf} />
      </div>

      {food.rich_in.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {food.rich_in.slice(0, 4).map((r) => (
            <span key={r} className="text-2xs font-medium bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{r}</span>
          ))}
        </div>
      )}

      {food.good_for.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {food.good_for.slice(0, 4).map((g) => (
            <span key={g} className="text-2xs font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Heart size={8} /> {g}
            </span>
          ))}
        </div>
      )}

      {food.avoid_if.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {food.avoid_if.slice(0, 3).map((a) => (
            <span key={a} className="text-2xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <AlertTriangle size={8} /> {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export function NutritionPage() {
  const [query, setQuery] = useState("");
  const [dietMode, setDietMode] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const allFoods = useMemo(() => getAllFoods(), []);

  const displayed = useMemo(() => {
    let base: FoodNutrition[];

    if (query.trim().length >= 2) {
      base = getFoodsForCondition(query.trim());
      if (base.length === 0) {
        const q = query.toLowerCase();
        base = allFoods.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
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

    if (categoryFilter !== "All") {
      base = base.filter((f) => f.category === categoryFilter);
    }

    return base;
  }, [query, dietMode, categoryFilter, allFoods]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 lg:p-8 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">🥗 Nutrition Guide</h1>
          <p className="text-emerald-100/80 max-w-lg text-sm">
            Regional Indian food database — {allFoods.length} items with macros, micronutrients, and health recommendations.
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/60 space-y-3">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500 transition-all">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            id="nutrition-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food or condition: anemia, diabetes, pregnancy, roti…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
            aria-label="Search nutrition database"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600" aria-label="Clear">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => { setQuery(c); setDietMode("all"); }}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-xs text-slate-600 font-medium transition-colors capitalize whitespace-nowrap"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-800">Recommended Combos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RECOMMENDED_COMBOS.map((combo) => (
            <div key={combo.title} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50 hover:shadow-lg transition-shadow">
              <span className="text-2xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{combo.tag}</span>
              <h3 className="text-sm font-semibold text-slate-800 mt-2">{combo.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{combo.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              categoryFilter === cat
                ? "bg-teal-600 text-slate-900 shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700"
            }`}
          >
            {cat !== "All" && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ""}{cat}
          </button>
        ))}
      </div>

      {/* Diet mode tabs */}
      {!query.trim() && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {DIET_MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                id={`diet-mode-${m.id}`}
                onClick={() => setDietMode(m.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  dietMode === m.id
                    ? "bg-emerald-600 text-slate-900 shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                <Icon size={14} />
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-slate-500 font-medium">
        {query.trim()
          ? `${displayed.length} result${displayed.length !== 1 ? "s" : ""} for "${query}"`
          : `Showing ${displayed.length} of ${allFoods.length} foods`
        }
      </p>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl">🍽️</span>
          <h3 className="text-base font-semibold text-slate-700 mt-3">No foods found</h3>
          <p className="text-sm text-slate-500 mt-1">Try a different search or condition name.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((food) => (
            <FoodCard key={food.name} food={food} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center pb-4">
        ⚠️ Nutritional values are approximate. Consult a dietitian for personalised advice.
      </p>
    </div>
  );
}
