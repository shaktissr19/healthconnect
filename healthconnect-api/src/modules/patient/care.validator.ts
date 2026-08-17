import { z } from 'zod';

const optionalText = (max = 2000) => z.string().trim().max(max).optional();
const dateInput = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Use a valid date/time');
const nonEmptyUpdate = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one field to update',
);

export const symptomCreateSchema = z.object({
  name: z.string().trim().min(1, 'Symptom name is required').max(150),
  severity: z.number().int().min(1).max(10),
  loggedAt: dateInput.optional(),
  startedAt: dateInput.optional(),
  triggers: z.union([
    z.array(z.string().trim().min(1).max(120)).max(20),
    z.string().trim().max(1000),
  ]).optional(),
  bodyPart: z.string().trim().max(120).optional(),
  notes: optionalText(),
}).strict();

export const symptomUpdateSchema = nonEmptyUpdate(z.object({
  name: z.string().trim().min(1).max(150),
  severity: z.number().int().min(1).max(10),
  resolvedAt: dateInput,
  triggers: z.union([
    z.array(z.string().trim().min(1).max(120)).max(20),
    z.string().trim().max(1000),
  ]),
  notes: z.string().trim().max(2000),
}));

export const vitalCreateSchema = z.object({
  type: z.enum(['bp', 'heart_rate', 'blood_sugar', 'hba1c', 'weight', 'temperature', 'spo2']),
  value: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(40),
  systolic: z.number().int().min(40).max(300).optional(),
  diastolic: z.number().int().min(20).max(200).optional(),
  measuredAt: dateInput.optional(),
  context: z.string().trim().max(250).optional(),
  notes: optionalText(),
  source: z.string().trim().max(100).optional(),
}).superRefine((value, ctx) => {
  if (value.type === 'bp') {
    if (value.systolic == null || value.diastolic == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Blood pressure requires systolic and diastolic values' });
    } else if (value.systolic <= value.diastolic) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Systolic pressure must be greater than diastolic pressure' });
    }
  }
});

const medicationBaseSchema = z.object({
  name: z.string().trim().min(1, 'Medication name is required').max(200),
  genericName: z.string().trim().max(200).optional(),
  dosage: z.string().trim().min(1, 'Dosage is required').max(100),
  dosageUnit: z.string().trim().max(50).optional(),
  frequency: z.enum([
    'ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY',
    'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM',
  ]),
  customFrequency: z.string().trim().max(150).optional(),
  timesOfDay: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm')).max(12).optional(),
  prescribedBy: z.string().trim().max(200).optional(),
  prescribedFor: z.string().trim().max(250).optional(),
  startDate: dateInput,
  endDate: dateInput.optional(),
  currentStock: z.number().int().min(0).max(100000).optional(),
  refillThreshold: z.number().int().min(0).max(100000).optional(),
  instructions: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const medicationCreateSchema = medicationBaseSchema.superRefine((value, ctx) => {
  if (value.endDate && new Date(value.endDate).getTime() < new Date(value.startDate).getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date cannot be before start date' });
  }
  if (value.frequency === 'CUSTOM' && !value.customFrequency) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customFrequency'], message: 'Custom frequency is required' });
  }
});

export const medicationUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  dosage: z.string().trim().min(1).max(100).optional(),
  frequency: z.enum([
    'ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY',
    'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM',
  ]).optional(),
  timesOfDay: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).max(12).optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'DISCONTINUED']).optional(),
  currentStock: z.number().int().min(0).max(100000).optional(),
  endDate: dateInput.optional(),
  notes: z.string().trim().max(2000).optional(),
  instructions: z.string().trim().max(2000).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

export const medicationDoseSchema = z.object({
  status: z.enum(['taken', 'missed', 'skipped', 'TAKEN', 'MISSED', 'SKIPPED']),
  scheduledTime: dateInput.optional(),
  takenAt: dateInput.optional(),
  notes: z.string().trim().max(1000).optional(),
}).strict();

export const therapyCreateSchema = z.object({
  type: z.string().trim().min(1).max(100),
  plan: z.string().trim().min(1, 'Therapy plan is required').max(1000),
  targetValue: z.string().trim().max(100).optional(),
  currentValue: z.string().trim().max(100).optional(),
  startDate: dateInput,
  endDate: dateInput.optional(),
  notes: z.string().trim().max(2000).optional(),
}).refine((value) => !value.endDate || new Date(value.endDate).getTime() >= new Date(value.startDate).getTime(), {
  path: ['endDate'],
  message: 'End date cannot be before start date',
});

export const reportShareSchema = z.object({
  doctorId: z.string().uuid('Doctor ID must be a valid UUID'),
  expiresInDays: z.number().int().min(1).max(365).optional(),
}).strict();