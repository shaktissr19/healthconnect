import bcrypt from 'bcrypt';
import { ApiError } from './apiError';

const SALT_ROUNDS = 12; // >= 10 as per DPDP compliance requirement

// ── Hash password ─────────────────────────────────────────────────────
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// ── Compare password ──────────────────────────────────────────────────
export const comparePassword = async (
  plainText: string,
  hash:      string,
): Promise<boolean> => {
  return bcrypt.compare(plainText, hash);
};

// ── Validate password strength ────────────────────────────────────────
export const validatePasswordStrength = (password: string): void => {
  if (password.length < 8) {
    throw ApiError.badRequest('WEAK_PASSWORD', 'Password must be at least 8 characters');
  }
  if (password.length > 128) {
    throw ApiError.badRequest('WEAK_PASSWORD', 'Password must not exceed 128 characters');
  }
};

// ── Generate secure random password (for admin-created accounts) ──────
export const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};