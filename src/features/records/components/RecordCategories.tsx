import { FileText, Shield, Folder, Activity } from "lucide-react";

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
