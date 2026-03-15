"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.rateLimiter = void 0;
const apiResponse_1 = require("../utils/apiResponse");
// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map();
const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 1000) => {
    return (req, res, next) => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        let record = requestCounts.get(key);
        if (!record || now > record.resetTime) {
            record = { count: 1, resetTime: now + windowMs };
            requestCounts.set(key, record);
        }
        else {
            record.count++;
        }
        if (record.count > maxRequests) {
            return apiResponse_1.ApiResponse.error(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later', 429);
        }
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', record.resetTime);
        next();
    };
};
exports.rateLimiter = rateLimiter;
// Auth endpoints — 50 attempts per 15 minutes per IP (was effectively very low)
exports.authRateLimiter = (0, exports.rateLimiter)(15 * 60 * 1000, 500);
//# sourceMappingURL=rateLimiter.js.map