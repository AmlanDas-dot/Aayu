

export interface PriorityVillage {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Critical';
  concern: string;
}

import type { VillageData } from '../types/Jurisdiction';

export interface ActivityEvent {
  id: string;
  time: string;
  type: string;
  description: string;
}

export interface DiseaseData {
  id: string;
  name: string;
  cases: number;
  trend: 'up' | 'down' | 'stable';
  affectedVillages: string[];
  ageGroups: string;
  recommendations: string[];
}

export interface AshaWorker {
  id: string;
  name: string;
  assignedVillages: string[];
  familiesCovered: number;
  completedVisits: number;
  pendingVisits: number;
}

export interface AlertEvent {
  id: string;
  type: 'Heatwave' | 'Disease Outbreak' | 'Flood' | 'AQI' | 'Emergency';
  title: string;
  severity: 'Critical' | 'High' | 'Warning';
  location: string;
  recommendedAction: string;
}

export interface DashboardData {
  overview: {
    populationCovered: number;
    familiesRegistered: number;
    ashaWorkers: number;
    highRiskCases: number;
    activeAlerts: number;
    todaysVisits: number;
    aiSummary: string;
    priorityVillages: PriorityVillage[];
    recentActivity: ActivityEvent[];
  };
  villages: VillageData[];
  population: {
    children: number;
    pregnantWomen: number;
    seniorCitizens: number;
    disabled: number;
    chronicPatients: number;
  };
  diseases: DiseaseData[];
  environment: {
    aqi: number;
    aqiStatus: string;
    heatRisk: string;
    outdoorScore: string;
    activeEnvAlerts: number;
  };
  workers: AshaWorker[];
  schemes: {
    eligible: number;
    applied: number;
    approved: number;
    pending: number;
  };
  alerts: AlertEvent[];
}

