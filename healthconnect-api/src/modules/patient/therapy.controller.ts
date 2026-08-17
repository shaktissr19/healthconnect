import { Request, Response, NextFunction } from 'express';
import * as PatientService from './service';
import { ApiResponse } from '../../utils/apiResponse';

export const updateTherapy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(
      res,
      await PatientService.updateTherapy(req.user!.userId, req.params.therapyId, req.body),
      'Therapy updated',
    );
  } catch (error) {
    next(error);
  }
};
