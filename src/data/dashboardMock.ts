export interface PriorityVillage {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Critical';
  concern: string;
}

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

export const mockDashboardData: DashboardData = {
  overview: {
    populationCovered: 124500,
    familiesRegistered: 28340,
    ashaWorkers: 142,
    highRiskCases: 1245,
    activeAlerts: 3,
    todaysVisits: 312,
    aiSummary: "Public health indicators remain stable across 80% of the district. We are observing a 12% week-over-week spike in suspected dengue cases in the eastern wards. Heatwave alerts have been triggered for 3 consecutive days, increasing dehydration risks among senior citizens. Recommendation: Deploy additional ORS supplies to ASHA workers in eastern wards and initiate vector control measures.",
    priorityVillages: [
      { id: 'v1', name: 'Phulwari Sharif', priority: 'Critical', concern: 'Dengue Cluster' },
      { id: 'v2', name: 'Maner', priority: 'High', concern: 'Heatwave Vulnerability' },
      { id: 'v3', name: 'Bihta', priority: 'High', concern: 'Low Immunization' },
      { id: 'v4', name: 'Naubatpur', priority: 'Medium', concern: 'Maternal Health' },
      { id: 'v5', name: 'Danapur', priority: 'Medium', concern: 'Water Quality' }
    ],
    recentActivity: [
      { id: 'a1', time: '10:42 AM', type: 'Visit', description: 'ASHA Visit Completed (Geeta Devi) - Phulwari Sharif' },
      { id: 'a2', time: '10:35 AM', type: 'Alert', description: 'Heat Alert Triggered - Maner' },
      { id: 'a3', time: '10:15 AM', type: 'Vitals', description: 'Blood Pressure Recorded - High Risk Patient (Danapur)' },
      { id: 'a4', time: '09:50 AM', type: 'Registration', description: 'Family Registered (4 members) - Bihta' },
      { id: 'a5', time: '09:12 AM', type: 'Scan', description: 'QR Scan by PHC Doctor - Naubatpur' }
    ]
  },
  population: {
    children: 32150,
    pregnantWomen: 2450,
    seniorCitizens: 18400,
    disabled: 1205,
    chronicPatients: 8430
  },
  diseases: [
    {
      id: 'd1',
      name: 'Dengue Fever',
      cases: 142,
      trend: 'up',
      affectedVillages: ['Phulwari Sharif', 'Danapur'],
      ageGroups: '15-45 years',
      recommendations: ['Intensify fogging operations', 'Distribute mosquito nets', 'Community awareness campaign']
    },
    {
      id: 'd2',
      name: 'Acute Diarrheal Disease',
      cases: 86,
      trend: 'stable',
      affectedVillages: ['Maner', 'Bihta'],
      ageGroups: '0-5 years, 65+ years',
      recommendations: ['Check municipal water supply', 'Distribute ORS packets', 'Promote hand hygiene']
    },
    {
      id: 'd3',
      name: 'Typhoid',
      cases: 45,
      trend: 'down',
      affectedVillages: ['Naubatpur'],
      ageGroups: '5-15 years',
      recommendations: ['Food safety inspections', 'Ensure safe drinking water']
    }
  ],
  environment: {
    aqi: 145,
    aqiStatus: 'Moderate',
    heatRisk: 'High',
    outdoorScore: 'Poor',
    activeEnvAlerts: 2
  },
  workers: [
    { id: 'w1', name: 'Geeta Devi', assignedVillages: ['Phulwari Sharif', 'Khagaul'], familiesCovered: 245, completedVisits: 18, pendingVisits: 4 },
    { id: 'w2', name: 'Sunita Kumari', assignedVillages: ['Maner'], familiesCovered: 180, completedVisits: 12, pendingVisits: 8 },
    { id: 'w3', name: 'Asha Singh', assignedVillages: ['Bihta', 'Naubatpur'], familiesCovered: 310, completedVisits: 22, pendingVisits: 1 }
  ],
  schemes: {
    eligible: 18500,
    applied: 14200,
    approved: 12150,
    pending: 2050
  },
  alerts: [
    {
      id: 'al1',
      type: 'Heatwave',
      title: 'Severe Heatwave Warning',
      severity: 'Critical',
      location: 'District Wide',
      recommendedAction: 'Issue advisory to stay indoors from 12 PM to 4 PM. Ensure PHCs are stocked with IV fluids and ORS. Activate cooling centers in urban wards.'
    },
    {
      id: 'al2',
      type: 'Disease Outbreak',
      title: 'Dengue Cluster Identified',
      severity: 'High',
      location: 'Phulwari Sharif (Wards 12, 14)',
      recommendedAction: 'Deploy rapid response team for source reduction. Schedule targeted fogging for next 3 days. Alert local hospitals for bed readiness.'
    },
    {
      id: 'al3',
      type: 'AQI',
      title: 'Poor Air Quality (PM2.5 Spike)',
      severity: 'Warning',
      location: 'Danapur Industrial Area',
      recommendedAction: 'Advise vulnerable groups (asthma, COPD patients) to limit outdoor activities. Monitor respiratory case admissions at Danapur PHC.'
    }
  ]
};
