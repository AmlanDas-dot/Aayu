import React, { useState } from 'react';
import { FamilyMember } from '@/firebase/collections';
import { X, User, Activity, AlertTriangle, Pill, Edit2, Check } from 'lucide-react';
import { updateMember } from '@/services/familyService';

interface MemberDetailsModalProps {
  member: FamilyMember;
  onClose: () => void;
  onUpdate?: () => void; // Optional callback to refresh parent
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({ member, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<Partial<FamilyMember>>(member);
  
  // Health profile helpers
  const [conditions, setConditions] = useState(member.healthProfile?.conditions?.join(', ') || '');
  const [allergies, setAllergies] = useState(member.healthProfile?.allergies?.join(', ') || '');
  const [medications, setMedications] = useState(member.healthProfile?.medications?.join(', ') || '');

  const handleSave = async () => {
    if (!member.id) return;
    setSaving(true);
    try {
      const updatedProfile = {
        ...form,
        healthProfile: {
          ...form.healthProfile,
          conditions: conditions.split(',').map(s => s.trim()).filter(Boolean),
          allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
          medications: medications.split(',').map(s => s.trim()).filter(Boolean),
        }
      };
      
      await updateMember(member.id, updatedProfile);
      
      if (onUpdate) onUpdate();
      setIsEditing(false);
      // We don't close, just exit edit mode so they see the new data
      // but wait, since parent might not reload it, we should maybe trigger onClose or update local member state?
      // actually if they reopen it it will have old data if parent doesn't reload. 
      // But the FamilyDashboard reload will update the member list if we pass onUpdate or it triggers automatically.
      onClose(); 
    } catch (e: any) {
      console.error(e);
      alert("Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const isLocal = member.status === 'local';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
            {isEditing ? "Edit Member" : "Member Details"}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isEditing && isLocal && (
              <button onClick={() => setIsEditing(true)} style={{ background: '#f1f5f9', color: '#0f766e', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                <Edit2 size={16} /> Edit
              </button>
            )}
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          
          {/* Member Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488' }}>
              <User size={32} />
            </div>
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <input 
                  value={form.name || ''} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}
                />
              ) : (
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#0f172a' }}>{member.name}</h3>
              )}
              
              {isEditing ? (
                <input 
                  placeholder="Relationship (e.g. Father)"
                  value={form.relationship || ''} 
                  onChange={e => setForm({...form, relationship: e.target.value})} 
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              ) : (
                <p style={{ margin: 0, color: '#64748b' }}>
                  {member.relationship || "No relationship specified"} • {isLocal ? '⚪ Local Profile' : '🟢 Linked Account'}
                </p>
              )}
            </div>
          </div>

          {!isEditing && isLocal && (
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
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Gender</span>
                {isEditing ? (
                  <select value={form.gender || ''} onChange={e => setForm({...form, gender: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <strong style={{ color: '#334155' }}>{member.gender || '-'}</strong>
                )}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Date of Birth</span>
                {isEditing ? (
                  <input type="date" value={form.dob || ''} onChange={e => setForm({...form, dob: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                ) : (
                  <strong style={{ color: '#334155' }}>{member.dob || '-'}</strong>
                )}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Blood Group</span>
                {isEditing ? (
                  <select value={form.bloodGroup || ''} onChange={e => setForm({...form, bloodGroup: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                ) : (
                  <strong style={{ color: '#334155' }}>{member.bloodGroup || '-'}</strong>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {(isEditing || member.phone || member.email) && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {(isEditing || member.phone) && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Phone</span>
                    {isEditing ? (
                      <input type="tel" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    ) : (
                      <strong style={{ color: '#334155' }}>{member.phone}</strong>
                    )}
                  </div>
                )}
                {(isEditing || member.email) && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Email</span>
                    {isEditing ? (
                      <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    ) : (
                      <strong style={{ color: '#334155' }}>{member.email}</strong>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Profile */}
          {(isEditing || member.healthProfile) && (
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Health Profile</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(isEditing || (member.healthProfile?.conditions && member.healthProfile.conditions.length > 0)) && (
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                      <Activity size={16} /> Conditions
                    </span>
                    {isEditing ? (
                      <input placeholder="e.g. Diabetes, Hypertension (comma separated)" value={conditions} onChange={e => setConditions(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {member.healthProfile?.conditions?.map(c => (
                          <span key={c} style={{ padding: '4px 8px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '4px', fontSize: '0.85rem' }}>{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(isEditing || (member.healthProfile?.allergies && member.healthProfile.allergies.length > 0)) && (
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                      <AlertTriangle size={16} /> Allergies
                    </span>
                    {isEditing ? (
                      <input placeholder="e.g. Peanuts, Dust (comma separated)" value={allergies} onChange={e => setAllergies(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {member.healthProfile?.allergies?.map(a => (
                          <span key={a} style={{ padding: '4px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: '4px', fontSize: '0.85rem' }}>{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(isEditing || (member.healthProfile?.medications && member.healthProfile.medications.length > 0)) && (
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                      <Pill size={16} /> Medications
                    </span>
                    {isEditing ? (
                      <input placeholder="e.g. Metformin, Vitamin D (comma separated)" value={medications} onChange={e => setMedications(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {member.healthProfile?.medications?.map(m => (
                          <span key={m} style={{ padding: '4px 8px', background: '#f0fdf4', color: '#16a34a', borderRadius: '4px', fontSize: '0.85rem' }}>{m}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {isEditing && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Check size={18} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
