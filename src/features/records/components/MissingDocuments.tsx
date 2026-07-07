export function MissingDocuments() {
  return (
    <div className="rail-card">
      <div className="rail-title">Missing Documents</div>
      <p className="rail-sub" style={{ fontSize: "0.85rem", color: "#64748b" }}>You haven't uploaded an ID proof yet. Some schemes require this.</p>
      <button className="rail-link" style={{ marginTop: "8px" }}>Upload ID Proof →</button>
    </div>
  );
}
