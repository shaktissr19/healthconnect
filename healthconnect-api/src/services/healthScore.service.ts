import { prisma } from '../lib/prisma';

export const HEALTH_SCORE_ALGORITHM_VERSION = 'HC-HSI-1.0';

export type HealthDomainKey =
  | 'blood_pressure'
  | 'glucose_metabolic'
  | 'body_composition'
  | 'lipids'
  | 'medication_adherence'
  | 'condition_control'
  | 'symptom_burden'
  | 'physical_activity'
  | 'sleep_recovery'
  | 'lifestyle_nutrition_tobacco';

export type HealthDomainStatus = 'STRONG' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEEDS_REVIEW' | 'NO_DATA';
export type HealthScoreStatus = 'STRONG' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEEDS_REVIEW' | 'INSUFFICIENT_DATA';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface HealthDomain {
  key: HealthDomainKey;
  label: string;
  weight: number;
  score: number | null;
  status: HealthDomainStatus;
  confidence: number;
  latestValue?: string | null;
  measuredAt?: Date | null;
  trend?: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'UNKNOWN';
  explanation: string;
  source: string;
}

export interface HealthAlert {
  severity: AlertSeverity;
  code: string;
  title: string;
  message: string;
  domain: HealthDomainKey;
  observedAt?: Date | null;
}

interface ScoreOptions {
  persistSnapshot?: boolean;
}

const DOMAIN_WEIGHTS: Record<HealthDomainKey, number> = {
  blood_pressure: 15,
  glucose_metabolic: 12,
  body_composition: 8,
  lipids: 10,
  medication_adherence: 10,
  condition_control: 12,
  symptom_burden: 10,
  physical_activity: 8,
  sleep_recovery: 7,
  lifestyle_nutrition_tobacco: 8,
};

const MS_DAY = 86_400_000;
const nowMinusDays = (days: number) => new Date(Date.now() - days * MS_DAY);
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

const scoreStatus = (score: number | null): HealthScoreStatus => {
  if (score == null) return 'INSUFFICIENT_DATA';
  if (score >= 85) return 'STRONG';
  if (score >= 70) return 'GOOD';
  if (score >= 55) return 'NEEDS_ATTENTION';
  return 'NEEDS_REVIEW';
};

const domainStatus = (score: number | null): HealthDomainStatus => {
  if (score == null) return 'NO_DATA';
  if (score >= 85) return 'STRONG';
  if (score >= 70) return 'GOOD';
  if (score >= 55) return 'NEEDS_ATTENTION';
  return 'NEEDS_REVIEW';
};

