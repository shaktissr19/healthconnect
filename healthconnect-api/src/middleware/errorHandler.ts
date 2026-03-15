import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle ApiError
  if (error instanceof ApiError) {
    return ApiResponse.error(
      res,
      error.errorCode,
      error.message,
      error.statusCode,
      error.errors
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const field = (error.meta?.target as string[])?.[0] || 'field';
        return ApiResponse.error(
          res,
          'ALREADY_EXISTS',
          `A record with this ${field} already exists`,
          409
        );
      case 'P2025': // Record not found
        return ApiResponse.notFound(res, 'Record not found');
      default:
        return ApiResponse.internalError(res, 'Database error');
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return ApiResponse.error(res, 'VALIDATION_FAILED', error.message, 422);
  }

  // Default to 500
  return ApiResponse.internalError(res);
};
