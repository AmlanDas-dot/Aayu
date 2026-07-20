import React, { useState, useEffect } from 'react';
import { getFamilyMembers, removeMember, deleteFamily, approveMember } from '@/services/familyService';
import { Family, FamilyMember } from '@/firebase/collections';
import { AddMemberModal } from './AddMemberModal';
import { MemberDetailsModal } from './MemberDetailsModal';
import { Users, Trash2, Shield, User, LogOut, UserPlus, Check, Clock, HeartPulse, Trophy } from 'lucide-react';

interface Props {
  family: Family;
  currentMember: FamilyMember;
  onFamilyChange: () => void; // Trigger reload on parent
}

export const FamilyDashboard: React.FC<Props> = ({ family, currentMember, onFamilyChange }) => {
  
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const isAdmin = currentMember.role === 'owner' || currentMember.role === 'admin';
  const isOwner = currentMember.role === 'owner';
  useEffect(() => {
    loadMembers();
  }, [family.id]);

  const loadMembers = async () => {
    try {
      const data = await getFamilyMembers(family.id!);
      setMembers(data);
    } catch (e) {
      console.error("Failed to load members", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMember = async (memberId: string) => {
    try {
      await approveMember(memberId);
      loadMembers();
    } catch (e) {
      console.error(e);
      alert("Failed to approve member");
    }
  };

  const handleRemoveMember = async (memberId: string, isRejecting = false) => {
    const msg = isRejecting ? "Are you sure you want to reject this request?" : "Are you sure you want to remove this member?";
    if (!window.confirm(msg)) return;
    try {
      await removeMember(memberId);
      loadMembers();
    } catch (e) {
      console.error(e);
      alert(isRejecting ? "Failed to reject request" : "Failed to remove member");
    }
  };

  const handleLeaveFamilyClick = () => {
    if (isAdmin) return;
    setShowLeaveModal(true);
  };

  const executeLeaveFamily = async () => {
    try {
      await removeMember(currentMember.id!);
      onFamilyChange();
    } catch (e) {
      console.error(e);
      alert("Failed to leave family");
    } finally {
      setShowLeaveModal(false);
    }
  };

  const handleDeleteFamilyClick = () => {
    setShowDeleteModal(true);
  };

  const executeDeleteFamily = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteFamily(family.id!, currentMember.userId!);
      onFamilyChange();
    } catch (e) {
      console.error(e);
      alert("Failed to delete family");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const activeMembers = members.filter(m => m.status !== 'pending');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <div style={{ padding: '10px' }}>
      {/* Hero Section */}
      <div style={{ background: '#0f766e', color: 'white', padding: '30px', borderRadius: '16px', marginBottom: '30px', position: 'relative', overflow: 'hidden' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', zIndex: 1, position: 'relative' }}>{family.name}</h1>
        <p style={{ opacity: 0.9, zIndex: 1, position: 'relative' }}>{family.motto || "Manage your household health records"}</p>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', zIndex: 1, position: 'relative', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              style={{ padding: '10px 20px', background: 'white', color: '#0f766e', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
            >
              <UserPlus size={18} /> Add Family Member
            </button>
          )}
        </div>

        <Users size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }} />
      </div>

      {showAddModal && (
        <AddMemberModal 
          family={family} 
          adminUid={currentMember.userId!} 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadMembers();
          }}
        />
      )}

      {/* Pending Requests Section */}
      {isAdmin && pendingMembers.length > 0 && (
        <div style={{ background: '#fffbeb', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #fde68a' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
            <Clock size={20} /> Pending Requests ({pendingMembers.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingMembers.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', border: '1px solid #fcd34d', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#92400e' }}>{member.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#b45309' }}>Requested to join</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleRemoveMember(member.id!, true)}
                    style={{ padding: '8px 16px', background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApproveMember(member.id!)}
                    style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Recovery Goals */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
          <HeartPulse size={20} color="#e11d48" /> Shared Recovery Goals
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
            <Trophy size={20} color="#e11d48" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#881337' }}>Dad's Smoke-Free Milestone</div>
              <div style={{ fontSize: '14px', color: '#be123c' }}>42 Days streak! Let's celebrate.</div>
            </div>
            <button style={{ padding: '6px 12px', background: 'white', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Send Encouragement</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
            <HeartPulse size={20} color="#16a34a" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#14532d' }}>Family Walk Goal</div>
              <div style={{ fontSize: '14px', color: '#166534' }}>3/4 members completed today.</div>
            </div>
            <button style={{ padding: '6px 12px', background: 'white', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Join Walk</button>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="#0d9488" /> Active Members ({activeMembers.length})
        </h2>

        {loading ? (
          <p>Loading members...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeMembers.map(member => (
              <div 
                key={member.id} 
                onClick={() => setSelectedMember(member)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488' }}>
                    {member.role === 'admin' ? <Shield size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{member.name} {member.id === currentMember.id && "(You)"}</h4>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: member.status === 'local' ? '#f1f5f9' : '#dcfce7', color: member.status === 'local' ? '#475569' : '#166534', border: `1px solid ${member.status === 'local' ? '#cbd5e1' : '#bbf7d0'}` }}>
                        {member.status === 'local' ? '⚪ Local Profile' : '🟢 Linked Account'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'capitalize' }}>{member.relationship || member.role}</span>
                  </div>
                </div>

                {isAdmin && member.id !== currentMember.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id!); }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                    title="Remove Member"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div style={{ background: '#fef2f2', padding: '24px', borderRadius: '16px', border: '1px solid #fecaca' }}>
        <h3 style={{ color: '#ef4444', marginBottom: '20px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Danger Zone
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Leave Family Card */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', border: '1px solid #fca5a5', borderRadius: '12px' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#b91c1c', fontSize: '1.05rem' }}>Leave Family</h4>
              <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.9rem' }}>Remove yourself from this family. Your account and personal data will remain intact.</p>
            </div>
            {isOwner ? (
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', maxWidth: '320px', fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>You are the owner of this family.</strong>
                To leave, you must first transfer ownership to another member (future feature) or delete the family.
              </div>
            ) : (
              <button 
                onClick={handleLeaveFamilyClick}
                style={{ padding: '10px 20px', background: 'white', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', whiteSpace: 'nowrap' }}
              >
                <LogOut size={18} /> Leave Family
              </button>
            )}
          </div>
          
          {/* Delete Family Card */}
          {isOwner && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '1.05rem' }}>Delete Family</h4>
                <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.9rem' }}>Permanently delete this family and all associated health records, medications, documents, and member data. This action cannot be undone.</p>
              </div>
              <button 
                onClick={handleDeleteFamilyClick}
                disabled={deleting}
                style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', whiteSpace: 'nowrap', opacity: deleting ? 0.7 : 1 }}
              >
                <Trash2 size={18} /> {deleting ? 'Deleting...' : 'Delete Family'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leave Family Modal */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Leave Family</h3>
            <p style={{ margin: '0 0 24px 0', color: '#475569' }}>Are you sure you want to leave this family?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLeaveModal(false)} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={executeLeaveFamily} style={{ padding: '10px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Leave Family</button>
            </div>
          </div>
        </div>
      )}

            {/* Delete Family Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}><Trash2 size={20} /> Delete Family</h3>
            <p style={{ margin: '0 0 16px 0', color: '#475569', lineHeight: '1.5' }}>This will permanently delete the family and all associated data. This action cannot be undone.</p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '0.9rem' }}>Type <strong>DELETE</strong> to confirm:</label>
              <input 
                type="text" 
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button 
                onClick={executeDeleteFamily} 
                disabled={deleteConfirmText !== "DELETE" || deleting}
                style={{ padding: '10px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: (deleteConfirmText !== "DELETE" || deleting) ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: (deleteConfirmText !== "DELETE" || deleting) ? 0.5 : 1 }}
              >
                {deleting ? 'Deleting...' : 'Delete Family'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {selectedMember && (
        <MemberDetailsModal 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
        />
      )}
    </div>
  );
};
