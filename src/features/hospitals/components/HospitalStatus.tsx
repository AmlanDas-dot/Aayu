import { LoadingStatus } from "@/components/LoadingStatus";

interface HospitalStatusProps {
  loading: boolean;
  fetched: boolean;
  error: string;
  coords: { lat: number; lon: number } | null;
  processingStage: { icon: string; text: string } | null;
  facilityCount: number;
}

export function HospitalStatus({
  loading,
  fetched,
  error,
  coords,
  processingStage,
  facilityCount
}: HospitalStatusProps) {
  return (
    <>
      {/* Status */}
      <div className="nc-status-container">
        {coords && !error && (
          <div className="nc-location-status">
            <i className="fa-solid fa-location-crosshairs"></i>
            Using your location: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
          </div>
        )}
      </div>

      {/* Clean Error State */}
      {error && (
        <div className="nc-error-banner" style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', color: '#991b1b', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>Unable to load nearby healthcare facilities</span>
          </div>
          <p style={{ fontSize: '14px', marginTop: '8px', color: '#7f1d1d' }}>
            {error.includes("Failed to fetch") || error.includes("Network") 
              ? "Please check your internet connection and try again."
              : error}
          </p>
        </div>
      )}

      {/* Initial Fetching (Geolocation + First API call) */}
      {loading && processingStage && !fetched && (
        <div className="nc-loading-wrap">
          <LoadingStatus icon={processingStage.icon} status={processingStage.text} />
        </div>
      )}

      {/* Empty State (before search) */}
      {!fetched && !loading && !error && (
        <div className="nc-empty-state">
          <div className="nc-empty-content">
            <div className="nc-pin-icon">
              <i className="fa-solid fa-map-location-dot"></i>
            </div>
            <h3>Find Healthcare Near You</h3>
            <p>📍 Find nearby hospitals, PHCs and pharmacies using your current location.</p>
            <span className="nc-sub-text">Requires internet connection and location permission.</span>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && fetched && facilityCount === 0 && !error && (
        <div className="nc-no-results">
          <span className="nc-no-icon">🏥</span>
          <h3>No healthcare facilities found nearby.</h3>
          <p>Try increasing the search radius or choosing a different filter.</p>
        </div>
      )}
    </>
  );
}
