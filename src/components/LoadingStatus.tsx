import React from "react";

export function LoadingStatus({ icon, status, subtitle }: { icon: string, status: string, subtitle?: string }) {
  const hasDots = status.endsWith("...");
  const baseStatus = hasDots ? status.slice(0, -3) : status;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "16px 20px",
      background: "var(--surface-color, #ffffff)",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      border: "1px solid rgba(15, 118, 110, 0.15)",
      margin: "12px 0",
      transition: "all 0.3s ease",
      animation: "fadeIn 0.4s ease"
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "rgba(16, 185, 129, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.2rem",
        color: "#0f766e",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      }}>
        {icon.startsWith("fa-") ? <i className={`fa-solid ${icon}`}></i> : <span>{icon}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>
          {baseStatus}
          {hasDots && <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>}
        </span>
        {subtitle && <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{subtitle}</span>}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(0.95); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadingDots {
          0%, 20% { color: rgba(0,0,0,0); text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); }
          40% { color: inherit; text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); }
          60% { text-shadow: .25em 0 0 inherit, .5em 0 0 rgba(0,0,0,0); }
          80%, 100% { text-shadow: .25em 0 0 inherit, .5em 0 0 inherit; }
        }
        .loading-dots span {
          animation: blink 1.4s infinite both;
        }
        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
