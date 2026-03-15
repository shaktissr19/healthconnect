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

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = Router();
const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────

// Specialty code map for HC ID generation
const SPEC_CODES: Record<string, string> = {
  cardiologist:       'CARD', diabetologist:      'DIAB',
  neurologist:        'NEUR', psychiatrist:       'PSYC',
  dermatologist:      'DERM', gynaecologist:      'GYNO',
  gynecologist:       'GYNO', endocrinologist:    'ENDO',
  gastroenterologist: 'GAST', nephrologist:       'NEPH',
  urologist:          'UROL', pulmonologist:      'PULM',
  ophthalmologist:    'OPHT', 'ent specialist':   'ENTS',
  oncologist:         'ONCO', haematologist:      'HAEM',
  rheumatologist:     'RHEU', physiotherapist:    'PHYS',
  nutritionist:       'NUTR', paediatrician:      'PAED',
  pediatrician:       'PAED', 'orthopaedic surgeon': 'ORTH',
  'general physician': 'GENP',
};

function getSpecCode(spec: string): string {
  const key = spec.toLowerCase();
  for (const [k, v] of Object.entries(SPEC_CODES)) {
    if (key.includes(k)) return v;
  }
  return spec.replace(/[^A-Z]/gi, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
}

async function generateHcDoctorId(specialization: string): Promise<string> {
  const year   = new Date().getFullYear();
  const code   = getSpecCode(specialization);
  // Count verified doctors with same spec code for sequence
  const count  = await prisma.doctorProfile.count({
    where: { hcDoctorId: { startsWith: `HCD-${year}-${code}-` } },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `HCD-${year}-${code}-${seq}`;
}

// Compute profile completion score 0-100
function computeProfileScore(d: any): number {
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
  id: true, firstName: true, lastName: true, gender: true,
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
    const {
      search    = '',
      specialty = '',
      city      = '',
      state     = '',
      pincode   = '',
      language  = '',
      gender    = '',
      available = '',
      sort      = 'rating',
      page      = '1',
      limit     = '500',  // Default high to support client-side filtering
      feeMin    = '',
      feeMax    = '',
      expMin    = '',
      expMax    = '',
      offersVideo = '',
      offersAudio = '',
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      verificationStatus: 'VERIFIED',
    };

    if (search) {
      where.OR = [
        { firstName:       { contains: search, mode: 'insensitive' } },
        { lastName:        { contains: search, mode: 'insensitive' } },
        { specialization:  { contains: search, mode: 'insensitive' } },
        { clinicName:      { contains: search, mode: 'insensitive' } },
        { city:            { contains: search, mode: 'insensitive' } },
        { clinicAddress:   { contains: search, mode: 'insensitive' } },
        { bio:             { contains: search, mode: 'insensitive' } },
        { hcDoctorId:      { contains: search, mode: 'insensitive' } },
        // Array contains for languages
        { languagesSpoken: { has: search } },
      ];
    }

    if (specialty) {
      where.specialization = { contains: specialty, mode: 'insensitive' };
    }

    if (city)    where.city    = { contains: city,    mode: 'insensitive' };
    if (state)   where.state   = { contains: state,   mode: 'insensitive' };
    if (pincode) where.pinCode = { startsWith: pincode };
    if (gender)  where.gender  = gender.toUpperCase();

    if (available === 'true') where.isAvailableOnline = true;
    if (offersVideo === 'true') where.offersVideoConsult = true;
    if (offersAudio === 'true') where.offersAudioConsult = true;

    if (feeMin || feeMax) {
      where.consultationFee = {};
      if (feeMin) where.consultationFee.gte = parseInt(feeMin);
      if (feeMax) where.consultationFee.lte = parseInt(feeMax);
    }

    if (expMin || expMax) {
      where.experienceYears = {};
      if (expMin) where.experienceYears.gte = parseInt(expMin);
      if (expMax) where.experienceYears.lte = parseInt(expMax);
    }

    if (language) {
      where.languagesSpoken = { has: language };
    }

    // Sort
    let orderBy: any = { averageRating: 'desc' };
    switch (sort) {
      case 'reviews':    orderBy = { totalReviews:   'desc' }; break;
      case 'experience': orderBy = { experienceYears: 'desc' }; break;
      case 'fee_asc':    orderBy = { consultationFee: 'asc'  }; break;
      case 'fee_desc':   orderBy = { consultationFee: 'desc' }; break;
      case 'newest':     orderBy = { createdAt:       'desc' }; break;
      case 'patients':   orderBy = { totalPatients:   'desc' }; break;
      default:           orderBy = { averageRating:   'desc' }; break;
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true, firstName: true, lastName: true, gender: true,
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
        page:  pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
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
    }).catch(() => {});

    // Fetch 3 most recent published reviews
    const recentReviews = await prisma.doctorReview.findMany({
      where: { doctorId: doctor.id, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true, rating: true, title: true, body: true,
        isAnonymous: true, isVerified: true, helpfulCount: true,
        createdAt: true,
        patient: { select: { firstName: true, city: true } },
      },
    });

    const reviews = recentReviews.map(r => ({
      ...r,
      authorName: r.isAnonymous
        ? 'Anonymous Patient'
        : `${r.patient?.firstName ?? 'Patient'}${r.patient?.city ? `, ${r.patient.city}` : ''}`,
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
  } catch (err: any) {
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
    const { page = '1', limit = '10' } = req.query as Record<string, string>;
    const pageNum  = Math.max(1, parseInt(page));
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
          patient: { select: { firstName: true, city: true } },
        },
      }),
      prisma.doctorReview.count({ where: { doctorId: doctor.id, status: 'PUBLISHED' } }),
    ]);

    const normalized = reviews.map(r => ({
      id: r.id, rating: r.rating, title: r.title, body: r.body,
      isVerified: r.isVerified, helpfulCount: r.helpfulCount, createdAt: r.createdAt,
      authorName: r.isAnonymous
        ? 'Anonymous Patient'
        : `${r.patient?.firstName ?? 'Patient'}${r.patient?.city ? `, ${r.patient.city}` : ''}`,
    }));

    return res.json({
      success: true,
      data: { reviews: normalized, total, page: pageNum, limit: limitNum },
    });
  } catch (err: any) {
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
router.get('/doctor/profile', authenticate, requireRole('DOCTOR'), async (req: any, res) => {
  try {
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    return res.json({ success: true, data: { ...profile, isVerified: profile.verificationStatus === 'VERIFIED' } });
  } catch (err: any) {
    console.error('[GET /doctor/profile]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

/**
 * PUT /doctor/profile
 * Update own profile (all fields except verification status & HC ID)
 */
router.put('/doctor/profile', authenticate, requireRole('DOCTOR'), async (req: any, res) => {
  try {
    const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    const {
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
      // Availability schedule handled separately
    } = req.body;

    const updateData: any = {};
    // Only update provided fields
    const fields: Record<string, any> = {
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
      if (val !== undefined) updateData[key] = val;
    }

    // Recompute profile score
    const merged = { ...profile, ...updateData };
    updateData.profileScore = computeProfileScore(merged);
    updateData.isProfileComplete = updateData.profileScore >= 70;

    const updated = await prisma.doctorProfile.update({
      where: { userId: req.user.id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { ...updated, isVerified: updated.verificationStatus === 'VERIFIED' },
    });
  } catch (err: any) {
    console.error('[PUT /doctor/profile]', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

/**
 * PUT /doctor/profile/availability
 * Update availability schedule + next available slot
 * Body: { schedule: { Mon: ["09:00-13:00","15:00-18:00"], ... }, nextAvailableSlot?: string }
 */
router.put('/doctor/profile/availability', authenticate, requireRole('DOCTOR'), async (req: any, res) => {
  try {
    const { schedule, nextAvailableSlot, isAvailableOnline, isAcceptingNewPatients } = req.body;

    const updateData: any = {};
    if (schedule !== undefined) updateData.availabilitySchedule = schedule;
    if (nextAvailableSlot !== undefined) updateData.nextAvailableSlot = new Date(nextAvailableSlot);
    if (isAvailableOnline !== undefined) updateData.isAvailableOnline = isAvailableOnline;
    if (isAcceptingNewPatients !== undefined) updateData.isAcceptingNewPatients = isAcceptingNewPatients;

    const updated = await prisma.doctorProfile.update({
      where: { userId: req.user.id },
      data: updateData,
    });

    return res.json({ success: true, message: 'Availability updated.', data: updated });
  } catch (err: any) {
    console.error('[PUT /doctor/profile/availability]', err);
    return res.status(500).json({ success: false, message: 'Failed to update availability.' });
  }
});

/**
 * PUT /doctor/profile/consultation-modes
 * Toggle consultation modes and fees
 */
router.put('/doctor/profile/consultation-modes', authenticate, requireRole('DOCTOR'), async (req: any, res) => {
  try {
    const {
      offersInPerson, offersVideoConsult, offersAudioConsult, offersChatConsult,
      consultationFee, teleconsultFee, videoConsultFee, audioConsultFee,
      videoPlatform, videoRoomBaseUrl,
    } = req.body;

    const updateData: any = {};
    const fields: Record<string, any> = {
      offersInPerson, offersVideoConsult, offersAudioConsult, offersChatConsult,
      consultationFee, teleconsultFee, videoConsultFee, audioConsultFee,
      videoPlatform, videoRoomBaseUrl,
    };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updateData[key] = val;
    }

    const updated = await prisma.doctorProfile.update({
      where: { userId: req.user.id },
      data: updateData,
    });

    return res.json({ success: true, message: 'Consultation modes updated.', data: updated });
  } catch (err: any) {
    console.error('[PUT /doctor/profile/consultation-modes]', err);
    return res.status(500).json({ success: false, message: 'Failed to update consultation modes.' });
  }
});

/**
 * GET /doctor/analytics
 * Doctor's own analytics: views, bookmarks, review count, upcoming appointments
 */
router.get('/doctor/analytics', authenticate, requireRole('DOCTOR'), async (req: any, res) => {
  try {
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true, profileViews: true, totalReviews: true, averageRating: true },
    });

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

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
        profileViews:    profile.profileViews,
        bookmarkCount,
        upcomingAppointments: upcomingCount,
        averageRating:   profile.averageRating,
        totalReviews:    profile.totalReviews,
        ratingBreakdown,
      },
    });
  } catch (err: any) {
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
router.post('/patient/doctors/:id/reviews', authenticate, requireRole('PATIENT'), async (req: any, res) => {
  try {
    const { id: doctorId } = req.params;
    const { rating, title, body, isAnonymous = false, appointmentId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }
    if (!body || body.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Review body must be at least 10 characters.' });
    }

    const patientProfile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!patientProfile) return res.status(404).json({ success: false, message: 'Patient profile not found.' });

    const doctor = await prisma.doctorProfile.findFirst({
      where: { OR: [{ id: doctorId }, { hcDoctorId: doctorId }] },
      select: { id: true },
    });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    // Check for completed appointment
    let isVerified = false;
    let validAppointmentId: string | undefined;

    if (appointmentId) {
      const appt = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          patientId: patientProfile.id,
          doctorId: doctor.id,
          status: 'COMPLETED',
        },
      });
      if (appt) { isVerified = true; validAppointmentId = appt.id; }
    } else {
      // Check if any completed appointment exists
      const appt = await prisma.appointment.findFirst({
        where: { patientId: patientProfile.id, doctorId: doctor.id, status: 'COMPLETED' },
        orderBy: { scheduledAt: 'desc' },
      });
      if (appt) { isVerified = true; validAppointmentId = appt.id; }
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
        doctorId:      doctor.id,
        patientId:     patientProfile.id,
        userId:        req.user.id,
        appointmentId: validAppointmentId,
        rating:        Number(rating),
        title:         title?.trim() || null,
        body:          body.trim(),
        isAnonymous:   Boolean(isAnonymous),
        isVerified,
        status:        'PUBLISHED',
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
        totalReviews:  allRatings._count.rating,
      },
    });

    return res.status(201).json({ success: true, message: 'Review submitted successfully.', data: review });
  } catch (err: any) {
    console.error('[POST /patient/doctors/:id/reviews]', err);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

/**
 * POST /patient/bookmarks/:doctorId
 * Bookmark a doctor
 */
router.post('/patient/bookmarks/:doctorId', authenticate, requireRole('PATIENT'), async (req: any, res) => {
  try {
    const { doctorId } = req.params;
    const patientProfile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!patientProfile) return res.status(404).json({ success: false, message: 'Patient profile not found.' });

    const doctor = await prisma.doctorProfile.findFirst({
      where: { OR: [{ id: doctorId }, { hcDoctorId: doctorId }] },
      select: { id: true },
    });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    await prisma.doctorBookmark.upsert({
      where: { userId_doctorId: { userId: req.user.id, doctorId: doctor.id } },
      create: { userId: req.user.id, patientId: patientProfile.id, doctorId: doctor.id },
      update: {},
    });

    return res.json({ success: true, message: 'Doctor bookmarked.' });
  } catch (err: any) {
    console.error('[POST /patient/bookmarks/:doctorId]', err);
    return res.status(500).json({ success: false, message: 'Failed to bookmark doctor.' });
  }
});

/**
 * DELETE /patient/bookmarks/:doctorId
 * Remove bookmark
 */
router.delete('/patient/bookmarks/:doctorId', authenticate, requireRole('PATIENT'), async (req: any, res) => {
  try {
    const { doctorId } = req.params;
    await prisma.doctorBookmark.deleteMany({
      where: { userId: req.user.id, doctorId },
    });
    return res.json({ success: true, message: 'Bookmark removed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to remove bookmark.' });
  }
});

/**
 * GET /patient/bookmarks
 * Get patient's bookmarked doctors
 */
router.get('/patient/bookmarks', authenticate, requireRole('PATIENT'), async (req: any, res) => {
  try {
    const bookmarks = await prisma.doctorBookmark.findMany({
      where: { userId: req.user.id },
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
  } catch (err: any) {
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
router.get('/admin/doctors/pending', authenticate, requireRole('ADMIN'), async (req: any, res) => {
  try {
    const { status = 'SUBMITTED', page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where: { verificationStatus: status as any },
        orderBy: { createdAt: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { email: true, createdAt: true } },
        },
      }),
      prisma.doctorProfile.count({ where: { verificationStatus: status as any } }),
    ]);

    return res.json({ success: true, data: { doctors, total, page: pageNum } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch pending doctors.' });
  }
});

/**
 * PUT /admin/doctors/:id/verify
 * Approve doctor + auto-assign HCD ID
 */
router.put('/admin/doctors/:id/verify', authenticate, requireRole('ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctorProfile.findUnique({ where: { id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    // Generate HC ID if not already assigned
    let hcDoctorId = doctor.hcDoctorId;
    if (!hcDoctorId) {
      hcDoctorId = await generateHcDoctorId(doctor.specialization);
    }

    const updated = await prisma.doctorProfile.update({
      where: { id },
      data: {
        verificationStatus: 'VERIFIED',
        hcDoctorId,
        verifiedAt:         new Date(),
        verifiedByAdminId:  req.user.id,
        verificationNotes:  null,
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
  } catch (err: any) {
    console.error('[PUT /admin/doctors/:id/verify]', err);
    return res.status(500).json({ success: false, message: 'Failed to verify doctor.' });
  }
});

/**
 * PUT /admin/doctors/:id/reject
 * Reject doctor verification with notes
 */
router.put('/admin/doctors/:id/reject', authenticate, requireRole('ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updated = await prisma.doctorProfile.update({
      where: { id },
      data: {
        verificationStatus: 'REJECTED',
        verificationNotes:  notes || 'Verification rejected by admin.',
      },
    });

    return res.json({ success: true, message: 'Doctor verification rejected.', data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to reject doctor.' });
  }
});

/**
 * GET /admin/doctors/:id/reviews
 * Admin: review moderation for a doctor
 */
router.get('/admin/doctors/:id/reviews', authenticate, requireRole('ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status = '', page = '1', limit = '20' } = req.query as Record<string, string>;
    const where: any = { doctorId: id };
    if (status) where.status = status;

    const reviews = await prisma.doctorReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    return res.json({ success: true, data: reviews });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

/**
 * PUT /admin/reviews/:reviewId
 * Hide or flag a review
 */
router.put('/admin/reviews/:reviewId', authenticate, requireRole('ADMIN'), async (req: any, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    const updated = await prisma.doctorReview.update({
      where: { id: reviewId },
      data: { status },
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update review.' });
  }
});

export default router;
