import { ShieldCheck, Baby, Apple, User, Activity, Sparkles } from "lucide-react";

const CATEGORIES = [
  { icon: ShieldCheck, label: "Health Insurance", desc: "Schemes for financial protection", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { icon: Baby, label: "Maternity & Child", desc: "Benefits for mothers and children", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  { icon: Apple, label: "Nutrition Support", desc: "Food & nutrition assistance", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { icon: User, label: "Senior Citizen", desc: "Support for elderly citizens", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { icon: Activity, label: "Disability Support", desc: "Schemes for specially abled persons", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { icon: Sparkles, label: "More", desc: "View more schemes", color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
];

export function SchemeCategoryGrid() {
  return (
    <section className="categories-section">
      <h2 className="section-heading">Explore by Category</h2>
      <p className="section-sub">Browse schemes by your needs</p>
      <div className="categories-grid">
        {CATEGORIES.map(c => {
          const IconComponent = c.icon;
          return (
            <div key={c.label} className="category-card">
              <div className="cat-icon-wrap" style={{ color: c.color, background: c.bg }}>
                <IconComponent size={24} />
              </div>
              <div className="cat-label">{c.label}</div>
              <p className="cat-desc">{c.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
