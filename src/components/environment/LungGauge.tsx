import React from 'react';

interface LungGaugeProps {
  percentage: number;
  status: string;
}

export const LungGauge: React.FC<LungGaugeProps> = ({ percentage, status }) => {
  // Calculate rotation for the gauge needle based on percentage
  // 0% = -90deg, 100% = 90deg
  const gaugeRotation = (percentage / 100) * 180 - 90;

  return (
    <div className="lung-gauge-container">
      <div className="gauge-circle">
        <div className="gauge-fill" style={{ '--fill': `${percentage}%` } as React.CSSProperties}></div>
        <div className="gauge-needle" style={{ transform: `rotate(${gaugeRotation}deg)` }}></div>
        <div className="gauge-center">
          <div className="gauge-value">{percentage}%</div>
          <div className="gauge-status">{status}</div>
        </div>
      </div>
    </div>
  );
};
