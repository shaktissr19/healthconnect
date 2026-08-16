import { z } from 'zod';

const dateTime = z.string().datetime();
const optionalText = (max = 2000) => z.string().trim().max(max).optional();
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm time format');

const medicationFrequencies = [
  'ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY',
  'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM',
] as const;

const medicationStatuses = ['ACTIVE', 'DISCONTINUED', 'COMPLETED', 'ON_HOLD'] as const;
const vitalTypes = ['bp', 'heart_rate', 'blood_sugar', 'hba1c', 'weight', 'temperature', 'spo2', 'cholesterol'] as const;

const triggerInput = z.preprocess((value) => {
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return value;
}, z.array(z.string().trim().min(1).max(120)).max(20).optional());

export const symptomCreateSchema = z.object({
  name: z.string().trim().min(1, 'Symptom name is required').max(200),
  severity: z.number().int().min(1).max(10),
  loggedAt: dateTime.optional(),
  startedAt: dateTime.optional(), // backward-compatible alias
  triggers: triggerInput,
  notes: optionalText(),
}).transform(({ startedAt, ...value }) => ({
  ...value,
  loggedAt: value.loggedAt ?? startedAt,
}));

export const symptomUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  severity: z.number().int().min(1).max(10).optional(),
  resolvedAt: dateTime.optional(),
  triggers: triggerInput,
  notes: optionalText(),
}).refine(value => Object.keys(value).length > 0, 'Provide at least one field to update');

export const medicationCreateSchema = z.object({
  name: z.string().trim().min(1, 'Medication name is required').max(200),
  genericName: optionalText(200),
  dosage: z.string().trim().min(1, 'Dosage is required').max(100),
  dosageUnit: optionalText(50),
  frequency: z.enum(medicationFrequencies),
  customFrequency: optionalText(150),
  timesOfDay: z.array(timeOfDay).max(12).optional(),
  prescribedBy: optionalText(200),
  prescribedFor: optionalText(300),
  startDate: dateTime,
  endDate: dateTime.optional(),
  currentStock: z.number().int().min(0).optional(),
  refillThreshold: z.number().int().min(0).optional(),
  instructions: optionalText(),
  notes: optionalText(),
}).refine(value => !value.endDate || new Date(value.endDate) >= new Date(value.startDate), {
  message: 'End date cannot be before start date',
  path: ['endDate'],
}).refine(value => value.frequency !== 'CUSTOM' || Boolean(value.customFrequency?.trim()), {
  message: 'Custom frequency details are required',
  path: ['customFrequency'],
});

export const medicationUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  dosage: z.string().trim().min(1).max(100).optional(),
  frequency: z.enum(medicationFrequencies).optional(),
  timesOfDay: z.array(timeOfDay).max(12).optional(),
  status: z.enum(medicationStatuses).optional(),
  currentStock: z.number().int().min(0).optional(),
  endDate: dateTime.optional(),
  notes: optionalText(),
  instructions: optionalText(),
}).refine(value => Object.keys(value).length > 0, 'Provide at least one field to update');

export const medicationDoseSchema = z.object({
  status: z.string().transform(value => value.toLowerCase()).pipe(z.enum(['taken', 'missed', 'skipped'])),
  scheduledTime: dateTime.optional(),
  takenAt: dateTime.optional(),
  notes: optionalText(1000),
}).transform(value => ({
  ...value,
  scheduledTime: value.scheduledTime ?? value.takenAt ?? new Date().toISOString(),
}));

export const vitalCreateSchema = z.object({
  type: z.enum(vitalTypes),
  value: z.string().trim().min(1, 'Vital value is required').max(100),
  unit: z.string().trim().min(1, 'Unit is required').max(40),
  systolic: z.number().int().positive().optional(),
  diastolic: z.number().int().positive().optional(),
  measuredAt: dateTime.optional(),
  context: optionalText(100),
  notes: optionalText(),
  source: optionalText(100),
}).superRefine((value, ctx) => {
  if (value.type === 'bp' && (!value.systolic || !value.diastolic)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['systolic'], message: 'Blood pressure requires systolic and diastolic values' });
  }
});

export const therapyCreateSchema = z.object({
  type: z.string().trim().min(1).max(80),
  plan: z.string().trim().min(1, 'Therapy plan is required').max(1000),
  targetValue: optionalText(100),
  currentValue: optionalText(100),
  startDate: dateTime,
  endDate: dateTime.optional(),
  notes: optionalText(),
}).refine(value => !value.endDate || new Date(value.endDate) >= new Date(value.startDate), {
  message: 'End date cannot be before start date',
  path: ['endDate'],
});

export const reportShareSchema = z.object({
  doctorId: z.string().uuid('Select a valid doctor'),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  expiresAt: dateTime.optional(), // accepted for older clients
}).transform(value => {
  if (value.expiresInDays || !value.expiresAt) return value;
  const delta = new Date(value.expiresAt).getTime() - Date.now();
  return { doctorId: value.doctorId, expiresInDays: Math.max(1, Math.min(365, Math.ceil(delta / 86400000))) };
});
