import { useState } from "react";
import {
  LayoutDashboard,
  Activity,
  Users,
  MessageSquare,
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Heart,
  Stethoscope,
  Apple,
  Building2,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  PieChart,
  Search,
} from "lucide-react";

/* ── Mock Data ─────────────────────────────────────────────────── */

const OVERVIEW_STATS = [
  { label: "Total Queries",   value: "12,483", trend: "+18.2%", up: true,  icon: MessageSquare, color: "from-teal-500 to-teal-700" },
  { label: "Active Users",    value: "2,891",  trend: "+12.4%", up: true,  icon: Users,         color: "from-blue-500 to-blue-700" },
  { label: "Avg Response",    value: "1.2s",   trend: "-8.3%",  up: false, icon: Clock,         color: "from-violet-500 to-violet-700" },
  { label: "Knowledge Docs",  value: "847",    trend: "+5.1%",  up: true,  icon: FileText,      color: "from-amber-500 to-amber-700" },
];

const QUERY_ANALYTICS = [
  { category: "Symptom Check",     count: 4521, pct: 36 },
  { category: "First Aid",         count: 2890, pct: 23 },
  { category: "Disease Info",      count: 2156, pct: 17 },
  { category: "Nutrition",         count: 1567, pct: 13 },
  { category: "Schemes",           count: 892,  pct: 7 },
  { category: "Emergency",         count: 457,  pct: 4 },
];

const DISEASE_TRENDS = [
  { disease: "Dengue",         cases: 342, trend: "+28%", severity: "high" as const },
  { disease: "Malaria",        cases: 198, trend: "+12%", severity: "medium" as const },
  { disease: "Seasonal Flu",   cases: 567, trend: "+45%", severity: "medium" as const },
  { disease: "Typhoid",        cases: 89,  trend: "-5%",  severity: "low" as const },
  { disease: "Diarrheal",      cases: 234, trend: "+8%",  severity: "medium" as const },
  { disease: "COVID-19",       cases: 45,  trend: "-32%", severity: "low" as const },
];

const TRIAGE_STATS = [
  { level: "Emergency", count: 457,   pct: 3.7,  color: "bg-red-500" },
  { level: "Urgent",    count: 2341,  pct: 18.8, color: "bg-amber-500" },
  { level: "Routine",   count: 9685,  pct: 77.5, color: "bg-emerald-500" },
];

const NUTRITION_INSIGHTS = [
  { food: "Rice & Dal",    queries: 892, trend: "↑" },
  { food: "Spinach",       queries: 654, trend: "↑" },
  { food: "Milk & Curd",   queries: 543, trend: "→" },
  { food: "Eggs",          queries: 421, trend: "↑" },
  { food: "Banana",        queries: 389, trend: "↓" },
];

const SCHEME_USAGE = [
  { scheme: "Ayushman Bharat",   views: 1234, applications: 89 },
  { scheme: "PM-JAY",            views: 987,  applications: 67 },
  { scheme: "JSY",               views: 654,  applications: 45 },
  { scheme: "PMAY",              views: 543,  applications: 34 },
  { scheme: "PM-SVANidhi",       views: 432,  applications: 23 },
];

const HEALTH_ALERTS_DATA = [
  { id: "1", title: "Dengue cases rising in districts",   severity: "high" as const,   status: "active" as const, date: "2026-06-15" },
  { id: "2", title: "Seasonal Flu Advisory",              severity: "medium" as const, status: "active" as const, date: "2026-06-14" },
  { id: "3", title: "Heat Wave Warning",                  severity: "medium" as const, status: "active" as const, date: "2026-06-13" },
  { id: "4", title: "Water Quality Alert - District 5",   severity: "low" as const,    status: "resolved" as const, date: "2026-06-10" },
];

/* ── Tabs ──────────────────────────────────────────────────────── */

type Tab = "overview" | "queries" | "diseases" | "triage" | "nutrition" | "schemes" | "alerts";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview",  label: "Overview",     icon: LayoutDashboard },
  { id: "queries",   label: "Queries",      icon: BarChart3 },
  { id: "diseases",  label: "Diseases",     icon: Activity },
  { id: "triage",    label: "Triage",       icon: Stethoscope },
  { id: "nutrition", label: "Nutrition",    icon: Apple },
  { id: "schemes",   label: "Schemes",      icon: Building2 },
  { id: "alerts",    label: "Alerts",       icon: AlertTriangle },
];

/* ── Bar component ─────────────────────────────────────────────── */

