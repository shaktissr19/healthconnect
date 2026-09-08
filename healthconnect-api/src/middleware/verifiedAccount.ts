import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { ApiResponse } from '../utils/apiResponse';
import { isPhoneVerified } from '../services/phoneVerification.service';

export type VerificationRequirement = {
  email?: boolean;
  phone?: boolean;
};

/**
 * Gate sensitive customer actions behind verified identity signals.
 *
 * The gate is automatically active in production and can be enabled in staging
 * with REQUIRE_VERIFIED_SENSITIVE_ACTIONS=true. Development remains convenient
 * by default while still allowing the complete production behavior to be tested.
 */
export const requireVerifiedAccount = (
  requirement: VerificationRequirement = { email: true, phone: true },
) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!config.auth.requireVerifiedSensitiveActions) return next();

    const userId = req.user?.userId;
    if (!userId) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, isEmailVerified: true },
    });
    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, 'Session is no longer active');
    }

    if (requirement.email !== false && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error_code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Verify your email before continuing with this action.',
      });
    }

    if (requirement.phone !== false && !(await isPhoneVerified(userId))) {
      return res.status(403).json({
        success: false,
        error_code: 'PHONE_VERIFICATION_REQUIRED',
        message: 'Verify your mobile number before continuing with this action.',
      });
    }

    return next();
  } catch (error) {
    next(error);
  }
};
