// src/routes/public.routes.ts
// Public endpoints are rate-limited and return only explicitly selected fields.

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { publicRateLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(publicRateLimiter);

const verifiedDoctorWhere = {
  OR: [
    { verificationStatus: 'VERIFIED' as const },
    // Backward compatibility for doctors verified before verificationStatus existed.
    { verificationStatus: 'PENDING' as const, isVerified: true },
  ],
};

const PUBLIC_DOCTOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  profilePhotoUrl: true,
  hcDoctorId: true,
  verificationStatus: true,
  isVerified: true,
  specialization: true,
  subSpecializations: true,
  qualification: true,
  experienceYears: true,
  medicalLicenseNumber: true,
  licenseState: true,
  medicalCouncil: true,
  registrationYear: true,
  clinicName: true,
  clinicAddress: true,
  city: true,
  state: true,
  pinCode: true,
  languagesSpoken: true,
  bio: true,
  careerJourney: true,
  trainingHospitals: true,
  hospitalAffiliations: true,
  awards: true,
  publications: true,
  consultationFee: true,
  teleconsultFee: true,
  videoConsultFee: true,
  audioConsultFee: true,
  offersInPerson: true,
  offersVideoConsult: true,
  offersAudioConsult: true,
  offersChatConsult: true,
  videoPlatform: true,
  isAvailableOnline: true,
  isAcceptingNewPatients: true,
  availabilitySchedule: true,
  nextAvailableSlot: true,
  averageRating: true,
  totalReviews: true,
  totalPatients: true,
  profileViews: true,
  avgResponseTimeMin: true,
  featuredReview: true,
  featuredPatientName: true,
  profileScore: true,
  isProfileComplete: true,
  createdAt: true,
} as const;

// ─── GET /public/doctors ──────────────────────────────────────────────────────
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const {
      specialty,
      search,
      gender,
      city,
      state,
      language,
      available,
      offersVideo,
      offersAudio,
      limit = '6',
      sort = 'rating',
    } = req.query as Record<string, string | undefined>;

    const where: any = { AND: [verifiedDoctorWhere] };

    if (specialty && specialty !== 'All') {
      where.specialization = { contains: specialty, mode: 'insensitive' };
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (language) where.languagesSpoken = { has: language };
    if (available === 'true') where.isAvailableOnline = true;
    if (offersVideo === 'true') where.offersVideoConsult = true;
    if (offersAudio === 'true') where.offersAudioConsult = true;
    if (gender && ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'].includes(gender.toUpperCase())) {
      where.gender = gender.toUpperCase();
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { clinicName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { hcDoctorId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const limitNum = Math.min(500, Math.max(1, Number.parseInt(limit, 10) || 6));
    let orderBy: any = [{ averageRating: 'desc' }, { totalPatients: 'desc' }];
    if (sort === 'reviews') orderBy = [{ totalReviews: 'desc' }, { averageRating: 'desc' }];
    if (sort === 'experience') orderBy = [{ experienceYears: 'desc' }, { averageRating: 'desc' }];
    if (sort === 'fee_asc') orderBy = [{ consultationFee: 'asc' }, { averageRating: 'desc' }];
    if (sort === 'fee_desc') orderBy = [{ consultationFee: 'desc' }, { averageRating: 'desc' }];
    if (sort === 'newest') orderBy = [{ createdAt: 'desc' }];

    const doctors = await prisma.doctorProfile.findMany({
      where,
      take: limitNum,
      orderBy,
      select: PUBLIC_DOCTOR_SELECT,
    });

    return res.json({ success: true, data: doctors, total: doctors.length });
  } catch (error) {
    console.error('GET /public/doctors error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
});

// ─── GET /public/doctors/:id ──────────────────────────────────────────────────
router.get('/doctors/:id', async (req: Request, res: Response) => {
  try {
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        AND: [
          verifiedDoctorWhere,
          { OR: [{ id: req.params.id }, { hcDoctorId: req.params.id }] },
        ],
      },
      select: PUBLIC_DOCTOR_SELECT,
    });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    return res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('GET /public/doctors/:id error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor' });
  }
});

