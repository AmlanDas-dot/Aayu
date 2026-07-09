import { type HospitalFacility } from "@/services/api";

const TYPE_ICONS: Record<string, string> = {
  Hospital: "🏥",
  Clinic: "🏪",
  "Primary Health Centre": "🏛️",
  Doctor: "👨‍⚕️",
  Pharmacy: "💊",
};

export function FacilityCard({ f, onClick, isSelected }: { f: HospitalFacility; onClick?: () => void; isSelected?: boolean }) {
  const icon = TYPE_ICONS[f.type] ?? "🏥";
  const distClass = f.distance_km <= 1 ? "close" : f.distance_km <= 3 ? "mid" : "far";
  
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`;

  return (
    <div className={`nc-facility-card ${isSelected ? "selected" : ""}`} onClick={onClick}>
      <div className="nc-facility-icon">{icon}</div>
      <div className="nc-facility-info">
        <div className="nc-facility-name">{f.name}</div>
        <div className="nc-facility-meta">
          <span className="nc-facility-type">{f.type}</span>
          {f.open_now !== undefined && f.open_now !== null && (
            <span className={`nc-facility-status ${f.open_now ? "open" : "closed"}`}>
              {f.open_now ? "🟢 Open Now" : "🔴 Closed"}
            </span>
          )}
        </div>
        {f.address && (
          <div className="nc-facility-address">📍 {f.address}</div>
        )}
        <div className="nc-facility-actions">
          {f.phone && (
            <a
              href={`tel:${f.phone}`}
              className="nc-action-link phone"
              onClick={(e) => e.stopPropagation()}
            >
              📞 {f.phone}
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="nc-action-link directions"
            onClick={(e) => e.stopPropagation()}
          >
            🗺️ Directions
          </a>
        </div>
      </div>
      <div className="nc-facility-distance">
        <span className={`nc-distance-value ${distClass}`}>
          {f.distance_km}
        </span>
        <span className="nc-distance-unit">km away</span>
      </div>
    </div>
  );
}

interface HospitalCardsProps {
  facilities: HospitalFacility[];
  radius: number;
  selectedFacility: HospitalFacility | null;
  onSelectFacility: (f: HospitalFacility) => void;
}

export function HospitalCards({ facilities, radius, selectedFacility, onSelectFacility }: HospitalCardsProps) {
  if (facilities.length === 0) return null;

  return (
    <>
      <p className="nc-results-header">
        {facilities.length} facilit{facilities.length !== 1 ? "ies" : "y"} within {radius / 1000} km
      </p>
      <div className="nc-results-grid">
        {facilities.map((f, i) => (
          <FacilityCard
            key={`${f.name}-${i}`}
            f={f}
            onClick={() => onSelectFacility(f)}
            isSelected={selectedFacility?.name === f.name}
          />
        ))}
      </div>
    </>
  );
}
