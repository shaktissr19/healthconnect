import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

export const requireSubscription = (featureName?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const subscription = await prisma.userSubscription.findFirst({
        where: {
          userId: req.user.userId,
          status: 'ACTIVE',
          endDate: { gt: new Date() },
        },
        include: {
          plan: true,
        },
      });

      if (!subscription) {
        return ApiResponse.error(
          res,
          'SUBSCRIPTION_REQUIRED',
          'Premium subscription required for this feature',
          403
        );
      }

      // Check specific feature if provided
      if (featureName && subscription.plan.features) {
        const features = subscription.plan.features as Record<string, boolean>;
        if (!features[featureName]) {
          return ApiResponse.error(
            res,
            'SUBSCRIPTION_REQUIRED',
            `Your plan does not include ${featureName}`,
            403
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
