import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';

const IST_OFFSET_MS = 330 * 60 * 1000;

function indiaDayBounds(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const start = new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS,
  );
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function publicHospitalShape(profile: any) {
  const { user, ...hospitalProfile } = profile;
  return {
    id: user.id,
    role: 'HOSPITAL',
    registrationId: user.registrationId,
    isActive: user.isActive,
    hospitalProfile,
  };
}

const publicHospitalInclude = {
  user: {
    select: {
      id: true,
      registrationId: true,
      isActive: true,
    },
  },
} as const;

async function resolveHospital(id: string) {
  return prisma.hospitalProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
      isActive: true,
      user: { isActive: true },
    },
    include: publicHospitalInclude,
  });
}

async function resolveOwnHospital(userId: string) {
  return prisma.hospitalProfile.findUnique({ where: { userId } });
}

export const searchHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const city = String(req.query.city ?? '').trim();
    const state = String(req.query.state ?? '').trim();
    const specialty = String(req.query.specialty ?? '').trim();
    const emergency = String(req.query.emergency ?? '').toLowerCase();
    const verified = String(req.query.verified ?? '').toLowerCase();
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '50'), 10) || 50));

    const where: any = {
      isActive: true,
      user: { isActive: true },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { specialties: { has: search } },
      ];
    }
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (state) where.state = { equals: state, mode: 'insensitive' };
    if (specialty) where.specialties = { has: specialty };
    if (emergency === 'true') where.emergencyAvailable = true;
    if (verified === 'true') where.isVerified = true;

    const [profiles, total] = await Promise.all([
      prisma.hospitalProfile.findMany({
        where,
        include: publicHospitalInclude,
        orderBy: [{ isPremium: 'desc' }, { isVerified: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hospitalProfile.count({ where }),
    ]);

    const hospitals = profiles.map(publicHospitalShape);
    res.setHeader('X-Total-Count', String(total));
    res.setHeader('X-Page', String(page));
    res.setHeader('X-Total-Pages', String(Math.max(1, Math.ceil(total / limit))));
    return ApiResponse.success(res, hospitals);
  } catch (e) { next(e); }
};

export const getFeaturedHospitals = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const profiles = await prisma.hospitalProfile.findMany({
      where: { isActive: true, user: { isActive: true } },
      include: publicHospitalInclude,
      orderBy: [{ isPremium: 'desc' }, { isVerified: 'desc' }, { name: 'asc' }],
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
        user: { isActive: true },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: publicHospitalInclude,
    });

    const toRad = (value: number) => value * Math.PI / 180;
    const distanceKm = (p: any) => {
      const dLat = toRad(Number(p.latitude) - lat);
      const dLon = toRad(Number(p.longitude) - lng);
      const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat)) * Math.cos(toRad(Number(p.latitude))) * Math.sin(dLon / 2) ** 2;
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
    const hospital = await resolveHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    return ApiResponse.success(res, publicHospitalShape(hospital));
  } catch (e) { next(e); }
};

export const getHospitalDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');

    const memberships = await prisma.doctorHospital.findMany({
      where: { hospitalId: hospital.id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            specialization: true,
            subSpecializations: true,
            qualification: true,
            experienceYears: true,
            hcDoctorId: true,
            verificationStatus: true,
            isVerified: true,
            averageRating: true,
            totalReviews: true,
            offersInPerson: true,
            offersVideoConsult: true,
            isAcceptingNewPatients: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
    });

    return ApiResponse.success(res, memberships.map(m => ({
      ...m.doctor,
      department: m.department,
      isPrimary: m.isPrimary,
      joinedAt: m.joinedAt,
    })));
  } catch (e) { next(e); }
};

