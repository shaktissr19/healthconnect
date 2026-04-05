"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error('Error:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });
    // Handle ApiError
    if (error instanceof apiError_1.ApiError) {
        return apiResponse_1.ApiResponse.error(res, error.errorCode, error.message, error.statusCode, error.errors);
    }
    // Handle Prisma errors
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002': // Unique constraint violation
                const field = error.meta?.target?.[0] || 'field';
                return apiResponse_1.ApiResponse.error(res, 'ALREADY_EXISTS', `A record with this ${field} already exists`, 409);
            case 'P2025': // Record not found
                return apiResponse_1.ApiResponse.notFound(res, 'Record not found');
            default:
                return apiResponse_1.ApiResponse.internalError(res, 'Database error');
        }
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
        return apiResponse_1.ApiResponse.error(res, 'VALIDATION_FAILED', error.message, 422);
    }
    // Default to 500
    return apiResponse_1.ApiResponse.internalError(res);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map