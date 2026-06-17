import { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  Mic,
  Eye,
  EyeOff,
  Lock,
  Shield,
  WifiOff,
  Wifi,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Type,
  Check,
  RefreshCw,
  Server,
  Database,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  Contrast,
} from "lucide-react";
import { LANGUAGES } from "../constants/languages";
import type { LanguageCode } from "../constants/languages";
import { checkBackendHealth } from "../services/api";

/* ── Types ─────────────────────────────────────────────────────── */

interface SettingsSection {
  id: string;
  title: string;
  icon: typeof Settings;
  children: React.ReactNode;
}

/* ── Toggle Switch ─────────────────────────────────────────────── */

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200
        ${enabled ? "bg-teal-600" : "bg-slate-300"}
      `}
    >
      <span className={`
        absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200
        ${enabled ? "translate-x-5" : "translate-x-0"}
      `} />
    </button>
  );
}

/* ── Accordion Section ─────────────────────────────────────────── */

function AccordionSection({ section, isOpen, onToggle }: {
  section: SettingsSection; isOpen: boolean; onToggle: () => void;
}) {
  const Icon = section.icon;
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <Icon size={20} className="text-teal-600" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">{section.title}</h2>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 animate-slide-up">
          {section.children}
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export function SettingsPage() {
  const [language, setLanguage] = useState<LanguageCode>(
    () => (localStorage.getItem("aayu_language") as LanguageCode) || "en"
  );
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [openSection, setOpenSection] = useState("accessibility");

  // Accessibility
  const [textSize, setTextSize] = useState(() => document.documentElement.getAttribute("data-text-size") || "normal");
  const [highContrast, setHighContrast] = useState(() => document.documentElement.getAttribute("data-contrast") === "high");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  // Privacy
  const [storeHistory, setStoreHistory] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  // Offline
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    checkBackendHealth().then(setBackendOk);
  }, []);

  // Apply accessibility settings
  useEffect(() => {
    document.documentElement.setAttribute("data-text-size", textSize);
  }, [textSize]);

  useEffect(() => {
    document.documentElement.setAttribute("data-contrast", highContrast ? "high" : "");
  }, [highContrast]);

  function handleSave() {
    localStorage.setItem("aayu_language", language);
    localStorage.setItem("aayu_text_size", textSize);
    localStorage.setItem("aayu_high_contrast", String(highContrast));
    localStorage.setItem("aayu_tts_enabled", String(ttsEnabled));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleSection(id: string) {
    setOpenSection((prev) => (prev === id ? "" : id));
  }

  const sections: SettingsSection[] = [
    {
      id: "accessibility",
      title: "Accessibility",
      icon: Eye,
      children: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Adjust display settings for better readability and usability.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Text Size</p>
                  <p className="text-2xs text-slate-400">Adjust reading comfort</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTextSize("small")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${textSize === "small" ? "bg-teal-600 text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  A<sup>-</sup>
                </button>
                <button
                  onClick={() => setTextSize("normal")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${textSize === "normal" ? "bg-teal-600 text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  A
                </button>
                <button
                  onClick={() => setTextSize("large")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${textSize === "large" ? "bg-teal-600 text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  A<sup>+</sup>
                </button>
                <button
                  onClick={() => setTextSize("xl")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${textSize === "xl" ? "bg-teal-600 text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  A<sup>++</sup>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Contrast size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">High Contrast</p>
                  <p className="text-2xs text-slate-400">WCAG AA compliant contrast</p>
                </div>
              </div>
              <Toggle enabled={highContrast} onChange={setHighContrast} label="High contrast mode" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Text-to-Speech</p>
                  <p className="text-2xs text-slate-400">Read responses aloud</p>
                </div>
              </div>
              <Toggle enabled={ttsEnabled} onChange={setTtsEnabled} label="Text-to-speech" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "language",
      title: "Language",
      icon: Globe,
      children: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Select your preferred language for AAYU responses and voice interaction.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(LANGUAGES) as [LanguageCode, string][]).map(([code, name]) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${language === code
                    ? "bg-teal-600 text-slate-900 shadow-md ring-2 ring-teal-500/30"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700"
                  }
                `}
              >
                {language === code && <Check size={14} />}
                {name}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "voice",
      title: "Voice Settings",
      icon: Mic,
      children: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Configure voice input and output settings.</p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Speech Speed</p>
              <p className="text-2xs text-slate-400">Adjust TTS playback speed</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-8 text-right">{voiceSpeed}x</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-32 accent-teal-600"
                aria-label="Speech speed"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <p className="text-xs font-medium text-slate-600">🎙️ Whisper Model</p>
            <p className="text-2xs text-slate-400">Speech-to-text uses Faster-Whisper locally on your GPU for maximum privacy.</p>
          </div>
        </div>
      ),
    },
    {
      id: "privacy",
      title: "Privacy Controls",
      icon: Lock,
      children: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Manage your data and privacy preferences.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Chat History</p>
                  <p className="text-2xs text-slate-400">Store conversations locally</p>
                </div>
              </div>
              <Toggle enabled={storeHistory} onChange={setStoreHistory} label="Store chat history" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Anonymous Analytics</p>
                  <p className="text-2xs text-slate-400">Help improve AAYU (no personal data)</p>
                </div>
              </div>
              <Toggle enabled={analytics} onChange={setAnalytics} label="Anonymous analytics" />
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <ul className="space-y-1.5">
              {[
                "All data stored locally on your device",
                "Voice processing via local Whisper model",
                "No data sent to external servers",
                "Offline-capable by design",
              ].map((item) => (
                <li key={item} className="text-xs text-emerald-700 flex items-center gap-2">
                  <Shield size={12} className="text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => {
              if (confirm("This will clear all stored conversations. Continue?")) {
                localStorage.removeItem("aayu_conversations");
              }
            }}
            className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            🗑️ Clear all chat history
          </button>
        </div>
      ),
    },
    {
      id: "offline",
      title: "Offline Settings",
      icon: WifiOff,
      children: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Configure offline functionality and data syncing.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Offline Mode</p>
                  <p className="text-2xs text-slate-400">Use cached data when offline</p>
                </div>
              </div>
              <Toggle enabled={offlineMode} onChange={setOfflineMode} label="Offline mode" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Auto Sync</p>
                  <p className="text-2xs text-slate-400">Sync when connection is available</p>
                </div>
              </div>
              <Toggle enabled={autoSync} onChange={setAutoSync} label="Auto sync" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "backend",
      title: "System Status",
      icon: Server,
      children: (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${backendOk === null ? "bg-slate-300 animate-pulse" : backendOk ? "bg-emerald-500" : "bg-red-500"}`} />
              <div>
                <p className="text-sm font-medium text-slate-700">Backend API</p>
                <p className="text-2xs text-slate-400">ChromaDB + Search + Translation</p>
              </div>
            </div>
            <span className={`text-xs font-semibold ${backendOk === null ? "text-slate-400" : backendOk ? "text-emerald-600" : "text-red-600"}`}>
              {backendOk === null ? "Checking…" : backendOk ? "Connected" : "Offline"}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {backendOk
              ? "Backend is running. Semantic search, transcription, and translation are available."
              : "Backend not detected. Start with: uvicorn app.main:app --reload"}
          </p>

          <button
            onClick={() => { setBackendOk(null); checkBackendHealth().then(setBackendOk); }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            <RefreshCw size={12} />
            Re-check connection
          </button>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-xs font-medium text-slate-600 mb-1">Pipeline</p>
            <code className="text-2xs text-slate-500 block bg-slate-100 rounded-lg p-2 font-mono">
              Voice → Whisper → IndicTrans2 → ChromaDB → Triage → Response
            </code>
          </div>

          <p className="text-2xs text-slate-400">
            <strong>Version 0.4.0</strong> — Architecture release · Whisper · IndicTrans2 · ChromaDB · Rule-based Triage
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10  flex items-center justify-center">
            <Settings size={24} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-slate-400 text-sm">Customize your AAYU experience</p>
          </div>
        </div>
      </section>

      {/* Sections */}
      {sections.map((section) => (
        <AccordionSection
          key={section.id}
          section={section}
          isOpen={openSection === section.id}
          onToggle={() => toggleSection(section.id)}
        />
      ))}

      {/* Save */}
      <button
        onClick={handleSave}
        className={`
          w-full py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98]
          ${saved
            ? "bg-emerald-600 text-slate-900"
            : "bg-teal-600 hover:bg-teal-700 text-slate-900"
          }
        `}
      >
        {saved ? (
          <span className="inline-flex items-center gap-2">
            <Check size={16} /> Saved!
          </span>
        ) : (
          "Save Settings"
        )}
      </button>
    </div>
  );
}
