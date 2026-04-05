"use strict";
// ══════════════════════════════════════════════════════════════════════════
// src/routes/doctor.routes.ts
// HealthConnect India — Doctor API Routes
// 
// Public:    GET /public/doctors, GET /public/doctors/:id, GET /public/doctors/:id/reviews
// Doctor:    GET/PUT /doctor/profile, PUT /doctor/profile/availability,
//            PUT /doctor/profile/consultation-modes, GET /doctor/analytics
// Patient:   POST /patient/doctors/:id/reviews, POST/DELETE /patient/bookmarks/:doctorId
// Admin:     GET /admin/doctors/pending, PUT /admin/doctors/:id/verify,
//            PUT /admin/doctors/:id/reject
// ══════════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// ── Helpers ───────────────────────────────────────────────────────────────
// Specialty code map for HC ID generation
const SPEC_CODES = {
    cardiologist: 'CARD', diabetologist: 'DIAB',
    neurologist: 'NEUR', psychiatrist: 'PSYC',
    dermatologist: 'DERM', gynaecologist: 'GYNO',
    gynecologist: 'GYNO', endocrinologist: 'ENDO',
    gastroenterologist: 'GAST', nephrologist: 'NEPH',
    urologist: 'UROL', pulmonologist: 'PULM',
    ophthalmologist: 'OPHT', 'ent specialist': 'ENTS',
    oncologist: 'ONCO', haematologist: 'HAEM',
    rheumatologist: 'RHEU', physiotherapist: 'PHYS',
    nutritionist: 'NUTR', paediatrician: 'PAED',
    pediatrician: 'PAED', 'orthopaedic surgeon': 'ORTH',
    'general physician': 'GENP',
};
function getSpecCode(spec) {
    const key = spec.toLowerCase();
    for (const [k, v] of Object.entries(SPEC_CODES)) {
        if (key.includes(k))
            return v;
    }
    return spec.replace(/[^A-Z]/gi, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
}
async function generateHcDoctorId(specialization) {
    const year = new Date().getFullYear();
    const code = getSpecCode(specialization);
    // Count verified doctors with same spec code for sequence
    const count = await prisma.doctorProfile.count({
        where: { hcDoctorId: { startsWith: `HCD-${year}-${code}-` } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `HCD-${year}-${code}-${seq}`;
}
// Compute profile completion score 0-100
function computeProfileScore(d) {
    const fields = [
        d.bio,
        d.careerJourney,
        d.profilePhotoUrl,
        d.clinicName,
        d.clinicAddress,
        d.city,
        d.medicalLicenseNumber,
        d.medicalCouncil,
        d.languagesSpoken?.length > 0,
        d.qualification?.length > 0,
        d.subSpecializations?.length > 0,
        d.consultationFee,
        d.availabilitySchedule,
        d.featuredReview,
        d.trainingHospitals?.length > 0,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
}
// Select fields for public doctor listing (no sensitive info)
const PUBLIC_DOCTOR_SELECT = {
    id: true, firstName: true, lastName: true,
    profilePhotoUrl: true, hcDoctorId: true, verificationStatus: true,
    specialization: true, subSpecializations: true, qualification: true,
    experienceYears: true, bio: true, careerJourney: true,
    trainingHospitals: true, hospitalAffiliations: true, awards: true,
    publications: true, medicalCouncil: true, registrationYear: true,
    clinicName: true, clinicAddress: true, city: true, state: true,
    pinCode: true, languagesSpoken: true,
    consultationFee: true, teleconsultFee: true, videoConsultFee: true,
    audioConsultFee: true,
    offersInPerson: true, offersVideoConsult: true, offersAudioConsult: true,
    offersChatConsult: true, videoPlatform: true,
    isAvailableOnline: true, isAcceptingNewPatients: true,
    availabilitySchedule: true, nextAvailableSlot: true,
    averageRating: true, totalReviews: true, totalPatients: true,
    profileViews: true, featuredReview: true, featuredPatientName: true,
    profileScore: true, isProfileComplete: true,
    isVerified: false, // computed below from verificationStatus
    createdAt: true,
};
// ══════════════════════════════════════════════════════════════════════════
// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
/**
 * GET /public/doctors
 * List all verified doctors with filters, sorting, pagination
 * All filters applied client-side on paginated results
 *
 * Query params:
 *   search, specialty, city, state, pincode, language, gender
 *   available, verified, sort, page, limit
 *   feeMin, feeMax, expMin, expMax
 *   offersVideo, offersAudio
 */
router.get('/public/doctors', async (req, res) => {
    try {
        const { search = '', specialty = '', city = '', state = '', pincode = '', language = '', gender = '', available = '', sort = 'rating', page = '1', limit = '500', // Default high to support client-side filtering
        feeMin = '', feeMax = '', expMin = '', expMax = '', offersVideo = '', offersAudio = '', } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {
            verificationStatus: 'VERIFIED',
        };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { specialization: { contains: search, mode: 'insensitive' } },
                { clinicName: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { clinicAddress: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } },
                { hcDoctorId: { contains: search, mode: 'insensitive' } },
                // Array contains for languages
                { languagesSpoken: { has: search } },
            ];
        }
        if (specialty) {
            where.specialization = { contains: specialty, mode: 'insensitive' };
        }
        if (city)
            where.city = { contains: city, mode: 'insensitive' };
        if (state)
            where.state = { contains: state, mode: 'insensitive' };
        if (pincode)
            where.pinCode = { startsWith: pincode };
        if (gender)
            where.gender = gender.toUpperCase();
        if (available === 'true')
            where.isAvailableOnline = true;
        if (offersVideo === 'true')
            where.offersVideoConsult = true;
        if (offersAudio === 'true')
            where.offersAudioConsult = true;
        if (feeMin || feeMax) {
            where.consultationFee = {};
            if (feeMin)
                where.consultationFee.gte = parseInt(feeMin);
            if (feeMax)
                where.consultationFee.lte = parseInt(feeMax);
        }
        if (expMin || expMax) {
            where.experienceYears = {};
            if (expMin)
                where.experienceYears.gte = parseInt(expMin);
            if (expMax)
                where.experienceYears.lte = parseInt(expMax);
        }
        if (language) {
            where.languagesSpoken = { has: language };
        }
        // Sort
        let orderBy = { averageRating: 'desc' };
        switch (sort) {
            case 'reviews':
                orderBy = { totalReviews: 'desc' };
                break;
            case 'experience':
                orderBy = { experienceYears: 'desc' };
                break;
            case 'fee_asc':
                orderBy = { consultationFee: 'asc' };
                break;
            case 'fee_desc':
                orderBy = { consultationFee: 'desc' };
                break;
            case 'newest':
                orderBy = { createdAt: 'desc' };
                break;
            case 'patients':
                orderBy = { totalPatients: 'desc' };
                break;
            default:
                orderBy = { averageRating: 'desc' };
                break;
        }
        const [doctors, total] = await Promise.all([
            prisma.doctorProfile.findMany({
                where,
                orderBy,
                skip,
                take: limitNum,
                select: {
                    id: true, firstName: true, lastName: true,
                    profilePhotoUrl: true, hcDoctorId: true, verificationStatus: true,
                    specialization: true, subSpecializations: true, qualification: true,
                    experienceYears: true, bio: true, trainingHospitals: true,
                    hospitalAffiliations: true, awards: true, publications: true,
                    medicalCouncil: true, registrationYear: true,
                    clinicName: true, clinicAddress: true, city: true, state: true,
                    pinCode: true, languagesSpoken: true,
                    consultationFee: true, teleconsultFee: true,
                    videoConsultFee: true, audioConsultFee: true,
                    offersInPerson: true, offersVideoConsult: true,
                    offersAudioConsult: true, offersChatConsult: true,
                    videoPlatform: true, isAvailableOnline: true,
                    isAcceptingNewPatients: true,
                    availabilitySchedule: true, nextAvailableSlot: true,
                    averageRating: true, totalReviews: true, totalPatients: true,
                    featuredReview: true, featuredPatientName: true,
                    profileScore: true, isProfileComplete: true, createdAt: true,
                },
            }),
            prisma.doctorProfile.count({ where }),
        ]);
        // Normalize: add isVerified computed field + full name
        const normalized = doctors.map(d => ({
            ...d,
            isVerified: d.verificationStatus === 'VERIFIED',
            name: `Dr. ${d.firstName} ${d.lastName}`,
        }));
        return res.json({
            success: true,
            data: {
                doctors: normalized,
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (err) {
        console.error('[GET /public/doctors]', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch doctors.' });
    }
});
/**
 * GET /public/doctors/:id
 * Full doctor profile — includes recent reviews
 */
router.get('/public/doctors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await prisma.doctorProfile.findFirst({
            where: {
                OR: [
                    { id },
                    { hcDoctorId: id },
                    { userId: id },
                ],
                verificationStatus: 'VERIFIED',
            },
        });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }
        // Increment profile views (fire-and-forget)
        prisma.doctorProfile.update({
            where: { id: doctor.id },
            data: { profileViews: { increment: 1 } },
        }).catch(() => { });
        // Fetch 3 most recent published reviews
        const recentReviews = await prisma.doctorReview.findMany({
            where: { doctorId: doctor.id, status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
                id: true, rating: true, title: true, body: true,
                isAnonymous: true, isVerified: true, helpfulCount: true,
                createdAt: true,
            },
        });
        const reviews = recentReviews.map(r => ({
            ...r,
            authorName: r.isAnonymous
                ? 'Anonymous Patient'
                : 'Anonymous Patient',
            patient: undefined,
        }));
        return res.json({
            success: true,
            data: {
                ...doctor,
                isVerified: doctor.verificationStatus === 'VERIFIED',
                name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
                recentReviews: reviews,
            },
        });
    }
    catch (err) {
        console.error('[GET /public/doctors/:id]', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch doctor profile.' });
    }
});
/**
 * GET /public/doctors/:id/reviews
 * Paginated reviews for a doctor
 */
router.get('/public/doctors/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '10' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const doctor = await prisma.doctorProfile.findFirst({
            where: { OR: [{ id }, { hcDoctorId: id }], verificationStatus: 'VERIFIED' },
            select: { id: true },
        });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }
        const [reviews, total] = await Promise.all([
            prisma.doctorReview.findMany({
                where: { doctorId: doctor.id, status: 'PUBLISHED' },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                select: {
                    id: true, rating: true, title: true, body: true,
                    isAnonymous: true, isVerified: true, helpfulCount: true, createdAt: true,
                },
            }),
            prisma.doctorReview.count({ where: { doctorId: doctor.id, status: 'PUBLISHED' } }),
        ]);
        const normalized = reviews.map(r => ({
            id: r.id, rating: r.rating, title: r.title, body: r.body,
            isVerified: r.isVerified, helpfulCount: r.helpfulCount, createdAt: r.createdAt,
            authorName: r.isAnonymous ? 'Anonymous Patient' : 'Verified Patient',
        }));
        return res.json({
            success: true,
            data: { reviews: normalized, total, page: pageNum, limit: limitNum },
        });
    }
    catch (err) {
        console.error('[GET /public/doctors/:id/reviews]', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
    }
});
// ══════════════════════════════════════════════════════════════════════════
// ── DOCTOR AUTH ROUTES ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
/**
 * GET /doctor/profile
 * Get own full profile (includes sensitive fields)
 */
