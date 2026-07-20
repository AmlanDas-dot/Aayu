import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Jurisdiction } from '../types/Jurisdiction';
import { WorkspaceFacility } from '../data/workspaceRegistry';
import { getJurisdiction } from '../services/jurisdictionService';
import { DashboardData, generateDashboardData } from '../data/dashboardMock';

interface CommunityTwinContextType {
  activeWorkspace: WorkspaceFacility | null;
  jurisdiction: Jurisdiction | null;
  dashboardData: DashboardData | null;
  selectedEntityId: string | null;
  isLoading: boolean;
  error: string | null;
  setActiveWorkspace: (workspace: WorkspaceFacility) => void;
  setSelectedEntityId: (id: string | null) => void;
}

const CommunityTwinContext = createContext<CommunityTwinContextType | undefined>(undefined);

export const CommunityTwinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceFacility | null>(null);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const jur = await getJurisdiction(activeWorkspace.id);
        if (isMounted) {
          setJurisdiction(jur);
          // For legacy compatibility in dashboards, generate dashboard data using new Jurisdiction villages
          const genData = generateDashboardData({
            villages: jur.villages,
            facilities: jur.facilities,
            geoJson: jur.geoJson
          }, jur.workspace.district);
          
          setDashboardData(genData);

          // Auto-select first village
          if (genData.overview.priorityVillages.length > 0) {
            setSelectedEntityId(genData.overview.priorityVillages[0].id);
          } else if (jur.villages.length > 0) {
            setSelectedEntityId(jur.villages[0].id);
          } else {
            setSelectedEntityId(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load jurisdiction');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspace]);

  return (
    <CommunityTwinContext.Provider value={{
      activeWorkspace,
      jurisdiction,
      dashboardData,
      selectedEntityId,
      isLoading,
      error,
      setActiveWorkspace,
      setSelectedEntityId
    }}>
      {children}
    </CommunityTwinContext.Provider>
  );
};

export const useCommunityTwin = () => {
  const context = useContext(CommunityTwinContext);
  if (context === undefined) {
    throw new Error('useCommunityTwin must be used within a CommunityTwinProvider');
  }
  return context;
};
