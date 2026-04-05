"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.resendVerification = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const apiError_1 = require("../utils/apiError");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const registrationId_1 = require("../utils/registrationId");
const helpers_1 = require("../utils/helpers");
const prisma_1 = require("../lib/prisma");
const email_service_1 = require("./email.service");
const hashToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
const safeEqual = (a, b) => {
    try {
        return crypto_1.default.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    }
    catch {
        return false;
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
const register = async (input) => {
    const exists = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
    if (exists)
        throw apiError_1.ApiError.conflict('EMAIL_ALREADY_EXISTS', 'Email already registered');
    const [hashed, registrationId] = await Promise.all([
        (0, password_1.hashPassword)(input.password),
        (0, registrationId_1.generateRegistrationId)(input.role),
    ]);
    // Generate email verification token (dedicated field — no conflict with password reset)
    const verifyToken = (0, helpers_1.generateAccessToken)(32);
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const user = await prisma_1.prisma.user.create({
        data: {
            email: input.email,
            passwordHash: hashed,
            role: input.role,
            registrationId,
            isEmailVerified: false,
            isActive: true,
            emailVerifyToken: hashToken(verifyToken),
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
        const freePlan = await prisma_1.prisma.subscriptionPlan.findFirst({ where: { name: 'Basic' } });
        if (freePlan) {
            await prisma_1.prisma.userSubscription.create({
                data: {
                    userId: user.id, planId: freePlan.id, status: 'ACTIVE',
                    startDate: new Date(), endDate: new Date('2099-12-31'), billingCycle: 'MONTHLY',
                },
            });
        }
    }
    const realToken = (0, jwt_1.generateToken)({ userId: user.id, role: user.role, registrationId });
    const refreshTok = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role, registrationId });
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashToken(refreshTok) },
    });
    // Send emails (fire-and-forget)
    (0, email_service_1.sendVerificationEmail)(input.email, input.firstName, verifyToken).catch(() => { });
    (0, email_service_1.sendWelcomeEmail)(input.email, input.firstName, input.role).catch(() => { });
    const profile = user.patientProfile || user.doctorProfile || user.hospitalProfile;
    return {
        token: realToken, refreshToken: refreshTok,
        user: {
            id: user.id, email: user.email, role: user.role,
            registrationId: user.registrationId,
            isEmailVerified: false,
            firstName: profile?.firstName || input.firstName,
            lastName: profile?.lastName || input.lastName,
            subscriptionTier: 'FREE',
        },
    };
};
exports.register = register;
// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
    const user = await prisma_1.prisma.user.findUnique({
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
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashToken(refresh), lastLoginAt: new Date() },
    });
    const profile = user.patientProfile || user.doctorProfile;
    const sub = user.subscriptions[0];
    return {
        token, refreshToken: refresh,
        user: {
            id: user.id, email: user.email, role: user.role,
            registrationId: user.registrationId,
            isEmailVerified: user.isEmailVerified,
            firstName: profile?.firstName || '',
            lastName: profile?.lastName || '',
            subscriptionTier: sub?.plan?.name?.toUpperCase() || 'FREE',
        },
    };
};
exports.login = login;
// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (userId) => {
    await prisma_1.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};
exports.logout = logout;
// ─────────────────────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────────────────
const refreshToken = async (token) => {
    try {
        const decoded = (0, jwt_1.verifyRefreshToken)(token);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.refreshToken)
            throw new Error('Invalid');
        if (!safeEqual(hashToken(token), user.refreshToken))
            throw new Error('Invalid');
        const newToken = (0, jwt_1.generateToken)({ userId: user.id, role: user.role, registrationId: user.registrationId });
        return { token: newToken };
    }
    catch {
        throw apiError_1.ApiError.unauthorized('Invalid or expired refresh token');
    }
};
exports.refreshToken = refreshToken;
// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email },
        include: {
            patientProfile: { select: { firstName: true } },
            doctorProfile: { select: { firstName: true } },
            hospitalProfile: { select: { name: true } },
        },
    });
    if (!user)
        return; // Silent — don't reveal if email exists
    const resetToken = (0, helpers_1.generateAccessToken)(32);
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    // Uses passwordResetToken — separate from emailVerifyToken, no conflict
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: hashToken(resetToken), passwordResetExpiry: resetExpiry },
    });
    const firstName = user.patientProfile?.firstName || user.doctorProfile?.firstName || user.hospitalProfile?.name || 'there';
    await (0, email_service_1.sendPasswordResetEmail)(email, firstName, resetToken);
};
exports.forgotPassword = forgotPassword;
// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
    const hashedToken = hashToken(token);
    const user = await prisma_1.prisma.user.findFirst({
        where: { passwordResetToken: hashedToken, passwordResetExpiry: { gt: new Date() } },
    });
    if (!user)
        throw apiError_1.ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired reset token');
    const hashed = await (0, password_1.hashPassword)(newPassword);
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed, passwordResetToken: null, passwordResetExpiry: null },
    });
};
exports.resetPassword = resetPassword;
// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL  — uses dedicated emailVerifyToken field
// ─────────────────────────────────────────────────────────────────────────────
const verifyEmail = async (token) => {
    const hashedToken = hashToken(token);
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            emailVerifyToken: hashedToken,
            emailVerifyExpiry: { gt: new Date() },
            isEmailVerified: false,
        },
    });
    if (!user)
        throw apiError_1.ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired verification link');
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
    });
};
exports.verifyEmail = verifyEmail;
// ─────────────────────────────────────────────────────────────────────────────
// RESEND VERIFICATION EMAIL
// ─────────────────────────────────────────────────────────────────────────────
const resendVerification = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            patientProfile: { select: { firstName: true } },
            doctorProfile: { select: { firstName: true } },
        },
    });
    if (!user)
        throw apiError_1.ApiError.notFound('User not found');
    if (user.isEmailVerified)
        throw apiError_1.ApiError.badRequest('ALREADY_VERIFIED', 'Email already verified');
    const verifyToken = (0, helpers_1.generateAccessToken)(32);
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifyToken: hashToken(verifyToken), emailVerifyExpiry: verifyExpiry },
    });
    const firstName = user.patientProfile?.firstName || user.doctorProfile?.firstName || 'there';
    await (0, email_service_1.sendVerificationEmail)(user.email, firstName, verifyToken);
};
exports.resendVerification = resendVerification;
// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────────────────────────────────────
const getCurrentUser = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
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
        isEmailVerified: user.isEmailVerified,
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        subscriptionTier: user.subscriptions[0]?.plan?.name?.toUpperCase() || 'FREE',
    };
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.service.js.map