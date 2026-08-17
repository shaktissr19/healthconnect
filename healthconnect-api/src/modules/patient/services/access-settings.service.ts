import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

export const getConsents = async (userId: string) => {
  const patient = await getPatient(userId);
  const now = new Date();

  await prisma.patientConsent.updateMany({
    where: {
      patientId: patient.id,
      status: 'ACTIVE',
      expiresAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  });

  return prisma.patientConsent.findMany({
    where: {
      patientId: patient.id,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
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
  expiresAt?: string;
  grantReason?: string;
}) => {
  const patient = await getPatient(userId);
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: data.doctorId },
    select: { id: true, userId: true, firstName: true, lastName: true, specialization: true },
  });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const expiresAt = data.expiresAt
    ? new Date(data.expiresAt)
    : new Date(Date.now() + (data.expiresInDays ?? 90) * 86400000);

  const existing = await prisma.patientConsent.findFirst({
    where: { patientId: patient.id, doctorId: data.doctorId },
    orderBy: { createdAt: 'desc' },
  });

  const consent = existing
    ? await prisma.patientConsent.update({
        where: { id: existing.id },
        data: {
          accessScope: data.accessScope,
          status: 'ACTIVE',
          grantReason: data.grantReason,
          expiresAt,
          revokedAt: null,
        },
        include: { doctor: { select: { firstName: true, lastName: true, specialization: true } } },
      })
    : await prisma.patientConsent.create({
        data: {
          patientId: patient.id,
          doctorId: data.doctorId,
          accessScope: data.accessScope,
          status: 'ACTIVE',
          grantReason: data.grantReason,
          expiresAt,
        },
        include: { doctor: { select: { firstName: true, lastName: true, specialization: true } } },
      });

  await prisma.notification.create({
    data: {
      userId: doctor.userId,
      type: 'SYSTEM',
      title: 'Patient granted health-record access',
      body: `${patient.firstName} ${patient.lastName} granted you time-limited access to their HealthConnect health profile.`,
      data: { requestType: 'ACCESS_GRANTED', patientId: patient.id, consentId: consent.id },
    },
  }).catch(() => {});

  return consent;
};

export const revokeConsent = async (userId: string, consentId: string) => {
  const patient = await getPatient(userId);
  const consent = await prisma.patientConsent.findFirst({
    where: { id: consentId, patientId: patient.id },
    include: { doctor: { select: { userId: true, firstName: true, lastName: true } } },
  });
  if (!consent) throw ApiError.notFound('Consent not found');

  const revoked = await prisma.patientConsent.update({
    where: { id: consentId },
    data: { status: 'REVOKED', revokedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: consent.doctor.userId,
      type: 'SYSTEM',
      title: 'Patient revoked health-record access',
      body: `${patient.firstName} ${patient.lastName} revoked your HealthConnect health-profile access.`,
      data: { requestType: 'ACCESS_REVOKED', patientId: patient.id, consentId },
    },
  }).catch(() => {});

  return revoked;
};

export const getSettings = async (userId: string) => {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) settings = await prisma.userSettings.create({ data: { userId } });
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
) => prisma.userSettings.upsert({
  where: { userId },
  create: { userId, ...data },
  update: data,
});
