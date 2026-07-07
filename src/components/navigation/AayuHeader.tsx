import { LANGUAGES } from "@/constants/languages";
import { StatusBar } from "../StatusBar";

interface AayuHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
}

export function AayuHeader({ language, onLanguageChange }: AayuHeaderProps) {
  return (
    <header className="aayu-header">
      <div className="header-left">
        <div className="header-search">
          <span className="header-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search for diseases, symptoms, articles, schemes..."
            className="header-search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <StatusBar />
        <select
          className="header-lang-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              🌐 {name}
            </option>
          ))}
        </select>
        <button className="header-settings-btn" title="Settings">⚙️</button>
        <button className="header-account-btn" title="Account">👤</button>
      </div>
    </header>
  );
}
