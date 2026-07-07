import { ShieldCheck, Baby } from "lucide-react";

const TOP_SCHEMES_STATIC = [
  {
    icon: ShieldCheck, name: "Ayushman Bharat PM-JAY", desc: "Free health cover up to ₹5 lakh per family",
    tag: "Health Insurance", who: "Families (All age groups)", tagColor: "#10b981", tagBg: "rgba(16,185,129,0.12)",
  },
  {
    icon: Baby, name: "Pradhan Mantri Matru Vandana Yojana", desc: "₹5,000 benefit for pregnant women",
    tag: "Maternity Benefit", who: "Pregnant Women", tagColor: "#f59e0b", tagBg: "rgba(245,158,11,0.12)",
  },
];

export function TopSchemes() {
  return (
    <section className="top-schemes-section">
      <div className="section-row">
        <div>
          <h2 className="section-heading">Top Schemes for You</h2>
          <p className="section-sub">Based on your profile and location</p>
        </div>
        <button className="view-all-link">View all Schemes →</button>
      </div>
      <div className="top-schemes-grid">
        {TOP_SCHEMES_STATIC.map((s) => {
          const IconComponent = s.icon;
          return (
            <div key={s.name} className="top-scheme-card">
              <div className="ts-icon-wrap" style={{ color: s.tagColor, background: s.tagBg }}>
                <IconComponent size={24} />
              </div>
              <h3 className="ts-name">{s.name}</h3>
              <p className="ts-desc">{s.desc}</p>
              <span className="ts-tag" style={{ color: s.tagColor, background: s.tagBg }}>{s.tag}</span>
              <div className="ts-who-box">
                <span className="ts-who-label">WHO CAN APPLY?</span>
                <p className="ts-who-text">{s.who}</p>
              </div>
              <button className="ts-apply-btn">Apply Now →</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
