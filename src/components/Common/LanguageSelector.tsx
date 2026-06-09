import React from "react";
import { LANGUAGES, type LanguageCode } from "../../constants/languages";

interface LanguageSelectorProps {
  language: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  disabled?: boolean;
}

/**
 * Reusable language selector dropdown styled to Aayu's glassmorphic palette.
 *
 * Only English, Hindi, Gujarati and Odia are exposed in the UI.
 * To add a language: update LANGUAGES in src/constants/languages.ts.
 */
export function LanguageSelector({
  language,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div
      title="Select transcription language"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {/* Globe icon */}
      <span
        style={{
          position: "absolute",
          left: "8px",
          fontSize: "0.8rem",
          pointerEvents: "none",
          opacity: 0.6,
        }}
        aria-hidden="true"
      >
        🌐
      </span>

      <select
        id="language-selector"
        value={language}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        disabled={disabled}
        aria-label="Transcription language"
        style={{
          appearance: "none",
          paddingLeft: "26px",
          paddingRight: "24px",
          paddingTop: "7px",
          paddingBottom: "7px",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "8px",
          color: "inherit",
          fontSize: "0.82rem",
          fontWeight: 500,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "border-color 0.2s, background 0.2s",
          minWidth: "90px",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled)
            (e.currentTarget as HTMLSelectElement).style.borderColor =
              "rgba(255,255,255,0.35)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLSelectElement).style.borderColor =
            "rgba(255,255,255,0.15)";
        }}
      >
        {(Object.entries(LANGUAGES) as [LanguageCode, string][]).map(
          ([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          )
        )}
      </select>

      {/* Chevron */}
      <span
        style={{
          position: "absolute",
          right: "7px",
          fontSize: "0.6rem",
          pointerEvents: "none",
          opacity: 0.5,
        }}
        aria-hidden="true"
      >
        ▾
      </span>
    </div>
  );
}
