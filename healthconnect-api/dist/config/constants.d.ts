export declare const CONSTANTS: {
    REGISTRATION_PREFIX: {
        PATIENT: string;
        DOCTOR: string;
        HOSPITAL: string;
    };
    PAGINATION: {
        DEFAULT_PAGE: number;
        DEFAULT_LIMIT: number;
        MAX_LIMIT: number;
    };
    FILE_UPLOAD: {
        MAX_SIZE: number;
        ALLOWED_TYPES: string[];
    };
    HEALTH_SCORE: {
        MEDICATION_ADHERENCE_WEIGHT: number;
        SYMPTOM_FREQUENCY_WEIGHT: number;
        APPOINTMENT_REGULARITY_WEIGHT: number;
        LIFESTYLE_FACTORS_WEIGHT: number;
    };
    CONSENT: {
        DEFAULT_EXPIRY_DAYS: number;
        MAX_EXPIRY_DAYS: number;
    };
    APPOINTMENT: {
        DEFAULT_DURATION: number;
        MIN_ADVANCE_BOOKING_HOURS: number;
        MAX_ADVANCE_BOOKING_DAYS: number;
    };
};
export declare const ERROR_CODES: {
    AUTH_REQUIRED: string;
    INVALID_TOKEN: string;
    TOKEN_EXPIRED: string;
    ACCESS_DENIED: string;
    INVALID_CREDENTIALS: string;
    VALIDATION_FAILED: string;
    INVALID_INPUT: string;
    NOT_FOUND: string;
    ALREADY_EXISTS: string;
    EMAIL_ALREADY_EXISTS: string;
    INVALID_ROLE: string;
    SUBSCRIPTION_REQUIRED: string;
    CONSENT_REQUIRED: string;
    CONSENT_EXPIRED: string;
    SLOT_NOT_AVAILABLE: string;
    APPOINTMENT_CONFLICT: string;
    INTERNAL_ERROR: string;
    SERVICE_UNAVAILABLE: string;
};
//# sourceMappingURL=constants.d.ts.map