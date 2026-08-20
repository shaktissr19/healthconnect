import { Router } from 'express';
import * as communityController from '../controllers/community.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  communitySearchSchema,
  postSearchSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  reactionSchema,
  createCommunityRequestSchema,
  createCommunityEventSchema,
  eventRsvpSchema,
  communityReportSchema,
  resolveCommunityReportSchema,
} from '../validators/community.validator';

const router = Router();

// ── Discovery / read routes ──────────────────────────────────────────────────
// Optional auth lets the API add real membership state without making PUBLIC
// communities inaccessible to visitors.
router.get('/', optionalAuth, validate(communitySearchSchema, 'query'), communityController.getCommunities);
router.get('/featured', optionalAuth, communityController.getFeaturedCommunities);
router.get('/recommended', authenticate, communityController.getRecommendedCommunities);
router.get('/request/status', authenticate, communityController.getMyCommunityRequest);
router.get('/posts/:postId/comments', optionalAuth, communityController.getPostComments);
router.get('/:id/posts/recent', optionalAuth, communityController.getRecentPosts);
router.get('/:id/posts', optionalAuth, validate(postSearchSchema, 'query'), communityController.getCommunityPosts);
router.get('/:id/events', optionalAuth, communityController.getCommunityEvents);
router.get('/:id/health-score', optionalAuth, communityController.getCommunityHealthScore);
router.get('/:slug', optionalAuth, communityController.getCommunity);

// ── Authenticated mutations ──────────────────────────────────────────────────
router.use(authenticate);

// Community requests
router.post('/request', validate(createCommunityRequestSchema), communityController.submitCommunityRequest);

// Membership
router.post('/:id/join', communityController.joinCommunity);
router.delete('/:id/leave', communityController.leaveCommunity);
// Kept only for backward compatibility. Controller returns 410 instead of false success.
router.post('/:id/follow', communityController.followCommunity);
router.get('/:id/members', communityController.getCommunityMembers);
router.get('/:id/membership-requests', communityController.getMembershipRequests);
router.patch('/:id/members/:memberId/approve', communityController.approveMembership);
router.delete('/:id/members/:memberId', communityController.rejectMembership);

// Posts
router.post('/:id/posts', validate(createPostSchema), communityController.createPost);
router.put('/:id/posts/:postId', validate(updatePostSchema), communityController.updatePost);
router.delete('/:id/posts/:postId', communityController.deletePost);
router.patch('/:id/posts/:postId/pin', communityController.setPostPinned);

// Comments
router.post('/posts/:postId/comments', validate(createCommentSchema), communityController.createComment);
router.delete('/comments/:commentId', communityController.deleteComment);

// Reactions
router.post('/posts/:postId/react', validate(reactionSchema), communityController.reactToPost);
router.delete('/posts/:postId/react', communityController.removeReaction);

// Events / Q&A foundation
router.post('/:id/events', validate(createCommunityEventSchema), communityController.createCommunityEvent);
router.post('/events/:eventId/rsvp', validate(eventRsvpSchema), communityController.rsvpCommunityEvent);
router.delete('/events/:eventId', communityController.cancelCommunityEvent);

// Reporting / moderation
router.post('/:id/reports', validate(communityReportSchema), communityController.reportCommunityContent);
router.get('/:id/reports', communityController.getCommunityReports);
router.patch('/:id/reports/:reportId', validate(resolveCommunityReportSchema), communityController.resolveCommunityReport);

export default router;
