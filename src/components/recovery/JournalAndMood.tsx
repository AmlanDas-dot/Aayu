import React, { useState } from 'react';
import { PenTool, Smile, Meh, Frown, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logJournalAndMood } from '../../services/recoveryService';

interface JournalAndMoodProps {
  onJournalLogged?: () => void;
}

export const JournalAndMood: React.FC<JournalAndMoodProps> = ({ onJournalLogged }) => {
  const { userProfile } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<{ sentiment: string, ai_insight: string, risk_level: string } | null>(null);

  const handleSubmit = async () => {
    if (!journal.trim() || mood === null) return;
    setLoading(true);
    
    try {
      const response = await logJournalAndMood(userProfile?.uid || 'demo-user', mood, journal);
      setInsight(response);
      setJournal('');
      if (onJournalLogged) {
        onJournalLogged();
      }
    } catch (e) {
      console.error(e);
      setInsight({ sentiment: 'neutral', ai_insight: 'Thank you for sharing your thoughts today. Keep going, you are doing great.', risk_level: 'Low' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          How are you feeling today?
        </h3>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          {[
            { score: 100, icon: <Smile size={32} />, color: '#16a34a', label: 'Great' },
            { score: 50, icon: <Meh size={32} />, color: '#eab308', label: 'Okay' },
            { score: 20, icon: <Frown size={32} />, color: '#dc2626', label: 'Struggling' }
          ].map((m) => (
            <button key={m.score} onClick={() => setMood(m.score)} style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: '16px', borderRadius: '12px', border: mood === m.score ? `2px solid ${m.color}` : '1px solid #e2e8f0',
              background: mood === m.score ? `${m.color}11` : 'white', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <div style={{ color: mood === m.score ? m.color : '#94a3b8' }}>{m.icon}</div>
              <span style={{ fontWeight: '500', color: mood === m.score ? m.color : '#64748b' }}>{m.label}</span>
            </button>
          ))}
        </div>

        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PenTool size={20} /> Daily Journal
        </h3>
        <textarea 
          rows={4} 
          placeholder="What's on your mind? What were your triggers today?"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '16px', resize: 'none', fontFamily: 'inherit' }}
        />
        
        <button 
          onClick={handleSubmit}
          disabled={loading || !journal.trim() || mood === null}
          style={{ width: '100%', padding: '14px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: (loading || !journal.trim() || mood === null) ? 'not-allowed' : 'pointer', opacity: (loading || !journal.trim() || mood === null) ? 0.6 : 1 }}
        >
          {loading ? 'Analyzing with AI...' : 'Log & Analyze'}
        </button>
      </div>

      {insight && (
        <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', padding: '20px', borderRadius: '16px', border: '1px solid #bae6fd', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: '#0284c7', padding: '12px', borderRadius: '50%', color: 'white' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#0369a1', fontSize: '16px' }}>AI Insights & Encouragement</h4>
            <p style={{ margin: 0, color: '#0c4a6e', lineHeight: '1.5' }}>{insight.ai_insight}</p>
          </div>
        </div>
      )}
    </div>
  );
};
