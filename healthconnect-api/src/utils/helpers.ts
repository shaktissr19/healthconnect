// src/utils/helpers.ts
import crypto from 'crypto';

// ── Generate secure random token (for password reset, email verify) ──────────
export const generateAccessToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

// ── FIX: Generate OTP using crypto, not Math.random ──────────────────────────
// Math.random() is not cryptographically secure — predictable under certain
// conditions. Health platform OTPs must use crypto.randomInt.
export const generateOTP = (length = 6): string => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
};

// ── Format date for Indian locale ────────────────────────────────────────────
export const formatDateIN = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

// ── Format datetime for Indian locale ────────────────────────────────────────
export const formatDateTimeIN = (date: Date | string): string => {
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
};

// ── Pagination helper — use utils/pagination.ts instead for new code ─────────
// Kept here for backward compatibility with existing callers.
export const getPaginationParams = (query: any): { page: number; limit: number; skip: number } => {
  const page  = Math.max(1, parseInt(query.page  as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 20));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

// ── Build pagination meta ─────────────────────────────────────────────────────
export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext:    page < Math.ceil(total / limit),
  hasPrev:    page > 1,
});

// ── Sanitize string (basic XSS prevention for display contexts) ───────────────
export const sanitizeString = (str: string): string => {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

// ── Mask sensitive data for logging — never log raw PII ──────────────────────
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  return local[0] + '***@' + domain;
};

export const maskPhone = (phone: string): string => {
  if (phone.length < 4) return '****';
  return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
};
