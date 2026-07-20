import React, { useState } from 'react';
import { Navigation } from 'lucide-react';
import { GreenLocation } from '../../services/environmentMock';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface GreenRadiusProps {
  greenAreas: GreenLocation[];
  userLat?: number;
  userLon?: number;
}

export const GreenRadius: React.FC<GreenRadiusProps> = ({ greenAreas, userLat = 25.5941, userLon = 85.1376 }) => {
  const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID";

  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const handleNavigate = (lat?: number, lon?: number) => {
    if (lat && lon) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${lat},${lon}&travelmode=walking`, '_blank');
    }
  };

  return (
    <>
      <div style={{ width: '100%', height: '250px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
        <APIProvider apiKey={MAPS_API_KEY}>
          <Map 
            defaultCenter={{ lat: userLat, lng: userLon }} 
            defaultZoom={13} 
            mapId={MAP_ID}
            disableDefaultUI={true}
            gestureHandling="greedy"
          >
            {/* User Location Marker */}
            <AdvancedMarker position={{ lat: userLat, lng: userLon }}>
              <Pin background="#3b82f6" borderColor="#1d4ed8" glyphColor="#ffffff" />
            </AdvancedMarker>

            {/* Green Area Markers */}
            {greenAreas.map((area) => (
              area.latitude && area.longitude ? (
                <AdvancedMarker 
                  key={area.id} 
                  position={{ lat: area.latitude, lng: area.longitude }}
                  onClick={() => setActiveMarker(area.id)}
                >
                  <Pin 
                    background={activeMarker === area.id ? "#10b981" : "#059669"} 
                    borderColor="#047857" 
                    glyphColor="#ffffff" 
                  />
                </AdvancedMarker>
              ) : null
            ))}
          </Map>
        </APIProvider>
      </div>

      <div className="green-areas-list">
        <h4>Nearby Green Areas</h4>
        {greenAreas.length === 0 ? (
          <div className="text-gray" style={{ fontSize: '13px' }}>No nearby green areas found within 3km.</div>
        ) : (
          greenAreas.map((area) => (
            <div key={area.id} className="green-area-item" style={{ background: activeMarker === area.id ? '#f0fdf4' : 'transparent' }} onClick={() => setActiveMarker(area.id)}>
              <div className="green-area-info">
                <div className="green-area-name">{area.name}</div>
                <div className="green-area-stats">
                  <span className="clean-air-score">Score: {area.cleanAirScore}</span>
                  <span className="distance">{area.distanceMeter}m • {area.walkTimeMin} min walk</span>
                </div>
              </div>
              <button className="btn-navigate" onClick={(e) => { e.stopPropagation(); handleNavigate(area.latitude, area.longitude); }}>
                <Navigation size={16} />
                <span>Navigate</span>
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
};
