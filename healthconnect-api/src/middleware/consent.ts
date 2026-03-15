import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

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

      const consent = await prisma.patientConsent.findFirst({
        where: {
          patientId,
          doctorId: req.user.userId,
          status: 'ACTIVE',
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
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
