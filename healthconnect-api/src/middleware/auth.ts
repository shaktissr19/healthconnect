import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return ApiResponse.error(res, 'TOKEN_EXPIRED', 'Token has expired', 401);
      }
      return ApiResponse.error(res, 'INVALID_TOKEN', 'Invalid token', 401);
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return ApiResponse.internalError(res);
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        req.user = verifyToken(token);
      } catch {
        // Ignore invalid tokens for optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};
