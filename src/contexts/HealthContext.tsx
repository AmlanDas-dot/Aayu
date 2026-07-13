import React, { createContext, useState, ReactNode } from 'react';
import { FamilyMember } from '../data/familyMock';

interface HealthContextState {
  selectedFamilyId: string | null;
  selectedMemberId: string | null;
  selectedMember: FamilyMember | null;
  selectedVillage: string;
  selectedRole: string;
  lastVisitedModule: string;
  setSelectedMember: (member: FamilyMember | null) => void;
  clearSelectedMember: () => void;
  setVillage: (village: string) => void;
  setRole: (role: string) => void;
  setLastVisitedModule: (module: string) => void;
}

export const HealthContext = createContext<HealthContextState | undefined>(undefined);

export const HealthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMember, setSelectedMemberState] = useState<FamilyMember | null>(null);
  const [selectedVillage, setVillage] = useState<string>('');
  const [selectedRole, setRole] = useState<string>('');
  const [lastVisitedModule, setLastVisitedModule] = useState<string>('');

  const setSelectedMember = (member: FamilyMember | null) => {
    setSelectedMemberState(member);
  };

  const clearSelectedMember = () => {
    setSelectedMemberState(null);
  };

  const value: HealthContextState = {
    selectedFamilyId: 'f1', // Mock family ID for now
    selectedMemberId: selectedMember?.id || null,
    selectedMember,
    selectedVillage,
    selectedRole,
    lastVisitedModule,
    setSelectedMember,
    clearSelectedMember,
    setVillage,
    setRole,
    setLastVisitedModule
  };

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
};
