import React from "react";
import { FileText, Search } from "lucide-react";

const RECENT_RECORDS = [
  { id: 1, name: "Blood Test Report", date: "15 May 2026", category: "Lab Reports", size: "1.2 MB", by: "Dr. Sharma" },
  { id: 2, name: "Viral Fever Prescription", date: "02 May 2026", category: "Prescriptions", size: "500 KB", by: "Dr. Verma" },
  { id: 3, name: "COVID-19 Booster", date: "10 Jan 2026", category: "Vaccination", size: "800 KB", by: "City Hospital" },
];

export const RecordCards = React.memo(function RecordCards({ search, setSearch }: any) {
  return (
    <section className="recent-records-section">
      <div className="section-row">
        <div>
          <h2 className="section-heading">Recent Records</h2>
          <p className="section-sub">Your latest uploaded documents</p>
        </div>
        <div className="records-search-wrapper">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} className="records-search-input" />
        </div>
      </div>

      <div className="records-list">
        {RECENT_RECORDS.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase())).length > 0 ? (
          RECENT_RECORDS.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase())).map(record => (
            <div key={record.id} className="record-item-card">
              <div className="record-icon-wrap">
                <FileText size={24} />
              </div>
              <div className="record-details">
                <div className="record-name">{record.name}</div>
                <div className="record-meta">
                  <span>{record.date}</span> • <span>{record.size}</span> • <span>{record.by}</span>
                </div>
              </div>
              <button className="record-action-btn">View</button>
            </div>
          ))
        ) : (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📄</div>
            <p>Your health records will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
});
