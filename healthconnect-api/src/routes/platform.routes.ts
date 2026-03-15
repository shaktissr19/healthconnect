import { Router } from 'express';
import * as platformController from '../controllers/platform.controller';

const router = Router();

router.get('/stats', platformController.getPlatformStats);
router.post('/newsletter/subscribe', platformController.subscribeNewsletter);

export default router;