export const getHospitalDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveHospital(req.params.id);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    const departments = await prisma.department.findMany({
      where: { hospitalId: hospital.id },
      orderBy: { name: 'asc' },
    });
    return ApiResponse.success(res, departments);
  } catch (e) { next(e); }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        role: true,
        registrationId: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        hospitalProfile: true,
      },
    });
    if (!user?.hospitalProfile) return ApiResponse.notFound(res, 'Hospital profile not found');
    return ApiResponse.success(res, user);
  } catch (e) { next(e); }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await resolveOwnHospital(req.user!.userId);
    if (!existing) return ApiResponse.notFound(res, 'Hospital profile not found');

    const nextTotalBeds = req.body.totalBeds ?? existing.totalBeds;
    const nextIcuBeds = req.body.icuBeds ?? existing.icuBeds;
    if (nextTotalBeds !== null && nextIcuBeds !== null && nextTotalBeds !== undefined && nextIcuBeds !== undefined && nextIcuBeds > nextTotalBeds) {
      return res.status(400).json({ success: false, message: 'ICU beds cannot exceed total beds.' });
    }

    const allowed = [
      'name', 'phone', 'email', 'website', 'logoUrl',
      'addressLine1', 'city', 'state', 'pinCode', 'latitude', 'longitude',
      'totalBeds', 'icuBeds', 'emergencyAvailable', 'opdTimings',
      'specialties', 'accreditations',
    ];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const updated = await prisma.hospitalProfile.update({ where: { id: existing.id }, data });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'HOSPITAL_PROFILE_UPDATED',
        entityType: 'HospitalProfile',
        entityId: existing.id,
        metadata: { changedFields: Object.keys(data) },
      },
    }).catch(() => undefined);

    return ApiResponse.success(res, updated, 'Profile updated');
  } catch (e) { next(e); }
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');

    const { start, end } = indiaDayBounds();
    const [doctorCount, departmentCount, todayAppointments, upcomingAppointments, patients, recentAppointments] = await Promise.all([
      prisma.doctorHospital.count({ where: { hospitalId: hospital.id } }),
      prisma.department.count({ where: { hospitalId: hospital.id } }),
      prisma.appointment.count({ where: { hospitalId: hospital.id, scheduledAt: { gte: start, lt: end }, status: { not: 'CANCELLED' } } }),
      prisma.appointment.count({ where: { hospitalId: hospital.id, scheduledAt: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED', 'RESCHEDULED'] } } }),
      prisma.appointment.findMany({ where: { hospitalId: hospital.id }, distinct: ['patientId'], select: { patientId: true } }),
      prisma.appointment.findMany({
        where: { hospitalId: hospital.id },
        orderBy: { scheduledAt: 'desc' },
        take: 8,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, firstName: true, lastName: true, specialization: true } },
        },
      }),
    ]);

    return ApiResponse.success(res, {
      profile: hospital,
      stats: {
        doctors: doctorCount,
        departments: departmentCount,
        patients: patients.length,
        todayAppointments,
        upcomingAppointments,
        totalBeds: hospital.totalBeds ?? 0,
        icuBeds: hospital.icuBeds ?? 0,
      },
      recentAppointments,
    });
  } catch (e) { next(e); }
};

export const getMyDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const memberships = await prisma.doctorHospital.findMany({
      where: { hospitalId: hospital.id },
      include: {
        doctor: {
          include: {
            user: { select: { email: true, isActive: true, registrationId: true } },
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'desc' }],
    });
    return ApiResponse.success(res, memberships.map(m => ({
      ...m.doctor,
      email: m.doctor.user.email,
      userActive: m.doctor.user.isActive,
      registrationId: m.doctor.user.registrationId,
      department: m.department,
      isPrimary: m.isPrimary,
      joinedAt: m.joinedAt,
    })));
  } catch (e) { next(e); }
};

