"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsSchema = exports.consentSchema = exports.emergencyContactSchema = exports.vitalSchema = exports.medicationLogSchema = exports.medicationSchema = exports.symptomSchema = exports.familyHistorySchema = exports.vaccinationSchema = exports.surgerySchema = exports.allergySchema = exports.conditionSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    dateOfBirth: zod_1.z.string().datetime().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    phone: zod_1.z.string().regex(/^\d{10}$/).optional(),
    bloodGroup: zod_1.z.enum([
        'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
        'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN'
    ]).optional(),
    rhFactor: zod_1.z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']).optional(),
    addressLine1: zod_1.z.string().optional(),
    addressLine2: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    pinCode: zod_1.z.string().regex(/^\d{6}$/).optional(),
    languagePreference: zod_1.z.string().optional(),
    insuranceProvider: zod_1.z.string().optional(),
    insurancePolicyNumber: zod_1.z.string().optional(),
});
exports.conditionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Condition name is required'),
    icdCode: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'CHRONIC', 'RESOLVED', 'IN_REMISSION']),
    diagnosedDate: zod_1.z.string().datetime().optional(),
    resolvedDate: zod_1.z.string().datetime().optional(),
    diagnosedBy: zod_1.z.string().optional(),
    managingDoctor: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.allergySchema = zod_1.z.object({
    allergen: zod_1.z.string().min(1, 'Allergen is required'),
    category: zod_1.z.enum(['FOOD', 'DRUG', 'ENVIRONMENTAL', 'INSECT', 'LATEX', 'OTHER']),
    severity: zod_1.z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']),
    reaction: zod_1.z.string().optional(),
    diagnosedDate: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
});
exports.surgerySchema = zod_1.z.object({
    procedureName: zod_1.z.string().min(1, 'Procedure name is required'),
    surgeryDate: zod_1.z.string().datetime(),
    hospital: zod_1.z.string().optional(),
    surgeon: zod_1.z.string().optional(),
    outcome: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.vaccinationSchema = zod_1.z.object({
    vaccineName: zod_1.z.string().min(1, 'Vaccine name is required'),
    dateAdministered: zod_1.z.string().datetime(),
    doseNumber: zod_1.z.number().int().positive().optional(),
    totalDoses: zod_1.z.number().int().positive().optional(),
    nextDueDate: zod_1.z.string().datetime().optional(),
    administrator: zod_1.z.string().optional(),
    batchNumber: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.familyHistorySchema = zod_1.z.object({
    relation: zod_1.z.string().min(1, 'Relation is required'),
    conditionName: zod_1.z.string().min(1, 'Condition name is required'),
    ageOfOnset: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.string().optional(),
    causeOfDeath: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.symptomSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Symptom name is required'),
    severity: zod_1.z.number().int().min(1).max(10),
    startedAt: zod_1.z.string().datetime().optional(),
    triggers: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().optional(),
});
exports.medicationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Medication name is required'),
    genericName: zod_1.z.string().optional(),
    dosage: zod_1.z.string().min(1, 'Dosage is required'),
    dosageUnit: zod_1.z.string().optional(),
    frequency: zod_1.z.enum([
        'ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY',
        'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM'
    ]),
    customFrequency: zod_1.z.string().optional(),
    timesOfDay: zod_1.z.array(zod_1.z.string()).optional(),
    prescribedBy: zod_1.z.string().optional(),
    prescribedFor: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional(),
    currentStock: zod_1.z.number().int().optional(),
    refillThreshold: zod_1.z.number().int().optional(),
    instructions: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.medicationLogSchema = zod_1.z.object({
    medicationId: zod_1.z.string().uuid(),
    scheduledTime: zod_1.z.string().datetime(),
    takenAt: zod_1.z.string().datetime().optional(),
    status: zod_1.z.enum(['taken', 'missed', 'skipped']),
    notes: zod_1.z.string().optional(),
});
exports.vitalSchema = zod_1.z.object({
    type: zod_1.z.enum(['bp', 'heart_rate', 'blood_sugar', 'hba1c', 'weight', 'temperature', 'spo2']),
    value: zod_1.z.string().min(1),
    unit: zod_1.z.string().min(1),
    systolic: zod_1.z.number().int().optional(),
    diastolic: zod_1.z.number().int().optional(),
    measuredAt: zod_1.z.string().datetime(),
    context: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    source: zod_1.z.string().optional(),
});
exports.emergencyContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    relationship: zod_1.z.string().min(1, 'Relationship is required'),
    phone: zod_1.z.string().regex(/^\d{10}$/, 'Invalid phone number'),
    email: zod_1.z.string().email().optional(),
    isPrimary: zod_1.z.boolean().optional(),
});
exports.consentSchema = zod_1.z.object({
    doctorId: zod_1.z.string().uuid(),
    accessScope: zod_1.z.array(zod_1.z.string()).min(1),
    expiresAt: zod_1.z.string().datetime().optional(),
    grantReason: zod_1.z.string().optional(),
});
exports.settingsSchema = zod_1.z.object({
    allowDoctorAccess: zod_1.z.boolean().optional(),
    allowAnonymousPosting: zod_1.z.boolean().optional(),
    contributeToResearch: zod_1.z.boolean().optional(),
    emailNotifications: zod_1.z.boolean().optional(),
    smsNotifications: zod_1.z.boolean().optional(),
    pushNotifications: zod_1.z.boolean().optional(),
    appointmentReminders: zod_1.z.boolean().optional(),
    medicationReminders: zod_1.z.boolean().optional(),
    communityActivity: zod_1.z.boolean().optional(),
    weeklyHealthSummary: zod_1.z.boolean().optional(),
    language: zod_1.z.string().optional(),
    timezone: zod_1.z.string().optional(),
});
//# sourceMappingURL=patient.validator.js.map