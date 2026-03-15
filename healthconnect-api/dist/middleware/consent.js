"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireConsent = void 0;
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const prisma = new client_1.PrismaClient();
const requireConsent = (patientIdParam = 'patientId') => {
    return async (req, res, next) => {
        try {
            if (!req.user || req.user.role !== 'DOCTOR') {
                return next();
            }
            const patientId = req.params[patientIdParam] || req.body.patientId;
            if (!patientId) {
                return apiResponse_1.ApiResponse.error(res, 'INVALID_INPUT', 'Patient ID required', 400);
            }
            const consent = await prisma.patientConsent.findFirst({
                where: {
                    patientId,
                    doctorId: req.user.userId,
                    status: 'ACTIVE',
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                    ],
                },
            });
            if (!consent) {
                return apiResponse_1.ApiResponse.error(res, 'CONSENT_REQUIRED', 'Patient consent required to access this data', 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireConsent = requireConsent;
//# sourceMappingURL=consent.js.map