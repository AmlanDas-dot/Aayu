import { MapMarkerData } from '../components/Map/MapMarkers';

export interface PriorityVillage {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Critical';
  concern: string;
}

import { VillageData } from '../types/Jurisdiction';

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
  villages: [
    {
      id: 'v1', name: 'Phulwari Sharif', population: 18500, riskScore: 85, colorStatus: 'Red',
      dominantDisease: 'Dengue', environmentalRisk: 'High (Heat & AQI)', assignedWorkers: 12,
      highRiskPatients: 340, vaccinationCoverage: 72, maternalHealth: '5 Overdue',
      childrenUnderMonitoring: 45, recentCases: 28, medicationAdherence: 68,
      airQuality: 'Poor', waterSafety: 'Fair', heatRisk: 'Severe', aiHealthScore: 42,
      district: 'Patna', chc: 'Phulwari CHC', phc: 'Phulwari PHC', facilityId: 'F-PH-01',
      mapCoordinates: [25.58, 85.09],
      trend: 'Declining',
      aiInsight: 'Phulwari Sharif has experienced a 23% increase in respiratory and dengue symptoms over the last week. Immediate vector control recommended.',
      unregisteredCitizens: 1200, travelTime: '15 mins', nearestHospital: 'Phulwari CHC', commonSymptoms: ['Fever', 'Cough', 'Body Ache'],
      pregnantWomen: 145, elderly: 850, children: 1200, nearestDhh: 'Patna DHH', nearestChc: 'Phulwari CHC', nearestPhc: 'Phulwari PHC',
      lastAshaVisit: 'Today', recommendations: ['Deploy rapid response team', 'Increase ASHA visits', 'Stock ORS']
    },
    {
      id: 'v2', name: 'Maner', population: 14200, riskScore: 68, colorStatus: 'Orange',
      dominantDisease: 'Diarrhea', environmentalRisk: 'High (Heat)', assignedWorkers: 8,
      highRiskPatients: 210, vaccinationCoverage: 78, maternalHealth: '2 Overdue',
      childrenUnderMonitoring: 32, recentCases: 15, medicationAdherence: 74,
      airQuality: 'Moderate', waterSafety: 'Poor', heatRisk: 'Severe', aiHealthScore: 58,
      district: 'Patna', chc: 'Maner CHC', phc: 'Maner PHC', facilityId: 'F-MN-01',
      mapCoordinates: [25.64, 84.89],
      trend: 'Stable',
      aiInsight: 'Heat stress risk expected to rise tomorrow in Maner. Water contamination suspected in eastern blocks.',
      unregisteredCitizens: 850, travelTime: '30 mins', nearestHospital: 'Maner CHC', commonSymptoms: ['Loose Motion', 'Dehydration'],
      pregnantWomen: 95, elderly: 620, children: 850, nearestDhh: 'Patna DHH', nearestChc: 'Maner CHC', nearestPhc: 'Maner PHC',
      lastAshaVisit: 'Yesterday', recommendations: ['Check municipal water', 'Activate cooling centers']
    },
    {
      id: 'v3', name: 'Bihta', population: 22000, riskScore: 52, colorStatus: 'Yellow',
      dominantDisease: 'Typhoid', environmentalRisk: 'Moderate', assignedWorkers: 15,
      highRiskPatients: 280, vaccinationCoverage: 65, maternalHealth: 'Normal',
      childrenUnderMonitoring: 55, recentCases: 8, medicationAdherence: 82,
      airQuality: 'Moderate', waterSafety: 'Good', heatRisk: 'Moderate', aiHealthScore: 72,
      district: 'Patna', chc: 'Bihta CHC', phc: 'Bihta PHC', facilityId: 'F-BH-01',
      mapCoordinates: [25.56, 84.87],
      trend: 'Improving',
      aiInsight: 'Vaccination coverage in Bihta dropped below the 70% threshold. Scheduled catch-up camps are required.',
      unregisteredCitizens: 1500, travelTime: '45 mins', nearestHospital: 'Bihta CHC', commonSymptoms: ['Fever', 'Weakness'],
      pregnantWomen: 210, elderly: 1100, children: 1450, nearestDhh: 'Patna DHH', nearestChc: 'Bihta CHC', nearestPhc: 'Bihta PHC',
      lastAshaVisit: '2 Days Ago', recommendations: ['Schedule vaccination camp', 'ASHA follow-ups for dropouts']
    },
    {
      id: 'v4', name: 'Naubatpur', population: 16800, riskScore: 45, colorStatus: 'Yellow',
      dominantDisease: 'None', environmentalRisk: 'Low', assignedWorkers: 10,
      highRiskPatients: 195, vaccinationCoverage: 84, maternalHealth: '3 Overdue',
      childrenUnderMonitoring: 28, recentCases: 3, medicationAdherence: 88,
      airQuality: 'Good', waterSafety: 'Good', heatRisk: 'Low', aiHealthScore: 78,
      district: 'Patna', chc: 'Naubatpur CHC', phc: 'Naubatpur PHC', facilityId: 'F-NB-01',
      mapCoordinates: [25.53, 85.00],
      trend: 'Improving',
      aiInsight: 'Maternal follow-ups are overdue for 3 high-risk pregnancies. ASHA worker alert triggered.',
      unregisteredCitizens: 600, travelTime: '25 mins', nearestHospital: 'Naubatpur PHC', commonSymptoms: ['Headache', 'Nausea'],
      pregnantWomen: 120, elderly: 780, children: 950, nearestDhh: 'Patna DHH', nearestChc: 'Naubatpur CHC', nearestPhc: 'Naubatpur PHC',
      lastAshaVisit: 'Today', recommendations: ['Prioritize maternal visits', 'Check ANC records']
    },
    {
      id: 'v5', name: 'Danapur', population: 28500, riskScore: 75, colorStatus: 'Orange',
      dominantDisease: 'Asthma/COPD', environmentalRisk: 'High (AQI)', assignedWorkers: 18,
      highRiskPatients: 420, vaccinationCoverage: 81, maternalHealth: '1 Overdue',
      childrenUnderMonitoring: 62, recentCases: 12, medicationAdherence: 71,
      airQuality: 'Very Poor', waterSafety: 'Good', heatRisk: 'Moderate', aiHealthScore: 61,
      district: 'Patna', chc: 'Danapur CHC', phc: 'Danapur PHC', facilityId: 'F-DN-01',
      mapCoordinates: [25.61, 85.05],
      trend: 'Declining',
      aiInsight: 'Industrial emissions causing localized AQI spikes. Expect higher nebulizer requirements at Danapur PHC.',
      unregisteredCitizens: 2100, travelTime: '10 mins', nearestHospital: 'Danapur DHH', commonSymptoms: ['Breathing Difficulty', 'Cough'],
      pregnantWomen: 180, elderly: 1500, children: 1800, nearestDhh: 'Danapur DHH', nearestChc: 'Danapur CHC', nearestPhc: 'Danapur PHC',
      lastAshaVisit: '3 Days Ago', recommendations: ['Stock nebulizers at PHC', 'Issue pollution advisory']
    },
    {
      id: 'v6', name: 'Khagaul', population: 12400, riskScore: 25, colorStatus: 'Green',
      dominantDisease: 'None', environmentalRisk: 'Low', assignedWorkers: 6,
      highRiskPatients: 110, vaccinationCoverage: 92, maternalHealth: 'Normal',
      childrenUnderMonitoring: 15, recentCases: 1, medicationAdherence: 94,
      airQuality: 'Good', waterSafety: 'Good', heatRisk: 'Low', aiHealthScore: 92,
      district: 'Patna', chc: 'Danapur CHC', phc: 'Khagaul PHC', facilityId: 'F-KG-01',
      mapCoordinates: [25.58, 85.05],
      trend: 'Stable',
      aiInsight: 'Khagaul maintains optimal health metrics. Routine surveillance continuing normally.',
      unregisteredCitizens: 400, travelTime: '20 mins', nearestHospital: 'Khagaul PHC', commonSymptoms: ['None'],
      pregnantWomen: 85, elderly: 520, children: 710, nearestDhh: 'Danapur DHH', nearestChc: 'Danapur CHC', nearestPhc: 'Khagaul PHC',
      lastAshaVisit: 'Yesterday', recommendations: ['Continue routine surveillance']
    }
  ],
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

