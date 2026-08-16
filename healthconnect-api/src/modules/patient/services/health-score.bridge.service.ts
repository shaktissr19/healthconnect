import { calculateHealthScore } from '../../health-score/service';
import { getPatient, prisma } from './_shared';

// Backward-compatible exports retained for legacy Patient-service consumers.
// Canonical Patient health-score HTTP routes use the dedicated health-score module.
export const refreshHealthScore = async (userId: string) => {
  const patient = await getPatient(userId);
  return calculateHealthScore(patient.id);
};

export const getHealthScoreHistory = async (userId: string) => {
  const patient = await getPatient(userId);
  const score = await prisma.healthScore.findUnique({ where: { patientId: patient.id } });
  if (!score) return calculateHealthScore(patient.id);
  return score;
};
