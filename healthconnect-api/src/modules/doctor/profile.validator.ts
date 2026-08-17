import { z } from 'zod';

const currentYear = new Date().getFullYear();

const optionalTrimmed = (max: number) => z.preprocess(
  (value) => value === '' ? null : value,
  z.union([z.string().trim().max(max), z.null()]).optional(),
);

const optionalUrl = z.preprocess(
  (value) => value === '' ? null : value,
  z.union([z.string().trim().url('Use a valid URL').max(1000), z.null()]).optional(),
);

// Existing uploads may be stored as a site-relative path while newer callers
// can provide an absolute URL. Accept both without weakening other URL fields.
const optionalAssetUrl = z.preprocess(
  (value) => value === '' ? null : value,
  z.union([
    z.string().trim().max(1000).refine(
      value => /^https?:\/\//i.test(value) || /^\/(?!\/)[^\s]*$/.test(value),
      'Use a valid image URL or site-relative path',
    ),
    z.null(),
  ]).optional(),
);

const optionalNumber = (min: number, max: number, integer = false) => z.preprocess(
  (value) => value === '' || value === null || value === undefined ? value : Number(value),
  z.union([
    integer ? z.number().int().min(min).max(max) : z.number().min(min).max(max),
    z.null(),
  ]).optional(),
);

const optionalBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean().optional());

const stringList = (itemMax = 180, maxItems = 30) => z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return [];
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return value;
}, z.array(z.string().trim().min(1).max(itemMax)).max(maxItems).optional());

const optionalDateOfBirth = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return value instanceof Date ? value : new Date(String(value));
}, z.union([
  z.date()
    .min(new Date('1900-01-01T00:00:00.000Z'), 'Date of birth is not valid')
    .max(new Date(), 'Date of birth cannot be in the future'),
  z.null(),
]).optional());

const optionalDateTime = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return value instanceof Date ? value : new Date(String(value));
}, z.union([z.date(), z.null()]).optional());

const gender = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return String(value).trim().toUpperCase().replace(/\s+/g, '_');
}, z.union([
  z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  z.null(),
]).optional());

const indianPhone = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}, z.union([
  z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  z.null(),
]).optional());

const pinCode = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return String(value).replace(/\D/g, '');
}, z.union([
  z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit Indian PIN code'),
  z.null(),
]).optional());

const availabilitySchedule = z.preprocess((value) => {
  if (value === '' || value === null) return null;
  return value;
}, z.union([
  z.record(z.string(), z.unknown()),
  z.null(),
]).optional());

const rawProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100).optional(),
  phone: indianPhone,
  dateOfBirth: optionalDateOfBirth,
  gender,
  profilePhotoUrl: optionalAssetUrl,

  specialization: optionalTrimmed(160),
  subSpecializations: stringList(160, 20),
  qualification: stringList(180, 30),
  experienceYears: optionalNumber(0, 80, true),
  medicalLicenseNumber: optionalTrimmed(120),
  licenseState: optionalTrimmed(120),
  medicalCouncil: optionalTrimmed(180),
  registrationYear: optionalNumber(1900, currentYear, true),

  consultationFee: optionalNumber(0, 100000),
  teleconsultFee: optionalNumber(0, 100000),
  videoConsultFee: optionalNumber(0, 100000),
  audioConsultFee: optionalNumber(0, 100000),
  offersInPerson: optionalBoolean,
  offersVideoConsult: optionalBoolean,
  offersAudioConsult: optionalBoolean,
  offersChatConsult: optionalBoolean,
  videoPlatform: optionalTrimmed(120),
  videoRoomBaseUrl: optionalUrl,

  languagesSpoken: stringList(80, 20),
  clinicName: optionalTrimmed(250),
  clinicAddress: optionalTrimmed(500),
  city: optionalTrimmed(120),
  state: optionalTrimmed(120),
  pinCode,

  bio: optionalTrimmed(3000),
  careerJourney: optionalTrimmed(5000),
  trainingHospitals: stringList(250, 30),
  hospitalAffiliations: stringList(250, 30),
  awards: stringList(300, 30),
  publications: optionalNumber(0, 10000, true),

  isAvailableOnline: optionalBoolean,
  isAcceptingNewPatients: optionalBoolean,
  availabilitySchedule,
  nextAvailableSlot: optionalDateTime,
  featuredReview: optionalTrimmed(2000),
  featuredPatientName: optionalTrimmed(160),

  // Legacy aliases accepted for backwards-compatible callers.
  experience: optionalNumber(0, 80, true),
  languages: stringList(80, 20),
  hospitalAffiliation: optionalTrimmed(250),
}).transform((value) => {
  const {
    experience,
    languages,
    hospitalAffiliation,
    ...canonical
  } = value;

  return {
    ...canonical,
    experienceYears: canonical.experienceYears ?? experience,
    languagesSpoken: canonical.languagesSpoken ?? languages,
    hospitalAffiliations: canonical.hospitalAffiliations
      ?? (hospitalAffiliation ? [hospitalAffiliation] : undefined),
  };
});

// Unknown legacy fields continue to be stripped/no-op rather than becoming
// a new breaking 400 response. Every recognized profile field is validated.
export const doctorProfileUpdateSchema = rawProfileSchema;

export const doctorAvailabilityUpdateSchema = z.object({
  schedule: availabilitySchedule,
  availabilitySchedule,
  nextAvailableSlot: optionalDateTime,
  isAvailableOnline: optionalBoolean,
  isAcceptingNewPatients: optionalBoolean,
}).transform(value => ({
  availabilitySchedule: value.availabilitySchedule !== undefined
    ? value.availabilitySchedule
    : value.schedule,
  nextAvailableSlot: value.nextAvailableSlot,
  isAvailableOnline: value.isAvailableOnline,
  isAcceptingNewPatients: value.isAcceptingNewPatients,
})).refine(
  value => Object.values(value).some(item => item !== undefined),
  'Provide at least one availability field to update',
);

export const doctorConsultationModesSchema = z.object({
  offersInPerson: optionalBoolean,
  offersVideoConsult: optionalBoolean,
  offersAudioConsult: optionalBoolean,
  offersChatConsult: optionalBoolean,
  consultationFee: optionalNumber(0, 100000),
  teleconsultFee: optionalNumber(0, 100000),
  videoConsultFee: optionalNumber(0, 100000),
  audioConsultFee: optionalNumber(0, 100000),
  videoPlatform: optionalTrimmed(120),
  videoRoomBaseUrl: optionalUrl,
}).refine(
  value => Object.values(value).some(item => item !== undefined),
  'Provide at least one consultation field to update',
);
