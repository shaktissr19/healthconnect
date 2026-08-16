import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

export type PatientProfileSection = 'PERSONAL' | 'CONTACT' | 'EMERGENCY';

export interface ProfileCompletionItem {
  key: string;
  label: string;
  section: PatientProfileSection;
  complete: boolean;
}

export interface PatientProfileCompletion {
  coreComplete: boolean;
  percentage: number;
  completedCount: number;
  totalCount: number;
  missingCount: number;
  missing: ProfileCompletionItem[];
  nextStep: ProfileCompletionItem | null;
  sections: {
    personal: { completed: number; total: number; complete: boolean };
    contact: { completed: number; total: number; complete: boolean };
    emergency: { completed: number; total: number; complete: boolean };
  };
}

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

export const calculateProfileCompletion = (profile: {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  phone?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  emergencyContacts?: Array<{
    name?: string | null;
    relationship?: string | null;
    phone?: string | null;
    isPrimary?: boolean | null;
  }>;
}): PatientProfileCompletion => {
  // Core Profile Completion is intentionally limited to stable patient-profile data.
  // Account/security data (email, verification, password, subscription) and clinical
  // health data (conditions, allergies, medications, vitals, Health Score) are excluded.
  const items: ProfileCompletionItem[] = [
    {
      key: 'name',
      label: 'First and last name',
      section: 'PERSONAL',
      complete: hasText(profile.firstName) && hasText(profile.lastName),
    },
    {
      key: 'dateOfBirth',
      label: 'Date of birth',
      section: 'PERSONAL',
      complete: Boolean(profile.dateOfBirth),
    },
    {
      key: 'gender',
      label: 'Gender',
      section: 'PERSONAL',
      complete: Boolean(profile.gender),
    },
    {
      key: 'phone',
      label: 'Mobile number',
      section: 'CONTACT',
      complete: hasText(profile.phone),
    },
    {
      key: 'city',
      label: 'City',
      section: 'CONTACT',
      complete: hasText(profile.city),
    },
    {
      key: 'district',
      label: 'District',
      section: 'CONTACT',
      complete: hasText(profile.district),
    },
    {
      key: 'state',
      label: 'State / UT',
      section: 'CONTACT',
      complete: hasText(profile.state),
    },
    {
      key: 'primaryEmergencyContact',
      label: 'Primary emergency contact',
      section: 'EMERGENCY',
      complete: Boolean(profile.emergencyContacts?.some((contact) =>
        contact.isPrimary &&
        hasText(contact.name) &&
        hasText(contact.relationship) &&
        hasText(contact.phone),
      )),
    },
  ];

  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const missing = items.filter((item) => !item.complete);

  const sectionSummary = (section: PatientProfileSection) => {
    const sectionItems = items.filter((item) => item.section === section);
    const completed = sectionItems.filter((item) => item.complete).length;
    return {
      completed,
      total: sectionItems.length,
      complete: completed === sectionItems.length,
    };
  };

  return {
    coreComplete: completedCount === totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    missingCount: missing.length,
    missing,
    nextStep: missing[0] ?? null,
    sections: {
      personal: sectionSummary('PERSONAL'),
      contact: sectionSummary('CONTACT'),
      emergency: sectionSummary('EMERGENCY'),
    },
  };
};