const freshnessConfidence = (measuredAt: Date | null | undefined, idealDays: number, staleDays: number) => {
  if (!measuredAt) return 0;
  const ageDays = Math.max(0, (Date.now() - measuredAt.getTime()) / MS_DAY);
  if (ageDays <= idealDays) return 100;
  if (ageDays >= staleDays) return 30;
  return clamp(100 - ((ageDays - idealDays) / (staleDays - idealDays)) * 70);
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const noDataDomain = (key: HealthDomainKey, label: string, source: string, explanation: string): HealthDomain => ({
  key,
  label,
  weight: DOMAIN_WEIGHTS[key],
  score: null,
  status: 'NO_DATA',
  confidence: 0,
  latestValue: null,
  measuredAt: null,
  trend: 'UNKNOWN',
  explanation,
  source,
});

function bloodPressureDomain(vitals: any[], alerts: HealthAlert[]): HealthDomain {
  const readings = vitals
    .filter(v => v.type === 'bp' && v.systolic != null && v.diastolic != null)
    .sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());

  if (!readings.length) {
    return noDataDomain('blood_pressure', 'Blood Pressure', 'Vitals', 'Add recent blood pressure readings to assess cardiovascular status.');
  }

  const recent = readings.filter(r => r.measuredAt >= nowMinusDays(30)).slice(0, 7);
  const basis = recent.length ? recent : readings.slice(0, 3);
  const avgSys = Math.round(basis.reduce((s, r) => s + r.systolic, 0) / basis.length);
  const avgDia = Math.round(basis.reduce((s, r) => s + r.diastolic, 0) / basis.length);
  const latest = readings[0];

  let score = 100;
  if (avgSys >= 180 || avgDia >= 120) score = 10;
  else if (avgSys >= 160 || avgDia >= 100) score = 30;
  else if (avgSys >= 140 || avgDia >= 90) score = 45;
  else if (avgSys >= 130 || avgDia >= 80) score = 65;
  else if (avgSys >= 120 && avgDia < 80) score = 85;

  if (latest.systolic >= 180 || latest.diastolic >= 120) {
    alerts.push({
      severity: 'CRITICAL',
      code: 'VERY_HIGH_BLOOD_PRESSURE',
      title: 'Very high blood pressure recorded',
      message: 'This reading is in a range that warrants prompt clinical assessment, especially if you have symptoms.',
      domain: 'blood_pressure',
      observedAt: latest.measuredAt,
    });
  } else if (latest.systolic >= 160 || latest.diastolic >= 100) {
    alerts.push({
      severity: 'WARNING',
      code: 'HIGH_BLOOD_PRESSURE',
      title: 'High blood pressure recorded',
      message: 'Repeat the measurement correctly and discuss persistently high readings with your clinician.',
      domain: 'blood_pressure',
      observedAt: latest.measuredAt,
    });
  }

  const confidence = clamp(freshnessConfidence(latest.measuredAt, 14, 90) * Math.min(1, basis.length / 3));
  return {
    key: 'blood_pressure', label: 'Blood Pressure', weight: DOMAIN_WEIGHTS.blood_pressure,
    score, status: domainStatus(score), confidence,
    latestValue: `${latest.systolic}/${latest.diastolic} mmHg`, measuredAt: latest.measuredAt,
    trend: 'UNKNOWN', source: 'Vitals',
    explanation: `Score uses recent blood pressure readings; recent average is ${avgSys}/${avgDia} mmHg.`,
  };
}

function glucoseDomain(vitals: any[], alerts: HealthAlert[]): HealthDomain {
  const hba1c = vitals.filter(v => v.type === 'hba1c').sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())[0];
  const glucose = vitals.filter(v => v.type === 'blood_sugar').sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())[0];
  const reading = hba1c ?? glucose;
  if (!reading) return noDataDomain('glucose_metabolic', 'Glucose / Metabolic', 'Vitals', 'Add HbA1c or blood glucose data to assess metabolic health.');

  const value = toNumber(reading.value);
  if (value == null) return noDataDomain('glucose_metabolic', 'Glucose / Metabolic', 'Vitals', 'The latest glucose value could not be interpreted as a number.');

  let score: number;
  let explanation: string;
  if (reading.type === 'hba1c') {
    if (value < 5.7) score = 100;
    else if (value < 6.5) score = 75;
    else if (value < 8) score = 55;
    else if (value < 10) score = 30;
    else score = 10;
    explanation = `Latest HbA1c is ${value}${reading.unit || '%'}. Individual targets can differ for people with diabetes.`;
    if (value >= 10) alerts.push({ severity: 'WARNING', code: 'VERY_HIGH_HBA1C', title: 'Very high HbA1c recorded', message: 'This suggests sustained high glucose and should be reviewed with your treating clinician.', domain: 'glucose_metabolic', observedAt: reading.measuredAt });
  } else {
    const ctx = `${reading.context ?? ''} ${reading.notes ?? ''}`.toLowerCase();
    if (value < 70) {
      score = 25;
      alerts.push({ severity: 'WARNING', code: 'LOW_BLOOD_GLUCOSE', title: 'Low blood glucose recorded', message: 'Low glucose can require prompt action, particularly if you have symptoms or take glucose-lowering medication.', domain: 'glucose_metabolic', observedAt: reading.measuredAt });
    } else if (ctx.includes('fast')) {
      score = value < 100 ? 100 : value < 126 ? 75 : value < 200 ? 45 : 20;
    } else if (ctx.includes('post') || ctx.includes('meal')) {
      score = value < 140 ? 100 : value < 200 ? 75 : 40;
    } else {
      score = value <= 140 ? 90 : value < 200 ? 70 : 40;
    }
    if (value >= 300) alerts.push({ severity: 'WARNING', code: 'VERY_HIGH_GLUCOSE', title: 'Very high blood glucose recorded', message: 'A very high glucose reading should be reviewed promptly, particularly with thirst, vomiting, weakness, confusion, or breathing difficulty.', domain: 'glucose_metabolic', observedAt: reading.measuredAt });
    explanation = `Latest blood glucose is ${value} ${reading.unit || 'mg/dL'}${reading.context ? ` (${reading.context})` : ''}.`;
  }

  return {
    key: 'glucose_metabolic', label: 'Glucose / Metabolic', weight: DOMAIN_WEIGHTS.glucose_metabolic,
    score, status: domainStatus(score), confidence: freshnessConfidence(reading.measuredAt, reading.type === 'hba1c' ? 90 : 14, reading.type === 'hba1c' ? 180 : 60),
    latestValue: `${value} ${reading.unit || (reading.type === 'hba1c' ? '%' : 'mg/dL')}`, measuredAt: reading.measuredAt,
    trend: 'UNKNOWN', source: 'Vitals', explanation,
  };
}

