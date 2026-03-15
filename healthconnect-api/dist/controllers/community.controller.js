"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeopleLikeMe = exports.getCommunityHealthScore = exports.getMyBookmarks = exports.toggleBookmark = exports.votePoll = exports.createPoll = exports.getCommunityPolls = exports.submitCommunityRequest = exports.removeReaction = exports.reactToPost = exports.deleteComment = exports.createComment = exports.getPostComments = exports.deletePost = exports.updatePost = exports.createPost = exports.getRecentPosts = exports.getCommunityPosts = exports.followCommunity = exports.leaveCommunity = exports.joinCommunity = exports.getCommunity = exports.getRecommendedCommunities = exports.getFeaturedCommunities = exports.getCommunities = void 0;
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const prisma = new client_1.PrismaClient();
// ─── helpers ────────────────────────────────────────────────────────────────
const memberCount = (communityId) => prisma.communityMember.count({ where: { communityId, isApproved: true } });
const postCount = (communityId) => prisma.post.count({ where: { communityId, status: 'PUBLISHED' } });
const isUserMember = async (communityId, userId) => {
    if (!userId)
        return false;
    const m = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } },
    });
    return !!m;
};
const enrichCommunity = async (c, userId) => ({
    ...c,
    member_count: await memberCount(c.id),
    post_count: await postCount(c.id),
    is_joined: await isUserMember(c.id, userId),
    allows_anonymous: c.allowAnonymous,
    type: c.visibility,
});
const aggregateReactions = async (postId) => {
    const rows = await prisma.postReaction.groupBy({
        by: ['reactionType'],
        where: { postId },
        _count: { reactionType: true },
    });
    const map = { LIKE: 0, SUPPORT: 0, HELPFUL: 0 };
    rows.forEach(r => { map[r.reactionType] = r._count.reactionType; });
    return map;
};
const enrichPost = async (post, userId) => {
    const [reactions, commentCount, userReaction, author] = await Promise.all([
        aggregateReactions(post.id),
        prisma.comment.count({ where: { postId: post.id, isRemoved: false } }),
        userId
            ? prisma.postReaction.findFirst({
                where: { postId: post.id, userId },
                select: { reactionType: true },
            })
            : null,
        post.isAnonymous
            ? null
            : prisma.user.findUnique({
                where: { id: post.authorId },
                select: {
                    doctorProfile: { select: { firstName: true, lastName: true, isVerified: true } },
                    patientProfile: { select: { firstName: true, lastName: true } },
                },
            }),
    ]);
    let author_name = 'Anonymous Member';
    let is_doctor = false;
    if (!post.isAnonymous && author) {
        if (author.doctorProfile) {
            author_name = `Dr. ${author.doctorProfile.firstName} ${author.doctorProfile.lastName}`;
            is_doctor = author.doctorProfile.isVerified;
        }
        else if (author.patientProfile) {
            const p = author.patientProfile;
            author_name = `${p.firstName} ${p.lastName.charAt(0)}.`;
        }
    }
    return {
        ...post,
        author_name,
        is_doctor,
        comment_count: commentCount,
        reactions: {
            like: reactions.LIKE,
            support: reactions.SUPPORT,
            helpful: reactions.HELPFUL,
        },
        user_reaction: userReaction?.reactionType?.toLowerCase() ?? null,
    };
};
// ─── GET /api/communities ────────────────────────────────────────────────────
const getCommunities = async (req, res, next) => {
    try {
        const { category, search, featured } = req.query;
        const where = { isActive: true };
        if (category && category !== 'all')
            where.category = category;
        if (featured === 'true')
            where.isFeatured = true;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ];
        }
        const communities = await prisma.community.findMany({
            where,
            orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
        });
        const enriched = await Promise.all(communities.map(c => enrichCommunity(c, req.user?.userId)));
        return apiResponse_1.ApiResponse.success(res, enriched);
    }
    catch (e) {
        next(e);
    }
};
exports.getCommunities = getCommunities;
// ─── GET /api/communities/featured ──────────────────────────────────────────
const getFeaturedCommunities = async (req, res, next) => {
    try {
        const communities = await prisma.community.findMany({
            where: { isActive: true, isFeatured: true },
            orderBy: { createdAt: 'asc' },
        });
        const enriched = await Promise.all(communities.map(c => enrichCommunity(c, req.user?.userId)));
        return apiResponse_1.ApiResponse.success(res, enriched);
    }
    catch (e) {
        next(e);
    }
};
exports.getFeaturedCommunities = getFeaturedCommunities;
// ─── GET /api/communities/recommended ───────────────────────────────────────
const getRecommendedCommunities = async (req, res, next) => {
    try {
        const communities = await prisma.community.findMany({
            where: { isActive: true },
            take: 6,
            orderBy: { createdAt: 'asc' },
        });
        const enriched = await Promise.all(communities.map(c => enrichCommunity(c, req.user?.userId)));
        return apiResponse_1.ApiResponse.success(res, enriched);
    }
    catch (e) {
        next(e);
    }
};
exports.getRecommendedCommunities = getRecommendedCommunities;
// ─── GET /api/communities/:slug ──────────────────────────────────────────────
const getCommunity = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const community = await prisma.community.findFirst({
            where: { isActive: true, OR: [{ slug }, { id: slug }] },
        });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const enriched = await enrichCommunity(community, req.user?.userId);
        return apiResponse_1.ApiResponse.success(res, enriched);
    }
    catch (e) {
        next(e);
    }
};
exports.getCommunity = getCommunity;
// ─── POST /api/communities/:id/join ─────────────────────────────────────────
const joinCommunity = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id: communityId } = req.params;
        const community = await prisma.community.findFirst({
            where: { OR: [{ id: communityId }, { slug: communityId }] },
        });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const existing = await prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: community.id, userId } },
        });
        if (existing)
            return apiResponse_1.ApiResponse.success(res, existing, 'Already a member');
        const member = await prisma.communityMember.create({
            data: {
                communityId: community.id,
                userId,
                role: 'MEMBER',
                isApproved: !community.requireApproval,
            },
        });
        return apiResponse_1.ApiResponse.success(res, member, 'Joined successfully');
    }
    catch (e) {
        next(e);
    }
};
exports.joinCommunity = joinCommunity;
// ─── DELETE /api/communities/:id/leave ──────────────────────────────────────
const leaveCommunity = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id: communityId } = req.params;
        await prisma.communityMember.deleteMany({ where: { communityId, userId } });
        return apiResponse_1.ApiResponse.success(res, null, 'Left community');
    }
    catch (e) {
        next(e);
    }
};
exports.leaveCommunity = leaveCommunity;
// ─── POST /api/communities/:id/follow ───────────────────────────────────────
const followCommunity = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, null, 'Following community');
    }
    catch (e) {
        next(e);
    }
};
exports.followCommunity = followCommunity;
// ─── GET /api/communities/:id/posts ─────────────────────────────────────────
const getCommunityPosts = async (req, res, next) => {
    try {
        const { id: communityId } = req.params;
        const { sort = 'latest' } = req.query;
        const page = Math.max(1, parseInt(req.query.page || '1'));
        const limit = Math.min(50, parseInt(req.query.limit || '20'));
        const community = await prisma.community.findFirst({
            where: { OR: [{ id: communityId }, { slug: communityId }] },
            select: { id: true },
        });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const where = { communityId: community.id, status: 'PUBLISHED' };
        const orderBy = sort === 'popular'
            ? [{ viewCount: 'desc' }, { createdAt: 'desc' }]
            : [{ isPinned: 'desc' }, { createdAt: 'desc' }];
        const [posts, total] = await Promise.all([
            prisma.post.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
            prisma.post.count({ where }),
        ]);
        const enriched = await Promise.all(posts.map(p => enrichPost(p, req.user?.userId)));
        return apiResponse_1.ApiResponse.success(res, { posts: enriched, total, page, limit });
    }
    catch (e) {
        next(e);
    }
};
exports.getCommunityPosts = getCommunityPosts;
// ─── GET /api/communities/:id/posts/recent ───────────────────────────────────
const getRecentPosts = async (req, res, next) => {
    try {
        const { id: communityId } = req.params;
        const community = await prisma.community.findFirst({
            where: { OR: [{ id: communityId }, { slug: communityId }] },
            select: { id: true },
        });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const posts = await prisma.post.findMany({
            where: { communityId: community.id, status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        const enriched = await Promise.all(posts.map(p => enrichPost(p, req.user?.userId)));
        return apiResponse_1.ApiResponse.success(res, enriched);
    }
    catch (e) {
        next(e);
    }
};
exports.getRecentPosts = getRecentPosts;
// ─── POST /api/communities/:id/posts ────────────────────────────────────────
const createPost = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id: communityId } = req.params;
        const { body, title, tags, isAnonymous, anonymousAlias } = req.body;
        if (!body?.trim())
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Post body is required', 400);
        const community = await prisma.community.findFirst({
            where: { OR: [{ id: communityId }, { slug: communityId }] },
        });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const member = await prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: community.id, userId } },
        });
        if (!member)
            return apiResponse_1.ApiResponse.forbidden(res, 'Join the community to post');
        const post = await prisma.post.create({
            data: {
                communityId: community.id,
                authorId: userId,
                body: body.trim(),
                title: title?.trim() || null,
                tags: tags || [],
                isAnonymous: isAnonymous && community.allowAnonymous ? true : false,
                anonymousAlias: isAnonymous ? (anonymousAlias || 'Anonymous Member') : null,
                status: 'PUBLISHED',
            },
        });
        const enriched = await enrichPost(post, userId);
        return apiResponse_1.ApiResponse.created(res, enriched);
    }
    catch (e) {
        next(e);
    }
};
exports.createPost = createPost;
// ─── PUT /api/communities/:id/posts/:postId ──────────────────────────────────
const updatePost = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;
        const { body, title, tags } = req.body;
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            return apiResponse_1.ApiResponse.notFound(res, 'Post not found');
        if (post.authorId !== userId)
            return apiResponse_1.ApiResponse.forbidden(res, 'Not your post');
        const updated = await prisma.post.update({
            where: { id: postId },
            data: { body, title, tags, updatedAt: new Date() },
        });
        return apiResponse_1.ApiResponse.success(res, updated);
    }
    catch (e) {
        next(e);
    }
};
exports.updatePost = updatePost;
// ─── DELETE /api/communities/:id/posts/:postId ───────────────────────────────
const deletePost = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            return apiResponse_1.ApiResponse.notFound(res, 'Post not found');
        if (post.authorId !== userId)
            return apiResponse_1.ApiResponse.forbidden(res, 'Not your post');
        await prisma.post.delete({ where: { id: postId } });
        return apiResponse_1.ApiResponse.success(res, null, 'Post deleted');
    }
    catch (e) {
        next(e);
    }
};
exports.deletePost = deletePost;
// ─── GET /api/communities/posts/:postId/comments ─────────────────────────────
const getPostComments = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { postId, isRemoved: false, parentId: null },
            orderBy: { createdAt: 'asc' },
            include: {
                replies: {
                    where: { isRemoved: false },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        const enrich = async (c) => {
            let author_name = 'Anonymous Member';
            if (!c.isAnonymous) {
                const user = await prisma.user.findUnique({
                    where: { id: c.authorId },
                    select: {
                        doctorProfile: { select: { firstName: true, lastName: true } },
                        patientProfile: { select: { firstName: true, lastName: true } },
                    },
                });
                if (user?.doctorProfile) {
                    author_name = `Dr. ${user.doctorProfile.firstName} ${user.doctorProfile.lastName}`;
                }
                else if (user?.patientProfile) {
                    author_name = `${user.patientProfile.firstName} ${user.patientProfile.lastName.charAt(0)}.`;
                }
            }
            return { ...c, author_name, replies: await Promise.all((c.replies || []).map(enrich)) };
        };
        const enriched = await Promise.all(comments.map(enrich));
        return apiResponse_1.ApiResponse.success(res, enriched);
    }
    catch (e) {
        next(e);
    }
};
exports.getPostComments = getPostComments;
// ─── POST /api/communities/posts/:postId/comments ────────────────────────────
const createComment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;
        const { body, parentId, isAnonymous } = req.body;
        if (!body?.trim())
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Comment body is required', 400);
        const comment = await prisma.comment.create({
            data: {
                postId,
                authorId: userId,
                body: body.trim(),
                parentId: parentId || null,
                isAnonymous: !!isAnonymous,
            },
        });
        return apiResponse_1.ApiResponse.created(res, comment);
    }
    catch (e) {
        next(e);
    }
};
exports.createComment = createComment;
// ─── DELETE /api/communities/comments/:commentId ─────────────────────────────
const deleteComment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { commentId } = req.params;
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            return apiResponse_1.ApiResponse.notFound(res, 'Comment not found');
        if (comment.authorId !== userId)
            return apiResponse_1.ApiResponse.forbidden(res, 'Not your comment');
        await prisma.comment.update({ where: { id: commentId }, data: { isRemoved: true } });
        return apiResponse_1.ApiResponse.success(res, null, 'Comment removed');
    }
    catch (e) {
        next(e);
    }
};
exports.deleteComment = deleteComment;
// ─── POST /api/communities/posts/:postId/react ────────────────────────────────
const reactToPost = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;
        const { reactionType } = req.body;
        const validTypes = ['LIKE', 'SUPPORT', 'HELPFUL'];
        const type = reactionType?.toUpperCase();
        if (!validTypes.includes(type))
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Invalid reaction type. Use LIKE, SUPPORT or HELPFUL', 400);
        const existing = await prisma.postReaction.findUnique({
            where: { postId_userId_reactionType: { postId, userId, reactionType: type } },
        });
        if (existing) {
            await prisma.postReaction.delete({
                where: { postId_userId_reactionType: { postId, userId, reactionType: type } },
            });
            const reactions = await aggregateReactions(postId);
            return apiResponse_1.ApiResponse.success(res, { toggled: false, reactions });
        }
        await prisma.postReaction.create({ data: { postId, userId, reactionType: type } });
        const reactions = await aggregateReactions(postId);
        return apiResponse_1.ApiResponse.success(res, { toggled: true, reactions });
    }
    catch (e) {
        next(e);
    }
};
exports.reactToPost = reactToPost;
// ─── DELETE /api/communities/posts/:postId/react ──────────────────────────────
const removeReaction = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;
        const { reactionType } = req.query;
        if (reactionType) {
            await prisma.postReaction.deleteMany({
                where: { postId, userId, reactionType: reactionType.toUpperCase() },
            });
        }
        else {
            await prisma.postReaction.deleteMany({ where: { postId, userId } });
        }
        const reactions = await aggregateReactions(postId);
        return apiResponse_1.ApiResponse.success(res, { reactions });
    }
    catch (e) {
        next(e);
    }
};
exports.removeReaction = removeReaction;
const submitCommunityRequest = async (req, res, next) => {
    try {
        const { name, category, reason } = req.body;
        if (!name?.trim() || !reason?.trim())
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Name and reason are required', 400);
        const requestedBy = req.user?.userId || null;
        const requesterEmail = req.user?.userId
            ? (await prisma.user.findUnique({ where: { id: req.user.userId }, select: { email: true } }))?.email
            : null;
        await prisma.$executeRaw `
      INSERT INTO community_requests
        (id, name, category, reason, "requestedBy", "requesterEmail", status, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid()::text, ${name.trim()}, ${category || null}, ${reason.trim()},
         ${requestedBy}, ${requesterEmail || null}, 'PENDING', NOW(), NOW())
    `;
        return apiResponse_1.ApiResponse.created(res, null, 'Request submitted. Our team will review within 48 hours.');
    }
    catch (e) {
        next(e);
    }
};
exports.submitCommunityRequest = submitCommunityRequest;
// ─── POLLS ───────────────────────────────────────────────────────────────────
const getCommunityPolls = async (req, res, next) => {
    try {
        const { id: communityId } = req.params;
        const community = await prisma.community.findFirst({
            where: { OR: [{ id: communityId }, { slug: communityId }] },
            select: { id: true },
        });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const polls = await prisma.$queryRaw `
      SELECT
        cp.*,
        (SELECT COUNT(*) FROM poll_votes pv WHERE pv."pollId" = cp.id) as total_votes,
        (SELECT json_agg(json_build_object('optionIndex', pv2."optionIndex", 'count', pv2.cnt))
         FROM (
           SELECT "optionIndex", COUNT(*)::int as cnt FROM poll_votes
           WHERE "pollId" = cp.id GROUP BY "optionIndex"
         ) pv2) as vote_breakdown,
        ${req.user?.userId ? `(SELECT "optionIndex" FROM poll_votes WHERE "pollId" = cp.id AND "userId" = '${req.user.userId}' LIMIT 1)` : 'NULL'}::int as user_vote
      FROM community_polls cp
      WHERE cp."communityId" = ${community.id}
      AND cp."isActive" = true
      ORDER BY cp."createdAt" DESC
      LIMIT 10
    `;
        return apiResponse_1.ApiResponse.success(res, polls);
    }
    catch (e) {
        next(e);
    }
};
exports.getCommunityPolls = getCommunityPolls;
const createPoll = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id: communityId } = req.params;
        const { question, options, endsAt } = req.body;
        if (!question?.trim())
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Question is required', 400);
        if (!options || options.length < 2 || options.length > 6)
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Need 2-6 options', 400);
        // Must be a community member
        const community = await prisma.community.findFirst({
            where: { OR: [{ id: communityId }, { slug: communityId }] },
            select: { id: true },
        });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const member = await prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: community.id, userId } },
        });
        if (!member)
            return apiResponse_1.ApiResponse.forbidden(res, 'Join the community to create polls');
        const poll = await prisma.$queryRaw `
      INSERT INTO community_polls
        (id, "communityId", "createdBy", question, options, "endsAt", "isActive", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid()::text, ${community.id}, ${userId}, ${question.trim()},
         ${options}::text[], ${endsAt ? new Date(endsAt) : null}, true, NOW(), NOW())
      RETURNING *
    `;
        return apiResponse_1.ApiResponse.created(res, poll[0], 'Poll created');
    }
    catch (e) {
        next(e);
    }
};
exports.createPoll = createPoll;
const votePoll = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { pollId } = req.params;
        const { optionIndex } = req.body;
        if (optionIndex === undefined || optionIndex < 0)
            return apiResponse_1.ApiResponse.error(res, 'BAD_REQUEST', 'Valid optionIndex required', 400);
        // Upsert vote (change allowed)
        await prisma.$executeRaw `
      INSERT INTO poll_votes (id, "pollId", "userId", "optionIndex", "createdAt")
      VALUES (gen_random_uuid()::text, ${pollId}, ${userId}, ${optionIndex}, NOW())
      ON CONFLICT ("pollId", "userId") DO UPDATE SET "optionIndex" = ${optionIndex}
    `;
        // Return updated counts
        const breakdown = await prisma.$queryRaw `
      SELECT "optionIndex", COUNT(*)::int as count
      FROM poll_votes WHERE "pollId" = ${pollId}
      GROUP BY "optionIndex" ORDER BY "optionIndex"
    `;
        const total = breakdown.reduce((a, b) => a + b.count, 0);
        return apiResponse_1.ApiResponse.success(res, { breakdown, total, user_vote: optionIndex });
    }
    catch (e) {
        next(e);
    }
};
exports.votePoll = votePoll;
// ─── BOOKMARKS ───────────────────────────────────────────────────────────────
const toggleBookmark = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;
        const existing = await prisma.$queryRaw `
      SELECT id FROM post_bookmarks WHERE "postId" = ${postId} AND "userId" = ${userId} LIMIT 1
    `;
        if (existing.length > 0) {
            await prisma.$executeRaw `
        DELETE FROM post_bookmarks WHERE "postId" = ${postId} AND "userId" = ${userId}
      `;
            return apiResponse_1.ApiResponse.success(res, { bookmarked: false }, 'Bookmark removed');
        }
        else {
            await prisma.$executeRaw `
        INSERT INTO post_bookmarks (id, "postId", "userId", "createdAt")
        VALUES (gen_random_uuid()::text, ${postId}, ${userId}, NOW())
      `;
            return apiResponse_1.ApiResponse.success(res, { bookmarked: true }, 'Post bookmarked');
        }
    }
    catch (e) {
        next(e);
    }
};
exports.toggleBookmark = toggleBookmark;
const getMyBookmarks = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const bookmarks = await prisma.$queryRaw `
      SELECT pb."createdAt" as bookmarked_at, p.*,
        c.name as community_name, c.slug as community_slug, c.emoji as community_emoji
      FROM post_bookmarks pb
      JOIN posts p ON p.id = pb."postId"
      JOIN communities c ON c.id = p."communityId"
      WHERE pb."userId" = ${userId}
      ORDER BY pb."createdAt" DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
        return apiResponse_1.ApiResponse.success(res, bookmarks);
    }
    catch (e) {
        next(e);
    }
};
exports.getMyBookmarks = getMyBookmarks;
// ─── COMMUNITY HEALTH SCORE ───────────────────────────────────────────────────
const getCommunityHealthScore = async (req, res, next) => {
    try {
        const { id: slugOrId } = req.params;
        const community = await prisma.community.findFirst({
            where: { OR: [{ id: slugOrId }, { slug: slugOrId }] },
            select: { id: true, name: true },
        });
        if (!community)
            return apiResponse_1.ApiResponse.notFound(res, 'Community not found');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        const [totalMembers, totalPosts, recentPosts, doctorMembers, totalReactions,] = await Promise.all([
            prisma.communityMember.count({ where: { communityId: community.id, isApproved: true } }),
            prisma.post.count({ where: { communityId: community.id, status: 'PUBLISHED' } }),
            prisma.post.count({ where: { communityId: community.id, status: 'PUBLISHED', createdAt: { gte: thirtyDaysAgo } } }),
            // Count doctor moderators
            prisma.$queryRaw `
        SELECT COUNT(*)::int as count FROM community_members cm
        JOIN users u ON u.id = cm."userId"
        WHERE cm."communityId" = ${community.id} AND u.role = 'DOCTOR'
      `,
            prisma.postReaction.count({
                where: { post: { communityId: community.id } },
            }),
        ]);
        const drCount = doctorMembers[0]?.count || 0;
        // Score calculation (0-100)
        const activityScore = Math.min(recentPosts * 3, 30); // max 30 pts
        const engagementScore = Math.min((totalReactions / Math.max(totalPosts, 1)) * 10, 20); // max 20 pts
        const memberScore = Math.min(totalMembers / 50, 20); // max 20 pts
        const doctorScore = Math.min(drCount * 10, 20); // max 20 pts
        const baseScore = 10; // base 10 pts
        const total = Math.round(baseScore + activityScore + engagementScore + memberScore + doctorScore);
        const grade = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : total >= 35 ? 'D' : 'F';
        return apiResponse_1.ApiResponse.success(res, {
            score: total,
            grade,
            breakdown: {
                activity: Math.round(activityScore),
                engagement: Math.round(engagementScore),
                membership: Math.round(memberScore),
                doctorPresence: Math.round(doctorScore),
            },
            meta: { totalMembers, totalPosts, recentPosts, doctorParticipants: drCount },
            label: total >= 80 ? 'Thriving' : total >= 65 ? 'Active' : total >= 50 ? 'Growing' : total >= 35 ? 'Early Stage' : 'Needs Attention',
        });
    }
    catch (e) {
        next(e);
    }
};
exports.getCommunityHealthScore = getCommunityHealthScore;
// ─── PEOPLE LIKE ME MATCHING ──────────────────────────────────────────────────
const getPeopleLikeMe = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        // Find user's joined communities
        const myMemberships = await prisma.communityMember.findMany({
            where: { userId, isApproved: true },
            select: { communityId: true },
        });
        const myCommunityIds = myMemberships.map(m => m.communityId);
        if (myCommunityIds.length === 0)
            return apiResponse_1.ApiResponse.success(res, [], 'Join communities to find matches');
        // Find users in same communities (excluding self)
        const matches = await prisma.$queryRaw `
      SELECT
        u.id,
        COALESCE(pp."firstName", 'Member') as first_name,
        COALESCE(pp.city, '') as city,
        COUNT(DISTINCT cm."communityId")::int as shared_communities,
        ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as community_names
      FROM community_members cm
      JOIN users u ON u.id = cm."userId"
      LEFT JOIN patient_profiles pp ON pp."userId" = u.id
      JOIN communities c ON c.id = cm."communityId"
      WHERE cm."communityId" = ANY(${myCommunityIds}::text[])
        AND cm."userId" != ${userId}
        AND cm."isApproved" = true
      GROUP BY u.id, pp."firstName", pp.city
      ORDER BY shared_communities DESC
      LIMIT 10
    `;
        return apiResponse_1.ApiResponse.success(res, matches);
    }
    catch (e) {
        next(e);
    }
};
exports.getPeopleLikeMe = getPeopleLikeMe;
//# sourceMappingURL=community.controller.js.map