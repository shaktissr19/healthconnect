import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { getAccessTokenFromRequest } from '../utils/authCookies';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Prefer the HttpOnly access cookie. Bearer remains supported temporarily
    // for backward compatibility with existing API clients during migration.
    const token = getAccessTokenFromRequest(req);

    if (!token) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }

    try {
      req.user = verifyToken(token);
      return next();
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        return ApiResponse.error(res, 'TOKEN_EXPIRED', 'Token has expired', 401);
      }
      return ApiResponse.error(res, 'INVALID_TOKEN', 'Invalid token', 401);
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return ApiResponse.internalError(res);
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = getAccessTokenFromRequest(req);
    if (token) {
      try {
        req.user = verifyToken(token);
      } catch {
        // Optional auth intentionally ignores invalid/expired credentials.
      }
    }
    return next();
  } catch {
    return next();
  }
};
