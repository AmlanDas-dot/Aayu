import { DashboardData, mockDashboardData } from '../data/dashboardMock';

// TODO: Replace with backend API integration in Phase 2
export const getDashboardData = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDashboardData);
    }, 600); // Simulate network latency
  });
};
