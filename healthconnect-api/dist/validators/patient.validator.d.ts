import { z } from 'zod';
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]>>;
    phone: z.ZodOptional<z.ZodString>;
    bloodGroup: z.ZodOptional<z.ZodEnum<["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN"]>>;
    rhFactor: z.ZodOptional<z.ZodEnum<["POSITIVE", "NEGATIVE", "UNKNOWN"]>>;
    addressLine1: z.ZodOptional<z.ZodString>;
    addressLine2: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    pinCode: z.ZodOptional<z.ZodString>;
    languagePreference: z.ZodOptional<z.ZodString>;
    insuranceProvider: z.ZodOptional<z.ZodString>;
    insurancePolicyNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | undefined;
    bloodGroup?: "UNKNOWN" | "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
    rhFactor?: "UNKNOWN" | "POSITIVE" | "NEGATIVE" | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    pinCode?: string | undefined;
    languagePreference?: string | undefined;
    insuranceProvider?: string | undefined;
    insurancePolicyNumber?: string | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | undefined;
    bloodGroup?: "UNKNOWN" | "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
    rhFactor?: "UNKNOWN" | "POSITIVE" | "NEGATIVE" | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    pinCode?: string | undefined;
    languagePreference?: string | undefined;
    insuranceProvider?: string | undefined;
    insurancePolicyNumber?: string | undefined;
}>;
export declare const conditionSchema: z.ZodObject<{
    name: z.ZodString;
    icdCode: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["ACTIVE", "CHRONIC", "RESOLVED", "IN_REMISSION"]>;
    diagnosedDate: z.ZodOptional<z.ZodString>;
    resolvedDate: z.ZodOptional<z.ZodString>;
    diagnosedBy: z.ZodOptional<z.ZodString>;
    managingDoctor: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: "ACTIVE" | "CHRONIC" | "RESOLVED" | "IN_REMISSION";
    notes?: string | undefined;
    icdCode?: string | undefined;
    diagnosedDate?: string | undefined;
    resolvedDate?: string | undefined;
    diagnosedBy?: string | undefined;
    managingDoctor?: string | undefined;
}, {
    name: string;
    status: "ACTIVE" | "CHRONIC" | "RESOLVED" | "IN_REMISSION";
    notes?: string | undefined;
    icdCode?: string | undefined;
    diagnosedDate?: string | undefined;
    resolvedDate?: string | undefined;
    diagnosedBy?: string | undefined;
    managingDoctor?: string | undefined;
}>;
export declare const allergySchema: z.ZodObject<{
    allergen: z.ZodString;
    category: z.ZodEnum<["FOOD", "DRUG", "ENVIRONMENTAL", "INSECT", "LATEX", "OTHER"]>;
    severity: z.ZodEnum<["MILD", "MODERATE", "SEVERE", "LIFE_THREATENING"]>;
    reaction: z.ZodOptional<z.ZodString>;
    diagnosedDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    severity: "MILD" | "MODERATE" | "SEVERE" | "LIFE_THREATENING";
    allergen: string;
    category: "OTHER" | "FOOD" | "DRUG" | "ENVIRONMENTAL" | "INSECT" | "LATEX";
    notes?: string | undefined;
    diagnosedDate?: string | undefined;
    reaction?: string | undefined;
}, {
    severity: "MILD" | "MODERATE" | "SEVERE" | "LIFE_THREATENING";
    allergen: string;
    category: "OTHER" | "FOOD" | "DRUG" | "ENVIRONMENTAL" | "INSECT" | "LATEX";
    notes?: string | undefined;
    diagnosedDate?: string | undefined;
    reaction?: string | undefined;
}>;
export declare const surgerySchema: z.ZodObject<{
    procedureName: z.ZodString;
    surgeryDate: z.ZodString;
    hospital: z.ZodOptional<z.ZodString>;
    surgeon: z.ZodOptional<z.ZodString>;
    outcome: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    procedureName: string;
    surgeryDate: string;
    notes?: string | undefined;
    hospital?: string | undefined;
    surgeon?: string | undefined;
    outcome?: string | undefined;
}, {
    procedureName: string;
    surgeryDate: string;
    notes?: string | undefined;
    hospital?: string | undefined;
    surgeon?: string | undefined;
    outcome?: string | undefined;
}>;
export declare const vaccinationSchema: z.ZodObject<{
    vaccineName: z.ZodString;
    dateAdministered: z.ZodString;
    doseNumber: z.ZodOptional<z.ZodNumber>;
    totalDoses: z.ZodOptional<z.ZodNumber>;
    nextDueDate: z.ZodOptional<z.ZodString>;
    administrator: z.ZodOptional<z.ZodString>;
    batchNumber: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    vaccineName: string;
    dateAdministered: string;
    notes?: string | undefined;
    doseNumber?: number | undefined;
    totalDoses?: number | undefined;
    nextDueDate?: string | undefined;
    administrator?: string | undefined;
    batchNumber?: string | undefined;
}, {
    vaccineName: string;
    dateAdministered: string;
    notes?: string | undefined;
    doseNumber?: number | undefined;
    totalDoses?: number | undefined;
    nextDueDate?: string | undefined;
    administrator?: string | undefined;
    batchNumber?: string | undefined;
}>;
export declare const familyHistorySchema: z.ZodObject<{
    relation: z.ZodString;
    conditionName: z.ZodString;
    ageOfOnset: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
    causeOfDeath: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    relation: string;
    conditionName: string;
    status?: string | undefined;
    notes?: string | undefined;
    ageOfOnset?: number | undefined;
    causeOfDeath?: string | undefined;
}, {
    relation: string;
    conditionName: string;
    status?: string | undefined;
    notes?: string | undefined;
    ageOfOnset?: number | undefined;
    causeOfDeath?: string | undefined;
}>;
export declare const symptomSchema: z.ZodObject<{
    name: z.ZodString;
    severity: z.ZodNumber;
    startedAt: z.ZodOptional<z.ZodString>;
    triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    severity: number;
    notes?: string | undefined;
    triggers?: string[] | undefined;
    startedAt?: string | undefined;
}, {
    name: string;
    severity: number;
    notes?: string | undefined;
    triggers?: string[] | undefined;
    startedAt?: string | undefined;
}>;
export declare const medicationSchema: z.ZodObject<{
    name: z.ZodString;
    genericName: z.ZodOptional<z.ZodString>;
    dosage: z.ZodString;
    dosageUnit: z.ZodOptional<z.ZodString>;
    frequency: z.ZodEnum<["ONCE_DAILY", "TWICE_DAILY", "THREE_TIMES_DAILY", "FOUR_TIMES_DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "AS_NEEDED", "CUSTOM"]>;
    customFrequency: z.ZodOptional<z.ZodString>;
    timesOfDay: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    prescribedBy: z.ZodOptional<z.ZodString>;
    prescribedFor: z.ZodOptional<z.ZodString>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    currentStock: z.ZodOptional<z.ZodNumber>;
    refillThreshold: z.ZodOptional<z.ZodNumber>;
    instructions: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    startDate: string;
    dosage: string;
    frequency: "MONTHLY" | "ONCE_DAILY" | "TWICE_DAILY" | "THREE_TIMES_DAILY" | "FOUR_TIMES_DAILY" | "WEEKLY" | "BIWEEKLY" | "AS_NEEDED" | "CUSTOM";
    endDate?: string | undefined;
    genericName?: string | undefined;
    dosageUnit?: string | undefined;
    customFrequency?: string | undefined;
    timesOfDay?: string[] | undefined;
    prescribedBy?: string | undefined;
    prescribedFor?: string | undefined;
    currentStock?: number | undefined;
    refillThreshold?: number | undefined;
    instructions?: string | undefined;
    notes?: string | undefined;
}, {
    name: string;
    startDate: string;
    dosage: string;
    frequency: "MONTHLY" | "ONCE_DAILY" | "TWICE_DAILY" | "THREE_TIMES_DAILY" | "FOUR_TIMES_DAILY" | "WEEKLY" | "BIWEEKLY" | "AS_NEEDED" | "CUSTOM";
    endDate?: string | undefined;
    genericName?: string | undefined;
    dosageUnit?: string | undefined;
    customFrequency?: string | undefined;
    timesOfDay?: string[] | undefined;
    prescribedBy?: string | undefined;
    prescribedFor?: string | undefined;
    currentStock?: number | undefined;
    refillThreshold?: number | undefined;
    instructions?: string | undefined;
    notes?: string | undefined;
}>;
export declare const medicationLogSchema: z.ZodObject<{
    medicationId: z.ZodString;
    scheduledTime: z.ZodString;
    takenAt: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["taken", "missed", "skipped"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "taken" | "missed" | "skipped";
    medicationId: string;
    scheduledTime: string;
    notes?: string | undefined;
    takenAt?: string | undefined;
}, {
    status: "taken" | "missed" | "skipped";
    medicationId: string;
    scheduledTime: string;
    notes?: string | undefined;
    takenAt?: string | undefined;
}>;
export declare const vitalSchema: z.ZodObject<{
    type: z.ZodEnum<["bp", "heart_rate", "blood_sugar", "hba1c", "weight", "temperature", "spo2"]>;
    value: z.ZodString;
    unit: z.ZodString;
    systolic: z.ZodOptional<z.ZodNumber>;
    diastolic: z.ZodOptional<z.ZodNumber>;
    measuredAt: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: string;
    type: "bp" | "heart_rate" | "blood_sugar" | "hba1c" | "weight" | "temperature" | "spo2";
    unit: string;
    measuredAt: string;
    notes?: string | undefined;
    systolic?: number | undefined;
    diastolic?: number | undefined;
    context?: string | undefined;
    source?: string | undefined;
}, {
    value: string;
    type: "bp" | "heart_rate" | "blood_sugar" | "hba1c" | "weight" | "temperature" | "spo2";
    unit: string;
    measuredAt: string;
    notes?: string | undefined;
    systolic?: number | undefined;
    diastolic?: number | undefined;
    context?: string | undefined;
    source?: string | undefined;
}>;
export declare const emergencyContactSchema: z.ZodObject<{
    name: z.ZodString;
    relationship: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    relationship: string;
    email?: string | undefined;
    isPrimary?: boolean | undefined;
}, {
    name: string;
    phone: string;
    relationship: string;
    email?: string | undefined;
    isPrimary?: boolean | undefined;
}>;
export declare const consentSchema: z.ZodObject<{
    doctorId: z.ZodString;
    accessScope: z.ZodArray<z.ZodString, "many">;
    expiresAt: z.ZodOptional<z.ZodString>;
    grantReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    doctorId: string;
    accessScope: string[];
    expiresAt?: string | undefined;
    grantReason?: string | undefined;
}, {
    doctorId: string;
    accessScope: string[];
    expiresAt?: string | undefined;
    grantReason?: string | undefined;
}>;
export declare const settingsSchema: z.ZodObject<{
    allowDoctorAccess: z.ZodOptional<z.ZodBoolean>;
    allowAnonymousPosting: z.ZodOptional<z.ZodBoolean>;
    contributeToResearch: z.ZodOptional<z.ZodBoolean>;
    emailNotifications: z.ZodOptional<z.ZodBoolean>;
    smsNotifications: z.ZodOptional<z.ZodBoolean>;
    pushNotifications: z.ZodOptional<z.ZodBoolean>;
    appointmentReminders: z.ZodOptional<z.ZodBoolean>;
    medicationReminders: z.ZodOptional<z.ZodBoolean>;
    communityActivity: z.ZodOptional<z.ZodBoolean>;
    weeklyHealthSummary: z.ZodOptional<z.ZodBoolean>;
    language: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    allowDoctorAccess?: boolean | undefined;
    allowAnonymousPosting?: boolean | undefined;
    contributeToResearch?: boolean | undefined;
    emailNotifications?: boolean | undefined;
    smsNotifications?: boolean | undefined;
    pushNotifications?: boolean | undefined;
    appointmentReminders?: boolean | undefined;
    medicationReminders?: boolean | undefined;
    communityActivity?: boolean | undefined;
    weeklyHealthSummary?: boolean | undefined;
    language?: string | undefined;
    timezone?: string | undefined;
}, {
    allowDoctorAccess?: boolean | undefined;
    allowAnonymousPosting?: boolean | undefined;
    contributeToResearch?: boolean | undefined;
    emailNotifications?: boolean | undefined;
    smsNotifications?: boolean | undefined;
    pushNotifications?: boolean | undefined;
    appointmentReminders?: boolean | undefined;
    medicationReminders?: boolean | undefined;
    communityActivity?: boolean | undefined;
    weeklyHealthSummary?: boolean | undefined;
    language?: string | undefined;
    timezone?: string | undefined;
}>;
//# sourceMappingURL=patient.validator.d.ts.map