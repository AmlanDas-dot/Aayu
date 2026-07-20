const FACILITY_FILTERS = [
  { id: "all",           label: "All",          icon: "" },
  { id: "hospital",      label: "Hospitals",    icon: "fa-solid fa-hospital" },
  { id: "clinic",        label: "Clinics",      icon: "fa-solid fa-stethoscope" },
  { id: "health_centre", label: "PHCs",         icon: "fa-solid fa-house-medical" },
  { id: "pharmacy",      label: "Pharmacies",   icon: "fa-solid fa-pills" },
  { id: "rehab",         label: "Rehab Centers",icon: "fa-solid fa-brain" },
];

const RADIUS_OPTIONS = [
  { value: 2000,  label: "2 km" },
  { value: 5000,  label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
];

interface HospitalFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  radius: number;
  setRadius: (radius: number) => void;
  loading: boolean;
  fetched: boolean;
  onFind: () => void;
}

export function HospitalFilters({
  filter,
  setFilter,
  radius,
  setRadius,
  loading,
  fetched,
  onFind
}: HospitalFiltersProps) {
  return (
    <div className="nc-tool-controls">
      <div className="nc-filter-pills">
        {FACILITY_FILTERS.map((f) => (
          <button
            key={f.id}
            className={`nc-pill ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.icon && <i className={f.icon}></i>}
            {f.label}
          </button>
        ))}
      </div>

      <div className="nc-action-group">
        <select
          className="nc-radius-select"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <button
          id="hospital-find-btn"
          className="nc-btn-primary"
          onClick={onFind}
          disabled={loading}
        >
          <i className={loading ? "fa-solid fa-spinner fa-spin" : fetched ? "fa-solid fa-rotate" : "fa-solid fa-map-pin"}></i>
          {loading ? "Searching..." : fetched ? "Refresh" : "Find Near Me"}
        </button>
      </div>
    </div>
  );
}
