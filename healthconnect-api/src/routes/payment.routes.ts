import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { requireDoctor, requirePatient } from '../middleware/roleGuard';
import { requireVerifiedAccount } from '../middleware/verifiedAccount';

const router = Router();

router.use(authenticate);

router.get('/appointments', requirePatient, PaymentController.listPatientAppointmentPayments);
router.post(
  '/appointments/:appointmentId/checkout',
  requirePatient,
  requireVerifiedAccount(),
  PaymentController.createAppointmentPaymentCheckout,
);
router.post(
  '/appointments/:appointmentId/verify',
  requirePatient,
  requireVerifiedAccount(),
  PaymentController.verifyAppointmentPayment,
);
router.get('/appointments/:appointmentId/receipt', requirePatient, PaymentController.getPatientAppointmentReceipt);

router.get('/doctor/summary', requireDoctor, PaymentController.getDoctorBillingSummary);

export default router;