router.get('/profile', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const profile = await prisma.doctorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        }
        return res.json({ success: true, data: { ...profile, isVerified: profile.verificationStatus === 'VERIFIED' } });
    }
    catch (err) {
        console.error('[GET /doctor/profile]', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
    }
});
/**
 * PUT /doctor/profile
 * Update own profile (all fields except verification status & HC ID)
 */
router.put('/profile', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found.' });
        const { firstName, lastName, gender, profilePhotoUrl, bio, careerJourney, trainingHospitals, hospitalAffiliations, awards, publications, medicalCouncil, registrationYear, specialization, subSpecializations, qualification, experienceYears, medicalLicenseNumber, clinicName, clinicAddress, city, state, pinCode, languagesSpoken, consultationFee, teleconsultFee, videoConsultFee, audioConsultFee, offersInPerson, offersVideoConsult, offersAudioConsult, offersChatConsult, videoPlatform, videoRoomBaseUrl, isAvailableOnline, isAcceptingNewPatients, featuredReview, featuredPatientName,
        // Availability schedule handled separately
         } = req.body;
        const updateData = {};
        // Only update provided fields
        const fields = {
            firstName, lastName, gender, profilePhotoUrl,
            bio, careerJourney, trainingHospitals, hospitalAffiliations,
            awards, publications, medicalCouncil, registrationYear,
            specialization, subSpecializations, qualification,
            experienceYears, medicalLicenseNumber,
            clinicName, clinicAddress, city, state, pinCode, languagesSpoken,
            consultationFee, teleconsultFee, videoConsultFee, audioConsultFee,
            offersInPerson, offersVideoConsult, offersAudioConsult, offersChatConsult,
            videoPlatform, videoRoomBaseUrl,
            isAvailableOnline, isAcceptingNewPatients,
            featuredReview, featuredPatientName,
        };
        for (const [key, val] of Object.entries(fields)) {
            if (val !== undefined)
                updateData[key] = val;
        }
        // Recompute profile score
        const merged = { ...profile, ...updateData };
        updateData.profileScore = computeProfileScore(merged);
        updateData.isProfileComplete = updateData.profileScore >= 70;
        const updated = await prisma.doctorProfile.update({
            where: { userId },
            data: updateData,
        });
        return res.json({
            success: true,
            message: 'Profile updated successfully.',
            data: { ...updated, isVerified: updated.verificationStatus === 'VERIFIED' },
        });
    }
    catch (err) {
        console.error('[PUT /doctor/profile]', err);
        return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
});
/**
 * PUT /doctor/profile/availability
 * Update availability schedule + next available slot
 * Body: { schedule: { Mon: ["09:00-13:00","15:00-18:00"], ... }, nextAvailableSlot?: string }
 */
