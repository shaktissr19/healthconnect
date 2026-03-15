import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  doctorId:       z.string().uuid(),
  hospitalId:     z.string().uuid().optional(),
  scheduledAt:    z.string().datetime(),
  type:           z.enum(['IN_PERSON', 'TELECONSULT', 'HOME_VISIT']),
  reasonForVisit: z.string().optional(),
  symptoms:       z.array(z.string()).optional(),
  durationMinutes: z.number().int().min(15).max(120).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  scheduledAt: z.string().datetime(),
  reason:      z.string().optional(),
});

// reason is optional — frontend sends 'Patient cancelled' but we don't want to break if it's absent
export const cancelAppointmentSchema = z.object({
  reason: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status:       z.enum(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'PENDING']),
  doctorNotes:  z.string().optional(),
  followUpDate: z.string().datetime().optional(),
});
