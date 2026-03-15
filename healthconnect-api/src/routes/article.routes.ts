import { Router } from 'express';
import * as articleController from '../controllers/article.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, articleController.getArticles);
router.get('/trending', articleController.getTrendingArticles);
router.get('/featured', articleController.getFeaturedArticles);
router.get('/categories', articleController.getCategories);
router.get('/:slug', optionalAuth, articleController.getArticle);

// Protected
router.post('/:id/bookmark', authenticate, articleController.bookmarkArticle);
router.delete('/:id/bookmark', authenticate, articleController.removeBookmark);
router.get('/bookmarks/my', authenticate, articleController.getMyBookmarks);

export default router;
