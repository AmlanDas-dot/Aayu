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
        {coords && (
          <div className="nc-location-status">
            <i className="fa-solid fa-location-crosshairs"></i>
            Using your location: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
          </div>
        )}

        {error && (
          <div className="nc-error-banner">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && processingStage && (
        <div className="nc-loading-wrap">
          <LoadingStatus icon={processingStage.icon} status={processingStage.text} />
        </div>
      )}

      {/* Empty State (before search) */}
      {!fetched && !loading && (
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
      {!loading && fetched && facilityCount === 0 && (
        <div className="nc-no-results">
          <span className="nc-no-icon">🏥</span>
          <h3>No facilities found</h3>
          <p>Try increasing the search radius or check your internet connection.</p>
        </div>
      )}
    </>
  );
}
