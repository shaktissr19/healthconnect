import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { calculateHealthScore } from './healthScore.service';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// ── Simple local file storage (swap for MinIO/S3 later) ───────────────
const uploadToStorage = async (file: Express.Multer.File, folder: string) => {
  const ext     = path.extname(file.originalname);
  const fileId  = crypto.randomUUID();
  const baseDir = process.env.UPLOAD_DIR || '/var/www/healthconnect/uploads';
  const dir     = `${baseDir}/${folder}`;

  // Ensure directory exists
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = `${dir}/${fileId}${ext}`;
  fs.writeFileSync(filePath, file.buffer);

  const publicBase = process.env.FILE_PUBLIC_URL || 'https://api.healthconnect.sbs/files';
  return {
    url:      `${publicBase}/${folder}/${fileId}${ext}`,
    key:      `${folder}/${fileId}${ext}`,
    size:     file.size,
    mimeType: file.mimetype,
  };
};

// ─────────────────────────────────────────────────────────────
// HELPER — resolve PatientProfile from userId
// ─────────────────────────────────────────────────────────────
const getPatient = async (userId: string) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) throw ApiError.notFound('Patient profile not found');
  return patient;
};

// ============================================================
// OVERVIEW — Main dashboard summary
// ============================================================

export const getDashboardOverview = async (userId: string) => {
  const patient = await getPatient(userId);
  const patientId = patient.id;

  const now = new Date();
  const day30 = new Date(now.getTime() - 30 * 86400000);
  const day7  = new Date(now.getTime() - 7  * 86400000);

  // Run all queries in parallel for performance
  const [
    healthScore,
    upcomingAppointments,
    activeMedications,
    recentSymptoms,
    recentVitals,
    unreadNotifications,
    activeConditions,
    medicationAdherence,
    communityCount,
    pendingReports,
  ] = await Promise.all([
    // Health score (calculate fresh + upsert)
    calculateHealthScore(patientId),

    // Next 3 upcoming appointments
    prisma.appointment.findMany({
      where: { patientId, status: { in: ['PENDING', 'CONFIRMED'] }, scheduledAt: { gte: now } },
      orderBy: { scheduledAt: 'asc' },
      take: 3,
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true, profilePhotoUrl: true, clinicName: true, teleconsultFee: true, consultationFee: true } },
        hospital: { select: { name: true, city: true } },
      },
    }),

    // Active medications count + list
    prisma.medication.findMany({
      where: { patientId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, dosage: true, frequency: true, timesOfDay: true, currentStock: true, refillThreshold: true },
    }),

    // Symptoms logged in last 7 days
    prisma.symptomLog.findMany({
      where: { patientId, loggedAt: { gte: day7 } },
      orderBy: { loggedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, severity: true, loggedAt: true, resolvedAt: true },
    }),

    // Latest vitals (one per type)
    prisma.vital.findMany({
      where: { patientId, measuredAt: { gte: day30 } },
      orderBy: { measuredAt: 'desc' },
      distinct: ['type'],
      select: { id: true, type: true, value: true, unit: true, systolic: true, diastolic: true, measuredAt: true },
    }),

    // Unread notifications count
    prisma.notification.count({ where: { userId, isRead: false } }),

    // Active conditions
    prisma.condition.count({ where: { patientId, status: { in: ['ACTIVE', 'CHRONIC'] } } }),

    // Medication adherence last 30 days
    prisma.medicationLog.groupBy({
      by: ['status'],
      where: { medication: { patientId }, scheduledTime: { gte: day30 } },
      _count: { status: true },
    }),

    // Joined communities count
    prisma.communityMember.count({ where: { userId } }),

    // Total reports uploaded
    prisma.medicalReport.count({ where: { patientId } }),
  ]);

  // Calculate adherence %
  const totalLogs = medicationAdherence.reduce((s, g) => s + g._count.status, 0);
  const takenLogs = medicationAdherence.find(g => g.status === 'taken')?._count.status ?? 0;
  const adherencePct = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  // Medications needing refill
  const refillAlerts = activeMedications.filter(
    m => m.currentStock != null && m.refillThreshold != null && m.currentStock <= m.refillThreshold
  );

  // AI weekly insight (deterministic, based on real data)
  const insight = buildAiInsight(healthScore, adherencePct, recentSymptoms.length, upcomingAppointments.length);

  return {
    profile: {
      firstName:      patient.firstName,
      lastName:       patient.lastName,
      bloodGroup:     patient.bloodGroup,
      profilePhotoUrl: patient.profilePhotoUrl,
    },
    healthScore: {
      score:                 healthScore.score,
      medicationAdherence:   healthScore.medicationAdherence,
      symptomFrequency:      healthScore.symptomFrequency,
      appointmentRegularity: healthScore.appointmentRegularity,
      lifestyleFactors:      healthScore.lifestyleFactors,
      calculatedAt:          healthScore.calculatedAt,
      trend:                 healthScore.score >= 75 ? 'up' : healthScore.score >= 50 ? 'stable' : 'down',
    },
    kpis: {
      upcomingAppointmentsCount: upcomingAppointments.length,
      activeMedicationsCount:    activeMedications.length,
      activeConditionsCount:     activeConditions,
      recentSymptomsCount:       recentSymptoms.length,
      unreadNotifications,
      communitiesJoined:         communityCount,
      totalReports:              pendingReports,
      medicationAdherencePct:    adherencePct,
      refillAlertsCount:         refillAlerts.length,
    },
    upcomingAppointments,
    activeMedications,
    recentSymptoms,
    recentVitals,
    refillAlerts,
    aiInsight: insight,
  };
};

