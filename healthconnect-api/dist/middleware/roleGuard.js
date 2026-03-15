"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePatientOrDoctor = exports.requireDoctorOrAdmin = exports.requireAdmin = exports.requireHospital = exports.requireDoctor = exports.requirePatient = exports.requireRole = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return apiResponse_1.ApiResponse.unauthorized(res);
        }
        if (!allowedRoles.includes(req.user.role)) {
            return apiResponse_1.ApiResponse.forbidden(res, 'You do not have permission to access this resource');
        }
        next();
    };
};
exports.requireRole = requireRole;
// Convenience middleware for specific roles
exports.requirePatient = (0, exports.requireRole)('PATIENT');
exports.requireDoctor = (0, exports.requireRole)('DOCTOR');
exports.requireHospital = (0, exports.requireRole)('HOSPITAL');
exports.requireAdmin = (0, exports.requireRole)('ADMIN');
exports.requireDoctorOrAdmin = (0, exports.requireRole)('DOCTOR', 'ADMIN');
exports.requirePatientOrDoctor = (0, exports.requireRole)('PATIENT', 'DOCTOR');
//# sourceMappingURL=roleGuard.js.map