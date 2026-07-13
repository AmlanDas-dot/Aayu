export interface MedicalRecord {
  id: string;
  date: string;
  title: string;
  type: 'prescription' | 'report' | 'vaccine' | 'visit' | 'vital-bp' | 'vital-temp' | 'vital-weight' | 'vital-pulse';
  value?: string;
  collectedBy?: string;
  hospital?: string;
  doctor?: string;
  notes?: string;
}

export type HealthStatus = 'Healthy' | 'Monitoring' | 'Chronic Condition' | 'Needs Follow-up';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  gender: string;
  bloodGroup: string;
  healthStatus: HealthStatus;
  lastCheckup: string;
  avatarUrl?: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  schemes: string[];
  vaccinationStatus: string;
  emergencyContact: string;
  records: MedicalRecord[];
}

export interface FamilyData {
  overview: {
    householdName: string;
    village: string;
    district: string;
    state: string;
    primaryContact: string;
    primaryLanguage: string;
    socioEconomicCategory: string;
    ashaWorker: string;
    totalMembers: number;
    elderlyCount: number;
    childrenCount: number;
    pregnantWomenCount: number;
    chronicPatientsCount: number;
    recordsShared: number;
    pendingUpdates: number;
    lastActivity: string;
  };
  members: FamilyMember[];
}

export const mockFamilyData: FamilyData = {
  overview: {
    householdName: 'Kumar Household',
    village: 'Phulwari Sharif',
    district: 'Patna',
    state: 'Bihar',
    primaryContact: '+91 98765 43210',
    primaryLanguage: 'Hindi',
    socioEconomicCategory: 'BPL',
    ashaWorker: 'Geeta Devi',
    totalMembers: 4,
    elderlyCount: 1,
    childrenCount: 1,
    pregnantWomenCount: 0,
    chronicPatientsCount: 1,
    recordsShared: 12,
    pendingUpdates: 2,
    lastActivity: 'Today, 10:30 AM',
  },
  members: [
    {
      id: 'm1',
      name: 'Ramesh Kumar',
      relation: 'Self',
      age: 45,
      gender: 'Male',
      bloodGroup: 'O+',
      healthStatus: 'Monitoring',
      lastCheckup: '12 May 2026',
      conditions: ['Hypertension'],
      medications: ['Amlodipine 5mg', 'Vitamin D3'],
      allergies: ['Penicillin'],
      schemes: ['Ayushman Bharat PM-JAY'],
      vaccinationStatus: 'Fully Vaccinated (COVID-19)',
      emergencyContact: '+91 98765 43211 (Spouse)',
      records: [
        {
          id: 'r1',
          date: 'Today',
          title: 'Blood Pressure',
          type: 'vital-bp',
          value: '130 / 85 mmHg',
          collectedBy: 'Geeta Devi (ASHA)',
        },
        {
          id: 'r2',
          date: '12 May 2026',
          title: 'Annual Blood Test',
          type: 'report',
          hospital: 'Apollo Diagnostics',
          notes: 'All parameters normal. Cholesterol slightly elevated.',
        }
      ]
    },
    {
      id: 'm2',
      name: 'Sunita Kumar',
      relation: 'Spouse',
      age: 42,
      gender: 'Female',
      bloodGroup: 'A+',
      healthStatus: 'Needs Follow-up',
      lastCheckup: '05 Jul 2026',
      conditions: ['Hypothyroidism', 'Anemia'],
      medications: ['Thyroxine 50mcg', 'Iron Supplements'],
      allergies: ['None'],
      schemes: ['Ayushman Bharat PM-JAY'],
      vaccinationStatus: 'Fully Vaccinated (COVID-19)',
      emergencyContact: '+91 98765 43210 (Self)',
      records: [
        {
          id: 'r3',
          date: 'Yesterday',
          title: 'Temperature',
          type: 'vital-temp',
          value: '98.4°F',
          collectedBy: 'Self',
        },
        {
          id: 'r4',
          date: '05 Jul 2026',
          title: 'Thyroid Panel',
          type: 'report',
          hospital: 'Thyrocare',
          notes: 'TSH levels high. Follow up required.',
        }
      ]
    },
    {
      id: 'm3',
      name: 'Aarav Kumar',
      relation: 'Son',
      age: 12,
      gender: 'Male',
      bloodGroup: 'O+',
      healthStatus: 'Healthy',
      lastCheckup: '20 Aug 2025',
      conditions: ['None'],
      medications: ['None'],
      allergies: ['Dust Mites'],
      schemes: ['None'],
      vaccinationStatus: 'Up to Date (Routine Immunization)',
      emergencyContact: '+91 98765 43210 (Father)',
      records: [
        {
          id: 'r5',
          date: '2 July',
          title: 'Weight',
          type: 'vital-weight',
          value: '42.5 kg',
          collectedBy: 'School Nurse',
        },
        {
          id: 'r6',
          date: '20 Aug 2025',
          title: 'Typhoid Vaccine',
          type: 'vaccine',
          hospital: 'City Clinic',
        }
      ]
    },
    {
      id: 'm4',
      name: 'Savitri Devi',
      relation: 'Mother',
      age: 68,
      gender: 'Female',
      bloodGroup: 'B+',
      healthStatus: 'Chronic Condition',
      lastCheckup: '10 Jul 2026',
      conditions: ['Diabetes Type 2', 'Osteoarthritis', 'Asthma'],
      medications: ['Metformin 500mg', 'Glimepiride 1mg', 'Calcium + D3'],
      allergies: ['Sulfa Drugs'],
      schemes: ['Ayushman Bharat PM-JAY', 'Senior Citizen Health Scheme'],
      vaccinationStatus: 'Flu Vaccine (2025)',
      emergencyContact: '+91 98765 43210 (Son)',
      records: [
        {
          id: 'r7',
          date: '30 June',
          title: 'Pulse',
          type: 'vital-pulse',
          value: '72 bpm',
          collectedBy: 'Geeta Devi (ASHA)',
        },
        {
          id: 'r8',
          date: '10 Jul 2026',
          title: 'Cardiology Review',
          type: 'visit',
          doctor: 'Dr. Mehta',
          hospital: 'Fortis Hospital',
          notes: 'Adjusted BP medication. Monitor daily.',
        }
      ]
    }
  ]
};
