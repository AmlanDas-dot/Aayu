import { useState, useEffect } from "react";
import { getSystemStatus, type SystemStatus } from "../services/api";

export function StatusBar() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    const poll = () =>
      getSystemStatus()
        .then((s) => { setStatus(s); setBackendDown(false); })
        .catch(() => { setBackendDown(true); setStatus(null); });

    poll();
    const t = setInterval(poll, 30_000);
    return () => clearInterval(t);
  }, []);

  if (backendDown) {
    return null;
  }

  if (!status) return null;

  const isOnline = status.connectivity === "online";
  const provider = status.llm?.preferred ?? "ollama";
  const ollamaOk = status.llm?.ollama === "running";
  const color = isOnline ? "#10b981" : ollamaOk ? "#f59e0b" : "#6b7280";
  const bg = isOnline ? "rgba(16,185,129,0.12)" : ollamaOk ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.12)";
  const icon = isOnline ? "🟢" : ollamaOk ? "🟡" : "⚫";
  const label = isOnline
    ? `Online · ${provider}`
    : ollamaOk
      ? "Offline · Ollama"
      : "No LLM";

  return (
    <div style={pill(color, bg)}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function pill(color: string, bg: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.7rem",
    padding: "4px 12px",
    borderRadius: "9999px",
    background: bg,
    border: `1px solid ${color}`,
    color,
    fontWeight: 600,
    userSelect: "none",
    whiteSpace: "nowrap",
  };
}
