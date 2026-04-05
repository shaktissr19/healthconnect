"use strict";
// src/controllers/admin.controller.ts
// Fixed:
//   1. SQL injection removed — community requests and QA sessions now use safe
//      Prisma parameterised queries (or return 503 with clear messaging if the
//      table doesn't exist yet in the schema).
//   2. deleteUser now soft-deletes (uses deletionRequestedAt) instead of
//      hard cascading delete of all medical records.
//   3. verifyDoctor now updates both isVerified AND verificationStatus for
//      consistency.
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQASession = exports.createQASession = exports.getQASessions = exports.rejectCommunityRequest = exports.approveCommunityRequest = exports.getCommunityRequests = exports.getAppointmentStats = exports.toggleCommunityFeatured = exports.deleteCommunity = exports.updateCommunity = exports.createCommunity = exports.toggleCommunityStatus = exports.getCommunityStats = exports.getSubscriptionStats = exports.verifyDoctor = exports.getAllDoctors = exports.getPendingDoctors = exports.deleteUser = exports.toggleUserStatus = exports.getUserById = exports.getAllUsers = exports.getDashboardStats = void 0;
const prisma_1 = require("../lib/prisma");
const apiResponse_1 = require("../utils/apiResponse");
const email_service_1 = require("../services/email.service");
// ─── DASHBOARD ANALYTICS ────────────────────────────────────────────────────
const getDashboardStats = async (_req, res, next) => {
    try {
        const [totalUsers, totalDoctors, totalPatients, totalHospitals, pendingVerifications, totalAppointments, totalCommunities, recentPayments, activeSubscriptions, newUsersThisMonth, appointmentsThisMonth,] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.user.count({ where: { role: 'DOCTOR' } }),
            prisma_1.prisma.user.count({ where: { role: 'PATIENT' } }),
            prisma_1.prisma.user.count({ where: { role: 'HOSPITAL' } }),
            prisma_1.prisma.doctorProfile.count({ where: { isVerified: false } }),
            prisma_1.prisma.appointment.count(),
            prisma_1.prisma.community.count(),
            prisma_1.prisma.payment.findMany({
                where: { status: 'CAPTURED' },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { subscription: { include: { plan: true, user: { select: { email: true } } } } },
            }),
            prisma_1.prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
            prisma_1.prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setDate(1)) } } }),
            prisma_1.prisma.appointment.count({ where: { scheduledAt: { gte: new Date(new Date().setDate(1)) } } }),
        ]);
        const revenueResult = await prisma_1.prisma.payment.aggregate({
            where: { status: 'CAPTURED', createdAt: { gte: new Date(new Date().setDate(1)) } },
            _sum: { amount: true },
        });
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date(new Date().setDate(0));
        const lastMonthRevenue = await prisma_1.prisma.payment.aggregate({
            where: { status: 'CAPTURED', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
            _sum: { amount: true },
        });
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const userGrowth = await prisma_1.prisma.user.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true, role: true },
            orderBy: { createdAt: 'asc' },
        });
        const apptByStatus = await prisma_1.prisma.appointment.groupBy({ by: ['status'], _count: true });
        return apiResponse_1.ApiResponse.success(res, {
            totals: { totalUsers, totalDoctors, totalPatients, totalHospitals, totalAppointments, totalCommunities, activeSubscriptions },
            pending: { doctorVerifications: pendingVerifications },
            thisMonth: { newUsers: newUsersThisMonth, appointments: appointmentsThisMonth, revenue: revenueResult._sum.amount || 0, lastMonthRevenue: lastMonthRevenue._sum.amount || 0 },
            recentPayments,
            userGrowth,
            apptByStatus,
        });
    }
    catch (e) {
        next(e);
    }
};
exports.getDashboardStats = getDashboardStats;
// ─── USER MANAGEMENT ────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const role = req.query.role;
        const search = req.query.search;
        const status = req.query.status;
        const where = {};
        if (role)
            where.role = role;
        if (status === 'active')
            where.isActive = true;
        if (status === 'inactive')
            where.isActive = false;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { registrationId: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, email: true, role: true, isActive: true,
                    isEmailVerified: true, registrationId: true,
                    lastLoginAt: true, createdAt: true,
                    doctorProfile: { select: { firstName: true, lastName: true, isVerified: true, specialization: true, city: true } },
                    patientProfile: { select: { firstName: true, lastName: true } },
                    hospitalProfile: { select: { name: true, city: true } },
                },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        return apiResponse_1.ApiResponse.success(res, { users, total, page, pages: Math.ceil(total / limit) });
    }
    catch (e) {
        next(e);
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                doctorProfile: true,
                patientProfile: true,
                hospitalProfile: true,
                subscriptions: { include: { plan: true }, orderBy: { startDate: 'desc' }, take: 5 },
                notifications: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!user)
            return apiResponse_1.ApiResponse.notFound(res, 'User not found');
        return apiResponse_1.ApiResponse.success(res, user);
    }
    catch (e) {
        next(e);
    }
};
exports.getUserById = getUserById;
const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            return apiResponse_1.ApiResponse.notFound(res, 'User not found');
        const updated = await prisma_1.prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: !user.isActive },
        });
        return apiResponse_1.ApiResponse.success(res, { isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
    }
    catch (e) {
        next(e);
    }
};
exports.toggleUserStatus = toggleUserStatus;
// ── FIX: Soft-delete instead of hard-delete ───────────────────────────────────
// Previously: prisma.user.delete() — cascaded and permanently wiped all medical
// records, appointments, consents etc. On a health platform this is irreversible.
// Now: marks deletionRequestedAt and deactivates. A separate scheduled job can
// anonymise PII after the retention period required by DPDP.
const deleteUser = async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            return apiResponse_1.ApiResponse.notFound(res, 'User not found');
        await prisma_1.prisma.user.update({
            where: { id: req.params.id },
            data: {
                isActive: false,
                deletionRequestedAt: new Date(),
                // Anonymise the email so the address can be re-used but the record is retained
                email: `deleted_${req.params.id}@deleted.hc`,
            },
        });
        return apiResponse_1.ApiResponse.success(res, null, 'User deactivated and marked for deletion');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteUser = deleteUser;
