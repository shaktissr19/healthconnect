import { PrismaClient, Role } from '@prisma/client';
import { ApiError }           from '../utils/apiError';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { generateRegistrationId }  from '../utils/registrationId';
import { generateAccessToken }     from '../utils/helpers';
import { logger }                  from '../utils/logger';

const prisma = new PrismaClient();

export interface RegisterInput {
  email: string; password: string; role: Role;
  firstName: string; lastName: string; phone?: string;
}

export const register = async (input: RegisterInput) => {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw ApiError.conflict('EMAIL_ALREADY_EXISTS', 'Email already registered');

  const [hashed, registrationId] = await Promise.all([
    hashPassword(input.password),
    generateRegistrationId(input.role),
  ]);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: hashed,
      role: input.role,
      registrationId,
      isEmailVerified: false,
      isActive: true,
      ...(input.role === 'PATIENT' && {
        patientProfile: {
          create: {
            firstName: input.firstName,
            lastName:  input.lastName,
            phone:     input.phone,
          },
        },
      }),
      ...(input.role === 'DOCTOR' && {
        doctorProfile: {
          create: { firstName: input.firstName, lastName: input.lastName, phone: input.phone },
        },
      }),
      ...(input.role === 'HOSPITAL' && {
        hospitalProfile: {
          create: { name: `${input.firstName} ${input.lastName}` },
        },
      }),
    },
    include: {
      patientProfile: true,
      doctorProfile:  true,
      hospitalProfile: true,
    },
  });

  // Create free subscription for patients
  if (input.role === 'PATIENT') {
    const freePlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Basic' } });
    if (freePlan) {
      await prisma.userSubscription.create({
        data: {
          userId: user.id, planId: freePlan.id, status: 'ACTIVE',
          startDate: new Date(), endDate: new Date('2099-12-31'),
          billingCycle: 'MONTHLY',
        },
      });
    }
  }

  const token        = generateToken({ userId: user.id, role: user.role, registrationId });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, registrationId });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  const profile = user.patientProfile || user.doctorProfile || user.hospitalProfile;

  return {
    token, refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      registrationId: user.registrationId,
      firstName: (profile as any)?.firstName || input.firstName,
      lastName:  (profile as any)?.lastName  || input.lastName,
      subscriptionTier: 'FREE',
    },
  };
};

export const login = async ({ email, password }: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patientProfile:  { select: { firstName: true, lastName: true } },
      doctorProfile:   { select: { firstName: true, lastName: true } },
      hospitalProfile: { select: { name: true } },
      subscriptions:   {
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

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: refresh, lastLoginAt: new Date() } });

  const profile = user.patientProfile || user.doctorProfile;
  const sub     = user.subscriptions[0];

  return {
    token, refreshToken: refresh,
    user: {
      id: user.id, email: user.email, role: user.role,
      registrationId: user.registrationId,
      firstName: (profile as any)?.firstName || '',
      lastName:  (profile as any)?.lastName  || '',
      subscriptionTier: sub?.plan?.name?.toUpperCase() || 'FREE',
    },
  };
};

export const logout = async (userId: string) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};

export const refreshToken = async (token: string) => {
  try {
    const decoded = verifyToken(token);
    const user    = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== token) throw new Error('Invalid refresh token');
    const newToken = generateToken({ userId: user.id, role: user.role, registrationId: user.registrationId });
    return { token: newToken };
  } catch { throw ApiError.unauthorized('Invalid or expired refresh token'); }
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent — don't reveal if email exists
  const resetToken  = generateAccessToken();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry } });
  logger.info(`Password reset token generated for ${email}: ${resetToken}`);
  // TODO: Send email via email service
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } },
  });
  if (!user) throw ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired reset token');
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashed, passwordResetToken: null, passwordResetExpiry: null },
  });
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patientProfile:  { select: { firstName: true, lastName: true, phone: true, bloodGroup: true } },
      doctorProfile:   { select: { firstName: true, lastName: true, specialization: true } },
      hospitalProfile: { select: { name: true } },
      subscriptions:   {
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
    registrationId: user.registrationId,
    firstName: (profile as any)?.firstName || '',
    lastName:  (profile as any)?.lastName  || '',
    subscriptionTier: user.subscriptions[0]?.plan?.name?.toUpperCase() || 'FREE',
  };
};
