import { getLabels } from "../utils/chatUtils";
import type { ChatMessage } from "../types/chat";

interface ScreeningPanelProps {
  screeningActive: boolean;
  screeningQuestion: any;
  screeningQIndex: number;
  screeningQTotal: number;
  runningScores: any[];
  confidenceLabel: string;
  screeningComplete: boolean;
  messages: ChatMessage[];
  isProcessing: boolean;
  language: string;
  handleScreeningAnswer: (answer: string) => void;
  onNavigateToHospitals: () => void;
}

export function ScreeningPanel({
  screeningActive,
  screeningQuestion,
  screeningQIndex,
  screeningQTotal,
  runningScores,
  confidenceLabel,
  screeningComplete,
  messages,
  isProcessing,
  language,
  handleScreeningAnswer,
  onNavigateToHospitals,
}: ScreeningPanelProps) {
  return (
    <>
      {/* SCREENING OPTIONS PANEL */}
      {screeningActive && screeningQuestion && (
        <div style={{
          margin: "0 20px 10px",
          borderRadius: "18px",
          border: "1px solid rgba(15, 118, 110, 0.3)",
          background: "linear-gradient(135deg, rgba(15,118,110,0.06) 0%, rgba(6,182,212,0.02) 100%)",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(15, 118, 110, 0.05)"
        }}>
          <div style={{
            padding: "10px 16px",
            background: "rgba(15, 118, 110, 0.08)",
            borderBottom: "1px solid rgba(15, 118, 110, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {getLabels(language).healthScreening}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
              {getLabels(language).questionOf(screeningQIndex + 1, screeningQTotal)}
            </span>
          </div>

          <div style={{ height: "3px", background: "rgba(15, 118, 110, 0.05)" }}>
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #0f766e 0%, #06b6d4 100%)",
                width: `${(screeningQIndex / screeningQTotal) * 100}%`,
                transition: "width 0.4s ease"
              }}
            />
          </div>

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", margin: 0, lineHeight: 1.5 }}>
                {screeningQuestion.text}
              </p>
              {screeningQuestion.hint && (
                <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 0", fontStyle: "italic" }}>
                  💡 {screeningQuestion.hint}
                </p>
              )}
            </div>

            {/* Interactive chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {screeningQuestion.options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => handleScreeningAnswer(opt)}
                  disabled={isProcessing}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "999px",
                    border: "1.5px solid #0f766e",
                    background: "#ffffff",
                    color: "#0f766e",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: isProcessing ? 0.6 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.background = "#0f766e";
                      e.currentTarget.style.color = "#ffffff";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.color = "#0f766e";
                    }
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Live condition narrowing display */}
            {runningScores.length > 0 && (
              <div style={{
                padding: "10px 12px",
                borderRadius: "12px",
                background: "rgba(15, 118, 110, 0.03)",
                border: "1px solid rgba(15, 118, 110, 0.1)",
                marginTop: 4
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {getLabels(language).currentAssessment}
                  </span>
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    background: confidenceLabel === "High" ? "#dcfce7" : confidenceLabel === "Medium" ? "#fef3c7" : "#f1f5f9",
                    color: confidenceLabel === "High" ? "#15803d" : confidenceLabel === "Medium" ? "#b45309" : "#475569"
                  }}>
                    {confidenceLabel} Confidence
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {runningScores.filter((c: any) => c.score >= 0.35).slice(0, 3).map((c: any, i: number) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.85rem" }}>{c.icon || "🤒"}</span>
                      <span style={{
                        fontSize: "0.78rem",
                        flex: 1,
                        color: i === 0 ? "#0f766e" : "#475569",
                        fontWeight: i === 0 ? 600 : 500
                      }}>
                        {c.name}
                      </span>
                      <div style={{ width: "60px", height: "4px", background: "#e2e8f0", borderRadius: 999 }}>
                        <div style={{
                          height: "100%",
                          borderRadius: 999,
                          background: i === 0 ? "#0f766e" : "#94a3b8",
                          width: `${Math.round(c.score * 100)}%`,
                          transition: "width 0.4s ease"
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREENING COMPLETE & CTA */}
      {screeningComplete && (() => {
        const lastMsg = messages.slice().reverse().find(m => m.role === "assistant");
        const showCTA = lastMsg && (lastMsg.risk_level === "emergency" || lastMsg.risk_level === "urgent");
        if (!showCTA) return null;

        return (
          <div style={{ margin: "0 20px 20px", textAlign: "center" }}>
            <button 
              onClick={onNavigateToHospitals}
              style={{
                background: "#ef4444",
                color: "white",
                padding: "14px 24px",
                borderRadius: "12px",
                border: "none",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              📍 Find Nearby Hospitals
            </button>
          </div>
        );
      })()}
    </>
  );
}
export default ScreeningPanel;
