import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

export const getPlans = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.subscriptionPlan.findMany({ where: { isActive: true } })); } catch(e) { next(e); }
};
export const getCurrentSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.userSubscription.findFirst({ where: { userId: req.user!.userId, status: 'ACTIVE' }, include: { plan: true } });
    return ApiResponse.success(res, sub);
  } catch(e) { next(e); }
};
export const getBillingHistory = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.userSubscription.findMany({ where: { userId: req.user!.userId }, include: { plan: true }, orderBy: { startDate: 'desc' } })); } catch(e) { next(e); }
};
export const createCheckout = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, { checkoutUrl: 'https://razorpay.com/checkout/placeholder' }); } catch(e) { next(e); }
};
export const handleWebhook = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, null, 'Webhook received'); } catch(e) { next(e); }
};
export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.userSubscription.updateMany({ where: { userId: req.user!.userId, status: 'ACTIVE' }, data: { status: 'CANCELLED' } });
    return ApiResponse.success(res, null, 'Subscription cancelled');
  } catch(e) { next(e); }
};
export const changePlan = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, null, 'Plan change initiated'); } catch(e) { next(e); }
};
