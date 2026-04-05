// src/middleware/consent.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';

export const requireConsent = (patientIdParam = 'patientId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.role !== 'DOCTOR') {
        return next();
      }

      const patientId = req.params[patientIdParam] || req.body.patientId;

      if (!patientId) {
        return ApiResponse.error(res, 'INVALID_INPUT', 'Patient ID required', 400);
      }

      // ── FIX: patientConsent.doctorId stores DoctorProfile.id, NOT User.id ──
      // Previously this used req.user.userId directly which always failed because
      // the JWT userId is the User table primary key, not the DoctorProfile key.
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where:  { userId: req.user.userId },
        select: { id: true },
      });

      if (!doctorProfile) {
        return ApiResponse.error(res, 'NOT_FOUND', 'Doctor profile not found', 404);
      }

      const consent = await prisma.patientConsent.findFirst({
        where: {
          patientId,
          doctorId: doctorProfile.id,   // ← correct: DoctorProfile.id
          status:   'ACTIVE',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (!consent) {
        return ApiResponse.error(
          res,
          'CONSENT_REQUIRED',
          'Patient consent required to access this data',
          403,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
