export function InsightsPanel() {
  return (
    <div className="rail-card">
      <div className="rail-title">Storage Usage</div>
      <p className="rail-sub">Your digital locker</p>
      <div className="storage-bar" style={{ background: "#e2e8f0", height: "8px", borderRadius: "4px", marginTop: "12px" }}>
        <div className="storage-fill" style={{ width: "25%", background: "#0d9488", height: "8px", borderRadius: "4px" }}></div>
      </div>
      <div className="storage-text" style={{ marginTop: "12px", fontWeight: "600" }}>25% Used (1.25 GB of 5 GB)</div>
      <p className="storage-sub" style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "8px" }}>All records are backed up securely to the cloud and encrypted.</p>
    </div>
  );
}
