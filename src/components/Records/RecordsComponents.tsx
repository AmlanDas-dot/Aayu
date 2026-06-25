import { FileText, Share2, Shield, Folder, Activity, Search, UploadCloud } from "lucide-react";
import heroFamilyImg from "../../assets/hero-family.png";

export function HealthVaultHeader() {
  return (
    <section className="records-hero">
      <div className="records-hero-text">
        <h1 className="records-hero-title">My Health Records</h1>
        <p className="records-hero-sub">
          Securely store, manage and access all your health records in one place.
        </p>
        <UploadButtons />
      </div>
      <div className="records-hero-img">
         <img src={heroFamilyImg} alt="Family Health" className="records-family-img" />
      </div>
    </section>
  );
}

export function UploadButtons() {
  return (
    <button className="upload-record-btn">
      <UploadCloud size={20} /> Upload New Record
    </button>
  );
}

const CATEGORIES = [
  { id: "all", name: "All Records", icon: Folder, count: 12 },
  { id: "prescriptions", name: "Prescriptions", icon: FileText, count: 5 },
  { id: "lab-reports", name: "Lab Reports", icon: Activity, count: 4 },
  { id: "vaccines", name: "Vaccination", icon: Shield, count: 3 },
];

export function RecordCategories({ activeTab, setActiveTab }: any) {
  return (
    <section className="records-categories">
      <div className="section-row">
        <div>
          <h2 className="section-heading">Categories</h2>
          <p className="section-sub">Filter your records by type</p>
        </div>
      </div>
      <div className="records-cat-grid">
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          return (
            <button 
              key={c.id} 
              className={`cat-card ${activeTab === c.id ? "cat-card-active" : ""}`}
              onClick={() => setActiveTab(c.id)}
            >
              <Icon size={24} className="cat-icon" />
              <div className="cat-name">{c.name}</div>
              <div className="cat-count">{c.count} files</div>
            </button>
          )
        })}
      </div>
    </section>
  );
}

const RECENT_RECORDS = [
  { id: 1, name: "Blood Test Report", date: "15 May 2026", category: "Lab Reports", size: "1.2 MB", by: "Dr. Sharma" },
  { id: 2, name: "Viral Fever Prescription", date: "02 May 2026", category: "Prescriptions", size: "500 KB", by: "Dr. Verma" },
  { id: 3, name: "COVID-19 Booster", date: "10 Jan 2026", category: "Vaccination", size: "800 KB", by: "City Hospital" },
];

export function RecordCards({ search, setSearch }: any) {
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
        {RECENT_RECORDS.map(record => (
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
        ))}
      </div>
    </section>
  );
}

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

export function ShareSection() {
  return (
    <div className="rail-help-card">
      <div className="rhc-inner">
          <div className="rhc-content">
            <div className="rhc-title">Share with Doctor</div>
            <p className="rhc-desc">Securely share your records with your doctor using a unique code or QR.</p>
            <button className="rhc-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={16} /> Share Now
            </button>
          </div>
      </div>
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="rail-card rail-teal-card">
      <h3 className="rail-teal-title">Family Records</h3>
      <p className="rail-teal-sub">Manage health profiles for all your family members.</p>
      <button className="rail-teal-btn">View Family Profiles</button>
    </div>
  );
}

export function MissingDocuments() {
  return (
    <div className="rail-card">
      <div className="rail-title">Missing Documents</div>
      <p className="rail-sub" style={{ fontSize: "0.85rem", color: "#64748b" }}>You haven't uploaded an ID proof yet. Some schemes require this.</p>
      <button className="rail-link" style={{ marginTop: "8px" }}>Upload ID Proof →</button>
    </div>
  );
}

export function RecordsFooterBanner() {
  return (
    <footer className="home-footer" style={{ marginTop: "40px" }}>
      <div className="footer-center">
        <p className="footer-tagline">Your Health Vault is End-to-End Encrypted</p>
        <p className="footer-sub">Only you and your chosen doctors can see these records.</p>
      </div>
    </footer>
  );
}
