interface DisclaimerBannerProps {
  className?: string;
}

export function DisclaimerBanner({ className = "" }: DisclaimerBannerProps) {
  return (
    <div
      className={`disclaimer-banner ${className}`}
      role="note"
      aria-label="Health information disclaimer"
      style={{
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(99, 102, 241, 0.06))",
        border: "1px solid rgba(99, 102, 241, 0.18)",
        borderLeft: "3px solid #6366f1",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "0.78rem",
        color: "#4b5563",
        lineHeight: "1.5",
        marginBottom: "12px",
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>ℹ️</span>
      <span>
        <strong style={{ color: "#4338ca", fontWeight: 600 }}>For educational purposes only.</strong>{" "}
        Aayu provides health information and general guidance. It is not a substitute for professional
        medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for
        medical decisions.
      </span>
    </div>
  );
}
