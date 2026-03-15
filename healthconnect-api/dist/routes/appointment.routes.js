"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointmentController = __importStar(require("../controllers/appointment.controller"));
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const appointment_validator_1 = require("../validators/appointment.validator");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// ── Patient: list own appointments ─────────────────────────────────────────
router.get('/', appointmentController.listAppointments);
// ── Book ───────────────────────────────────────────────────────────────────
router.post('/', (0, validate_1.validate)(appointment_validator_1.bookAppointmentSchema), appointmentController.bookAppointment);
// ── Single appointment ─────────────────────────────────────────────────────
router.get('/:id', appointmentController.getAppointment);
// ── Reschedule / Cancel / Status ───────────────────────────────────────────
router.put('/:id/reschedule', (0, validate_1.validate)(appointment_validator_1.rescheduleAppointmentSchema), appointmentController.rescheduleAppointment);
router.put('/:id/cancel', (0, validate_1.validate)(appointment_validator_1.cancelAppointmentSchema), appointmentController.cancelAppointment);
router.put('/:id/status', (0, validate_1.validate)(appointment_validator_1.updateAppointmentStatusSchema), appointmentController.updateAppointmentStatus);
// Alias PATCH → PUT for cancel/reschedule (frontend may use either)
router.patch('/:id/cancel', (0, validate_1.validate)(appointment_validator_1.cancelAppointmentSchema), appointmentController.cancelAppointment);
router.patch('/:id/reschedule', (0, validate_1.validate)(appointment_validator_1.rescheduleAppointmentSchema), appointmentController.rescheduleAppointment);
exports.default = router;
//# sourceMappingURL=appointment.routes.js.map