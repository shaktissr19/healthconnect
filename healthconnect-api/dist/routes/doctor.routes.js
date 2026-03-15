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
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const D = __importStar(require("../controllers/doctor.controller"));
const R = __importStar(require("../controllers/doctor.records.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, roleGuard_1.requireDoctor);
// ── Existing routes ────────────────────────────────────────────────────────
router.get('/dashboard', D.getDashboard);
router.get('/appointments', D.getAppointments);
router.get('/appointments/today', D.getAppointments);
router.patch('/appointments/:id', D.updateAppointment);
router.put('/appointments/:id', D.updateAppointment);
router.put('/appointments/:id/notes', D.updateAppointment);
router.get('/patients', D.getMyPatients);
router.get('/patients/:id', D.getPatientDetail);
router.post('/patients/:id/notes', R.addPatientNote);
router.get('/prescriptions', D.getPrescriptions);
router.post('/prescriptions', D.createPrescription);
router.get('/earnings', D.getEarnings);
router.get('/profile', D.getDoctorProfile);
router.put('/profile', D.updateDoctorProfile);
router.get('/availability', D.getAvailability);
router.put('/availability', D.updateAvailability);
router.post('/availability', D.updateAvailability);
// ── NEW: Medical records routes ────────────────────────────────────────────
router.get('/records', R.getDoctorRecords);
router.put('/records/:id', R.updateRecord);
router.put('/records/:id/review', R.reviewRecord);
router.post('/records/upload', R.uploadRecord);
exports.default = router;
//# sourceMappingURL=doctor.routes.js.map