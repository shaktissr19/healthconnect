"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactionSchema = exports.createCommentSchema = exports.createPostSchema = exports.communitySearchSchema = void 0;
const zod_1 = require("zod");
exports.communitySearchSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    visibility: zod_1.z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']).optional(),
    language: zod_1.z.string().optional(),
    featured: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
exports.createPostSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    body: zod_1.z.string().min(1, 'Post content is required'),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isAnonymous: zod_1.z.boolean().optional(),
});
exports.createCommentSchema = zod_1.z.object({
    body: zod_1.z.string().min(1, 'Comment is required'),
    parentId: zod_1.z.string().uuid().optional(),
    isAnonymous: zod_1.z.boolean().optional(),
});
exports.reactionSchema = zod_1.z.object({
    reactionType: zod_1.z.enum(['LIKE', 'SUPPORT', 'HELPFUL']),
});
//# sourceMappingURL=community.validator.js.map