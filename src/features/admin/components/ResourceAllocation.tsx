const RESOURCE_STOCK = [
  { item: "Dengue RDT Kits", stock: "6 days", status: "Low Stock", statusColor: "#ef4444" },
  { item: "ORS Packets", stock: "10 days", status: "Adequate", statusColor: "#10b981" },
  { item: "Iron Folic Tablets", stock: "21 days", status: "Adequate", statusColor: "#10b981" },
  { item: "Vaccine Carrier Boxes", stock: "18 days", status: "Adequate", statusColor: "#10b981" },
];

export function ResourceAllocation() {
  return (
    <section className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">📦 Resource Needs & Logistics</h2>
        <span className="ai-tag-badge">🤖 AI</span>
      </div>
      <h4 className="resource-subtitle">Allocation Overview</h4>
      <div className="allocation-layout">
        <div className="allocation-donut">
          <svg viewBox="0 0 100 100" className="alloc-svg">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="18" strokeDasharray="152 87" strokeDashoffset="-15" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray="54 185" strokeDashoffset="-167" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="18" strokeDasharray="33 206" strokeDashoffset="-221" />
            <text x="50" y="47" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="800" className="alloc-text-center">72%</text>
            <text x="50" y="57" textAnchor="middle" fill="#64748b" fontSize="5" className="alloc-text-center">Optimal Allocation</text>
          </svg>
          <div className="alloc-legend">
            <div className="al-item"><span className="al-dot" style={{ background: "#10b981" }} />Optimal (1,234)</div>
            <div className="al-item"><span className="al-dot" style={{ background: "#f59e0b" }} />Under-Allocated (314)</div>
            <div className="al-item"><span className="al-dot" style={{ background: "#ef4444" }} />Over-Allocated (172)</div>
          </div>
        </div>
        <div className="resource-stock-table">
          <div className="rst-header-row">
            <span>Item</span><span>Stock</span><span>Status</span>
          </div>
          {RESOURCE_STOCK.map(r => (
            <div key={r.item} className="rst-row">
              <span className="rst-item">{r.item}</span>
              <span className="rst-stock">{r.stock}</span>
              <span className="rst-status" style={{ color: r.statusColor }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="resource-why-card">
        ⚠️ Adequate stock ensures timely response to outbreaks and routine needs.
        <div className="resource-why-alert">🔴 2 items need attention</div>
      </div>
      <button className="view-plan-btn">View Allocation Plan →</button>
    </section>
  );
}
