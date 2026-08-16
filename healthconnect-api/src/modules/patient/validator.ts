import { z } from 'zod';

const optionalTrimmedString = (max = 255) => z.string().trim().max(max).optional();
const optionalNullableTrimmedString = (max = 255) => z.string().trim().max(max).nullable().optional();
const indianMobile = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');
const pinCode = z.string().regex(/^\d{6}$/, 'PIN code must contain exactly 6 digits');

const isValidDateOnly = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const dateOnly = z.string()
  .refine(isValidDateOnly, 'Use a valid date in YYYY-MM-DD format');

const dateInput = z.string().refine((value) => {
  if (isValidDateOnly(value)) return true;
  return !Number.isNaN(Date.parse(value));
}, 'Use a valid date');

const dateOfBirth = dateOnly.refine((value) => {
  const dob = new Date(`${value}T00:00:00.000Z`);
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const oldestUtc = Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate());
  return dob.getTime() <= todayUtc && dob.getTime() >= oldestUtc;
}, 'Date of birth must be in the past and within the last 120 years');

const nonEmptyUpdate = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one field to update',
);

const allergyCategoryInput = z.string().trim().max(50).transform((value) => {
  const normalized = value.toUpperCase().replace(/[\s-]+/g, '_');
  if (['DRUG', 'MEDICATION', 'MEDICINE'].includes(normalized)) return 'DRUG' as const;
  if (['FOOD'].includes(normalized)) return 'FOOD' as const;
  if (['ENVIRONMENTAL', 'ENVIRONMENT', 'POLLEN', 'DUST'].includes(normalized)) return 'ENVIRONMENTAL' as const;
  if (['INSECT', 'INSECT_BITE', 'INSECT_STING'].includes(normalized)) return 'INSECT' as const;
  if (normalized === 'LATEX') return 'LATEX' as const;
  return 'OTHER' as const;
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100).optional(),
  middleName: optionalNullableTrimmedString(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100).optional(),
  preferredName: optionalNullableTrimmedString(100),
  dateOfBirth: dateOfBirth.optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  preferredPronouns: optionalNullableTrimmedString(80),
  maritalStatus: optionalNullableTrimmedString(50),
  phone: indianMobile.optional(),
  alternatePhone: indianMobile.nullable().optional(),
  bloodGroup: z.enum([
    'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
    'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN'
  ]).optional(),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']).optional(),
  addressLine1: optionalNullableTrimmedString(200),
  addressLine2: optionalNullableTrimmedString(200),
  city: z.string().trim().min(1, 'City is required when provided').max(100).optional(),
  district: z.string().trim().min(1, 'District is required when provided').max(100).optional(),
  state: z.string().trim().min(1, 'State/UT is required when provided').max(100).optional(),
  pinCode: pinCode.nullable().optional(),
  country: z.string().trim().min(1).max(100).optional(),
  languagePreference: z.string().trim().min(2).max(20).optional(),
  secondaryLanguages: z.array(z.string().trim().min(2).max(50)).max(10).optional(),
  preferredContactMethod: z.enum(['APP', 'SMS', 'EMAIL', 'CALL']).nullable().optional(),
  accessibilityNeeds: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  insuranceProvider: optionalNullableTrimmedString(150),
  insurancePolicyNumber: optionalNullableTrimmedString(150),
  insuranceExpiry: dateOnly.nullable().optional(),
  governmentScheme: optionalNullableTrimmedString(150),
  governmentSchemeId: optionalNullableTrimmedString(150),
}).strict();

// Medical-history schemas accept both canonical backend names and the field aliases
// already used by the deployed MedicalHistoryTab. This keeps the API backward compatible
// while enforcing required values and valid dates.
const conditionBaseSchema = z.object({
  name: z.string().trim().min(1, 'Condition name is required').max(200),
  icdCode: optionalTrimmedString(40),
  status: z.enum(['ACTIVE', 'CHRONIC', 'RESOLVED', 'IN_REMISSION', 'MANAGED']).optional(),
  diagnosedDate: dateInput.optional(),
  resolvedDate: dateInput.optional(),
  diagnosedBy: optionalTrimmedString(150),
  managingDoctor: optionalTrimmedString(150),
  treatingDoctor: optionalTrimmedString(150),
  severity: optionalTrimmedString(80),
  lastReviewed: dateInput.optional(),
  notes: optionalTrimmedString(2000),
});
export const conditionSchema = conditionBaseSchema;
export const updateConditionSchema = nonEmptyUpdate(conditionBaseSchema);

const allergyBaseSchema = z.object({
  allergen: z.string().trim().min(1, 'Allergen is required').max(200),
  category: allergyCategoryInput.optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']).optional(),
  reaction: optionalTrimmedString(500),
  crossReactive: optionalTrimmedString(500),
  diagnosedDate: dateInput.optional(),
  notes: optionalTrimmedString(2000),
});
export const allergySchema = allergyBaseSchema;
export const updateAllergySchema = nonEmptyUpdate(allergyBaseSchema);

