import { useState } from "react";
import {
  Search,
  BookOpen,
  Zap,
  Shield,
  AlertTriangle,
  X,
  ChevronRight,
} from "lucide-react";
import { searchKnowledgeBase } from "../services/api";
import type { SearchResult, CollectionName } from "../types/search";

/* ── Data ──────────────────────────────────────────────────────── */

const COLLECTIONS: { value: CollectionName; label: string; icon: typeof BookOpen }[] = [
  { value: "all",                label: "All Knowledge",     icon: BookOpen },
  { value: "first_aid",          label: "First Aid",         icon: Zap },
  { value: "medical_guidance",   label: "Medical Guidance",  icon: Shield },
  { value: "emergency_guidance", label: "Emergency",         icon: AlertTriangle },
];

const SUGGESTIONS = ["heart attack", "burn first aid", "malaria prevention", "dengue warning signs", "snake bite", "fever treatment"];

/* ── Components ────────────────────────────────────────────────── */

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "text-emerald-600 bg-emerald-50" : pct >= 40 ? "text-amber-600 bg-amber-50" : "text-slate-500 bg-slate-100";
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${color}`}>
      {pct}%
    </span>
  );
}

function SearchCard({ result }: { result: SearchResult }) {
  const tags = Array.isArray(result.tags) ? result.tags : result.tags.split(",").map((t) => t.trim());
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60 hover:shadow-lg hover:border-teal-200 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">{result.title}</h3>
          <span className="text-2xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">{result.category}</span>
        </div>
        <ScoreBar score={result.score} />
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-3">{result.content}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="text-2xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
        <span className="text-2xs text-slate-400 flex items-center gap-1 shrink-0">
          <BookOpen size={10} />
          {result.source}
        </span>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

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
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 lg:p-8 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">🔍 Knowledge Search</h1>
          <p className="text-blue-100/80 max-w-lg text-sm">
            Semantic search across first aid, medical guidance, and emergency protocols.
          </p>
        </div>
      </section>

      {/* Search bar */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/60 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500 transition-all">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. fever and headache, snake bite, dengue symptoms..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
              aria-label="Search health knowledge base"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Clear">
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value as CollectionName)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 font-medium outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer hidden sm:block"
            aria-label="Select collection"
          >
            {COLLECTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 text-sm font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] disabled:shadow-none cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Collection chips (mobile) */}
        <div className="sm:hidden flex gap-2 overflow-x-auto no-scrollbar">
          {COLLECTIONS.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.value}
                onClick={() => setCollection(c.value)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  collection === c.value
                    ? "bg-teal-600 text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon size={12} />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Suggestions */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-xs text-slate-600 font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 animate-slide-up">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Searching knowledge base…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-16">
          <span className="text-4xl">📭</span>
          <h3 className="text-base font-semibold text-slate-700 mt-3">No results found</h3>
          <p className="text-sm text-slate-500 mt-1">Try different keywords or select a different collection.</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-medium">{results.length} results for "{query}"</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((r) => (
              <SearchCard key={r.id} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Placeholder */}
      {!searched && !loading && (
        <div className="text-center py-16">
          <span className="text-5xl">💡</span>
          <h3 className="text-base font-semibold text-slate-700 mt-3">Search the Health Knowledge Base</h3>
          <p className="text-sm text-slate-500 mt-1">Find information from WHO, ICMR, and trusted medical sources.</p>
        </div>
      )}
    </div>
  );
}
