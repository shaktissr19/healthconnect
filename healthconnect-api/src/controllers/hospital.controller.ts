import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';
import {
  getHospitalAvailability,
  getHospitalBookedSlots,
  replaceHospitalAvailability,
  checkHospitalDoctorAvailability,
} from '../modules/hospital/hospitalAvailability.service';

const IST_OFFSET_MS = 330 * 60 * 1000;
const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'] as const;

function indiaDayBounds(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const start = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function calculateProfileCompletion(profile: any) {
  const requirements = [
    ['name', 'Hospital name', profile.name],
    ['phone', 'Phone', profile.phone],
    ['registrationNumber', 'Registration number', profile.registrationNumber],
    ['hospitalType', 'Hospital type', profile.hospitalType],
    ['addressLine1', 'Address', profile.addressLine1],
    ['city', 'City', profile.city],
    ['state', 'State', profile.state],
    ['pinCode', 'PIN code', profile.pinCode],
    ['totalBeds', 'Total beds', profile.totalBeds !== null && profile.totalBeds !== undefined],
    ['specialties', 'Specialties', Array.isArray(profile.specialties) && profile.specialties.length > 0],
    ['authorizedContactName', 'Authorized contact', profile.authorizedContactName],
    ['authorizedContactPhone', 'Authorized contact phone', profile.authorizedContactPhone],
  ];
  const completed = requirements.filter(([, , value]) => Boolean(value)).length;
  return {
    percentage: Math.round((completed / requirements.length) * 100),
    completed,
    total: requirements.length,
    missing: requirements.filter(([, , value]) => !value).map(([key, label]) => ({ key, label })),
  };
}

async function syncCompletion(profile: any) {
  const completion = calculateProfileCompletion(profile);
  if (profile.profileScore !== completion.percentage || profile.isProfileComplete !== (completion.percentage === 100)) {
    await prisma.hospitalProfile.update({
      where: { id: profile.id },
      data: { profileScore: completion.percentage, isProfileComplete: completion.percentage === 100 },
    }).catch(() => undefined);
  }
  return completion;
}

const publicHospitalInclude = {
  user: { select: { id: true, registrationId: true, isActive: true } },
  _count: {
    select: {
      doctors: { where: { status: 'ACCEPTED' as const } },
      departments: true,
      reviews: { where: { status: 'PUBLISHED' as const } },
    },
  },
} as const;

function publicHospitalShape(profile: any) {
  const { user, _count, verificationNotes, verifiedByAdminId, verificationDocuments, authorizedContactName, authorizedContactPhone, ...safe } = profile;
  return {
    ...safe,
    id: profile.id,
    userId: user.id,
    registrationId: user.registrationId,
    doctorCount: _count?.doctors ?? 0,
    departmentCount: _count?.departments ?? 0,
    reviewCount: _count?.reviews ?? profile.totalReviews ?? 0,
  };
}

async function resolvePublicHospital(id: string) {
  return prisma.hospitalProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
      isActive: true,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      user: { isActive: true },
    },
    include: publicHospitalInclude,
  });
}

async function resolveOwnHospital(userId: string) {
  return prisma.hospitalProfile.findUnique({ where: { userId } });
}

async function audit(userId: string | undefined, action: string, entityType: string, entityId: string, metadata?: any) {
  await prisma.auditLog.create({ data: { userId, action, entityType, entityId, metadata } }).catch(() => undefined);
}

async function notifyUsers(userIds: Array<string | undefined | null>, title: string, body: string, data?: any) {
  const unique = [...new Set(userIds.filter(Boolean) as string[])];
  if (!unique.length) return;
  await prisma.notification.createMany({
    data: unique.map(userId => ({ userId, type: 'SYSTEM' as const, title, body, data })),
  }).catch(() => undefined);
}

async function doctorConflict(doctorId: string, start: Date, durationMinutes: number, excludeId?: string) {
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const candidates = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      scheduledAt: { gte: new Date(start.getTime() - 120 * 60_000), lt: end },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, scheduledAt: true, durationMinutes: true },
  });
  return candidates.some(item => {
    const itemEnd = item.scheduledAt.getTime() + (item.durationMinutes || 30) * 60_000;
    return item.scheduledAt.getTime() < end.getTime() && itemEnd > start.getTime();
  });
}