function lipidDomain(vitals: any[], alerts: HealthAlert[]): HealthDomain {
  const reading = vitals.filter(v => v.type === 'cholesterol').sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())[0];
  if (!reading) return noDataDomain('lipids', 'Blood Lipids', 'Vitals / Lab results', 'Add a structured cholesterol result (LDL, HDL or total cholesterol) to assess lipid health.');
  const value = toNumber(reading.value);
  const ctx = `${reading.context ?? ''} ${reading.notes ?? ''}`.toLowerCase();
  if (value == null) return noDataDomain('lipids', 'Blood Lipids', 'Vitals / Lab results', 'The latest cholesterol value could not be interpreted.');

  let score: number | null = null;
  let subtype = '';
  if (ctx.includes('ldl')) {
    subtype = 'LDL';
    score = value < 100 ? 100 : value < 130 ? 85 : value < 160 ? 65 : value < 190 ? 40 : 15;
    if (value >= 190) alerts.push({ severity: 'WARNING', code: 'VERY_HIGH_LDL', title: 'Very high LDL cholesterol recorded', message: 'LDL at this level warrants clinician review and cardiovascular risk assessment.', domain: 'lipids', observedAt: reading.measuredAt });
  } else if (ctx.includes('hdl')) {
    subtype = 'HDL';
    score = value >= 60 ? 100 : value >= 40 ? 75 : 45;
  } else if (ctx.includes('total')) {
    subtype = 'Total cholesterol';
    score = value < 200 ? 100 : value < 240 ? 70 : 40;
  }

  if (score == null) return noDataDomain('lipids', 'Blood Lipids', 'Vitals / Lab results', 'Cholesterol is present, but specify LDL, HDL or total cholesterol in the result context for safe scoring.');
  return {
    key: 'lipids', label: 'Blood Lipids', weight: DOMAIN_WEIGHTS.lipids,
    score, status: domainStatus(score), confidence: freshnessConfidence(reading.measuredAt, 180, 365),
    latestValue: `${subtype}: ${value} ${reading.unit || 'mg/dL'}`, measuredAt: reading.measuredAt,
    trend: 'UNKNOWN', source: 'Vitals / Lab results', explanation: `Latest structured ${subtype.toLowerCase()} result is used for this domain.`,
  };
}

function frequencyPerDay(frequency: string): number | null {
  const map: Record<string, number> = {
    ONCE_DAILY: 1, TWICE_DAILY: 2, THREE_TIMES_DAILY: 3, FOUR_TIMES_DAILY: 4,
    WEEKLY: 1 / 7, BIWEEKLY: 1 / 14, MONTHLY: 1 / 30,
  };
  return map[frequency] ?? null;
}

function expectedMedicationDoses(medications: any[], periodStart: Date, periodEnd: Date): number {
  return medications.reduce((total, med) => {
    const perDay = frequencyPerDay(med.frequency);
    if (perDay == null || med.status !== 'ACTIVE') return total;
    const start = new Date(Math.max(periodStart.getTime(), med.startDate?.getTime?.() ?? periodStart.getTime()));
    const endMs = med.endDate ? Math.min(periodEnd.getTime(), med.endDate.getTime()) : periodEnd.getTime();
    if (endMs < start.getTime()) return total;
    const days = Math.max(1, (endMs - start.getTime()) / MS_DAY + 1);
    return total + Math.max(0, Math.round(days * perDay));
  }, 0);
}

