import { collection, DocumentData, CollectionReference } from "firebase/firestore";
import { db } from "./firebase";
import type { UserRole, UserStatus } from "@/rbac/permissions";

export interface EmergencyContact {
  name: string;
  relationship?: string;
  countryCode: string;
  phoneNumber: string;
}

export interface HealthProfile {
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: EmergencyContact;
  organDonor?: boolean;
  height?: number; // cm
  weight?: number; // kg
  bmi?: number;
  currentMedications?: string[];
  pastSurgeries?: string;
  vaccinationStatus?: string;
  primaryPhysician?: string;
  insurance?: string;
  smoking?: string;
  alcohol?: string;
  exercise?: string;
  updatedAt?: string;
}

export interface ExtractedMedication {
  medicineName: string;
  strength?: string;
  frequency: string;
  timesPerDay: number;
  specificTimes: string[];
  duration?: string;
  beforeFood: boolean;
  afterFood: boolean;
  instructions?: string;
  warnings?: string;
}

export interface ExtractedMetadata {
  hospitalName?: string;
  doctorName?: string;
  visitDate?: string;
  patientName?: string;
  medicines?: string[];
  prescribedMedications?: ExtractedMedication[];
  diagnoses?: string[];
  labTests?: string[];
  importantValues?: Record<string, string>;
  followUpDate?: string;
  language?: string;
  confidenceScore?: number;
}

export interface RecordSummaries {
  aiSummary?: string;
  shortSummary?: string;
  detailedSummary?: string;
  keyFindings?: string[];
  warnings?: string[];
  recommendedFollowUp?: string;
}

export interface MedicalRecord {
  id?: string;
  familyId: string;
  memberId: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  
  title: string;
  category: string; // The specific auto-classified category
  description?: string;
  tags: string[];
  
  hospital: string | null;
  doctor: string | null;
  recordDate: string | null;
  language: string | null;
  
  geminiSummary: string | null;
  extractedText: string | null;
  importantValues: Record<string, string>;
  
  fileType: string;
  fileURL: string;
  thumbnailURL: string | null;
  pageCount: number;
  
  searchable: boolean;
  shared: boolean;
  
  // Backwards compatibility with Phase 6 UI components/views until fully refactored
  classification?: string; 
  metadata?: ExtractedMetadata;
  summaries?: RecordSummaries;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  unit: string;
}

export type HealthTrend = Record<string, TrendDataPoint[]>;

export interface ProfessionalProfile {
  medicalRegistrationNumber?: string;
  qualification?: string;
  specialization?: string;
  superSpecialization?: string;
  medicalCouncil?: string;
  college?: string;
  graduationYear?: string;
  hospital?: string;
  department?: string;
  designation?: string;
  languages?: string;
  yearsOfExperience?: string;
  consultationLanguages?: string;
  workingDistrict?: string;
  workingCHC?: string;
  assignedChc?: string;
  assignedPhc?: string;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
}


// Models
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  photoURL: string | null;
  language: string;
  createdAt: string; 
  lastLogin: string;
  onboardingCompleted: boolean;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  healthProfile?: HealthProfile;
  professionalProfile?: ProfessionalProfile;
  // deprecated: bloodGroup, emergencyContact
}

export interface Settings {
  id?: string;
  uid: string;
  theme: string;
  preferredLanguage: string;
  notificationsEnabled: boolean;
  voiceResponses: boolean;
  medicalReminderNotifications: boolean;
  autoPlayVoice: boolean;
  emergencyContacts?: string[];
}

export interface Family {
  id?: string;
  ownerUid: string;
  name: string;
  photoURL?: string;
  primaryCaregiver?: string;
  address?: string;
  motto?: string;
  joinToken: string;
  createdAt: string;
  updatedAt: string;
}

export type FamilyRole = 'owner' | 'admin' | 'member' | 'caregiver' | 'viewer' | 'child';

export interface FamilyMember {
  id?: string;
  familyId: string;
  userId?: string | null;
  isLinkedAccount: boolean;
  name: string;
  relationship?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  photoURL?: string;
  phone?: string;
  email?: string;
  role: FamilyRole;
  status: 'local' | 'pending' | 'linked';
  joinedAt: string;
  lastActive?: string;
  createdBy: string;
  linkedAt?: string;
  createdAt: string;
  updatedAt: string;
  healthProfile?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
  };
}

export interface ClaimRequest {
  id?: string;
  memberId: string;
  familyId: string;
  requesterUid: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AuditLog {
  id?: string;
  familyId: string;
  memberId?: string;
  performedBy: string;
  action: string;
  metadata?: any;
  createdAt: string;
}

export interface ChatHistory {
  id?: string;
  uid: string;
  startTime: string;
  summary: string;
  riskLevel: string;
  diagnosis: string;
}

export interface NutritionHistory {
  id?: string;
  uid: string;
  date: string;
  meals: any[];
  totalCalories: number;
}

export interface Alert {
  id?: string;
  uid: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type MedicationStatus = 'ACTIVE' | 'COMPLETED' | 'STOPPED' | 'MISSED';

export interface Medication {
  id?: string;
  familyId: string;
  memberId: string;
  recordId?: string; // Optional link to the original Prescription MedicalRecord
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  medicineName: string;
  genericName?: string;
  brandName?: string;
  
  dosage: string;
  strength?: string;
  unit?: string;
  
  frequency: string;
  timesPerDay: number;
  specificTimes: string[]; // e.g. ["08:00", "20:00"]
  
  duration: string;
  startDate: string;
  endDate?: string;
  
  beforeFood: boolean;
  afterFood: boolean;
  withFood: boolean;
  
  instructions?: string;
  prescribingDoctor?: string;
  
  status: MedicationStatus;
  adherencePercentage: number;
  remainingDays: number;
  
  lastTaken?: string;
  nextDose?: string;
}

export interface MedicationLog {
  id?: string;
  medicationId: string;
  familyId: string;
  memberId: string;
  takenAt: string; // ISO String or Date
  scheduledFor: string;
  status: 'TAKEN' | 'SKIPPED' | 'MISSED';
  notes?: string;
}

// Helper to create strongly typed collection references
const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

// Strongly typed collections
export const collections = {
  users: createCollection<UserProfile>("users"),
  families: createCollection<Family>("families"),
  familyMembers: createCollection<FamilyMember>("familyMembers"),
  medicalRecords: createCollection<MedicalRecord>("medicalRecords"),
  chatHistory: createCollection<ChatHistory>("chatHistory"),
  nutritionHistory: createCollection<NutritionHistory>("nutritionHistory"),
  alerts: createCollection<Alert>("alerts"),
  settings: createCollection<Settings>("settings"),
  medications: createCollection<Medication>("medications"),
  medicationLogs: createCollection<MedicationLog>("medicationLogs"),
};
