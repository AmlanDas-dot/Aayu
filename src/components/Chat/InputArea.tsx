import React, { useEffect } from "react";
import { useSpeech } from "../../hooks/useSpeech";
import { LanguageSelector } from "../Common/LanguageSelector";
import type { LanguageCode } from "../../constants/languages";

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string) => void;
  isProcessing: boolean;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

export function InputArea({
  input,
  setInput,
  onSend,
  isProcessing,
  language,
  setLanguage,
}: InputAreaProps) {
  const {
    startListening,
    stopListening,
    isListening,
    isLoading,
    transcript,
    error,
    isSupported,
  } = useSpeech(language);

  // Sync server transcription into the text area
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript, setInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleToggleSpeech = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Mic button label: recording → loading → idle
  const micLabel = isListening
    ? "🛑 Stop"
    : isLoading
    ? "⏳ Processing…"
    : "🎙️ Speak";

  const micDisabled = isLoading || isProcessing;

  return (
    <div className="input-row-wrapper">
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{
            marginBottom: "6px",
            padding: "6px 10px",
            borderRadius: "6px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div
        className="input-row"
        style={{ display: "flex", gap: "8px", alignItems: "center" }}
      >
        {/* Language selector — disabled while recording */}
        {isSupported && (
          <LanguageSelector
            language={language}
            onChange={setLanguage}
            disabled={isListening || isLoading}
          />
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="message-input"
          placeholder={
            isListening
              ? "Listening… Speak now."
              : isLoading
              ? "Transcribing audio…"
              : "Describe your symptoms or ask Aayu…"
          }
          disabled={isProcessing}
          style={{ flex: 1 }}
        />

        {isSupported && (
          <button
            id="speech-toggle-btn"
            type="button"
            onClick={handleToggleSpeech}
            disabled={micDisabled}
            className={`speech-btn ${isListening ? "listening" : ""}`}
            style={{
              padding: "8px 12px",
              background: isListening
                ? "rgba(239, 68, 68, 0.15)"
                : isLoading
                ? "rgba(250, 204, 21, 0.12)"
                : "rgba(0, 0, 0, 0.05)",
              color: isListening
                ? "#ef4444"
                : isLoading
                ? "#ca8a04"
                : "inherit",
              borderRadius: "8px",
              border: isListening
                ? "1px solid #ef4444"
                : isLoading
                ? "1px solid #ca8a04"
                : "1px solid rgba(0, 0, 0, 0.06)",
              cursor: micDisabled ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              opacity: micDisabled ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            title={isListening ? "Stop recording" : "Start speaking"}
          >
            <span>{micLabel}</span>
          </button>
        )}

        <button
          id="send-btn"
          onClick={() => onSend()}
          disabled={isProcessing || !input.trim()}
          style={{
            padding: "8px 16px",
            background: "rgba(0, 0, 0, 0.08)",
            border: "1px solid rgba(0, 0, 0, 0.06)",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {isProcessing ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