async function medicationDomain(patientId: string): Promise<HealthDomain> {
  const periodStart = nowMinusDays(30);
  const periodEnd = new Date();
  const [medications, takenLogs] = await Promise.all([
    prisma.medication.findMany({ where: { patientId, status: 'ACTIVE' }, select: { id: true, frequency: true, startDate: true, endDate: true, status: true } }),
    prisma.medicationLog.count({ where: { medication: { patientId }, scheduledTime: { gte: periodStart, lte: periodEnd }, status: 'taken' } }),
  ]);
  const expected = expectedMedicationDoses(medications, periodStart, periodEnd);
  if (!expected) return noDataDomain('medication_adherence', 'Medication Adherence', 'Medication schedule', 'No schedulable active medication regimen is available for adherence scoring. PRN/custom medicines are not treated as missed doses.');
  const adherence = clamp((Math.min(takenLogs, expected) / expected) * 100);
  return {
    key: 'medication_adherence', label: 'Medication Adherence', weight: DOMAIN_WEIGHTS.medication_adherence,
    score: adherence, status: domainStatus(adherence), confidence: 90,
    latestValue: `${takenLogs}/${expected} expected doses logged as taken`, measuredAt: new Date(), trend: 'UNKNOWN',
    source: 'Medication schedule + dose logs', explanation: 'Adherence uses expected scheduled doses over the last 30 days, not only the doses that happened to be logged.',
  };
}

async function conditionDomain(patientId: string): Promise<HealthDomain> {
  const conditions = await prisma.condition.findMany({ where: { patientId }, select: { status: true, updatedAt: true, name: true } });
  if (!conditions.length) return noDataDomain('condition_control', 'Chronic Condition Control', 'Medical history', 'No structured condition history is available. A missing diagnosis list is not assumed to mean perfect health.');
  const values = conditions.map(c => c.status === 'RESOLVED' ? 95 : c.status === 'IN_REMISSION' ? 90 : c.status === 'CHRONIC' ? 70 : 60);
  const score = clamp(values.reduce((a, b) => a + b, 0) / values.length);
  const latest = [...conditions].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  return {
    key: 'condition_control', label: 'Chronic Condition Control', weight: DOMAIN_WEIGHTS.condition_control,
    score, status: domainStatus(score), confidence: 55,
    latestValue: `${conditions.length} recorded condition${conditions.length === 1 ? '' : 's'}`, measuredAt: latest.updatedAt,
    trend: 'UNKNOWN', source: 'Medical history',
    explanation: 'This domain reflects recorded condition status only. It intentionally has moderate confidence until condition-specific targets and clinician assessments are structured.',
  };
}

async function symptomDomain(patientId: string, alerts: HealthAlert[]): Promise<HealthDomain> {
  const symptoms = await prisma.symptomLog.findMany({ where: { patientId, loggedAt: { gte: nowMinusDays(30) } }, orderBy: { loggedAt: 'desc' } });
  if (!symptoms.length) return noDataDomain('symptom_burden', 'Symptoms & Warning Signals', 'Symptom tracker', 'No recent symptom-tracking data is available; absence of logs is not treated as absence of symptoms.');
  const unresolved = symptoms.filter(s => !s.resolvedAt);
  const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length;
  const severe = unresolved.filter(s => s.severity >= 8);
  const burden = avgSeverity * 6 + unresolved.length * 3 + Math.min(20, symptoms.length * 1.5);
  const score = clamp(100 - burden);
  const latest = symptoms[0];
  if (severe.length) {
    alerts.push({ severity: 'WARNING', code: 'SEVERE_UNRESOLVED_SYMPTOMS', title: 'Severe unresolved symptoms recorded', message: 'One or more recent symptoms are rated 8/10 or higher and remain unresolved. Consider clinical review, especially if worsening.', domain: 'symptom_burden', observedAt: severe[0].loggedAt });
  }
  return {
    key: 'symptom_burden', label: 'Symptoms & Warning Signals', weight: DOMAIN_WEIGHTS.symptom_burden,
    score, status: domainStatus(score), confidence: freshnessConfidence(latest.loggedAt, 7, 30),
    latestValue: `${symptoms.length} logs / ${unresolved.length} unresolved / avg severity ${avgSeverity.toFixed(1)}/10`, measuredAt: latest.loggedAt,
    trend: 'UNKNOWN', source: 'Symptom tracker', explanation: 'Score reflects recent symptom severity, persistence and unresolved burden rather than a simple symptom count.',
  };
}

