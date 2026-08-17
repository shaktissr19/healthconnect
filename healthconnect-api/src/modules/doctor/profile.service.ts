import { prisma } from '../../lib/prisma';

export type DoctorProfileCompletion = {
  percentage: number;
  completed: number;
  total: number;
  missing: Array<{ key: string; label: string }>;
};

type Requirement = {
  key: string;
  label: string;
  complete: (profile: any) => boolean;
};

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const hasList = (value: unknown) => Array.isArray(value) && value.some(item => hasText(item));
const hasNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const normalizeIndianPhone = (value: unknown) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};
const hasValidIndianPhone = (value: unknown) => /^[6-9]\d{9}$/.test(normalizeIndianPhone(value));

// Core completion is intentionally limited to essential identity/professional data.
// Narrative, consultation, availability and social-proof fields remain optional.
export const DOCTOR_CORE_REQUIREMENTS: Requirement[] = [
  { key: 'firstName', label: 'First name', complete: profile => hasText(profile.firstName) },
  { key: 'lastName', label: 'Last name', complete: profile => hasText(profile.lastName) },
  { key: 'phone', label: 'Valid Indian mobile number', complete: profile => hasValidIndianPhone(profile.phone) },
  { key: 'dateOfBirth', label: 'Date of birth', complete: profile => Boolean(profile.dateOfBirth) },
  { key: 'gender', label: 'Gender', complete: profile => Boolean(profile.gender) },
  { key: 'specialization', label: 'Specialization', complete: profile => hasText(profile.specialization) },
  { key: 'qualification', label: 'At least one qualification', complete: profile => hasList(profile.qualification) },
  { key: 'experienceYears', label: 'Years of experience', complete: profile => hasNumber(profile.experienceYears) && profile.experienceYears >= 0 },
  { key: 'medicalLicenseNumber', label: 'Medical registration / license number', complete: profile => hasText(profile.medicalLicenseNumber) },
  { key: 'medicalCouncil', label: 'Medical council', complete: profile => hasText(profile.medicalCouncil) },
  { key: 'city', label: 'Practice city', complete: profile => hasText(profile.city) },
  { key: 'state', label: 'Practice state', complete: profile => hasText(profile.state) },
];

export function computeDoctorProfileCompletion(profile: any): DoctorProfileCompletion {
  const missing = DOCTOR_CORE_REQUIREMENTS
    .filter(requirement => !requirement.complete(profile))
    .map(({ key, label }) => ({ key, label }));

  const total = DOCTOR_CORE_REQUIREMENTS.length;
  const completed = total - missing.length;
  const percentage = total === 0 ? 100 : Math.round((completed / total) * 100);

  return { percentage, completed, total, missing };
}

export function canonicalDoctorVerification(profile: any): boolean {
  if (profile.verificationStatus === 'SUSPENDED' || profile.verificationStatus === 'REJECTED') return false;
  return profile.verificationStatus === 'VERIFIED' || Boolean(profile.isVerified);
}

export async function getOwnDoctorProfile(userId: string) {
  const profile = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          email: true,
          registrationId: true,
          isEmailVerified: true,
        },
      },
    },
  });

  if (!profile) return null;

  const completion = computeDoctorProfileCompletion(profile);
  return {
    ...profile,
    email: profile.user.email,
    registrationId: profile.user.registrationId,
    isEmailVerified: profile.user.isEmailVerified,
    isVerified: canonicalDoctorVerification(profile),
    profileCompletion: completion,
    user: undefined,
  };
}

export async function updateOwnDoctorProfile(userId: string, input: Record<string, unknown>) {
  const existing = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!existing) return null;

  const merged = { ...existing, ...input };
  const completion = computeDoctorProfileCompletion(merged);
  const changedFields = Object.keys(input);

  const updated = await prisma.doctorProfile.update({
    where: { userId },
    data: {
      ...(input as any),
      profileScore: completion.percentage,
      isProfileComplete: completion.percentage === 100,
    },
  });

  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DOCTOR_PROFILE_UPDATED',
        entityType: 'DoctorProfile',
        entityId: updated.id,
        metadata: {
          changedFields,
          profileCompletion: completion.percentage,
        },
      },
    }).catch(() => undefined);
  }

  return getOwnDoctorProfile(userId);
}

export async function syncDoctorProfileCompletion(userId: string) {
  const existing = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!existing) return null;

  const completion = computeDoctorProfileCompletion(existing);
  if (
    existing.profileScore !== completion.percentage
    || existing.isProfileComplete !== (completion.percentage === 100)
  ) {
    await prisma.doctorProfile.update({
      where: { userId },
      data: {
        profileScore: completion.percentage,
        isProfileComplete: completion.percentage === 100,
      },
    });
  }

  return completion;
}
