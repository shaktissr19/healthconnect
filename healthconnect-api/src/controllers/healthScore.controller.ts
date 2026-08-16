import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { getHealthScore, refreshHealthScore, getHealthScoreHistory } from '../services/healthScore.service';

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
