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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const PatientController = __importStar(require("../controllers/patient.controller"));
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB max
const patient = [auth_1.authenticate, (0, roleGuard_1.requireRole)('PATIENT')];
// ============================================================
// OVERVIEW
// GET /patient/dashboard
// ============================================================
router.get('/patient/dashboard', ...patient, PatientController.getDashboardOverview);
// ============================================================
// PROFILE
// GET    /patient/profile
// PUT    /patient/profile
// ============================================================
router.get('/patient/profile', ...patient, PatientController.getProfile);
router.put('/patient/profile', ...patient, PatientController.updateProfile);
// ── Emergency Contacts ──────────────────────────────────────────────
// GET    /patient/profile/emergency-contacts
// POST   /patient/profile/emergency-contacts
// PUT    /patient/profile/emergency-contacts/:contactId
// DELETE /patient/profile/emergency-contacts/:contactId
router.get('/patient/profile/emergency-contacts', ...patient, PatientController.getEmergencyContacts);
router.post('/patient/profile/emergency-contacts', ...patient, PatientController.addEmergencyContact);
router.put('/patient/profile/emergency-contacts/:contactId', ...patient, PatientController.updateEmergencyContact);
router.delete('/patient/profile/emergency-contacts/:contactId', ...patient, PatientController.deleteEmergencyContact);
// ============================================================
// MEDICAL HISTORY (full — all sub-tables)
// GET  /patient/medical-history
// ============================================================
router.get('/patient/medical-history', ...patient, PatientController.getMedicalHistory);
// ── Conditions ─────────────────────────────────────────────────────
// POST   /patient/conditions
// PUT    /patient/conditions/:conditionId
// DELETE /patient/conditions/:conditionId
router.post('/patient/conditions', ...patient, PatientController.addCondition);
router.put('/patient/conditions/:conditionId', ...patient, PatientController.updateCondition);
router.delete('/patient/conditions/:conditionId', ...patient, PatientController.deleteCondition);
// ── Allergies ──────────────────────────────────────────────────────
// POST   /patient/allergies
// PUT    /patient/allergies/:allergyId
// DELETE /patient/allergies/:allergyId
router.post('/patient/allergies', ...patient, PatientController.addAllergy);
router.put('/patient/allergies/:allergyId', ...patient, PatientController.updateAllergy);
router.delete('/patient/allergies/:allergyId', ...patient, PatientController.deleteAllergy);
// ── Surgeries ──────────────────────────────────────────────────────
// POST   /patient/surgeries
// DELETE /patient/surgeries/:surgeryId
router.post('/patient/surgeries', ...patient, PatientController.addSurgery);
router.delete('/patient/surgeries/:surgeryId', ...patient, PatientController.deleteSurgery);
// ── Vaccinations ───────────────────────────────────────────────────
// POST   /patient/vaccinations
// DELETE /patient/vaccinations/:vaccinationId
router.post('/patient/vaccinations', ...patient, PatientController.addVaccination);
router.delete('/patient/vaccinations/:vaccinationId', ...patient, PatientController.deleteVaccination);
// ── Family History ─────────────────────────────────────────────────
// POST   /patient/family-history
// DELETE /patient/family-history/:historyId
router.post('/patient/family-history', ...patient, PatientController.addFamilyHistory);
router.delete('/patient/family-history/:historyId', ...patient, PatientController.deleteFamilyHistory);
// ── Hospitalization History ────────────────────────────────────────
// POST   /patient/hospitalization-history
// DELETE /patient/hospitalization-history/:historyId
router.post('/patient/hospitalization-history', ...patient, PatientController.addHospitalizationHistory);
router.delete('/patient/hospitalization-history/:historyId', ...patient, PatientController.deleteHospitalizationHistory);
// ============================================================
// SYMPTOMS TRACKER
// GET    /patient/symptoms?page&limit&from&to&search
// POST   /patient/symptoms
// PUT    /patient/symptoms/:symptomId
// DELETE /patient/symptoms/:symptomId
// ============================================================
router.get('/patient/symptoms', ...patient, PatientController.getSymptoms);
router.post('/patient/symptoms', ...patient, PatientController.logSymptom);
router.put('/patient/symptoms/:symptomId', ...patient, PatientController.updateSymptom);
router.delete('/patient/symptoms/:symptomId', ...patient, PatientController.deleteSymptom);
// ============================================================
// VITALS
// GET    /patient/vitals?type&from&to&limit
// POST   /patient/vitals
// DELETE /patient/vitals/:vitalId
// ============================================================
router.get('/patient/vitals', ...patient, PatientController.getVitals);
router.post('/patient/vitals', ...patient, PatientController.logVital);
router.delete('/patient/vitals/:vitalId', ...patient, PatientController.deleteVital);
// ============================================================
// MEDICATIONS (Treatments Tab)
// GET    /patient/medications?status
// POST   /patient/medications
// PUT    /patient/medications/:medicationId
// DELETE /patient/medications/:medicationId    (soft — marks DISCONTINUED)
// POST   /patient/medications/:medicationId/log
// GET    /patient/medications/:medicationId/logs?from&to
// ============================================================
router.get('/patient/medications', ...patient, PatientController.getMedications);
router.post('/patient/medications', ...patient, PatientController.addMedication);
router.put('/patient/medications/:medicationId', ...patient, PatientController.updateMedication);
router.delete('/patient/medications/:medicationId', ...patient, PatientController.deleteMedication);
router.post('/patient/medications/:medicationId/log', ...patient, PatientController.logMedicationDose);
router.get('/patient/medications/:medicationId/logs', ...patient, PatientController.getMedicationLogs);
// ── Therapies ──────────────────────────────────────────────────────
// GET    /patient/therapies
// POST   /patient/therapies
// DELETE /patient/therapies/:therapyId
router.get('/patient/therapies', ...patient, PatientController.getTherapies);
router.post('/patient/therapies', ...patient, PatientController.addTherapy);
router.delete('/patient/therapies/:therapyId', ...patient, PatientController.deleteTherapy);
// ============================================================
// REPORTS VAULT
// GET    /patient/reports?type&page&limit&search
// POST   /patient/reports                          (multipart/form-data)
// DELETE /patient/reports/:reportId
// POST   /patient/reports/:reportId/share
// DELETE /patient/reports/:reportId/share/:doctorId
// ============================================================
router.get('/patient/reports', ...patient, PatientController.getReports);
router.post('/patient/reports', ...patient, upload.single('file'), PatientController.uploadReport);
router.delete('/patient/reports/:reportId', ...patient, PatientController.deleteReport);
router.post('/patient/reports/:reportId/share', ...patient, PatientController.shareReport);
router.delete('/patient/reports/:reportId/share/:doctorId', ...patient, PatientController.revokeReportShare);
// ============================================================
// HEALTH SCORE
// GET  /patient/health-score          (get current + components)
// POST /patient/health-score/refresh  (recalculate now)
// ============================================================
router.get('/patient/health-score', ...patient, PatientController.getHealthScore);
router.post('/patient/health-score/refresh', ...patient, PatientController.refreshHealthScore);
// ============================================================
// CONSENTS (Doctor access management)
// GET    /patient/consents
// POST   /patient/consents
// DELETE /patient/consents/:consentId
// ============================================================
router.get('/patient/consents', ...patient, PatientController.getConsents);
router.post('/patient/consents', ...patient, PatientController.grantConsent);
router.delete('/patient/consents/:consentId', ...patient, PatientController.revokeConsent);
// ============================================================
// SETTINGS
// GET  /patient/settings
// PUT  /patient/settings
// ============================================================
router.get('/patient/settings', ...patient, PatientController.getSettings);
router.put('/patient/settings', ...patient, PatientController.updateSettings);
exports.default = router;
//# sourceMappingURL=patient.routes.js.map