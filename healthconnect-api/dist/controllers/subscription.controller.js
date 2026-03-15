"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePlan = exports.cancelSubscription = exports.handleWebhook = exports.createCheckout = exports.getBillingHistory = exports.getCurrentSubscription = exports.getPlans = void 0;
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const prisma = new client_1.PrismaClient();
const getPlans = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma.subscriptionPlan.findMany({ where: { isActive: true } }));
    }
    catch (e) {
        next(e);
    }
};
exports.getPlans = getPlans;
const getCurrentSubscription = async (req, res, next) => {
    try {
        const sub = await prisma.userSubscription.findFirst({ where: { userId: req.user.userId, status: 'ACTIVE' }, include: { plan: true } });
        return apiResponse_1.ApiResponse.success(res, sub);
    }
    catch (e) {
        next(e);
    }
};
exports.getCurrentSubscription = getCurrentSubscription;
const getBillingHistory = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma.userSubscription.findMany({ where: { userId: req.user.userId }, include: { plan: true }, orderBy: { startDate: 'desc' } }));
    }
    catch (e) {
        next(e);
    }
};
exports.getBillingHistory = getBillingHistory;
const createCheckout = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, { checkoutUrl: 'https://razorpay.com/checkout/placeholder' });
    }
    catch (e) {
        next(e);
    }
};
exports.createCheckout = createCheckout;
const handleWebhook = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, null, 'Webhook received');
    }
    catch (e) {
        next(e);
    }
};
exports.handleWebhook = handleWebhook;
const cancelSubscription = async (req, res, next) => {
    try {
        await prisma.userSubscription.updateMany({ where: { userId: req.user.userId, status: 'ACTIVE' }, data: { status: 'CANCELLED' } });
        return apiResponse_1.ApiResponse.success(res, null, 'Subscription cancelled');
    }
    catch (e) {
        next(e);
    }
};
exports.cancelSubscription = cancelSubscription;
const changePlan = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, null, 'Plan change initiated');
    }
    catch (e) {
        next(e);
    }
};
exports.changePlan = changePlan;
//# sourceMappingURL=subscription.controller.js.map