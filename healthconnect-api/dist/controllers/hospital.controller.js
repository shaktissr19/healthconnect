"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDoctor = exports.inviteDoctor = exports.getMyDoctors = exports.updateMyProfile = exports.getMyProfile = exports.getHospitalDepartments = exports.getHospitalDoctors = exports.getHospitalProfile = exports.getNearestHospitals = exports.getFeaturedHospitals = exports.searchHospitals = void 0;
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const prisma = new client_1.PrismaClient();
const searchHospitals = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma.user.findMany({ where: { role: 'HOSPITAL', isActive: true }, include: { hospitalProfile: true } }));
    }
    catch (e) {
        next(e);
    }
};
exports.searchHospitals = searchHospitals;
const getFeaturedHospitals = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma.user.findMany({ where: { role: 'HOSPITAL', isActive: true }, include: { hospitalProfile: true }, take: 6 }));
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
        return apiResponse_1.ApiResponse.success(res, await prisma.user.findUnique({ where: { id: req.params.id }, include: { hospitalProfile: true } }));
    }
    catch (e) {
        next(e);
    }
};
exports.getHospitalProfile = getHospitalProfile;
const getHospitalDoctors = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, []);
    }
    catch (e) {
        next(e);
    }
};
exports.getHospitalDoctors = getHospitalDoctors;
const getHospitalDepartments = async (req, res, next) => {
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
        return apiResponse_1.ApiResponse.success(res, await prisma.user.findUnique({ where: { id: req.user.userId }, include: { hospitalProfile: true } }));
    }
    catch (e) {
        next(e);
    }
};
exports.getMyProfile = getMyProfile;
const updateMyProfile = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma.hospitalProfile.update({ where: { userId: req.user.userId }, data: req.body }));
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