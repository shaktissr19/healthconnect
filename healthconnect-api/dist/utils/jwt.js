"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBearerToken = exports.decodeToken = exports.verifyRefreshToken = exports.verifyToken = exports.generateRefreshToken = exports.generateToken = void 0;
// src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ── FIX: Use a separate secret for refresh tokens ─────────────────────────────
// Previously both access and refresh tokens used JWT_SECRET, meaning a stolen
// access token could be submitted as a refresh token and vice versa.
const JWT_SECRET = process.env.JWT_SECRET || 'healthconnect-dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'healthconnect-dev-refresh-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
// ── Generate access token (15 min) ───────────────────────────────────────────
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};
exports.generateToken = generateToken;
// ── Generate refresh token (7 days) — uses its own secret ────────────────────
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
};
exports.generateRefreshToken = generateRefreshToken;
// ── Verify access token ───────────────────────────────────────────────────────
const verifyToken = (token) => {
    // ── FIX: only catch jwt errors here; let unexpected errors propagate as 500 ─
    const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    return decoded;
    // jwt.verify throws JsonWebTokenError | TokenExpiredError | NotBeforeError.
    // auth.ts middleware already catches those and maps them to 401 responses.
};
exports.verifyToken = verifyToken;
// ── Verify refresh token — uses refresh secret ────────────────────────────────
const verifyRefreshToken = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    return decoded;
};
exports.verifyRefreshToken = verifyRefreshToken;
// ── Decode without verification (for expired token inspection) ────────────────
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
};
exports.decodeToken = decodeToken;
// ── Extract token from Authorization header ───────────────────────────────────
const extractBearerToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return null;
    return authHeader.split(' ')[1] || null;
};
exports.extractBearerToken = extractBearerToken;
//# sourceMappingURL=jwt.js.map