// ── Public discovery ───────────────────────────────────────────────────────
export const searchHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const city = String(req.query.city ?? '').trim();
    const state = String(req.query.state ?? '').trim();
    const specialty = String(req.query.specialty ?? '').trim();
    const facility = String(req.query.facility ?? '').trim();
    const insurance = String(req.query.insurance ?? '').trim();
    const scheme = String(req.query.scheme ?? '').trim();
    const type = String(req.query.type ?? '').trim();
    const emergency = String(req.query.emergency ?? '').toLowerCase();
    const teleconsult = String(req.query.teleconsult ?? '').toLowerCase();
    const sort = String(req.query.sort ?? 'featured').toLowerCase();
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20));

    const where: any = {
      isActive: true,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      user: { isActive: true },
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { specialties: { has: search } },
        { facilities: { has: search } },
      ];
    }
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (state) where.state = { equals: state, mode: 'insensitive' };
    if (specialty) where.specialties = { has: specialty };
    if (facility) where.facilities = { has: facility };
    if (insurance) where.insuranceProviders = { has: insurance };
    if (scheme) where.governmentSchemes = { has: scheme };
    if (type) where.hospitalType = type.toUpperCase();
    if (emergency === 'true') where.emergencyAvailable = true;
    if (teleconsult === 'true') where.teleconsultAvailable = true;

    const orderBy: any = sort === 'rating'
      ? [{ averageRating: 'desc' }, { totalReviews: 'desc' }, { name: 'asc' }]
      : sort === 'beds'
        ? [{ totalBeds: 'desc' }, { name: 'asc' }]
        : sort === 'name'
          ? [{ name: 'asc' }]
          : [{ isPremium: 'desc' }, { averageRating: 'desc' }, { name: 'asc' }];

    const [profiles, total] = await Promise.all([
      prisma.hospitalProfile.findMany({
        where,
        include: publicHospitalInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hospitalProfile.count({ where }),
    ]);

    return ApiResponse.success(res, {
      hospitals: profiles.map(publicHospitalShape),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) { next(e); }
};

export const getFeaturedHospitals = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const profiles = await prisma.hospitalProfile.findMany({
      where: { isActive: true, isVerified: true, verificationStatus: 'VERIFIED', user: { isActive: true } },
      include: publicHospitalInclude,
      orderBy: [{ isPremium: 'desc' }, { averageRating: 'desc' }, { name: 'asc' }],
      take: 6,
    });
    return ApiResponse.success(res, profiles.map(publicHospitalShape));
  } catch (e) { next(e); }
};

export const getNearestHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng ?? req.query.lon);
    const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit ?? '10'), 10) || 10));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query parameters are required.' });
    }
    const profiles = await prisma.hospitalProfile.findMany({
      where: {
        isActive: true,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        user: { isActive: true },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: publicHospitalInclude,
    });
    const toRad = (value: number) => value * Math.PI / 180;
    const distanceKm = (profile: any) => {
      const dLat = toRad(Number(profile.latitude) - lat);
      const dLon = toRad(Number(profile.longitude) - lng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(Number(profile.latitude))) * Math.sin(dLon / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    const nearest = profiles
      .map(profile => ({ ...publicHospitalShape(profile), distanceKm: Number(distanceKm(profile).toFixed(2)) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
    return ApiResponse.success(res, nearest);
  } catch (e) { next(e); }
};

export const getHospitalProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolvePublicHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    return ApiResponse.success(res, publicHospitalShape(hospital));
  } catch (e) { next(e); }
};

export const getHospitalDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolvePublicHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    const memberships = await prisma.doctorHospital.findMany({
      where: {
        hospitalId: hospital.id,
        status: 'ACCEPTED',
        doctor: {
          user: { isActive: true },
          OR: [{ verificationStatus: 'VERIFIED' }, { isVerified: true }],
        },
      },
      include: {
        doctor: {
          select: {
            id: true, firstName: true, lastName: true, profilePhotoUrl: true,
            specialization: true, subSpecializations: true, qualification: true,
            experienceYears: true, hcDoctorId: true, verificationStatus: true, isVerified: true,
            averageRating: true, totalReviews: true, consultationFee: true, videoConsultFee: true,
            offersInPerson: true, offersVideoConsult: true, isAcceptingNewPatients: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
    });
    return ApiResponse.success(res, memberships.map(item => ({
      ...item.doctor,
      department: item.department,
      isPrimary: item.isPrimary,
      joinedAt: item.joinedAt,
    })));
  } catch (e) { next(e); }
};

export const getHospitalDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolvePublicHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    const departments = await prisma.department.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: 'asc' } });
    return ApiResponse.success(res, departments);
  } catch (e) { next(e); }
};

