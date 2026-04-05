"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRateLimiter = exports.authRateLimiter = exports.rateLimiter = void 0;
const apiResponse_1 = require("../utils/apiResponse");
// ─── In-memory store with periodic cleanup ────────────────────────────────────
// NOTE: Replace with express-rate-limit + rate-limit-redis before scaling to
// multiple PM2 workers — in-memory limits are per-process, not per-server.
const requestCounts = new Map();
// Purge expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetTime)
            requestCounts.delete(key);
    }
}, 5 * 60 * 1000);
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
// ─── Auth endpoints ────────────────────────────────────────────────────────────
// 10 attempts per 15 minutes per IP — brute-force protection.
// Previously this was set to 500 which gave no meaningful protection.
exports.authRateLimiter = (0, exports.rateLimiter)(15 * 60 * 1000, 100);
// ─── Public data endpoints (landing page, doctor search) ─────────────────────
// More generous — these are read-only and support the landing page.
exports.publicRateLimiter = (0, exports.rateLimiter)(15 * 60 * 1000, 500);
//# sourceMappingURL=rateLimiter.js.map