function HorizontalBar({ label, value, max, color, suffix }: {
  label: string; value: number; max: number; color: string; suffix?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-800 font-semibold">{value.toLocaleString()}{suffix}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl p-6 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10  flex items-center justify-center">
            <LayoutDashboard size={24} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">System analytics and health intelligence</p>
          </div>
        </div>
      </section>

      {/* Tab navigation */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 bg-white rounded-xl p-1.5 shadow-md border border-slate-200/60">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-teal-600 text-slate-900 shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview ─────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {OVERVIEW_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                      <Icon size={20} className="text-slate-900" />
                    </div>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${stat.up ? "text-emerald-600" : "text-red-500"}`}>
                      {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Triage overview + top queries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <PieChart size={16} className="text-teal-600" />
                Triage Distribution
              </h3>
              <div className="space-y-3">
                {TRIAGE_STATS.map((t) => (
                  <div key={t.level} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${t.color}`} />
                    <span className="text-xs text-slate-600 w-20">{t.level}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${t.color}`} style={{ width: `${t.pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-12 text-right">{t.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-teal-600" />
                Top Query Categories
              </h3>
              <div className="space-y-2.5">
                {QUERY_ANALYTICS.slice(0, 5).map((q) => (
                  <HorizontalBar key={q.category} label={q.category} value={q.count} max={5000} color="bg-teal-500" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Query Analytics ──────────────────────────────────── */}
      {activeTab === "queries" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Query Categories Breakdown</h3>
            <div className="space-y-3">
              {QUERY_ANALYTICS.map((q) => (
                <HorizontalBar key={q.category} label={q.category} value={q.count} max={5000} color="bg-teal-500" suffix={` (${q.pct}%)`} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-800 p-5 pb-3">Recent Queries</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t border-slate-100 text-slate-500">
                  <th className="text-left px-5 py-2.5 font-medium">Query</th>
                  <th className="text-left px-5 py-2.5 font-medium">Category</th>
                  <th className="text-left px-5 py-2.5 font-medium">Risk</th>
                  <th className="text-right px-5 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { query: "Fever and headache for 3 days", category: "Symptom", risk: "routine", time: "2m ago" },
                  { query: "Snake bite emergency steps", category: "Emergency", risk: "emergency", time: "5m ago" },
                  { query: "Healthy diet for pregnancy", category: "Nutrition", risk: "routine", time: "12m ago" },
                  { query: "Chest pain and breathlessness", category: "Emergency", risk: "urgent", time: "18m ago" },
                  { query: "Ayushman Bharat eligibility", category: "Schemes", risk: "routine", time: "25m ago" },
                ].map((row, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-700 font-medium">{row.query}</td>
                    <td className="px-5 py-3"><span className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{row.category}</span></td>
                    <td className="px-5 py-3">
                      <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                        row.risk === "emergency" ? "bg-red-50 text-red-600" :
                        row.risk === "urgent" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>{row.risk}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Disease Trends ───────────────────────────────────── */}
      {activeTab === "diseases" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-800 p-5 pb-3">Disease Surveillance</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t border-slate-100 text-slate-500">
                  <th className="text-left px-5 py-2.5 font-medium">Disease</th>
                  <th className="text-right px-5 py-2.5 font-medium">Cases</th>
                  <th className="text-right px-5 py-2.5 font-medium">Trend</th>
                  <th className="text-right px-5 py-2.5 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {DISEASE_TRENDS.map((d) => (
                  <tr key={d.disease} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-700 font-medium">{d.disease}</td>
                    <td className="px-5 py-3 text-right text-slate-800 font-semibold">{d.cases}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${d.trend.startsWith("+") ? "text-red-500" : "text-emerald-500"}`}>{d.trend}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-2xs font-bold px-2 py-0.5 rounded-full uppercase ${
                        d.severity === "high" ? "bg-red-50 text-red-600" :
                        d.severity === "medium" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>{d.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Triage ───────────────────────────────────────────── */}
      {activeTab === "triage" && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-3 gap-4">
            {TRIAGE_STATS.map((t) => (
              <div key={t.level} className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60 text-center">
                <div className={`w-12 h-12 rounded-full ${t.color} mx-auto mb-3 flex items-center justify-center`}>
                  <span className="text-slate-900 text-lg font-bold">{t.pct}%</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{t.count.toLocaleString()}</p>
                <p className="text-xs text-slate-500">{t.level}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Triage Distribution</h3>
            <div className="h-4 flex rounded-full overflow-hidden">
              {TRIAGE_STATS.map((t) => (
                <div key={t.level} className={`${t.color} transition-all`} style={{ width: `${t.pct}%` }} title={`${t.level}: ${t.pct}%`} />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {TRIAGE_STATS.map((t) => (
                <span key={t.level} className="flex items-center gap-1 text-2xs text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${t.color}`} />
                  {t.level}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Nutrition ────────────────────────────────────────── */}
      {activeTab === "nutrition" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Most Searched Foods</h3>
            <div className="space-y-2.5">
              {NUTRITION_INSIGHTS.map((item) => (
                <HorizontalBar key={item.food} label={`${item.food} ${item.trend}`} value={item.queries} max={1000} color="bg-emerald-500" suffix=" queries" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Schemes ──────────────────────────────────────────── */}
      {activeTab === "schemes" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-800 p-5 pb-3">Scheme Engagement</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t border-slate-100 text-slate-500">
                  <th className="text-left px-5 py-2.5 font-medium">Scheme</th>
                  <th className="text-right px-5 py-2.5 font-medium">Views</th>
                  <th className="text-right px-5 py-2.5 font-medium">Applications</th>
                  <th className="text-right px-5 py-2.5 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {SCHEME_USAGE.map((s) => (
                  <tr key={s.scheme} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-700 font-medium">{s.scheme}</td>
                    <td className="px-5 py-3 text-right text-slate-800">{s.views.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-slate-800">{s.applications}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-teal-600 font-semibold">{((s.applications / s.views) * 100).toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Alerts Management ────────────────────────────────── */}
      {activeTab === "alerts" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Health Alerts</h3>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-md cursor-pointer">
              <Plus size={14} />
              Add Alert
            </button>
          </div>

          <div className="space-y-3">
            {HEALTH_ALERTS_DATA.map((alert) => (
              <div key={alert.id} className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    alert.severity === "high" ? "bg-red-500" :
                    alert.severity === "medium" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{alert.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-2xs font-bold uppercase px-2 py-0.5 rounded-full ${
                        alert.severity === "high" ? "bg-red-50 text-red-600" :
                        alert.severity === "medium" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>{alert.severity}</span>
                      <span className={`text-2xs font-medium px-2 py-0.5 rounded-full ${
                        alert.status === "active" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                      }`}>{alert.status}</span>
                      <span className="text-2xs text-slate-400">{alert.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer" aria-label="Edit">
                    <Edit size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors cursor-pointer" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
