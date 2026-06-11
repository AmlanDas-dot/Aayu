import { useState } from "react";
import { searchKnowledgeBase } from "../services/api";
import type { SearchResult, CollectionName } from "../types/search";

const COLLECTIONS: { value: CollectionName; label: string }[] = [
  { value: "all", label: "All Knowledge" },
  { value: "first_aid", label: "First Aid" },
  { value: "medical_guidance", label: "Medical Guidance" },
  { value: "emergency_guidance", label: "Emergency Guidance" },
];

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "#059669" : pct >= 40 ? "#d97706" : "#6b7280";
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="score-label" style={{ color }}>{pct}%</span>
    </div>
  );
}

function SearchCard({ result }: { result: SearchResult }) {
  const tags = Array.isArray(result.tags) ? result.tags : result.tags.split(",").map((t) => t.trim());
  return (
    <div className="search-result-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{result.title}</h3>
          <span className="card-category">{result.category}</span>
        </div>
        <ScoreBar score={result.score} />
      </div>
      <p className="card-content">{result.content}</p>
      <div className="card-footer">
        <div className="card-tags">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="tag-chip">{t}</span>
          ))}
        </div>
        <span className="card-source">📖 {result.source}</span>
      </div>
    </div>
  );
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<CollectionName>("all");
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
            {COLLECTIONS.map((c) => (
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
              <SearchCard key={r.id} result={r} />
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
