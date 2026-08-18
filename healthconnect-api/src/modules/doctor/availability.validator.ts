import { z } from 'zod';

export const DOCTOR_AVAILABILITY_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm time format');

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const availabilitySessionSchema = z.object({
  start: time,
  end: time,
  slotDuration: z.number().int().min(15).max(120).default(30),
}).superRefine((value, ctx) => {
  if (toMinutes(value.end) <= toMinutes(value.start)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end'],
      message: 'End time must be after start time',
    });
  }
});

const daySessions = z.array(availabilitySessionSchema).max(4);

export const weeklyScheduleSchema = z.object({
  Sunday: daySessions.optional(),
  Monday: daySessions.optional(),
  Tuesday: daySessions.optional(),
  Wednesday: daySessions.optional(),
  Thursday: daySessions.optional(),
  Friday: daySessions.optional(),
  Saturday: daySessions.optional(),
}).strict().superRefine((schedule, ctx) => {
  for (const day of DOCTOR_AVAILABILITY_DAYS) {
    const sessions = [...(schedule[day] ?? [])].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let index = 1; index < sessions.length; index += 1) {
      if (toMinutes(sessions[index].start) < toMinutes(sessions[index - 1].end)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [day, index],
          message: `${day} sessions cannot overlap`,
        });
      }
    }
  }
});

const legacyDaySlot = z.object({
  enabled: z.boolean(),
  start: time,
  end: time,
  slotDuration: z.number().int().min(15).max(120).optional(),
}).superRefine((value, ctx) => {
  if (value.enabled && toMinutes(value.end) <= toMinutes(value.start)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end'],
      message: 'End time must be after start time',
    });
  }
});

const legacySlotsSchema = z.object({
  Sunday: legacyDaySlot.optional(),
  Monday: legacyDaySlot.optional(),
  Tuesday: legacyDaySlot.optional(),
  Wednesday: legacyDaySlot.optional(),
  Thursday: legacyDaySlot.optional(),
  Friday: legacyDaySlot.optional(),
  Saturday: legacyDaySlot.optional(),
}).strict();

const optionalFee = z.preprocess(
  value => value === '' || value === null || value === undefined ? value : Number(value),
  z.union([z.number().min(0).max(100000), z.null()]).optional(),
);

const feesSchema = z.object({
  inPerson: optionalFee,
  video: optionalFee,
  phone: optionalFee,
}).strict();

export const doctorAvailabilityUpdateSchema = z.object({
  weeklySchedule: weeklyScheduleSchema.optional(),
  // Backward-compatible payload used by the existing Doctor dashboard.
  slots: legacySlotsSchema.optional(),
  fees: feesSchema.optional(),
  offersInPerson: z.boolean().optional(),
  offersVideoConsult: z.boolean().optional(),
  offersAudioConsult: z.boolean().optional(),
  offersChatConsult: z.boolean().optional(),
  isAvailableOnline: z.boolean().optional(),
  isAcceptingNewPatients: z.boolean().optional(),
}).refine(
  value => Object.values(value).some(item => item !== undefined),
  'Provide at least one availability field to update',
);
