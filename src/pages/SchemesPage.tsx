import { useState, useMemo } from "react";
import {
  getAllSchemes,
  getStateSchemes,
  searchScheme,
  type GovernmentScheme,
} from "../services/schemes";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATE_FILTERS = [
  { id: "all", label: "All States" },
  { id: "national", label: "🇮🇳 National" },
  { id: "odisha", label: "🏛️ Odisha" },
];

const QUICK_SEARCHES = [
  "health insurance", "housing", "farmer", "women", "maternity", "education",
];

function SchemeCard({ scheme }: { scheme: GovernmentScheme }) {
  const [expanded, setExpanded] = useState(false);
  const stateColor = scheme.state === "National" ? "#6366f1" : "#f59e0b";

  return (
    <div className="search-result-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="card-header">
        <div style={{ flex: 1 }}>
          <h3 className="card-title">🏛️ {scheme.name}</h3>
          <span
            style={{
              background: stateColor,
              color: "#fff",
              borderRadius: "9999px",
              padding: "2px 10px",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            {scheme.state}
          </span>
        </div>
        <button
          id={`scheme-expand-${scheme.name.replace(/\s+/g, "-").toLowerCase()}`}
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            padding: "4px 10px",
            fontSize: "0.8rem",
            color: "inherit",
          }}
        >
          {expanded ? "▲ Less" : "▼ More"}
        </button>
      </div>

      <p className="card-content">{scheme.description}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div style={{ background: "rgba(16,185,129,0.1)", borderRadius: 8, padding: "8px 12px" }}>
          <p style={{ fontSize: "0.65rem", color: "#10b981", fontWeight: 700, marginBottom: 2 }}>💰 BENEFITS</p>
          <p style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>{scheme.benefits.slice(0, 120)}{scheme.benefits.length > 120 ? "…" : ""}</p>
        </div>
        <div style={{ background: "rgba(99,102,241,0.1)", borderRadius: 8, padding: "8px 12px" }}>
          <p style={{ fontSize: "0.65rem", color: "#6366f1", fontWeight: 700, marginBottom: 2 }}>✅ ELIGIBILITY</p>
          <p style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>{scheme.eligibility.slice(0, 120)}{scheme.eligibility.length > 120 ? "…" : ""}</p>
        </div>
      </div>

      {expanded && scheme.documents_required.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.1)", borderRadius: 8, padding: "8px 12px" }}>
          <p style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700, marginBottom: 6 }}>📄 DOCUMENTS REQUIRED</p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.75rem", lineHeight: 1.8 }}>
            {scheme.documents_required.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {expanded && scheme.official_link && (
        <a
          href={scheme.official_link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.78rem",
            color: "#10b981",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          🔗 Official Website ↗
        </a>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function SchemesPage() {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const allSchemes = useMemo(() => getAllSchemes(), []);

  const displayed = useMemo(() => {
    if (query.trim().length >= 2) {
      return searchScheme(query.trim());
    }
    if (stateFilter === "all") return allSchemes;
    return getStateSchemes(stateFilter.charAt(0).toUpperCase() + stateFilter.slice(1));
  }, [query, stateFilter, allSchemes]);

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1 className="search-hero-title">🏛️ Government Schemes</h1>
        <p className="search-hero-sub">
          National and Odisha state welfare schemes — health, housing, farming, women empowerment and more
        </p>
      </div>

      {/* Search bar */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <input
            id="schemes-search-input"
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: health insurance, housing, farmer support, maternity…"
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

        <div className="search-suggestions">
          {QUICK_SEARCHES.map((s) => (
            <button
              key={s}
              className="suggestion-chip"
              onClick={() => { setQuery(s); setStateFilter("all"); }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* State filter tabs (hidden when searching) */}
      {!query.trim() && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {STATE_FILTERS.map((f) => (
            <button
              key={f.id}
              id={`state-filter-${f.id}`}
              onClick={() => setStateFilter(f.id)}
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                background: stateFilter === f.id ? "var(--accent, #10b981)" : "rgba(255,255,255,0.08)",
                color: stateFilter === f.id ? "#fff" : "var(--text-muted, #aaa)",
                transition: "all 0.2s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {query.trim() && (
        <p className="results-count">
          {displayed.length} scheme{displayed.length !== 1 ? "s" : ""} matching "{query}"
        </p>
      )}

      {!query.trim() && (
        <p className="results-count">
          Showing {displayed.length} of {allSchemes.length} schemes
        </p>
      )}

      {displayed.length === 0 ? (
        <div className="search-empty">
          <span className="empty-icon">📭</span>
          <h3>No schemes found</h3>
          <p>Try different keywords or select a different state filter.</p>
        </div>
      ) : (
        <div className="results-grid">
          {displayed.map((scheme) => (
            <SchemeCard key={scheme.name} scheme={scheme} />
          ))}
        </div>
      )}

      <p style={{ fontSize: "0.7rem", color: "var(--text-muted, #888)", marginTop: "1.5rem", textAlign: "center" }}>
        ℹ️ Scheme details are for informational purposes. Visit official links or your nearest CSC/PHC for current eligibility.
      </p>
    </div>
  );
}
