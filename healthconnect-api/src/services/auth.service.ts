// src/services/auth.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXED: Email verification now uses dedicated emailVerifyToken + emailVerifyExpiry
//        fields instead of reusing passwordResetToken (which caused conflicts).
// ─────────────────────────────────────────────────────────────────────────────
import { Role }    from '@prisma/client';
import crypto      from 'crypto';
import { ApiError } from '../utils/apiError';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateRegistrationId }  from '../utils/registrationId';
import { generateAccessToken }     from '../utils/helpers';
import { logger }                  from '../utils/logger';
import { prisma }                  from '../lib/prisma';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from './email.service';

const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

const safeEqual = (a: string, b: string): boolean => {
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
  catch { return false; }
};

export interface RegisterInput {
  email: string; password: string; role: Role;
  firstName: string; lastName: string; phone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (input: RegisterInput) => {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw ApiError.conflict('EMAIL_ALREADY_EXISTS', 'Email already registered');

  const [hashed, registrationId] = await Promise.all([
    hashPassword(input.password),
    generateRegistrationId(input.role),
  ]);

  // Generate email verification token (dedicated field — no conflict with password reset)
  const verifyToken  = generateAccessToken(32);
  const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await prisma.user.create({
    data: {
      email:            input.email,
      passwordHash:     hashed,
      role:             input.role,
      registrationId,
      isEmailVerified:  false,
      isActive:         true,
      emailVerifyToken:  hashToken(verifyToken),
      emailVerifyExpiry: verifyExpiry,
      ...(input.role === 'PATIENT' && {
        patientProfile: { create: { firstName: input.firstName, lastName: input.lastName, phone: input.phone } },
      }),
      ...(input.role === 'DOCTOR' && {
        doctorProfile: { create: { firstName: input.firstName, lastName: input.lastName, phone: input.phone } },
      }),
      ...(input.role === 'HOSPITAL' && {
        hospitalProfile: { create: { name: `${input.firstName} ${input.lastName}` } },
      }),
    },
    include: { patientProfile: true, doctorProfile: true, hospitalProfile: true },
  });

  // Create free subscription for patients
  if (input.role === 'PATIENT') {
    const freePlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Basic' } });
    if (freePlan) {
      await prisma.userSubscription.create({
        data: {
          userId: user.id, planId: freePlan.id, status: 'ACTIVE',
          startDate: new Date(), endDate: new Date('2099-12-31'), billingCycle: 'MONTHLY',
        },
      });
    }
  }

  const realToken  = generateToken({ userId: user.id, role: user.role, registrationId });
  const refreshTok = generateRefreshToken({ userId: user.id, role: user.role, registrationId });

  await prisma.user.update({
    where: { id: user.id },
    data:  { refreshToken: hashToken(refreshTok) },
  });

  // Send emails (fire-and-forget)
  sendVerificationEmail(input.email, input.firstName, verifyToken).catch(() => {});
  sendWelcomeEmail(input.email, input.firstName, input.role).catch(() => {});

  const profile = user.patientProfile || user.doctorProfile || user.hospitalProfile;

  return {
    token: realToken, refreshToken: refreshTok,
    user: {
      id: user.id, email: user.email, role: user.role,
      registrationId: user.registrationId,
      isEmailVerified: false,
      firstName: (profile as any)?.firstName || input.firstName,
      lastName:  (profile as any)?.lastName  || input.lastName,
      subscriptionTier: 'FREE',
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const login = async ({ email, password }: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patientProfile:  { select: { firstName: true, lastName: true } },
      doctorProfile:   { select: { firstName: true, lastName: true } },
      hospitalProfile: { select: { name: true } },
      subscriptions: {
        where: { status: 'ACTIVE', endDate: { gt: new Date() } },
        include: { plan: { select: { name: true } } },
        orderBy: { startDate: 'desc' }, take: 1,
      },
    },
  });

  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');
  const match = await comparePassword(password, user.passwordHash);
  if (!match) throw ApiError.unauthorized('Invalid credentials');

  const payload = { userId: user.id, role: user.role, registrationId: user.registrationId };
  const token   = generateToken(payload);
  const refresh = generateRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data:  { refreshToken: hashToken(refresh), lastLoginAt: new Date() },
  });

  const profile = user.patientProfile || user.doctorProfile;
  const sub     = user.subscriptions[0];

  return {
    token, refreshToken: refresh,
    user: {
      id: user.id, email: user.email, role: user.role,
      registrationId:  user.registrationId,
      isEmailVerified: user.isEmailVerified,
      firstName: (profile as any)?.firstName || '',
      lastName:  (profile as any)?.lastName  || '',
      subscriptionTier: sub?.plan?.name?.toUpperCase() || 'FREE',
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (userId: string) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────────────────
export const refreshToken = async (token: string) => {
  try {
    const decoded = verifyRefreshToken(token);
    const user    = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.refreshToken) throw new Error('Invalid');
    if (!safeEqual(hashToken(token), user.refreshToken)) throw new Error('Invalid');
    const newToken = generateToken({ userId: user.id, role: user.role, registrationId: user.registrationId });
    return { token: newToken };
  } catch { throw ApiError.unauthorized('Invalid or expired refresh token'); }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patientProfile:  { select: { firstName: true } },
      doctorProfile:   { select: { firstName: true } },
      hospitalProfile: { select: { name: true } },
    },
  });
  if (!user) return; // Silent — don't reveal if email exists

  const resetToken  = generateAccessToken(32);
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Uses passwordResetToken — separate from emailVerifyToken, no conflict
  await prisma.user.update({
    where: { id: user.id },
    data:  { passwordResetToken: hashToken(resetToken), passwordResetExpiry: resetExpiry },
  });

  const firstName = user.patientProfile?.firstName || user.doctorProfile?.firstName || user.hospitalProfile?.name || 'there';
  await sendPasswordResetEmail(email, firstName, resetToken);
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: hashedToken, passwordResetExpiry: { gt: new Date() } },
  });
  if (!user) throw ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired reset token');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data:  { passwordHash: hashed, passwordResetToken: null, passwordResetExpiry: null },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL  — uses dedicated emailVerifyToken field