export const getPublicDoctorAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolvePublicHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    const membership = await prisma.doctorHospital.findUnique({
      where: { doctorId_hospitalId: { doctorId: req.params.doctorId, hospitalId: hospital.id } },
      select: { status: true },
    });
    if (!membership || membership.status !== 'ACCEPTED') return ApiResponse.notFound(res, 'Doctor is not affiliated with this hospital');
    const [availability, bookedSlots] = await Promise.all([
      getHospitalAvailability(req.params.doctorId, hospital.id),
      getHospitalBookedSlots(req.params.doctorId, hospital.id),
    ]);
    return ApiResponse.success(res, { configured: availability.some(row => row.isActive), availability, bookedSlots });
  } catch (e) { next(e); }
};

export const getHospitalReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolvePublicHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const reviews = await prisma.hospitalReview.findMany({
      where: { hospitalId: hospital.id, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { patient: { select: { firstName: true, lastName: true } } },
    });
    return ApiResponse.success(res, reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      isAnonymous: review.isAnonymous,
      authorName: review.isAnonymous ? 'Verified patient' : `${review.patient.firstName} ${review.patient.lastName}`,
      createdAt: review.createdAt,
    })));
  } catch (e) { next(e); }
};

export const submitHospitalReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolvePublicHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId }, select: { id: true } });
    if (!patient) return ApiResponse.notFound(res, 'Patient profile not found');

    const appointment = await prisma.appointment.findFirst({
      where: { patientId: patient.id, hospitalId: hospital.id, status: 'COMPLETED' },
      orderBy: { scheduledAt: 'desc' },
      select: { id: true },
    });
    if (!appointment) {
      return res.status(403).json({ success: false, message: 'A completed appointment at this hospital is required before reviewing it.' });
    }

    const existing = await prisma.hospitalReview.findUnique({ where: { appointmentId: appointment.id } });
    if (existing) return res.status(409).json({ success: false, message: 'You already reviewed this hospital visit.' });

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

    const review = await prisma.$transaction(async tx => {
      const created = await tx.hospitalReview.create({
        data: {
          hospitalId: hospital.id,
          patientId: patient.id,
          userId: req.user!.userId,
          appointmentId: appointment.id,
          rating,
          title: req.body.title?.trim() || null,
          comment: req.body.comment?.trim() || null,
          isAnonymous: Boolean(req.body.isAnonymous),
          isVerified: true,
        },
      });
      const aggregate = await tx.hospitalReview.aggregate({ where: { hospitalId: hospital.id, status: 'PUBLISHED' }, _avg: { rating: true }, _count: true });
      await tx.hospitalProfile.update({
        where: { id: hospital.id },
        data: { averageRating: aggregate._avg.rating ?? 0, totalReviews: aggregate._count },
      });
      return created;
    });
    return ApiResponse.created(res, review, 'Hospital review submitted');
  } catch (e) { next(e); }
};

