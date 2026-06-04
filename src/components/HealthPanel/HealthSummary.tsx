import { useState } from "react";
import { HealthRecord, HealthFieldKey, RiskFactors } from "../../types";
import { DisclaimerBanner } from "../Common/DisclaimerBanner";
import { SEVERITY_OPTIONS } from "../../config/constants";
import { KnowledgeEntry } from "../../services/rag/types";

interface HealthSummaryProps {
  activeRecord: Omit<HealthRecord, "id" | "createdAt" | "summary">;
  updateField: (key: HealthFieldKey, value: any) => void;
  updateRiskFactor?: (key: keyof RiskFactors, value: boolean) => void;
  onAskAI: () => void;
  onSave: () => void;
  onReset: () => void;
  isProcessing: boolean;
  matchedGuidelines: KnowledgeEntry[];
}

const URGENCY_COLORS: Record<string, string> = {
  routine: "#16a34a",
  soon: "#d97706",
  urgent: "#dc2626",
  emergency: "#7c3aed",
};

const URGENCY_LABELS: Record<string, string> = {
  routine: "✅ Routine",
  soon: "⚠️ See doctor soon",
  urgent: "🔴 Urgent",
  emergency: "🚨 Emergency",
};

export function HealthSummary({
  activeRecord,
  updateField,
  updateRiskFactor,
  onAskAI,
  onSave,
  onReset,
  isProcessing,
  matchedGuidelines,
}: HealthSummaryProps) {
  const [expandedAdditional, setExpandedAdditional] = useState(false);

  const canSave =
    activeRecord.symptoms.trim() ||
    activeRecord.duration.trim() ||
    activeRecord.severity.trim();

  const hasAdditionalData =
    activeRecord.personalHistory ||
    activeRecord.familyHistory ||
    activeRecord.occupation ||
    activeRecord.nutrition ||
    activeRecord.housingConditions ||
    activeRecord.pets ||
    activeRecord.incomeRange ||
    activeRecord.governmentSchemeUsage ||
    Object.values(activeRecord.riskFactors ?? {}).some(Boolean);

  return (
    <div
      className="panel"
      style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}
    >
      <DisclaimerBanner />

      <h2 className="font-semibold mb-3">Symptom Profile</h2>

      {/* Part 3: Urgency & Possible Conditions badges */}
      {(activeRecord.urgency || (activeRecord.possibleConditions?.length ?? 0) > 0) && (
        <div style={{ marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {activeRecord.urgency && (
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "999px",
                background: `${URGENCY_COLORS[activeRecord.urgency] ?? "#6b7280"}18`,
                color: URGENCY_COLORS[activeRecord.urgency] ?? "#6b7280",
                border: `1px solid ${URGENCY_COLORS[activeRecord.urgency] ?? "#6b7280"}30`,
              }}
            >
              {URGENCY_LABELS[activeRecord.urgency] ?? activeRecord.urgency}
            </span>
          )}
          {activeRecord.possibleConditions?.map((cond, i) => (
            <span
              key={i}
              style={{
                fontSize: "0.72rem",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "rgba(99,102,241,0.08)",
                color: "#4338ca",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              {cond}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        {/* Core fields */}
        <SummaryField
          label="Symptoms"
          value={activeRecord.symptoms}
          onChange={(v) => updateField("symptoms", v)}
        />
        <SummaryField
          label="Duration"
          value={activeRecord.duration}
          onChange={(v) => updateField("duration", v)}
        />

        <div>
          <p className="memory-field">Severity</p>
          <select
            value={activeRecord.severity}
            onChange={(e) => updateField("severity", e.target.value)}
            className="field-input"
            style={{
              width: "100%",
              padding: "6px 8px",
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "8px",
            }}
          >
            <option value="">Select severity...</option>
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <SummaryField
              label="Age"
              value={activeRecord.age}
              onChange={(v) => updateField("age", v)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <SummaryField
              label="Gender"
              value={activeRecord.gender}
              onChange={(v) => updateField("gender", v)}
            />
          </div>
        </div>

        <SummaryField
          label="Location"
          value={activeRecord.location}
          onChange={(v) => updateField("location", v)}
        />
        <SummaryField
          label="Pre-existing Conditions"
          value={activeRecord.preExistingConditions}
          onChange={(v) => updateField("preExistingConditions", v)}
        />
        <SummaryField
          label="Triggers"
          value={activeRecord.triggers}
          onChange={(v) => updateField("triggers", v)}
        />

        {/* Part 4: Expandable Additional Health Information */}
        <div
          style={{
            borderTop: "1px solid rgba(0,0,0,0.06)",
            paddingTop: "8px",
            marginTop: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => setExpandedAdditional(!expandedAdditional)}
            style={{
              all: "unset",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#6366f1",
              width: "100%",
              padding: "4px 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: expandedAdditional ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                fontSize: "0.7rem",
              }}
            >
              ▶
            </span>
            Additional Health Information
            {hasAdditionalData && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#6366f1",
                  display: "inline-block",
                  marginLeft: "2px",
                }}
              />
            )}
          </button>

          {expandedAdditional && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "10px",
                padding: "12px",
                background: "rgba(99,102,241,0.04)",
                borderRadius: "10px",
                border: "1px solid rgba(99,102,241,0.1)",
              }}
            >
              <SummaryField
                label="Personal Medical History"
                value={activeRecord.personalHistory ?? ""}
                onChange={(v) => updateField("personalHistory", v)}
              />
              <SummaryField
                label="Family History"
                value={activeRecord.familyHistory ?? ""}
                onChange={(v) => updateField("familyHistory", v)}
              />
              <SummaryField
                label="Occupation"
                value={activeRecord.occupation ?? ""}
                onChange={(v) => updateField("occupation", v)}
              />
              <SummaryField
                label="Nutrition / Diet"
                value={activeRecord.nutrition ?? ""}
                onChange={(v) => updateField("nutrition", v)}
              />
              <SummaryField
                label="Housing Conditions"
                value={activeRecord.housingConditions ?? ""}
                onChange={(v) => updateField("housingConditions", v)}
              />
              <SummaryField
                label="Pets"
                value={activeRecord.pets ?? ""}
                onChange={(v) => updateField("pets", v)}
              />
              <SummaryField
                label="Income Range"
                value={activeRecord.incomeRange ?? ""}
                onChange={(v) => updateField("incomeRange", v)}
              />
              <SummaryField
                label="Government Scheme Usage"
                value={activeRecord.governmentSchemeUsage ?? ""}
                onChange={(v) => updateField("governmentSchemeUsage", v)}
              />

              {/* Risk Factors checkboxes */}
              {updateRiskFactor && (
                <div>
                  <p
                    className="memory-field"
                    style={{ marginBottom: "6px", fontSize: "0.82rem", fontWeight: 600 }}
                  >
                    Risk Factors
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                    }}
                  >
                    {(
                      [
                        ["smoking", "Smoking"],
                        ["alcohol", "Alcohol"],
                        ["tobacco", "Tobacco"],
                        ["pregnancy", "Pregnancy"],
                        ["immunocompromised", "Immunocompromised"],
                        ["hiv", "HIV+"],
                      ] as [keyof RiskFactors, string][]
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "#374151",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={activeRecord.riskFactors?.[key] ?? false}
                          onChange={(e) => updateRiskFactor(key, e.target.checked)}
                          style={{ accentColor: "#6366f1" }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Matched RAG Guidelines */}
        {matchedGuidelines.length > 0 && (
          <div
            className="rag-guidelines-box"
            style={{
              marginTop: "12px",
              padding: "10px",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.15)",
              borderRadius: "8px",
            }}
          >
            <h4
              style={{
                fontWeight: "600",
                fontSize: "0.8rem",
                color: "#2563eb",
                marginBottom: "6px",
              }}
            >
              💡 Matched Guidelines:
            </h4>
            {matchedGuidelines.map((entry) => (
              <div key={entry.id} style={{ marginBottom: "6px", fontSize: "0.75rem" }}>
                <strong style={{ textTransform: "capitalize" }}>
                  {entry.category} (Urgency: {entry.urgency}):
                </strong>
                <p style={{ margin: "2px 0 3px 0", opacity: 0.9 }}>{entry.guidance}</p>
                <div style={{ fontSize: "0.7rem", opacity: 0.75 }}>
                  Precautions: {entry.precautions.join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Row */}
      {canSave && (
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div className="action-row" style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={onAskAI}
              disabled={isProcessing}
              className="ask-ai-btn"
              style={{ flex: 1 }}
            >
              Ask AI
            </button>
            <button
              onClick={onSave}
              disabled={isProcessing}
              className="save-btn"
              style={{ flex: 1 }}
            >
              Save
            </button>
          </div>
          <button
            onClick={onReset}
            disabled={isProcessing}
            style={{
              padding: "6px",
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Clear Consultation
          </button>
        </div>
      )}
    </div>
  );
}

interface SummaryFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function SummaryField({ label, value, onChange, disabled = false }: SummaryFieldProps) {
  return (
    <div>
      <p className="memory-field">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        className="field-input"
        disabled={disabled}
      />
    </div>
  );
}
