import { useState, useEffect } from "react";
import { searchKnowledgeBase, getCollections } from "../services/api";
import type { SearchResult, CollectionName } from "../types/search";

function ResultCard({ result }: { result: SearchResult }) {
  const [expanded, setExpanded] = useState(false);

  const pct = Math.round((result.score ?? 0) * 100);
  const scoreColor = pct >= 70 ? "#16a34a" : pct >= 55 ? "#d97706" : "#6b7280";

  const urgencyConfig: Record<string, { bg: string; text: string }> = {
    critical: { bg: "#fee2e2", text: "#dc2626" },
    emergency: { bg: "#fee2e2", text: "#dc2626" },
    high: { bg: "#fef3c7", text: "#d97706" },
    medium: { bg: "#dbeafe", text: "#2563eb" },
    low: { bg: "#dcfce7", text: "#16a34a" },
  };
  const uc = urgencyConfig[result.urgency ?? ""] ?? { bg: "#f1f5f9", text: "#64748b" };

  const raw: string = result.content ?? "";
  const extract = (label: string): string => {
    const m = raw.match(new RegExp(`${label}[:\\s]+([^]+?)(?=\\s*(?:Guidance|Precautions|First aid|$))`, "i"));
    return m ? m[1].replace(/\.\s*$/, "").trim() : "";
  };

  const symptoms = extract("Symptoms");
  const guidance = extract("Guidance");
  const precautions = extract("Precautions");
  const firstAid = extract("First aid");
  const tags = Array.isArray(result.tags)
    ? result.tags
    : (result.tags ?? "").split(",").map((t: string) => t.trim()).filter(Boolean);

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 14,
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px 12px",
        borderBottom: "1px solid #f1f5f9",
        background: "#f8fafc",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
            {result.title || result.category}
          </h3>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {result.urgency && (
              <span style={{
                padding: "3px 10px", borderRadius: 9999,
                fontSize: "0.68rem", fontWeight: 700,
                background: uc.bg, color: uc.text,
              }}>{result.urgency.toUpperCase()}</span>
            )}
            <span style={{
              padding: "3px 10px", borderRadius: 9999,
              fontSize: "0.72rem", fontWeight: 700,
              background: `${scoreColor}18`, color: scoreColor,
            }}>{pct}% match</span>
          </div>
        </div>
        <span style={{
          fontSize: "0.72rem", color: "#64748b",
          background: "#e2e8f0", padding: "2px 10px", borderRadius: 6,
          fontWeight: 500,
        }}>
          {(result.collection ?? result.source ?? "").replace(/_/g, " ")}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 18px" }}>

        {/* Signs & Symptoms */}
        {symptoms && (
          <div style={{ marginBottom: 14 }}>
            <p style={{
              fontSize: "0.72rem", fontWeight: 700, color: "#d97706",
              marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              🤒 Signs & Symptoms
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {symptoms.split(/[.,;]+/).map(s => s.trim()).filter(Boolean).map((s, i) => (
                <span key={i} style={{
                  padding: "4px 12px", borderRadius: 9999,
                  background: "#fef3c7", color: "#92400e",
                  fontSize: "0.78rem", fontWeight: 500,
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* What To Do */}
        {guidance && (
          <div style={{ marginBottom: 14 }}>
            <p style={{
              fontSize: "0.72rem", fontWeight: 700, color: "#16a34a",
              marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              💊 What To Do
            </p>
            <p style={{
              fontSize: "0.84rem", color: "#374151", lineHeight: 1.7,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical" as const,
              WebkitLineClamp: expanded ? 99 : 3,
              margin: 0,
            }}>{guidance}</p>
          </div>
        )}

        {/* First Aid */}
        {firstAid && (
          <div style={{ marginBottom: 14 }}>
            <p style={{
              fontSize: "0.72rem", fontWeight: 700, color: "#dc2626",
              marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              🚨 First Aid
            </p>
            <p style={{ fontSize: "0.84rem", color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {firstAid}
            </p>
          </div>
        )}

        {/* Precautions — only when expanded */}
        {precautions && expanded && (
          <div style={{ marginBottom: 14 }}>
            <p style={{
              fontSize: "0.72rem", fontWeight: 700, color: "#2563eb",
              marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              ⚠️ Precautions
            </p>
            <p style={{ fontSize: "0.84rem", color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {precautions}
            </p>
          </div>
        )}

        {/* Expand / Collapse */}
        {(precautions || (guidance && guidance.length > 200)) && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "5px 16px", cursor: "pointer",
              fontSize: "0.78rem", color: "#475569", marginBottom: 10,
              fontWeight: 600,
            }}
          >{expanded ? "▲ Show less" : "▼ Show more"}</button>
        )}

        {/* Tags + Source */}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4, alignItems: "center" }}>
            {tags.slice(0, 5).map((t: string) => (
              <span key={t} style={{
                padding: "2px 8px", borderRadius: 6, fontSize: "0.72rem",
                background: "#f1f5f9", color: "#64748b",
              }}>{t}</span>
            ))}
            <span style={{
              fontSize: "0.72rem", color: "#94a3b8",
              marginLeft: "auto", whiteSpace: "nowrap",
            }}>
              📖 {result.source ?? "AAYU"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<CollectionName>("all");
  const [collections, setCollections] = useState<{ value: string; label: string }[]>([
    { value: "all", label: "All Knowledge" },
  ]);

  useEffect(() => {
    getCollections()
      .then((data) => {
        const opts = Object.keys(data).map((name) => ({
          value: name,
          label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        }));
        setCollections([{ value: "all", label: "All Knowledge" }, ...opts]);
      })
      .catch(() => { });
  }, []);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const resp = await searchKnowledgeBase(query.trim(), collection, 8);
      setResults(resp.results);
    } catch (e: any) {
      setError(e.message ?? "Search failed. Is the backend running?");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1 className="search-hero-title">🔍 Knowledge Search</h1>
        <p className="search-hero-sub">
          Semantic search across first aid, medical guidance and emergency protocols
        </p>
      </div>

      <div className="search-bar-wrap">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. fever and headache, snake bite, dengue symptoms..."
          />
          <select
            className="search-collection-select"
            value={collection}
            onChange={(e) => setCollection(e.target.value as CollectionName)}
          >
            {collections.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button className="search-submit-btn" onClick={handleSearch} disabled={loading}>
            {loading ? "⏳" : "Search"}
          </button>
        </div>
        <div className="search-suggestions">
          {["heart attack", "burn first aid", "malaria prevention", "dengue warning signs"].map((s) => (
            <button key={s} className="suggestion-chip" onClick={() => { setQuery(s); }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="search-error">⚠️ {error}</div>}

      {loading && (
        <div className="search-loading">
          <div className="loading-spinner" />
          <p>Searching knowledge base…</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="search-empty">
          <span className="empty-icon">📭</span>
          <h3>No results found</h3>
          <p>Try different keywords or select a different collection.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          <p className="results-count">{results.length} results for "{query}"</p>
          <div className="results-grid">
            {results.map((r) => (
              <ResultCard key={r.id} result={r} />
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div className="search-placeholder">
          <span className="placeholder-icon">💡</span>
          <h3>Search the Health Knowledge Base</h3>
          <p>Find information from WHO, ICMR, and trusted medical sources.</p>
        </div>
      )}
    </div>
  );
}