import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

export const getPlatformStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalDoctors, totalHospitals, consultationsToday] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'DOCTOR', isActive: true } }),
      prisma.user.count({ where: { role: 'HOSPITAL', isActive: true } }),
      prisma.appointment.count({ where: { createdAt: { gte: today } } }),
    ]);

    return ApiResponse.success(res, {
      totalUsers,
      totalDoctors,
      totalHospitals,
      consultationsToday,
      uptimePercent: 99.9,
    });
  } catch(e) { next(e); }
};

export const subscribeNewsletter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) return ApiResponse.error(res, 'INVALID_INPUT', 'Valid email required', 400);
    await prisma.newsletterSubscription.upsert({
      where: { email },
      create: { email, isActive: true },
      update: { isActive: true },
    });
    return ApiResponse.success(res, null, 'Subscribed successfully!');
  } catch(e) { next(e); }
};
