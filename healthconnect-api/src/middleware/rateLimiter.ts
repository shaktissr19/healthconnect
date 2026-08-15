// src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

type RateLimitRecord = { count: number; resetTime: number };
type KeyGenerator = (req: Request) => string;

const defaultKeyGenerator: KeyGenerator = (req) => req.ip || 'unknown';

export const rateLimiter = (
  windowMs = 15 * 60 * 1000,
  maxRequests = 1000,
  keyGenerator: KeyGenerator = defaultKeyGenerator,
) => {
  // IMPORTANT: every limiter instance owns its own store. Previously one global
  // map was shared by global/public/auth limiters, so unrelated page/API traffic
  // could consume the 10-request auth budget and block legitimate logins.
  const requestCounts = new Map<string, RateLimitRecord>();

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime) requestCounts.delete(key);
    }
  }, Math.min(windowMs, 5 * 60 * 1000));

  // Do not keep the Node process alive only for limiter cleanup.
  cleanupTimer.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requestCounts.set(key, record);
    } else {
      record.count += 1;
    }

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', record.resetTime);

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

// Authentication-sensitive endpoints: 10 requests per 15 minutes.
// For login/forgot-password/register, include normalized email when present so
// one user's failed attempts do not consume every other user's allowance on the
// same NAT/mobile/corporate IP. IP remains part of the key to limit distributed
// abuse against one account from the same source.
const authKeyGenerator: KeyGenerator = (req) => {
  const ip = req.ip || 'unknown';
  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase().slice(0, 254)
    : '';
  return email ? `${ip}:${email}` : `${ip}:${req.path}`;
};

export const authRateLimiter = rateLimiter(15 * 60 * 1000, 10, authKeyGenerator);

// Public read endpoints are intentionally more generous.
export const publicRateLimiter = rateLimiter(15 * 60 * 1000, 500);