// Build AI insight string from real data
const buildAiInsight = (
  healthScore: { score: number; medicationAdherence: number; symptomFrequency: number },
  adherencePct: number,
  symptomsLast7Days: number,
  upcomingAppts: number,
): string => {
  const parts: string[] = [];

  if (adherencePct >= 85) {
    parts.push(`Your medication adherence is at ${adherencePct}% — excellent consistency.`);
  } else if (adherencePct >= 60) {
    parts.push(`Your medication adherence is at ${adherencePct}%. Try setting reminders for missed doses.`);
  } else {
    parts.push(`Medication adherence is at ${adherencePct}%. Missing doses regularly can affect your health score significantly.`);
  }

  if (symptomsLast7Days === 0) {
    parts.push('No new symptoms logged this week — keep it up.');
  } else if (symptomsLast7Days <= 2) {
    parts.push(`You logged ${symptomsLast7Days} symptom(s) this week. Monitor for any changes.`);
  } else {
    parts.push(`You logged ${symptomsLast7Days} symptoms this week. Consider consulting your doctor if they persist.`);
  }

  if (upcomingAppts > 0) {
    parts.push(`You have ${upcomingAppts} upcoming appointment${upcomingAppts > 1 ? 's' : ''} scheduled.`);
  } else {
    parts.push('No upcoming appointments. Regular check-ups help maintain your health score.');
  }

  return parts.join(' ');
};

// ============================================================
// PROFILE — Get & Update patient profile
// ============================================================

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

  const sub = profile.user.subscriptions[0];
  return {
    ...profile,
    email:          profile.user.email,
    registrationId: profile.user.registrationId,
    isEmailVerified: profile.user.isEmailVerified,
    memberSince:    profile.user.createdAt,
    settings:       profile.user.settings,
    subscription: sub
      ? { plan: sub.plan.displayName, tier: sub.plan.name.toUpperCase(), endDate: sub.endDate, features: sub.plan.features }
      : { plan: 'Basic', tier: 'FREE', endDate: null, features: {} },
    user: undefined, // strip nested user to avoid duplication
  };
};