function oxygenAndPulseAlerts(vitals: any[], alerts: HealthAlert[]) {
  const spo2 = vitals.filter(v => v.type === 'spo2').sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())[0];
  const spo2Value = spo2 ? toNumber(spo2.value) : null;
  if (spo2 && spo2Value != null && spo2Value < 90) {
    alerts.push({ severity: 'CRITICAL', code: 'LOW_SPO2', title: 'Low oxygen saturation recorded', message: 'An SpO₂ below 90% can be clinically significant. Seek prompt medical assessment, particularly with breathlessness, chest pain, confusion, or blue lips.', domain: 'blood_pressure', observedAt: spo2.measuredAt });
  } else if (spo2 && spo2Value != null && spo2Value < 94) {
    alerts.push({ severity: 'WARNING', code: 'LOW_SPO2', title: 'Lower-than-expected oxygen saturation recorded', message: 'Repeat the measurement carefully and discuss persistent low readings with a clinician.', domain: 'blood_pressure', observedAt: spo2.measuredAt });
  }

  const hr = vitals.filter(v => v.type === 'heart_rate').sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())[0];
  const hrValue = hr ? toNumber(hr.value) : null;
  if (hr && hrValue != null && (hrValue < 40 || hrValue > 140)) {
    alerts.push({ severity: 'WARNING', code: 'EXTREME_HEART_RATE', title: 'Unusual heart rate recorded', message: 'A very low or very high resting heart rate may warrant clinical assessment, particularly with symptoms.', domain: 'blood_pressure', observedAt: hr.measuredAt });
  }
}

function buildRecommendations(domains: HealthDomain[], alerts: HealthAlert[]): string[] {
  const recommendations: string[] = [];
  if (alerts.some(a => a.severity === 'CRITICAL')) recommendations.push('Review the critical health alert above and seek appropriate medical assessment rather than relying on the overall score.');
  domains.filter(d => d.score != null && d.score < 70).sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 3)
    .forEach(d => recommendations.push(`Focus on ${d.label.toLowerCase()}: ${d.explanation}`));
  const missing = domains.filter(d => d.score == null).slice(0, 3);
  if (missing.length) recommendations.push(`Improve score reliability by adding data for: ${missing.map(d => d.label).join(', ')}.`);
  return recommendations;
}

export async function getHealthScoreHistory(patientId: string, limit = 12) {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const rows = await prisma.$queryRaw<Array<{ score: number | null; status: string; confidence: number; algorithmVersion: string; calculatedAt: Date }>>`
    SELECT "score", "status", "confidence", "algorithmVersion", "calculatedAt"
    FROM "health_score_snapshots"
    WHERE "patientId" = ${patientId}
    ORDER BY "calculatedAt" DESC
    LIMIT ${safeLimit}
  `;
  return rows;
}

