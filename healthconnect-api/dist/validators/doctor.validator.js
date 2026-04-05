"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilitySlotSchema = exports.doctorProfileSchema = exports.doctorSearchSchema = void 0;
const zod_1 = require("zod");
exports.doctorSearchSchema = zod_1.z.object({
    specialization: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    pinCode: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    minRating: zod_1.z.string().optional(),
    maxFee: zod_1.z.string().optional(),
    available: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
exports.doctorProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    phone: zod_1.z.string().optional(),
    specialization: zod_1.z.string().optional(),
    subSpecializations: zod_1.z.array(zod_1.z.string()).optional(),
    qualification: zod_1.z.array(zod_1.z.string()).optional(),
    experienceYears: zod_1.z.number().int().positive().optional(),
    consultationFee: zod_1.z.number().positive().optional(),
    teleconsultFee: zod_1.z.number().positive().optional(),
    languagesSpoken: zod_1.z.array(zod_1.z.string()).optional(),
    clinicName: zod_1.z.string().optional(),
    clinicAddress: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    pinCode: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
});
exports.availabilitySlotSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().int().min(0).max(6),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    slotDuration: zod_1.z.number().int().min(15).max(120).optional(),
});
//# sourceMappingURL=doctor.validator.js.map