export const updateProfile = async (userId: string, data: {
  firstName?: string; lastName?: string; phone?: string;
  dateOfBirth?: string; gender?: string; bloodGroup?: string;
  addressLine1?: string; addressLine2?: string; city?: string;
  state?: string; pinCode?: string; languagePreference?: string;
  insuranceProvider?: string; insurancePolicyNumber?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.patientProfile.update({
    where: { id: patient.id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      bloodGroup:  data.bloodGroup  as any,
      gender:      data.gender      as any,
    },
  });
};

// ============================================================
// EMERGENCY CONTACTS
// ============================================================

export const getEmergencyContacts = async (userId: string) => {
  const patient = await getPatient(userId);
  return prisma.emergencyContact.findMany({
    where: { patientId: patient.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
};

export const addEmergencyContact = async (userId: string, data: {
  name: string; relationship: string; phone: string; email?: string; isPrimary?: boolean;
}) => {
  const patient = await getPatient(userId);

  // If setting as primary, unset existing primary
  if (data.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { patientId: patient.id, isPrimary: true },
      data:  { isPrimary: false },
    });
  }

  return prisma.emergencyContact.create({
    data: { patientId: patient.id, ...data },
  });
};

export const updateEmergencyContact = async (userId: string, contactId: string, data: Partial<{
  name: string; relationship: string; phone: string; email: string; isPrimary: boolean;
}>) => {
  const patient = await getPatient(userId);
  const contact = await prisma.emergencyContact.findFirst({ where: { id: contactId, patientId: patient.id } });
  if (!contact) throw ApiError.notFound('Emergency contact not found');

  if (data.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { patientId: patient.id, isPrimary: true, id: { not: contactId } },
      data:  { isPrimary: false },
    });
  }

  return prisma.emergencyContact.update({ where: { id: contactId }, data });
};

export const deleteEmergencyContact = async (userId: string, contactId: string) => {
  const patient = await getPatient(userId);
  const contact = await prisma.emergencyContact.findFirst({ where: { id: contactId, patientId: patient.id } });
  if (!contact) throw ApiError.notFound('Emergency contact not found');
  await prisma.emergencyContact.delete({ where: { id: contactId } });
};

// ============================================================
// MEDICAL HISTORY — Full history across all sub-tables
// ============================================================

