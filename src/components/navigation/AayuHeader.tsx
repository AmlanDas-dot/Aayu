import { LANGUAGES } from "@/constants/languages";
import { StatusBar } from "../StatusBar";
import { AccountDropdown } from "./AccountDropdown";

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

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
        <AccountDropdown />
      </div>
    </header>
  );
}
