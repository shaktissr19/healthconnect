import { Request, Response, NextFunction } from 'express';
import * as PatientService from '../services/patient.service';
import { ApiResponse } from '../utils/apiResponse';

const uid = (req: Request) => req.user!.userId;

// ============================================================
// OVERVIEW
// ============================================================

export const getDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getDashboardOverview(uid(req))); } catch (e) { next(e); }
};

// ============================================================
// PROFILE
// ============================================================

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getProfile(uid(req))); } catch (e) { next(e); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.updateProfile(uid(req), req.body), 'Profile updated'); } catch (e) { next(e); }
};

// ── Emergency Contacts ─────────────────────────────────────────
export const getEmergencyContacts = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getEmergencyContacts(uid(req))); } catch (e) { next(e); }
};

export const addEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addEmergencyContact(uid(req), req.body), 'Emergency contact added'); } catch (e) { next(e); }
};

export const updateEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.updateEmergencyContact(uid(req), req.params.contactId, req.body), 'Contact updated'); } catch (e) { next(e); }
};

export const deleteEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteEmergencyContact(uid(req), req.params.contactId); return ApiResponse.success(res, null, 'Contact deleted'); } catch (e) { next(e); }
};

// ============================================================
// MEDICAL HISTORY
// ============================================================

export const getMedicalHistory = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getMedicalHistory(uid(req))); } catch (e) { next(e); }
};

// ── Conditions ─────────────────────────────────────────────────
export const addCondition = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addCondition(uid(req), req.body), 'Condition added'); } catch (e) { next(e); }
};

export const updateCondition = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.updateCondition(uid(req), req.params.conditionId, req.body), 'Condition updated'); } catch (e) { next(e); }
};

export const deleteCondition = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteCondition(uid(req), req.params.conditionId); return ApiResponse.success(res, null, 'Condition deleted'); } catch (e) { next(e); }
};

// ── Allergies ──────────────────────────────────────────────────
export const addAllergy = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addAllergy(uid(req), req.body), 'Allergy added'); } catch (e) { next(e); }
};

export const updateAllergy = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.updateAllergy(uid(req), req.params.allergyId, req.body), 'Allergy updated'); } catch (e) { next(e); }
};

export const deleteAllergy = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteAllergy(uid(req), req.params.allergyId); return ApiResponse.success(res, null, 'Allergy deleted'); } catch (e) { next(e); }
};

// ── Surgeries ──────────────────────────────────────────────────
export const addSurgery = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addSurgery(uid(req), req.body), 'Surgery record added'); } catch (e) { next(e); }
};

export const deleteSurgery = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteSurgery(uid(req), req.params.surgeryId); return ApiResponse.success(res, null, 'Surgery record deleted'); } catch (e) { next(e); }
};

// ── Vaccinations ───────────────────────────────────────────────
export const addVaccination = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addVaccination(uid(req), req.body), 'Vaccination added'); } catch (e) { next(e); }
};

export const deleteVaccination = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteVaccination(uid(req), req.params.vaccinationId); return ApiResponse.success(res, null, 'Vaccination deleted'); } catch (e) { next(e); }
};

// ── Family History ─────────────────────────────────────────────
export const addFamilyHistory = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addFamilyHistory(uid(req), req.body), 'Family history added'); } catch (e) { next(e); }
};

export const deleteFamilyHistory = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteFamilyHistory(uid(req), req.params.historyId); return ApiResponse.success(res, null, 'Family history deleted'); } catch (e) { next(e); }
};

// ── Hospitalization History ────────────────────────────────────
export const addHospitalizationHistory = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addHospitalizationHistory(uid(req), req.body), 'Hospitalization record added'); } catch (e) { next(e); }
};

export const deleteHospitalizationHistory = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteHospitalizationHistory(uid(req), req.params.historyId); return ApiResponse.success(res, null, 'Hospitalization record deleted'); } catch (e) { next(e); }
};

// ============================================================
// SYMPTOMS TRACKER
// ============================================================

export const getSymptoms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, from, to, search } = req.query;
    return ApiResponse.success(res, await PatientService.getSymptoms(uid(req), {
      page:   Number(page)  || 1,
      limit:  Number(limit) || 20,
      from:   from  as string,
      to:     to    as string,
      search: search as string,
    }));
  } catch (e) { next(e); }
};

export const logSymptom = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.logSymptom(uid(req), req.body), 'Symptom logged'); } catch (e) { next(e); }
};

