import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, Smartphone, X, Copy, Share2, ArrowLeft } from 'lucide-react';
import { addManualMember } from '@/services/familyService';
import { Family } from '@/firebase/collections';

interface AddMemberModalProps {
  family: Family;
  adminUid: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ViewState = 'selection' | 'manual_form' | 'invite_aayu';

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ family, adminUid, onClose, onSuccess }) => {
  const [view, setView] = useState<ViewState>('selection');
  
  // Manual Form State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [loading, setLoading] = useState(false);

  const relationships = ["Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Grandfather", "Grandmother", "Spouse", "Guardian", "Other"];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(family.joinToken);
    alert('Join code copied to clipboard!');
  };

  const handleShare = async () => {
    const inviteText = `Join my family on AAYU! Use invite code: ${family.joinToken}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join AAYU Family', text: inviteText });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopyCode();
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !relationship) {
      alert("Name and Relationship are required.");
      return;
    }
    
    setLoading(true);
    try {
      await addManualMember(family.id!, adminUid, {
        name,
        relationship,
        gender,
        dob,
        bloodGroup,
        phone,
        email,
        healthProfile: {
          conditions: conditions ? conditions.split(',').map(c => c.trim()) : [],
          allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
          medications: medications ? medications.split(',').map(m => m.trim()) : [],
        }
      });
      onSuccess();
    } catch (error: any) {
      console.error("Manual member creation failed:", error);
      console.error("Firebase error code:", error.code);
      console.error("Firebase error message:", error.message);
      if (error.stack) console.error("Stack trace:", error.stack);
      
      console.error("Current authenticated user UID:", adminUid);
      console.error("Current family ID:", family.id);
      console.error("Collection name being written to:", "familyMembers");
      console.error("Data being sent to Firestore:", {
        familyId: family.id,
        adminUid,
        memberData: {
          name,
          relationship,
          gender,
          dob,
          bloodGroup,
          phone,
          email,
          healthProfile: {
            conditions: conditions ? conditions.split(',').map(c => c.trim()) : [],
            allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
            medications: medications ? medications.split(',').map(m => m.trim()) : [],
          }
        }
      });

      alert(`Failed to add member: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {view !== 'selection' && (
              <button onClick={() => setView('selection')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <ArrowLeft size={20} color="#475569" />
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
              {view === 'selection' ? 'Add Family Member' : view === 'manual_form' ? 'Add Member Manually' : 'Invite Using AAYU'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          
          {/* View: Selection */}
          {view === 'selection' && (
            <div>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Choose how you want to add someone to {family.name}.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button 
                  onClick={() => setView('manual_form')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                >
                  <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '12px', borderRadius: '50%' }}>
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.1rem' }}>Add Member Manually</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.4' }}>Create a profile yourself. Perfect for children, elderly parents, or anyone without an AAYU account.</p>
                  </div>
                </button>

                <button 
                  onClick={() => setView('invite_aayu')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                >
                  <div style={{ background: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '50%' }}>
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.1rem' }}>Invite via AAYU</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.4' }}>Invite someone who already has or will create an AAYU account.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* View: Invite Using AAYU */}
          {view === 'invite_aayu' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Have them scan this QR code or share the invite link.</p>
              
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', display: 'inline-block', marginBottom: '32px' }}>
                <QRCodeSVG 
                  value={JSON.stringify({ familyId: family.id, joinToken: family.joinToken })} 
                  size={200} 
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Invite Code:</span>
                <strong style={{ fontSize: '1.25rem', letterSpacing: '2px', color: '#0f172a' }}>{family.joinToken}</strong>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={handleCopyCode}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155', fontWeight: '500', cursor: 'pointer' }}
                >
                  <Copy size={18} /> Copy Code
                </button>
                <button 
                  onClick={handleShare}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '500', cursor: 'pointer' }}
                >
                  <Share2 size={18} /> Share Invitation
                </button>
              </div>
            </div>
          )}

          {/* View: Manual Form */}
          {view === 'manual_form' && (
            <form onSubmit={handleAddManual}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Full Name *</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="John Doe" />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Relationship *</label>
                  <select required value={relationship} onChange={e => setRelationship(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}>
                    <option value="">Select relationship</option>
                    {relationships.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Blood Group</label>
                  <input type="text" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="O+" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Phone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="+1 234 567 890" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="user@example.com" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ margin: '16px 0 8px', color: '#0f172a', fontSize: '1rem' }}>Health Information (Optional)</h4>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Known Medical Conditions (comma separated)</label>
                  <input type="text" value={conditions} onChange={e => setConditions(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Diabetes, Hypertension" />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Allergies (comma separated)</label>
                  <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Penicillin, Peanuts" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Current Medications (comma separated)</label>
                  <input type="text" value={medications} onChange={e => setMedications(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Metformin, Aspirin" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155', fontWeight: '500', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{ padding: '10px 24px', background: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
