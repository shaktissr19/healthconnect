import { calculateHealthScore } from '../../health-score/service';
import { getPatient, prisma } from './_shared';

export const getDashboardOverview = async (userId: string) => {
  const patient = await getPatient(userId);
  const patientId = patient.id;

  const now = new Date();
  const day30 = new Date(now.getTime() - 30 * 86400000);
  const day7 = new Date(now.getTime() - 7 * 86400000);

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
    totalReports,
  ] = await Promise.all([
    calculateHealthScore(patientId),
    prisma.appointment.findMany({
      where: { patientId, status: { in: ['PENDING', 'CONFIRMED'] }, scheduledAt: { gte: now } },
      orderBy: { scheduledAt: 'asc' },
      take: 3,
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true, profilePhotoUrl: true, clinicName: true, teleconsultFee: true, consultationFee: true } },
        hospital: { select: { name: true, city: true } },
      },
    }),
    prisma.medication.findMany({
      where: { patientId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, dosage: true, frequency: true, timesOfDay: true, currentStock: true, refillThreshold: true },
    }),
    prisma.symptomLog.findMany({
      where: { patientId, loggedAt: { gte: day7 } },
      orderBy: { loggedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, severity: true, loggedAt: true, resolvedAt: true },
    }),
    prisma.vital.findMany({
      where: { patientId, measuredAt: { gte: day30 } },
      orderBy: { measuredAt: 'desc' },
      distinct: ['type'],
      select: { id: true, type: true, value: true, unit: true, systolic: true, diastolic: true, measuredAt: true },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.condition.count({ where: { patientId, status: { in: ['ACTIVE', 'CHRONIC'] } } }),
    prisma.medicationLog.groupBy({
      by: ['status'],
      where: { medication: { patientId }, scheduledTime: { gte: day30 } },
      _count: { status: true },
    }),
    prisma.communityMember.count({ where: { userId } }),
    prisma.medicalReport.count({ where: { patientId } }),
  ]);

  const totalLogs = medicationAdherence.reduce((sum, group) => sum + group._count.status, 0);
  const takenLogs = medicationAdherence.find(group => group.status === 'taken')?._count.status ?? 0;
  const adherencePct = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : null;

  const refillAlerts = activeMedications.filter(
    medication => medication.currentStock != null && medication.refillThreshold != null && medication.currentStock <= medication.refillThreshold,
  );

  const insight = buildPatientInsight(
    adherencePct,
    activeMedications.length,
    recentSymptoms.length,
    upcomingAppointments.length,
  );

  return {
    profile: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      bloodGroup: patient.bloodGroup,
      profilePhotoUrl: patient.profilePhotoUrl,
    },
    healthScore: {
      score: healthScore.score,
      medicationAdherence: healthScore.medicationAdherence,
      symptomFrequency: healthScore.symptomFrequency,
      appointmentRegularity: healthScore.appointmentRegularity,
      lifestyleFactors: healthScore.lifestyleFactors,
      calculatedAt: healthScore.calculatedAt,
      trend: healthScore.score >= 75 ? 'up' : healthScore.score >= 50 ? 'stable' : 'down',
    },
    kpis: {
      upcomingAppointmentsCount: upcomingAppointments.length,
      activeMedicationsCount: activeMedications.length,
      activeConditionsCount: activeConditions,
      recentSymptomsCount: recentSymptoms.length,
      unreadNotifications,
      communitiesJoined: communityCount,
      totalReports,
      medicationAdherencePct: adherencePct,
      refillAlertsCount: refillAlerts.length,
    },
    upcomingAppointments,
    activeMedications,
    recentSymptoms,
    recentVitals,
    refillAlerts,
    aiInsight: insight,
  };
};

const buildPatientInsight = (
  adherencePct: number | null,
  activeMedicationCount: number,
  symptomsLast7Days: number,
  upcomingAppts: number,
): string => {
  const parts: string[] = [];

  if (activeMedicationCount === 0) {
    parts.push('No active medications are currently recorded.');
  } else if (adherencePct == null) {
    parts.push('Active medications are recorded, but no doses have been logged in the last 30 days.');
  } else if (adherencePct >= 85) {
    parts.push(`Medication adherence is ${adherencePct}% over the logged doses in the last 30 days.`);
  } else if (adherencePct >= 60) {
    parts.push(`Medication adherence is ${adherencePct}% over logged doses. A reminder may help with missed doses.`);
  } else {
    parts.push(`Medication adherence is ${adherencePct}% over logged doses. Review missed doses and your medication schedule.`);
  }

  if (symptomsLast7Days === 0) {
    parts.push('No symptoms were logged this week.');
  } else if (symptomsLast7Days <= 2) {
    parts.push(`${symptomsLast7Days} symptom entr${symptomsLast7Days === 1 ? 'y was' : 'ies were'} logged this week; continue monitoring for changes.`);
  } else {
    parts.push(`${symptomsLast7Days} symptom entries were logged this week; consider clinical review if symptoms are persistent, severe or worsening.`);
  }

  if (upcomingAppts > 0) {
    parts.push(`${upcomingAppts} upcoming appointment${upcomingAppts > 1 ? 's are' : ' is'} scheduled.`);
  } else {
    parts.push('No upcoming appointments are scheduled.');
  }

  return parts.join(' ');
};