// ── Hospital portal profile / verification ────────────────────────────────
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, role: true, registrationId: true, isEmailVerified: true,
        isActive: true, lastLoginAt: true, hospitalProfile: true,
      },
    });
    if (!user?.hospitalProfile) return ApiResponse.notFound(res, 'Hospital profile not found');
    const completion = await syncCompletion(user.hospitalProfile);
    return ApiResponse.success(res, { ...user, hospitalProfile: { ...user.hospitalProfile, profileCompletion: completion } });
  } catch (e) { next(e); }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await resolveOwnHospital(req.user!.userId);
    if (!existing) return ApiResponse.notFound(res, 'Hospital profile not found');
    const nextTotalBeds = req.body.totalBeds ?? existing.totalBeds;
    const nextIcuBeds = req.body.icuBeds ?? existing.icuBeds;
    if (nextTotalBeds != null && nextIcuBeds != null && nextIcuBeds > nextTotalBeds) {
      return res.status(400).json({ success: false, message: 'ICU beds cannot exceed total beds.' });
    }

    const allowed = [
      'name', 'phone', 'email', 'website', 'logoUrl', 'galleryUrls', 'about', 'hospitalType',
      'addressLine1', 'city', 'state', 'pinCode', 'latitude', 'longitude',
      'totalBeds', 'icuBeds', 'emergencyAvailable', 'teleconsultAvailable', 'opdTimings',
      'specialties', 'accreditations', 'facilities', 'insuranceProviders', 'governmentSchemes',
      'registrationNumber', 'registrationAuthority', 'authorizedContactName', 'authorizedContactPhone',
    ];
    const data: Record<string, any> = {};
    for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];

    if (existing.verificationStatus === 'VERIFIED' || existing.verificationStatus === 'UNDER_REVIEW') {
      delete data.registrationNumber;
      delete data.registrationAuthority;
    }

    let updated = await prisma.hospitalProfile.update({ where: { id: existing.id }, data });
    const completion = calculateProfileCompletion(updated);
    updated = await prisma.hospitalProfile.update({
      where: { id: existing.id },
      data: { profileScore: completion.percentage, isProfileComplete: completion.percentage === 100 },
    });
    await audit(req.user!.userId, 'HOSPITAL_PROFILE_UPDATED', 'HospitalProfile', existing.id, { changedFields: Object.keys(data) });
    return ApiResponse.success(res, { ...updated, profileCompletion: completion }, 'Profile updated');
  } catch (e) { next(e); }
};

export const getVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const completion = await syncCompletion(hospital);
    return ApiResponse.success(res, {
      status: hospital.verificationStatus,
      isVerified: hospital.isVerified,
      verifiedAt: hospital.verifiedAt,
      verificationNotes: hospital.verificationNotes,
      verificationSubmittedAt: hospital.verificationSubmittedAt,
      verificationDocuments: hospital.verificationDocuments,
      registrationNumber: hospital.registrationNumber,
      registrationAuthority: hospital.registrationAuthority,
      profileCompletion: completion,
    });
  } catch (e) { next(e); }
};

export const submitVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    if (hospital.verificationStatus === 'VERIFIED') return res.status(409).json({ success: false, message: 'Hospital is already verified.' });
    if (!hospital.registrationNumber || !hospital.authorizedContactName || !hospital.authorizedContactPhone) {
      return res.status(400).json({ success: false, message: 'Registration number and authorized contact details are required before submission.' });
    }
    const documents = Array.isArray(req.body.verificationDocuments) ? req.body.verificationDocuments : [];
    if (!documents.length) return res.status(400).json({ success: false, message: 'At least one verification document URL is required.' });

    const updated = await prisma.hospitalProfile.update({
      where: { id: hospital.id },
      data: {
        verificationDocuments: documents,
        verificationStatus: 'SUBMITTED',
        verificationSubmittedAt: new Date(),
        verificationNotes: null,
        isVerified: false,
      },
    });
    await audit(req.user!.userId, 'HOSPITAL_VERIFICATION_SUBMITTED', 'HospitalProfile', hospital.id, { documentCount: documents.length });
    return ApiResponse.success(res, updated, 'Verification submitted for admin review');
  } catch (e) { next(e); }
};

