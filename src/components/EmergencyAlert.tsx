interface EmergencyInfo {
  is_emergency: boolean;
  risk_level: string;
  detected_conditions: string[];
  call_108: boolean;
  summary: string;
}

interface EmergencyAlertProps {
  emergency: EmergencyInfo;
}

export function EmergencyAlert({ emergency }: EmergencyAlertProps) {
  if (!emergency.is_emergency) return null;

  const isCritical = emergency.risk_level === "critical";
  const color = isCritical ? "#ef4444" : "#f59e0b";
  const bg    = isCritical ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)";

  return (
    <div
      role="alert"
      style={{
        border: `2px solid ${color}`,
        borderRadius: 12,
        background: bg,
        padding: "16px 20px",
        margin: "0 0 12px",
      }}
    >
      <p style={{ fontWeight: 700, color, fontSize: "1rem", marginBottom: 8 }}>
        {isCritical ? "🚨 CRITICAL EMERGENCY" : "⚠️ URGENT — Seek Medical Help"}
      </p>

      <p style={{ fontSize: "0.85rem", marginBottom: 12, whiteSpace: "pre-line" }}>
        {emergency.summary}
      </p>

      {emergency.detected_conditions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {emergency.detected_conditions.map((c) => (
            <span
              key={c}
              style={{
                background: color,
                color: "#fff",
                borderRadius: 9999,
                padding: "2px 10px",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {emergency.call_108 && (
        <a
          href="tel:108"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#ef4444",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
          }}
          onClick={(e) => {
            if (!window.confirm("Call 108 Emergency Services now?")) {
              e.preventDefault();
            }
          }}
        >
          📞 Call 108
        </a>
      )}
    </div>
  );
}
