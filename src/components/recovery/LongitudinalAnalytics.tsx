import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRecoveryTrends } from '../../services/recoveryService';

export const LongitudinalAnalytics: React.FC = () => {
  const { userProfile } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const trends = await getRecoveryTrends(userProfile?.uid || 'demo-user');
        setData(trends);
      } catch (error) {
        console.error("Failed to fetch recovery trends", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [userProfile]);

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="#0ea5e9" /> Recovery Trends
        </h3>
        <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
          <option>7 Days</option>
          <option>30 Days</option>
          <option>90 Days</option>
          <option>6 Months</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', fontSize: '14px', height: '300px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>Loading chart data...</div>
      ) : data.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No data yet. Keep logging your mood to see trends.</div>
      ) : (
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="score" name="Recovery Score" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="mood" name="Mood" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {data.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#64748b' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0ea5e9' }}></div> Recovery Score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#64748b' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div> Mood
          </div>
        </div>
      )}
    </div>
  );
};