export const historicalMockData: Record<number, DashboardData> = {
  0: mockDashboardData,
  7: {
    ...mockDashboardData,
    overview: {
      ...mockDashboardData.overview,
      aiSummary: 'Historical Data (7 Days Ago): Dengue cases were significantly lower. Heatwave was not present.',
      todaysVisits: 280,
    },
    diseases: mockDashboardData.diseases.map(d => ({ ...d, cases: Math.max(0, d.cases - 40) })),
    environment: { ...mockDashboardData.environment, aqi: 90, heatRisk: 'Moderate' },
    alerts: [
      {
        id: 'al1',
        type: 'AQI',
        title: 'Air Quality Normal',
        severity: 'Warning',
        location: 'District Wide',
        recommendedAction: 'Continue routine surveillance.'
      }
    ],
    villages: mockDashboardData.villages.map(v => ({
      ...v,
      riskScore: Math.max(0, v.riskScore - 15),
      recentCases: Math.max(0, v.recentCases - 5),
      aiInsight: 'Historical record (7 Days Ago).',
      heatRisk: 'Moderate'
    }))
  }
};

// Static Mock Data for Dashboard Features
const mockDiseases = [
  {
    id: 'd1',
    name: 'Dengue Fever',
    cases: 142,
    trend: 'up' as const,
    affectedVillages: ['Phulwari Sharif', 'Danapur'],
    ageGroups: '15-45 years',
    recommendations: ['Intensify fogging operations', 'Distribute mosquito nets', 'Community awareness campaign']
  },
  {
    id: 'd2',
    name: 'Acute Diarrheal Disease',
    cases: 86,
    trend: 'stable' as const,
    affectedVillages: ['Maner', 'Bihta'],
    ageGroups: '0-5 years, 65+ years',
    recommendations: ['Check municipal water supply', 'Distribute ORS packets', 'Promote hand hygiene']
  },
  {
    id: 'd3',
    name: 'Typhoid',
    cases: 45,
    trend: 'down' as const,
    affectedVillages: ['Naubatpur'],
    ageGroups: '5-15 years',
    recommendations: ['Food safety inspections', 'Ensure safe drinking water']
  }
];

