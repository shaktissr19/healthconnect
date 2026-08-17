import { z } from 'zod';

const futureDateTime = z.string().datetime().refine(
  value => new Date(value).getTime() > Date.now(),
  'Appointment time must be in the future',
);

export const bookAppointmentSchema = z.object({
  doctorId:       z.string().uuid(),
  hospitalId:     z.string().uuid().optional(),
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
