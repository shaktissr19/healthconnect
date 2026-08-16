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
 * HC-HSI 2.0 scoring policy
 * -------------------------
 * - 0-5/10 core assessment areas: no overall numeric score.
 * - 6-9/10: a PROVISIONAL score may be shown when at least two meaningful
 *   domains are scoreable and those domains represent >=30% of HC-HSI weight.
 * - 10/10: COMPLETE score.
 * - The numeric value is always the normalized weighted score of available,
 *   applicable domains. Missing data never receives healthy points.
 * - Assessment completion and confidence remain separate from the score.
 */
function finalize(base: any) {
  const readiness = base?.assessmentReadiness ?? { complete: false, completed: 0, total: 10, percent: 0, items: [] };
  const scoreable = (base?.domains ?? []).filter((d: any) => d?.applicable !== false && d?.score != null && Number.isFinite(Number(d.score)));
  const scoreWeight = scoreable.reduce((sum: number, d: any) => sum + Number(d.weight ?? 0), 0);
  const weightedPoints = scoreable.reduce((sum: number, d: any) => sum + Number(d.score) * Number(d.weight ?? 0), 0);
  const rawScore = scoreWeight > 0 ? clamp(weightedPoints / scoreWeight) : null;

  const minimumForProvisional =
    readiness.completed >= 6 &&
    scoreable.length >= 2 &&
    scoreWeight >= 30 &&
    rawScore != null;

  const scoreType = readiness.complete
    ? 'COMPLETE'
    : minimumForProvisional
      ? 'PROVISIONAL'
      : 'INSUFFICIENT_DATA';

  const score = scoreType === 'INSUFFICIENT_DATA' ? null : rawScore;

  const domainConfidence = scoreWeight > 0
    ? clamp(scoreable.reduce((sum: number, d: any) => sum + Number(d.confidence ?? 0) * Number(d.weight ?? 0), 0) / scoreWeight)
    : 0;

  // Partial assessments can be useful, but confidence must remain visibly lower
  // until the remaining core context is completed.
  let confidence = clamp(domainConfidence * (0.65 + 0.35 * (readiness.percent / 100)));
  if (scoreType === 'PROVISIONAL') confidence = Math.min(confidence, 80);
  if ((base?.riskContext?.screeningRecommendations ?? []).some((r: any) => r?.priority === 'CORE')) confidence = Math.min(confidence, 75);
  if ((base?.limitations ?? []).some((l: any) => l?.severity === 'IMPORTANT')) confidence = Math.min(confidence, 80);

  const remaining = Math.max(0, Number(readiness.total ?? 10) - Number(readiness.completed ?? 0));
  const assessmentMessage = scoreType === 'COMPLETE'
    ? 'Core health assessment complete. Your score uses all required core assessment areas.'
    : scoreType === 'PROVISIONAL'
      ? `Provisional Health Score based on currently available data. Assessment ${readiness.percent}% complete; add ${remaining} remaining core detail${remaining === 1 ? '' : 's'} for a more complete assessment.`
      : `Not enough structured health data for a responsible overall score yet. Assessment ${readiness.percent}% complete; complete at least 6 core areas and two measurable health domains.`;

  const recommendations = [...(base?.recommendations ?? [])];
  if (scoreType === 'PROVISIONAL') {
    const msg = `Your current score is provisional because the core assessment is ${readiness.percent}% complete. Add ${remaining} remaining detail${remaining === 1 ? '' : 's'} to improve completeness and confidence.`;
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
      minimumCoreAreasForProvisional: 6,
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
  // Base engine provides all domain/component calculations and clinical alerts.
  // Snapshot persistence is handled here so provisional scores are saved correctly.
  const base = await calculateV21(patientId, { persistSnapshot: false });
  const result = finalize(base);
  await persistCurrent(patientId, result, !!options.persistSnapshot);
  return result;
}

export const getHealthScore = (patientId: string) => calculateHealthScore(patientId, { persistSnapshot: false });
export const refreshHealthScore = (patientId: string) => calculateHealthScore(patientId, { persistSnapshot: true });
