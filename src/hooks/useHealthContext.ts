import { useContext } from 'react';
import { HealthContext } from '../contexts/HealthContext';

export const useHealthContext = () => {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error('useHealthContext must be used within a HealthContextProvider');
  }
  return context;
};