export const getMedicalHistory = async (userId: string) => {
  const patient = await getPatient(userId);
  const patientId = patient.id;

  const [
    conditions,
    allergies,
    surgeries,
    vaccinations,
    familyHistory,
    hospitalizationHistory,
  ] = await Promise.all([
    prisma.condition.findMany({
      where: { patientId },
      orderBy: [{ status: 'asc' }, { diagnosedDate: 'desc' }],
    }),
    prisma.allergy.findMany({
      where: { patientId },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.surgery.findMany({
      where: { patientId },
      orderBy: { surgeryDate: 'desc' },
    }),
    prisma.vaccination.findMany({
      where: { patientId },
      orderBy: { dateAdministered: 'desc' },
    }),
    prisma.familyHistory.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hospitalizationHistory.findMany({
      where: { patientId },
      orderBy: { admissionDate: 'desc' },
    }),
  ]);

  return { conditions, allergies, surgeries, vaccinations, familyHistory, hospitalizationHistory };
};

// ── Conditions ────────────────────────────────────────────────
export const addCondition = async (userId: string, data: {
  name: string; icdCode?: string; status?: string; diagnosedDate?: string;
  diagnosedBy?: string; managingDoctor?: string; notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.condition.create({
    data: {
      patientId:    patient.id,
      name:         data.name,
      icdCode:      data.icdCode,
      status:       (data.status as any) || 'ACTIVE',
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
      diagnosedBy:  data.diagnosedBy,
      managingDoctor: data.managingDoctor,
      notes:        data.notes,
    },
  });
};

export const updateCondition = async (userId: string, conditionId: string, data: Partial<{
  name: string; icdCode: string; status: string; diagnosedDate: string;
  resolvedDate: string; diagnosedBy: string; managingDoctor: string; notes: string;
}>) => {
  const patient = await getPatient(userId);
  const condition = await prisma.condition.findFirst({ where: { id: conditionId, patientId: patient.id } });
  if (!condition) throw ApiError.notFound('Condition not found');
  return prisma.condition.update({
    where: { id: conditionId },
    data: {
      ...data,
      status:        data.status       as any,
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
      resolvedDate:  data.resolvedDate  ? new Date(data.resolvedDate)  : undefined,
    },
  });
};

export const deleteCondition = async (userId: string, conditionId: string) => {
  const patient = await getPatient(userId);
  const condition = await prisma.condition.findFirst({ where: { id: conditionId, patientId: patient.id } });
  if (!condition) throw ApiError.notFound('Condition not found');
  await prisma.condition.delete({ where: { id: conditionId } });
};

// ── Allergies ─────────────────────────────────────────────────
export const addAllergy = async (userId: string, data: {
  allergen: string; category?: string; severity?: string;
  reaction?: string; diagnosedDate?: string; notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.allergy.create({
    data: {
      patientId:    patient.id,
      allergen:     data.allergen,
      category:     (data.category as any) || 'OTHER',
      severity:     (data.severity as any) || 'MILD',
      reaction:     data.reaction,
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
      notes:        data.notes,
    },
  });
};

export const updateAllergy = async (userId: string, allergyId: string, data: Partial<{
  allergen: string; category: string; severity: string; reaction: string; notes: string;
}>) => {
  const patient = await getPatient(userId);
  const allergy = await prisma.allergy.findFirst({ where: { id: allergyId, patientId: patient.id } });
  if (!allergy) throw ApiError.notFound('Allergy not found');
  return prisma.allergy.update({ where: { id: allergyId }, data: { ...data, category: data.category as any, severity: data.severity as any } });
};

export const deleteAllergy = async (userId: string, allergyId: string) => {
  const patient = await getPatient(userId);
  const allergy = await prisma.allergy.findFirst({ where: { id: allergyId, patientId: patient.id } });
  if (!allergy) throw ApiError.notFound('Allergy not found');
  await prisma.allergy.delete({ where: { id: allergyId } });
};

// ── Surgeries ────────────────────────────────────────────────
export const addSurgery = async (userId: string, data: {
  procedureName: string; surgeryDate: string; hospital?: string;
  surgeon?: string; outcome?: string; complications?: string; notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.surgery.create({
    data: { patientId: patient.id, ...data, surgeryDate: new Date(data.surgeryDate) },
  });
};

export const deleteSurgery = async (userId: string, surgeryId: string) => {
  const patient = await getPatient(userId);
  const surgery = await prisma.surgery.findFirst({ where: { id: surgeryId, patientId: patient.id } });
  if (!surgery) throw ApiError.notFound('Surgery record not found');
  await prisma.surgery.delete({ where: { id: surgeryId } });
};

// ── Vaccinations ─────────────────────────────────────────────
export const addVaccination = async (userId: string, data: {
  vaccineName: string; dateAdministered: string; doseNumber?: number;
  totalDoses?: number; nextDueDate?: string; administrator?: string;
  batchNumber?: string; sideEffects?: string; notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.vaccination.create({
    data: {
      patientId: patient.id,
      ...data,
      dateAdministered: new Date(data.dateAdministered),
      nextDueDate:      data.nextDueDate ? new Date(data.nextDueDate) : undefined,
    },
  });
};

export const deleteVaccination = async (userId: string, vaccinationId: string) => {
  const patient = await getPatient(userId);
  const vacc = await prisma.vaccination.findFirst({ where: { id: vaccinationId, patientId: patient.id } });
  if (!vacc) throw ApiError.notFound('Vaccination record not found');
  await prisma.vaccination.delete({ where: { id: vaccinationId } });
};

// ── Family History ────────────────────────────────────────────
export const addFamilyHistory = async (userId: string, data: {
  relation: string; conditionName: string; ageOfOnset?: number;
  status?: string; causeOfDeath?: string; notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.familyHistory.create({ data: { patientId: patient.id, ...data } });
};

export const deleteFamilyHistory = async (userId: string, historyId: string) => {
  const patient = await getPatient(userId);
  const entry = await prisma.familyHistory.findFirst({ where: { id: historyId, patientId: patient.id } });
  if (!entry) throw ApiError.notFound('Family history record not found');
  await prisma.familyHistory.delete({ where: { id: historyId } });
};

// ── Hospitalization History ───────────────────────────────────
export const addHospitalizationHistory = async (userId: string, data: {
  hospitalName: string; admissionDate: string; dischargeDate?: string;
  reason?: string; diagnosis?: string; treatingDoctor?: string; notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.hospitalizationHistory.create({
    data: {
      patientId: patient.id,
      ...data,
      admissionDate: new Date(data.admissionDate),
      dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : undefined,
    },
  });
};

export const deleteHospitalizationHistory = async (userId: string, historyId: string) => {
  const patient = await getPatient(userId);
  const entry = await prisma.hospitalizationHistory.findFirst({ where: { id: historyId, patientId: patient.id } });
  if (!entry) throw ApiError.notFound('Hospitalization record not found');
  await prisma.hospitalizationHistory.delete({ where: { id: historyId } });
};

// ============================================================
// SYMPTOMS TRACKER
// ============================================================

export const getSymptoms = async (
  userId: string,
  params: { page?: number; limit?: number; from?: string; to?: string; search?: string }
) => {
  const patient = await getPatient(userId);
  const { page = 1, limit = 20, from, to, search } = params;
  const skip = (page - 1) * limit;

  const where: any = { patientId: patient.id };
  if (from || to) {
    where.loggedAt = {};
    if (from) where.loggedAt.gte = new Date(from);
    if (to)   where.loggedAt.lte = new Date(to);
  }
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [symptoms, total] = await Promise.all([
    prisma.symptomLog.findMany({ where, orderBy: { loggedAt: 'desc' }, skip, take: limit }),
    prisma.symptomLog.count({ where }),
  ]);

  // Build severity trend for chart (last 30 days, daily average)
  const day30 = new Date(Date.now() - 30 * 86400000);
  const trendData = await prisma.symptomLog.findMany({
    where: { patientId: patient.id, loggedAt: { gte: day30 } },
    select: { loggedAt: true, severity: true, name: true },
    orderBy: { loggedAt: 'asc' },
  });

  // Group by date for chart
  const trendByDate: Record<string, { severities: number[]; symptoms: string[] }> = {};
  trendData.forEach(s => {
    const dateKey = s.loggedAt.toISOString().split('T')[0];
    if (!trendByDate[dateKey]) trendByDate[dateKey] = { severities: [], symptoms: [] };
    trendByDate[dateKey].severities.push(s.severity);
    trendByDate[dateKey].symptoms.push(s.name);
  });

  const trend = Object.entries(trendByDate).map(([date, d]) => ({
    date,
    avgSeverity: Math.round(d.severities.reduce((a, b) => a + b, 0) / d.severities.length * 10) / 10,
    count:       d.severities.length,
    symptoms:    [...new Set(d.symptoms)],
  }));

  return { symptoms, total, page, totalPages: Math.ceil(total / limit), trend };
};

export const logSymptom = async (userId: string, data: {
  name: string; severity: number; loggedAt?: string;
  triggers?: string[]; notes?: string;
}) => {
  const patient = await getPatient(userId);

  if (data.severity < 1 || data.severity > 10) {
    throw ApiError.badRequest('INVALID_SEVERITY', 'Severity must be between 1 and 10');
  }

  return prisma.symptomLog.create({
    data: {
      patientId: patient.id,
      name:      data.name,
      severity:  data.severity,
      loggedAt:  data.loggedAt ? new Date(data.loggedAt) : new Date(),
      triggers:  data.triggers || [],
      notes:     data.notes,
    },
  });
};

export const updateSymptom = async (userId: string, symptomId: string, data: Partial<{
  name: string; severity: number; resolvedAt: string; triggers: string[]; notes: string;
}>) => {
  const patient = await getPatient(userId);
  const symptom = await prisma.symptomLog.findFirst({ where: { id: symptomId, patientId: patient.id } });
  if (!symptom) throw ApiError.notFound('Symptom log not found');
  return prisma.symptomLog.update({
    where: { id: symptomId },
    data: { ...data, resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : undefined },
  });
};

export const deleteSymptom = async (userId: string, symptomId: string) => {
  const patient = await getPatient(userId);
  const symptom = await prisma.symptomLog.findFirst({ where: { id: symptomId, patientId: patient.id } });
  if (!symptom) throw ApiError.notFound('Symptom log not found');
  await prisma.symptomLog.delete({ where: { id: symptomId } });
};

// ============================================================
// VITALS
// ============================================================

export const getVitals = async (
  userId: string,
  params: { type?: string; from?: string; to?: string; limit?: number }
) => {
  const patient = await getPatient(userId);
  const { type, from, to, limit = 50 } = params;

  const where: any = { patientId: patient.id };
  if (type)  where.type = type;
  if (from || to) {
    where.measuredAt = {};
    if (from) where.measuredAt.gte = new Date(from);
    if (to)   where.measuredAt.lte = new Date(to);
  }

  const vitals = await prisma.vital.findMany({
    where,
    orderBy: { measuredAt: 'desc' },
    take: limit,
  });

  // Latest per type for dashboard widgets
  const latestByType = await prisma.vital.findMany({
    where: { patientId: patient.id },
    orderBy: { measuredAt: 'desc' },
    distinct: ['type'],
  });

  return { vitals, latestByType };
};

export const logVital = async (userId: string, data: {
  type: string; value: string; unit: string;
  systolic?: number; diastolic?: number;
  measuredAt?: string; context?: string; notes?: string; source?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.vital.create({
    data: {
      patientId:  patient.id,
      type:       data.type as any,
      value:      data.value,
      unit:       data.unit,
      systolic:   data.systolic,
      diastolic:  data.diastolic,
      measuredAt: data.measuredAt ? new Date(data.measuredAt) : new Date(),
      context:    data.context,
      notes:      data.notes,
      source:     data.source,
    },
  });
};

export const deleteVital = async (userId: string, vitalId: string) => {
  const patient = await getPatient(userId);
  const vital = await prisma.vital.findFirst({ where: { id: vitalId, patientId: patient.id } });
  if (!vital) throw ApiError.notFound('Vital record not found');
  await prisma.vital.delete({ where: { id: vitalId } });
};

// ============================================================
// MEDICATIONS (Treatments tab)
// ============================================================

export const getMedications = async (userId: string, params: { status?: string }) => {
  const patient = await getPatient(userId);
  const where: any = { patientId: patient.id };
  if (params.status) where.status = params.status;

  const medications = await prisma.medication.findMany({
    where,
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
    include: {
      logs: {
        orderBy: { scheduledTime: 'desc' },
        take:    7, // last 7 logs per medication
      },
    },
  });

  // Adherence stats per medication
  const day30 = new Date(Date.now() - 30 * 86400000);
  const enriched = await Promise.all(medications.map(async med => {
    const [total, taken] = await Promise.all([
      prisma.medicationLog.count({ where: { medicationId: med.id, scheduledTime: { gte: day30 } } }),
      prisma.medicationLog.count({ where: { medicationId: med.id, scheduledTime: { gte: day30 }, status: 'taken' } }),
    ]);
    const adherence = total > 0 ? Math.round((taken / total) * 100) : null;
    const needsRefill = med.currentStock != null && med.refillThreshold != null && med.currentStock <= med.refillThreshold;
    return { ...med, adherencePct: adherence, needsRefill };
  }));

  return enriched;
};

export const addMedication = async (userId: string, data: {
  name: string; genericName?: string; dosage: string; dosageUnit?: string;
  frequency: string; customFrequency?: string; timesOfDay?: string[];
  prescribedBy?: string; prescribedFor?: string; startDate: string;
  endDate?: string; currentStock?: number; refillThreshold?: number;
  instructions?: string; notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.medication.create({
    data: {
      patientId:       patient.id,
      name:            data.name,
      genericName:     data.genericName,
      dosage:          data.dosage,
      dosageUnit:      data.dosageUnit,
      frequency:       data.frequency as any,
      customFrequency: data.customFrequency,
      timesOfDay:      data.timesOfDay || [],
      prescribedBy:    data.prescribedBy,
      prescribedFor:   data.prescribedFor,
      startDate:       new Date(data.startDate),
      endDate:         data.endDate ? new Date(data.endDate) : undefined,
      status:          'ACTIVE',
      currentStock:    data.currentStock,
      refillThreshold: data.refillThreshold ?? 7,
      instructions:    data.instructions,
      notes:           data.notes,
    },
  });
};

export const updateMedication = async (userId: string, medicationId: string, data: Partial<{
  name: string; dosage: string; frequency: string; timesOfDay: string[];
  status: string; currentStock: number; endDate: string; notes: string; instructions: string;
}>) => {
  const patient = await getPatient(userId);
  const med = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!med) throw ApiError.notFound('Medication not found');
  return prisma.medication.update({
    where: { id: medicationId },
    data: {
      ...data,
      frequency: data.frequency as any,
      status:    data.status    as any,
      endDate:   data.endDate   ? new Date(data.endDate) : undefined,
    },
  });
};

export const deleteMedication = async (userId: string, medicationId: string) => {
  const patient = await getPatient(userId);
  const med = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!med) throw ApiError.notFound('Medication not found');
  // Soft delete — mark as DISCONTINUED
  return prisma.medication.update({ where: { id: medicationId }, data: { status: 'DISCONTINUED' } });
};

// ── Medication Log (mark taken/missed/skipped) ────────────────
export const logMedicationDose = async (userId: string, medicationId: string, data: {
  status: 'taken' | 'missed' | 'skipped';
  scheduledTime: string;
  takenAt?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  const med = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!med) throw ApiError.notFound('Medication not found');

  const scheduled = new Date(data.scheduledTime);

  // Upsert to avoid duplicate logs for same scheduled time
  const existing = await prisma.medicationLog.findFirst({
    where: { medicationId, scheduledTime: { gte: new Date(scheduled.getTime() - 60000), lte: new Date(scheduled.getTime() + 60000) } },
  });

  if (existing) {
    return prisma.medicationLog.update({
      where: { id: existing.id },
      data: { status: data.status, takenAt: data.takenAt ? new Date(data.takenAt) : (data.status === 'taken' ? new Date() : undefined), notes: data.notes },
    });
  }

  const log = await prisma.medicationLog.create({
    data: {
      medicationId,
      scheduledTime: scheduled,
      status:        data.status,
      takenAt:       data.takenAt ? new Date(data.takenAt) : (data.status === 'taken' ? new Date() : undefined),
      notes:         data.notes,
    },
  });

  // Decrease stock by 1 if taken
  if (data.status === 'taken' && med.currentStock != null) {
    await prisma.medication.update({
      where: { id: medicationId },
      data:  { currentStock: Math.max(0, med.currentStock - 1) },
    });
  }

  return log;
};

export const getMedicationLogs = async (userId: string, medicationId: string, params: { from?: string; to?: string }) => {
  const patient = await getPatient(userId);
  const med = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!med) throw ApiError.notFound('Medication not found');

  const where: any = { medicationId };
  if (params.from || params.to) {
    where.scheduledTime = {};
    if (params.from) where.scheduledTime.gte = new Date(params.from);
    if (params.to)   where.scheduledTime.lte = new Date(params.to);
  }

  return prisma.medicationLog.findMany({ where, orderBy: { scheduledTime: 'desc' } });
};

// ── Therapies ─────────────────────────────────────────────────
export const getTherapies = async (userId: string) => {
  const patient = await getPatient(userId);
  return prisma.therapy.findMany({
    where: { patientId: patient.id },
    orderBy: { startDate: 'desc' },
  });
};

export const addTherapy = async (userId: string, data: {
  type: string; plan: string; targetValue?: string;
  currentValue?: string; startDate: string; endDate?: string; notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.therapy.create({
    data: {
      patientId:    patient.id,
      type:         data.type,
      plan:         data.plan,
      targetValue:  data.targetValue,
      currentValue: data.currentValue,
      startDate:    new Date(data.startDate),
      endDate:      data.endDate ? new Date(data.endDate) : undefined,
      notes:        data.notes,
    },
  });
};

export const deleteTherapy = async (userId: string, therapyId: string) => {
  const patient = await getPatient(userId);
  const therapy = await prisma.therapy.findFirst({ where: { id: therapyId, patientId: patient.id } });
  if (!therapy) throw ApiError.notFound('Therapy record not found');
  await prisma.therapy.delete({ where: { id: therapyId } });
};

// ============================================================
// REPORTS VAULT
// ============================================================

export const getReports = async (
  userId: string,
  params: { type?: string; page?: number; limit?: number; search?: string }
) => {
  const patient = await getPatient(userId);
  const { type, page = 1, limit = 20, search } = params;
  const skip = (page - 1) * limit;

  const where: any = { patientId: patient.id };
  if (type)   where.type = type;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [reports, total] = await Promise.all([
    prisma.medicalReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      skip,
      take: limit,
      include: {
        shares: {
          include: { doctor: { select: { firstName: true, lastName: true, specialization: true } } },
        },
      },
    }),
    prisma.medicalReport.count({ where }),
  ]);

  // Group by type for summary
  const byType = await prisma.medicalReport.groupBy({
    by: ['type'],
    where: { patientId: patient.id },
    _count: { type: true },
  });

  return {
    reports, total, page, totalPages: Math.ceil(total / limit),
    summary: byType.map(g => ({ type: g.type, count: g._count.type })),
  };
};

export const uploadReport = async (
  userId: string,
  file: Express.Multer.File,
  data: { name: string; type?: string; description?: string; reportDate?: string }
) => {
  const patient = await getPatient(userId);

  const uploaded = await uploadToStorage(file, `reports/${patient.id}`);

  return prisma.medicalReport.create({
    data: {
      patientId:   patient.id,
      name:        data.name,
      type:        (data.type as any) || 'OTHER',
      fileUrl:     uploaded.url,
      fileSize:    uploaded.size,
      mimeType:    uploaded.mimeType,
      uploadedBy:  userId,
      description: data.description,
      reportDate:  data.reportDate ? new Date(data.reportDate) : undefined,
      isEncrypted: true,
    },
  });
};

export const deleteReport = async (userId: string, reportId: string) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({ where: { id: reportId, patientId: patient.id } });
  if (!report) throw ApiError.notFound('Report not found');
  await prisma.medicalReport.delete({ where: { id: reportId } });
};

export const shareReport = async (userId: string, reportId: string, data: { doctorId: string; expiresInDays?: number }) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({ where: { id: reportId, patientId: patient.id } });
  if (!report) throw ApiError.notFound('Report not found');

  const doctor = await prisma.doctorProfile.findUnique({ where: { id: data.doctorId } });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 86400000)
    : new Date(Date.now() + 7 * 86400000); // default 7 days

  return prisma.reportShare.upsert({
    where:  { reportId_doctorId: { reportId, doctorId: data.doctorId } },
    create: { reportId, doctorId: data.doctorId, expiresAt },
    update: { expiresAt },
    include: { doctor: { select: { firstName: true, lastName: true, specialization: true } } },
  });
};

export const revokeReportShare = async (userId: string, reportId: string, doctorId: string) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({ where: { id: reportId, patientId: patient.id } });
  if (!report) throw ApiError.notFound('Report not found');
  await prisma.reportShare.deleteMany({ where: { reportId, doctorId } });
};

// ============================================================
// HEALTH SCORE — Explicit refresh endpoint
// ============================================================

export const refreshHealthScore = async (userId: string) => {
  const patient = await getPatient(userId);
  return calculateHealthScore(patient.id);
};

export const getHealthScoreHistory = async (userId: string) => {
  const patient = await getPatient(userId);
  // Return current score — for trend history, you'd extend the schema with snapshots
  // For now return current score + component breakdown
  const score = await prisma.healthScore.findUnique({ where: { patientId: patient.id } });
  if (!score) {
    return calculateHealthScore(patient.id);
  }
  return score;
};

// ============================================================
// CONSENTS — Doctor access management
// ============================================================

export const getConsents = async (userId: string) => {
  const patient = await getPatient(userId);
  return prisma.patientConsent.findMany({
    where: { patientId: patient.id },
    include: {
      doctor: {
        select: { firstName: true, lastName: true, specialization: true, profilePhotoUrl: true, clinicName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const grantConsent = async (userId: string, data: {
  doctorId: string; accessScope: string[]; expiresInDays?: number; grantReason?: string;
}) => {
  const patient = await getPatient(userId);
  const doctor = await prisma.doctorProfile.findUnique({ where: { id: data.doctorId } });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 86400000)
    : new Date(Date.now() + 90 * 86400000); // default 90 days

  return prisma.patientConsent.upsert({
    where: { patientId_doctorId: { patientId: patient.id, doctorId: data.doctorId } } as any,
    create: {
      patientId:   patient.id,
      doctorId:    data.doctorId,
      accessScope: data.accessScope,
      status:      'ACTIVE',
      grantReason: data.grantReason,
      expiresAt,
    },
    update: {
      accessScope: data.accessScope,
      status:      'ACTIVE',
      grantReason: data.grantReason,
      expiresAt,
      revokedAt:   null,
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
    data:  { status: 'REVOKED', revokedAt: new Date() },
  });
};

// ============================================================
// SETTINGS
// ============================================================

export const getSettings = async (userId: string) => {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    // Auto-create with defaults
    settings = await prisma.userSettings.create({ data: { userId } });
  }
  return settings;
};

export const updateSettings = async (userId: string, data: Partial<{
  allowDoctorAccess: boolean; allowAnonymousPosting: boolean; contributeToResearch: boolean;
  emailNotifications: boolean; smsNotifications: boolean; pushNotifications: boolean;
  appointmentReminders: boolean; medicationReminders: boolean; communityActivity: boolean;
  weeklyHealthSummary: boolean; language: string; timezone: string;
}>) => {
  return prisma.userSettings.upsert({
    where:  { userId },
    create: { userId, ...data },
    update: data,
  });
};
