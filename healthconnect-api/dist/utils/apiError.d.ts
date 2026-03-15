export declare class ApiError extends Error {
    statusCode: number;
    errorCode: string;
    isOperational: boolean;
    errors?: any;
    constructor(statusCode: number, errorCode: string, message: string, errors?: any);
    static badRequest(errorCode: string, message: string, errors?: any): ApiError;
    static unauthorized(message?: string): ApiError;
    static forbidden(errorCode: string, message: string): ApiError;
    static notFound(message?: string): ApiError;
    static conflict(errorCode: string, message: string): ApiError;
    static unprocessable(message: string, errors?: any): ApiError;
    static tooManyRequests(message?: string): ApiError;
    static internal(message?: string): ApiError;
}
export declare const ERROR_CODES: {
    readonly EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly AUTH_REQUIRED: "AUTH_REQUIRED";
    readonly ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE";
    readonly ACCESS_DENIED: "ACCESS_DENIED";
    readonly CONSENT_REQUIRED: "CONSENT_REQUIRED";
    readonly SUBSCRIPTION_REQUIRED: "SUBSCRIPTION_REQUIRED";
    readonly INSUFFICIENT_ROLE: "INSUFFICIENT_ROLE";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly DUPLICATE_ENTRY: "DUPLICATE_ENTRY";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly SLOT_TAKEN: "SLOT_TAKEN";
    readonly PATIENT_CONFLICT: "PATIENT_CONFLICT";
    readonly ALREADY_MEMBER: "ALREADY_MEMBER";
    readonly ALREADY_REPORTED: "ALREADY_REPORTED";
    readonly REVIEW_NOT_ALLOWED: "REVIEW_NOT_ALLOWED";
    readonly INVALID_STATUS: "INVALID_STATUS";
    readonly RESTRICTED: "RESTRICTED";
    readonly FREE_PLAN: "FREE_PLAN";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly RATE_LIMITED: "RATE_LIMITED";
};
//# sourceMappingURL=apiError.d.ts.map