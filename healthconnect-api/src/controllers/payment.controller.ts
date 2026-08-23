import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { BillingError } from '../services/razorpayBilling.service';
import {
  createAppointmentCheckout,
  getAppointmentReceipt,
  getDoctorPaymentSummary,
  getPatientAppointmentPayments,
  verifyAppointmentCheckout,
} from '../services/appointmentBilling.service';

const handleBillingError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof BillingError) {
    return ApiResponse.error(res, error.code, error.message, error.statusCode);
  }
  return next(error);
};

export const listPatientAppointmentPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await getPatientAppointmentPayments(req.user!.userId));
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const createAppointmentPaymentCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createAppointmentCheckout({
      userId: req.user!.userId,
      appointmentId: req.params.appointmentId,
    });
    return ApiResponse.created(res, result, result.paymentRequired ? 'Appointment payment order created' : result.message);
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const verifyAppointmentPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await verifyAppointmentCheckout({
      userId: req.user!.userId,
      appointmentId: req.params.appointmentId,
      orderId: String(req.body?.razorpay_order_id || req.body?.orderId || ''),
      paymentId: String(req.body?.razorpay_payment_id || req.body?.paymentId || ''),
      signature: String(req.body?.razorpay_signature || req.body?.signature || ''),
    });
    return ApiResponse.success(res, result, 'Appointment payment verified');
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const getPatientAppointmentReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await getAppointmentReceipt(req.user!.userId, req.params.appointmentId));
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};

export const getDoctorBillingSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, await getDoctorPaymentSummary(req.user!.userId));
  } catch (error) {
    return handleBillingError(error, res, next);
  }
};