// ── Hospital dashboard / analytics ────────────────────────────────────────
export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const { start, end } = indiaDayBounds();
    const [doctorCount, pendingDoctors, departmentCount, todayAppointments, upcomingAppointments, patients, recentAppointments] = await Promise.all([
      prisma.doctorHospital.count({ where: { hospitalId: hospital.id, status: 'ACCEPTED' } }),
      prisma.doctorHospital.count({ where: { hospitalId: hospital.id, status: 'PENDING' } }),
      prisma.department.count({ where: { hospitalId: hospital.id } }),
      prisma.appointment.count({ where: { hospitalId: hospital.id, scheduledAt: { gte: start, lt: end }, status: { not: 'CANCELLED' } } }),
      prisma.appointment.count({ where: { hospitalId: hospital.id, scheduledAt: { gte: new Date() }, status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } } }),
      prisma.appointment.findMany({ where: { hospitalId: hospital.id }, distinct: ['patientId'], select: { patientId: true } }),
      prisma.appointment.findMany({
        where: { hospitalId: hospital.id }, orderBy: { scheduledAt: 'desc' }, take: 8,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, firstName: true, lastName: true, specialization: true } },
        },
      }),
    ]);
    const completion = await syncCompletion(hospital);
    return ApiResponse.success(res, {
      profile: { ...hospital, profileCompletion: completion },
      stats: {
        doctors: doctorCount, pendingDoctors, departments: departmentCount, patients: patients.length,
        todayAppointments, upcomingAppointments, totalBeds: hospital.totalBeds ?? 0, icuBeds: hospital.icuBeds ?? 0,
        averageRating: hospital.averageRating, totalReviews: hospital.totalReviews,
      },
      recentAppointments,
    });
  } catch (e) { next(e); }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [byStatus, byType, appointments, affiliations] = await Promise.all([
      prisma.appointment.groupBy({ where: { hospitalId: hospital.id, scheduledAt: { gte: from } }, by: ['status'], _count: true }),
      prisma.appointment.groupBy({ where: { hospitalId: hospital.id, scheduledAt: { gte: from } }, by: ['type'], _count: true }),
      prisma.appointment.findMany({
        where: { hospitalId: hospital.id, scheduledAt: { gte: from } },
        select: { doctorId: true },
      }),
      prisma.doctorHospital.findMany({
        where: { hospitalId: hospital.id, status: 'ACCEPTED' },
        select: { doctorId: true, department: true, doctor: { select: { firstName: true, lastName: true } } },
      }),
    ]);
    const doctorMap = new Map(affiliations.map(item => [item.doctorId, item]));
    const doctorCounts = new Map<string, number>();
    const departmentCounts = new Map<string, number>();
    for (const appointment of appointments) {
      doctorCounts.set(appointment.doctorId, (doctorCounts.get(appointment.doctorId) ?? 0) + 1);
      const department = doctorMap.get(appointment.doctorId)?.department ?? 'Unassigned';
      departmentCounts.set(department, (departmentCounts.get(department) ?? 0) + 1);
    }
    return ApiResponse.success(res, {
      periodDays: 30,
      byStatus,
      byType,
      byDoctor: [...doctorCounts.entries()].map(([doctorId, count]) => ({
        doctorId,
        name: doctorMap.get(doctorId) ? `Dr. ${doctorMap.get(doctorId)!.doctor.firstName} ${doctorMap.get(doctorId)!.doctor.lastName}` : 'Doctor',
        count,
      })).sort((a, b) => b.count - a.count),
      byDepartment: [...departmentCounts.entries()].map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count),
    });
  } catch (e) { next(e); }
};

// ── Doctor affiliations / OPD availability ────────────────────────────────
export const getMyDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const memberships = await prisma.doctorHospital.findMany({
      where: { hospitalId: hospital.id, status: { not: 'REVOKED' } },
      include: { doctor: { include: { user: { select: { email: true, isActive: true, registrationId: true } } } } },
      orderBy: [{ status: 'asc' }, { isPrimary: 'desc' }, { invitedAt: 'desc' }],
    });
    return ApiResponse.success(res, memberships.map(item => ({
      ...item.doctor,
      email: item.doctor.user.email,
      userActive: item.doctor.user.isActive,
      registrationId: item.doctor.user.registrationId,
      membershipId: item.id,
      affiliationStatus: item.status,
      department: item.department,
      isPrimary: item.isPrimary,
      invitedAt: item.invitedAt,
      respondedAt: item.respondedAt,
      joinedAt: item.joinedAt,
    })));
  } catch (e) { next(e); }
};

