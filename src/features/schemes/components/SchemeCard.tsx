import { useState } from "react";
import { type EvaluatedScheme } from "@/services/schemeService";
import { CheckCircle2, Info, XCircle } from "lucide-react";

export function SchemeCard({ scheme }: { scheme: EvaluatedScheme }) {
  const [expanded, setExpanded] = useState(false);
  const isNational = scheme.location === "National";

  return (
    <div className="scheme-result-card" onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(13,148,136,0.14)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = ""}>
      <div className="scheme-card-top">
        <div className="scheme-card-title-row">
          <h3 className="scheme-card-name">{scheme.name}</h3>
          <span className={`scheme-state-badge ${isNational ? "badge-national" : "badge-state"}`}>{scheme.location || scheme.location}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {scheme.official_website && (
            <button className="ts-apply-btn" style={{ padding: "4px 12px", fontSize: "0.85rem", height: "fit-content" }} onClick={() => window.open(scheme.official_website, "_blank")}>Apply Now</button>
          )}
          <button className="scheme-expand-btn" onClick={() => setExpanded(e => !e)}>{expanded ? "▲ Less" : "▼ More"}</button>
        </div>
      </div>
      <p className="scheme-card-desc">{scheme.description}</p>
      
      {scheme.aiMatch && (
        <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: scheme.aiMatch.matchLevel === "Highly Recommended" ? "#f0fdf4" : scheme.aiMatch.matchLevel === "Possibly Eligible" ? "#fefce8" : "#fef2f2", border: '1px solid', borderColor: scheme.aiMatch.matchLevel === "Highly Recommended" ? "#bbf7d0" : scheme.aiMatch.matchLevel === "Possibly Eligible" ? "#fef08a" : "#fecaca", display: 'flex', gap: '8px' }}>
          {scheme.aiMatch.matchLevel === "Highly Recommended" ? <CheckCircle2 size={20} color="#16a34a" /> : scheme.aiMatch.matchLevel === "Possibly Eligible" ? <Info size={20} color="#ca8a04" /> : <XCircle size={20} color="#ef4444" />}
          <div>
            <div style={{ fontWeight: 'bold', color: scheme.aiMatch.matchLevel === "Highly Recommended" ? "#16a34a" : scheme.aiMatch.matchLevel === "Possibly Eligible" ? "#ca8a04" : "#ef4444", fontSize: '14px' }}>{scheme.aiMatch.matchLevel}</div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{scheme.aiMatch.reason}</div>
          </div>
        </div>
      )}
      
      <div className="scheme-card-grid" style={{ marginTop: '16px' }}>
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
