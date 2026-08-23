import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { prisma } from '../lib/prisma';

const hasFeature = (features: unknown, featureName: string): boolean => {
  const wanted = featureName.trim().toLowerCase();
  if (!wanted) return true;

  if (Array.isArray(features)) {
    return features.some(feature => String(feature).trim().toLowerCase() === wanted);
  }

  if (features && typeof features === 'object') {
    const record = features as Record<string, unknown>;
    return Object.entries(record).some(
      ([key, enabled]) => key.trim().toLowerCase() === wanted && Boolean(enabled),
    );
  }

  return false;
};

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
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return ApiResponse.error(
          res,
          'SUBSCRIPTION_REQUIRED',
          'An active membership is required for this feature.',
          403,
        );
      }

      if (featureName && !hasFeature(subscription.plan.features, featureName)) {
        return ApiResponse.error(
          res,
          'SUBSCRIPTION_REQUIRED',
          `Your plan does not include ${featureName}.`,
          403,
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
