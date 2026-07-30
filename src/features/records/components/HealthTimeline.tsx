import React from 'react';
import { FileText, Stethoscope } from 'lucide-react';
import { MedicalRecord } from '@/firebase/collections';

interface HealthTimelineProps {
  records: MedicalRecord[];
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({ records }) => {
  const allEvents = [
    ...records.map(r => ({
      type: 'record',
      date: r.recordDate || r.uploadedAt,
      title: `Record: ${r.title}`,
      icon: <FileText size={16} color="#6366f1" />,
      bg: '#e0e7ff',
      details: r.category
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Stethoscope size={20} color="#0284c7" /> Unified Health Journey
      </h3>
      
      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: '#e2e8f0' }}></div>
        
        {allEvents.map((evt, idx) => (
          <div key={idx} style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{ 
              position: 'absolute', left: '-24px', top: '2px', 
              width: '28px', height: '28px', borderRadius: '50%',
              background: evt.bg, border: '2px solid white',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {evt.icon}
            </div>
            <div style={{ paddingLeft: '16px' }}>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{evt.title}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                {new Date(evt.date).toLocaleDateString()} {evt.details && `• ${evt.details}`}
              </div>
            </div>
          </div>
        ))}

        {allEvents.length === 0 && (
          <p style={{ color: '#64748b' }}>No health events recorded yet.</p>
        )}
      </div>
    </div>
  );
};
