"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const apiError_1 = require("../utils/apiError");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const registrationId_1 = require("../utils/registrationId");
const helpers_1 = require("../utils/helpers");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const register = async (input) => {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists)
        throw apiError_1.ApiError.conflict('EMAIL_ALREADY_EXISTS', 'Email already registered');
    const [hashed, registrationId] = await Promise.all([
        (0, password_1.hashPassword)(input.password),
        (0, registrationId_1.generateRegistrationId)(input.role),
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
                        lastName: input.lastName,
                        phone: input.phone,
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
            doctorProfile: true,
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
    const token = (0, jwt_1.generateToken)({ userId: user.id, role: user.role, registrationId });
    const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role, registrationId });
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    const profile = user.patientProfile || user.doctorProfile || user.hospitalProfile;
    return {
        token, refreshToken,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            registrationId: user.registrationId,
            firstName: profile?.firstName || input.firstName,
            lastName: profile?.lastName || input.lastName,
            subscriptionTier: 'FREE',
        },
    };
};
exports.register = register;
const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            patientProfile: { select: { firstName: true, lastName: true } },
            doctorProfile: { select: { firstName: true, lastName: true } },
            hospitalProfile: { select: { name: true } },
            subscriptions: {
                where: { status: 'ACTIVE', endDate: { gt: new Date() } },
                include: { plan: { select: { name: true } } },
                orderBy: { startDate: 'desc' }, take: 1,
            },
        },
    });
    if (!user || !user.isActive)
        throw apiError_1.ApiError.unauthorized('Invalid credentials');
    const match = await (0, password_1.comparePassword)(password, user.passwordHash);
    if (!match)
        throw apiError_1.ApiError.unauthorized('Invalid credentials');
    const payload = { userId: user.id, role: user.role, registrationId: user.registrationId };
    const token = (0, jwt_1.generateToken)(payload);
    const refresh = (0, jwt_1.generateRefreshToken)(payload);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: refresh, lastLoginAt: new Date() } });
    const profile = user.patientProfile || user.doctorProfile;
    const sub = user.subscriptions[0];
    return {
        token, refreshToken: refresh,
        user: {
            id: user.id, email: user.email, role: user.role,
            registrationId: user.registrationId,
            firstName: profile?.firstName || '',
            lastName: profile?.lastName || '',
            subscriptionTier: sub?.plan?.name?.toUpperCase() || 'FREE',
        },
    };
};
exports.login = login;
const logout = async (userId) => {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};
exports.logout = logout;
const refreshToken = async (token) => {
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.refreshToken !== token)
            throw new Error('Invalid refresh token');
        const newToken = (0, jwt_1.generateToken)({ userId: user.id, role: user.role, registrationId: user.registrationId });
        return { token: newToken };
    }
    catch {
        throw apiError_1.ApiError.unauthorized('Invalid or expired refresh token');
    }
};
exports.refreshToken = refreshToken;
const forgotPassword = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return; // Silent — don't reveal if email exists
    const resetToken = (0, helpers_1.generateAccessToken)();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry } });
    logger_1.logger.info(`Password reset token generated for ${email}: ${resetToken}`);
    // TODO: Send email via email service
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (token, newPassword) => {
    const user = await prisma.user.findFirst({
        where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } },
    });
    if (!user)
        throw apiError_1.ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired reset token');
    const hashed = await (0, password_1.hashPassword)(newPassword);
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed, passwordResetToken: null, passwordResetExpiry: null },
    });
};
exports.resetPassword = resetPassword;
const getCurrentUser = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            patientProfile: { select: { firstName: true, lastName: true, phone: true, bloodGroup: true } },
            doctorProfile: { select: { firstName: true, lastName: true, specialization: true } },
            hospitalProfile: { select: { name: true } },
            subscriptions: {
                where: { status: 'ACTIVE', endDate: { gt: new Date() } },
                include: { plan: { select: { name: true } } },
                take: 1,
            },
        },
    });
    if (!user)
        throw apiError_1.ApiError.notFound('User not found');
    const profile = user.patientProfile || user.doctorProfile;
    return {
        id: user.id, email: user.email, role: user.role,
        registrationId: user.registrationId,
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        subscriptionTier: user.subscriptions[0]?.plan?.name?.toUpperCase() || 'FREE',
    };
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.service.js.map