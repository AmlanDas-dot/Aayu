import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";
import type { RiskLevel, RetrievedDocument, ChatApiResponse } from "../types/search";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  // Sprint 2 fields — only set on assistant messages
  risk_level?: RiskLevel;
  retrieved_documents?: RetrievedDocument[];
  matched_rules?: string[];
  disclaimer?: string;
  processing_time_ms?: number;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

// ── Risk badge helpers ───────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string; icon: string }> = {
  emergency: { label: "EMERGENCY",  className: "risk-badge risk-emergency", icon: "🚨" },
  urgent:    { label: "URGENT",     className: "risk-badge risk-urgent",    icon: "⚠️" },
  routine:   { label: "ROUTINE",    className: "risk-badge risk-routine",   icon: "✅" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Namaste! 🙏 I am AAYU, your AI health assistant.\n\nI can help you with:\n• Understanding symptoms\n• First aid guidance\n• Emergency triage\n• Health information\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]               = useState("");
  const [language, setLanguage]         = useState("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function toggleDoc(docKey: string) {
    setExpandedDocs((prev) => ({ ...prev, [docKey]: !prev[docKey] }));
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isProcessing) return;

    const userMsg: ChatMessage = { id: makeId(), role: "user", text: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    const typingId = makeId();
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", text: "", timestamp: new Date(), isTyping: true },
    ]);

    try {
      const apiResp: ChatApiResponse = await sendChatMessage({ message: msg, language });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? {
                ...m,
                text: apiResp.response,
                isTyping: false,
                risk_level: apiResp.risk_level,
                retrieved_documents: apiResp.retrieved_documents,
                matched_rules: apiResp.matched_rules,
                disclaimer: apiResp.disclaimer,
                processing_time_ms: apiResp.processing_time_ms,
              }
            : m
        )
      );
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId ? { ...m, text: errMsg, isTyping: false } : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-container">

        {/* ── Messages ───────────────────────────────────────────────── */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble-wrap ${msg.role}`}>
              {msg.role === "assistant" && <div className="chat-avatar">🌿</div>}
              <div className={`chat-bubble ${msg.role}`}>
                {msg.isTyping ? (
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                ) : (
                  <>
                    {/* Risk badge */}
                    {msg.risk_level && (
                      <div className={RISK_CONFIG[msg.risk_level].className}>
                        {RISK_CONFIG[msg.risk_level].icon}{" "}
                        {RISK_CONFIG[msg.risk_level].label}
                      </div>
                    )}

                    {/* Response text */}
                    <p className="bubble-text">{msg.text}</p>

                    {/* Retrieved document cards */}
                    {msg.retrieved_documents && msg.retrieved_documents.length > 0 && (
                      <div className="retrieved-docs">
                        <div className="retrieved-docs-title">
                          📚 Retrieved Knowledge ({msg.retrieved_documents.length})
                        </div>
                        {msg.retrieved_documents.map((doc, idx) => {
                          const key = `${msg.id}-${idx}`;
                          const isOpen = !!expandedDocs[key];
                          return (
                            <div
                              key={key}
                              className={`doc-card${isOpen ? " expanded" : ""}`}
                              onClick={() => toggleDoc(key)}
                            >
                              <div className="doc-card-header">
                                <div className="doc-card-left">
                                  <span className="doc-score">
                                    {(doc.score * 100).toFixed(0)}%
                                  </span>
                                  <strong className="doc-title">{doc.title}</strong>
                                </div>
                                <div className="doc-card-right">
                                  <span className="doc-collection">{doc.collection}</span>
                                  <span className="doc-toggle">{isOpen ? "▲" : "▼"}</span>
                                </div>
                              </div>
                              {isOpen && (
                                <div className="doc-card-body">
                                  {doc.category && (
                                    <span className="doc-category">{doc.category}</span>
                                  )}
                                  <p className="doc-content">{doc.content}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Disclaimer */}
                    {msg.disclaimer && (
                      <p className="bubble-disclaimer">{msg.disclaimer}</p>
                    )}

                    {/* Timestamp + processing time */}
                    <span className="bubble-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {msg.processing_time_ms != null && (
                        <span className="processing-time"> · {msg.processing_time_ms}ms</span>
                      )}
                    </span>
                  </>
                )}
              </div>
              {msg.role === "user" && <div className="chat-avatar user-avatar">👤</div>}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Input area ─────────────────────────────────────────────── */}
        <div className="chat-input-area">

          {/* Quick prompts */}
          <div className="quick-prompts">
            {[
              "Fever and headache",
              "Snake bite first aid",
              "Dog bite — what to do?",
              "Healthy food advice",
            ].map((q) => (
              <button key={q} className="quick-prompt-btn" onClick={() => handleSend(q)}>
                {q}
              </button>
            ))}
          </div>

          {/* Language selector */}
          <div className="chat-lang-row">
            <label className="lang-label" htmlFor="chat-lang-select">Language:</label>
            <select
              id="chat-lang-select"
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isProcessing}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="or">ଓଡ଼ିଆ (Odia)</option>
            </select>
          </div>

          {/* Text input + send */}
          <div className="chat-input-row">
            <textarea
              id="chat-textarea"
              className="chat-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Describe your symptoms or ask AAYU..."
              rows={2}
              disabled={isProcessing}
            />
            <button
              id="chat-send-btn"
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={isProcessing || !input.trim()}
            >
              {isProcessing ? "⏳" : "➤"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
