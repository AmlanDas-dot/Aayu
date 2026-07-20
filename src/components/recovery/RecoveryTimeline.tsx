import React from 'react';
import { CheckCircle2, Clock, CalendarDays } from 'lucide-react';

interface RecoveryTimelineProps {
  condition: string;
}

export const RecoveryTimeline: React.FC<RecoveryTimelineProps> = ({ condition }) => {
  const timelines: Record<string, { time: string; text: string; passed: boolean }[]> = {
    'Smoking': [
      { time: '20 minutes', text: 'Heart rate and blood pressure drop.', passed: true },
      { time: '12 hours', text: 'Carbon monoxide levels in blood drop to normal.', passed: true },
      { time: '2 weeks', text: 'Circulation and lung function improve.', passed: false },
      { time: '1 month', text: 'Coughing and shortness of breath decrease.', passed: false },
      { time: '1 year', text: 'Risk of coronary heart disease is half that of a smoker.', passed: false }
    ],
    'Alcohol': [
      { time: '24 hours', text: 'Withdrawal symptoms may peak (tremors, anxiety).', passed: true },
      { time: '1 week', text: 'Sleep patterns improve; hydration normalizes.', passed: true },
      { time: '1 month', text: 'Liver fat reduces by 15%; skin appearance improves.', passed: false },
      { time: '3 months', text: 'Energy levels increase; mood stabilizes.', passed: false }
    ]
  };

  const defaultTimeline = [
    { time: 'Day 1', text: 'Commitment to change.', passed: true },
    { time: 'Week 1', text: 'Initial withdrawal and habit breaking.', passed: false },
    { time: 'Month 1', text: 'New neural pathways forming.', passed: false }
  ];

  const steps = timelines[condition] || defaultTimeline;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarDays size={20} color="#0284c7" /> Expected Timeline
      </h3>
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: '#e2e8f0' }}></div>
        
        {steps.map((step, idx) => (
          <div key={idx} style={{ position: 'relative', marginBottom: '20px' }}>
            <div style={{ 
              position: 'absolute', left: '-20px', top: '2px', 
              width: '16px', height: '16px', borderRadius: '50%',
              background: step.passed ? '#16a34a' : 'white',
              border: step.passed ? 'none' : '2px solid #cbd5e1',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              {step.passed && <CheckCircle2 size={16} color="white" />}
            </div>
            <div style={{ 
              background: step.passed ? '#f0fdf4' : 'white',
              border: step.passed ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
              padding: '12px 16px', borderRadius: '8px',
              opacity: step.passed ? 1 : 0.6
            }}>
              <div style={{ fontWeight: 'bold', color: step.passed ? '#166534' : '#475569', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> {step.time}
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>{step.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
