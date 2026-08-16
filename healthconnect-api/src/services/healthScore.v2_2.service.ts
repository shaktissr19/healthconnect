import { prisma } from '../lib/prisma';
import {
  calculateHealthScore as calculateV21,
  HEALTH_SCORE_ALGORITHM_VERSION,
} from './healthScore.v2_1.service';

export { HEALTH_SCORE_ALGORITHM_VERSION };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const overallStatus = (score: number | null) =>
  score == null ? 'INCOMPLETE_ASSESSMENT' : score >= 85 ? 'STRONG' : score >= 70 ? 'GOOD' : score >= 55 ? 'NEEDS_ATTENTION' : 'NEEDS_REVIEW';

/**
 * HC-HSI 2.0 presentation/scoring policy
 * --------------------------------------
 * A current Health Score is shown whenever at least one applicable health
 * domain has a real measurable score. Missing domains are excluded from the
 * denominator; they never receive healthy points.
 *
 * Assessment completion is a separate concept:
 * - 10/10 core areas => COMPLETE score
 * - <10/10 with measurable score => PROVISIONAL score
 * - no measurable scoreable domain => INSUFFICIENT_DATA
 *
 * Confidence is measurement reliability (freshness/repeat evidence), not the
 * percentage of the assessment completed. Assessment completeness is already
 * exposed separately as assessmentReadiness.percent.
 */
function finalize(base: any) {
  const readiness = base?.assessmentReadiness ?? { complete: false, completed: 0, total: 10, percent: 0, items: [] };
  const scoreable = (base?.domains ?? []).filter(
    (d: any) => d?.applicable !== false && d?.score != null && Number.isFinite(Number(d.score)),
  );

  const scoreWeight = scoreable.reduce((sum: number, d: any) => sum + Number(d.weight ?? 0), 0);
  const weightedPoints = scoreable.reduce(
    (sum: number, d: any) => sum + Number(d.score) * Number(d.weight ?? 0),
    0,
  );
  const rawScore = scoreWeight > 0 ? clamp(weightedPoints / scoreWeight) : null;

  const scoreType = rawScore == null
    ? 'INSUFFICIENT_DATA'
    : readiness.complete
      ? 'COMPLETE'
      : 'PROVISIONAL';

  const score = rawScore;

  // Reliability of the data actually contributing to the score. It is not
  // multiplied by assessment completeness because that would duplicate the
  // meaning of assessmentReadiness.percent and confuse patients.
  let confidence = scoreWeight > 0
    ? clamp(
        scoreable.reduce(
          (sum: number, d: any) => sum + Number(d.confidence ?? 0) * Number(d.weight ?? 0),
          0,
        ) / scoreWeight,
      )
    : 0;

  if ((base?.riskContext?.screeningRecommendations ?? []).some((r: any) => r?.priority === 'CORE')) {
    confidence = Math.min(confidence, 75);
  }
  if ((base?.limitations ?? []).some((l: any) => l?.severity === 'IMPORTANT')) {
    confidence = Math.min(confidence, 80);
  }

  const remaining = Math.max(0, Number(readiness.total ?? 10) - Number(readiness.completed ?? 0));
  const assessmentMessage = scoreType === 'COMPLETE'
    ? 'Health assessment complete. Your score uses all required core assessment areas.'
    : scoreType === 'PROVISIONAL'
      ? `Current Health Score based on available measurable health data. Assessment ${readiness.percent}% complete; add ${remaining} remaining core detail${remaining === 1 ? '' : 's'} for a more complete assessment.`
      : `No measurable health domain is available yet. Add a blood-pressure, body, metabolic, lifestyle or other supported health input to start your Health Score.`;

  const recommendations = [...(base?.recommendations ?? [])];
  if (scoreType === 'PROVISIONAL') {
    const msg = `Your current Health Score uses the health data available today. Assessment ${readiness.percent}% complete; add ${remaining} remaining core detail${remaining === 1 ? '' : 's'} to improve completeness.`;
    if (!recommendations.includes(msg)) recommendations.unshift(msg);
  }

  return {
    ...base,
    score,
    status: overallStatus(score),
    confidence,
    dataCoverage: scoreWeight,
    scoreType,
    provisional: scoreType === 'PROVISIONAL',
    assessmentLevel: scoreType === 'COMPLETE'
      ? base.assessmentLevel
      : scoreType === 'PROVISIONAL'
        ? 'PROVISIONAL'
        : 'INSUFFICIENT_DATA',
    assessmentMessage,
    scoreBasis: {
      scoreableDomains: scoreable.length,
      availableWeight: scoreWeight,
      coreAreasCompleted: readiness.completed,
      coreAreasTotal: readiness.total,
    },
    recommendations,
  };
}

async function persistCurrent(patientId: string, result: any, persistSnapshot: boolean) {
  if (result.score != null) {
    await prisma.healthScore.upsert({
      where: { patientId },
      create: {
        patientId,
        score: result.score,
        medicationAdherence: result.medicationAdherence ?? 0,
        symptomFrequency: result.symptomFrequency ?? 0,
        appointmentRegularity: result.appointmentRegularity ?? 0,
        lifestyleFactors: result.lifestyleFactors ?? 0,
      },
      update: {
        score: result.score,
        medicationAdherence: result.medicationAdherence ?? 0,
        symptomFrequency: result.symptomFrequency ?? 0,
        appointmentRegularity: result.appointmentRegularity ?? 0,
        lifestyleFactors: result.lifestyleFactors ?? 0,
        calculatedAt: result.calculatedAt ?? new Date(),
      },
    });
  }

  if (persistSnapshot) {
    const calculatedAt = result.calculatedAt ? new Date(result.calculatedAt) : new Date();
    await prisma.$executeRaw`
      INSERT INTO "health_score_snapshots"
        ("patientId","score","status","confidence","algorithmVersion","domains","alerts","missingData","calculatedAt")
      VALUES
        (${patientId},${result.score},${result.status},${result.confidence},${HEALTH_SCORE_ALGORITHM_VERSION},
         CAST(${JSON.stringify(result.domains ?? [])} AS jsonb),
         CAST(${JSON.stringify(result.alerts ?? [])} AS jsonb),
         CAST(${JSON.stringify(result.missingData ?? [])} AS jsonb),${calculatedAt})
    `;
  }
}

export async function calculateHealthScore(patientId: string, options: { persistSnapshot?: boolean } = {}) {
  const base = await calculateV21(patientId, { persistSnapshot: false });
  const result = finalize(base);
  await persistCurrent(patientId, result, !!options.persistSnapshot);
  return result;
}

export const getHealthScore = (patientId: string) => calculateHealthScore(patientId, { persistSnapshot: false });
export const refreshHealthScore = (patientId: string) => calculateHealthScore(patientId, { persistSnapshot: true });
