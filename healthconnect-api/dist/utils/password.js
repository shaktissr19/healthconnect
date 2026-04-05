"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomPassword = exports.validatePasswordStrength = exports.comparePassword = exports.hashPassword = void 0;
// src/utils/password.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const apiError_1 = require("./apiError");
const SALT_ROUNDS = 12; // >= 10 as per DPDP compliance requirement
// ── Hash password ─────────────────────────────────────────────────────────────
const hashPassword = async (password) => {
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
// ── Compare password ──────────────────────────────────────────────────────────
const comparePassword = async (plainText, hash) => {
    return bcrypt_1.default.compare(plainText, hash);
};
exports.comparePassword = comparePassword;
// ── Validate password strength ────────────────────────────────────────────────
const validatePasswordStrength = (password) => {
    if (password.length < 8) {
        throw apiError_1.ApiError.badRequest('WEAK_PASSWORD', 'Password must be at least 8 characters');
    }
    if (password.length > 128) {
        throw apiError_1.ApiError.badRequest('WEAK_PASSWORD', 'Password must not exceed 128 characters');
    }
};
exports.validatePasswordStrength = validatePasswordStrength;
// ── FIX: Generate secure random password using crypto ────────────────────────
// Previously used Math.random() which is not cryptographically secure.
// Replaced with crypto.randomBytes — maps bytes to charset via modulo.
// The charset avoids visually ambiguous chars (0/O, 1/l/I) for readability.
const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const bytes = crypto_1.default.randomBytes(12);
    let password = '';
    for (const byte of bytes) {
        password += chars[byte % chars.length];
    }
    return password;
};
exports.generateRandomPassword = generateRandomPassword;
//# sourceMappingURL=password.js.map