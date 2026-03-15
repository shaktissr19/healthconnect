"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBearerToken = exports.decodeToken = exports.verifyToken = exports.generateRefreshToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiError_1 = require("./apiError");
const JWT_SECRET = process.env.JWT_SECRET || 'healthconnect-dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
// ── Generate access token (15 min) ────────────────────────────────────
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};
exports.generateToken = generateToken;
// ── Generate refresh token (7 days) ──────────────────────────────────
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
};
exports.generateRefreshToken = generateRefreshToken;
// ── Verify token ──────────────────────────────────────────────────────
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw apiError_1.ApiError.unauthorized('Token has expired. Please login again.');
        }
        throw apiError_1.ApiError.unauthorized('Invalid token.');
    }
};
exports.verifyToken = verifyToken;
// ── Decode without verification (for expired token refresh flows) ─────
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
};
exports.decodeToken = decodeToken;
// ── Extract token from Authorization header ───────────────────────────
const extractBearerToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return null;
    return authHeader.split(' ')[1] || null;
};
exports.extractBearerToken = extractBearerToken;
//# sourceMappingURL=jwt.js.map