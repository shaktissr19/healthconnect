"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeNewsletter = exports.getPlatformStats = void 0;
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const prisma = new client_1.PrismaClient();
const getPlatformStats = async (_req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalUsers, totalDoctors, totalHospitals, consultationsToday] = await Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.user.count({ where: { role: 'DOCTOR', isActive: true } }),
            prisma.user.count({ where: { role: 'HOSPITAL', isActive: true } }),
            prisma.appointment.count({ where: { createdAt: { gte: today } } }),
        ]);
        return apiResponse_1.ApiResponse.success(res, {
            totalUsers,
            totalDoctors,
            totalHospitals,
            consultationsToday,
            uptimePercent: 99.9,
        });
    }
    catch (e) {
        next(e);
    }
};
exports.getPlatformStats = getPlatformStats;
const subscribeNewsletter = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@'))
            return apiResponse_1.ApiResponse.error(res, 'INVALID_INPUT', 'Valid email required', 400);
        await prisma.newsletterSubscription.upsert({
            where: { email },
            create: { email, isActive: true },
            update: { isActive: true },
        });
        return apiResponse_1.ApiResponse.success(res, null, 'Subscribed successfully!');
    }
    catch (e) {
        next(e);
    }
};
exports.subscribeNewsletter = subscribeNewsletter;
//# sourceMappingURL=platform.controller.js.map