import { LANGUAGES } from "@/constants/languages";

import { AccountDropdown } from "./AccountDropdown";
import { useNetwork } from "@/hooks/useNetwork";

interface AayuHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
}

export function AayuHeader({ language, onLanguageChange }: AayuHeaderProps) {
  const { isOnline } = useNetwork();
  
  return (
    <>
      {!isOnline && (
        <div style={{ background: '#ef4444', color: 'white', textAlign: 'center', padding: '8px', fontSize: '14px', fontWeight: 'bold', zIndex: 1000, position: 'relative' }}>
          You are offline. Features may be limited.
        </div>
      )}
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
    </>
  );
}
