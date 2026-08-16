import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

export const getProfile = async (userId: string) => {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId },
    include: {
      emergencyContacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
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

  const subscription = profile.user.subscriptions[0];
  return {
    ...profile,
    email: profile.user.email,
    registrationId: profile.user.registrationId,
    isEmailVerified: profile.user.isEmailVerified,
    memberSince: profile.user.createdAt,
    settings: profile.user.settings,
    subscription: subscription
      ? {
          plan: subscription.plan.displayName,
          tier: subscription.plan.name.toUpperCase(),
          endDate: subscription.endDate,
          features: subscription.plan.features,
        }
      : { plan: 'Basic', tier: 'FREE', endDate: null, features: {} },
    user: undefined,
  };
};

export const updateProfile = async (userId: string, data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  languagePreference?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.patientProfile.update({
    where: { id: patient.id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      bloodGroup: data.bloodGroup as any,
      gender: data.gender as any,
    },
  });
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
  email?: string;
  isPrimary?: boolean;
}) => {
  const patient = await getPatient(userId);

  if (data.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { patientId: patient.id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.emergencyContact.create({
    data: { patientId: patient.id, ...data },
  });
};

export const updateEmergencyContact = async (
  userId: string,
  contactId: string,
  data: Partial<{ name: string; relationship: string; phone: string; email: string; isPrimary: boolean }>,
) => {
  const patient = await getPatient(userId);
  const contact = await prisma.emergencyContact.findFirst({
    where: { id: contactId, patientId: patient.id },
  });
  if (!contact) throw ApiError.notFound('Emergency contact not found');

  if (data.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { patientId: patient.id, isPrimary: true, id: { not: contactId } },
      data: { isPrimary: false },
    });
  }

  return prisma.emergencyContact.update({ where: { id: contactId }, data });
};

export const deleteEmergencyContact = async (userId: string, contactId: string) => {
  const patient = await getPatient(userId);
  const contact = await prisma.emergencyContact.findFirst({
    where: { id: contactId, patientId: patient.id },
  });
  if (!contact) throw ApiError.notFound('Emergency contact not found');
  await prisma.emergencyContact.delete({ where: { id: contactId } });
};
