import React from 'react';
import { MedicalRecord } from '../../data/familyMock';
import { FileText, Stethoscope, Syringe, ClipboardList, Activity, Thermometer, Scale, HeartPulse } from 'lucide-react';

interface RecordTimelineProps {
  records: MedicalRecord[];
}

export const RecordTimeline: React.FC<RecordTimelineProps> = ({ records }) => {
  if (records.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No recent medical records.</p>;
  }

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'report': return { icon: <ClipboardList size={24} />, class: 'icon-report' };
      case 'visit': return { icon: <Stethoscope size={24} />, class: 'icon-visit' };
      case 'vaccine': return { icon: <Syringe size={24} />, class: 'icon-vaccine' };
      case 'prescription': return { icon: <FileText size={24} />, class: 'icon-report' };
      case 'vital-bp': return { icon: <Activity size={24} />, class: 'icon-vital' };
      case 'vital-temp': return { icon: <Thermometer size={24} />, class: 'icon-vital' };
      case 'vital-weight': return { icon: <Scale size={24} />, class: 'icon-vital' };
      case 'vital-pulse': return { icon: <HeartPulse size={24} />, class: 'icon-vital' };
      default: return { icon: <FileText size={24} />, class: 'icon-report' };
    }
  };

  const parseDate = (dateStr: string) => {
    if (dateStr.toLowerCase() === 'today' || dateStr.toLowerCase() === 'yesterday') {
      return { day: dateStr, month: '' };
    }
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
      return { day: parts[0], month: parts[1] };
    }
    return { day: dateStr, month: '' };
  };

  return (
    <div className="healthcare-timeline">
      {records.map((record) => {
        const { icon, class: iconClass } = getRecordIcon(record.type);
        const dateObj = parseDate(record.date);
        const isVital = record.type.startsWith('vital-');

        return (
          <div key={record.id} className="timeline-item">
            <div className="timeline-date-block">
              <span className="timeline-date-day">{dateObj.day}</span>
              {dateObj.month && <span className="timeline-date-month">{dateObj.month}</span>}
            </div>
            
            <div className="timeline-content">
              <div className={`timeline-icon-wrap ${iconClass}`}>
                {icon}
              </div>
              
              <div className="timeline-details">
                <div className="timeline-title">{record.title}</div>
                <div className="timeline-meta">
                  {isVital && record.collectedBy && <span>Collected by {record.collectedBy}</span>}
                  {!isVital && (
                    <>
                      {record.hospital && <span>{record.hospital}</span>}
                      {record.hospital && record.doctor && <span> • </span>}
                      {record.doctor && <span>{record.doctor}</span>}
                    </>
                  )}
                </div>
                {record.notes && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {record.notes}
                  </div>
                )}
              </div>
              
              {isVital && record.value && (
                <div className="timeline-value-badge">
                  {record.value}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
