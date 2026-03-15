import { PrismaClient }  from '@prisma/client';
import { CONSTANTS }     from '../config/constants';

const prisma = new PrismaClient();
const W      = CONSTANTS.HEALTH_SCORE;

export const calculateHealthScore = async (patientId: string) => {
  const now     = new Date();
  const day30   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Medication adherence (last 30 days)
  const [totalLogs, takenLogs] = await Promise.all([
    prisma.medicationLog.count({ where: { medication: { patientId }, scheduledTime: { gte: day30 } } }),
    prisma.medicationLog.count({ where: { medication: { patientId }, scheduledTime: { gte: day30 }, status: 'taken' } }),
  ]);
  const adherence = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  // 2. Symptom frequency score (fewer = better)
  const symptomCount = await prisma.symptomLog.count({ where: { patientId, loggedAt: { gte: day30 } } });
  const avgSeverity  = await prisma.symptomLog.aggregate({ where: { patientId, loggedAt: { gte: day30 } }, _avg: { severity: true } });
  const symScore = Math.max(0, Math.round(100 - (symptomCount * 3) - ((avgSeverity._avg.severity || 0) * 5)));

  // 3. Appointment regularity
  const apptCount = await prisma.appointment.count({
    where: { patientId, status: 'COMPLETED', scheduledAt: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
  });
  const apptScore = Math.min(100, apptCount * 25); // 4+ appts = 100

  // 4. Lifestyle score (placeholder — could factor in vitals)
  const vitalsCount = await prisma.vital.count({ where: { patientId, measuredAt: { gte: day30 } } });
  const lifestyleScore = Math.min(100, 60 + vitalsCount * 5);

  const overall = Math.round(
    adherence    * W.MEDICATION_ADHERENCE_WEIGHT +
    symScore     * W.SYMPTOM_FREQUENCY_WEIGHT    +
    apptScore    * W.APPOINTMENT_REGULARITY_WEIGHT +
    lifestyleScore * W.LIFESTYLE_FACTORS_WEIGHT
  );

  // Persist
  await prisma.healthScore.upsert({
    where: { patientId },
    create: { patientId, score: overall, medicationAdherence: adherence, symptomFrequency: symScore, appointmentRegularity: apptScore, lifestyleFactors: lifestyleScore },
    update: { score: overall, medicationAdherence: adherence, symptomFrequency: symScore, appointmentRegularity: apptScore, lifestyleFactors: lifestyleScore, calculatedAt: new Date() },
  });

  return { score: overall, medicationAdherence: adherence, symptomFrequency: symScore, appointmentRegularity: apptScore, lifestyleFactors: lifestyleScore, calculatedAt: new Date() };
};
