"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPhone = exports.maskEmail = exports.sanitizeString = exports.buildPaginationMeta = exports.getPaginationParams = exports.formatDateTimeIN = exports.formatDateIN = exports.generateOTP = exports.generateAccessToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
// ── Generate secure random token (for password reset, email verify) ───
const generateAccessToken = (bytes = 32) => {
    return crypto_1.default.randomBytes(bytes).toString('hex');
};
exports.generateAccessToken = generateAccessToken;
// ── Generate OTP ──────────────────────────────────────────────────────
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
};
exports.generateOTP = generateOTP;
// ── Format date for Indian locale ────────────────────────────────────
const formatDateIN = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};
exports.formatDateIN = formatDateIN;
// ── Format datetime for Indian locale ────────────────────────────────
const formatDateTimeIN = (date) => {
    return new Date(date).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
    });
};
exports.formatDateTimeIN = formatDateTimeIN;
// ── Pagination helper ─────────────────────────────────────────────────
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPaginationParams = getPaginationParams;
// ── Build pagination meta ─────────────────────────────────────────────
const buildPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
});
exports.buildPaginationMeta = buildPaginationMeta;
// ── Sanitize string (remove potential XSS) ────────────────────────────
const sanitizeString = (str) => {
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};
exports.sanitizeString = sanitizeString;
// ── Mask sensitive data for logging (no PHI in logs) ──────────────────
const maskEmail = (email) => {
    const [local, domain] = email.split('@');
    if (!local || !domain)
        return '***';
    return local[0] + '***@' + domain;
};
exports.maskEmail = maskEmail;
const maskPhone = (phone) => {
    if (phone.length < 4)
        return '****';
    return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
};
exports.maskPhone = maskPhone;
//# sourceMappingURL=helpers.js.map