import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

export const getConsents = async (userId: string) => {
  const patient = await getPatient(userId);
  return prisma.patientConsent.findMany({
    where: { patientId: patient.id },
    include: {
      doctor: {
        select: {
          firstName: true,
          lastName: true,
          specialization: true,
          profilePhotoUrl: true,
          clinicName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const grantConsent = async (userId: string, data: {
  doctorId: string;
  accessScope: string[];
  expiresInDays?: number;
  grantReason?: string;
}) => {
  const patient = await getPatient(userId);
  const doctor = await prisma.doctorProfile.findUnique({ where: { id: data.doctorId } });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 86400000)
    : new Date(Date.now() + 90 * 86400000);

  return prisma.patientConsent.upsert({
    where: { patientId_doctorId: { patientId: patient.id, doctorId: data.doctorId } } as any,
    create: {
      patientId: patient.id,
      doctorId: data.doctorId,
      accessScope: data.accessScope,
      status: 'ACTIVE',
      grantReason: data.grantReason,
      expiresAt,
    },
    update: {
      accessScope: data.accessScope,
      status: 'ACTIVE',
      grantReason: data.grantReason,
      expiresAt,
      revokedAt: null,
    },
    include: { doctor: { select: { firstName: true, lastName: true, specialization: true } } },
  });
};

export const revokeConsent = async (userId: string, consentId: string) => {
  const patient = await getPatient(userId);
  const consent = await prisma.patientConsent.findFirst({ where: { id: consentId, patientId: patient.id } });
  if (!consent) throw ApiError.notFound('Consent not found');

  return prisma.patientConsent.update({
    where: { id: consentId },
    data: { status: 'REVOKED', revokedAt: new Date() },
  });
};

export const getSettings = async (userId: string) => {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId } });
  }
  return settings;
};

export const updateSettings = async (
  userId: string,
  data: Partial<{
    allowDoctorAccess: boolean;
    allowAnonymousPosting: boolean;
    contributeToResearch: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    appointmentReminders: boolean;
    medicationReminders: boolean;
    communityActivity: boolean;
    weeklyHealthSummary: boolean;
    language: string;
    timezone: string;
  }>,
) => {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
};
