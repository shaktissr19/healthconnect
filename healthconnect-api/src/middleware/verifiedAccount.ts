import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { getPhoneVerificationStatus } from '../services/phoneOtp.service';

export type VerificationRequirement = {
  email?: boolean;
  phone?: boolean;
};

/**
 * Gate customer-sensitive actions behind verified contact channels.
 *
 * Authentication remains separate: users may sign in and finish onboarding while
 * unverified, but actions such as booking, payment and medical-record sharing can
 * require stronger verification.
 */
export const requireVerifiedAccount = (
  requirement: VerificationRequirement = { email: true, phone: true },
) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return ApiResponse.unauthorized(res, 'Authentication required');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, isEmailVerified: true },
    });
    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, 'Session is no longer active');
    }

    if (requirement.email && !user.isEmailVerified) {
      return ApiResponse.forbidden(
        res,
        'EMAIL_VERIFICATION_REQUIRED',
        'Verify your email address before continuing.',
      );
    }

    if (requirement.phone) {
      const phoneStatus = await getPhoneVerificationStatus(userId);
      if (!phoneStatus.isPhoneVerified) {
        return ApiResponse.forbidden(
          res,
          'PHONE_VERIFICATION_REQUIRED',
          phoneStatus.hasPhone
            ? 'Verify your mobile number before continuing.'
            : 'Add and verify a mobile number before continuing.',
        );
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