const surgeryBaseSchema = z.object({
  procedureName: optionalTrimmedString(250),
  name: optionalTrimmedString(250),
  surgeryDate: dateInput,
  hospital: optionalTrimmedString(250),
  surgeon: optionalTrimmedString(200),
  outcome: optionalTrimmedString(500),
  complications: optionalTrimmedString(1000),
  notes: optionalTrimmedString(2000),
}).refine((value) => Boolean(value.procedureName || value.name), {
  message: 'Procedure name is required',
  path: ['procedureName'],
});
export const surgerySchema = surgeryBaseSchema;
export const updateSurgerySchema = z.object({
  procedureName: optionalTrimmedString(250),
  name: optionalTrimmedString(250),
  surgeryDate: dateInput.optional(),
  hospital: optionalTrimmedString(250),
  surgeon: optionalTrimmedString(200),
  outcome: optionalTrimmedString(500),
  complications: optionalTrimmedString(1000),
  notes: optionalTrimmedString(2000),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

const vaccinationBaseSchema = z.object({
  vaccineName: z.string().trim().min(1, 'Vaccine name is required').max(250),
  dateAdministered: dateInput.optional(),
  administeredDate: dateInput.optional(),
  doseNumber: z.number().int().positive().optional(),
  totalDoses: z.number().int().positive().optional(),
  nextDueDate: dateInput.optional(),
  administrator: optionalTrimmedString(200),
  administeredBy: optionalTrimmedString(200),
  batchNumber: optionalTrimmedString(100),
  sideEffects: optionalTrimmedString(1000),
  notes: optionalTrimmedString(2000),
}).refine((value) => Boolean(value.dateAdministered || value.administeredDate), {
  message: 'Vaccination date is required',
  path: ['dateAdministered'],
});
export const vaccinationSchema = vaccinationBaseSchema;
export const updateVaccinationSchema = z.object({
  vaccineName: z.string().trim().min(1).max(250).optional(),
  dateAdministered: dateInput.optional(),
  administeredDate: dateInput.optional(),
  doseNumber: z.number().int().positive().optional(),
  totalDoses: z.number().int().positive().optional(),
  nextDueDate: dateInput.optional(),
  administrator: optionalTrimmedString(200),
  administeredBy: optionalTrimmedString(200),
  batchNumber: optionalTrimmedString(100),
  sideEffects: optionalTrimmedString(1000),
  notes: optionalTrimmedString(2000),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

const familyHistoryBaseSchema = z.object({
  relation: z.string().trim().min(1, 'Relation is required').max(100),
  conditionName: optionalTrimmedString(250),
  condition: optionalTrimmedString(250),
  ageOfOnset: z.number().int().min(0).max(120).optional(),
  status: optionalTrimmedString(50),
  livingStatus: optionalTrimmedString(50),
  causeOfDeath: optionalTrimmedString(500),
  notes: optionalTrimmedString(2000),
}).refine((value) => Boolean(value.conditionName || value.condition), {
  message: 'Condition name is required',
  path: ['conditionName'],
});
export const familyHistorySchema = familyHistoryBaseSchema;
export const updateFamilyHistorySchema = z.object({
  relation: z.string().trim().min(1).max(100).optional(),
  conditionName: optionalTrimmedString(250),
  condition: optionalTrimmedString(250),
  ageOfOnset: z.number().int().min(0).max(120).optional(),
  status: optionalTrimmedString(50),
  livingStatus: optionalTrimmedString(50),
  causeOfDeath: optionalTrimmedString(500),
  notes: optionalTrimmedString(2000),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

const hospitalizationBaseSchema = z.object({
  hospitalName: z.string().trim().min(1, 'Hospital name is required').max(250),
  admissionDate: dateInput,
  dischargeDate: dateInput.optional(),
  reason: optionalTrimmedString(500),
  diagnosis: optionalTrimmedString(500),
  treatingDoctor: optionalTrimmedString(200),
  notes: optionalTrimmedString(2000),
}).refine((value) => {
  if (!value.dischargeDate) return true;
  return new Date(value.dischargeDate).getTime() >= new Date(value.admissionDate).getTime();
}, {
  message: 'Discharge date cannot be before admission date',
  path: ['dischargeDate'],
});
export const hospitalizationSchema = hospitalizationBaseSchema;
export const updateHospitalizationSchema = z.object({
  hospitalName: z.string().trim().min(1).max(250).optional(),
  admissionDate: dateInput.optional(),
  dischargeDate: dateInput.optional(),
  reason: optionalTrimmedString(500),
  diagnosis: optionalTrimmedString(500),
  treatingDoctor: optionalTrimmedString(200),
  notes: optionalTrimmedString(2000),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

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
  name: z.string().trim().min(1, 'Name is required').max(120),
  relationship: z.string().trim().min(1, 'Relationship is required').max(80),
  phone: indianMobile,
  alternatePhone: indianMobile.nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  isPrimary: z.boolean().optional(),
}).strict();

export const updateEmergencyContactSchema = emergencyContactSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one field to update',
);

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