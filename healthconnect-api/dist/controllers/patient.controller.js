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
exports.updateSettings = exports.getSettings = exports.revokeConsent = exports.grantConsent = exports.getConsents = exports.refreshHealthScore = exports.getHealthScore = exports.revokeReportShare = exports.shareReport = exports.deleteReport = exports.uploadReport = exports.getReports = exports.deleteTherapy = exports.addTherapy = exports.getTherapies = exports.getMedicationLogs = exports.logMedicationDose = exports.deleteMedication = exports.updateMedication = exports.addMedication = exports.getMedications = exports.deleteVital = exports.logVital = exports.getVitals = exports.deleteSymptom = exports.updateSymptom = exports.logSymptom = exports.getSymptoms = exports.deleteHospitalizationHistory = exports.addHospitalizationHistory = exports.deleteFamilyHistory = exports.addFamilyHistory = exports.deleteVaccination = exports.addVaccination = exports.deleteSurgery = exports.addSurgery = exports.deleteAllergy = exports.updateAllergy = exports.addAllergy = exports.deleteCondition = exports.updateCondition = exports.addCondition = exports.getMedicalHistory = exports.deleteEmergencyContact = exports.updateEmergencyContact = exports.addEmergencyContact = exports.getEmergencyContacts = exports.updateProfile = exports.getProfile = exports.getDashboardOverview = void 0;
const PatientService = __importStar(require("../services/patient.service"));
const apiResponse_1 = require("../utils/apiResponse");
const uid = (req) => req.user.userId;
// ============================================================
// OVERVIEW
// ============================================================
const getDashboardOverview = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getDashboardOverview(uid(req)));
    }
    catch (e) {
        next(e);
    }
};
exports.getDashboardOverview = getDashboardOverview;
// ============================================================
// PROFILE
// ============================================================
const getProfile = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getProfile(uid(req)));
    }
    catch (e) {
        next(e);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.updateProfile(uid(req), req.body), 'Profile updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateProfile = updateProfile;
// ── Emergency Contacts ─────────────────────────────────────────
const getEmergencyContacts = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getEmergencyContacts(uid(req)));
    }
    catch (e) {
        next(e);
    }
};
exports.getEmergencyContacts = getEmergencyContacts;
const addEmergencyContact = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addEmergencyContact(uid(req), req.body), 'Emergency contact added');
    }
    catch (e) {
        next(e);
    }
};
exports.addEmergencyContact = addEmergencyContact;
const updateEmergencyContact = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.updateEmergencyContact(uid(req), req.params.contactId, req.body), 'Contact updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateEmergencyContact = updateEmergencyContact;
const deleteEmergencyContact = async (req, res, next) => {
    try {
        await PatientService.deleteEmergencyContact(uid(req), req.params.contactId);
        return apiResponse_1.ApiResponse.success(res, null, 'Contact deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteEmergencyContact = deleteEmergencyContact;
// ============================================================
// MEDICAL HISTORY
// ============================================================
const getMedicalHistory = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getMedicalHistory(uid(req)));
    }
    catch (e) {
        next(e);
    }
};
exports.getMedicalHistory = getMedicalHistory;
// ── Conditions ─────────────────────────────────────────────────
const addCondition = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addCondition(uid(req), req.body), 'Condition added');
    }
    catch (e) {
        next(e);
    }
};
exports.addCondition = addCondition;
const updateCondition = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.updateCondition(uid(req), req.params.conditionId, req.body), 'Condition updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateCondition = updateCondition;
const deleteCondition = async (req, res, next) => {
    try {
        await PatientService.deleteCondition(uid(req), req.params.conditionId);
        return apiResponse_1.ApiResponse.success(res, null, 'Condition deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteCondition = deleteCondition;
// ── Allergies ──────────────────────────────────────────────────
const addAllergy = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addAllergy(uid(req), req.body), 'Allergy added');
    }
    catch (e) {
        next(e);
    }
};
exports.addAllergy = addAllergy;
const updateAllergy = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.updateAllergy(uid(req), req.params.allergyId, req.body), 'Allergy updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateAllergy = updateAllergy;
const deleteAllergy = async (req, res, next) => {
    try {
        await PatientService.deleteAllergy(uid(req), req.params.allergyId);
        return apiResponse_1.ApiResponse.success(res, null, 'Allergy deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteAllergy = deleteAllergy;
// ── Surgeries ──────────────────────────────────────────────────
const addSurgery = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addSurgery(uid(req), req.body), 'Surgery record added');
    }
    catch (e) {
        next(e);
    }
};
exports.addSurgery = addSurgery;
const deleteSurgery = async (req, res, next) => {
    try {
        await PatientService.deleteSurgery(uid(req), req.params.surgeryId);
        return apiResponse_1.ApiResponse.success(res, null, 'Surgery record deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteSurgery = deleteSurgery;
// ── Vaccinations ───────────────────────────────────────────────
const addVaccination = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addVaccination(uid(req), req.body), 'Vaccination added');
    }
    catch (e) {
        next(e);
    }
};
exports.addVaccination = addVaccination;
const deleteVaccination = async (req, res, next) => {
    try {
        await PatientService.deleteVaccination(uid(req), req.params.vaccinationId);
        return apiResponse_1.ApiResponse.success(res, null, 'Vaccination deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteVaccination = deleteVaccination;
// ── Family History ─────────────────────────────────────────────
const addFamilyHistory = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addFamilyHistory(uid(req), req.body), 'Family history added');
    }
    catch (e) {
        next(e);
    }
};
exports.addFamilyHistory = addFamilyHistory;
const deleteFamilyHistory = async (req, res, next) => {
    try {
        await PatientService.deleteFamilyHistory(uid(req), req.params.historyId);
        return apiResponse_1.ApiResponse.success(res, null, 'Family history deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteFamilyHistory = deleteFamilyHistory;
// ── Hospitalization History ────────────────────────────────────
const addHospitalizationHistory = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addHospitalizationHistory(uid(req), req.body), 'Hospitalization record added');
    }
    catch (e) {
        next(e);
    }
};
exports.addHospitalizationHistory = addHospitalizationHistory;
const deleteHospitalizationHistory = async (req, res, next) => {
    try {
        await PatientService.deleteHospitalizationHistory(uid(req), req.params.historyId);
        return apiResponse_1.ApiResponse.success(res, null, 'Hospitalization record deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteHospitalizationHistory = deleteHospitalizationHistory;
// ============================================================
// SYMPTOMS TRACKER
// ============================================================
const getSymptoms = async (req, res, next) => {
    try {
        const { page, limit, from, to, search } = req.query;
        return apiResponse_1.ApiResponse.success(res, await PatientService.getSymptoms(uid(req), {
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            from: from,
            to: to,
            search: search,
        }));
    }
    catch (e) {
        next(e);
    }
};
exports.getSymptoms = getSymptoms;
const logSymptom = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.logSymptom(uid(req), req.body), 'Symptom logged');
    }
    catch (e) {
        next(e);
    }
};
exports.logSymptom = logSymptom;
const updateSymptom = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.updateSymptom(uid(req), req.params.symptomId, req.body), 'Symptom updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateSymptom = updateSymptom;
const deleteSymptom = async (req, res, next) => {
    try {
        await PatientService.deleteSymptom(uid(req), req.params.symptomId);
        return apiResponse_1.ApiResponse.success(res, null, 'Symptom log deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteSymptom = deleteSymptom;
// ============================================================
// VITALS
// ============================================================
const getVitals = async (req, res, next) => {
    try {
        const { type, from, to, limit } = req.query;
        return apiResponse_1.ApiResponse.success(res, await PatientService.getVitals(uid(req), {
            type: type,
            from: from,
            to: to,
            limit: Number(limit) || 50,
        }));
    }
    catch (e) {
        next(e);
    }
};
exports.getVitals = getVitals;
const logVital = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.logVital(uid(req), req.body), 'Vital logged');
    }
    catch (e) {
        next(e);
    }
};
exports.logVital = logVital;
const deleteVital = async (req, res, next) => {
    try {
        await PatientService.deleteVital(uid(req), req.params.vitalId);
        return apiResponse_1.ApiResponse.success(res, null, 'Vital deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteVital = deleteVital;
// ============================================================
// MEDICATIONS (Treatments Tab)
// ============================================================
const getMedications = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getMedications(uid(req), { status: req.query.status }));
    }
    catch (e) {
        next(e);
    }
};
exports.getMedications = getMedications;
const addMedication = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addMedication(uid(req), req.body), 'Medication added');
    }
    catch (e) {
        next(e);
    }
};
exports.addMedication = addMedication;
const updateMedication = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.updateMedication(uid(req), req.params.medicationId, req.body), 'Medication updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateMedication = updateMedication;
const deleteMedication = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.deleteMedication(uid(req), req.params.medicationId), 'Medication discontinued');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteMedication = deleteMedication;
const logMedicationDose = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.logMedicationDose(uid(req), req.params.medicationId, req.body), 'Dose logged');
    }
    catch (e) {
        next(e);
    }
};
exports.logMedicationDose = logMedicationDose;
const getMedicationLogs = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        return apiResponse_1.ApiResponse.success(res, await PatientService.getMedicationLogs(uid(req), req.params.medicationId, { from: from, to: to }));
    }
    catch (e) {
        next(e);
    }
};
exports.getMedicationLogs = getMedicationLogs;
// ── Therapies ──────────────────────────────────────────────────
const getTherapies = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getTherapies(uid(req)));
    }
    catch (e) {
        next(e);
    }
};
exports.getTherapies = getTherapies;
const addTherapy = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.addTherapy(uid(req), req.body), 'Therapy added');
    }
    catch (e) {
        next(e);
    }
};
exports.addTherapy = addTherapy;
const deleteTherapy = async (req, res, next) => {
    try {
        await PatientService.deleteTherapy(uid(req), req.params.therapyId);
        return apiResponse_1.ApiResponse.success(res, null, 'Therapy deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteTherapy = deleteTherapy;
// ============================================================
// REPORTS VAULT
// ============================================================
const getReports = async (req, res, next) => {
    try {
        const { type, page, limit, search } = req.query;
        return apiResponse_1.ApiResponse.success(res, await PatientService.getReports(uid(req), {
            type: type,
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            search: search,
        }));
    }
    catch (e) {
        next(e);
    }
};
exports.getReports = getReports;
const uploadReport = async (req, res, next) => {
    try {
        if (!req.file)
            throw { statusCode: 400, errorCode: 'NO_FILE', message: 'No file uploaded' };
        return apiResponse_1.ApiResponse.created(res, await PatientService.uploadReport(uid(req), req.file, req.body), 'Report uploaded');
    }
    catch (e) {
        next(e);
    }
};
exports.uploadReport = uploadReport;
const deleteReport = async (req, res, next) => {
    try {
        await PatientService.deleteReport(uid(req), req.params.reportId);
        return apiResponse_1.ApiResponse.success(res, null, 'Report deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteReport = deleteReport;
const shareReport = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.shareReport(uid(req), req.params.reportId, req.body), 'Report shared');
    }
    catch (e) {
        next(e);
    }
};
exports.shareReport = shareReport;
const revokeReportShare = async (req, res, next) => {
    try {
        await PatientService.revokeReportShare(uid(req), req.params.reportId, req.params.doctorId);
        return apiResponse_1.ApiResponse.success(res, null, 'Share revoked');
    }
    catch (e) {
        next(e);
    }
};
exports.revokeReportShare = revokeReportShare;
// ============================================================
// HEALTH SCORE
// ============================================================
const getHealthScore = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getHealthScoreHistory(uid(req)));
    }
    catch (e) {
        next(e);
    }
};
exports.getHealthScore = getHealthScore;
const refreshHealthScore = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.refreshHealthScore(uid(req)), 'Health score recalculated');
    }
    catch (e) {
        next(e);
    }
};
exports.refreshHealthScore = refreshHealthScore;
// ============================================================
// CONSENTS
// ============================================================
const getConsents = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getConsents(uid(req)));
    }
    catch (e) {
        next(e);
    }
};
exports.getConsents = getConsents;
const grantConsent = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.created(res, await PatientService.grantConsent(uid(req), req.body), 'Consent granted');
    }
    catch (e) {
        next(e);
    }
};
exports.grantConsent = grantConsent;
const revokeConsent = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.revokeConsent(uid(req), req.params.consentId), 'Consent revoked');
    }
    catch (e) {
        next(e);
    }
};
exports.revokeConsent = revokeConsent;
// ============================================================
// SETTINGS
// ============================================================
const getSettings = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.getSettings(uid(req)));
    }
    catch (e) {
        next(e);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await PatientService.updateSettings(uid(req), req.body), 'Settings updated');
    }
    catch (e) {
        next(e);
    }
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=patient.controller.js.map