// ─── DOCTOR VERIFICATION ────────────────────────────────────────────────────
const getPendingDoctors = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const [doctors, total] = await Promise.all([
            prisma_1.prisma.doctorProfile.findMany({
                where: { isVerified: false },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, isActive: true, createdAt: true } } },
            }),
            prisma_1.prisma.doctorProfile.count({ where: { isVerified: false } }),
        ]);
        return apiResponse_1.ApiResponse.success(res, { doctors, total, page, pages: Math.ceil(total / limit) });
    }
    catch (e) {
        next(e);
    }
};
exports.getPendingDoctors = getPendingDoctors;
const getAllDoctors = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const verified = req.query.verified;
        const search = req.query.search;
        const where = {};
        if (verified === 'true')
            where.isVerified = true;
        if (verified === 'false')
            where.isVerified = false;
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { specialization: { contains: search, mode: 'insensitive' } },
                { medicalLicenseNumber: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [doctors, total] = await Promise.all([
            prisma_1.prisma.doctorProfile.findMany({
                where, skip: (page - 1) * limit, take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, isActive: true, createdAt: true } } },
            }),
            prisma_1.prisma.doctorProfile.count({ where }),
        ]);
        return apiResponse_1.ApiResponse.success(res, { doctors, total, page, pages: Math.ceil(total / limit) });
    }
    catch (e) {
        next(e);
    }
};
exports.getAllDoctors = getAllDoctors;
// ── FIX: also update verificationStatus for consistency ───────────────────────
const verifyDoctor = async (req, res, next) => {
    try {
        const { action, reason } = req.body;
        const doctor = await prisma_1.prisma.doctorProfile.findUnique({
            where: { id: req.params.id },
            include: { user: true },
        });
        if (!doctor)
            return apiResponse_1.ApiResponse.notFound(res, 'Doctor profile not found');
        if (action === 'approve') {
            await prisma_1.prisma.doctorProfile.update({
                where: { id: req.params.id },
                data: {
                    isVerified: true,
                    verifiedAt: new Date(),
                    verificationStatus: 'VERIFIED',
                },
            });
            await prisma_1.prisma.notification.create({
                data: {
                    userId: doctor.userId,
                    type: 'SYSTEM',
                    title: '🎉 Your profile has been verified!',
                    body: 'Congratulations! Your doctor profile has been verified by HealthConnect. You will now appear in search results.',
                    isRead: false,
                },
            });
            // Send verification approval email
            (0, email_service_1.sendDoctorVerificationEmail)(doctor.user.email, doctor.firstName, 'approve').catch(() => { }); // fire-and-forget
        }
        else if (action === 'reject') {
            await prisma_1.prisma.doctorProfile.update({
                where: { id: req.params.id },
                data: { verificationStatus: 'REJECTED', verificationNotes: reason || null },
            });
            await prisma_1.prisma.notification.create({
                data: {
                    userId: doctor.userId,
                    type: 'SYSTEM',
                    title: 'Verification update required',
                    body: reason || 'Your doctor profile requires additional information. Please update your profile and resubmit.',
                    isRead: false,
                },
            });
            // Send verification rejection email with reason
            (0, email_service_1.sendDoctorVerificationEmail)(doctor.user.email, doctor.firstName, 'reject', reason || undefined).catch(() => { }); // fire-and-forget
        }
        else {
            return apiResponse_1.ApiResponse.error(res, 'INVALID_INPUT', 'action must be "approve" or "reject"', 400);
        }
        return apiResponse_1.ApiResponse.success(res, null, action === 'approve' ? 'Doctor verified successfully' : 'Rejection notice sent');
    }
    catch (e) {
        next(e);
    }
};
exports.verifyDoctor = verifyDoctor;
// ─── SUBSCRIPTION / REVENUE ─────────────────────────────────────────────────
const getSubscriptionStats = async (_req, res, next) => {
    try {
        const [plans, byPlan, totalRevenue, monthlyRevenue] = await Promise.all([
            prisma_1.prisma.subscriptionPlan.findMany({ where: { isActive: true } }),
            prisma_1.prisma.userSubscription.groupBy({ by: ['planId', 'status'], _count: true }),
            prisma_1.prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
            prisma_1.prisma.payment.aggregate({
                where: { status: 'CAPTURED', createdAt: { gte: new Date(new Date().setDate(1)) } },
                _sum: { amount: true },
            }),
        ]);
        const recentSubs = await prisma_1.prisma.userSubscription.findMany({
            orderBy: { startDate: 'desc' },
            take: 20,
            include: { plan: true, user: { select: { email: true, role: true } } },
        });
        return apiResponse_1.ApiResponse.success(res, {
            plans, byPlan,
            totalRevenue: totalRevenue._sum.amount || 0,
            monthlyRevenue: monthlyRevenue._sum.amount || 0,
            recentSubs,
        });
    }
    catch (e) {
        next(e);
    }
};
exports.getSubscriptionStats = getSubscriptionStats;
// ─── COMMUNITY MANAGEMENT ───────────────────────────────────────────────────
const getCommunityStats = async (_req, res, next) => {
    try {
        const communities = await prisma_1.prisma.community.findMany({
            include: { _count: { select: { members: true, posts: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return apiResponse_1.ApiResponse.success(res, communities);
    }
    catch (e) {
        next(e);
    }
};
exports.getCommunityStats = getCommunityStats;
const toggleCommunityStatus = async (req, res, next) => {
    try {
        const c = await prisma_1.prisma.community.findUnique({ where: { id: req.params.id } });
        if (!c)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const updated = await prisma_1.prisma.community.update({
            where: { id: req.params.id },
            data: { isActive: !c.isActive },
        });
        return apiResponse_1.ApiResponse.success(res, null, `Community ${updated.isActive ? 'activated' : 'deactivated'}`);
    }
    catch (e) {
        next(e);
    }
};
exports.toggleCommunityStatus = toggleCommunityStatus;
const createCommunity = async (req, res, next) => {
    try {
        const { name, slug, description, emoji, category, visibility, language, allowAnonymous, requireApproval, rules, isFeatured } = req.body;
        if (!name?.trim() || !slug?.trim())
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Name and slug are required', 400);
        const existing = await prisma_1.prisma.community.findUnique({ where: { slug } });
        if (existing)
            return apiResponse_1.ApiResponse.error(res, 'CONFLICT', 'Slug already exists', 409);
        const community = await prisma_1.prisma.community.create({
            data: {
                slug: slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                name: name.trim(),
                description: description?.trim() || null,
                emoji: emoji || '🏥',
                category: category || 'General',
                visibility: visibility || 'PUBLIC',
                language: language || 'en',
                allowAnonymous: allowAnonymous !== false,
                requireApproval: requireApproval || false,
                rules: rules?.trim() || null,
                isFeatured: isFeatured || false,
                isActive: true,
            },
        });
        return apiResponse_1.ApiResponse.created(res, community, 'Community created successfully');
    }
    catch (e) {
        next(e);
    }
};
exports.createCommunity = createCommunity;
const updateCommunity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, emoji, category, visibility, language, allowAnonymous, requireApproval, rules, isFeatured, isActive } = req.body;
        const community = await prisma_1.prisma.community.findUnique({ where: { id } });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const updated = await prisma_1.prisma.community.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(description !== undefined && { description: description.trim() }),
                ...(emoji !== undefined && { emoji }),
                ...(category !== undefined && { category }),
                ...(visibility !== undefined && { visibility }),
                ...(language !== undefined && { language }),
                ...(allowAnonymous !== undefined && { allowAnonymous }),
                ...(requireApproval !== undefined && { requireApproval }),
                ...(rules !== undefined && { rules: rules?.trim() || null }),
                ...(isFeatured !== undefined && { isFeatured }),
                ...(isActive !== undefined && { isActive }),
                updatedAt: new Date(),
            },
            include: { _count: { select: { members: true, posts: true } } },
        });
        return apiResponse_1.ApiResponse.success(res, updated, 'Community updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateCommunity = updateCommunity;
const deleteCommunity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { hard = false } = req.body;
        const community = await prisma_1.prisma.community.findUnique({ where: { id } });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        if (hard) {
            await prisma_1.prisma.community.delete({ where: { id } });
            return apiResponse_1.ApiResponse.success(res, null, 'Community permanently deleted');
        }
        else {
            await prisma_1.prisma.community.update({ where: { id }, data: { isActive: false, updatedAt: new Date() } });
            return apiResponse_1.ApiResponse.success(res, null, 'Community archived (deactivated)');
        }
    }
    catch (e) {
        next(e);
    }
};
exports.deleteCommunity = deleteCommunity;
const toggleCommunityFeatured = async (req, res, next) => {
    try {
        const community = await prisma_1.prisma.community.findUnique({ where: { id: req.params.id } });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const updated = await prisma_1.prisma.community.update({
            where: { id: req.params.id },
            data: { isFeatured: !community.isFeatured, updatedAt: new Date() },
        });
        return apiResponse_1.ApiResponse.success(res, null, `Community ${updated.isFeatured ? 'featured' : 'unfeatured'}`);
    }
    catch (e) {
        next(e);
    }
};
exports.toggleCommunityFeatured = toggleCommunityFeatured;
const getAppointmentStats = async (_req, res, next) => {
    try {
        const [byStatus, byType, recent] = await Promise.all([
            prisma_1.prisma.appointment.groupBy({ by: ['status'], _count: true }),
            prisma_1.prisma.appointment.groupBy({ by: ['type'], _count: true }),
            prisma_1.prisma.appointment.findMany({
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: {
                    patient: { select: { firstName: true, lastName: true } },
                    doctor: { select: { firstName: true, lastName: true, specialization: true } },
                },
            }),
        ]);
        return apiResponse_1.ApiResponse.success(res, { byStatus, byType, recent });
    }
    catch (e) {
        next(e);
    }
};
exports.getAppointmentStats = getAppointmentStats;
// ─── COMMUNITY REQUESTS ──────────────────────────────────────────────────────
// NOTE: The `community_requests` table does not exist in the current Prisma
// schema. These functions return a clear 503 until the model is added.
// To enable them: add a CommunityRequest model to schema.prisma and run a
// migration, then replace the stubs below with Prisma ORM queries.
const COMMUNITY_REQUESTS_NOT_IMPLEMENTED = (res) => apiResponse_1.ApiResponse.error(res, 'NOT_IMPLEMENTED', 'Community requests feature requires the CommunityRequest Prisma model. Add it to schema.prisma and run a migration.', 503);
const getCommunityRequests = async (_req, res, next) => {
    try {
        return COMMUNITY_REQUESTS_NOT_IMPLEMENTED(res);
    }
    catch (e) {
        next(e);
    }
};
exports.getCommunityRequests = getCommunityRequests;
const approveCommunityRequest = async (_req, res, next) => {
    try {
        return COMMUNITY_REQUESTS_NOT_IMPLEMENTED(res);
    }
    catch (e) {
        next(e);
    }
};
exports.approveCommunityRequest = approveCommunityRequest;
const rejectCommunityRequest = async (_req, res, next) => {
    try {
        return COMMUNITY_REQUESTS_NOT_IMPLEMENTED(res);
    }
    catch (e) {
        next(e);
    }
};
exports.rejectCommunityRequest = rejectCommunityRequest;
// ─── WEEKLY Q&A SESSIONS ────────────────────────────────────────────────────
// Same situation — weekly_qa_sessions table doesn't exist in schema.prisma yet.
const QA_NOT_IMPLEMENTED = (res) => apiResponse_1.ApiResponse.error(res, 'NOT_IMPLEMENTED', 'Weekly Q&A sessions feature requires the WeeklyQASession Prisma model. Add it to schema.prisma and run a migration.', 503);
const getQASessions = async (_req, res, next) => {
    try {
        return QA_NOT_IMPLEMENTED(res);
    }
    catch (e) {
        next(e);
    }
};
exports.getQASessions = getQASessions;
const createQASession = async (_req, res, next) => {
    try {
        return QA_NOT_IMPLEMENTED(res);
    }
    catch (e) {
        next(e);
    }
};
exports.createQASession = createQASession;
const deleteQASession = async (_req, res, next) => {
    try {
        return QA_NOT_IMPLEMENTED(res);
    }
    catch (e) {
        next(e);
    }
};
exports.deleteQASession = deleteQASession;
//# sourceMappingURL=admin.controller.js.map