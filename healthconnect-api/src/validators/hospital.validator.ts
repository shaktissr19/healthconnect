import { z } from 'zod';

const emptyToUndefined = (value: unknown) => value === '' ? undefined : value;
const optionalString = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(500).url('Must be a valid URL').optional(),
);
const optionalPhone = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(20).regex(/^[+0-9()\-\s]{7,20}$/, 'Invalid phone number').optional(),
);
const optionalNumber = (min: number, max: number) => z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(min).max(max).optional(),
);

export const hospitalProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  phone: optionalPhone,
  email: z.preprocess(emptyToUndefined, z.string().trim().email().max(254).optional()),
  website: optionalUrl,
  logoUrl: optionalUrl,
  addressLine1: optionalString(250),
  city: optionalString(100),
  state: optionalString(100),
  pinCode: z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(/^\d{6}$/, 'PIN code must be 6 digits').optional(),
  ),
  latitude: z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional()),
  longitude: z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional()),
  totalBeds: optionalNumber(0, 100000),
  icuBeds: optionalNumber(0, 100000),
  emergencyAvailable: z.coerce.boolean().optional(),
  opdTimings: optionalString(250),
  specialties: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
  accreditations: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
}).strict().refine(
  value => value.totalBeds === undefined || value.icuBeds === undefined || value.icuBeds <= value.totalBeds,
  { message: 'ICU beds cannot exceed total beds', path: ['icuBeds'] },
);

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
