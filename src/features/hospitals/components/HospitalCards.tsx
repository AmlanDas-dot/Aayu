import type { NormalizedFacility } from "@/services/maps/placesService";



export function FacilityCard({ f, onClick, isSelected }: { f: NormalizedFacility; onClick?: () => void; isSelected?: boolean }) {
  // Try to find an icon based on the Google Places primaryType
  const typeLower = f.type?.toLowerCase() || "";
  let icon = "🏥";
  if (typeLower.includes("clinic") || typeLower.includes("doctor")) icon = "🩺";
  if (typeLower.includes("pharmacy")) icon = "💊";
  if (typeLower.includes("lab")) icon = "🔬";

  const distClass = f.distance_km <= 1 ? "close" : f.distance_km <= 3 ? "mid" : "far";
  
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`;

  return (
    <div id={`facility-card-${f.id}`} className={`nc-facility-card ${isSelected ? "selected" : ""}`} onClick={onClick}>
      <div className="nc-facility-icon">{icon}</div>
      <div className="nc-facility-info">
        <div className="nc-facility-name">{f.name}</div>
        <div className="nc-facility-meta">
          <span className="nc-facility-type">{f.type.replace(/_/g, ' ')}</span>
          
          {f.rating && (
            <span className="nc-facility-rating" style={{ marginLeft: "8px", color: "#d97706", fontWeight: "bold" }}>
              ⭐ {f.rating} {f.userRatingsTotal ? `(${f.userRatingsTotal})` : ""}
            </span>
          )}

          {f.openNow !== undefined && f.openNow !== null && (
            <span className={`nc-facility-status ${f.openNow ? "open" : "closed"}`} style={{ marginLeft: "8px" }}>
              {f.openNow ? "🟢 Open Now" : "🔴 Closed"}
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
          {f.website && (
            <a
              href={f.website}
              target="_blank"
              rel="noreferrer"
              className="nc-action-link website"
              onClick={(e) => e.stopPropagation()}
            >
              🌐 Website
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="nc-action-link directions"
            onClick={(e) => e.stopPropagation()}
          >
            🗺️ Navigate
          </a>
        </div>
      </div>
      <div className="nc-facility-distance">
        <span className={`nc-distance-value ${distClass}`}>
          {f.distance_km.toFixed(1)}
        </span>
        <span className="nc-distance-unit">km away</span>
      </div>
    </div>
  );
}

interface HospitalCardsProps {
  facilities: NormalizedFacility[];
  radius: number;
  selectedFacility: NormalizedFacility | null;
  onSelectFacility: (f: NormalizedFacility) => void;
  isSearching?: boolean;
}

export function HospitalCards({ facilities, radius, selectedFacility, onSelectFacility, isSearching }: HospitalCardsProps) {
  if (isSearching) {
    return (
      <div className="nc-results-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="nc-facility-skeleton">
            <div className="nc-skel-icon" />
            <div className="nc-skel-body">
              <div className="nc-skel-line title" />
              <div className="nc-skel-line meta" />
              <div className="nc-skel-line address" />
              <div className="nc-skel-line actions" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (facilities.length === 0) return null;

  return (
    <>
      <p className="nc-results-header" style={{ marginBottom: '12px', fontWeight: 600, color: '#334155' }}>
        {facilities.length} facilit{facilities.length !== 1 ? "ies" : "y"} within {radius / 1000} km
      </p>
      <div className="nc-results-grid">
        {facilities.map((f, i) => (
          <FacilityCard
            key={`${f.name}-${i}`}
            f={f}
            onClick={() => onSelectFacility(f)}
            isSelected={selectedFacility?.id === f.id}
          />
        ))}
      </div>
    </>
  );
}