export const inviteDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');

    const doctorUser = await prisma.user.findUnique({
      where: { email: req.body.email },
      include: { doctorProfile: true },
    });
    if (!doctorUser || doctorUser.role !== 'DOCTOR' || !doctorUser.isActive || !doctorUser.doctorProfile) {
      return res.status(404).json({ success: false, message: 'Active doctor account not found for this email.' });
    }

    const doctorId = doctorUser.doctorProfile.id;
    const membership = await prisma.$transaction(async tx => {
      if (req.body.isPrimary) {
        await tx.doctorHospital.updateMany({ where: { doctorId }, data: { isPrimary: false } });
      }
      return tx.doctorHospital.upsert({
        where: { doctorId_hospitalId: { doctorId, hospitalId: hospital.id } },
        create: {
          doctorId,
          hospitalId: hospital.id,
          department: req.body.department,
          isPrimary: Boolean(req.body.isPrimary),
        },
        update: {
          department: req.body.department,
          isPrimary: Boolean(req.body.isPrimary),
        },
        include: { doctor: { select: { firstName: true, lastName: true } } },
      });
    });

    await prisma.notification.create({
      data: {
        userId: doctorUser.id,
        type: 'SYSTEM',
        title: 'Hospital affiliation updated',
        body: `${hospital.name} added you to its HealthConnect doctor directory${req.body.department ? ` (${req.body.department})` : ''}.`,
      },
    }).catch(() => undefined);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'HOSPITAL_DOCTOR_ADDED',
        entityType: 'DoctorHospital',
        entityId: membership.id,
        metadata: { doctorId, department: req.body.department ?? null, isPrimary: Boolean(req.body.isPrimary) },
      },
    }).catch(() => undefined);

    return ApiResponse.success(res, membership, 'Doctor added to hospital');
  } catch (e) { next(e); }
};

export const removeDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const result = await prisma.doctorHospital.deleteMany({
      where: { hospitalId: hospital.id, doctorId: req.params.doctorId },
    });
    if (!result.count) return ApiResponse.notFound(res, 'Doctor is not affiliated with this hospital');

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'HOSPITAL_DOCTOR_REMOVED',
        entityType: 'DoctorHospital',
        entityId: req.params.doctorId,
        metadata: { doctorId: req.params.doctorId },
      },
    }).catch(() => undefined);

    return ApiResponse.success(res, null, 'Doctor removed');
  } catch (e) { next(e); }
};

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
    const existing = await prisma.department.findFirst({ where: { hospitalId: hospital.id, name: { equals: req.body.name, mode: 'insensitive' } } });
    if (existing) return res.status(409).json({ success: false, message: 'Department already exists.' });
    const department = await prisma.department.create({ data: { hospitalId: hospital.id, ...req.body } });
    return ApiResponse.created(res, department, 'Department created');
  } catch (e) { next(e); }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const owned = await prisma.department.findFirst({ where: { id: req.params.id, hospitalId: hospital.id } });
    if (!owned) return ApiResponse.notFound(res, 'Department not found');
    if (req.body.name) {
      const duplicate = await prisma.department.findFirst({
        where: { hospitalId: hospital.id, id: { not: owned.id }, name: { equals: req.body.name, mode: 'insensitive' } },
      });
      if (duplicate) return res.status(409).json({ success: false, message: 'Department already exists.' });
    }
    const department = await prisma.department.update({ where: { id: owned.id }, data: req.body });
    return ApiResponse.success(res, department, 'Department updated');
  } catch (e) { next(e); }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const owned = await prisma.department.findFirst({ where: { id: req.params.id, hospitalId: hospital.id } });
    if (!owned) return ApiResponse.notFound(res, 'Department not found');
    await prisma.department.delete({ where: { id: owned.id } });
    return ApiResponse.success(res, null, 'Department deleted');
  } catch (e) { next(e); }
};

export const getMyAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await resolveOwnHospital(req.user!.userId);
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '50'), 10) || 50));
    const where: any = { hospitalId: hospital.id };
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.date) {
      const start = new Date(`${String(req.query.date)}T00:00:00+05:30`);
      if (!Number.isNaN(start.getTime())) where.scheduledAt = { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor: { select: { id: true, firstName: true, lastName: true, specialization: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return ApiResponse.success(res, { appointments, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};
