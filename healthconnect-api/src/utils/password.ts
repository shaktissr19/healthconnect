// src/utils/password.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ApiError } from './apiError';

const SALT_ROUNDS = 12; // >= 10 as per DPDP compliance requirement

// ── Hash password ─────────────────────────────────────────────────────────────
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// ── Compare password ──────────────────────────────────────────────────────────
export const comparePassword = async (
  plainText: string,
  hash:      string,
): Promise<boolean> => {
  return bcrypt.compare(plainText, hash);
};

// ── Validate password strength ────────────────────────────────────────────────
export const validatePasswordStrength = (password: string): void => {
  if (password.length < 8) {
    throw ApiError.badRequest('WEAK_PASSWORD', 'Password must be at least 8 characters');
  }
  if (password.length > 128) {
    throw ApiError.badRequest('WEAK_PASSWORD', 'Password must not exceed 128 characters');
  }
};

// ── FIX: Generate secure random password using crypto ────────────────────────
// Previously used Math.random() which is not cryptographically secure.
// Replaced with crypto.randomBytes — maps bytes to charset via modulo.
// The charset avoids visually ambiguous chars (0/O, 1/l/I) for readability.
export const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const bytes = crypto.randomBytes(12);
  let password = '';
  for (const byte of bytes) {
    password += chars[byte % chars.length];
  }
  return password;
};
