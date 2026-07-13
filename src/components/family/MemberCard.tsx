import React from 'react';
import { FamilyMember } from '../../data/familyMock';
import { Clock, Activity, Pill } from 'lucide-react';

interface MemberCardProps {
  member: FamilyMember;
  onClick: (member: FamilyMember) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  // Extract initials for the avatar
  const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2);

  // Status class logic based on the new types
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Healthy': return 'status-Healthy';
      case 'Monitoring': return 'status-Monitoring';
      case 'Chronic Condition': return 'status-Chronic';
      case 'Needs Follow-up': return 'status-Needs';
      default: return '';
    }
  };

  // Conditions logic (Max 2, +X more)
  const displayConditions = member.conditions.filter(c => c !== 'None');
  const visibleConditions = displayConditions.slice(0, 2);
  const hiddenConditionsCount = displayConditions.length - visibleConditions.length;

  // Medications logic
  const activeMeds = member.medications.filter(m => m !== 'None').length;

  return (
    <button 
      className="member-card" 
      onClick={() => onClick(member)}
      aria-label={`View profile for ${member.name}, ${member.relation}, Status: ${member.healthStatus}`}
      style={{ textAlign: 'left', width: '100%' }}
    >
      <div className="member-card-header">
        <div className="member-avatar" aria-hidden="true">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        
        <div className="member-info">
          <div className="member-name">{member.name}</div>
          <div className="member-relation">{member.relation} • {member.age} yrs • {member.gender}</div>
          <div className={`member-status ${getStatusClass(member.healthStatus)}`}>
            <span className="status-dot"></span>
            {member.healthStatus}
          </div>
        </div>
      </div>

      <div className="member-card-body">
        <div className="member-stat">
          <Clock size={16} className="member-stat-icon" />
          <div className="member-stat-content">
            <span className="member-stat-label">Last Checkup</span>
            <span className="member-stat-value">{member.lastCheckup}</span>
          </div>
        </div>

        {displayConditions.length > 0 && (
          <div className="member-stat">
            <Activity size={16} className="member-stat-icon" />
            <div className="member-stat-content">
              <span className="member-stat-label">Current Conditions</span>
              <div className="pill-group">
                {visibleConditions.map((cond, idx) => (
                  <span key={idx} className="pill">{cond}</span>
                ))}
                {hiddenConditionsCount > 0 && (
                  <span className="pill">+{hiddenConditionsCount} more</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeMeds > 0 && (
          <div className="member-stat">
            <Pill size={16} className="member-stat-icon" style={{ color: '#0d9488' }} />
            <div className="member-stat-content">
              <span className="member-stat-value" style={{ color: '#0d9488', fontWeight: 600, fontSize: '0.85rem' }}>
                {activeMeds} Active Medicine{activeMeds > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};
