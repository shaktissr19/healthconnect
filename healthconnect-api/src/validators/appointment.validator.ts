import { z } from 'zod';

const futureDateTime = z.string().datetime().refine(
  value => new Date(value).getTime() > Date.now(),
  'Appointment time must be in the future',
);

// HealthConnect normally generates UUID primary keys, but production also
// contains intentionally seeded/legacy IDs such as `seed-dp-001`. Route
// validation must accept IDs that already exist in our database rather than
// rejecting them before the service layer can perform the authoritative lookup.
// Keep the accepted format deliberately narrow: letters, digits, `_` and `-`.
const entityId = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid entity ID');

export const bookAppointmentSchema = z.object({
  doctorId:       entityId,
  hospitalId:     entityId.optional(),
  scheduledAt:    futureDateTime,
  type:           z.enum(['IN_PERSON', 'TELECONSULT', 'HOME_VISIT']),
  reasonForVisit: z.string().trim().max(1000).optional(),
  symptoms:       z.array(z.string().trim().min(1).max(200)).max(30).optional(),
  durationMinutes: z.number().int().min(15).max(120).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  scheduledAt: futureDateTime,
  reason:      z.string().trim().max(1000).optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
  cancellationReason: z.string().trim().max(1000).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status:       z.enum(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'PENDING']),
  doctorNotes:  z.string().trim().max(4000).optional(),
  followUpDate: z.string().datetime().optional(),
});
