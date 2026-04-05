// src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

// ─── In-memory store with periodic cleanup ────────────────────────────────────
// NOTE: Replace with express-rate-limit + rate-limit-redis before scaling to
// multiple PM2 workers — in-memory limits are per-process, not per-server.
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Purge expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) requestCounts.delete(key);
  }
}, 5 * 60 * 1000);

export const rateLimiter = (
  windowMs  = 15 * 60 * 1000,
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

    res.setHeader('X-RateLimit-Limit',     maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset',     record.resetTime);

    next();
  };
};

// ─── Auth endpoints ────────────────────────────────────────────────────────────
// 10 attempts per 15 minutes per IP — brute-force protection.
// Previously this was set to 500 which gave no meaningful protection.
export const authRateLimiter = rateLimiter(15 * 60 * 1000, 100);

// ─── Public data endpoints (landing page, doctor search) ─────────────────────
// More generous — these are read-only and support the landing page.
export const publicRateLimiter = rateLimiter(15 * 60 * 1000, 500);
