import React from 'react';
import { BookOpen, PlayCircle, Clock } from 'lucide-react';

export const EducationLibrary: React.FC = () => {
  const library = [
    { title: 'Understanding Triggers', type: 'Video', duration: '5 min', thumb: '#fecaca', icon: <PlayCircle size={16} color="#ef4444" /> },
    { title: 'Coping with Anxiety', type: 'Article', duration: '3 min read', thumb: '#bfdbfe', icon: <BookOpen size={16} color="#3b82f6" /> },
    { title: 'The Neuroscience of Addiction', type: 'Video', duration: '12 min', thumb: '#e9d5ff', icon: <PlayCircle size={16} color="#a855f7" /> },
    { title: 'Mindfulness for Cravings', type: 'Audio', duration: '10 min', thumb: '#bbf7d0', icon: <PlayCircle size={16} color="#22c55e" /> }
  ];

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={20} color="#0284c7" /> Recovery Education
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {library.map((item, idx) => (
          <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ height: '100px', background: item.thumb, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlayCircle size={32} color="rgba(0,0,0,0.2)" />
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: '#1e293b' }}>{item.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{item.icon} {item.type}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {item.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
