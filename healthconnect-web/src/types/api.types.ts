// src/types/api.types.ts — API Response Types
// ============================================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error_code?: string;
  errors?: { field: string; message: string }[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface PatientProfile {
  id: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bloodGroup?: string;
  rhFactor?: string;
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  subscriptionTier: 'FREE' | 'PREMIUM';
  hba1c?: number;
  bp?: string;
}

export interface HealthScore {
  score: number;
  medicationAdherence: number;
  symptomFrequency: number;
  appointmentRegularity: number;
  lifestyleFactors: number;
  trend: number;
  calculatedAt: string;
}

export interface Condition {
  id: string;
  name: string;
  status: 'ACTIVE' | 'CHRONIC' | 'RESOLVED' | 'IN_REMISSION';
  diagnosedDate?: string;
  managingDoctor?: string;
  notes?: string;
}

export interface Symptom {
  id: string;
  name: string;
  severity: number;
  startedAt: string;
  notes?: string;
  resolvedAt?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timesOfDay: string[];
  prescribedBy?: string;
  prescribedFor?: string;
  currentStock?: number;
  refillThreshold?: number;
  adherencePercent?: number;
  status: 'ACTIVE' | 'DISCONTINUED' | 'COMPLETED';
}

export interface Appointment {
  id: string;
  doctorName: string;
  doctorId: string;
  specialization: string;
  hospital?: string;
  scheduledAt: string;
  type: 'IN_PERSON' | 'TELECONSULT' | 'HOME_VISIT';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reasonForVisit?: string;
  doctorNotes?: string;
}

export interface Doctor {
  id: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  hospital?: string;
  city?: string;
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  isAvailable?: boolean;
  consultationFee?: number;
  languagesSpoken?: string[];
  slots?: string[];
}

export interface Report {
  id: string;
  name: string;
  type: 'LAB' | 'SCAN' | 'PRESCRIPTION' | 'DISCHARGE' | 'OTHER';
  fileSize: string;
  createdAt: string;
  sharedWith?: { doctorId: string; doctorName: string; sharedAt: string }[];
}

export interface PlatformStats {
  totalPatients: number;
  totalDoctors: number;
  totalHospitals: number;
  totalCommunities: number;
  totalReports: number;
  uptimePercent: number;
}
