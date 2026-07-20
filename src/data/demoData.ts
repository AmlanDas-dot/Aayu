import { WorkspaceFacility } from './workspaceRegistry';
import { VillageData, JurisdictionBounds } from '../types/Jurisdiction';
import { MapMarkerData } from '../components/Map/MapMarkers';


export const generateDynamicJurisdiction = (workspace: WorkspaceFacility) => {
  const centerLat = workspace.latitude;
  const centerLng = workspace.longitude;
  
  // Radius roughly 0.15 deg ~ 15-20km
  const bounds: JurisdictionBounds = {
    north: centerLat + 0.15,
    south: centerLat - 0.15,
    east: centerLng + 0.15,
    west: centerLng - 0.15,
  };

  const numVillages = 6;
  const villages: VillageData[] = [];
  const facilities: MapMarkerData[] = [];

  // Add the workspace itself as a marker
  facilities.push({
    id: workspace.id,
    type: workspace.type === 'Community Health Centre' ? 'CHC' : 'DHH',
    position: { lat: centerLat, lng: centerLng },
    name: workspace.name,
    details: 'Primary jurisdiction center',
    status: 'Operational'
  });

  for (let i = 0; i < numVillages; i++) {
    // Distribute around center
    const angle = (i * 360) / numVillages;
    const r = 0.05 + Math.random() * 0.08;
    const vLat = centerLat + r * Math.cos((angle * Math.PI) / 180);
    const vLng = centerLng + r * Math.sin((angle * Math.PI) / 180);
    
    const vName = `Sector ${i+1} (${workspace.district})`;

    villages.push({
      id: `v-${i}`,
      name: vName,
      type: 'Village',
      population: 1500 + Math.floor(Math.random() * 3000),
      families: 300 + Math.floor(Math.random() * 600),
      healthScore: 60 + Math.floor(Math.random() * 35),
      riskScore: 10 + Math.floor(Math.random() * 40),
      mapCoordinates: [vLat, vLng],
      aiInsight: `Moderate risk detected in ${vName} due to seasonal shifts.`,
      trend: Math.random() > 0.5 ? 'Stable' : 'Declining',
      dominantDisease: ['Malaria', 'Dengue', 'Typhoid', 'Flu'][Math.floor(Math.random() * 4)],
      vaccinationCoverage: 70 + Math.floor(Math.random() * 25),
      heatRisk: 'Low',
      district: workspace.district,
      chc: workspace.name,
      phc: `Sub-center ${i+1}`,
      facilityId: `f-${i}`,
      pregnantWomen: 20 + Math.floor(Math.random() * 50),
      elderly: 100 + Math.floor(Math.random() * 200),
      children: 200 + Math.floor(Math.random() * 300),
      nearestDhh: workspace.type === 'District Hospital' ? workspace.name : 'District HQ',
      nearestChc: workspace.name,
      nearestPhc: `Sub-center ${i+1}`,
      colorStatus: 'Green',
      environmentalRisk: 'Low',
      assignedWorkers: 2,
      highRiskPatients: Math.floor(Math.random() * 10),
      maternalHealth: 'Stable',
      childrenUnderMonitoring: 5,
      recentCases: Math.floor(Math.random() * 15),
      medicationAdherence: 80,
      airQuality: 'Good',
      waterSafety: 'Safe',
      aiHealthScore: 85,
      unregisteredCitizens: 12,
      travelTime: '15 mins',
      nearestHospital: workspace.name,
      commonSymptoms: ['Fever', 'Cough'],
      lastAshaVisit: '2 days ago',
      recommendations: ['Increase screening']
    });


    // Add marker for PHC
    facilities.push({
      id: `phc-${i}`,
      type: 'PHC',
      position: { lat: vLat, lng: vLng },
      name: `Sub-center ${i+1}`,
      details: 'Active',
      status: 'Operational'
    });
  }

  return {
    workspace,
    center: { lat: centerLat, lng: centerLng },
    bounds,
    villages,
    facilities,
    geoJson: null // Explicitly enforce real data pipeline, no fake geometry
  };
};
