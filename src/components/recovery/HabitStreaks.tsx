import React, { useState, useEffect } from 'react';
import { Flame, Droplets, Moon, Brain, PenTool } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRecoveryHabits, RecoveryHabit } from '../../services/recoveryService';

const iconMap: Record<string, React.ReactNode> = {
  Flame: <Flame size={20} color="#ef4444" />,
  Droplets: <Droplets size={20} color="#0ea5e9" />,
  Brain: <Brain size={20} color="#8b5cf6" />,
  PenTool: <PenTool size={20} color="#10b981" />,
  Moon: <Moon size={20} color="#6366f1" />
};

export const HabitStreaks: React.FC = () => {
  const { currentUser } = useAuth();
  const [streaks, setStreaks] = useState<RecoveryHabit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHabits = async () => {
      if (!currentUser) return;
      try {
        const data = await getRecoveryHabits(currentUser.uid);
        setStreaks(data);
      } catch (error) {
        console.error("Failed to fetch habits", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, [currentUser]);

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Flame size={20} color="#f97316" /> Habit Streaks
      </h3>
      
      {loading ? (
        <div style={{ color: '#64748b', fontSize: '14px' }}>Loading habits...</div>
      ) : streaks.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>No habits tracked yet. Start completing daily missions!</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {streaks.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {iconMap[s.icon] || <Flame size={20} color="#ef4444" />}
                </div>
                <span style={{ fontWeight: '500', color: '#1e293b' }}>{s.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{s.days}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>days</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
