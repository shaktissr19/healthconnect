"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentStatusSchema = exports.cancelAppointmentSchema = exports.rescheduleAppointmentSchema = exports.bookAppointmentSchema = void 0;
const zod_1 = require("zod");
exports.bookAppointmentSchema = zod_1.z.object({
    doctorId: zod_1.z.string().uuid(),
    hospitalId: zod_1.z.string().uuid().optional(),
    scheduledAt: zod_1.z.string().datetime(),
    type: zod_1.z.enum(['IN_PERSON', 'TELECONSULT', 'HOME_VISIT']),
    reasonForVisit: zod_1.z.string().optional(),
    symptoms: zod_1.z.array(zod_1.z.string()).optional(),
    durationMinutes: zod_1.z.number().int().min(15).max(120).optional(),
});
exports.rescheduleAppointmentSchema = zod_1.z.object({
    scheduledAt: zod_1.z.string().datetime(),
    reason: zod_1.z.string().optional(),
});
// reason is optional — frontend sends 'Patient cancelled' but we don't want to break if it's absent
exports.cancelAppointmentSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
    cancellationReason: zod_1.z.string().optional(),
});
exports.updateAppointmentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'PENDING']),
    doctorNotes: zod_1.z.string().optional(),
    followUpDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=appointment.validator.js.map