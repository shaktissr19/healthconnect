import jwt from 'jsonwebtoken';
import { ApiError } from './apiError';

const JWT_SECRET         = process.env.JWT_SECRET         || 'healthconnect-dev-secret-change-in-production';
const JWT_EXPIRY         = process.env.JWT_EXPIRY         || '15m';
const REFRESH_EXPIRY     = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface JwtPayload {
  userId:         string;
  role:           string;
  registrationId: string;
  iat?:           number;
  exp?:           number;
}

// ── Generate access token (15 min) ────────────────────────────────────
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);
};

// ── Generate refresh token (7 days) ──────────────────────────────────
export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions);
};

// ── Verify token ──────────────────────────────────────────────────────
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired. Please login again.');
    }
    throw ApiError.unauthorized('Invalid token.');
  }
};

// ── Decode without verification (for expired token refresh flows) ─────
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

// ── Extract token from Authorization header ───────────────────────────
export const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1] || null;
};