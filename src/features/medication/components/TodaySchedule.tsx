import { DailySchedule } from '@/services/reminderService';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TodayScheduleProps {
  schedule: DailySchedule[];
  onTakeDose: (medicationId: string, scheduledTime: string) => void;
}

export function TodaySchedule({ schedule, onTakeDose }: TodayScheduleProps) {
  if (schedule.length === 0) {
    return (
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
        <p style={{ color: '#64748b', margin: 0 }}>No medications scheduled for today.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TAKEN': return <CheckCircle2 size={20} color="#22c55e" />;
      case 'MISSED': return <AlertCircle size={20} color="#ef4444" />;
      default: return <Clock size={20} color="#94a3b8" />;
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Today's Timeline</h3>
      </div>
      
      <div style={{ padding: '20px' }}>
        {schedule.map((item, index) => (
          <div key={`${item.medication.id}-${item.time}-${index}`} style={{ display: 'flex', gap: '20px', marginBottom: index !== schedule.length - 1 ? '24px' : '0' }}>
            {/* Time Column */}
            <div style={{ width: '60px', textAlign: 'right', fontWeight: 600, color: '#475569', paddingTop: '4px' }}>
              {item.time}
            </div>
            
            {/* Divider Line */}
            <div style={{ position: 'relative', width: '2px', background: '#e2e8f0' }}>
              <div style={{ position: 'absolute', top: '4px', left: '-9px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getStatusIcon(item.status)}
              </div>
            </div>
            
            {/* Content Column */}
            <div style={{ flex: 1, background: item.status === 'TAKEN' ? '#f0fdf4' : item.status === 'MISSED' ? '#fef2f2' : '#f8fafc', padding: '16px', borderRadius: '12px', border: `1px solid ${item.status === 'TAKEN' ? '#bbf7d0' : item.status === 'MISSED' ? '#fecaca' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '16px' }}>{item.medication.medicineName}</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                    {item.medication.dosage} {item.medication.strength}
                  </p>
                </div>
                
                {item.status === 'PENDING' || item.status === 'UPCOMING' ? (
                  <button 
                    onClick={() => onTakeDose(item.medication.id!, item.time)}
                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark Taken
                  </button>
                ) : (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: item.status === 'TAKEN' ? '#16a34a' : '#dc2626' }}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
