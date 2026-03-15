import { Router } from 'express';
import * as communityController from '../controllers/community.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { communitySearchSchema, createPostSchema, createCommentSchema, reactionSchema } from '../validators/community.validator';

const router = Router();

// Public routes
router.get('/', optionalAuth, validate(communitySearchSchema, 'query'), communityController.getCommunities);
router.get('/featured', communityController.getFeaturedCommunities);
router.get('/recommended', authenticate, communityController.getRecommendedCommunities);
router.get('/:slug', optionalAuth, communityController.getCommunity);

// Protected routes
router.use(authenticate);

router.post('/:id/join', communityController.joinCommunity);
router.delete('/:id/leave', communityController.leaveCommunity);
router.post('/:id/follow', communityController.followCommunity);

// Posts
router.get('/:id/posts', communityController.getCommunityPosts);
router.get('/:id/posts/recent', communityController.getRecentPosts);
router.post('/:id/posts', validate(createPostSchema), communityController.createPost);
router.put('/:id/posts/:postId', communityController.updatePost);
router.delete('/:id/posts/:postId', communityController.deletePost);

// Comments
router.get('/posts/:postId/comments', communityController.getPostComments);
router.post('/posts/:postId/comments', validate(createCommentSchema), communityController.createComment);
router.delete('/comments/:commentId', communityController.deleteComment);

// Reactions
router.post('/posts/:postId/react', validate(reactionSchema), communityController.reactToPost);
router.delete('/posts/:postId/react', communityController.removeReaction);

export default router;
