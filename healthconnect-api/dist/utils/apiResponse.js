"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    // ── 200 OK ────────────────────────────────────────────────────────────
    static success(res, data = null, message) {
        return res.status(200).json({
            success: true,
            ...(message ? { message } : {}),
            data,
        });
    }
    // ── 201 Created ───────────────────────────────────────────────────────
    static created(res, data = null, message) {
        return res.status(201).json({
            success: true,
            ...(message ? { message } : {}),
            data,
        });
    }
    // ── 204 No Content ────────────────────────────────────────────────────
    static noContent(res) {
        return res.status(204).send();
    }
    // ── 401 Unauthorized ──────────────────────────────────────────────────
    // roleGuard calls: ApiResponse.unauthorized(res)
    static unauthorized(res, message = 'Unauthorized') {
        return res.status(401).json({ success: false, error_code: 'UNAUTHORIZED', message });
    }
    // ── 403 Forbidden ─────────────────────────────────────────────────────
    // roleGuard calls: ApiResponse.forbidden(res, 'You do not have permission...')  — 2 args
    // future use:      ApiResponse.forbidden(res, 'ERROR_CODE', 'message')          — 3 args
    static forbidden(res, errorCodeOrMessage, message) {
        return res.status(403).json({
            success: false,
            error_code: message !== undefined ? errorCodeOrMessage : 'FORBIDDEN',
            message: message !== undefined ? message : errorCodeOrMessage,
        });
    }
    // ── 404 Not Found ─────────────────────────────────────────────────────
    // errorHandler calls: ApiResponse.notFound(res, 'Record not found')
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message });
    }
    // ── 422 Validation Error ──────────────────────────────────────────────
    // validate.ts calls: ApiResponse.validationError(res, errorsArray)
    // also supports:     ApiResponse.validationError(res, 'message', errorsArray)
    static validationError(res, messageOrErrors, errors) {
        const isArray = Array.isArray(messageOrErrors);
        return res.status(422).json({
            success: false,
            error_code: 'VALIDATION_FAILED',
            message: isArray ? 'Validation failed' : messageOrErrors,
            errors: isArray ? messageOrErrors : errors,
        });
    }
    // ── 500 Internal Error ────────────────────────────────────────────────
    // errorHandler calls: ApiResponse.internalError(res, 'Database error')
    // also calls:         ApiResponse.internalError(res)
    static internalError(res, message = 'Internal server error') {
        return res.status(500).json({ success: false, error_code: 'INTERNAL_ERROR', message });
    }
    // ── Generic error ─────────────────────────────────────────────────────
    // errorHandler calls: ApiResponse.error(res, code, message, statusCode, error.errors)  — 5 args
    static error(res, errorCode, message, statusCode = 400, errors) {
        return res.status(statusCode).json({
            success: false,
            error_code: errorCode,
            message,
            ...(errors ? { errors } : {}),
        });
    }
    // ── Paginated ─────────────────────────────────────────────────────────
    static paginated(res, data, meta, message) {
        return res.status(200).json({
            success: true,
            ...(message ? { message } : {}),
            data,
            meta: {
                total: meta.total,
                page: meta.page,
                limit: meta.limit,
                totalPages: meta.totalPages,
                hasNext: meta.page < meta.totalPages,
                hasPrev: meta.page > 1,
            },
        });
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=apiResponse.js.map