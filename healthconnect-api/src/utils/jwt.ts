// src/utils/jwt.ts
import jwt   from 'jsonwebtoken';
import { ApiError } from './apiError';

// ── FIX: Use a separate secret for refresh tokens ─────────────────────────────
// Previously both access and refresh tokens used JWT_SECRET, meaning a stolen
// access token could be submitted as a refresh token and vice versa.
const JWT_SECRET         = process.env.JWT_SECRET          || 'healthconnect-dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET  || 'healthconnect-dev-refresh-secret-change-in-production';
const JWT_EXPIRY         = process.env.JWT_EXPIRY          || '15m';
const REFRESH_EXPIRY     = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface JwtPayload {
  userId:         string;
  role:           string;
  registrationId: string;
  iat?:           number;
  exp?:           number;
}

// ── Generate access token (15 min) ───────────────────────────────────────────
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);
};

// ── Generate refresh token (7 days) — uses its own secret ────────────────────
export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions);
};

// ── Verify access token ───────────────────────────────────────────────────────
export const verifyToken = (token: string): JwtPayload => {
  // ── FIX: only catch jwt errors here; let unexpected errors propagate as 500 ─
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  return decoded;
  // jwt.verify throws JsonWebTokenError | TokenExpiredError | NotBeforeError.
  // auth.ts middleware already catches those and maps them to 401 responses.
};

// ── Verify refresh token — uses refresh secret ────────────────────────────────
export const verifyRefreshToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  return decoded;
};

// ── Decode without verification (for expired token inspection) ────────────────
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

// ── Extract token from Authorization header ───────────────────────────────────
export const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1] || null;
};
