import React from 'react';
import { FamilyMember } from '../../data/familyMock';
import { MemberCard } from './MemberCard';
import { Users } from 'lucide-react';

interface MemberGridProps {
  members: FamilyMember[];
  onMemberClick: (member: FamilyMember) => void;
}

export const MemberGrid: React.FC<MemberGridProps> = ({ members, onMemberClick }) => {
  return (
    <div className="family-module-card mt-4">
      <div className="family-module-header">
        <div className="family-module-title-wrap">
          <Users size={28} className="text-teal" />
          <h2 className="family-module-title">Family Members</h2>
        </div>
      </div>
      
      <div className="member-grid">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} onClick={onMemberClick} />
        ))}
      </div>
    </div>
  );
};
