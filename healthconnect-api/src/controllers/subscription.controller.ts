import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { BillingError } from '../services/razorpayBilling.service';
import {
  cancelUserSubscription,
  changeUserPlan,
  getCurrentSubscriptionForUser,
  getSubscriptionHistoryForUser,
} from '../services/subscriptionBilling.service';
import {
  getPublishedPlansForUser,
  prepareSubscriptionCheckout,
  verifySubscriptionCheckoutGuarded,
} from '../services/subscriptionCheckoutGuard.service';
import { processRazorpayWebhook } from '../services/billingWebhook.service';

const handleBillingError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof BillingError) {
    return ApiResponse.error(res, error.code, error.message, error.statusCode);
  }
  return next(error);
};

export const getPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await getPublishedPlansForUser(req.user?.userId || null));
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const getCurrentSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await getCurrentSubscriptionForUser(req.user!.userId));
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const getBillingHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await getSubscriptionHistoryForUser(req.user!.userId));
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const createCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planIdOrName = String(req.body?.planId || req.body?.plan || '').trim();
    if (!planIdOrName) {
      return ApiResponse.validationError(res, [{ field: 'planId', message: 'planId is required' }]);
    }
    const checkout = await prepareSubscriptionCheckout({
      userId: req.user!.userId,
      role: req.user!.role,
      planIdOrName,
      billingCycle: req.body?.billingCycle || 'MONTHLY',
      promotionCode: req.body?.promotionCode || null,
    });
    const reused = 'reused' in checkout && checkout.reused === true;
    return ApiResponse.created(res, checkout, reused ? 'Existing secure checkout resumed' : 'Subscription checkout created');
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const verifyCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await verifySubscriptionCheckoutGuarded({
      userId: req.user!.userId,
      paymentId: String(req.body?.razorpay_payment_id || req.body?.paymentId || ''),
      subscriptionId: String(req.body?.razorpay_subscription_id || req.body?.subscriptionId || ''),
      signature: String(req.body?.razorpay_signature || req.body?.signature || ''),
    });
    return ApiResponse.success(res, result, 'Subscription payment verified');
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    const result = await processRazorpayWebhook({
      rawBody,
      signature: req.header('x-razorpay-signature'),
      providerEventId: req.header('x-razorpay-event-id'),
    });
    return ApiResponse.success(res, result, result.duplicate ? 'Webhook already processed' : 'Webhook processed');
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await cancelUserSubscription({
      userId: req.user!.userId,
      atCycleEnd: req.body?.atCycleEnd !== false,
    });
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const changePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planIdOrName = String(req.body?.planId || req.body?.plan || '').trim();
    if (!planIdOrName) {
      return ApiResponse.validationError(res, [{ field: 'planId', message: 'planId is required' }]);
    }

    const result = await prepareSubscriptionCheckout({
      userId: req.user!.userId,
      role: req.user!.role,
      planIdOrName,
      billingCycle: req.body?.billingCycle || 'MONTHLY',
      promotionCode: req.body?.promotionCode || null,
    }).catch(async (error) => {
      if (error instanceof BillingError && error.code === 'FREE_PLAN_NO_CHECKOUT') {
        return changeUserPlan({
          userId: req.user!.userId,
          role: req.user!.role,
          planIdOrName,
          billingCycle: req.body?.billingCycle || 'MONTHLY',
          promotionCode: req.body?.promotionCode || null,
        });
      }
      throw error;
    });
    return ApiResponse.success(res, result, 'Plan change prepared');
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};
