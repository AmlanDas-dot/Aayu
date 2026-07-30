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

