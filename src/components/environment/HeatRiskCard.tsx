import React from 'react';
import type { HeatData, TimelineSlot } from '../../types/environment';
import { ThermometerSun } from 'lucide-react';
import { Timeline } from './Timeline';
import { RecommendationCard } from './RecommendationCard';

interface HeatRiskCardProps {
  heat: HeatData;
  timeline: TimelineSlot[];
}

export const HeatRiskCard: React.FC<HeatRiskCardProps> = ({ heat, timeline }) => {
  return (
    <div className="env-module-card mt-4">
      <div className="env-module-header">
        <div className="env-module-title-wrap">
          <ThermometerSun size={28} className="text-orange" />
          <h2 className="env-module-title">Heatwave Risk</h2>
        </div>
      </div>

      <div className="env-module-grid">
        {/* Top: Current Conditions */}
        <div className="env-section heat-conditions">
          <h3 className="env-section-title">Current Conditions</h3>
          <div className="conditions-grid">
            <div className="condition-item">
              <span className="condition-label">Temperature</span>
              <span className="condition-value">{heat.temperature}°C</span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Humidity</span>
              <span className="condition-value">{heat.humidity}%</span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Feels Like</span>
              <span className="condition-value">{heat.feelsLike}°C</span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Heat Index</span>
              <span className="condition-value">{heat.heatIndex}</span>
            </div>
          </div>
          
          <div className="heat-risk-meter mt-3">
            <div className="risk-header">
              <span>Risk Level</span>
              <span className={`risk-badge badge-${heat.riskBadge.toLowerCase()}`}>{heat.riskBadge}</span>
            </div>
            <div className="risk-bar-container">
              {/* Simple horizontal indicator */}
              <div className="risk-bar">
                <div className="risk-segment safe"></div>
                <div className="risk-segment caution"></div>
                <div className="risk-segment moderate"></div>
                <div className="risk-segment extreme"></div>
                <div className="risk-segment danger"></div>
                {/* Pointer placed based on risk badge */}
                <div className={`risk-pointer ptr-${heat.riskBadge.toLowerCase()}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Safe Outdoor Window */}
        <div className="env-section">
          <h3 className="env-section-title">Safe Outdoor Window</h3>
          <Timeline timeline={timeline} />
        </div>

        {/* AI Recommendation */}
        <div className="env-section">
          <h3 className="env-section-title">Today's AI Recommendation</h3>
          <RecommendationCard recommendation={heat.recommendation} />
        </div>
      </div>
    </div>
  );
};
