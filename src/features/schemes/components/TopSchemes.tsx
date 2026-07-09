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

import type { GovernmentScheme } from "@/services/api";

export function TopSchemes({ schemes = [] }: { schemes?: GovernmentScheme[] }) {
  const dynamicItems = schemes.slice(0, 2).map((s, i) => ({
    icon: i === 0 ? ShieldCheck : Baby,
    name: s.name,
    desc: s.description.slice(0, 80) + (s.description.length > 80 ? "..." : ""),
    tag: s.state,
    who: s.eligibility.slice(0, 60) + (s.eligibility.length > 60 ? "..." : ""),
    tagColor: i === 0 ? "#10b981" : "#f59e0b",
    tagBg: i === 0 ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
    link: s.official_link
  }));

  const itemsToDisplay = dynamicItems.length > 0 ? dynamicItems : TOP_SCHEMES_STATIC.map(s => ({...s, link: "https://www.india.gov.in"}));
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
        {itemsToDisplay.map((s) => {
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
              {s.link ? (
                <button className="ts-apply-btn" onClick={() => window.open(s.link, "_blank")}>Apply Now →</button>
              ) : (
                <button className="ts-apply-btn">Apply Now →</button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