const mockEnvironment = {
  aqi: 145,
  aqiStatus: 'Moderate',
  heatRisk: 'High',
  outdoorScore: 'Poor',
  activeEnvAlerts: 2
};

const mockWorkers = [
  { id: 'w1', name: 'Geeta Devi', assignedVillages: ['Phulwari Sharif', 'Khagaul'], familiesCovered: 245, completedVisits: 18, pendingVisits: 4 },
  { id: 'w2', name: 'Sunita Kumari', assignedVillages: ['Maner'], familiesCovered: 180, completedVisits: 12, pendingVisits: 8 },
  { id: 'w3', name: 'Asha Singh', assignedVillages: ['Bihta', 'Naubatpur'], familiesCovered: 310, completedVisits: 22, pendingVisits: 1 }
];

const mockSchemes = {
  eligible: 18500,
  applied: 14200,
  approved: 12150,
  pending: 2050
};

const mockAlerts = [
  {
    id: 'al1',
    type: 'Heatwave' as const,
    title: 'Severe Heatwave Warning',
    severity: 'Critical' as const,
    location: 'District Wide',
    recommendedAction: 'Issue advisory to stay indoors from 12 PM to 4 PM. Ensure PHCs are stocked with IV fluids and ORS. Activate cooling centers in urban wards.'
  },
  {
    id: 'al2',
    type: 'Disease Outbreak' as const,
    title: 'Dengue Cluster Identified',
    severity: 'High' as const,
    location: 'Phulwari Sharif (Wards 12, 14)',
    recommendedAction: 'Deploy rapid response team for source reduction. Schedule targeted fogging for next 3 days. Alert local hospitals for bed readiness.'
  },
  {
    id: 'al3',
    type: 'AQI' as const,
    title: 'Poor Air Quality (PM2.5 Spike)',
    severity: 'Warning' as const,
    location: 'Danapur Industrial Area',
    recommendedAction: 'Advise vulnerable groups (asthma, COPD patients) to limit outdoor activities. Monitor respiratory case admissions at Danapur PHC.'
  }
];

// Utility to construct DashboardData from the loaded/translated dataset
export const generateDashboardData = (loadedData: { villages: VillageData[], facilities: MapMarkerData[], geoJson: any }, districtName: string): DashboardData => {
  const generatedVillages = loadedData.villages;
  const totalPop = generatedVillages.reduce((sum, v) => sum + v.population, 0);

  return {
    overview: {
      populationCovered: totalPop,
      familiesRegistered: Math.floor(totalPop / 4),
      ashaWorkers: generatedVillages.reduce((sum, v) => sum + v.assignedWorkers, 0),
      highRiskCases: generatedVillages.reduce((sum, v) => sum + v.highRiskPatients, 0),
      activeAlerts: generatedVillages.filter(v => v.colorStatus === 'Red').length,
      todaysVisits: Math.floor(totalPop * 0.01),
      aiSummary: `Public health intelligence overview for ${districtName}. Monitoring ${generatedVillages.length} specific regions. Dengue cluster in Phulwari Sharif.`,
      priorityVillages: generatedVillages.filter(v => v.colorStatus === 'Red' || v.colorStatus === 'Orange').slice(0, 5).map(v => ({
        id: v.id,
        name: v.name,
        priority: v.colorStatus === 'Red' ? 'Critical' : 'High',
        concern: v.dominantDisease
      })),
      recentActivity: [
        { id: 'a1', time: '10:42 AM', type: 'Visit', description: 'ASHA Visit Completed (Geeta Devi)' },
        { id: 'a2', time: '10:35 AM', type: 'Alert', description: 'Heat Alert Triggered' },
        { id: 'a3', time: '10:15 AM', type: 'Vitals', description: 'Blood Pressure Recorded - High Risk Patient' },
        { id: 'a4', time: '09:50 AM', type: 'Registration', description: 'Family Registered (4 members)' },
        { id: 'a5', time: '09:12 AM', type: 'Scan', description: 'QR Scan by PHC Doctor' }
      ]
    },
    villages: generatedVillages,
    population: {
      children: generatedVillages.reduce((sum, v) => sum + v.children, 0),
      pregnantWomen: generatedVillages.reduce((sum, v) => sum + v.pregnantWomen, 0),
      seniorCitizens: generatedVillages.reduce((sum, v) => sum + v.elderly, 0),
      disabled: Math.floor(totalPop * 0.02),
      chronicPatients: Math.floor(totalPop * 0.05)
    },
    diseases: mockDiseases,
    environment: mockEnvironment,
    workers: mockWorkers,
    schemes: mockSchemes,
    alerts: mockAlerts
  };
};
