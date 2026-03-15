"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSubscription = void 0;
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const prisma = new client_1.PrismaClient();
const requireSubscription = (featureName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return apiResponse_1.ApiResponse.unauthorized(res);
            }
            const subscription = await prisma.userSubscription.findFirst({
                where: {
                    userId: req.user.userId,
                    status: 'ACTIVE',
                    endDate: { gt: new Date() },
                },
                include: {
                    plan: true,
                },
            });
            if (!subscription) {
                return apiResponse_1.ApiResponse.error(res, 'SUBSCRIPTION_REQUIRED', 'Premium subscription required for this feature', 403);
            }
            // Check specific feature if provided
            if (featureName && subscription.plan.features) {
                const features = subscription.plan.features;
                if (!features[featureName]) {
                    return apiResponse_1.ApiResponse.error(res, 'SUBSCRIPTION_REQUIRED', `Your plan does not include ${featureName}`, 403);
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireSubscription = requireSubscription;
//# sourceMappingURL=subscription.js.map