import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return ApiResponse.forbidden(res, 'You do not have permission to access this resource');
    }

    next();
  };
};

// Convenience middleware for specific roles
export const requirePatient = requireRole('PATIENT');
export const requireDoctor = requireRole('DOCTOR');
export const requireHospital = requireRole('HOSPITAL');
export const requireAdmin = requireRole('ADMIN');
export const requireDoctorOrAdmin = requireRole('DOCTOR', 'ADMIN');
export const requirePatientOrDoctor = requireRole('PATIENT', 'DOCTOR');
