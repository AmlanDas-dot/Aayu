import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Apple,
  Building2,
  Stethoscope,
  Shield,
  Heart,
  Users,
  Mic,
  Camera,
  Send,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe,
  WifiOff,
  Lock,
  TrendingUp,
  Activity,
  FileText,
} from "lucide-react";

/* ── Data ───────────────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { icon: Stethoscope, title: "Symptom Check",    desc: "AI-powered health assessment",    path: "/chat",      color: "from-teal-500 to-teal-700" },
  { icon: Search,      title: "Knowledge Search", desc: "Search trusted health databases",  path: "/search",    color: "from-blue-500 to-blue-700" },
  { icon: Apple,       title: "Nutrition Guide",   desc: "Regional food & diet plans",       path: "/nutrition", color: "from-emerald-500 to-emerald-700" },
  { icon: Building2,   title: "Gov. Schemes",     desc: "Find eligible health schemes",     path: "/schemes",   color: "from-violet-500 to-violet-700" },
  { icon: Heart,       title: "Family Health",    desc: "Manage your family's wellness",    path: "/chat",      color: "from-rose-500 to-rose-600" },
  { icon: FileText,    title: "Health Records",   desc: "Store reports & prescriptions",    path: "/chat",      color: "from-amber-500 to-amber-700" },
];

const HEALTH_ALERTS = [
  { id: "1", title: "Dengue cases rising in districts", severity: "high" as const,   desc: "Use mosquito repellents. Keep surroundings clean. Seek care if high fever persists." },
  { id: "2", title: "Seasonal Flu Advisory",            severity: "medium" as const, desc: "Cases increasing in some areas. Get vaccinated at nearest PHC." },
  { id: "3", title: "Heat Wave Warning",               severity: "medium" as const, desc: "Stay hydrated and avoid direct sunlight between 12–4 PM." },
];

const STATS = [
  { label: "Health Queries", value: "12,483", icon: Activity, trend: "+18%" },
  { label: "Active Users",   value: "2,891",  icon: Users,    trend: "+12%" },
  { label: "Knowledge Docs", value: "847",    icon: FileText, trend: "+5%" },
  { label: "Alerts Active",  value: "3",      icon: AlertTriangle, trend: "Live" },
];

const WHY_AAYU = [
  { icon: Shield,  text: "Verified medical knowledge from trusted sources" },
  { icon: Mic,     text: "Voice-based interaction in your language" },
  { icon: WifiOff, text: "Works offline — your health, always with you" },
  { icon: Lock,    text: "Private and secure — data stays on your device" },
];

const TRUSTED_SOURCES = [
  { name: "World Health Organization", abbr: "WHO" },
  { name: "Ministry of Health & Family Welfare", abbr: "MoHFW" },
  { name: "Indian Council of Medical Research", abbr: "ICMR" },
  { name: "UNICEF", abbr: "UNICEF" },
];

/* ── Component ────────────────────────────────────────────────── */

export function HomePage() {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");

  function handleQuickChat() {
    if (chatInput.trim()) {
      navigate("/chat", { state: { initialMessage: chatInput.trim() } });
    } else {
      navigate("/chat");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-teal-50 border border-teal-100 p-6 lg:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 bg-teal-100 rounded-full px-4 py-1.5 text-teal-700 text-xs font-medium">
              <Globe size={14} />
              <span>Multilingual AI Health Assistant</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              Healthcare Information.
              <br />
              <span className="text-teal-200">Guidance. Care.</span>
            </h1>
            <p className="text-teal-600/80 max-w-lg text-sm lg:text-base leading-relaxed">
              Ask anything about symptoms, nutrition, schemes, or nearby
              healthcare — in your own language. Powered by local AI.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Globe, label: "Multilingual" },
                { icon: WifiOff, label: "Offline First" },
                { icon: Shield, label: "Trusted Sources" },
                { icon: Lock, label: "Privacy Focused" },
              ].map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.5 bg-teal-100 rounded-full px-3 py-1 text-xs text-teal-800 font-medium">
                  <b.icon size={12} />
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 hidden lg:flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-2xl bg-teal-100 flex items-center justify-center shadow-lg ring-1 ring-teal-200">
              <Stethoscope size={40} className="text-teal-700" />
            </div>
            <div className="bg-teal-100 rounded-xl px-4 py-2 text-teal-800 text-sm font-medium">
              Namaste! 🙏 How can I help?
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-md border border-slate-200/60 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Icon size={18} className="text-teal-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.trend}</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* ── Talk to AAYU ──────────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-5 lg:p-6 shadow-md border border-slate-200/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Talk to AAYU</h2>
            <p className="text-xs text-slate-500">Voice, text, or images — your health assistant is ready</p>
          </div>
        </div>

        <div className="flex gap-2">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuickChat(); } }}
            placeholder="Describe your symptoms or ask a question..."
            rows={2}
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            aria-label="Type your health question"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleQuickChat}
              className="flex-1 w-12 rounded-xl bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
          >
            <Mic size={14} />
            <span>Speak</span>
          </button>
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
          >
            <Camera size={14} />
            <span>Scan / Upload</span>
          </button>
        </div>
      </section>

      {/* ── Quick Actions + Health Alerts ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <section className="lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="group bg-white rounded-xl p-4 shadow-md border border-slate-200/60 hover:shadow-lg hover:border-teal-200 transition-all text-left active:scale-[0.98] cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-0.5">{action.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{action.desc}</p>
                  <ArrowRight size={14} className="mt-2 text-slate-300 group-hover:text-teal-7000 group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Health Alerts */}
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Health Alerts</h2>
            <button className="text-xs text-teal-600 font-medium hover:text-teal-700 cursor-pointer">View All</button>
          </div>

          {HEALTH_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`
                rounded-xl p-4 border-l-4 shadow-md
                ${alert.severity === "high"
                  ? "bg-red-50 border-red-500"
                  : "bg-amber-50 border-amber-500"
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-2xs font-bold uppercase tracking-wider ${alert.severity === "high" ? "text-red-600" : "text-amber-600"}`}>
                  {alert.severity === "high" ? "🚨 HIGH ALERT" : "⚠️ ADVISORY"}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">{alert.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{alert.desc}</p>
              <button className="mt-2 text-xs font-medium text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer">
                Learn more <ArrowRight size={12} />
              </button>
            </div>
          ))}

          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-200/50">
            <h4 className="text-sm font-semibold text-teal-800 mb-1">🌟 Stay Healthy!</h4>
            <p className="text-xs text-teal-700/70 mb-2">Real-time health updates and disease advisories for your region.</p>
            <button className="text-xs font-medium text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer">
              View All Updates <ArrowRight size={12} />
            </button>
          </div>
        </aside>
      </div>

      {/* ── Why AAYU + Trusted Sources ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/60">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Why AAYU?</h2>
          <div className="space-y-3">
            {WHY_AAYU.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-teal-600" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/60">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Trusted Sources</h2>
          <div className="grid grid-cols-2 gap-3">
            {TRUSTED_SOURCES.map((src) => (
              <div key={src.abbr} className="bg-slate-50 rounded-xl p-4 text-center hover:bg-slate-100 transition-colors">
                <p className="text-lg font-bold text-teal-700">{src.abbr}</p>
                <p className="text-2xs text-slate-500 mt-1">{src.name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/60">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
            <div>
              <p className="font-bold text-slate-800">AAYU</p>
              <p className="text-xs text-slate-500">AI-Powered Public Health Assistant</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">Your Health. Your Data. Your Control.</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <a href="#" className="hover:text-teal-600 transition-colors">Disclaimer</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
