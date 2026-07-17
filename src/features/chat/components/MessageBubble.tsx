import type { ChatMessage } from "../types/chat";
import { RISK_CONFIG } from "../utils/chatUtils";
import { KnowledgeCard } from "./KnowledgeCard";
import { EmergencyNearbyCare } from "./EmergencyNearbyCare";
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

            {/* temporary test portion*/}
            {(() => {
              console.log("risk_level =", msg.risk_level);
              // levelConfig removed
              return null;
            })()}

            {/* Risk Level Badge */}
            {(() => {
              if (msg.role !== "assistant") return null;

              if (msg.screening_mode && !msg.show_risk_level) {
                return (
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: "1px solid #e2e8f0",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "8px"
                  }}>
                    <i className="fa-solid fa-stethoscope" style={{ color: "#3b82f6" }}></i>
                    Assessing your symptoms...
                  </div>
                );
              }

              if (!msg.show_risk_level) return null;

              const level = String(msg.risk_level ?? "").toLowerCase().trim();
              const risk = RISK_CONFIG[level as keyof typeof RISK_CONFIG];

              if (!level) return null;

              if (!risk) {
                return (
                  <div
                    style={{
                      padding: 8,
                      background: "#fee2e2",
                      border: "1px solid red",
                      marginBottom: 8,
                    }}
                  >
                    Risk level:
                    <pre>{JSON.stringify(msg.risk_level)}</pre>
                  </div>
                );
              }

              return (
                <div className={risk.className}>
                  <i
                    className={
                      level === "emergency"
                        ? "fa-solid fa-triangle-exclamation"
                        : level === "urgent"
                          ? "fa-solid fa-circle-exclamation"
                          : "fa-solid fa-circle-check"
                    }
                  />
                  Risk Level: <strong>{risk.label}</strong>
                </div>
              );
            })()}

            {/* Verified Knowledge Badge */}
            {msg.role === "assistant" && msg.retrieved_documents && Array.isArray(msg.retrieved_documents) && msg.retrieved_documents.length > 0 && (
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
            {msg.role === "assistant" && msg.warnings && (Array.isArray(msg.warnings) ? msg.warnings : [msg.warnings]).length > 0 && (
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
                  {(Array.isArray(msg.warnings) ? msg.warnings : [msg.warnings]).map((w: any, idx) => {
                    const text = typeof w === 'string' ? w : (w?.text || w?.warning || JSON.stringify(w));
                    return <div key={idx}>{text}</div>;
                  })}
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
            <p style={{ whiteSpace: "pre-line" }}>
              {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
            </p>

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
            {msg.retrieved_documents && Array.isArray(msg.retrieved_documents) && msg.retrieved_documents.length > 0 && (
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
            
            {/* Location-Aware Emergency Assistance */}
            {msg.role === "assistant" && msg.healthcare_recommendation?.enabled && (
               <EmergencyNearbyCare recommendation={msg.healthcare_recommendation} />
            )}

            <span className="message-time">
              {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : ""}
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
