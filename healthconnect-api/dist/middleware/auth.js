"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiResponse_1.ApiResponse.unauthorized(res, 'No token provided');
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = (0, jwt_1.verifyToken)(token);
            req.user = decoded;
            next();
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                return apiResponse_1.ApiResponse.error(res, 'TOKEN_EXPIRED', 'Token has expired', 401);
            }
            return apiResponse_1.ApiResponse.error(res, 'INVALID_TOKEN', 'Invalid token', 401);
        }
    }
    catch (error) {
        logger_1.logger.error('Auth middleware error:', error);
        return apiResponse_1.ApiResponse.internalError(res);
    }
};
exports.authenticate = authenticate;
// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                req.user = (0, jwt_1.verifyToken)(token);
            }
            catch {
                // Ignore invalid tokens for optional auth
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map