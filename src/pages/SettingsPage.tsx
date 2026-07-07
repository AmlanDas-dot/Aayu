import { useState, useEffect } from "react";
import { LANGUAGES } from "@/constants/languages";
import type { LanguageCode } from "@/constants/languages";
import { checkBackendHealth } from "@/services/api";

export function SettingsPage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    checkBackendHealth().then(setBackendOk);
  }, []);

  function handleSave() {
    localStorage.setItem("aayu_language", language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">⚙️ Settings</h1>

      <div className="settings-grid">
        {/* Language */}
        <div className="settings-card">
          <h2 className="settings-section-title">🌐 Language Preference</h2>
          <p className="settings-desc">Select your preferred language for AAYU responses and voice interaction.</p>
          <div className="lang-options">
            {(Object.entries(LANGUAGES) as [LanguageCode, string][]).map(([code, name]) => (
              <button
                key={code}
                className={`lang-option-btn ${language === code ? "lang-option-active" : ""}`}
                onClick={() => setLanguage(code)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Backend Status */}
        <div className="settings-card">
          <h2 className="settings-section-title">🔌 Backend Status</h2>
          <div className="status-row">
            <span>ChromaDB + Search API</span>
            <span className={`status-dot ${backendOk === null ? "checking" : backendOk ? "ok" : "error"}`}>
              {backendOk === null ? "Checking…" : backendOk ? "✅ Connected" : "❌ Offline"}
            </span>
          </div>
          <p className="settings-desc">
            {backendOk
              ? "Backend is running. Semantic search and transcription are available."
              : "Backend not detected. Start with: uvicorn app.main:app --reload (from backend/)"}
          </p>
          <button className="settings-refresh-btn" onClick={() => checkBackendHealth().then(setBackendOk)}>
            🔄 Re-check
          </button>
        </div>

        {/* Privacy */}
        <div className="settings-card">
          <h2 className="settings-section-title">🔒 Privacy</h2>
          <ul className="privacy-list">
            <li>✅ All data stored locally on your device</li>
            <li>✅ Voice processing via Browser & Sarvam AI</li>
            <li>✅ No data sent to external servers</li>
            <li>✅ Offline-capable by design</li>
          </ul>
        </div>

        {/* About */}
        <div className="settings-card">
          <h2 className="settings-section-title">ℹ️ About AAYU</h2>
          <p className="settings-desc">
            <strong>Version 0.2.0</strong> — Architecture release<br />
            Multilingual rural healthcare assistant powered by:<br />
            STT · IndicTrans2 · ChromaDB · Ollama
          </p>
          <div className="status-note">
            <code>Voice → STT → Translation → ChromaDB → LLM → Response</code>
          </div>
        </div>
      </div>

      <button className="settings-save-btn" onClick={handleSave}>
        {saved ? "✅ Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
