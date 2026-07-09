import { useState } from "react";
import { type GovernmentScheme } from "@/services/api";

export function SchemeCard({ scheme }: { scheme: GovernmentScheme }) {
  const [expanded, setExpanded] = useState(false);
  const isNational = scheme.state === "National";

  return (
    <div className="scheme-result-card" onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(13,148,136,0.14)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = ""}>
      <div className="scheme-card-top">
        <div className="scheme-card-title-row">
          <h3 className="scheme-card-name">{scheme.name}</h3>
          <span className={`scheme-state-badge ${isNational ? "badge-national" : "badge-state"}`}>{scheme.state}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {scheme.official_link && (
            <button className="ts-apply-btn" style={{ padding: "4px 12px", fontSize: "0.85rem", height: "fit-content" }} onClick={() => window.open(scheme.official_link, "_blank")}>Apply Now</button>
          )}
          <button className="scheme-expand-btn" onClick={() => setExpanded(e => !e)}>{expanded ? "▲ Less" : "▼ More"}</button>
        </div>
      </div>
      <p className="scheme-card-desc">{scheme.description}</p>
      <div className="scheme-card-grid">
        <div className="scheme-info-box scheme-info-green">
          <p className="info-box-label">BENEFITS</p>
          <p className="info-box-text">{scheme.benefits.slice(0, 120)}{scheme.benefits.length > 120 ? "…" : ""}</p>
        </div>
        <div className="scheme-info-box scheme-info-purple">
          <p className="info-box-label">ELIGIBILITY</p>
          <p className="info-box-text">{scheme.eligibility.slice(0, 120)}{scheme.eligibility.length > 120 ? "…" : ""}</p>
        </div>
      </div>
      {expanded && scheme.documents_required?.length > 0 && (
        <div className="scheme-info-box scheme-info-yellow" style={{ marginTop: 8 }}>
          <p className="info-box-label">DOCUMENTS REQUIRED</p>
          <ul className="scheme-docs-list">{scheme.documents_required.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
