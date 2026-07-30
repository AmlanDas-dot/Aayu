import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Circle, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRecoveryMissions, toggleMissionStatus, RecoveryMission } from '../../services/recoveryService';

export const DailyMissions: React.FC = () => {
  const { currentUser } = useAuth();
  const [missions, setMissions] = useState<RecoveryMission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      if (!currentUser) return;
      try {
        const data = await getRecoveryMissions(currentUser.uid);
        setMissions(data);
      } catch (error) {
        console.error("Failed to fetch missions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, [currentUser]);

  const toggleMission = async (id: string, currentStatus: boolean) => {
    if (!currentUser) return;
    setMissions(missions.map(m => m.id === id ? { ...m, completed: !currentStatus } : m));
    try {
      await toggleMissionStatus(currentUser.uid, id, currentStatus);
    } catch (e: any) {
      console.error(e);
      // Revert if fail
      setMissions(missions.map(m => m.id === id ? { ...m, completed: currentStatus } : m));
    }
  };

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} color="#8b5cf6" /> Daily Missions
        </h3>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: completedCount === missions.length && missions.length > 0 ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {completedCount === missions.length && missions.length > 0 && <Trophy size={16} color="#eab308" />}
          {completedCount}/{missions.length} Completed
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', fontSize: '14px' }}>Loading missions...</div>
      ) : missions.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>No missions assigned for today.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {missions.map(mission => (
            <div 
              key={mission.id} 
              onClick={() => toggleMission(mission.id, mission.completed)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                background: mission.completed ? '#f0fdf4' : '#f8fafc',
                border: mission.completed ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
              }}
            >
              <div style={{ color: mission.completed ? '#16a34a' : '#cbd5e1' }}>
                {mission.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
              </div>
              <div style={{ flex: 1, textDecoration: mission.completed ? 'line-through' : 'none', color: mission.completed ? '#64748b' : '#1e293b', fontWeight: '500' }}>
                {mission.text}
              </div>
              <div style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '20px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}>
                {mission.category}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
