export class ApiError extends Error {
  statusCode:    number;
  errorCode:     string;
  isOperational: boolean;
  errors?:       any;   // ← added: errorHandler accesses error.errors

  constructor(statusCode: number, errorCode: string, message: string, errors?: any) {
    super(message);
    this.statusCode    = statusCode;
    this.errorCode     = errorCode;
    this.isOperational = true;
    this.errors        = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(errorCode: string, message: string, errors?: any) {
    return new ApiError(400, errorCode, message, errors);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(errorCode: string, message: string) {
    return new ApiError(403, errorCode, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }
  static conflict(errorCode: string, message: string) {
    return new ApiError(409, errorCode, message);
  }
  static unprocessable(message: string, errors?: any) {
    return new ApiError(422, 'VALIDATION_FAILED', message, errors);
  }
  static tooManyRequests(message = 'Too many requests. Please try again later.') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

export const ERROR_CODES = {
  EMAIL_ALREADY_EXISTS:  'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS:   'INVALID_CREDENTIALS',
  INVALID_TOKEN:         'INVALID_TOKEN',
  TOKEN_EXPIRED:         'TOKEN_EXPIRED',
  AUTH_REQUIRED:         'AUTH_REQUIRED',
  ACCOUNT_INACTIVE:      'ACCOUNT_INACTIVE',
  ACCESS_DENIED:         'ACCESS_DENIED',
  CONSENT_REQUIRED:      'CONSENT_REQUIRED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  INSUFFICIENT_ROLE:     'INSUFFICIENT_ROLE',
  NOT_FOUND:             'NOT_FOUND',
  DUPLICATE_ENTRY:       'DUPLICATE_ENTRY',
  VALIDATION_FAILED:     'VALIDATION_FAILED',
  SLOT_TAKEN:            'SLOT_TAKEN',
  PATIENT_CONFLICT:      'PATIENT_CONFLICT',
  ALREADY_MEMBER:        'ALREADY_MEMBER',
  ALREADY_REPORTED:      'ALREADY_REPORTED',
  REVIEW_NOT_ALLOWED:    'REVIEW_NOT_ALLOWED',
  INVALID_STATUS:        'INVALID_STATUS',
  RESTRICTED:            'RESTRICTED',
  FREE_PLAN:             'FREE_PLAN',
  INVALID_SIGNATURE:     'INVALID_SIGNATURE',
  INTERNAL_ERROR:        'INTERNAL_ERROR',
  RATE_LIMITED:          'RATE_LIMITED',
} as const;
