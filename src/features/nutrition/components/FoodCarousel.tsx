import { useState, useEffect } from "react";
import { getAllFoods, searchNutrition, type FoodNutrition } from "@/services/api";


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
      } catch (e: any) {
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
          foods.map((f, i) => (
            <div key={`${f.id}-${i}`} className="local-food-card">
              <div className="local-food-icon">🍏</div>
              <div className="local-food-name">{f.display_name}</div>
              <div className="local-food-cal" style={{fontSize: "0.8rem", color: "#64748b", marginTop: "4px"}}>{f.guidance.substring(0, 40)}...</div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', width: '100%' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🥗</div>
            <p>Search foods, nutrients and healthy meal suggestions.</p>
            {foods.length === 0 && !loading && !query && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                Start typing to discover healthy local foods.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
