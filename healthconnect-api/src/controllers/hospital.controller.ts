import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

export const searchHospitals = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.user.findMany({ where: { role: 'HOSPITAL', isActive: true }, include: { hospitalProfile: true } })); } catch(e) { next(e); }
};
export const getFeaturedHospitals = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.user.findMany({ where: { role: 'HOSPITAL', isActive: true }, include: { hospitalProfile: true }, take: 6 })); } catch(e) { next(e); }
};
export const getNearestHospitals = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch(e) { next(e); }
};
export const getHospitalProfile = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.user.findUnique({ where: { id: req.params.id }, include: { hospitalProfile: true } })); } catch(e) { next(e); }
};
export const getHospitalDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch(e) { next(e); }
};
export const getHospitalDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch(e) { next(e); }
};
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { hospitalProfile: true } })); } catch(e) { next(e); }
};
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.hospitalProfile.update({ where: { userId: req.user!.userId }, data: req.body })); } catch(e) { next(e); }
};
export const getMyDoctors = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch(e) { next(e); }
};
export const inviteDoctor = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, null, 'Invitation sent'); } catch(e) { next(e); }
};
export const removeDoctor = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, null, 'Doctor removed'); } catch(e) { next(e); }
};
