import React from 'react';
import { MapPin } from 'lucide-react';

export const MapPlaceholder: React.FC = () => {
  return (
    <div className="map-placeholder">
      <div className="map-placeholder-content">
        <MapPin size={32} className="text-green" />
        <p>Map View Loading...</p>
        <span className="map-subtext">Google Maps API Integration Pending</span>
      </div>
    </div>
  );
};
