"use strict";
// src/routes/public.routes.ts
// Fixed: added publicRateLimiter to all endpoints.
// Previously these had zero rate limiting — trivially DoSable from the
// landing page's data fetching.
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Apply rate limiting to all public endpoints
router.use(rateLimiter_1.publicRateLimiter);
// ─── GET /public/doctors ──────────────────────────────────────────────────────
router.get('/doctors', async (req, res) => {
    try {
        const { specialty, search, limit = '6' } = req.query;
        const where = { isVerified: true };
        if (specialty && specialty !== 'All') {
            where.specialization = { contains: specialty, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { specialization: { contains: search, mode: 'insensitive' } },
                { clinicName: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
        }
        const doctors = await prisma_1.prisma.doctorProfile.findMany({
            where,
            take: parseInt(limit),
            orderBy: [{ averageRating: 'desc' }, { totalPatients: 'desc' }],
            select: {
                id: true, firstName: true, lastName: true,
                specialization: true, subSpecializations: true, qualification: true,
                experienceYears: true, clinicName: true, city: true, state: true,
                profilePhotoUrl: true, consultationFee: true, teleconsultFee: true,
                averageRating: true, totalReviews: true, totalPatients: true,
                isVerified: true, isAvailableOnline: true, languagesSpoken: true,
            },
        });
        res.json({ success: true, data: doctors, total: doctors.length });
    }
    catch (error) {
        console.error('GET /public/doctors error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
    }
});
// ─── GET /public/doctors/:id ──────────────────────────────────────────────────
router.get('/doctors/:id', async (req, res) => {
    try {
        const doctor = await prisma_1.prisma.doctorProfile.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, firstName: true, lastName: true,
                specialization: true, subSpecializations: true, qualification: true,
                experienceYears: true, clinicName: true, city: true, state: true,
                profilePhotoUrl: true, consultationFee: true, teleconsultFee: true,
                averageRating: true, totalReviews: true, totalPatients: true,
                isVerified: true, isAvailableOnline: true, languagesSpoken: true, bio: true,
            },
        });
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        res.json({ success: true, data: doctor });
    }
    catch (error) {
        console.error('GET /public/doctors/:id error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch doctor' });
    }
});
// ─── GET /public/doctors/:id/availability ─────────────────────────────────────
router.get('/doctors/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await prisma_1.prisma.doctorProfile.findUnique({
            where: { id },
            select: { id: true, isVerified: true },
        });
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        const availability = await prisma_1.prisma.doctorAvailability.findMany({
            where: { doctorId: id },
            orderBy: { dayOfWeek: 'asc' },
            select: { id: true, dayOfWeek: true, startTime: true, endTime: true, slotDuration: true, isActive: true },
        });
        const now = new Date();
        const end14 = new Date(now);
        end14.setDate(end14.getDate() + 14);
        const bookedSlots = await prisma_1.prisma.appointment.findMany({
            where: {
                doctorId: id,
                status: { in: ['PENDING', 'CONFIRMED'] },
                scheduledAt: { gte: now, lte: end14 },
            },
            select: { scheduledAt: true, durationMinutes: true },
        });
        res.json({
            success: true,
            data: {
                availability,
                bookedSlots: bookedSlots.map(b => ({ scheduledAt: b.scheduledAt, durationMinutes: b.durationMinutes })),
            },
        });
    }
    catch (error) {
        console.error('GET /public/doctors/:id/availability error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch availability' });
    }
});
// ─── GET /public/communities ──────────────────────────────────────────────────
router.get('/communities', async (req, res) => {
    try {
        const { limit = '4' } = req.query;
        const communities = await prisma_1.prisma.community.findMany({
            where: { isActive: true, visibility: 'PUBLIC' },
            take: parseInt(limit),
            orderBy: { members: { _count: 'desc' } },
            select: {
                id: true, slug: true, name: true, description: true, emoji: true,
                category: true, isFeatured: true, allowAnonymous: true,
                _count: { select: { members: true, posts: true } },
            },
        });
        res.json({ success: true, data: communities, total: communities.length });
    }
    catch (error) {
        console.error('GET /public/communities error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch communities' });
    }
});
// ─── GET /public/communities/:id/posts ───────────────────────────────────────
router.get('/communities/:id/posts', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = '5' } = req.query;
        const posts = await prisma_1.prisma.post.findMany({
            where: { communityId: id, status: 'PUBLISHED' },
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, title: true, body: true, tags: true,
                isAnonymous: true, anonymousAlias: true, authorId: true,
                viewCount: true, isPinned: true, createdAt: true,
                _count: { select: { comments: true, reactions: true } },
            },
        });
        res.json({ success: true, data: posts, total: posts.length });
    }
    catch (error) {
        console.error('GET /public/communities/:id/posts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
});
// ─── GET /public/testimonials ─────────────────────────────────────────────────
router.get('/testimonials', async (_req, res) => {
    try {
        const testimonials = await prisma_1.prisma.testimonial.findMany({
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
        });
        res.json({ success: true, data: testimonials, total: testimonials.length });
    }
    catch (error) {
        console.error('GET /public/testimonials error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
    }
});
// ─── GET /public/articles ─────────────────────────────────────────────────────
router.get('/articles', async (req, res) => {
    try {
        const { limit = '6', category } = req.query;
        const where = { isPublished: true };
        if (category && category !== 'All') {
            where.category = { equals: category, mode: 'insensitive' };
        }
        const articles = await prisma_1.prisma.article.findMany({
            where,
            take: parseInt(limit),
            orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
            select: {
                id: true, slug: true, title: true, excerpt: true, coverImage: true,
                type: true, difficulty: true, readTimeMin: true,
                authorName: true, isVerifiedAuthor: true, tags: true, category: true,
                isFeatured: true, isTrending: true, viewCount: true, publishedAt: true,
            },
        });
        res.json({ success: true, data: articles, total: articles.length });
    }
    catch (error) {
        console.error('GET /public/articles error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch articles' });
    }
});
// ─── GET /public/stats ────────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
    try {
        const [users, patients, doctors, appointments, communities, hospitals] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.user.count({ where: { role: 'PATIENT' } }),
            prisma_1.prisma.doctorProfile.count({ where: { isVerified: true } }),
            prisma_1.prisma.appointment.count(),
            prisma_1.prisma.community.count({ where: { isActive: true } }),
            prisma_1.prisma.hospitalProfile.count(),
        ]);
        res.json({ success: true, data: { users, patients, doctors, appointments, communities, hospitals } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});
exports.default = router;
//# sourceMappingURL=public.routes.js.map