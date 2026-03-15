"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomPassword = exports.validatePasswordStrength = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const apiError_1 = require("./apiError");
const SALT_ROUNDS = 12; // >= 10 as per DPDP compliance requirement
// ── Hash password ─────────────────────────────────────────────────────
const hashPassword = async (password) => {
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
// ── Compare password ──────────────────────────────────────────────────
const comparePassword = async (plainText, hash) => {
    return bcrypt_1.default.compare(plainText, hash);
};
exports.comparePassword = comparePassword;
// ── Validate password strength ────────────────────────────────────────
const validatePasswordStrength = (password) => {
    if (password.length < 8) {
        throw apiError_1.ApiError.badRequest('WEAK_PASSWORD', 'Password must be at least 8 characters');
    }
    if (password.length > 128) {
        throw apiError_1.ApiError.badRequest('WEAK_PASSWORD', 'Password must not exceed 128 characters');
    }
};
exports.validatePasswordStrength = validatePasswordStrength;
// ── Generate secure random password (for admin-created accounts) ──────
const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
};
exports.generateRandomPassword = generateRandomPassword;
//# sourceMappingURL=password.js.map