export const updateSymptom = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.updateSymptom(uid(req), req.params.symptomId, req.body), 'Symptom updated'); } catch (e) { next(e); }
};

export const deleteSymptom = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteSymptom(uid(req), req.params.symptomId); return ApiResponse.success(res, null, 'Symptom log deleted'); } catch (e) { next(e); }
};

// ============================================================
// VITALS
// ============================================================

export const getVitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, from, to, limit } = req.query;
    return ApiResponse.success(res, await PatientService.getVitals(uid(req), {
      type:  type  as string,
      from:  from  as string,
      to:    to    as string,
      limit: Number(limit) || 50,
    }));
  } catch (e) { next(e); }
};

export const logVital = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.logVital(uid(req), req.body), 'Vital logged'); } catch (e) { next(e); }
};

export const deleteVital = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteVital(uid(req), req.params.vitalId); return ApiResponse.success(res, null, 'Vital deleted'); } catch (e) { next(e); }
};

// ============================================================
// MEDICATIONS (Treatments Tab)
// ============================================================

export const getMedications = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getMedications(uid(req), { status: req.query.status as string })); } catch (e) { next(e); }
};

export const addMedication = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addMedication(uid(req), req.body), 'Medication added'); } catch (e) { next(e); }
};

export const updateMedication = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.updateMedication(uid(req), req.params.medicationId, req.body), 'Medication updated'); } catch (e) { next(e); }
};

export const deleteMedication = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.deleteMedication(uid(req), req.params.medicationId), 'Medication discontinued'); } catch (e) { next(e); }
};

export const logMedicationDose = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.logMedicationDose(uid(req), req.params.medicationId, req.body), 'Dose logged'); } catch (e) { next(e); }
};

export const getMedicationLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    return ApiResponse.success(res, await PatientService.getMedicationLogs(uid(req), req.params.medicationId, { from: from as string, to: to as string }));
  } catch (e) { next(e); }
};

// ── Therapies ──────────────────────────────────────────────────
export const getTherapies = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getTherapies(uid(req))); } catch (e) { next(e); }
};

export const addTherapy = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.addTherapy(uid(req), req.body), 'Therapy added'); } catch (e) { next(e); }
};

export const deleteTherapy = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteTherapy(uid(req), req.params.therapyId); return ApiResponse.success(res, null, 'Therapy deleted'); } catch (e) { next(e); }
};

// ============================================================
// REPORTS VAULT
// ============================================================

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, page, limit, search } = req.query;
    return ApiResponse.success(res, await PatientService.getReports(uid(req), {
      type:   type   as string,
      page:   Number(page)  || 1,
      limit:  Number(limit) || 20,
      search: search as string,
    }));
  } catch (e) { next(e); }
};

export const uploadReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw { statusCode: 400, errorCode: 'NO_FILE', message: 'No file uploaded' };
    return ApiResponse.created(res, await PatientService.uploadReport(uid(req), req.file, req.body), 'Report uploaded');
  } catch (e) { next(e); }
};

export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.deleteReport(uid(req), req.params.reportId); return ApiResponse.success(res, null, 'Report deleted'); } catch (e) { next(e); }
};

export const shareReport = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.shareReport(uid(req), req.params.reportId, req.body), 'Report shared'); } catch (e) { next(e); }
};

export const revokeReportShare = async (req: Request, res: Response, next: NextFunction) => {
  try { await PatientService.revokeReportShare(uid(req), req.params.reportId, req.params.doctorId); return ApiResponse.success(res, null, 'Share revoked'); } catch (e) { next(e); }
};

// ============================================================
// HEALTH SCORE
// ============================================================

export const getHealthScore = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getHealthScoreHistory(uid(req))); } catch (e) { next(e); }
};

export const refreshHealthScore = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.refreshHealthScore(uid(req)), 'Health score recalculated'); } catch (e) { next(e); }
};

// ============================================================
// CONSENTS
// ============================================================

export const getConsents = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getConsents(uid(req))); } catch (e) { next(e); }
};

export const grantConsent = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.created(res, await PatientService.grantConsent(uid(req), req.body), 'Consent granted'); } catch (e) { next(e); }
};

export const revokeConsent = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.revokeConsent(uid(req), req.params.consentId), 'Consent revoked'); } catch (e) { next(e); }
};

// ============================================================
// SETTINGS
// ============================================================

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.getSettings(uid(req))); } catch (e) { next(e); }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await PatientService.updateSettings(uid(req), req.body), 'Settings updated'); } catch (e) { next(e); }
};
