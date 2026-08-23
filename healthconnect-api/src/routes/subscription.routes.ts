import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public catalog. Checkout/verification remains authenticated and role-bound.
router.get('/plans', subscriptionController.getPlans);

router.use(authenticate);

router.get('/current', subscriptionController.getCurrentSubscription);
router.get('/billing-history', subscriptionController.getBillingHistory);
router.post('/checkout', subscriptionController.createCheckout);
router.post('/verify', subscriptionController.verifyCheckout);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/change', subscriptionController.changePlan);

// Razorpay webhook is intentionally mounted in app.ts before express.json()
// so signature verification receives the exact raw request body.

export default router;
