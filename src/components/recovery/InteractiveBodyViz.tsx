import React, { useState } from 'react';
import { Activity, Heart, Brain, Wind } from 'lucide-react';

interface InteractiveBodyVizProps {
  condition: string;
}

export const InteractiveBodyViz: React.FC<InteractiveBodyVizProps> = ({ condition }) => {
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);

  // Define condition impacts
  const impacts: Record<string, { organ: string; text: string; timeline: string; treatment?: string }[]> = {
    'Smoking': [
      { organ: 'lungs', text: 'Impaired capacity, high risk of COPD/cancer.', timeline: '1-9 months: Coughing and shortness of breath decrease.', treatment: 'Nicotine replacement, CBT, Spirometry.' },
      { organ: 'heart', text: 'Increased heart rate, elevated blood pressure.', timeline: '1 year: Risk of coronary heart disease halves.', treatment: 'Cardio exercise, low-sodium diet, beta-blockers if prescribed.' },
    ],
    'Alcohol': [
      { organ: 'liver', text: 'Risk of fatty liver, hepatitis, and cirrhosis.', timeline: '1 month: Liver fat reduces by 15-20%.', treatment: 'Abstinence, liver function tests, hydration.' },
      { organ: 'brain', text: 'Memory impairment, disrupted neurotransmitters.', timeline: '2 weeks: Cognitive function and sleep patterns improve.', treatment: 'Thiamine supplements, cognitive behavioral therapy.' }
    ],
    'Gaming': [
      { organ: 'brain', text: 'Dopamine receptor downregulation.', timeline: '3 weeks: Dopamine baseline begins to reset.', treatment: 'Digital detox, dopamine fasting, outdoor activities.' },
      { organ: 'eyes', text: 'Digital eye strain, dry eyes.', timeline: '1 week: Eye strain significantly reduces.', treatment: '20-20-20 rule, artificial tears, blue-light glasses.' }
    ]
  };

  const currentImpacts = impacts[condition] || [];

  const getOrganColor = (organ: string) => {
    if (hoveredOrgan === organ) return '#3b82f6'; // Blue highlight on hover
    if (currentImpacts.find(i => i.organ === organ)) return '#ef4444'; // Red if affected
    return '#e2e8f0'; // Default gray
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <div style={{ position: 'relative', width: '200px', height: '350px' }}>
        {/* Placeholder for actual SVG body map. Since SVG is long, using simplified shapes for demo. */}
        <svg viewBox="0 0 100 200" style={{ width: '100%', height: '100%' }}>
          {/* Head / Brain */}
          <circle cx="50" cy="20" r="15" fill="#cbd5e1" />
          <circle cx="50" cy="20" r="10" fill={getOrganColor('brain')} style={{ cursor: 'pointer', transition: 'fill 0.3s' }} 
            onMouseEnter={() => setHoveredOrgan('brain')} onMouseLeave={() => setHoveredOrgan(null)} />
          
          {/* Torso */}
          <rect x="35" y="40" width="30" height="70" rx="10" fill="#cbd5e1" />
          
          {/* Lungs */}
          <path d="M40 50 Q 30 60 40 70 Z" fill={getOrganColor('lungs')} style={{ cursor: 'pointer', transition: 'fill 0.3s' }} 
            onMouseEnter={() => setHoveredOrgan('lungs')} onMouseLeave={() => setHoveredOrgan(null)} />
          <path d="M60 50 Q 70 60 60 70 Z" fill={getOrganColor('lungs')} style={{ cursor: 'pointer', transition: 'fill 0.3s' }} 
            onMouseEnter={() => setHoveredOrgan('lungs')} onMouseLeave={() => setHoveredOrgan(null)} />
            
          {/* Heart */}
          <circle cx="55" cy="65" r="5" fill={getOrganColor('heart')} style={{ cursor: 'pointer', transition: 'fill 0.3s' }} 
            onMouseEnter={() => setHoveredOrgan('heart')} onMouseLeave={() => setHoveredOrgan(null)} />
            
          {/* Liver */}
          <path d="M45 80 Q 60 75 65 85 Q 55 95 45 85 Z" fill={getOrganColor('liver')} style={{ cursor: 'pointer', transition: 'fill 0.3s' }} 
            onMouseEnter={() => setHoveredOrgan('liver')} onMouseLeave={() => setHoveredOrgan(null)} />

          {/* Arms & Legs simplified */}
          <line x1="35" y1="45" x2="15" y2="90" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
          <line x1="65" y1="45" x2="85" y2="90" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
          <line x1="40" y1="110" x2="40" y2="180" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
          <line x1="60" y1="110" x2="60" y2="180" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0, color: '#0f172a' }}>Organ Impacts ({condition})</h3>
        {currentImpacts.map((impact, idx) => (
          <div key={idx} style={{ 
            padding: '16px', borderRadius: '12px', 
            background: hoveredOrgan === impact.organ ? '#eff6ff' : '#f8fafc',
            border: hoveredOrgan === impact.organ ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
            transition: 'all 0.3s'
          }}
          onMouseEnter={() => setHoveredOrgan(impact.organ)} onMouseLeave={() => setHoveredOrgan(null)}>
            <div style={{ fontWeight: 'bold', color: '#1e293b', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {impact.organ === 'lungs' ? <Wind size={16}/> : impact.organ === 'heart' ? <Heart size={16}/> : impact.organ === 'brain' ? <Brain size={16}/> : <Activity size={16}/>}
              {impact.organ}
            </div>
            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>{impact.text}</p>
            <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', marginRight: '4px' }}>
              Recovery: {impact.timeline}
            </div>
            {(hoveredOrgan === impact.organ || hoveredOrgan === null) && impact.treatment && (
              <div style={{ fontSize: '12px', color: '#9333ea', fontWeight: '500', background: '#f3e8ff', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                Treatment: {impact.treatment}
              </div>
            )}
          </div>
        ))}
        {currentImpacts.length === 0 && (
          <p style={{ color: '#64748b' }}>Select a condition to see physiological impacts.</p>
        )}
      </div>
    </div>
  );
};
