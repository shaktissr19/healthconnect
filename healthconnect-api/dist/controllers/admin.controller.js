"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQASession = exports.createQASession = exports.getQASessions = exports.rejectCommunityRequest = exports.approveCommunityRequest = exports.getCommunityRequests = exports.toggleCommunityFeatured = exports.deleteCommunity = exports.updateCommunity = exports.createCommunity = exports.getAppointmentStats = exports.toggleCommunityStatus = exports.getCommunityStats = exports.getSubscriptionStats = exports.verifyDoctor = exports.getAllDoctors = exports.getPendingDoctors = exports.deleteUser = exports.toggleUserStatus = exports.getUserById = exports.getAllUsers = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const prisma = new client_1.PrismaClient();
// ─── DASHBOARD ANALYTICS ────────────────────────────────────────────────────
const getDashboardStats = async (_req, res, next) => {
    try {
        const [totalUsers, totalDoctors, totalPatients, totalHospitals, pendingVerifications, totalAppointments, totalCommunities, recentPayments, activeSubscriptions, newUsersThisMonth, appointmentsThisMonth,] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'DOCTOR' } }),
            prisma.user.count({ where: { role: 'PATIENT' } }),
            prisma.user.count({ where: { role: 'HOSPITAL' } }),
            prisma.doctorProfile.count({ where: { isVerified: false } }),
            prisma.appointment.count(),
            prisma.community.count(),
            prisma.payment.findMany({
                where: { status: 'CAPTURED' },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { subscription: { include: { plan: true, user: { select: { email: true } } } } },
            }),
            prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count({
                where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
            }),
            prisma.appointment.count({
                where: { scheduledAt: { gte: new Date(new Date().setDate(1)) } },
            }),
        ]);
        // Revenue this month
        const revenueResult = await prisma.payment.aggregate({
            where: {
                status: 'CAPTURED',
                createdAt: { gte: new Date(new Date().setDate(1)) },
            },
            _sum: { amount: true },
        });
        // Revenue last month
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date(new Date().setDate(0));
        const lastMonthRevenue = await prisma.payment.aggregate({
            where: { status: 'CAPTURED', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
            _sum: { amount: true },
        });
        // Users growth by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const userGrowth = await prisma.user.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true, role: true },
            orderBy: { createdAt: 'asc' },
        });
        // Appointment status breakdown
        const apptByStatus = await prisma.appointment.groupBy({
            by: ['status'],
            _count: true,
        });
        return apiResponse_1.ApiResponse.success(res, {
            totals: { totalUsers, totalDoctors, totalPatients, totalHospitals, totalAppointments, totalCommunities, activeSubscriptions },
            pending: { doctorVerifications: pendingVerifications },
            thisMonth: {
                newUsers: newUsersThisMonth,
                appointments: appointmentsThisMonth,
                revenue: revenueResult._sum.amount || 0,
                lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
            },
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
            prisma.user.findMany({
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
            prisma.user.count({ where }),
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
        const user = await prisma.user.findUnique({
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
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            return apiResponse_1.ApiResponse.notFound(res, 'User not found');
        const updated = await prisma.user.update({
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
const deleteUser = async (req, res, next) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        return apiResponse_1.ApiResponse.success(res, null, 'User deleted');
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
            prisma.doctorProfile.findMany({
                where: { isVerified: false },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, email: true, isActive: true, createdAt: true } },
                },
            }),
            prisma.doctorProfile.count({ where: { isVerified: false } }),
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
            prisma.doctorProfile.findMany({
                where, skip: (page - 1) * limit, take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, isActive: true, createdAt: true } } },
            }),
            prisma.doctorProfile.count({ where }),
        ]);
        return apiResponse_1.ApiResponse.success(res, { doctors, total, page, pages: Math.ceil(total / limit) });
    }
    catch (e) {
        next(e);
    }
};
exports.getAllDoctors = getAllDoctors;
const verifyDoctor = async (req, res, next) => {
    try {
        const { action, reason } = req.body; // action: 'approve' | 'reject'
        const doctor = await prisma.doctorProfile.findUnique({ where: { id: req.params.id }, include: { user: true } });
        if (!doctor)
            return apiResponse_1.ApiResponse.notFound(res, 'Doctor profile not found');
        if (action === 'approve') {
            await prisma.doctorProfile.update({
                where: { id: req.params.id },
                data: { isVerified: true, verifiedAt: new Date() },
            });
            // Notify the doctor
            await prisma.notification.create({
                data: {
                    userId: doctor.userId,
                    type: 'SYSTEM',
                    title: '🎉 Your profile has been verified!',
                    body: 'Congratulations! Your doctor profile has been verified by HealthConnect. You will now appear in search results.',
                    isRead: false,
                },
            });
        }
        else if (action === 'reject') {
            await prisma.notification.create({
                data: {
                    userId: doctor.userId,
                    type: 'SYSTEM',
                    title: 'Verification update required',
                    body: reason || 'Your doctor profile requires additional information. Please update your profile and resubmit.',
                    isRead: false,
                },
            });
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
            prisma.subscriptionPlan.findMany({ where: { isActive: true } }),
            prisma.userSubscription.groupBy({
                by: ['planId', 'status'],
                _count: true,
            }),
            prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
            prisma.payment.aggregate({
                where: { status: 'CAPTURED', createdAt: { gte: new Date(new Date().setDate(1)) } },
                _sum: { amount: true },
            }),
        ]);
        const recentSubs = await prisma.userSubscription.findMany({
            orderBy: { startDate: 'desc' },
            take: 20,
            include: { plan: true, user: { select: { email: true, role: true } } },
        });
        return apiResponse_1.ApiResponse.success(res, {
            plans,
            byPlan,
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
        const communities = await prisma.community.findMany({
            include: {
                _count: { select: { members: true, posts: true } },
            },
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
        const c = await prisma.community.findUnique({ where: { id: req.params.id } });
        if (!c)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const updated = await prisma.community.update({
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
// ─── APPOINTMENT OVERVIEW ───────────────────────────────────────────────────
const getAppointmentStats = async (_req, res, next) => {
    try {
        const [byStatus, byType, recent] = await Promise.all([
            prisma.appointment.groupBy({ by: ['status'], _count: true }),
            prisma.appointment.groupBy({ by: ['type'], _count: true }),
            prisma.appointment.findMany({
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
const createCommunity = async (req, res, next) => {
    try {
        const { name, slug, description, emoji, category, visibility, language, allowAnonymous, requireApproval, rules, isFeatured, } = req.body;
        if (!name?.trim() || !slug?.trim())
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Name and slug are required', 400);
        // Check slug uniqueness
        const existing = await prisma.community.findUnique({ where: { slug } });
        if (existing)
            return apiResponse_1.ApiResponse.error(res, 'CONFLICT', 'Slug already exists', 409);
        const community = await prisma.community.create({
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
        // Notify pending requests for same category
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
        const { name, description, emoji, category, visibility, language, allowAnonymous, requireApproval, rules, isFeatured, isActive, } = req.body;
        const community = await prisma.community.findUnique({ where: { id } });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const updated = await prisma.community.update({
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
        const community = await prisma.community.findUnique({ where: { id } });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        if (hard) {
            // Hard delete — cascades to members, posts, etc.
            await prisma.community.delete({ where: { id } });
            return apiResponse_1.ApiResponse.success(res, null, 'Community permanently deleted');
        }
        else {
            // Soft delete — just deactivate
            await prisma.community.update({
                where: { id },
                data: { isActive: false, updatedAt: new Date() },
            });
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
        const community = await prisma.community.findUnique({ where: { id: req.params.id } });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const updated = await prisma.community.update({
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
// ─── COMMUNITY REQUESTS ──────────────────────────────────────────────────────
const getCommunityRequests = async (req, res, next) => {
    try {
        const status = req.query.status || 'PENDING';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const where = {};
        if (status !== 'ALL')
            where.status = status;
        const result = await prisma.$queryRaw `
      SELECT cr.*, u.email as requester_email,
        p."firstName" as requester_first, p."lastName" as requester_last
      FROM community_requests cr
      LEFT JOIN users u ON u.id = cr."requestedBy"
      LEFT JOIN patient_profiles p ON p."userId" = cr."requestedBy"
      WHERE ${status !== 'ALL' ? `cr.status = '${status}'` : 'true'}
      ORDER BY cr."createdAt" DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
        const totalResult = await prisma.$queryRaw `
      SELECT COUNT(*) as count FROM community_requests
      WHERE ${status !== 'ALL' ? `status = '${status}'` : 'true'}
    `;
        return apiResponse_1.ApiResponse.success(res, {
            requests: result,
            total: parseInt(totalResult[0]?.count || '0'),
            page,
        });
    }
    catch (e) {
        next(e);
    }
};
exports.getCommunityRequests = getCommunityRequests;
const approveCommunityRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const { adminNote, isFeatured = false } = req.body;
        // Get the request
        const reqResult = await prisma.$queryRaw `
      SELECT * FROM community_requests WHERE id = ${id} LIMIT 1
    `;
        if (!reqResult.length)
            return apiResponse_1.ApiResponse.notFound(res, 'Request not found');
        const communityReq = reqResult[0];
        if (communityReq.status !== 'PENDING')
            return apiResponse_1.ApiResponse.error(res, 'CONFLICT', 'Request already processed', 409);
        // Generate slug from name
        const slug = communityReq.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 60);
        // Check slug uniqueness
        const existing = await prisma.community.findFirst({ where: { slug } });
        const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
        // Create the community
        const community = await prisma.community.create({
            data: {
                slug: finalSlug,
                name: communityReq.name,
                description: communityReq.reason,
                category: communityReq.category || 'General',
                emoji: '🏥',
                visibility: 'PUBLIC',
                language: 'en',
                allowAnonymous: true,
                requireApproval: false,
                isFeatured,
                isActive: true,
            },
        });
        // Update request status
        await prisma.$executeRaw `
      UPDATE community_requests
      SET status = 'APPROVED', "adminNote" = ${adminNote || null},
          "reviewedBy" = ${adminId}, "reviewedAt" = NOW(),
          "communityId" = ${community.id}, "updatedAt" = NOW()
      WHERE id = ${id}
    `;
        // Notify requester if they have an account
        if (communityReq.requestedBy) {
            await prisma.notification.create({
                data: {
                    userId: communityReq.requestedBy,
                    type: 'SYSTEM',
                    title: `✅ Your community "${communityReq.name}" is live!`,
                    body: `Your community request has been approved. "${communityReq.name}" is now live on HealthConnect. Join and start the conversation!`,
                    isRead: false,
                },
            });
        }
        return apiResponse_1.ApiResponse.success(res, { community }, 'Community request approved and community created');
    }
    catch (e) {
        next(e);
    }
};
exports.approveCommunityRequest = approveCommunityRequest;
const rejectCommunityRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const { reason } = req.body;
        const reqResult = await prisma.$queryRaw `
      SELECT * FROM community_requests WHERE id = ${id} LIMIT 1
    `;
        if (!reqResult.length)
            return apiResponse_1.ApiResponse.notFound(res, 'Request not found');
        const communityReq = reqResult[0];
        if (communityReq.status !== 'PENDING')
            return apiResponse_1.ApiResponse.error(res, 'CONFLICT', 'Request already processed', 409);
        await prisma.$executeRaw `
      UPDATE community_requests
      SET status = 'REJECTED', "adminNote" = ${reason || 'Does not meet community guidelines'},
          "reviewedBy" = ${adminId}, "reviewedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = ${id}
    `;
        // Notify requester
        if (communityReq.requestedBy) {
            await prisma.notification.create({
                data: {
                    userId: communityReq.requestedBy,
                    type: 'SYSTEM',
                    title: `Community request update`,
                    body: reason || 'Your community request was not approved at this time. You can submit a new request with more details.',
                    isRead: false,
                },
            });
        }
        return apiResponse_1.ApiResponse.success(res, null, 'Request rejected');
    }
    catch (e) {
        next(e);
    }
};
exports.rejectCommunityRequest = rejectCommunityRequest;
// ─── WEEKLY Q&A SESSIONS ────────────────────────────────────────────────────
const getQASessions = async (req, res, next) => {
    try {
        const { id: communityId } = req.params;
        const sessions = await prisma.$queryRaw `
      SELECT * FROM weekly_qa_sessions
      WHERE "communityId" = ${communityId}
      ORDER BY "scheduledAt" DESC
      LIMIT 20
    `;
        return apiResponse_1.ApiResponse.success(res, sessions);
    }
    catch (e) {
        next(e);
    }
};
exports.getQASessions = getQASessions;
const createQASession = async (req, res, next) => {
    try {
        const { id: communityId } = req.params;
        const { doctorName, topic, scheduledAt, durationMin = 60, meetLink, doctorId } = req.body;
        if (!doctorName || !topic || !scheduledAt)
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'doctorName, topic and scheduledAt required', 400);
        const session = await prisma.$queryRaw `
      INSERT INTO weekly_qa_sessions
        ("communityId", "doctorId", "doctorName", topic, "scheduledAt", "durationMin", "meetLink")
      VALUES
        (${communityId}, ${doctorId || null}, ${doctorName}, ${topic},
         ${new Date(scheduledAt)}, ${durationMin}, ${meetLink || null})
      RETURNING *
    `;
        // Notify community members
        const members = await prisma.communityMember.findMany({
            where: { communityId, isApproved: true },
            select: { userId: true },
            take: 500,
        });
        if (members.length > 0) {
            await prisma.notification.createMany({
                data: members.map(m => ({
                    userId: m.userId,
                    type: 'COMMUNITY_ACTIVITY',
                    title: `📅 Live Q&A: ${topic}`,
                    body: `${doctorName} will be hosting a live Q&A session in your community on ${new Date(scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`,
                    isRead: false,
                })),
                skipDuplicates: true,
            });
        }
        return apiResponse_1.ApiResponse.created(res, session[0], 'Q&A session scheduled and members notified');
    }
    catch (e) {
        next(e);
    }
};
exports.createQASession = createQASession;
const deleteQASession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        await prisma.$executeRaw `
      DELETE FROM weekly_qa_sessions WHERE id = ${sessionId}
    `;
        return apiResponse_1.ApiResponse.success(res, null, 'Session deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteQASession = deleteQASession;
//# sourceMappingURL=admin.controller.js.map