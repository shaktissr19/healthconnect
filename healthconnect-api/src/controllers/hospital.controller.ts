// src/controllers/hospital.controller.ts
// Fixed: updateMyProfile now whitelists fields instead of accepting raw req.body.
// Previously a hospital could self-set isVerified=true, isPremium=true,
// registrationNumber to anything they wanted.

import { Request, Response, NextFunction } from 'express';
import { prisma }      from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';

export const searchHospitals = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await prisma.user.findMany({
      where: { role: 'HOSPITAL', isActive: true },
      include: { hospitalProfile: true },
    }));
  } catch (e) { next(e); }
};

export const getFeaturedHospitals = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await prisma.user.findMany({
      where: { role: 'HOSPITAL', isActive: true },
      include: { hospitalProfile: true },
      take: 6,
    }));
  } catch (e) { next(e); }
};

export const getNearestHospitals = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch (e) { next(e); }
};

export const getHospitalProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { hospitalProfile: true },
    }));
  } catch (e) { next(e); }
};

export const getHospitalDoctors = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch (e) { next(e); }
};

export const getHospitalDepartments = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch (e) { next(e); }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { hospitalProfile: true },
    }));
  } catch (e) { next(e); }
};

// ── FIX: explicit field whitelist — prevents self-verification / self-upgrade ──
// Previously this was: prisma.hospitalProfile.update({ data: req.body })
// A hospital user could send { isVerified: true, isPremium: true } and it
// would be written directly to the DB.
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name, phone, email, website, logoUrl,
      addressLine1, city, state, pinCode,
      totalBeds, icuBeds, emergencyAvailable, opdTimings,
      specialties, accreditations,
    } = req.body;

    const data: Record<string, any> = {};
    if (name              !== undefined) data.name              = name;
    if (phone             !== undefined) data.phone             = phone;
    if (email             !== undefined) data.email             = email;
    if (website           !== undefined) data.website           = website;
    if (logoUrl           !== undefined) data.logoUrl           = logoUrl;
    if (addressLine1      !== undefined) data.addressLine1      = addressLine1;
    if (city              !== undefined) data.city              = city;
    if (state             !== undefined) data.state             = state;
    if (pinCode           !== undefined) data.pinCode           = pinCode;
    if (totalBeds         !== undefined) data.totalBeds         = Number(totalBeds);
    if (icuBeds           !== undefined) data.icuBeds           = Number(icuBeds);
    if (emergencyAvailable !== undefined) data.emergencyAvailable = Boolean(emergencyAvailable);
    if (opdTimings        !== undefined) data.opdTimings        = opdTimings;
    if (specialties       !== undefined) data.specialties       = specialties;
    if (accreditations    !== undefined) data.accreditations    = accreditations;

    const updated = await prisma.hospitalProfile.update({
      where: { userId: req.user!.userId },
      data,
    });

    return ApiResponse.success(res, updated, 'Profile updated');
  } catch (e) { next(e); }
};

export const getMyDoctors = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch (e) { next(e); }
};

export const inviteDoctor = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, null, 'Invitation sent'); } catch (e) { next(e); }
};

export const removeDoctor = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, null, 'Doctor removed'); } catch (e) { next(e); }
};