router.put('/profile/availability', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const { schedule, nextAvailableSlot, isAvailableOnline, isAcceptingNewPatients } = req.body;
        const updateData = {};
        if (schedule !== undefined)
            updateData.availabilitySchedule = schedule;
        if (nextAvailableSlot !== undefined)
            updateData.nextAvailableSlot = new Date(nextAvailableSlot);
        if (isAvailableOnline !== undefined)
            updateData.isAvailableOnline = isAvailableOnline;
        if (isAcceptingNewPatients !== undefined)
            updateData.isAcceptingNewPatients = isAcceptingNewPatients;
        const updated = await prisma.doctorProfile.update({
            where: { userId },
            data: updateData,
        });
        return res.json({ success: true, message: 'Availability updated.', data: updated });
    }
    catch (err) {
        console.error('[PUT /doctor/profile/availability]', err);
        return res.status(500).json({ success: false, message: 'Failed to update availability.' });
    }
});
/**
 * PUT /doctor/profile/consultation-modes
 * Toggle consultation modes and fees
 */
router.put('/profile/consultation-modes', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const { offersInPerson, offersVideoConsult, offersAudioConsult, offersChatConsult, consultationFee, teleconsultFee, videoConsultFee, audioConsultFee, videoPlatform, videoRoomBaseUrl, } = req.body;
        const updateData = {};
        const fields = {
            offersInPerson, offersVideoConsult, offersAudioConsult, offersChatConsult,
            consultationFee, teleconsultFee, videoConsultFee, audioConsultFee,
            videoPlatform, videoRoomBaseUrl,
        };
        for (const [key, val] of Object.entries(fields)) {
            if (val !== undefined)
                updateData[key] = val;
        }
        const updated = await prisma.doctorProfile.update({
            where: { userId },
            data: updateData,
        });
        return res.json({ success: true, message: 'Consultation modes updated.', data: updated });
    }
    catch (err) {
        console.error('[PUT /doctor/profile/consultation-modes]', err);
        return res.status(500).json({ success: false, message: 'Failed to update consultation modes.' });
    }
});
/**
 * GET /doctor/analytics
 * Doctor's own analytics: views, bookmarks, review count, upcoming appointments
 */
router.get('/analytics', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const profile = await prisma.doctorProfile.findUnique({
            where: { userId },
            select: { id: true, profileViews: true, totalReviews: true, averageRating: true },
        });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found.' });
        const [bookmarkCount, upcomingCount, reviewBreakdown] = await Promise.all([
            prisma.doctorBookmark.count({ where: { doctorId: profile.id } }),
            prisma.appointment.count({
                where: { doctorId: profile.id, scheduledAt: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } },
            }),
            prisma.doctorReview.groupBy({
                by: ['rating'],
                where: { doctorId: profile.id, status: 'PUBLISHED' },
                _count: { rating: true },
            }),
        ]);
        const ratingBreakdown = [5, 4, 3, 2, 1].map(r => ({
            rating: r,
            count: reviewBreakdown.find(rb => rb.rating === r)?._count?.rating ?? 0,
        }));
        return res.json({
            success: true,
            data: {
                profileViews: profile.profileViews,
                bookmarkCount,
                upcomingAppointments: upcomingCount,
                averageRating: profile.averageRating,
                totalReviews: profile.totalReviews,
                ratingBreakdown,
            },
        });
    }
    catch (err) {
        console.error('[GET /doctor/analytics]', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
    }
});
// ══════════════════════════════════════════════════════════════════════════
// ── PATIENT AUTH ROUTES ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
/**
 * POST /patient/doctors/:id/reviews
 * Submit a review (requires completed appointment with this doctor)
 */