const parseDateOnlyUtc = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const nullableText = (value: string | null | undefined) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const getProfile = async (userId: string) => {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId },
    include: {
      emergencyContacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
      _count: {
        select: {
          conditions: true,
          allergies: true,
          medications: true,
          vitals: true,
        },
      },
      user: {
        select: {
          email: true,
          registrationId: true,
          isEmailVerified: true,
          createdAt: true,
          settings: true,
          subscriptions: {
            where: { status: 'ACTIVE', endDate: { gt: new Date() } },
            include: { plan: { select: { displayName: true, name: true, features: true } } },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!profile) throw ApiError.notFound('Patient profile not found');

  const [activeMedicationCount, latestVital] = await Promise.all([
    prisma.medication.count({ where: { patientId: profile.id, status: 'ACTIVE' } }),
    prisma.vital.findFirst({
      where: { patientId: profile.id },
      orderBy: { measuredAt: 'desc' },
      select: { measuredAt: true },
    }),
  ]);

  const subscription = profile.user.subscriptions[0];
  const completion = calculateProfileCompletion(profile);

  return {
    ...profile,
    email: profile.user.email,
    registrationId: profile.user.registrationId,
    isEmailVerified: profile.user.isEmailVerified,
    memberSince: profile.user.createdAt,
    settings: profile.user.settings,
    completion,
    medicalSnapshot: {
      conditionsCount: profile._count.conditions,
      allergiesCount: profile._count.allergies,
      medicationsCount: profile._count.medications,
      activeMedicationsCount: activeMedicationCount,
      vitalsCount: profile._count.vitals,
      latestVitalAt: latestVital?.measuredAt ?? null,
    },
    subscription: subscription
      ? {
          plan: subscription.plan.displayName,
          tier: subscription.plan.name.toUpperCase(),
          endDate: subscription.endDate,
          features: subscription.plan.features,
        }
      : { plan: 'Basic', tier: 'FREE', endDate: null, features: {} },
    _count: undefined,
    user: undefined,
  };
};

export interface PatientProfileUpdateInput {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  preferredName?: string | null;
  phone?: string;
  alternatePhone?: string | null;
  dateOfBirth?: string;
  gender?: string;
  preferredPronouns?: string | null;
  maritalStatus?: string | null;
  bloodGroup?: string;
  rhFactor?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string | null;
  country?: string;
  languagePreference?: string;
  secondaryLanguages?: string[];
  preferredContactMethod?: string | null;
  accessibilityNeeds?: string[];
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceExpiry?: string | null;
  governmentScheme?: string | null;
  governmentSchemeId?: string | null;
}

export const updateProfile = async (userId: string, data: PatientProfileUpdateInput) => {
  const patient = await getPatient(userId);

  // Explicit whitelist: never spread an arbitrary request body into Prisma.
  await prisma.patientProfile.update({
    where: { id: patient.id },
    data: {
      firstName: data.firstName?.trim(),
      middleName: nullableText(data.middleName),
      lastName: data.lastName?.trim(),
      preferredName: nullableText(data.preferredName),
      phone: data.phone,
      alternatePhone: nullableText(data.alternatePhone),
      dateOfBirth: data.dateOfBirth ? parseDateOnlyUtc(data.dateOfBirth) : undefined,
      gender: data.gender as any,
      preferredPronouns: nullableText(data.preferredPronouns),
      maritalStatus: nullableText(data.maritalStatus),
      bloodGroup: data.bloodGroup as any,
      rhFactor: data.rhFactor as any,
      addressLine1: nullableText(data.addressLine1),
      addressLine2: nullableText(data.addressLine2),
      city: data.city?.trim(),
      district: data.district?.trim(),
      state: data.state?.trim(),
      pinCode: nullableText(data.pinCode),
      country: data.country?.trim(),
      languagePreference: data.languagePreference?.trim(),
      secondaryLanguages: data.secondaryLanguages,
      preferredContactMethod: nullableText(data.preferredContactMethod),
      accessibilityNeeds: data.accessibilityNeeds,
      insuranceProvider: nullableText(data.insuranceProvider),
      insurancePolicyNumber: nullableText(data.insurancePolicyNumber),
      insuranceExpiry: data.insuranceExpiry === undefined
        ? undefined
        : data.insuranceExpiry === null
          ? null
          : parseDateOnlyUtc(data.insuranceExpiry),
      governmentScheme: nullableText(data.governmentScheme),
      governmentSchemeId: nullableText(data.governmentSchemeId),
    },
  });

  // Returning the canonical profile immediately keeps completion state in sync after saves.
  return getProfile(userId);
};

export const getEmergencyContacts = async (userId: string) => {
  const patient = await getPatient(userId);
  return prisma.emergencyContact.findMany({
    where: { patientId: patient.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
};

export const addEmergencyContact = async (userId: string, data: {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  isPrimary?: boolean;
}) => {
  const patient = await getPatient(userId);
  const contactCount = await prisma.emergencyContact.count({ where: { patientId: patient.id } });
  const shouldBePrimary = data.isPrimary === true || contactCount === 0;

  if (shouldBePrimary) {
    await prisma.emergencyContact.updateMany({
      where: { patientId: patient.id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.emergencyContact.create({
    data: {
      patientId: patient.id,
      name: data.name.trim(),
      relationship: data.relationship.trim(),
      phone: data.phone,
      alternatePhone: nullableText(data.alternatePhone),
      email: nullableText(data.email),
      isPrimary: shouldBePrimary,
    },
  });
};

export const updateEmergencyContact = async (
  userId: string,
  contactId: string,
  data: Partial<{
    name: string;
    relationship: string;
    phone: string;
    alternatePhone: string | null;
    email: string | null;
    isPrimary: boolean;
  }>,
) => {
  const patient = await getPatient(userId);
  const contact = await prisma.emergencyContact.findFirst({
    where: { id: contactId, patientId: patient.id },
  });
  if (!contact) throw ApiError.notFound('Emergency contact not found');

  if (data.isPrimary === true) {
    await prisma.emergencyContact.updateMany({
      where: { patientId: patient.id, isPrimary: true, id: { not: contactId } },
      data: { isPrimary: false },
    });
  }

  let isPrimary = data.isPrimary;
  if (contact.isPrimary && data.isPrimary === false) {
    const replacement = await prisma.emergencyContact.findFirst({
      where: { patientId: patient.id, id: { not: contactId } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (replacement) {
      await prisma.emergencyContact.update({
        where: { id: replacement.id },
        data: { isPrimary: true },
      });
    } else {
      isPrimary = true;
    }
  }

  return prisma.emergencyContact.update({
    where: { id: contactId },
    data: {
      name: data.name?.trim(),
      relationship: data.relationship?.trim(),
      phone: data.phone,
      alternatePhone: nullableText(data.alternatePhone),
      email: nullableText(data.email),
      isPrimary,
    },
  });
};

export const deleteEmergencyContact = async (userId: string, contactId: string) => {
  const patient = await getPatient(userId);
  const contact = await prisma.emergencyContact.findFirst({
    where: { id: contactId, patientId: patient.id },
  });
  if (!contact) throw ApiError.notFound('Emergency contact not found');

  await prisma.$transaction(async (tx) => {
    await tx.emergencyContact.delete({ where: { id: contactId } });

    if (contact.isPrimary) {
      const replacement = await tx.emergencyContact.findFirst({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (replacement) {
        await tx.emergencyContact.update({
          where: { id: replacement.id },
          data: { isPrimary: true },
        });
      }
    }
  });
};
