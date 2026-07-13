import React from 'react';
import { Navigation } from 'lucide-react';
import { GreenLocation } from '../../services/environmentMock';
import { MapPlaceholder } from './MapPlaceholder';

interface GreenRadiusProps {
  greenAreas: GreenLocation[];
}

export const GreenRadius: React.FC<GreenRadiusProps> = ({ greenAreas }) => {
  return (
    <>
      <MapPlaceholder />
      <div className="green-areas-list">
        <h4>Nearby Green Areas</h4>
        {greenAreas.map((area) => (
          <div key={area.id} className="green-area-item">
            <div className="green-area-info">
              <div className="green-area-name">{area.name}</div>
              <div className="green-area-stats">
                <span className="clean-air-score">Score: {area.cleanAirScore}</span>
                <span className="distance">{area.distanceMeter}m • {area.walkTimeMin} min walk</span>
              </div>
            </div>
            <button className="btn-navigate">
              <Navigation size={16} />
              <span>Navigate</span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
