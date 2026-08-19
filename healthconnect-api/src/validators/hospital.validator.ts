import { z } from 'zod';

const emptyToUndefined = (value: unknown) => value === '' ? undefined : value;
const optionalString = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().trim().max(500).url('Must be a valid URL').optional());
const optionalPhone = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(20).regex(/^[+0-9()\-\s]{7,20}$/, 'Invalid phone number').optional(),
);
const optionalNumber = (min: number, max: number) => z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(min).max(max).optional(),
);
const stringList = (maxItems = 100) => z.array(z.string().trim().min(1).max(160)).max(maxItems).optional();

export const hospitalProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  phone: optionalPhone,
  email: z.preprocess(emptyToUndefined, z.string().trim().email().max(254).optional()),
  website: optionalUrl,
  logoUrl: optionalUrl,
  galleryUrls: z.array(z.string().url().max(500)).max(12).optional(),
  about: optionalString(4000),
  hospitalType: z.enum(['GOVERNMENT', 'PRIVATE', 'TRUST_NGO', 'TEACHING', 'CHARITABLE', 'OTHER']).optional(),
  addressLine1: optionalString(250),
  city: optionalString(100),
  state: optionalString(100),
  pinCode: z.preprocess(emptyToUndefined, z.string().trim().regex(/^\d{6}$/, 'PIN code must be 6 digits').optional()),
  latitude: z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional()),
  longitude: z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional()),
  totalBeds: optionalNumber(0, 100000),
  icuBeds: optionalNumber(0, 100000),
  emergencyAvailable: z.coerce.boolean().optional(),
  teleconsultAvailable: z.coerce.boolean().optional(),
  opdTimings: optionalString(250),
  specialties: stringList(),
  accreditations: stringList(),
  facilities: stringList(200),
  insuranceProviders: stringList(200),
  governmentSchemes: stringList(100),
  registrationNumber: optionalString(120),
  registrationAuthority: optionalString(160),
  authorizedContactName: optionalString(160),
  authorizedContactPhone: optionalPhone,
}).strict().refine(
  value => value.totalBeds === undefined || value.icuBeds === undefined || value.icuBeds <= value.totalBeds,
  { message: 'ICU beds cannot exceed total beds', path: ['icuBeds'] },
);

export const hospitalVerificationSubmitSchema = z.object({
  verificationDocuments: z.array(z.string().trim().url().max(500)).min(1).max(12),
}).strict();

export const hospitalDoctorInviteSchema = z.object({
  email: z.string().trim().email().max(254),
  department: optionalString(120),
  isPrimary: z.coerce.boolean().optional().default(false),
}).strict();

export const hospitalDepartmentCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  headName: optionalString(120),
  phone: optionalPhone,
}).strict();

export const hospitalDepartmentUpdateSchema = hospitalDepartmentCreateSchema.partial().refine(
  value => Object.keys(value).length > 0,
  'At least one field is required',
);

const hospitalScheduleRow = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  slotDuration: z.number().int().min(10).max(120).optional().default(30),
  isActive: z.boolean().optional().default(true),
}).strict();

export const hospitalDoctorAvailabilitySchema = z.object({
  schedule: z.array(hospitalScheduleRow).max(50),
}).strict();

export const hospitalAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED']),
  reason: optionalString(1000),
}).strict();

export const hospitalAppointmentRescheduleSchema = z.object({
  scheduledAt: z.string().datetime().refine(value => new Date(value).getTime() > Date.now(), 'Appointment time must be in the future'),
}).strict();

export const hospitalReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: optionalString(120),
  comment: optionalString(3000),
  isAnonymous: z.boolean().optional().default(false),
}).strict();
