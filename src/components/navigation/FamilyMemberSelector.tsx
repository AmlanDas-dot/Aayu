import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHealthContext } from '@/hooks/useHealthContext';
import { getUserFamily, getFamilyMembers } from '@/services/familyService';
import { FamilyMember } from '@/firebase/collections';
import { Users } from 'lucide-react';

export const FamilyMemberSelector = () => {
  const { currentUser } = useAuth();
  const { selectedMember, setSelectedMember } = useHealthContext();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentUser) return;
      try {
        const { family } = await getUserFamily(currentUser.uid);
        if (family && family.id) {
          const familyMembers = await getFamilyMembers(family.id);
          const activeMembers = familyMembers.filter(m => m.status !== 'pending');
          setMembers(activeMembers);
          
          // Auto-select if none selected and we have members
          if (!selectedMember && activeMembers.length > 0) {
            // Find self member if possible
            const self = activeMembers.find(m => m.userId === currentUser.uid);
            if (self) {
              setSelectedMember(self);
            } else {
              setSelectedMember(activeMembers[0]);
            }
          }
        }
      } catch (e: any) {
        console.error("Error fetching family for selector:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [currentUser, selectedMember, setSelectedMember]);

  if (loading || members.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
      <Users size={14} color="#64748b" />
      <select 
        value={selectedMember?.id || ''} 
        onChange={(e) => {
          const m = members.find(m => m.id === e.target.value);
          if (m) setSelectedMember(m);
        }}
        style={{
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          background: 'white',
          fontSize: '0.85rem',
          color: '#334155',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <option value="" disabled>Select Member</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>
            {m.userId === currentUser?.uid ? `${m.name} (You)` : m.name}
          </option>
        ))}
      </select>
    </div>
  );
};
