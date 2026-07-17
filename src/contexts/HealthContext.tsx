import React, { createContext, useState, ReactNode, useContext } from 'react';
import { FamilyMember } from '@/firebase/collections';

export const useHealthContext = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealthContext must be used within a HealthContextProvider');
  }
  return context;
};

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
    selectedFamilyId: selectedMember?.familyId || null,
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
