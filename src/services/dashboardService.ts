import { DashboardData, mockDashboardData } from '../data/dashboardMock';

export const getDashboardData = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDashboardData);
    }, 600); // Simulate network latency
  });
};
