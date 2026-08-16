import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ApiResponse } from '../../utils/apiResponse';
import { getHealthScore, refreshHealthScore, getHealthScoreHistory } from './service';

async function resolvePatientId(userId: string) {
  const patient = await prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
  return patient?.id ?? null;
}

export const current = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = await resolvePatientId(req.user!.userId);
    if (!patientId) return ApiResponse.notFound(res, 'Patient profile not found');
    return ApiResponse.success(res, await getHealthScore(patientId));
  } catch (e) { next(e); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = await resolvePatientId(req.user!.userId);
    if (!patientId) return ApiResponse.notFound(res, 'Patient profile not found');
    return ApiResponse.success(res, await refreshHealthScore(patientId), 'Health score recalculated');
  } catch (e) { next(e); }
};

export const history = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = await resolvePatientId(req.user!.userId);
    if (!patientId) return ApiResponse.notFound(res, 'Patient profile not found');
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const rows = await getHealthScoreHistory(patientId, limit);
    return ApiResponse.success(res, rows.map(row => ({
      score: row.score,
      status: row.status,
      confidence: row.confidence,
      algorithmVersion: row.algorithmVersion,
      calculatedAt: row.calculatedAt,
    })));
  } catch (e) { next(e); }
};

export const getLifestyle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = await resolvePatientId(req.user!.userId);
    if (!patientId) return ApiResponse.notFound(res, 'Patient profile not found');
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT * FROM "patient_lifestyle_health" WHERE "patientId" = ${patientId} LIMIT 1
    `;
    return ApiResponse.success(res, rows[0] ?? {
      patientId,
      heightCm: null,
      waistCm: null,
      moderateActivityMinWeek: null,
      vigorousActivityMinWeek: null,
      sleepHoursAvg: null,
      tobaccoStatus: null,
      fruitVegServingsDay: null,
      medicationStatus: null,
      conditionStatus: null,
      familyHistoryStatus: null,
      medicationTrackingStartedAt: null,
      alcoholStatus: null,
    });
  } catch (e) { next(e); }
};

export const updateLifestyle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = await resolvePatientId(req.user!.userId);
    if (!patientId) return ApiResponse.notFound(res, 'Patient profile not found');

    const num = (value: unknown, min: number, max: number, name: string) => {
      if (value === undefined || value === null || value === '') return null;
      const n = Number(value);
      if (!Number.isFinite(n) || n < min || n > max) throw Object.assign(new Error(`${name} is invalid`), { statusCode: 400 });
      return n;
    };
    const enumValue = (value: unknown, allowed: string[], name: string) => {
      if (value === undefined || value === null || value === '') return null;
      const v = String(value).toUpperCase();
      if (!allowed.includes(v)) throw Object.assign(new Error(`${name} must be one of: ${allowed.join(', ')}`), { statusCode: 400 });
      return v;
    };

    const heightCm = num(req.body.heightCm, 80, 250, 'heightCm');
    const waistCm = num(req.body.waistCm, 30, 250, 'waistCm');
    const moderate = num(req.body.moderateActivityMinWeek, 0, 10000, 'moderateActivityMinWeek');
    const vigorous = num(req.body.vigorousActivityMinWeek, 0, 10000, 'vigorousActivityMinWeek');
    const sleep = num(req.body.sleepHoursAvg, 0, 24, 'sleepHoursAvg');
    const servings = num(req.body.fruitVegServingsDay, 0, 30, 'fruitVegServingsDay');
    const tobacco = enumValue(req.body.tobaccoStatus, ['NEVER','FORMER','CURRENT','SECONDHAND'], 'tobaccoStatus');
    const medicationStatus = enumValue(req.body.medicationStatus, ['NONE','TAKING_PRESCRIBED','UNKNOWN'], 'medicationStatus');
    const conditionStatus = enumValue(req.body.conditionStatus, ['NONE','KNOWN','UNKNOWN'], 'conditionStatus');
    const familyHistoryStatus = enumValue(req.body.familyHistoryStatus, ['NONE','RECORDED','UNKNOWN'], 'familyHistoryStatus');
    const alcoholStatus = enumValue(req.body.alcoholStatus, ['NONE','OCCASIONAL','REGULAR','UNKNOWN'], 'alcoholStatus');

    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      INSERT INTO "patient_lifestyle_health"
        ("patientId", "heightCm", "waistCm", "moderateActivityMinWeek", "vigorousActivityMinWeek", "sleepHoursAvg", "tobaccoStatus", "fruitVegServingsDay", "medicationStatus", "conditionStatus", "familyHistoryStatus", "medicationTrackingStartedAt", "alcoholStatus", "updatedAt")
      VALUES
        (${patientId}, ${heightCm}, ${waistCm}, ${moderate == null ? null : Math.round(moderate)}, ${vigorous == null ? null : Math.round(vigorous)}, ${sleep}, ${tobacco}, ${servings}, ${medicationStatus}, ${conditionStatus}, ${familyHistoryStatus}, CASE WHEN ${medicationStatus}='TAKING_PRESCRIBED' THEN NOW() ELSE NULL END, ${alcoholStatus}, NOW())
      ON CONFLICT ("patientId") DO UPDATE SET
        "heightCm" = EXCLUDED."heightCm",
        "waistCm" = EXCLUDED."waistCm",
        "moderateActivityMinWeek" = EXCLUDED."moderateActivityMinWeek",
        "vigorousActivityMinWeek" = EXCLUDED."vigorousActivityMinWeek",
        "sleepHoursAvg" = EXCLUDED."sleepHoursAvg",
        "tobaccoStatus" = EXCLUDED."tobaccoStatus",
        "fruitVegServingsDay" = EXCLUDED."fruitVegServingsDay",
        "medicationStatus" = EXCLUDED."medicationStatus",
        "conditionStatus" = EXCLUDED."conditionStatus",
        "familyHistoryStatus" = EXCLUDED."familyHistoryStatus",
        "medicationTrackingStartedAt" = CASE
          WHEN EXCLUDED."medicationStatus"='TAKING_PRESCRIBED' THEN COALESCE("patient_lifestyle_health"."medicationTrackingStartedAt", NOW())
          ELSE NULL
        END,
        "alcoholStatus" = EXCLUDED."alcoholStatus",
        "updatedAt" = NOW()
      RETURNING *
    `;
    return ApiResponse.success(res, rows[0], 'Health assessment inputs updated');
  } catch (e) { next(e); }
};
