import type { ChatMessage } from "../types/chat";
import { RISK_CONFIG } from "../utils/chatUtils";
import { KnowledgeCard } from "./KnowledgeCard";
import { LoadingStatus } from "@/components/LoadingStatus";
import logoHeart from "@/assets/logo-heart.png";

interface MessageBubbleProps {
  msg: ChatMessage;
  processingStage: { icon: string; text: string } | null;
  speakingMsgId: string | null;
  handleToggleSpeak: (msgId: string, text: string) => void;
}

export function MessageBubble({
  msg,
  processingStage,
  speakingMsgId,
  handleToggleSpeak,
}: MessageBubbleProps) {
  return (
    <div className={`message-wrapper ${msg.role}`}>
      {msg.role === "assistant" && (
        <img src={logoHeart} alt="AAYU avatar" className="message-avatar" />
      )}

      <div className="message-card">
        {msg.isTyping && processingStage ? (
          <LoadingStatus icon={processingStage.icon} status={processingStage.text} />
        ) : msg.isTyping ? (
          <LoadingStatus icon="fa-brain" status="🩺 AAYU is analyzing your request..." />
        ) : (
          <>
            {/* Risk Level Badge */}
            {msg.role === "assistant" && msg.risk_level && (
              <div className={RISK_CONFIG[msg.risk_level].className}>
                <i className={msg.risk_level === "emergency" ? "fa-solid fa-triangle-exclamation" : msg.risk_level === "urgent" ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check"}></i>
                Risk Level: <strong>{RISK_CONFIG[msg.risk_level].label}</strong>
              </div>
            )}

            {/* Verified Knowledge Badge */}
            {msg.role === "assistant" && msg.retrieved_documents && msg.retrieved_documents.length > 0 && (
              <div style={{
                fontSize: "0.68rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#0f766e",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 8,
                marginLeft: (msg.mode || msg.llm_provider) ? 8 : 0,
                fontWeight: 700
              }}>
                <i className="fa-solid fa-check-circle"></i> Verified Medical Knowledge
              </div>
            )}

            {/* Warnings Badge */}
            {msg.role === "assistant" && msg.warnings && msg.warnings.length > 0 && (
              <div style={{
                fontSize: "0.72rem",
                padding: "6px 10px",
                borderRadius: "6px",
                background: "rgba(245, 158, 11, 0.1)",
                color: "#d97706",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
                fontWeight: 600,
                width: "100%"
              }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <div>
                  {msg.warnings.map((w, idx) => (
                    <div key={idx}>{w}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Image display */}
            {msg.image && (
              <div style={{ marginBottom: "10px", marginTop: "4px" }}>
                <img
                  src={msg.image}
                  alt="Symptom preview"
                  style={{
                    maxWidth: "240px",
                    maxHeight: "180px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    border: "1px solid #e2e8f0",
                    display: "block",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                  }}
                />
              </div>
            )}

            {/* Text Content */}
            <p style={{ whiteSpace: "pre-line" }}>{msg.text}</p>

            {/* TTS Speaker playback */}
            {msg.role === "assistant" && msg.text && (
              <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() => handleToggleSpeak(msg.id, msg.text)}
                  style={{
                    background: speakingMsgId === msg.id ? "#ccfbf1" : "#f1f5f9",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "0.75rem",
                    color: speakingMsgId === msg.id ? "#0f766e" : "#64748b",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {speakingMsgId === msg.id ? "⏹️ Stop" : "🔊 Speak"}
                </button>
              </div>
            )}

            {/* Knowledge Grounding Cards */}
            {msg.retrieved_documents && msg.retrieved_documents.length > 0 && (
              <div style={{ marginTop: 12, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  📚 Related Health Groundings ({msg.retrieved_documents.length})
                </p>
                {msg.retrieved_documents.map((doc, i) => (
                  <KnowledgeCard key={i} doc={doc} />
                ))}
              </div>
            )}

            {/* Safety Warning Disclaimer */}
            {msg.disclaimer && (
              <div className="response-disclaimer">
                <i className="fa-solid fa-circle-info"></i>
                {msg.disclaimer}
              </div>
            )}

            <span className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {msg.processing_time_ms != null && (
                <span style={{ opacity: 0.7 }}> · {msg.processing_time_ms}ms</span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
export default MessageBubble;
