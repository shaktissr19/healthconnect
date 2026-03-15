import { z } from 'zod';

export const doctorSearchSchema = z.object({
  specialization: z.string().optional(),
  city: z.string().optional(),
  pinCode: z.string().optional(),
  language: z.string().optional(),
  minRating: z.string().optional(),
  maxFee: z.string().optional(),
  available: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const doctorProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  subSpecializations: z.array(z.string()).optional(),
  qualification: z.array(z.string()).optional(),
  experienceYears: z.number().int().positive().optional(),
  consultationFee: z.number().positive().optional(),
  teleconsultFee: z.number().positive().optional(),
  languagesSpoken: z.array(z.string()).optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  bio: z.string().optional(),
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().int().min(15).max(120).optional(),
});