router.post('/patient/doctors/:id/reviews', auth_1.authenticate, (0, roleGuard_1.requireRole)('PATIENT'), async (req, res) => {
    try {
        const { id: doctorId } = req.params;
        const { rating, title, body, isAnonymous = false, appointmentId } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }
        if (!body || body.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Review body must be at least 10 characters.' });
        }
        const patientProfile = await prisma.patientProfile.findUnique({ where: { userId: req.user?.userId ?? req.user?.id } });
        if (!patientProfile)
            return res.status(404).json({ success: false, message: 'Patient profile not found.' });
        const doctor = await prisma.doctorProfile.findFirst({
            where: { OR: [{ id: doctorId }, { hcDoctorId: doctorId }] },
            select: { id: true },
        });
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        // Check for completed appointment
        let isVerified = false;
        let validAppointmentId;
        if (appointmentId) {
            const appt = await prisma.appointment.findFirst({
                where: {
                    id: appointmentId,
                    patientId: patientProfile.id,
                    doctorId: doctor.id,
                    status: 'COMPLETED',
                },
            });
            if (appt) {
                isVerified = true;
                validAppointmentId = appt.id;
            }
        }
        else {
            // Check if any completed appointment exists
            const appt = await prisma.appointment.findFirst({
                where: { patientId: patientProfile.id, doctorId: doctor.id, status: 'COMPLETED' },
                orderBy: { scheduledAt: 'desc' },
            });
            if (appt) {
                isVerified = true;
                validAppointmentId = appt.id;
            }
            else {
                return res.status(403).json({
                    success: false,
                    message: 'You can only review doctors after a completed appointment.',
                });
            }
        }
        // Check duplicate review for same appointment
        if (validAppointmentId) {
            const existing = await prisma.doctorReview.findFirst({
                where: { appointmentId: validAppointmentId },
            });
            if (existing) {
                return res.status(409).json({ success: false, message: 'You have already reviewed this appointment.' });
            }
        }
        const review = await prisma.doctorReview.create({
            data: {
                doctorId: doctor.id,
                patientId: patientProfile.id,
                userId: req.user?.userId ?? req.user?.id,
                appointmentId: validAppointmentId,
                rating: Number(rating),
                title: title?.trim() || null,
                body: body.trim(),
                isAnonymous: Boolean(isAnonymous),
                isVerified,
                status: 'PUBLISHED',
            },
        });
        // Update doctor's average rating
        const allRatings = await prisma.doctorReview.aggregate({
            where: { doctorId: doctor.id, status: 'PUBLISHED' },
            _avg: { rating: true },
            _count: { rating: true },
        });
        await prisma.doctorProfile.update({
            where: { id: doctor.id },
            data: {
                averageRating: allRatings._avg.rating ?? 0,
                totalReviews: allRatings._count.rating,
            },
        });
        return res.status(201).json({ success: true, message: 'Review submitted successfully.', data: review });
    }
    catch (err) {
        console.error('[POST /patient/doctors/:id/reviews]', err);
        return res.status(500).json({ success: false, message: 'Failed to submit review.' });
    }
});
/**
 * POST /patient/bookmarks/:doctorId
 * Bookmark a doctor
 */
router.post('/patient/bookmarks/:doctorId', auth_1.authenticate, (0, roleGuard_1.requireRole)('PATIENT'), async (req, res) => {
    try {
        const { doctorId } = req.params;
        const patientProfile = await prisma.patientProfile.findUnique({ where: { userId: req.user?.userId ?? req.user?.id } });
        if (!patientProfile)
            return res.status(404).json({ success: false, message: 'Patient profile not found.' });
        const doctor = await prisma.doctorProfile.findFirst({
            where: { OR: [{ id: doctorId }, { hcDoctorId: doctorId }] },
            select: { id: true },
        });
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        const bookmarkUserId = req.user?.userId ?? req.user?.id;
        await prisma.doctorBookmark.upsert({
            where: { userId_doctorId: { userId: bookmarkUserId, doctorId: doctor.id } },
            create: { userId: bookmarkUserId, doctorId: doctor.id },
            update: {},
        });
        return res.json({ success: true, message: 'Doctor bookmarked.' });
    }
    catch (err) {
        console.error('[POST /patient/bookmarks/:doctorId]', err);
        return res.status(500).json({ success: false, message: 'Failed to bookmark doctor.' });
    }
});
/**
 * DELETE /patient/bookmarks/:doctorId
 * Remove bookmark
 */
