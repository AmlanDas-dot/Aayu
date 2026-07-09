import { useState } from "react";
import type { RetrievedDocument } from "@/types/search";

export function KnowledgeCard({ doc }: { doc: RetrievedDocument }) {
  const [open, setOpen] = useState(false);

  const badgeColor = "#0f766e";

  const content: string = doc.content || "";
  const parseSection = (label: string): string => {
    const match = content.match(new RegExp(`${label}[:\\s]+([^.]+(?:\\.[^S][^.]+)*)`, "i"));
    return match ? match[1].trim() : "";
  };

  const symptoms = parseSection("Symptoms");
  const guidance = parseSection("Guidance");
  const precautions = parseSection("Precautions");

  return (
    <div style={{
      border: "1px solid rgba(15, 118, 110, 0.15)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 8,
      backgroundColor: "#ffffff",
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "10px 14px",
          background: "#f0fdfa", border: "none", cursor: "pointer",
          textAlign: "left", gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
            borderRadius: 9999, background: `${badgeColor}22`, color: badgeColor,
            whiteSpace: "nowrap",
          }}>
            {Math.round((doc.score ?? 0) * 100)}%
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f766e" }}>
            {doc.title || doc.category || "Health Information"}
          </span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
          {doc.collection?.replace(/_/g, " ")} {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(15, 118, 110, 0.1)" }}>
          {symptoms && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#d97706", marginBottom: 4, textTransform: "uppercase" }}>
                🤒 Signs & Symptoms
              </p>
              <p style={{ fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>{symptoms}</p>
            </div>
          )}
          {guidance && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", marginBottom: 4, textTransform: "uppercase" }}>
                💊 What To Do
              </p>
              <p style={{ fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>{guidance}</p>
            </div>
          )}
          {precautions && (
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2563eb", marginBottom: 4, textTransform: "uppercase" }}>
                ⚠️ Precautions
              </p>
              <p style={{ fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>{precautions}</p>
            </div>
          )}
          {!symptoms && !guidance && !precautions && (
            <p style={{ fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>{content}</p>
          )}
        </div>
      )}
    </div>
  );
}
export default KnowledgeCard;