export async function calculateHealthScore(patientId: string, options: ScoreOptions = {}) {
  const patient = await prisma.patientProfile.findUnique({ where: { id: patientId }, select: { id: true } });
  if (!patient) throw new Error('Patient profile not found');

  const vitals = await prisma.vital.findMany({ where: { patientId }, orderBy: { measuredAt: 'desc' }, take: 200 });
  const alerts: HealthAlert[] = [];
  oxygenAndPulseAlerts(vitals, alerts);

  const [medication, conditions, symptoms] = await Promise.all([
    medicationDomain(patientId),
    conditionDomain(patientId),
    symptomDomain(patientId, alerts),
  ]);

  const domains: HealthDomain[] = [
    bloodPressureDomain(vitals, alerts),
    glucoseDomain(vitals, alerts),
    noDataDomain('body_composition', 'Body Composition', 'Profile + weight', 'Height or another validated body-composition measure is not yet structured, so weight alone is not scored.'),
    lipidDomain(vitals, alerts),
    medication,
    conditions,
    symptoms,
    noDataDomain('physical_activity', 'Physical Activity', 'Lifestyle tracking', 'Structured activity minutes are not yet available. This domain remains unscored rather than being guessed.'),
    noDataDomain('sleep_recovery', 'Sleep & Recovery', 'Lifestyle tracking', 'Structured sleep duration/regularity is not yet available. This domain remains unscored.'),
    noDataDomain('lifestyle_nutrition_tobacco', 'Nutrition / Tobacco / Lifestyle', 'Lifestyle tracking', 'Structured diet quality and tobacco exposure are not yet available. This domain remains unscored.'),
  ];

  const available = domains.filter(d => d.score != null);
  const availableWeight = available.reduce((sum, d) => sum + d.weight, 0);
  const weightedScore = availableWeight > 0
    ? Math.round(available.reduce((sum, d) => sum + (d.score as number) * d.weight, 0) / availableWeight)
    : null;
  const score = availableWeight >= 25 ? weightedScore : null;
  const confidence = clamp(domains.reduce((sum, d) => sum + d.weight * d.confidence, 0) / 100);
  const status = scoreStatus(score);
  const missingData = domains.filter(d => d.score == null).map(d => ({ key: d.key, label: d.label, reason: d.explanation }));
  const recommendations = buildRecommendations(domains, alerts);

  const history = await getHealthScoreHistory(patientId, 12).catch(() => []);
  const previousComparable = history.find(h => h.score != null && h.algorithmVersion === HEALTH_SCORE_ALGORITHM_VERSION);
  const delta = score != null && previousComparable?.score != null ? score - previousComparable.score : null;
  const trend = delta == null ? 'UNKNOWN' : delta >= 3 ? 'IMPROVING' : delta <= -3 ? 'WORSENING' : 'STABLE';
  const calculatedAt = new Date();

  const medicationScore = medication.score ?? 0;
  const symptomScore = symptoms.score ?? 0;
  const bp = domains.find(d => d.key === 'blood_pressure');
  const glucose = domains.find(d => d.key === 'glucose_metabolic');
  const legacyLifestyle = Math.round([bp?.score, glucose?.score].filter((v): v is number => typeof v === 'number').reduce((a, b) => a + b, 0) / Math.max(1, [bp?.score, glucose?.score].filter(v => typeof v === 'number').length));

  if (score != null) {
    await prisma.healthScore.upsert({
      where: { patientId },
      create: { patientId, score, medicationAdherence: medicationScore, symptomFrequency: symptomScore, appointmentRegularity: 0, lifestyleFactors: legacyLifestyle },
      update: { score, medicationAdherence: medicationScore, symptomFrequency: symptomScore, appointmentRegularity: 0, lifestyleFactors: legacyLifestyle, calculatedAt },
    });
  }

  const result = {
    score,
    status,
    confidence,
    dataCoverage: availableWeight,
    algorithmVersion: HEALTH_SCORE_ALGORITHM_VERSION,
    calculatedAt,
    trend,
    delta,
    hasCriticalAlert: alerts.some(a => a.severity === 'CRITICAL'),
    domains,
    alerts,
    missingData,
    recommendations,
    history: history.map(h => ({ score: h.score, status: h.status, confidence: h.confidence, algorithmVersion: h.algorithmVersion, date: h.calculatedAt })),

    // Backward-compatible fields consumed by the existing dashboard.
    medicationAdherence: medicationScore,
    symptomFrequency: symptomScore,
    appointmentRegularity: 0,
    lifestyleFactors: legacyLifestyle,
  };

  if (options.persistSnapshot) {
    await prisma.$executeRaw`
      INSERT INTO "health_score_snapshots"
        ("patientId", "score", "status", "confidence", "algorithmVersion", "domains", "alerts", "missingData", "calculatedAt")
      VALUES
        (${patientId}, ${score}, ${status}, ${confidence}, ${HEALTH_SCORE_ALGORITHM_VERSION},
         CAST(${JSON.stringify(domains)} AS jsonb), CAST(${JSON.stringify(alerts)} AS jsonb),
         CAST(${JSON.stringify(missingData)} AS jsonb), ${calculatedAt})
    `;
  }

  return result;
}

export async function getHealthScore(patientId: string) {
  return calculateHealthScore(patientId, { persistSnapshot: false });
}

export async function refreshHealthScore(patientId: string) {
  return calculateHealthScore(patientId, { persistSnapshot: true });
}
