import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/plans', subscriptionController.getPlans);

router.use(authenticate);

router.get('/current', subscriptionController.getCurrentSubscription);
router.get('/billing-history', subscriptionController.getBillingHistory);
router.post('/checkout', subscriptionController.createCheckout);
router.post('/webhook', subscriptionController.handleWebhook);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/change', subscriptionController.changePlan);

export default router;
