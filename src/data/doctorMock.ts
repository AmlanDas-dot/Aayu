export interface PatientTimelineEvent {
  id: string;
  date: string;
  type: 'Consultation' | 'Lab Report' | 'Prescription' | 'Imaging';
  description: string;
  provider: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  status: 'Active' | 'Completed' | 'Discontinued';
}

export interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  date: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface PatientRecord {
  id: string;
  aayuId: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  village: string;
  phone: string;
  lastVisit: string;
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    spo2: number;
    weight: number;
    height: number;
    bmi: number;
    recordedAt: string;
  };
  allergies: string[];
  chronicConditions: string[];
  medications: Medication[];
  timeline: PatientTimelineEvent[];
  labResults: LabResult[];
  aiSummary: string;
  differentialDiagnosis: string[];
  medicationInteractions: string[];
  riskFlags: string[];
}

export interface DoctorSummary {
  todaysPatients: number;
  pendingDiagnoses: number;
  pendingPrescriptions: number;
  followUpsNeeded: number;
  recentPatients: Pick<PatientRecord, 'id' | 'name' | 'age' | 'gender' | 'lastVisit' | 'village'>[];
}

export const mockDoctorSummary: DoctorSummary = {
  todaysPatients: 14,
  pendingDiagnoses: 3,
  pendingPrescriptions: 5,
  followUpsNeeded: 8,
  recentPatients: [
    { id: 'p1', name: 'Ramesh Kumar', age: 45, gender: 'M', lastVisit: 'Today, 10:30 AM', village: 'Phulwari Sharif' },
    { id: 'p2', name: 'Sunita Devi', age: 32, gender: 'F', lastVisit: 'Today, 09:15 AM', village: 'Maner' },
    { id: 'p3', name: 'Amit Singh', age: 28, gender: 'M', lastVisit: 'Yesterday', village: 'Bihta' },
    { id: 'p4', name: 'Priya Verma', age: 54, gender: 'F', lastVisit: '2 days ago', village: 'Danapur' }
  ]
};

export const mockPatientDatabase: Record<string, PatientRecord> = {
  'p1': {
    id: 'p1',
    aayuId: 'AAYU-8493-2910',
    name: 'Ramesh Kumar',
    age: 45,
    gender: 'Male',
    bloodGroup: 'O+',
    village: 'Phulwari Sharif',
    phone: '+91 98765 43210',
    lastVisit: '2023-10-25T10:30:00Z',
    vitals: {
      bloodPressure: '145/90',
      heartRate: 88,
      temperature: 98.6,
      spo2: 97,
      weight: 78,
      height: 172,
      bmi: 26.4,
      recordedAt: '2023-10-25T10:15:00Z'
    },
    allergies: ['Penicillin', 'Dust'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    medications: [
      { id: 'm1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', startDate: '2022-01-15', endDate: null, status: 'Active' },
      { id: 'm2', name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', startDate: '2022-06-20', endDate: null, status: 'Active' }
    ],
    timeline: [
      { id: 't1', date: '2023-10-25', type: 'Consultation', description: 'Follow-up for hypertension. BP slightly elevated.', provider: 'Dr. Sharma (PHC)' },
      { id: 't2', date: '2023-10-20', type: 'Lab Report', description: 'HbA1c & Lipid Profile uploaded', provider: 'Pathology Lab' },
      { id: 't3', date: '2023-08-15', type: 'Prescription', description: 'Refill: Metformin & Amlodipine', provider: 'Dr. Sharma (PHC)' }
    ],
    labResults: [
      { id: 'l1', testName: 'HbA1c', value: '7.2', unit: '%', referenceRange: '< 5.7', date: '2023-10-20', flag: 'High' },
      { id: 'l2', testName: 'Fasting Blood Sugar', value: '135', unit: 'mg/dL', referenceRange: '70-100', date: '2023-10-20', flag: 'High' },
      { id: 'l3', testName: 'Total Cholesterol', value: '195', unit: 'mg/dL', referenceRange: '< 200', date: '2023-10-20', flag: 'Normal' }
    ],
    aiSummary: 'Patient presents with poorly controlled Type 2 Diabetes (HbA1c 7.2%) and elevated blood pressure (145/90). Compliant with current Metformin and Amlodipine regimen, but dose adjustment may be necessary. High risk for cardiovascular events given comorbidities.',
    differentialDiagnosis: ['Uncontrolled Essential Hypertension', 'Diabetic Nephropathy (Early Stage)'],
    medicationInteractions: ['No major drug-drug interactions detected between Metformin and Amlodipine.'],
    riskFlags: ['High Cardiovascular Risk', 'Elevated HbA1c']
  }
};
