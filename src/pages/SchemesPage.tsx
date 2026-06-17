import { useState, useMemo } from "react";
import {
  Search,
  X,
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BadgeCheck,
  FileText,
  IndianRupee,
  Users,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import {
  getAllSchemes,
  getStateSchemes,
  searchScheme,
  type GovernmentScheme,
} from "../services/schemes";

/* ── Data ──────────────────────────────────────────────────────── */

const STATE_FILTERS = [
  { id: "all",      label: "All States",  icon: "🌐" },
  { id: "national", label: "National",    icon: "🇮🇳" },
  { id: "odisha",   label: "Odisha",      icon: "🏛️" },
  { id: "gujarat",  label: "Gujarat",     icon: "🏛️" },
];

const CATEGORY_CHIPS = [
  "health insurance", "housing", "farmer", "women",
  "maternity", "education", "pension", "employment",
];

/* ── Eligibility Checker ──────────────────────────────────────── */

function EligibilityChecker() {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [income, setIncome] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function checkEligibility() {
    const matches: string[] = [];
    const ageNum = parseInt(age);
    if (!isNaN(ageNum)) {
      if (ageNum >= 60) matches.push("Old Age Pension schemes");
      if (ageNum >= 18 && ageNum <= 59) matches.push("PM-JAY, PM-SVANidhi");
    }
    if (gender === "female") matches.push("Maternity benefit schemes (JSY, PMMVY)");
    if (income === "bpl") matches.push("BPL schemes, Ayushman Bharat, PMAY");
    if (income === "apl") matches.push("PMSBY, APY, PM-JAY (if eligible)");

    if (matches.length === 0) {
      setResult("Enter your details to see potentially matching schemes.");
    } else {
      setResult(`You may be eligible for: ${matches.join(", ")}.`);
    }
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-200/50">
      <div className="flex items-center gap-2 mb-3">
        <BadgeCheck size={18} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-teal-800">Quick Eligibility Check</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-2xs font-medium text-slate-500 block mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 35"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            aria-label="Your age"
          />
        </div>
        <div>
          <label className="text-2xs font-medium text-slate-500 block mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer"
            aria-label="Gender"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-2xs font-medium text-slate-500 block mb-1">Income</label>
          <select
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer"
            aria-label="Income level"
          >
            <option value="">Select</option>
            <option value="bpl">Below Poverty Line</option>
            <option value="apl">Above Poverty Line</option>
          </select>
        </div>
      </div>
      <button
        onClick={checkEligibility}
        className="w-full bg-teal-600 hover:bg-teal-700 text-slate-900 text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-md active:scale-[0.98]"
      >
        Check Eligibility
      </button>
      {result && (
        <p className="mt-3 text-xs text-teal-700 bg-white rounded-xl p-3 border border-teal-200/50 animate-slide-up">{result}</p>
      )}
    </div>
  );
}

/* ── Scheme Card ──────────────────────────────────────────────── */

function SchemeCard({ scheme }: { scheme: GovernmentScheme }) {
  const [expanded, setExpanded] = useState(false);
  const stateColors: Record<string, string> = {
    National: "bg-blue-50 text-blue-600 border-blue-200",
    Odisha:   "bg-amber-50 text-amber-600 border-amber-200",
    Gujarat:  "bg-purple-50 text-purple-600 border-purple-200",
  };
  const stateCls = stateColors[scheme.state] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 hover:shadow-lg hover:border-teal-200 transition-all overflow-hidden">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Building2 size={16} className="text-teal-600 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-800 truncate">{scheme.name}</h3>
            </div>
            <span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-0.5 rounded-full border ${stateCls}`}>
              <MapPin size={10} />
              {scheme.state}
            </span>
          </div>
          <button
            id={`scheme-expand-${scheme.name.replace(/\s+/g, "-").toLowerCase()}`}
            onClick={() => setExpanded((e) => !e)}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors shrink-0"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{scheme.description}</p>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <div className="flex items-center gap-1 mb-1.5">
              <IndianRupee size={12} className="text-emerald-600" />
              <span className="text-2xs font-bold text-emerald-700 uppercase">Benefits</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {scheme.benefits.slice(0, 120)}{scheme.benefits.length > 120 ? "…" : ""}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-1 mb-1.5">
              <CheckCircle2 size={12} className="text-blue-600" />
              <span className="text-2xs font-bold text-blue-700 uppercase">Eligibility</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {scheme.eligibility.slice(0, 120)}{scheme.eligibility.length > 120 ? "…" : ""}
            </p>
          </div>
        </div>

        {expanded && scheme.documents_required.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 animate-slide-up">
            <div className="flex items-center gap-1 mb-2">
              <FileText size={12} className="text-amber-600" />
              <span className="text-2xs font-bold text-amber-700 uppercase">Documents Required</span>
            </div>
            <ul className="space-y-1">
              {scheme.documents_required.map((d) => (
                <li key={d} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {expanded && scheme.official_link && (
          <a
            href={scheme.official_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ExternalLink size={12} />
            Official Website
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

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
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 rounded-2xl p-6 lg:p-8 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">🏛️ Government Schemes</h1>
          <p className="text-violet-100/80 max-w-lg text-sm">
            National, Odisha, and Gujarat welfare schemes — health, housing, farming, women empowerment, and more.
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/60 space-y-3">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500 transition-all">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            id="schemes-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: health insurance, housing, farmer support, maternity…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
            aria-label="Search schemes"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600" aria-label="Clear">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_CHIPS.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); setStateFilter("all"); }}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-xs text-slate-600 font-medium transition-colors capitalize whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Eligibility Checker */}
      <EligibilityChecker />

      {/* State Filter */}
      {!query.trim() && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {STATE_FILTERS.map((f) => (
            <button
              key={f.id}
              id={`state-filter-${f.id}`}
              onClick={() => setStateFilter(f.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                stateFilter === f.id
                  ? "bg-violet-600 text-slate-900 shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-700"
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-slate-500 font-medium">
        {query.trim()
          ? `${displayed.length} scheme${displayed.length !== 1 ? "s" : ""} matching "${query}"`
          : `Showing ${displayed.length} of ${allSchemes.length} schemes`
        }
      </p>

      {/* Results */}
      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl">📭</span>
          <h3 className="text-base font-semibold text-slate-700 mt-3">No schemes found</h3>
          <p className="text-sm text-slate-500 mt-1">Try different keywords or select a different state filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayed.map((scheme) => (
            <SchemeCard key={scheme.name} scheme={scheme} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center pb-4">
        ℹ️ Scheme details are for informational purposes. Visit official links or your nearest CSC/PHC for current eligibility.
      </p>
    </div>
  );
}
