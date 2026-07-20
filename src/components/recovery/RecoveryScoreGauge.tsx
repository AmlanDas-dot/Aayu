import React from 'react';
import { Activity } from 'lucide-react';

interface RecoveryScoreGaugeProps {
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export const RecoveryScoreGauge: React.FC<RecoveryScoreGaugeProps> = ({ score, trend, riskLevel }) => {
  // Determine colors based on score
  let color = '#22c55e'; // Green
  if (score < 40) color = '#ef4444'; // Red
  else if (score < 70) color = '#eab308'; // Yellow

  const strokeWidth = 12;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Recovery Score</h3>
        <span style={{ 
          background: riskLevel === 'Low' ? '#dcfce7' : riskLevel === 'Critical' ? '#fee2e2' : '#fef9c3', 
          color: riskLevel === 'Low' ? '#166534' : riskLevel === 'Critical' ? '#991b1b' : '#854d0e',
          padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' 
        }}>
          {riskLevel} Risk
        </span>
      </div>

      <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="75" cy="75" r={radius}
            stroke="#f1f5f9" strokeWidth={strokeWidth} fill="none"
          />
          <circle
            cx="75" cy="75" r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a' }}>{score}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>/100</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: trend === 'improving' ? '#16a34a' : trend === 'declining' ? '#dc2626' : '#64748b', fontSize: '14px', fontWeight: '500' }}>
        <Activity size={16} />
        {trend === 'improving' ? 'Score is improving' : trend === 'declining' ? 'Score is declining' : 'Score is stable'}
      </div>
    </div>
  );
};
