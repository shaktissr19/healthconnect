import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  bloodGroup: z.enum([
    'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
    'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN'
  ]).optional(),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().regex(/^\d{6}$/).optional(),
  languagePreference: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
});

export const conditionSchema = z.object({
  name: z.string().min(1, 'Condition name is required'),
  icdCode: z.string().optional(),
  status: z.enum(['ACTIVE', 'CHRONIC', 'RESOLVED', 'IN_REMISSION']),
  diagnosedDate: z.string().datetime().optional(),
  resolvedDate: z.string().datetime().optional(),
  diagnosedBy: z.string().optional(),
  managingDoctor: z.string().optional(),
  notes: z.string().optional(),
});

export const allergySchema = z.object({
  allergen: z.string().min(1, 'Allergen is required'),
  category: z.enum(['FOOD', 'DRUG', 'ENVIRONMENTAL', 'INSECT', 'LATEX', 'OTHER']),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']),
  reaction: z.string().optional(),
  diagnosedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const surgerySchema = z.object({
  procedureName: z.string().min(1, 'Procedure name is required'),
  surgeryDate: z.string().datetime(),
  hospital: z.string().optional(),
  surgeon: z.string().optional(),
  outcome: z.string().optional(),
  notes: z.string().optional(),
});

export const vaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  dateAdministered: z.string().datetime(),
  doseNumber: z.number().int().positive().optional(),
  totalDoses: z.number().int().positive().optional(),
  nextDueDate: z.string().datetime().optional(),
  administrator: z.string().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const familyHistorySchema = z.object({
  relation: z.string().min(1, 'Relation is required'),
  conditionName: z.string().min(1, 'Condition name is required'),
  ageOfOnset: z.number().int().positive().optional(),
  status: z.string().optional(),
  causeOfDeath: z.string().optional(),
  notes: z.string().optional(),
});

export const symptomSchema = z.object({
  name: z.string().min(1, 'Symptom name is required'),
  severity: z.number().int().min(1).max(10),
  startedAt: z.string().datetime().optional(),
  triggers: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  genericName: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required'),
  dosageUnit: z.string().optional(),
  frequency: z.enum([
    'ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY',
    'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM'
  ]),
  customFrequency: z.string().optional(),
  timesOfDay: z.array(z.string()).optional(),
  prescribedBy: z.string().optional(),
  prescribedFor: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  currentStock: z.number().int().optional(),
  refillThreshold: z.number().int().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
});

export const medicationLogSchema = z.object({
  medicationId: z.string().uuid(),
  scheduledTime: z.string().datetime(),
  takenAt: z.string().datetime().optional(),
  status: z.enum(['taken', 'missed', 'skipped']),
  notes: z.string().optional(),
});

export const vitalSchema = z.object({
  type: z.enum(['bp', 'heart_rate', 'blood_sugar', 'hba1c', 'weight', 'temperature', 'spo2']),
  value: z.string().min(1),
  unit: z.string().min(1),
  systolic: z.number().int().optional(),
  diastolic: z.number().int().optional(),
  measuredAt: z.string().datetime(),
  context: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().regex(/^\d{10}$/, 'Invalid phone number'),
  email: z.string().email().optional(),
  isPrimary: z.boolean().optional(),
});

export const consentSchema = z.object({
  doctorId: z.string().uuid(),
  accessScope: z.array(z.string()).min(1),
  expiresAt: z.string().datetime().optional(),
  grantReason: z.string().optional(),
});

export const settingsSchema = z.object({
  allowDoctorAccess: z.boolean().optional(),
  allowAnonymousPosting: z.boolean().optional(),
  contributeToResearch: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  medicationReminders: z.boolean().optional(),
  communityActivity: z.boolean().optional(),
  weeklyHealthSummary: z.boolean().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});
