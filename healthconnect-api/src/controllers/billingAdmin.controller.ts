import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { BillingError } from '../services/razorpayBilling.service';
import { getAdminBillingSummary, refundBillingPayment } from '../services/billingAdmin.service';

const handleBillingError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof BillingError) {
    return ApiResponse.error(res, error.code, error.message, error.statusCode);
  }
  return next(error);
};

export const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await getAdminBillingSummary());
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const refundPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceKind = String(req.body?.sourceKind || '').trim().toUpperCase();
    const sourceId = String(req.body?.sourceId || '').trim();
    if (!sourceKind || !sourceId) {
      return ApiResponse.validationError(res, [
        { field: 'sourceKind', message: 'sourceKind is required' },
        { field: 'sourceId', message: 'sourceId is required' },
      ]);
    }
    const amountPaise = req.body?.amountPaise == null ? null : Number(req.body.amountPaise);
    if (amountPaise != null && (!Number.isFinite(amountPaise) || amountPaise <= 0)) {
      return ApiResponse.validationError(res, [{ field: 'amountPaise', message: 'amountPaise must be a positive integer' }]);
    }
    const result = await refundBillingPayment({
      sourceKind,
      sourceId,
      amountPaise: amountPaise == null ? null : Math.round(amountPaise),
      reason: req.body?.reason ? String(req.body.reason).slice(0, 500) : null,
    });
    return ApiResponse.success(res, result, 'Refund submitted to Razorpay');
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};
