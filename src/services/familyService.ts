import { FamilyData, mockFamilyData } from '../data/familyMock';

// TODO: Replace with Firebase integration in Phase 2
export const getFamilyData = async (): Promise<FamilyData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockFamilyData);
    }, 800); // Simulate network latency
  });
};
