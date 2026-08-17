import { Router } from 'express';
import multer from 'multer';
import * as PatientController from './controller';
import * as TherapyController from './therapy.controller';
import * as HealthScoreController from '../health-score/controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import {
  allergySchema,
  conditionSchema,
  emergencyContactSchema,
  familyHistorySchema,
  hospitalizationSchema,
  settingsSchema,
  surgerySchema,
  updateAllergySchema,
  updateConditionSchema,
  updateEmergencyContactSchema,
  updateFamilyHistorySchema,
  updateHospitalizationSchema,
  updateProfileSchema,
  updateSurgerySchema,
  updateVaccinationSchema,
  vaccinationSchema,
} from './validator';
import {
  consentGrantSchema,
  medicationCreateSchema,
  medicationDoseSchema,
  medicationUpdateSchema,
  reportShareSchema,
  reportUploadSchema,
  symptomCreateSchema,
  symptomUpdateSchema,
  therapyCreateSchema,
  therapyUpdateSchema,
  vitalCreateSchema,
} from './completion.validator';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const patient = [authenticate, requireRole('PATIENT')];

router.get('/patient/dashboard', ...patient, PatientController.getDashboardOverview);

router.get('/patient/profile', ...patient, PatientController.getProfile);
router.put('/patient/profile', ...patient, validate(updateProfileSchema), PatientController.updateProfile);
router.get('/patient/profile/emergency-contacts', ...patient, PatientController.getEmergencyContacts);
router.post('/patient/profile/emergency-contacts', ...patient, validate(emergencyContactSchema), PatientController.addEmergencyContact);
router.put('/patient/profile/emergency-contacts/:contactId', ...patient, validate(updateEmergencyContactSchema), PatientController.updateEmergencyContact);
router.delete('/patient/profile/emergency-contacts/:contactId', ...patient, PatientController.deleteEmergencyContact);

router.get('/patient/medical-history', ...patient, PatientController.getMedicalHistory);
router.post('/patient/conditions', ...patient, validate(conditionSchema), PatientController.addCondition);
router.put('/patient/conditions/:conditionId', ...patient, validate(updateConditionSchema), PatientController.updateCondition);
router.delete('/patient/conditions/:conditionId', ...patient, PatientController.deleteCondition);
router.post('/patient/allergies', ...patient, validate(allergySchema), PatientController.addAllergy);
router.put('/patient/allergies/:allergyId', ...patient, validate(updateAllergySchema), PatientController.updateAllergy);
router.delete('/patient/allergies/:allergyId', ...patient, PatientController.deleteAllergy);
router.post('/patient/surgeries', ...patient, validate(surgerySchema), PatientController.addSurgery);
router.put('/patient/surgeries/:surgeryId', ...patient, validate(updateSurgerySchema), PatientController.updateSurgery);
router.delete('/patient/surgeries/:surgeryId', ...patient, PatientController.deleteSurgery);
router.post('/patient/vaccinations', ...patient, validate(vaccinationSchema), PatientController.addVaccination);
router.put('/patient/vaccinations/:vaccinationId', ...patient, validate(updateVaccinationSchema), PatientController.updateVaccination);
router.delete('/patient/vaccinations/:vaccinationId', ...patient, PatientController.deleteVaccination);
router.post('/patient/family-history', ...patient, validate(familyHistorySchema), PatientController.addFamilyHistory);
router.put('/patient/family-history/:historyId', ...patient, validate(updateFamilyHistorySchema), PatientController.updateFamilyHistory);
router.delete('/patient/family-history/:historyId', ...patient, PatientController.deleteFamilyHistory);
router.post('/patient/hospitalization-history', ...patient, validate(hospitalizationSchema), PatientController.addHospitalizationHistory);
router.put('/patient/hospitalization-history/:historyId', ...patient, validate(updateHospitalizationSchema), PatientController.updateHospitalizationHistory);
router.delete('/patient/hospitalization-history/:historyId', ...patient, PatientController.deleteHospitalizationHistory);
router.post('/patient/hospitalizations', ...patient, validate(hospitalizationSchema), PatientController.addHospitalizationHistory);
router.put('/patient/hospitalizations/:historyId', ...patient, validate(updateHospitalizationSchema), PatientController.updateHospitalizationHistory);
router.delete('/patient/hospitalizations/:historyId', ...patient, PatientController.deleteHospitalizationHistory);

router.get('/patient/symptoms', ...patient, PatientController.getSymptoms);
router.post('/patient/symptoms', ...patient, validate(symptomCreateSchema), PatientController.logSymptom);
router.put('/patient/symptoms/:symptomId', ...patient, validate(symptomUpdateSchema), PatientController.updateSymptom);
router.delete('/patient/symptoms/:symptomId', ...patient, PatientController.deleteSymptom);

router.get('/patient/vitals', ...patient, PatientController.getVitals);
router.post('/patient/vitals', ...patient, validate(vitalCreateSchema), PatientController.logVital);
router.delete('/patient/vitals/:vitalId', ...patient, PatientController.deleteVital);

router.get('/patient/medications', ...patient, PatientController.getMedications);
router.post('/patient/medications', ...patient, validate(medicationCreateSchema), PatientController.addMedication);
router.put('/patient/medications/:medicationId', ...patient, validate(medicationUpdateSchema), PatientController.updateMedication);
router.delete('/patient/medications/:medicationId', ...patient, PatientController.deleteMedication);
router.post('/patient/medications/:medicationId/log', ...patient, validate(medicationDoseSchema), PatientController.logMedicationDose);
router.get('/patient/medications/:medicationId/logs', ...patient, PatientController.getMedicationLogs);

router.get('/patient/therapies', ...patient, PatientController.getTherapies);
router.post('/patient/therapies', ...patient, validate(therapyCreateSchema), PatientController.addTherapy);
router.put('/patient/therapies/:therapyId', ...patient, validate(therapyUpdateSchema), TherapyController.updateTherapy);
router.delete('/patient/therapies/:therapyId', ...patient, PatientController.deleteTherapy);

router.get('/patient/reports', ...patient, PatientController.getReports);
router.post('/patient/reports', ...patient, upload.single('file'), validate(reportUploadSchema), PatientController.uploadReport);
router.delete('/patient/reports/:reportId', ...patient, PatientController.deleteReport);
router.post('/patient/reports/:reportId/share', ...patient, validate(reportShareSchema), PatientController.shareReport);
router.delete('/patient/reports/:reportId/share/:doctorId', ...patient, PatientController.revokeReportShare);

router.get('/patient/health-score', ...patient, HealthScoreController.current);
router.post('/patient/health-score/refresh', ...patient, HealthScoreController.refresh);
router.get('/patient/health-score/history', ...patient, HealthScoreController.history);
router.get('/patient/health-score/lifestyle', ...patient, HealthScoreController.getLifestyle);
router.put('/patient/health-score/lifestyle', ...patient, HealthScoreController.updateLifestyle);

router.get('/patient/consents', ...patient, PatientController.getConsents);
router.post('/patient/consents', ...patient, validate(consentGrantSchema), PatientController.grantConsent);
router.delete('/patient/consents/:consentId', ...patient, PatientController.revokeConsent);

router.get('/patient/settings', ...patient, PatientController.getSettings);
router.put('/patient/settings', ...patient, validate(settingsSchema), PatientController.updateSettings);

export default router;