router.delete('/patient/bookmarks/:doctorId', auth_1.authenticate, (0, roleGuard_1.requireRole)('PATIENT'), async (req, res) => {
    try {
        const { doctorId } = req.params;
        await prisma.doctorBookmark.deleteMany({
            where: { userId: req.user?.userId ?? req.user?.id, doctorId },
        });
        return res.json({ success: true, message: 'Bookmark removed.' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to remove bookmark.' });
    }
});
/**
 * GET /patient/bookmarks
 * Get patient's bookmarked doctors
 */
router.get('/patient/bookmarks', auth_1.authenticate, (0, roleGuard_1.requireRole)('PATIENT'), async (req, res) => {
    try {
        const bookmarks = await prisma.doctorBookmark.findMany({
            where: { userId: req.user?.userId ?? req.user?.id },
            include: {
                doctor: {
                    select: {
                        id: true, firstName: true, lastName: true, specialization: true,
                        clinicName: true, city: true, hcDoctorId: true,
                        averageRating: true, consultationFee: true,
                        offersVideoConsult: true, isAvailableOnline: true,
                        profilePhotoUrl: true, verificationStatus: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const doctors = bookmarks.map(b => ({
            ...b.doctor,
            isVerified: b.doctor.verificationStatus === 'VERIFIED',
            bookmarkedAt: b.createdAt,
        }));
        return res.json({ success: true, data: { bookmarks: doctors, total: doctors.length } });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
    }
});
// ══════════════════════════════════════════════════════════════════════════
// ── ADMIN ROUTES ──────────────────────────────────════════════════════════
// ══════════════════════════════════════════════════════════════════════════
/**
 * GET /admin/doctors/pending
 * List doctors awaiting verification
 */
router.get('/admin/doctors/pending', auth_1.authenticate, (0, roleGuard_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { status = 'SUBMITTED', page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, parseInt(limit));
        const [doctors, total] = await Promise.all([
            prisma.doctorProfile.findMany({
                where: { verificationStatus: status },
                orderBy: { createdAt: 'asc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    user: { select: { email: true, createdAt: true } },
                },
            }),
            prisma.doctorProfile.count({ where: { verificationStatus: status } }),
        ]);
        return res.json({ success: true, data: { doctors, total, page: pageNum } });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch pending doctors.' });
    }
});
/**
 * PUT /admin/doctors/:id/verify
 * Approve doctor + auto-assign HCD ID
 */
router.put('/admin/doctors/:id/verify', auth_1.authenticate, (0, roleGuard_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await prisma.doctorProfile.findUnique({ where: { id } });
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        // Generate HC ID if not already assigned
        let hcDoctorId = doctor.hcDoctorId;
        if (!hcDoctorId) {
            hcDoctorId = await generateHcDoctorId(doctor.specialization ?? 'General Physician');
        }
        const updated = await prisma.doctorProfile.update({
            where: { id },
            data: {
                verificationStatus: 'VERIFIED',
                hcDoctorId,
                verifiedAt: new Date(),
                verifiedByAdminId: req.user.id,
                verificationNotes: null,
            },
        });
        // Also update the User.registrationId for consistency
        await prisma.user.update({
            where: { id: doctor.userId },
            data: { registrationId: hcDoctorId },
        });
        return res.json({
            success: true,
            message: `Doctor verified. HC ID assigned: ${hcDoctorId}`,
            data: updated,
        });
    }
    catch (err) {
        console.error('[PUT /admin/doctors/:id/verify]', err);
        return res.status(500).json({ success: false, message: 'Failed to verify doctor.' });
    }
});
/**
 * PUT /admin/doctors/:id/reject
 * Reject doctor verification with notes
 */
router.put('/admin/doctors/:id/reject', auth_1.authenticate, (0, roleGuard_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const updated = await prisma.doctorProfile.update({
            where: { id },
            data: {
                verificationStatus: 'REJECTED',
                verificationNotes: notes || 'Verification rejected by admin.',
            },
        });
        return res.json({ success: true, message: 'Doctor verification rejected.', data: updated });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to reject doctor.' });
    }
});
/**
 * GET /admin/doctors/:id/reviews
 * Admin: review moderation for a doctor
 */
router.get('/admin/doctors/:id/reviews', auth_1.authenticate, (0, roleGuard_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status = '', page = '1', limit = '20' } = req.query;
        const where = { doctorId: id };
        if (status)
            where.status = status;
        const reviews = await prisma.doctorReview.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
        });
        return res.json({ success: true, data: reviews });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
    }
});
/**
 * PUT /admin/reviews/:reviewId
 * Hide or flag a review
 */
router.put('/admin/reviews/:reviewId', auth_1.authenticate, (0, roleGuard_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body;
        const updated = await prisma.doctorReview.update({
            where: { id: reviewId },
            data: { status },
        });
        return res.json({ success: true, data: updated });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update review.' });
    }
});
// ══════════════════════════════════════════════════════════════════════════
// PATIENT SEARCH & ACCESS REQUESTS  (PHI-safe consent flow)
// Mounted at /doctor in index.ts → these paths become /api/v1/doctor/...
// Correct pattern: NO /doctor/ prefix here, same as admin.routes.ts /stats
// ══════════════════════════════════════════════════════════════════════════
/**
/**
 * GET /api/v1/doctor/patients
 * Returns all patients this doctor has had appointments with.
 * This was in doctor_controller.ts (getMyPatients) but never wired — adding here directly.
 */
