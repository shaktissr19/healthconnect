export declare const getDashboardOverview: (userId: string) => Promise<{
    profile: {
        firstName: string;
        lastName: string;
        bloodGroup: import(".prisma/client").$Enums.BloodGroup;
        profilePhotoUrl: string | null;
    };
    healthScore: {
        score: number;
        medicationAdherence: number;
        symptomFrequency: number;
        appointmentRegularity: number;
        lifestyleFactors: number;
        calculatedAt: Date;
        trend: string;
    };
    kpis: {
        upcomingAppointmentsCount: number;
        activeMedicationsCount: number;
        activeConditionsCount: number;
        recentSymptomsCount: number;
        unreadNotifications: number;
        communitiesJoined: number;
        totalReports: number;
        medicationAdherencePct: number;
        refillAlertsCount: number;
    };
    upcomingAppointments: ({
        doctor: {
            firstName: string;
            lastName: string;
            profilePhotoUrl: string | null;
            specialization: string | null;
            consultationFee: number | null;
            teleconsultFee: number | null;
            clinicName: string | null;
        };
        hospital: {
            name: string;
            city: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        symptoms: string[];
        status: import(".prisma/client").$Enums.AppointmentStatus;
        type: import(".prisma/client").$Enums.AppointmentType;
        patientId: string;
        doctorId: string;
        hospitalId: string | null;
        scheduledAt: Date;
        durationMinutes: number;
        reasonForVisit: string | null;
        doctorNotes: string | null;
        prescription: string | null;
        followUpDate: Date | null;
        cancelledBy: string | null;
        cancellationReason: string | null;
        meetingLink: string | null;
    })[];
    activeMedications: {
        id: string;
        name: string;
        dosage: string;
        frequency: import(".prisma/client").$Enums.MedicationFrequency;
        timesOfDay: string[];
        currentStock: number | null;
        refillThreshold: number | null;
    }[];
    recentSymptoms: {
        id: string;
        name: string;
        severity: number;
        loggedAt: Date;
        resolvedAt: Date | null;
    }[];
    recentVitals: {
        id: string;
        value: string;
        type: import(".prisma/client").$Enums.VitalType;
        unit: string;
        systolic: number | null;
        diastolic: number | null;
        measuredAt: Date;
    }[];
    refillAlerts: {
        id: string;
        name: string;
        dosage: string;
        frequency: import(".prisma/client").$Enums.MedicationFrequency;
        timesOfDay: string[];
        currentStock: number | null;
        refillThreshold: number | null;
    }[];
    aiInsight: string;
}>;
export declare const getProfile: (userId: string) => Promise<{
    email: string;
    registrationId: string;
    isEmailVerified: boolean;
    memberSince: Date;
    settings: {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        allowDoctorAccess: boolean;
        allowAnonymousPosting: boolean;
        contributeToResearch: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        appointmentReminders: boolean;
        medicationReminders: boolean;
        communityActivity: boolean;
        weeklyHealthSummary: boolean;
        language: string;
        timezone: string;
    } | null;
    subscription: {
        plan: string;
        tier: string;
        endDate: Date;
        features: import("@prisma/client/runtime/library").JsonValue;
    } | {
        plan: string;
        tier: string;
        endDate: null;
        features: {};
    };
    user: undefined;
    emergencyContacts: {
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        phone: string;
        patientId: string;
        isPrimary: boolean;
        relationship: string;
    }[];
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    firstName: string;
    lastName: string;
    phone: string | null;
    dateOfBirth: Date | null;
    gender: import(".prisma/client").$Enums.Gender | null;
    bloodGroup: import(".prisma/client").$Enums.BloodGroup;
    rhFactor: import(".prisma/client").$Enums.RhFactor;
    profilePhotoUrl: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pinCode: string | null;
    country: string;
    languagePreference: string;
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
}>;
export declare const updateProfile: (userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    languagePreference?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
}) => Promise<{
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    firstName: string;
    lastName: string;
    phone: string | null;
    dateOfBirth: Date | null;
    gender: import(".prisma/client").$Enums.Gender | null;
    bloodGroup: import(".prisma/client").$Enums.BloodGroup;
    rhFactor: import(".prisma/client").$Enums.RhFactor;
    profilePhotoUrl: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pinCode: string | null;
    country: string;
    languagePreference: string;
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
}>;
export declare const getEmergencyContacts: (userId: string) => Promise<{
    id: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    phone: string;
    patientId: string;
    isPrimary: boolean;
    relationship: string;
}[]>;
export declare const addEmergencyContact: (userId: string, data: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary?: boolean;
}) => Promise<{
    id: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    phone: string;
    patientId: string;
    isPrimary: boolean;
    relationship: string;
}>;
export declare const updateEmergencyContact: (userId: string, contactId: string, data: Partial<{
    name: string;
    relationship: string;
    phone: string;
    email: string;
    isPrimary: boolean;
}>) => Promise<{
    id: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    phone: string;
    patientId: string;
    isPrimary: boolean;
    relationship: string;
}>;
export declare const deleteEmergencyContact: (userId: string, contactId: string) => Promise<void>;
export declare const getMedicalHistory: (userId: string) => Promise<{
    conditions: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ConditionStatus;
        patientId: string;
        notes: string | null;
        icdCode: string | null;
        diagnosedDate: Date | null;
        resolvedDate: Date | null;
        diagnosedBy: string | null;
        managingDoctor: string | null;
    }[];
    allergies: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.AllergyCategory;
        patientId: string;
        notes: string | null;
        severity: import(".prisma/client").$Enums.AllergySeverity;
        diagnosedDate: Date | null;
        allergen: string;
        reaction: string | null;
    }[];
    surgeries: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        notes: string | null;
        hospital: string | null;
        procedureName: string;
        surgeryDate: Date;
        surgeon: string | null;
        outcome: string | null;
        complications: string | null;
    }[];
    vaccinations: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        notes: string | null;
        vaccineName: string;
        dateAdministered: Date;
        doseNumber: number | null;
        totalDoses: number | null;
        nextDueDate: Date | null;
        administrator: string | null;
        batchNumber: string | null;
        sideEffects: string | null;
    }[];
    familyHistory: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string | null;
        patientId: string;
        notes: string | null;
        relation: string;
        conditionName: string;
        ageOfOnset: number | null;
        causeOfDeath: string | null;
    }[];
    hospitalizationHistory: {
        id: string;
        createdAt: Date;
        patientId: string;
        notes: string | null;
        hospitalName: string;
        admissionDate: Date;
        dischargeDate: Date | null;
        reason: string | null;
        diagnosis: string | null;
        treatingDoctor: string | null;
    }[];
}>;
export declare const addCondition: (userId: string, data: {
    name: string;
    icdCode?: string;
    status?: string;
    diagnosedDate?: string;
    diagnosedBy?: string;
    managingDoctor?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: import(".prisma/client").$Enums.ConditionStatus;
    patientId: string;
    notes: string | null;
    icdCode: string | null;
    diagnosedDate: Date | null;
    resolvedDate: Date | null;
    diagnosedBy: string | null;
    managingDoctor: string | null;
}>;
export declare const updateCondition: (userId: string, conditionId: string, data: Partial<{
    name: string;
    icdCode: string;
    status: string;
    diagnosedDate: string;
    resolvedDate: string;
    diagnosedBy: string;
    managingDoctor: string;
    notes: string;
}>) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: import(".prisma/client").$Enums.ConditionStatus;
    patientId: string;
    notes: string | null;
    icdCode: string | null;
    diagnosedDate: Date | null;
    resolvedDate: Date | null;
    diagnosedBy: string | null;
    managingDoctor: string | null;
}>;
export declare const deleteCondition: (userId: string, conditionId: string) => Promise<void>;
export declare const addAllergy: (userId: string, data: {
    allergen: string;
    category?: string;
    severity?: string;
    reaction?: string;
    diagnosedDate?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    category: import(".prisma/client").$Enums.AllergyCategory;
    patientId: string;
    notes: string | null;
    severity: import(".prisma/client").$Enums.AllergySeverity;
    diagnosedDate: Date | null;
    allergen: string;
    reaction: string | null;
}>;
export declare const updateAllergy: (userId: string, allergyId: string, data: Partial<{
    allergen: string;
    category: string;
    severity: string;
    reaction: string;
    notes: string;
}>) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    category: import(".prisma/client").$Enums.AllergyCategory;
    patientId: string;
    notes: string | null;
    severity: import(".prisma/client").$Enums.AllergySeverity;
    diagnosedDate: Date | null;
    allergen: string;
    reaction: string | null;
}>;
export declare const deleteAllergy: (userId: string, allergyId: string) => Promise<void>;
export declare const addSurgery: (userId: string, data: {
    procedureName: string;
    surgeryDate: string;
    hospital?: string;
    surgeon?: string;
    outcome?: string;
    complications?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    notes: string | null;
    hospital: string | null;
    procedureName: string;
    surgeryDate: Date;
    surgeon: string | null;
    outcome: string | null;
    complications: string | null;
}>;
export declare const deleteSurgery: (userId: string, surgeryId: string) => Promise<void>;
export declare const addVaccination: (userId: string, data: {
    vaccineName: string;
    dateAdministered: string;
    doseNumber?: number;
    totalDoses?: number;
    nextDueDate?: string;
    administrator?: string;
    batchNumber?: string;
    sideEffects?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    notes: string | null;
    vaccineName: string;
    dateAdministered: Date;
    doseNumber: number | null;
    totalDoses: number | null;
    nextDueDate: Date | null;
    administrator: string | null;
    batchNumber: string | null;
    sideEffects: string | null;
}>;
export declare const deleteVaccination: (userId: string, vaccinationId: string) => Promise<void>;
export declare const addFamilyHistory: (userId: string, data: {
    relation: string;
    conditionName: string;
    ageOfOnset?: number;
    status?: string;
    causeOfDeath?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: string | null;
    patientId: string;
    notes: string | null;
    relation: string;
    conditionName: string;
    ageOfOnset: number | null;
    causeOfDeath: string | null;
}>;
export declare const deleteFamilyHistory: (userId: string, historyId: string) => Promise<void>;
export declare const addHospitalizationHistory: (userId: string, data: {
    hospitalName: string;
    admissionDate: string;
    dischargeDate?: string;
    reason?: string;
    diagnosis?: string;
    treatingDoctor?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    patientId: string;
    notes: string | null;
    hospitalName: string;
    admissionDate: Date;
    dischargeDate: Date | null;
    reason: string | null;
    diagnosis: string | null;
    treatingDoctor: string | null;
}>;
export declare const deleteHospitalizationHistory: (userId: string, historyId: string) => Promise<void>;
export declare const getSymptoms: (userId: string, params: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    search?: string;
}) => Promise<{
    symptoms: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        patientId: string;
        notes: string | null;
        severity: number;
        loggedAt: Date;
        resolvedAt: Date | null;
        triggers: string[];
    }[];
    total: number;
    page: number;
    totalPages: number;
    trend: {
        date: string;
        avgSeverity: number;
        count: number;
        symptoms: string[];
    }[];
}>;
export declare const logSymptom: (userId: string, data: {
    name: string;
    severity: number;
    loggedAt?: string;
    triggers?: string[];
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    patientId: string;
    notes: string | null;
    severity: number;
    loggedAt: Date;
    resolvedAt: Date | null;
    triggers: string[];
}>;
export declare const updateSymptom: (userId: string, symptomId: string, data: Partial<{
    name: string;
    severity: number;
    resolvedAt: string;
    triggers: string[];
    notes: string;
}>) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    patientId: string;
    notes: string | null;
    severity: number;
    loggedAt: Date;
    resolvedAt: Date | null;
    triggers: string[];
}>;
export declare const deleteSymptom: (userId: string, symptomId: string) => Promise<void>;
export declare const getVitals: (userId: string, params: {
    type?: string;
    from?: string;
    to?: string;
    limit?: number;
}) => Promise<{
    vitals: {
        id: string;
        createdAt: Date;
        value: string;
        type: import(".prisma/client").$Enums.VitalType;
        patientId: string;
        notes: string | null;
        unit: string;
        systolic: number | null;
        diastolic: number | null;
        measuredAt: Date;
        context: string | null;
        source: string | null;
    }[];
    latestByType: {
        id: string;
        createdAt: Date;
        value: string;
        type: import(".prisma/client").$Enums.VitalType;
        patientId: string;
        notes: string | null;
        unit: string;
        systolic: number | null;
        diastolic: number | null;
        measuredAt: Date;
        context: string | null;
        source: string | null;
    }[];
}>;
export declare const logVital: (userId: string, data: {
    type: string;
    value: string;
    unit: string;
    systolic?: number;
    diastolic?: number;
    measuredAt?: string;
    context?: string;
    notes?: string;
    source?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    value: string;
    type: import(".prisma/client").$Enums.VitalType;
    patientId: string;
    notes: string | null;
    unit: string;
    systolic: number | null;
    diastolic: number | null;
    measuredAt: Date;
    context: string | null;
    source: string | null;
}>;
export declare const deleteVital: (userId: string, vitalId: string) => Promise<void>;
export declare const getMedications: (userId: string, params: {
    status?: string;
}) => Promise<{
    adherencePct: number | null;
    needsRefill: boolean;
    logs: {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MedicationLogStatus;
        notes: string | null;
        medicationId: string;
        scheduledTime: Date;
        takenAt: Date | null;
    }[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: import(".prisma/client").$Enums.MedicationStatus;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
    genericName: string | null;
    dosage: string;
    dosageUnit: string | null;
    frequency: import(".prisma/client").$Enums.MedicationFrequency;
    customFrequency: string | null;
    timesOfDay: string[];
    prescribedBy: string | null;
    prescribedFor: string | null;
    currentStock: number | null;
    refillThreshold: number | null;
    instructions: string | null;
    notes: string | null;
}[]>;
export declare const addMedication: (userId: string, data: {
    name: string;
    genericName?: string;
    dosage: string;
    dosageUnit?: string;
    frequency: string;
    customFrequency?: string;
    timesOfDay?: string[];
    prescribedBy?: string;
    prescribedFor?: string;
    startDate: string;
    endDate?: string;
    currentStock?: number;
    refillThreshold?: number;
    instructions?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: import(".prisma/client").$Enums.MedicationStatus;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
    genericName: string | null;
    dosage: string;
    dosageUnit: string | null;
    frequency: import(".prisma/client").$Enums.MedicationFrequency;
    customFrequency: string | null;
    timesOfDay: string[];
    prescribedBy: string | null;
    prescribedFor: string | null;
    currentStock: number | null;
    refillThreshold: number | null;
    instructions: string | null;
    notes: string | null;
}>;
export declare const updateMedication: (userId: string, medicationId: string, data: Partial<{
    name: string;
    dosage: string;
    frequency: string;
    timesOfDay: string[];
    status: string;
    currentStock: number;
    endDate: string;
    notes: string;
    instructions: string;
}>) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: import(".prisma/client").$Enums.MedicationStatus;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
    genericName: string | null;
    dosage: string;
    dosageUnit: string | null;
    frequency: import(".prisma/client").$Enums.MedicationFrequency;
    customFrequency: string | null;
    timesOfDay: string[];
    prescribedBy: string | null;
    prescribedFor: string | null;
    currentStock: number | null;
    refillThreshold: number | null;
    instructions: string | null;
    notes: string | null;
}>;
export declare const deleteMedication: (userId: string, medicationId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: import(".prisma/client").$Enums.MedicationStatus;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
    genericName: string | null;
    dosage: string;
    dosageUnit: string | null;
    frequency: import(".prisma/client").$Enums.MedicationFrequency;
    customFrequency: string | null;
    timesOfDay: string[];
    prescribedBy: string | null;
    prescribedFor: string | null;
    currentStock: number | null;
    refillThreshold: number | null;
    instructions: string | null;
    notes: string | null;
}>;
export declare const logMedicationDose: (userId: string, medicationId: string, data: {
    status: "taken" | "missed" | "skipped";
    scheduledTime: string;
    takenAt?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    status: import(".prisma/client").$Enums.MedicationLogStatus;
    notes: string | null;
    medicationId: string;
    scheduledTime: Date;
    takenAt: Date | null;
}>;
export declare const getMedicationLogs: (userId: string, medicationId: string, params: {
    from?: string;
    to?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    status: import(".prisma/client").$Enums.MedicationLogStatus;
    notes: string | null;
    medicationId: string;
    scheduledTime: Date;
    takenAt: Date | null;
}[]>;
export declare const getTherapies: (userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    startDate: Date;
    endDate: Date | null;
    plan: string;
    type: string;
    patientId: string;
    notes: string | null;
    targetValue: string | null;
    currentValue: string | null;
    adherence: number | null;
}[]>;
export declare const addTherapy: (userId: string, data: {
    type: string;
    plan: string;
    targetValue?: string;
    currentValue?: string;
    startDate: string;
    endDate?: string;
    notes?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    startDate: Date;
    endDate: Date | null;
    plan: string;
    type: string;
    patientId: string;
    notes: string | null;
    targetValue: string | null;
    currentValue: string | null;
    adherence: number | null;
}>;
export declare const deleteTherapy: (userId: string, therapyId: string) => Promise<void>;
export declare const getReports: (userId: string, params: {
    type?: string;
    page?: number;
    limit?: number;
    search?: string;
}) => Promise<{
    reports: ({
        shares: ({
            doctor: {
                firstName: string;
                lastName: string;
                specialization: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            doctorId: string;
            reportId: string;
            expiresAt: Date | null;
            accessedAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        type: import(".prisma/client").$Enums.ReportType;
        patientId: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string | null;
        uploadedBy: string | null;
        reportDate: Date | null;
        isEncrypted: boolean;
    })[];
    total: number;
    page: number;
    totalPages: number;
    summary: {
        type: import(".prisma/client").$Enums.ReportType;
        count: number;
    }[];
}>;
export declare const uploadReport: (userId: string, file: Express.Multer.File, data: {
    name: string;
    type?: string;
    description?: string;
    reportDate?: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
    type: import(".prisma/client").$Enums.ReportType;
    patientId: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string | null;
    uploadedBy: string | null;
    reportDate: Date | null;
    isEncrypted: boolean;
}>;
export declare const deleteReport: (userId: string, reportId: string) => Promise<void>;
export declare const shareReport: (userId: string, reportId: string, data: {
    doctorId: string;
    expiresInDays?: number;
}) => Promise<{
    doctor: {
        firstName: string;
        lastName: string;
        specialization: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    doctorId: string;
    reportId: string;
    expiresAt: Date | null;
    accessedAt: Date | null;
}>;
export declare const revokeReportShare: (userId: string, reportId: string, doctorId: string) => Promise<void>;
export declare const refreshHealthScore: (userId: string) => Promise<{
    score: number;
    medicationAdherence: number;
    symptomFrequency: number;
    appointmentRegularity: number;
    lifestyleFactors: number;
    calculatedAt: Date;
}>;
export declare const getHealthScoreHistory: (userId: string) => Promise<{
    score: number;
    medicationAdherence: number;
    symptomFrequency: number;
    appointmentRegularity: number;
    lifestyleFactors: number;
    calculatedAt: Date;
}>;
export declare const getConsents: (userId: string) => Promise<({
    doctor: {
        firstName: string;
        lastName: string;
        profilePhotoUrl: string | null;
        specialization: string | null;
        clinicName: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.ConsentStatus;
    patientId: string;
    doctorId: string;
    expiresAt: Date | null;
    accessScope: string[];
    grantReason: string | null;
    revokedAt: Date | null;
})[]>;
export declare const grantConsent: (userId: string, data: {
    doctorId: string;
    accessScope: string[];
    expiresInDays?: number;
    grantReason?: string;
}) => Promise<{
    doctor: {
        firstName: string;
        lastName: string;
        specialization: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.ConsentStatus;
    patientId: string;
    doctorId: string;
    expiresAt: Date | null;
    accessScope: string[];
    grantReason: string | null;
    revokedAt: Date | null;
}>;
export declare const revokeConsent: (userId: string, consentId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.ConsentStatus;
    patientId: string;
    doctorId: string;
    expiresAt: Date | null;
    accessScope: string[];
    grantReason: string | null;
    revokedAt: Date | null;
}>;
export declare const getSettings: (userId: string) => Promise<{
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    allowDoctorAccess: boolean;
    allowAnonymousPosting: boolean;
    contributeToResearch: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    appointmentReminders: boolean;
    medicationReminders: boolean;
    communityActivity: boolean;
    weeklyHealthSummary: boolean;
    language: string;
    timezone: string;
}>;
export declare const updateSettings: (userId: string, data: Partial<{
    allowDoctorAccess: boolean;
    allowAnonymousPosting: boolean;
    contributeToResearch: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    appointmentReminders: boolean;
    medicationReminders: boolean;
    communityActivity: boolean;
    weeklyHealthSummary: boolean;
    language: string;
    timezone: string;
}>) => Promise<{
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    allowDoctorAccess: boolean;
    allowAnonymousPosting: boolean;
    contributeToResearch: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    appointmentReminders: boolean;
    medicationReminders: boolean;
    communityActivity: boolean;
    weeklyHealthSummary: boolean;
    language: string;
    timezone: string;
}>;
//# sourceMappingURL=patient.service.d.ts.map