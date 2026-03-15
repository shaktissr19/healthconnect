"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const communityController = __importStar(require("../controllers/community.controller"));
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const community_validator_1 = require("../validators/community.validator");
const router = (0, express_1.Router)();
// Public routes
router.get('/', auth_1.optionalAuth, (0, validate_1.validate)(community_validator_1.communitySearchSchema, 'query'), communityController.getCommunities);
router.get('/featured', communityController.getFeaturedCommunities);
router.get('/recommended', auth_1.authenticate, communityController.getRecommendedCommunities);
router.get('/:slug', auth_1.optionalAuth, communityController.getCommunity);
// Protected routes
router.use(auth_1.authenticate);
router.post('/:id/join', communityController.joinCommunity);
router.delete('/:id/leave', communityController.leaveCommunity);
router.post('/:id/follow', communityController.followCommunity);
// Posts
router.get('/:id/posts', communityController.getCommunityPosts);
router.get('/:id/posts/recent', communityController.getRecentPosts);
router.post('/:id/posts', (0, validate_1.validate)(community_validator_1.createPostSchema), communityController.createPost);
router.put('/:id/posts/:postId', communityController.updatePost);
router.delete('/:id/posts/:postId', communityController.deletePost);
// Comments
router.get('/posts/:postId/comments', communityController.getPostComments);
router.post('/posts/:postId/comments', (0, validate_1.validate)(community_validator_1.createCommentSchema), communityController.createComment);
router.delete('/comments/:commentId', communityController.deleteComment);
// Reactions
router.post('/posts/:postId/react', (0, validate_1.validate)(community_validator_1.reactionSchema), communityController.reactToPost);
router.delete('/posts/:postId/react', communityController.removeReaction);
exports.default = router;
//# sourceMappingURL=community.routes.js.map