router.get('/patients', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const dp = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!dp)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        const doctorId = dp.id;
        const { q, limit = '50', offset = '0' } = req.query;
        // Get distinct patientIds from appointments
        const appts = await prisma.appointment.findMany({
            where: { doctorId },
            select: { patientId: true, scheduledAt: true, status: true },
            distinct: ['patientId'],
            orderBy: { scheduledAt: 'desc' },
        });
        const patientIds = appts.map((a) => a.patientId);
        if (!patientIds.length)
            return res.json({ success: true, data: { patients: [], total: 0 } });
        const patients = await prisma.patientProfile.findMany({
            where: {
                id: { in: patientIds },
                ...(q ? { OR: [
                        { firstName: { contains: q, mode: 'insensitive' } },
                        { lastName: { contains: q, mode: 'insensitive' } },
                    ] } : {}),
            },
            include: {
                user: { select: { email: true, registrationId: true } },
                conditions: { select: { name: true, status: true }, take: 2 },
                healthScores: true,
            },
            take: +limit,
            skip: +offset,
        });
        const enriched = patients.map((p) => {
            const appt = appts.find((a) => a.patientId === p.id);
            const age = p.dateOfBirth
                ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 86400000))
                : null;
            return {
                id: p.id,
                name: `${p.firstName} ${p.lastName}`,
                firstName: p.firstName,
                lastName: p.lastName,
                age,
                gender: p.gender,
                bloodGroup: p.bloodGroup,
                avatar: (p.firstName[0] + p.lastName[0]).toUpperCase(),
                condition: p.conditions[0]?.name ?? 'General',
                conditions: p.conditions,
                lastVisit: appt?.scheduledAt?.toISOString(),
                lastStatus: appt?.status,
                healthScore: p.healthScores?.score,
                email: p.user.email,
                regId: p.user.registrationId,
                status: 'ACTIVE',
            };
        });
        return res.json({ success: true, data: { patients: enriched, total: patientIds.length } });
    }
    catch (e) {
        console.error('getPatients', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
/*
 * GET /api/v1/doctor/search-patients?q=<name or HC ID>
 * Empty q = browse first 50 patients (triggered by Search button click)
 * q >= 2 chars = filtered search
 */
router.get('/search-patients', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const dp = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!dp)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        const doctorId = dp.id;
        const q = (req.query.q ?? '').trim();
        const limit = q.length === 0 ? 50 : 10;
        if (q.length === 1)
            return res.status(400).json({ success: false, message: 'Type at least 2 characters to search' });
        const parts = q.split(' ').filter(Boolean);
        const where = q.length >= 2 ? {
            OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                ...(parts.length >= 2 ? [{
                        AND: [
                            { firstName: { contains: parts[0], mode: 'insensitive' } },
                            { lastName: { contains: parts[1], mode: 'insensitive' } },
                        ],
                    }] : []),
                { user: { registrationId: { contains: q, mode: 'insensitive' } } },
            ],
        } : {};
        const patients = await prisma.patientProfile.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                city: true,
                user: { select: { registrationId: true } },
            },
            take: limit,
            orderBy: { firstName: 'asc' },
        });
        if (!patients.length) {
            return res.json({ success: true, data: { patients: [], total: 0, browseMode: q.length === 0 } });
        }
        const patientIds = patients.map(p => p.id);
        const [consents, pendingNotifs] = await Promise.all([
            prisma.patientConsent.findMany({
                where: { doctorId, patientId: { in: patientIds } },
                select: { patientId: true, status: true },
            }),
            prisma.notification.findMany({
                where: { type: 'SYSTEM', isRead: false, data: { path: ['doctorId'], equals: doctorId } },
                select: { data: true },
            }),
        ]);
        const consentMap = new Map(consents.map(c => [c.patientId, c.status]));
        const pendingPatientIds = new Set(pendingNotifs.map(n => n.data?.patientId).filter(Boolean));
        const results = patients.map(p => {
            const age = p.dateOfBirth
                ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 86400000))
                : null;
            const cs = consentMap.get(p.id);
            const accessRequestStatus = cs === 'ACTIVE' ? 'ACCEPTED' :
                cs === 'REVOKED' ? 'REJECTED' :
                    pendingPatientIds.has(p.id) ? 'PENDING' : 'NONE';
            return { id: p.id, hcId: p.user.registrationId, firstName: p.firstName, lastName: p.lastName, age, city: p.city ?? '—', accessRequestStatus };
        });
        return res.json({ success: true, data: { patients: results, total: results.length, browseMode: q.length === 0 } });
    }
    catch (e) {
        console.error('searchPatients', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
/**
 * POST /api/v1/doctor/access-request
 * Body: { patientId }
 * Creates SYSTEM notification for patient — no schema change needed
 */
router.post('/access-request', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const dp = await prisma.doctorProfile.findUnique({
            where: { userId },
            select: { id: true, firstName: true, lastName: true, specialization: true, hcDoctorId: true, isVerified: true },
        });
        if (!dp)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        const doctorId = dp.id;
        const { patientId } = req.body;
        if (!patientId)
            return res.status(400).json({ success: false, message: 'patientId is required' });
        const patient = await prisma.patientProfile.findUnique({
            where: { id: patientId },
            select: { userId: true, firstName: true, lastName: true },
        });
        if (!patient)
            return res.status(404).json({ success: false, message: 'Patient not found' });
        const existing = await prisma.patientConsent.findFirst({ where: { doctorId, patientId, status: 'ACTIVE' } });
        if (existing)
            return res.status(409).json({ success: false, message: 'You already have active access to this patient' });
        const alreadyPending = await prisma.notification.findFirst({
            where: { userId: patient.userId, type: 'SYSTEM', isRead: false, data: { path: ['doctorId'], equals: doctorId } },
        });
        if (alreadyPending)
            return res.status(409).json({ success: false, message: 'Access request already pending for this patient' });
        const doctorName = `Dr. ${dp.firstName} ${dp.lastName}`;
        const spec = dp.specialization ?? 'General Physician';
        await prisma.notification.create({
            data: {
                userId: patient.userId,
                type: 'SYSTEM',
                title: `${doctorName} has requested access to your health profile`,
                body: `${doctorName} (${spec}) wants to view your HealthConnect health profile. Open notifications to accept or decline.`,
                data: { requestType: 'DOCTOR_ACCESS_REQUEST', doctorId, doctorName, doctorSpec: spec, hcDoctorId: dp.hcDoctorId ?? '', isVerified: dp.isVerified, patientId },
            },
        });
        return res.json({ success: true, data: { message: 'Access request sent. Patient will be notified in-app and by email.', patientId, doctorId } });
    }
    catch (e) {
        console.error('sendAccessRequest', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
/**
 * GET /api/v1/doctor/access-requests
 * Returns all sent requests: PENDING (from notifications) + ACCEPTED/REJECTED (from PatientConsent)
 */
router.get('/access-requests', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const dp = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!dp)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        const doctorId = dp.id;
        const [consents, pendingNotifs] = await Promise.all([
            prisma.patientConsent.findMany({
                where: { doctorId },
                include: { patient: { select: { id: true, firstName: true, lastName: true, user: { select: { registrationId: true } } } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.findMany({
                where: { type: 'SYSTEM', isRead: false, data: { path: ['doctorId'], equals: doctorId } },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const acceptedIds = new Set(consents.map(c => c.patientId));
        const pendingPatientIds = pendingNotifs
            .map(n => n.data?.patientId)
            .filter((id) => !!id && !acceptedIds.has(id));
        const pendingPatients = pendingPatientIds.length
            ? await prisma.patientProfile.findMany({
                where: { id: { in: pendingPatientIds } },
                select: { id: true, firstName: true, lastName: true, user: { select: { registrationId: true } } },
            })
            : [];
        const pMap = new Map(pendingPatients.map(p => [p.id, p]));
        const pendingRows = pendingNotifs
            .filter(n => { const pid = n.data?.patientId; return pid && !acceptedIds.has(pid); })
            .map(n => {
            const pid = n.data?.patientId;
            const p = pMap.get(pid);
            return { id: n.id, patientId: pid, patientName: p ? `${p.firstName} ${p.lastName}` : '', patientHcId: p?.user.registrationId ?? '', status: 'PENDING', createdAt: n.createdAt.toISOString() };
        });
        const consentRows = consents.map(c => ({
            id: c.id,
            patientId: c.patient.id,
            patientName: `${c.patient.firstName} ${c.patient.lastName}`,
            patientHcId: c.patient.user.registrationId,
            status: (c.status === 'ACTIVE' ? 'ACCEPTED' : 'REJECTED'),
            createdAt: c.createdAt.toISOString(),
        }));
        return res.json({ success: true, data: { requests: [...pendingRows, ...consentRows], total: pendingRows.length + consentRows.length } });
    }
    catch (e) {
        console.error('getAccessRequests', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
/*
 * POST /api/v1/patient/consent/approve
 * Patient approves a doctor access request notification → creates PatientConsent (ACTIVE)
 * Body: { notificationId, doctorId }
 */
router.post('/patient/consent/approve', auth_1.authenticate, (0, roleGuard_1.requireRole)('PATIENT'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const { notificationId, doctorId } = req.body;
        if (!doctorId)
            return res.status(400).json({ success: false, message: 'doctorId is required' });
        // Get patient profile
        const patient = await prisma.patientProfile.findUnique({ where: { userId }, select: { id: true, firstName: true, lastName: true } });
        if (!patient)
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        // Check doctor exists
        const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId }, select: { id: true } });
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        // Create or update consent — set expiry to 1 year from now
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const existing = await prisma.patientConsent.findFirst({
            where: { doctorId, patientId: patient.id },
        });
        if (existing) {
            await prisma.patientConsent.update({
                where: { id: existing.id },
                data: { status: 'ACTIVE', expiresAt },
            });
        }
        else {
            await prisma.patientConsent.create({
                data: { doctorId, patientId: patient.id, status: 'ACTIVE', expiresAt },
            });
        }
        // Mark notification as read
        if (notificationId) {
            await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } }).catch(() => { });
        }
        // Notify doctor that access was granted
        await prisma.notification.create({
            data: {
                userId: (await prisma.doctorProfile.findUnique({ where: { id: doctorId }, select: { userId: true } }))?.userId ?? '',
                type: 'SYSTEM',
                title: 'Patient approved your access request',
                body: `${patient.firstName} ${patient.lastName} has approved your request to view their health profile.`,
                data: { requestType: 'ACCESS_GRANTED', patientId: patient.id },
            },
        }).catch(() => { });
        return res.json({ success: true, message: 'Access granted successfully' });
    }
    catch (e) {
        console.error('consent-approve', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
/*
 * POST /api/v1/patient/consent/reject
 * Patient rejects a doctor access request → marks notification read, no consent created
 * Body: { notificationId, doctorId }
 */
router.post('/patient/consent/reject', auth_1.authenticate, (0, roleGuard_1.requireRole)('PATIENT'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const { notificationId, doctorId } = req.body;
        // Mark notification as read
        if (notificationId) {
            await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } }).catch(() => { });
        }
        // If there was a pending/revoked consent, keep it as REVOKED
        const patient = await prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
        if (patient && doctorId) {
            const existing = await prisma.patientConsent.findFirst({ where: { doctorId, patientId: patient.id } });
            if (existing && existing.status !== 'ACTIVE') {
                await prisma.patientConsent.update({ where: { id: existing.id }, data: { status: 'REVOKED' } }).catch(() => { });
            }
        }
        return res.json({ success: true, message: 'Access request declined' });
    }
    catch (e) {
        console.error('consent-reject', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
/*
 * GET /api/v1/doctor/patient-profile/:id
 * Returns full patient health profile — consent-gated.
 */
router.get('/patient-profile/:id', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const dp = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!dp)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        const doctorId = dp.id;
        const patientId = req.params.id;
        const now = new Date();
        // ── Fix 1: Consent expiry check ───────────────────────────────────────────
        // Fetch ACTIVE consent and check it hasn't expired
        const consentRaw = await prisma.patientConsent.findFirst({
            where: { doctorId, patientId, status: 'ACTIVE' },
        });
        // If consent exists but expiresAt is in the past, treat as expired — deny
        const consent = consentRaw && (!consentRaw.expiresAt || new Date(consentRaw.expiresAt) > now)
            ? consentRaw
            : null;
        // Auto-revoke expired consent so future checks don't pass it
        if (consentRaw && !consent) {
            await prisma.patientConsent.update({
                where: { id: consentRaw.id },
                data: { status: 'EXPIRED' },
            }).catch(() => { }); // silent — EXPIRED status may not exist in enum yet, fallback gracefully
        }
        // ── Fix 2: Appointment time-window check (±2 hours of scheduled time) ────
        // Access is allowed only if appointment is within [scheduledAt - 2h, scheduledAt + 2h]
        // OR if appointment was COMPLETED within the last 2 hours
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        const windowStart = new Date(now.getTime() - TWO_HOURS);
        const windowEnd = new Date(now.getTime() + TWO_HOURS);
        const appt = await prisma.appointment.findFirst({
            where: {
                doctorId,
                patientId,
                OR: [
                    // Upcoming or in-progress: scheduledAt within ±2h window
                    {
                        status: { in: ['CONFIRMED', 'PENDING'] },
                        scheduledAt: { gte: windowStart, lte: windowEnd },
                    },
                    // Recently completed: completed within last 2 hours
                    {
                        status: 'COMPLETED',
                        scheduledAt: { gte: windowStart },
                    },
                ],
            },
        });
        if (!consent && !appt) {
            return res.status(403).json({
                success: false,
                message: consent === null && consentRaw
                    ? 'Your consent access has expired. Please request a new access from the patient.'
                    : 'Access not granted. Patient has not shared their profile with you, or your appointment window has passed.',
            });
        }
        // Fetch profile + related data in parallel (separate queries = no TS include errors)
        const [profile, userInfo, conditions, medications, allergies, vitals, healthScore] = await Promise.all([
            prisma.patientProfile.findUnique({ where: { id: patientId } }),
            prisma.user.findFirst({ where: { patientProfile: { id: patientId } }, select: { registrationId: true, email: true } }),
            prisma.condition.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } }),
            prisma.medication.findMany({ where: { patientId, status: 'ACTIVE' } }),
            prisma.allergy.findMany({ where: { patientId } }),
            prisma.vital.findMany({ where: { patientId }, orderBy: { measuredAt: 'desc' }, take: 20 }),
            prisma.healthScore.findUnique({ where: { patientId } }),
        ]);
        if (!profile)
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        // Calculate age from dateOfBirth
        let age = null;
        if (profile.dateOfBirth) {
            const today = new Date();
            const dob = new Date(profile.dateOfBirth);
            age = today.getFullYear() - dob.getFullYear();
            if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
                age--;
            }
        }
        return res.json({
            success: true,
            data: {
                patient: {
                    id: profile.id,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    dateOfBirth: profile.dateOfBirth,
                    age,
                    gender: profile.gender,
                    bloodGroup: profile.bloodGroup,
                    phone: profile.phone,
                    hcId: userInfo?.registrationId ?? '',
                    email: userInfo?.email ?? '',
                    conditions,
                    medications,
                    allergies,
                    vitals,
                    healthScore: healthScore ?? null,
                },
                accessType: consent ? 'CONSENT' : 'APPOINTMENT',
                expiresAt: consent?.expiresAt ?? null,
                // For appointment-based access: window ends 2h after scheduledAt
                accessWindow: !consent && appt ? {
                    scheduledAt: appt.scheduledAt,
                    windowEnds: new Date(new Date(appt.scheduledAt).getTime() + 2 * 60 * 60 * 1000).toISOString(),
                } : null,
            },
        });
    }
    catch (e) {
        console.error('patient-profile', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
/*
 * GET /api/v1/doctor/records
 * Returns medical records (reports) for the doctor's patients
 */
router.get('/records', auth_1.authenticate, (0, roleGuard_1.requireRole)('DOCTOR'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const dp = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!dp)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        const doctorId = dp.id;
        // Get all appointments for this doctor to find patient IDs
        const appts = await prisma.appointment.findMany({
            where: { doctorId },
            select: { patientId: true, patient: { select: { firstName: true, lastName: true } } },
            distinct: ['patientId'],
        });
        const patientIds = appts.map((a) => a.patientId);
        const patientMap = new Map(appts.map((a) => [
            a.patientId,
            `${a.patient.firstName} ${a.patient.lastName}`,
        ]));
        // Try to get health records if the model exists
        let records = [];
        try {
            records = await prisma.healthRecord.findMany({
                where: { patientId: { in: patientIds } },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: { patient: { select: { firstName: true, lastName: true } } },
            });
        }
        catch {
            // healthRecord model may not exist — return empty
            records = [];
        }
        const formatted = records.map((r) => ({
            id: r.id,
            name: r.name ?? r.fileName ?? r.title ?? 'Medical Record',
            type: r.type ?? r.recordType ?? 'LAB',
            status: r.status ?? 'PENDING',
            date: (r.createdAt ?? r.date)?.toISOString?.() ?? '',
            patientId: r.patientId,
            patient: r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : (patientMap.get(r.patientId) ?? ''),
            notes: r.notes ?? r.doctorNotes ?? '',
        }));
        return res.json({ success: true, data: { records: formatted, total: formatted.length } });
    }
    catch (e) {
        console.error('doctor-records', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
/*
 * GET /api/v1/patient/prescriptions
 * Returns prescriptions issued by doctors for the logged-in patient
 */
router.get('/patient/prescriptions', auth_1.authenticate, (0, roleGuard_1.requireRole)('PATIENT'), async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        const patient = await prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!patient)
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        // Fetch prescriptions issued to this patient
        const prescriptions = await prisma.prescription.findMany({
            where: { patientId: patient.id },
            include: { doctor: { select: { firstName: true, lastName: true, specialization: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }).catch(() => []);
        const formatted = prescriptions.map((rx) => ({
            id: rx.id,
            date: rx.createdAt?.toISOString?.() ?? null,
            status: rx.status ?? 'ACTIVE',
            notes: rx.notes ?? '',
            doctorName: rx.doctor ? `Dr. ${rx.doctor.firstName} ${rx.doctor.lastName}` : null,
            doctorSpec: rx.doctor?.specialization ?? null,
            drugs: Array.isArray(rx.drugs) ? rx.drugs : [],
            // Single-drug fallback for older schema
            drug: rx.drug ?? null,
            dosage: rx.dosage ?? null,
            frequency: rx.frequency ?? null,
        }));
        return res.json({ success: true, data: { prescriptions: formatted, total: formatted.length } });
    }
    catch (e) {
        console.error('patient-prescriptions', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=doctor.routes.js.map