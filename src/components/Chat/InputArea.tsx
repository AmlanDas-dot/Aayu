import React, { useEffect } from "react";
import { useSpeech } from "../../hooks/useSpeech";

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string) => void;
  isProcessing: boolean;
}

export function InputArea({ input, setInput, onSend, isProcessing }: InputAreaProps) {
  const { startListening, stopListening, isListening, transcript, isSupported } = useSpeech();

  // Sync transcription to text area
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

  return (
    <div className="input-row-wrapper">
      <div className="input-row" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="message-input"
          placeholder={isListening ? "Listening... Speak now." : "Describe your symptoms or ask Aayu..."}
          disabled={isProcessing}
          style={{ flex: 1 }}
        />
        
        {isSupported && (
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`speech-btn ${isListening ? "listening" : ""}`}
            style={{
              padding: "8px 12px",
              background: isListening ? "rgba(239, 68, 68, 0.15)" : "rgba(0, 0, 0, 0.05)",
              color: isListening ? "#ef4444" : "inherit",
              borderRadius: "8px",
              border: isListening ? "1px solid #ef4444" : "1px solid rgba(0, 0, 0, 0.06)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            title={isListening ? "Stop listening" : "Start speaking"}
          >
            <span>{isListening ? "🛑 Stop" : "🎙️ Speak"}</span>
          </button>
        )}

        <button
          onClick={() => onSend()}
          disabled={isProcessing || !input.trim()}
          style={{
            padding: "8px 16px",
            background: "rgba(0, 0, 0, 0.08)",
            border: "1px solid rgba(0, 0, 0, 0.06)",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {isProcessing ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