// ─── GET /public/doctors/:id/availability ─────────────────────────────────────
router.get('/doctors/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        AND: [verifiedDoctorWhere, { OR: [{ id }, { hcDoctorId: id }] }],
      },
      select: { id: true },
    });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const availability = await prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.id },
      orderBy: { dayOfWeek: 'asc' },
      select: { id: true, dayOfWeek: true, startTime: true, endTime: true, slotDuration: true, isActive: true },
    });

    const now = new Date();
    const end14 = new Date(now);
    end14.setDate(end14.getDate() + 14);

    const bookedSlots = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: { gte: now, lte: end14 },
      },
      select: { scheduledAt: true, durationMinutes: true },
    });

    return res.json({
      success: true,
      data: {
        availability,
        bookedSlots: bookedSlots.map(b => ({ scheduledAt: b.scheduledAt, durationMinutes: b.durationMinutes })),
      },
    });
  } catch (error) {
    console.error('GET /public/doctors/:id/availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
});

// ─── GET /public/communities ──────────────────────────────────────────────────
router.get('/communities', async (req: Request, res: Response) => {
  try {
    const { limit = '4' } = req.query;
    const communities = await prisma.community.findMany({
      where: { isActive: true, visibility: 'PUBLIC' },
      take: parseInt(limit as string),
      orderBy: { members: { _count: 'desc' } },
      select: {
        id: true, slug: true, name: true, description: true, emoji: true,
        category: true, isFeatured: true, allowAnonymous: true,
        _count: { select: { members: true, posts: true } },
      },
    });
    return res.json({ success: true, data: communities, total: communities.length });
  } catch (error) {
    console.error('GET /public/communities error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch communities' });
  }
});

// ─── GET /public/communities/:id/posts ───────────────────────────────────────
router.get('/communities/:id/posts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '5' } = req.query;
    const posts = await prisma.post.findMany({
      where: { communityId: id, status: 'PUBLISHED' },
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, body: true, tags: true,
        isAnonymous: true, anonymousAlias: true, authorId: true,
        viewCount: true, isPinned: true, createdAt: true,
        _count: { select: { comments: true, reactions: true } },
      },
    });
    return res.json({ success: true, data: posts, total: posts.length });
  } catch (error) {
    console.error('GET /public/communities/:id/posts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// ─── GET /public/testimonials ─────────────────────────────────────────────────
router.get('/testimonials', async (_req: Request, res: Response) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ success: true, data: testimonials, total: testimonials.length });
  } catch (error) {
    console.error('GET /public/testimonials error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
  }
});

// ─── GET /public/articles ─────────────────────────────────────────────────────
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const { limit = '6', category } = req.query;
    const where: any = { isPublished: true };
    if (category && category !== 'All') {
      where.category = { equals: category as string, mode: 'insensitive' };
    }
    const articles = await prisma.article.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
      select: {
        id: true, slug: true, title: true, excerpt: true, coverImage: true,
        type: true, difficulty: true, readTimeMin: true,
        authorName: true, isVerifiedAuthor: true, tags: true, category: true,
        isFeatured: true, isTrending: true, viewCount: true, publishedAt: true,
      },
    });
    return res.json({ success: true, data: articles, total: articles.length });
  } catch (error) {
    console.error('GET /public/articles error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch articles' });
  }
});

// ─── GET /public/stats ────────────────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [users, patients, doctors, appointments, communities, hospitals] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.doctorProfile.count({ where: verifiedDoctorWhere }),
      prisma.appointment.count(),
      prisma.community.count({ where: { isActive: true } }),
      prisma.hospitalProfile.count(),
    ]);
    return res.json({ success: true, data: { users, patients, doctors, appointments, communities, hospitals } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

export default router;
