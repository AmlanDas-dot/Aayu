import { useMemo } from 'react';
import { MedicalRecord, TrendDataPoint } from '@/firebase/collections';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthTrendsProps {
  records: MedicalRecord[];
}

export function HealthTrends({ records }: HealthTrendsProps) {
  // Extract and aggregate importantValues from all records for charts
  const trends = useMemo(() => {
    const data: Record<string, TrendDataPoint[]> = {};
    
    // Sort records oldest to newest for charting
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
    );

    sortedRecords.forEach(record => {
      if (record.importantValues) {
        Object.entries(record.importantValues).forEach(([key, value]) => {
          // Attempt to parse numerical values
          const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
          if (!isNaN(numericValue)) {
            if (!data[key]) data[key] = [];
            data[key].push({
              date: new Date(record.uploadedAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
              value: numericValue,
              unit: value.replace(/[0-9.\s]/g, '') // Extract the unit part
            });
          }
        });
      }
    });
    
    return data;
  }, [records]);

  const keys = Object.keys(trends).filter(k => trends[k].length > 1);

  if (keys.length === 0) return null;

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0', color: '#0f172a' }}>
        <Activity size={20} color="#3b82f6" /> Health Trends
      </h3>
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
        {keys.map(key => {
          const pts = trends[key];
          const latest = pts[pts.length - 1];
          const previous = pts[pts.length - 2];
          const diff = latest.value - previous.value;
          
          let Icon = Minus;
          let color = '#64748b';
          if (diff > 0) {
            Icon = TrendingUp;
            // E.g., for BP or Sugar, up is usually bad (red), for HDL, up is good. Simplification for MVP:
            color = ['Blood Sugar', 'HbA1c', 'BP', 'Weight', 'Cholesterol'].includes(key) ? '#ef4444' : '#10b981';
          } else if (diff < 0) {
            Icon = TrendingDown;
            color = ['Blood Sugar', 'HbA1c', 'BP', 'Weight', 'Cholesterol'].includes(key) ? '#10b981' : '#ef4444';
          }

          return (
            <div key={key} style={{ minWidth: '160px', padding: '15px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{key}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {latest.value} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>{latest.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px', fontWeight: 'bold' }}>
                <Icon size={14} />
                {Math.abs(diff).toFixed(1)} vs prev
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
