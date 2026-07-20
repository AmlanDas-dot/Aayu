import React from 'react';
import { AirQualityData, TimelineSlot, GreenLocation } from '../../services/environmentMock';
import { Wind, Info } from 'lucide-react';
import { LungGauge } from './LungGauge';
import { Timeline } from './Timeline';
import { GreenRadius } from './GreenRadius';

interface AirSmartCardProps {
  airQuality: AirQualityData;
  timeline: TimelineSlot[];
  greenAreas: GreenLocation[];
  userLat?: number;
  userLon?: number;
}

export const AirSmartCard: React.FC<AirSmartCardProps> = ({ airQuality, timeline, greenAreas, userLat, userLon }) => {
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
          <LungGauge percentage={airQuality.lungLoadPercentage} status={airQuality.status} />
          <div className="env-insight-box">
            <Info size={18} className="insight-icon" />
            <p>{airQuality.insight}</p>
          </div>
        </div>

        {/* Section 2: Best Clean Air Time */}
        <div className="env-section">
          <h3 className="env-section-title">Best Clean Air Time</h3>
          <Timeline timeline={timeline} />
        </div>

        {/* Section 3: Green Radius */}
        <div className="env-section">
          <h3 className="env-section-title">Green Radius</h3>
          <GreenRadius greenAreas={greenAreas} userLat={userLat} userLon={userLon} />
        </div>
      </div>
    </div>
  );
};
