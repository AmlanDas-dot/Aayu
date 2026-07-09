import React from 'react';
import { EnvironmentData } from '../../services/environmentMock';
import { Wind, Thermometer, Sun, Clock } from 'lucide-react';

interface OverviewCardsProps {
  data: EnvironmentData;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ data }) => {
  return (
    <section className="env-overview-grid">
      <div className="env-overview-card">
        <div className="env-card-icon-wrap bg-teal-light">
          <Wind size={24} className="text-teal" />
        </div>
        <div className="env-card-content">
          <div className="env-card-label">Air Quality</div>
          <div className="env-card-value">AQI {data.airQuality.aqi}</div>
          <div className={`env-card-status status-${data.airQuality.status.toLowerCase()}`}>
            {data.airQuality.status}
          </div>
        </div>
      </div>

      <div className="env-overview-card">
        <div className="env-card-icon-wrap bg-orange-light">
          <Thermometer size={24} className="text-orange" />
        </div>
        <div className="env-card-content">
          <div className="env-card-label">Heat Risk</div>
          <div className="env-card-value">{data.heat.riskBadge}</div>
          <div className="env-card-status">
            Feels Like {data.heat.feelsLike}°C
          </div>
        </div>
      </div>

      <div className="env-overview-card">
        <div className="env-card-icon-wrap bg-yellow-light">
          <Sun size={24} className="text-yellow" />
        </div>
        <div className="env-card-content">
          <div className="env-card-label">UV Index</div>
          <div className="env-card-value">{data.uv.status}</div>
          <div className="env-card-status">
            Index {data.uv.index}
          </div>
        </div>
      </div>

      <div className="env-overview-card">
        <div className="env-card-icon-wrap bg-blue-light">
          <Clock size={24} className="text-blue" />
        </div>
        <div className="env-card-content">
          <div className="env-card-label">Outdoor Recommendation</div>
          <div className="env-card-value">Best Time</div>
          <div className="env-card-status highlight-blue">
            {data.outdoorRecommendation.bestTime}
          </div>
        </div>
      </div>
    </section>
  );
};
