import { Router } from 'express';
import multer from 'multer';
import * as PatientController from '../controllers/patient.controller';
import * as HealthScoreController from '../controllers/healthScore.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router  = Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB max
const patient = [authenticate, requireRole('PATIENT')];

// OVERVIEW
router.get('/patient/dashboard',             ...patient, PatientController.getDashboardOverview);

// PROFILE
router.get('/patient/profile',               ...patient, PatientController.getProfile);
router.put('/patient/profile',               ...patient, PatientController.updateProfile);
router.get('/patient/profile/emergency-contacts',                   ...patient, PatientController.getEmergencyContacts);
router.post('/patient/profile/emergency-contacts',                  ...patient, PatientController.addEmergencyContact);
router.put('/patient/profile/emergency-contacts/:contactId',        ...patient, PatientController.updateEmergencyContact);
router.delete('/patient/profile/emergency-contacts/:contactId',     ...patient, PatientController.deleteEmergencyContact);

// MEDICAL HISTORY
router.get('/patient/medical-history',       ...patient, PatientController.getMedicalHistory);
router.post('/patient/conditions',                        ...patient, PatientController.addCondition);
router.put('/patient/conditions/:conditionId',            ...patient, PatientController.updateCondition);
router.delete('/patient/conditions/:conditionId',         ...patient, PatientController.deleteCondition);
router.post('/patient/allergies',                         ...patient, PatientController.addAllergy);
router.put('/patient/allergies/:allergyId',               ...patient, PatientController.updateAllergy);
router.delete('/patient/allergies/:allergyId',            ...patient, PatientController.deleteAllergy);
router.post('/patient/surgeries',                         ...patient, PatientController.addSurgery);
router.delete('/patient/surgeries/:surgeryId',            ...patient, PatientController.deleteSurgery);
router.post('/patient/vaccinations',                      ...patient, PatientController.addVaccination);
router.delete('/patient/vaccinations/:vaccinationId',     ...patient, PatientController.deleteVaccination);
router.post('/patient/family-history',                    ...patient, PatientController.addFamilyHistory);
router.delete('/patient/family-history/:historyId',       ...patient, PatientController.deleteFamilyHistory);
router.post('/patient/hospitalization-history',           ...patient, PatientController.addHospitalizationHistory);
router.delete('/patient/hospitalization-history/:historyId', ...patient, PatientController.deleteHospitalizationHistory);

// SYMPTOMS
router.get('/patient/symptoms',              ...patient, PatientController.getSymptoms);
router.post('/patient/symptoms',             ...patient, PatientController.logSymptom);
router.put('/patient/symptoms/:symptomId',   ...patient, PatientController.updateSymptom);
router.delete('/patient/symptoms/:symptomId',...patient, PatientController.deleteSymptom);

// VITALS
router.get('/patient/vitals',               ...patient, PatientController.getVitals);
router.post('/patient/vitals',              ...patient, PatientController.logVital);
router.delete('/patient/vitals/:vitalId',   ...patient, PatientController.deleteVital);

// MEDICATIONS
router.get('/patient/medications',                              ...patient, PatientController.getMedications);
router.post('/patient/medications',                             ...patient, PatientController.addMedication);
router.put('/patient/medications/:medicationId',                ...patient, PatientController.updateMedication);
router.delete('/patient/medications/:medicationId',             ...patient, PatientController.deleteMedication);
router.post('/patient/medications/:medicationId/log',           ...patient, PatientController.logMedicationDose);
router.get('/patient/medications/:medicationId/logs',           ...patient, PatientController.getMedicationLogs);
router.get('/patient/therapies',                      ...patient, PatientController.getTherapies);
router.post('/patient/therapies',                     ...patient, PatientController.addTherapy);
router.delete('/patient/therapies/:therapyId',        ...patient, PatientController.deleteTherapy);

// REPORTS VAULT
router.get('/patient/reports',                               ...patient, PatientController.getReports);
router.post('/patient/reports',                              ...patient, upload.single('file'), PatientController.uploadReport);
router.delete('/patient/reports/:reportId',                  ...patient, PatientController.deleteReport);
router.post('/patient/reports/:reportId/share',              ...patient, PatientController.shareReport);
router.delete('/patient/reports/:reportId/share/:doctorId',  ...patient, PatientController.revokeReportShare);

// HEALTH STATUS INDEX v1 — canonical source of truth
router.get('/patient/health-score',          ...patient, HealthScoreController.current);
router.post('/patient/health-score/refresh', ...patient, HealthScoreController.refresh);
router.get('/patient/health-score/history',  ...patient, HealthScoreController.history);

// CONSENTS
router.get('/patient/consents',               ...patient, PatientController.getConsents);
router.post('/patient/consents',              ...patient, PatientController.grantConsent);
router.delete('/patient/consents/:consentId', ...patient, PatientController.revokeConsent);

// SETTINGS
router.get('/patient/settings',              ...patient, PatientController.getSettings);
router.put('/patient/settings',              ...patient, PatientController.updateSettings);

export default router;
