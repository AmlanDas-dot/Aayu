import React, { useState } from 'react';
import { AirQualityData, TimelineSlot, GreenLocation } from '../../services/environmentMock';
import { Wind, MapPin, Navigation, Info } from 'lucide-react';

interface AirSmartCardProps {
  airQuality: AirQualityData;
  timeline: TimelineSlot[];
  greenAreas: GreenLocation[];
}

export const AirSmartCard: React.FC<AirSmartCardProps> = ({ airQuality, timeline, greenAreas }) => {
  const [selectedSlot, setSelectedSlot] = useState<TimelineSlot | null>(null);

  // Calculate rotation for the gauge needle based on lungLoadPercentage
  // 0% = -90deg, 100% = 90deg
  const gaugeRotation = (airQuality.lungLoadPercentage / 100) * 180 - 90;

  return (
    <div className="env-module-card">
      <div className="env-module-header">
        <div className="env-module-title-wrap">
          <Wind size={28} className="text-teal" />
          <h2 className="env-module-title">AirSmart</h2>
        </div>
        <div className="env-module-badge">Flagship Feature</div>
      </div>

      <div className="env-module-grid">
        {/* Section 1: Lung Load Gauge */}
        <div className="env-section">
          <h3 className="env-section-title">Today's Lung Load</h3>
          <div className="lung-gauge-container">
            <div className="gauge-circle">
              <div className="gauge-fill" style={{ '--fill': `${airQuality.lungLoadPercentage}%` } as React.CSSProperties}></div>
              <div className="gauge-needle" style={{ transform: `rotate(${gaugeRotation}deg)` }}></div>
              <div className="gauge-center">
                <div className="gauge-value">{airQuality.lungLoadPercentage}%</div>
                <div className="gauge-status">{airQuality.status}</div>
              </div>
            </div>
          </div>
          <div className="env-insight-box">
            <Info size={18} className="insight-icon" />
            <p>{airQuality.insight}</p>
          </div>
        </div>

        {/* Section 2: Best Clean Air Time */}
        <div className="env-section">
          <h3 className="env-section-title">Best Clean Air Time</h3>
          <div className="env-timeline">
            {timeline.map((slot, idx) => (
              <div
                key={idx}
                className={`timeline-slot slot-${slot.status.toLowerCase()} ${selectedSlot?.time === slot.time ? 'active' : ''}`}
                onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
              >
                <div className="slot-bar"></div>
                <div className="slot-time">{slot.time}</div>
              </div>
            ))}
          </div>
          
          {selectedSlot && (
            <div className="recommendation-drawer slide-down">
              <h4 className="drawer-title">{selectedSlot.time}</h4>
              <p className="drawer-desc">{selectedSlot.recommendation}</p>
            </div>
          )}
        </div>

        {/* Section 3: Green Radius */}
        <div className="env-section">
          <h3 className="env-section-title">Green Radius</h3>
          <div className="map-placeholder">
            <div className="map-placeholder-content">
              <MapPin size={32} className="text-green" />
              <p>Map View Loading...</p>
              <span className="map-subtext">Google Maps API Integration Pending</span>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
};