// ─────────────────────────────────────────────────────────────────────────────
export const verifyEmail = async (token: string) => {
  const hashedToken = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken:  hashedToken,
      emailVerifyExpiry: { gt: new Date() },
      isEmailVerified:   false,
    },
  });
  if (!user) throw ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired verification link');

  await prisma.user.update({
    where: { id: user.id },
    data:  { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// RESEND VERIFICATION EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export const resendVerification = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patientProfile: { select: { firstName: true } },
      doctorProfile:  { select: { firstName: true } },
    },
  });
  if (!user)                throw ApiError.notFound('User not found');
  if (user.isEmailVerified) throw ApiError.badRequest('ALREADY_VERIFIED', 'Email already verified');

  const verifyToken  = generateAccessToken(32);
  const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data:  { emailVerifyToken: hashToken(verifyToken), emailVerifyExpiry: verifyExpiry },
  });

  const firstName = user.patientProfile?.firstName || user.doctorProfile?.firstName || 'there';
  await sendVerificationEmail(user.email, firstName, verifyToken);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patientProfile:  { select: { firstName: true, lastName: true, phone: true, bloodGroup: true } },
      doctorProfile:   { select: { firstName: true, lastName: true, specialization: true } },
      hospitalProfile: { select: { name: true } },
      subscriptions: {
        where: { status: 'ACTIVE', endDate: { gt: new Date() } },
        include: { plan: { select: { name: true } } },
        take: 1,
      },
    },
  });
  if (!user) throw ApiError.notFound('User not found');
  const profile = user.patientProfile || user.doctorProfile;
  return {
    id: user.id, email: user.email, role: user.role,
    registrationId:  user.registrationId,
    isEmailVerified: user.isEmailVerified,
    firstName: (profile as any)?.firstName || '',
    lastName:  (profile as any)?.lastName  || '',
    subscriptionTier: user.subscriptions[0]?.plan?.name?.toUpperCase() || 'FREE',
  };
};