export const inviteDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const doctorUser = await prisma.user.findUnique({ where: { email: req.body.email }, include: { doctorProfile: true } });
    if (!doctorUser || doctorUser.role !== 'DOCTOR' || !doctorUser.isActive || !doctorUser.doctorProfile) {
      return res.status(404).json({ success: false, message: 'Active doctor account not found for this email.' });
    }
    const doctorId = doctorUser.doctorProfile.id;
    const existing = await prisma.doctorHospital.findUnique({ where: { doctorId_hospitalId: { doctorId, hospitalId: hospital.id } } });
    if (existing?.status === 'ACCEPTED') {
      const updated = await prisma.doctorHospital.update({
        where: { id: existing.id },
        data: { department: req.body.department, isPrimary: Boolean(req.body.isPrimary) },
      });
      return ApiResponse.success(res, updated, 'Existing doctor affiliation updated');
    }

    const membership = await prisma.doctorHospital.upsert({
      where: { doctorId_hospitalId: { doctorId, hospitalId: hospital.id } },
      create: {
        doctorId, hospitalId: hospital.id, department: req.body.department,
        isPrimary: Boolean(req.body.isPrimary), status: 'PENDING', invitedByUserId: req.user!.userId,
      },
      update: {
        department: req.body.department, isPrimary: Boolean(req.body.isPrimary), status: 'PENDING',
        invitedAt: new Date(), respondedAt: null, revokedAt: null, invitedByUserId: req.user!.userId,
      },
    });
    await prisma.notification.create({
      data: {
        userId: doctorUser.id,
        type: 'SYSTEM',
        title: 'Hospital affiliation invitation',
        body: `${hospital.name} invited you to join its HealthConnect doctor directory${req.body.department ? ` (${req.body.department})` : ''}. Review it from your Doctor Profile.`,
        data: { affiliationId: membership.id, hospitalId: hospital.id, href: '/doctor-dashboard?tab=profile' },
      },
    }).catch(() => undefined);
    await audit(req.user!.userId, 'HOSPITAL_DOCTOR_INVITED', 'DoctorHospital', membership.id, { doctorId, department: req.body.department });
    return ApiResponse.created(res, membership, 'Doctor invitation sent');
  } catch (e) { next(e); }
};

export const removeDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const membership = await prisma.doctorHospital.findUnique({
      where: { doctorId_hospitalId: { doctorId: req.params.doctorId, hospitalId: hospital.id } },
      include: { doctor: { select: { userId: true, firstName: true, lastName: true } } },
    });
    if (!membership) return ApiResponse.notFound(res, 'Doctor affiliation not found');
    await prisma.$transaction([
      prisma.doctorHospital.update({ where: { id: membership.id }, data: { status: 'REVOKED', revokedAt: new Date(), isPrimary: false } }),
      prisma.hospitalDoctorAvailability.deleteMany({ where: { hospitalId: hospital.id, doctorId: req.params.doctorId } }),
    ]);
    await notifyUsers([membership.doctor.userId], 'Hospital affiliation ended', `${hospital.name} removed your hospital affiliation.`, { hospitalId: hospital.id });
    await audit(req.user!.userId, 'HOSPITAL_DOCTOR_REMOVED', 'DoctorHospital', membership.id, { doctorId: req.params.doctorId });
    return ApiResponse.success(res, null, 'Doctor affiliation removed');
  } catch (e) { next(e); }
};

export const getMyDoctorAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const availability = await getHospitalAvailability(req.params.doctorId, hospital.id);
    return ApiResponse.success(res, availability);
  } catch (e) { next(e); }
};

export const updateMyDoctorAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const rows = await replaceHospitalAvailability(req.params.doctorId, hospital.id, req.body.schedule ?? []);
    await audit(req.user!.userId, 'HOSPITAL_DOCTOR_AVAILABILITY_UPDATED', 'HospitalDoctorAvailability', hospital.id, { doctorId: req.params.doctorId, sessions: rows.length });
    return ApiResponse.success(res, rows, 'Hospital OPD schedule updated');
  } catch (e: any) {
    if (e?.message) return res.status(400).json({ success: false, message: e.message });
    next(e);
  }
};

// ── Departments ───────────────────────────────────────────────────────────
export const getMyDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const departments = await prisma.department.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: 'asc' } });
    return ApiResponse.success(res, departments);
  } catch (e) { next(e); }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const duplicate = await prisma.department.findFirst({ where: { hospitalId: hospital.id, name: { equals: req.body.name, mode: 'insensitive' } } });
    if (duplicate) return res.status(409).json({ success: false, message: 'Department already exists.' });
    const department = await prisma.department.create({ data: { hospitalId: hospital.id, name: req.body.name, headName: req.body.headName, phone: req.body.phone } });
    await audit(req.user!.userId, 'HOSPITAL_DEPARTMENT_CREATED', 'Department', department.id);
    return ApiResponse.created(res, department, 'Department created');
  } catch (e) { next(e); }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const existing = await prisma.department.findFirst({ where: { id: req.params.id, hospitalId: hospital.id } });
    if (!existing) return ApiResponse.notFound(res, 'Department not found');
    const updated = await prisma.department.update({ where: { id: existing.id }, data: req.body });
    await audit(req.user!.userId, 'HOSPITAL_DEPARTMENT_UPDATED', 'Department', existing.id, { changedFields: Object.keys(req.body) });
    return ApiResponse.success(res, updated, 'Department updated');
  } catch (e) { next(e); }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const existing = await prisma.department.findFirst({ where: { id: req.params.id, hospitalId: hospital.id } });
    if (!existing) return ApiResponse.notFound(res, 'Department not found');
    const inUse = await prisma.doctorHospital.count({ where: { hospitalId: hospital.id, department: existing.name, status: 'ACCEPTED' } });
    if (inUse > 0) return res.status(409).json({ success: false, message: 'Reassign affiliated doctors before deleting this department.' });
    await prisma.department.delete({ where: { id: existing.id } });
    await audit(req.user!.userId, 'HOSPITAL_DEPARTMENT_DELETED', 'Department', existing.id);
    return ApiResponse.success(res, null, 'Department deleted');
  } catch (e) { next(e); }
};

