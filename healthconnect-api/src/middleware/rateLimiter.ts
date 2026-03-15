import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (
  windowMs = 15 * 60 * 1000,
  maxRequests = 1000
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requestCounts.set(key, record);
    } else {
      record.count++;
    }

    if (record.count > maxRequests) {
      return ApiResponse.error(
        res,
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later',
        429
      );
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', record.resetTime);

    next();
  };
};

// Auth endpoints — 50 attempts per 15 minutes per IP (was effectively very low)
export const authRateLimiter = rateLimiter(15 * 60 * 1000, 500);
