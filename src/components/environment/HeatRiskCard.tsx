import React, { useState } from 'react';
import { HeatData, TimelineSlot } from '../../services/environmentMock';
import { ThermometerSun, Droplets, AlertTriangle } from 'lucide-react';

interface HeatRiskCardProps {
  heat: HeatData;
  timeline: TimelineSlot[];
}

export const HeatRiskCard: React.FC<HeatRiskCardProps> = ({ heat, timeline }) => {
  const [selectedSlot, setSelectedSlot] = useState<TimelineSlot | null>(null);

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

        {/* AI Recommendation */}
        <div className="env-section">
          <h3 className="env-section-title">Today's AI Recommendation</h3>
          <div className="premium-insight-card">
            <div className="insight-header">
              <AlertTriangle size={20} className="text-orange" />
              <span>Personalized Health Alert</span>
            </div>
            <div className="insight-body">
              <p>{heat.recommendation}</p>
            </div>
            <div className="insight-footer">
              <Droplets size={16} />
              <span>Hydration Goal: 3.5L today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
