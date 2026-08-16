import { prisma } from '../lib/prisma';
import {
  calculateHealthScore as calculateV21,
  HEALTH_SCORE_ALGORITHM_VERSION,
} from './healthScore.v2_1.service';

export { HEALTH_SCORE_ALGORITHM_VERSION };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const overallStatus = (score: number | null) =>
  score == null ? 'INCOMPLETE_ASSESSMENT' : score >= 85 ? 'STRONG' : score >= 70 ? 'GOOD' : score >= 55 ? 'NEEDS_ATTENTION' : 'NEEDS_REVIEW';
const domainStatus = (score: number | null) =>
  score == null ? 'NO_DATA' : score >= 85 ? 'STRONG' : score >= 70 ? 'GOOD' : score >= 55 ? 'NEEDS_ATTENTION' : 'NEEDS_REVIEW';
const interp = (x: number, anchors: Array<[number, number]>) => {
  const a = [...anchors].sort((p, q) => p[0] - q[0]);
  if (x <= a[0][0]) return a[0][1];
  if (x >= a[a.length - 1][0]) return a[a.length - 1][1];
  for (let i = 0; i < a.length - 1; i++) {
    const [x1, y1] = a[i], [x2, y2] = a[i + 1];
    if (x >= x1 && x <= x2) return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
  }
  return a[a.length - 1][1];
};

/**
 * HC-HSI 2.0 lifestyle normalization.
 * Stored activity values are TOTAL MINUTES PER WEEK:
 * moderate-equivalent minutes = moderate + 2 * vigorous.
 *
 * Fruit/vegetable intake remains useful health context, but the current
 * single-field diet proxy is intentionally NOT included in the numeric
 * Lifestyle score. A broader India-adapted dietary assessment is required
 * before diet contributes numerically.
 */
function normalizeActivityDomain(base: any) {
  const lifestyle = (base?.domains ?? []).find((d: any) => d?.key === 'lifestyle');
  if (!lifestyle) return;

  const activity = lifestyle?.components?.find((c: any) => c?.key === 'activity');
  const diet = lifestyle?.components?.find((c: any) => c?.key === 'diet');

  // Keep the optional diet value visible as context, but do not score it.
  if (diet) {
    diet.score = null;
    diet.status = 'NOT_APPLICABLE';
    diet.explanation = 'Context only in HC-HSI 2.0. Fruit and vegetable intake is recorded, but a single diet field is not used as a complete diet-quality score.';
  }

  if (activity?.value) {
    const match = String(activity.value).match(/([0-9.]+)\s+min moderate\s*\+\s*([0-9.]+)\s+min vigorous/i);
    if (match) {
      const moderate = Number(match[1]);
      const vigorous = Number(match[2]);
      if (Number.isFinite(moderate) && Number.isFinite(vigorous)) {
        const equivalent = moderate + 2 * vigorous;
        const activityScore = clamp(interp(equivalent, [
          [0, 30],
          [30, 40],
          [60, 50],
          [90, 62],
          [120, 76],
          [150, 90],
          [225, 97],
          [300, 100],
          [450, 100],
        ]));

        activity.score = activityScore;
        activity.status = domainStatus(activityScore);
        activity.explanation = `Uses ${equivalent} moderate-equivalent minutes/week (${moderate} moderate + 2 × ${vigorous} vigorous). The adult aerobic-health reference is 150–300 moderate minutes/week, 75–150 vigorous minutes/week, or an equivalent combination.`;
      }
    }
  }

  // Lifestyle score currently reflects two strong, interpretable inputs only:
  // tobacco exposure and weekly aerobic physical activity.
  const componentWeights: Record<string, number> = { tobacco: 55, activity: 45 };
  const scored = (lifestyle.components ?? [])
    .filter((c: any) => c?.score != null && componentWeights[c.key] != null)
    .map((c: any) => ({ score: Number(c.score), weight: componentWeights[c.key] }));
  const totalWeight = scored.reduce((sum: number, p: any) => sum + p.weight, 0);

  if (totalWeight > 0) {
    lifestyle.score = clamp(scored.reduce((sum: number, p: any) => sum + p.score * p.weight, 0) / totalWeight);
    lifestyle.status = domainStatus(lifestyle.score);
    lifestyle.explanation = 'Lifestyle Health currently reflects tobacco exposure and weekly aerobic physical activity. Diet and alcohol remain health context until broader validated assessments are implemented.';
  } else {
    lifestyle.score = null;
    lifestyle.status = 'NO_DATA';
  }
}

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
  normalizeActivityDomain(base);

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

  const normalizedLifestyle = (base?.domains ?? []).find((d: any) => d?.key === 'lifestyle')?.score ?? base?.lifestyleFactors ?? 0;

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
    lifestyleFactors: normalizedLifestyle,
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