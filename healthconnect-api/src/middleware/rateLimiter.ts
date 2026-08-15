// src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

// In-memory store is acceptable for the current single-process/fork deployment,
// but must move to Redis before running multiple PM2 workers/instances.
const requestCounts = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) requestCounts.delete(key);
  }
}, 5 * 60 * 1000);

export const rateLimiter = (
  windowMs = 15 * 60 * 1000,
  maxRequests = 1000,
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
        429,
      );
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', record.resetTime);

    next();
  };
};

// Authentication-sensitive endpoints: 10 requests per 15 minutes per IP.
export const authRateLimiter = rateLimiter(15 * 60 * 1000, 10);

// Public read endpoints are intentionally more generous.
export const publicRateLimiter = rateLimiter(15 * 60 * 1000, 500);
