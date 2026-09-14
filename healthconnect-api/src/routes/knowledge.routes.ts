import { Router } from 'express';
import * as Knowledge from '../controllers/knowledge.controller';

const router = Router();

router.get('/featured', Knowledge.getFeatured);
router.get('/categories', Knowledge.getCategories);
router.get('/items', Knowledge.getItems);
router.get('/items/:slug', Knowledge.getItemBySlug);

export default router;
