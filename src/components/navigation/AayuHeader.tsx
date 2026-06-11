import { LANGUAGES } from "../../constants/languages";
import type { LanguageCode } from "../../constants/languages";

interface AayuHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  onMenuToggle: () => void;
}

export function AayuHeader({ language, onLanguageChange, onMenuToggle }: AayuHeaderProps) {
  return (
    <header className="aayu-header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          ☰
        </button>
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