// ── Hospital appointment operations ──────────────────────────────────────
export const getMyAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const where: any = { hospitalId: hospital.id };
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.doctorId) where.doctorId = String(req.query.doctorId);
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { scheduledAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor: { select: { id: true, firstName: true, lastName: true, specialization: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);
    return ApiResponse.success(res, { appointments, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};

export const updateHospitalAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, hospitalId: hospital.id },
      include: { patient: { select: { userId: true } }, doctor: { select: { userId: true } } },
    });
    if (!appointment) return ApiResponse.notFound(res, 'Hospital appointment not found');
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status) && appointment.status !== req.body.status) {
      return res.status(409).json({ success: false, message: `A ${appointment.status.toLowerCase()} appointment cannot change status.` });
    }
    const status = req.body.status;
    const data: any = { status };
    if (status === 'CANCELLED') {
      data.cancelledBy = 'HOSPITAL';
      data.cancellationReason = req.body.reason || 'Cancelled by hospital';
    }
    const updated = await prisma.appointment.update({ where: { id: appointment.id }, data });
    await notifyUsers(
      [appointment.patient.userId, appointment.doctor.userId],
      `Appointment ${String(status).replaceAll('_', ' ').toLowerCase()}`,
      `${hospital.name} updated the appointment status to ${String(status).replaceAll('_', ' ')}.`,
      { appointmentId: appointment.id, hospitalId: hospital.id },
    );
    await audit(req.user!.userId, 'HOSPITAL_APPOINTMENT_STATUS_UPDATED', 'Appointment', appointment.id, { from: appointment.status, to: status });
    return ApiResponse.success(res, updated, 'Appointment status updated');
  } catch (e) { next(e); }
};

export const rescheduleHospitalAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, hospitalId: hospital.id },
      include: { patient: { select: { userId: true } }, doctor: { select: { userId: true } } },
    });
    if (!appointment) return ApiResponse.notFound(res, 'Hospital appointment not found');
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) return res.status(409).json({ success: false, message: 'This appointment cannot be rescheduled.' });
    const scheduledAt = new Date(req.body.scheduledAt);
    const availability = await checkHospitalDoctorAvailability({
      doctorId: appointment.doctorId,
      hospitalId: hospital.id,
      scheduledAt,
      durationMinutes: appointment.durationMinutes || 30,
      appointmentType: appointment.type,
    });
    if (!availability.available) return res.status(409).json({ success: false, message: availability.reason });
    if (await doctorConflict(appointment.doctorId, scheduledAt, appointment.durationMinutes || 30, appointment.id)) {
      return res.status(409).json({ success: false, message: 'This time overlaps another appointment.' });
    }
    const updated = await prisma.appointment.update({ where: { id: appointment.id }, data: { scheduledAt, status: 'RESCHEDULED' } });
    await notifyUsers(
      [appointment.patient.userId, appointment.doctor.userId],
      'Hospital appointment rescheduled',
      `${hospital.name} rescheduled the appointment to ${scheduledAt.toLocaleString('en-IN')}.`,
      { appointmentId: appointment.id, hospitalId: hospital.id },
    );
    await audit(req.user!.userId, 'HOSPITAL_APPOINTMENT_RESCHEDULED', 'Appointment', appointment.id, { scheduledAt: scheduledAt.toISOString() });
    return ApiResponse.success(res, updated, 'Appointment rescheduled');
  } catch (e) { next(e); }
};
