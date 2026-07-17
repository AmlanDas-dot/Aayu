import React from 'react';
import { FamilyMember } from '@/firebase/collections';
import { X, User, Activity, AlertTriangle, Pill } from 'lucide-react';

interface MemberDetailsModalProps {
  member: FamilyMember;
  onClose: () => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({ member, onClose }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Member Details</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          
          {/* Member Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488' }}>
              <User size={32} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#0f172a' }}>{member.name}</h3>
              <p style={{ margin: 0, color: '#64748b' }}>
                {member.relationship || "No relationship specified"} • {member.status === 'local' ? '⚪ Local Profile' : '🟢 Linked Account'}
              </p>
            </div>
          </div>

          {/* Local Profile Banner */}
          {member.status === 'local' && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '1rem' }}>Local Profile</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                This family member does not yet have an AAYU account. They can continue using this profile, or link an AAYU account later.
              </p>
            </div>
          )}

          {/* Basic Info */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Basic Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Gender</span>
                <strong style={{ color: '#334155' }}>{member.gender || '-'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Date of Birth</span>
                <strong style={{ color: '#334155' }}>{member.dob || '-'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Blood Group</span>
                <strong style={{ color: '#334155' }}>{member.bloodGroup || '-'}</strong>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {(member.phone || member.email) && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {member.phone && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Phone</span>
                    <strong style={{ color: '#334155' }}>{member.phone}</strong>
                  </div>
                )}
                {member.email && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Email</span>
                    <strong style={{ color: '#334155' }}>{member.email}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Profile */}
          {member.healthProfile && (
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Health Profile</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {member.healthProfile.conditions && member.healthProfile.conditions.length > 0 && (
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                      <Activity size={16} /> Conditions
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {member.healthProfile.conditions.map(c => (
                        <span key={c} style={{ padding: '4px 8px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '4px', fontSize: '0.85rem' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {member.healthProfile.allergies && member.healthProfile.allergies.length > 0 && (
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                      <AlertTriangle size={16} /> Allergies
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {member.healthProfile.allergies.map(a => (
                        <span key={a} style={{ padding: '4px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: '4px', fontSize: '0.85rem' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {member.healthProfile.medications && member.healthProfile.medications.length > 0 && (
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                      <Pill size={16} /> Medications
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {member.healthProfile.medications.map(m => (
                        <span key={m} style={{ padding: '4px 8px', background: '#f0fdf4', color: '#16a34a', borderRadius: '4px', fontSize: '0.85rem' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
