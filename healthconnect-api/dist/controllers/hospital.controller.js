"use strict";
// src/controllers/hospital.controller.ts
// Fixed: updateMyProfile now whitelists fields instead of accepting raw req.body.
// Previously a hospital could self-set isVerified=true, isPremium=true,
// registrationNumber to anything they wanted.
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDoctor = exports.inviteDoctor = exports.getMyDoctors = exports.updateMyProfile = exports.getMyProfile = exports.getHospitalDepartments = exports.getHospitalDoctors = exports.getHospitalProfile = exports.getNearestHospitals = exports.getFeaturedHospitals = exports.searchHospitals = void 0;
const prisma_1 = require("../lib/prisma");
const apiResponse_1 = require("../utils/apiResponse");
const searchHospitals = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma_1.prisma.user.findMany({
            where: { role: 'HOSPITAL', isActive: true },
            include: { hospitalProfile: true },
        }));
    }
    catch (e) {
        next(e);
    }
};
exports.searchHospitals = searchHospitals;
const getFeaturedHospitals = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma_1.prisma.user.findMany({
            where: { role: 'HOSPITAL', isActive: true },
            include: { hospitalProfile: true },
            take: 6,
        }));
    }
    catch (e) {
        next(e);
    }
};
exports.getFeaturedHospitals = getFeaturedHospitals;
const getNearestHospitals = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, []);
    }
    catch (e) {
        next(e);
    }
};
exports.getNearestHospitals = getNearestHospitals;
const getHospitalProfile = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id },
            include: { hospitalProfile: true },
        }));
    }
    catch (e) {
        next(e);
    }
};
exports.getHospitalProfile = getHospitalProfile;
const getHospitalDoctors = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, []);
    }
    catch (e) {
        next(e);
    }
};
exports.getHospitalDoctors = getHospitalDoctors;
const getHospitalDepartments = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, []);
    }
    catch (e) {
        next(e);
    }
};
exports.getHospitalDepartments = getHospitalDepartments;
const getMyProfile = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { hospitalProfile: true },
        }));
    }
    catch (e) {
        next(e);
    }
};
exports.getMyProfile = getMyProfile;
// ── FIX: explicit field whitelist — prevents self-verification / self-upgrade ──
// Previously this was: prisma.hospitalProfile.update({ data: req.body })
// A hospital user could send { isVerified: true, isPremium: true } and it
// would be written directly to the DB.
const updateMyProfile = async (req, res, next) => {
    try {
        const { name, phone, email, website, logoUrl, addressLine1, city, state, pinCode, totalBeds, icuBeds, emergencyAvailable, opdTimings, specialties, accreditations, } = req.body;
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (phone !== undefined)
            data.phone = phone;
        if (email !== undefined)
            data.email = email;
        if (website !== undefined)
            data.website = website;
        if (logoUrl !== undefined)
            data.logoUrl = logoUrl;
        if (addressLine1 !== undefined)
            data.addressLine1 = addressLine1;
        if (city !== undefined)
            data.city = city;
        if (state !== undefined)
            data.state = state;
        if (pinCode !== undefined)
            data.pinCode = pinCode;
        if (totalBeds !== undefined)
            data.totalBeds = Number(totalBeds);
        if (icuBeds !== undefined)
            data.icuBeds = Number(icuBeds);
        if (emergencyAvailable !== undefined)
            data.emergencyAvailable = Boolean(emergencyAvailable);
        if (opdTimings !== undefined)
            data.opdTimings = opdTimings;
        if (specialties !== undefined)
            data.specialties = specialties;
        if (accreditations !== undefined)
            data.accreditations = accreditations;
        const updated = await prisma_1.prisma.hospitalProfile.update({
            where: { userId: req.user.userId },
            data,
        });
        return apiResponse_1.ApiResponse.success(res, updated, 'Profile updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateMyProfile = updateMyProfile;
const getMyDoctors = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, []);
    }
    catch (e) {
        next(e);
    }
};
exports.getMyDoctors = getMyDoctors;
const inviteDoctor = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, null, 'Invitation sent');
    }
    catch (e) {
        next(e);
    }
};
exports.inviteDoctor = inviteDoctor;
const removeDoctor = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, null, 'Doctor removed');
    }
    catch (e) {
        next(e);
    }
};
exports.removeDoctor = removeDoctor;
//# sourceMappingURL=hospital.controller.js.map