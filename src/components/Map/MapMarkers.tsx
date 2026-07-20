import { useState, memo } from 'react';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';

export type MarkerType = 'DHH' | 'CHC' | 'PHC' | 'ASHA' | 'Ambulance' | 'Water' | 'School';

export interface MapMarkerData {
  id: string;
  type: MarkerType;
  position: google.maps.LatLngLiteral;
  name: string;
  details: string;
  status: 'Operational' | 'Warning' | 'Critical' | 'Offline';
}

export const mockMarkers: MapMarkerData[] = [
  { id: 'm1', type: 'DHH', position: { lat: 25.62, lng: 85.04 }, name: 'Patna District Hospital', details: 'Beds: 240/300 occupied. ICU full.', status: 'Warning' },
  { id: 'm2', type: 'CHC', position: { lat: 25.59, lng: 85.09 }, name: 'Phulwari CHC', details: 'Beds: 45/50 occupied.', status: 'Operational' },
  { id: 'm3', type: 'PHC', position: { lat: 25.57, lng: 85.06 }, name: 'Khagaul PHC', details: 'Beds: 12/20 occupied.', status: 'Operational' },
  { id: 'm4', type: 'ASHA', position: { lat: 25.585, lng: 85.085 }, name: 'Geeta Devi (ASHA)', details: 'Currently visiting pregnant woman.', status: 'Operational' },
  { id: 'm5', type: 'Ambulance', position: { lat: 25.60, lng: 85.08 }, name: 'Ambulance Unit 4', details: 'En route to Phulwari.', status: 'Operational' },
  { id: 'm6', type: 'Water', position: { lat: 25.64, lng: 84.89 }, name: 'Maner Water Source', details: 'Contamination detected (E. coli).', status: 'Critical' },
  { id: 'm7', type: 'School', position: { lat: 25.56, lng: 84.87 }, name: 'Bihta High School', details: 'Vaccination camp active today.', status: 'Operational' },
];

const getMarkerIconSvg = (type: MarkerType) => {
  switch (type) {
    case 'DHH':
    case 'CHC':
    case 'PHC':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`; // Actually, let's use a standard hospital icon
    case 'ASHA':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    case 'Ambulance':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
    case 'Water':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    case 'School':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
    default:
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Operational': return '#10b981';
    case 'Warning': return '#f59e0b';
    case 'Critical': return '#ef4444';
    default: return '#6b7280';
  }
};

const getHospitalSvg = (status: string) => {
  const color = getStatusColor(status);
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><path d="M10 9h4M12 7v4"/></svg>`;
}

export const MapMarkers = memo(function MapMarkers({ facilities }: { facilities?: MapMarkerData[] }) {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Fallback to mockMarkers if facilities prop is not provided
  const markersToRender = facilities && facilities.length > 0 ? facilities : mockMarkers;

  const getMarkerIcon = (marker: MapMarkerData) => {
    if (marker.type === 'DHH' || marker.type === 'CHC' || marker.type === 'PHC') {
      return (
        <div dangerouslySetInnerHTML={{ __html: getHospitalSvg(marker.status) }} style={{ color: getStatusColor(marker.status) }} />
      );
    }
    return (
      <div dangerouslySetInnerHTML={{ __html: getMarkerIconSvg(marker.type) }} style={{ color: getStatusColor(marker.status) }} />
    );
  };

  return (
    <>
      {markersToRender.map((marker, idx) => (
        <AdvancedMarker
          key={marker.id}
          position={marker.position}
          onClick={() => setSelectedMarkerId(marker.id)}
          className="marker-hover"
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          <div className="marker-drop" style={{
            background: 'white',
            borderRadius: '50%',
            padding: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            border: `2px solid ${getStatusColor(marker.status)}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            animationDelay: `${idx * 0.1}s`
          }}>
            {getMarkerIcon(marker)}
          </div>
          
          {selectedMarkerId === marker.id && (
            <InfoWindow
              position={marker.position}
              onCloseClick={() => setSelectedMarkerId(null)}
              pixelOffset={[0, -25]}
            >
              <div style={{ padding: '12px', minWidth: '180px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>{marker.name}</h4>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    background: getStatusColor(marker.status) + '20', 
                    color: getStatusColor(marker.status),
                    fontWeight: 'bold'
                  }}>{marker.type}</span>
                  • 
                  <span style={{ color: getStatusColor(marker.status), fontWeight: 'bold' }}>{marker.status}</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>{marker.details}</p>
              </div>
            </InfoWindow>
          )}
        </AdvancedMarker>
      ))}
    </>
  );
});
