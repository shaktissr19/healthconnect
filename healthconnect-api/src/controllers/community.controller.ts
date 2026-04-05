import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ReactionType } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────

const memberCount = (communityId: string) =>
  prisma.communityMember.count({ where: { communityId, isApproved: true } });

const postCount = (communityId: string) =>
  prisma.post.count({ where: { communityId, status: 'PUBLISHED' } });

const isUserMember = async (communityId: string, userId?: string) => {
  if (!userId) return false;
  const m = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  return !!m;
};

const enrichCommunity = async (c: any, userId?: string) => ({
  ...c,
  member_count:     await memberCount(c.id),
  post_count:       await postCount(c.id),
  is_joined:        await isUserMember(c.id, userId),
  allows_anonymous: c.allowAnonymous,
  type:             c.visibility,
});

const aggregateReactions = async (postId: string) => {
  const rows = await prisma.postReaction.groupBy({
    by: ['reactionType'],
    where: { postId },
    _count: { reactionType: true },
  });
  const map: Record<string, number> = { LIKE: 0, SUPPORT: 0, HELPFUL: 0 };
  rows.forEach(r => { map[r.reactionType] = r._count.reactionType; });
  return map;
};

const enrichPost = async (post: any, userId?: string) => {
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
            doctorProfile:  { select: { firstName: true, lastName: true, isVerified: true } },
            patientProfile: { select: { firstName: true, lastName: true } },
          },
        }),
  ]);

  let author_name = 'Anonymous Member';
  let is_doctor   = false;

  if (!post.isAnonymous && author) {
    if (author.doctorProfile) {
      author_name = `Dr. ${author.doctorProfile.firstName} ${author.doctorProfile.lastName}`;
      is_doctor   = author.doctorProfile.isVerified;
    } else if (author.patientProfile) {
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
      like:    reactions.LIKE,
      support: reactions.SUPPORT,
      helpful: reactions.HELPFUL,
    },
    user_reaction: userReaction?.reactionType?.toLowerCase() ?? null,
  };
};

// ─── GET /api/communities ────────────────────────────────────────────────────
export const getCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, featured } = req.query as Record<string, string>;
    const where: any = { isActive: true };
    if (category && category !== 'all') where.category = category;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category:    { contains: search, mode: 'insensitive' } },
      ];
    }
    const communities = await prisma.community.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
    });
    const enriched = await Promise.all(communities.map(c => enrichCommunity(c, req.user?.userId)));
    return ApiResponse.success(res, enriched);
  } catch (e) { next(e); }
};

// ─── GET /api/communities/featured ──────────────────────────────────────────
export const getFeaturedCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communities = await prisma.community.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: 'asc' },
    });
    const enriched = await Promise.all(
      communities.map(c => enrichCommunity(c, (req as any).user?.userId))
    );
    return ApiResponse.success(res, enriched);
  } catch (e) { next(e); }
};

// ─── GET /api/communities/recommended ───────────────────────────────────────
export const getRecommendedCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communities = await prisma.community.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { createdAt: 'asc' },
    });
    const enriched = await Promise.all(communities.map(c => enrichCommunity(c, req.user?.userId)));
    return ApiResponse.success(res, enriched);
  } catch (e) { next(e); }
};

// ─── GET /api/communities/:slug ──────────────────────────────────────────────
export const getCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const community = await prisma.community.findFirst({
      where: { isActive: true, OR: [{ slug }, { id: slug }] },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const enriched = await enrichCommunity(community, req.user?.userId);
    return ApiResponse.success(res, enriched);
  } catch (e) { next(e); }
};

// ─── POST /api/communities/:id/join ─────────────────────────────────────────
export const joinCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id: communityId } = req.params;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');

    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (existing) return ApiResponse.success(res, existing, 'Already a member');

    const member = await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId,
        role: 'MEMBER',
        isApproved: !community.requireApproval,
      },
    });
    return ApiResponse.success(res, member, 'Joined successfully');
  } catch (e) { next(e); }
};

// ─── DELETE /api/communities/:id/leave ──────────────────────────────────────
export const leaveCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id: communityId } = req.params;
    await prisma.communityMember.deleteMany({ where: { communityId, userId } });
    return ApiResponse.success(res, null, 'Left community');
  } catch (e) { next(e); }
};

// ─── POST /api/communities/:id/follow ───────────────────────────────────────
export const followCommunity = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return ApiResponse.success(res, null, 'Following community');
  } catch (e) { next(e); }
};

// ─── GET /api/communities/:id/posts ─────────────────────────────────────────
export const getCommunityPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: communityId } = req.params;
    const { sort = 'latest' } = req.query as Record<string, string>;
    const page  = Math.max(1, parseInt((req.query.page  as string) || '1'));
    const limit = Math.min(50, parseInt((req.query.limit as string) || '20'));

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
      select: { id: true },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');

    const where: any = { communityId: community.id, status: 'PUBLISHED' };
    const orderBy: any =
      sort === 'popular'
        ? [{ viewCount: 'desc' }, { createdAt: 'desc' }]
        : [{ isPinned: 'desc' }, { createdAt: 'desc' }];

    const [posts, total] = await Promise.all([
      prisma.post.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.post.count({ where }),
    ]);

    const enriched = await Promise.all(posts.map(p => enrichPost(p, req.user?.userId)));
    return ApiResponse.success(res, { posts: enriched, total, page, limit });
  } catch (e) { next(e); }
};

// ─── GET /api/communities/:id/posts/recent ───────────────────────────────────
export const getRecentPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: communityId } = req.params;
    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
      select: { id: true },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');

    const posts = await prisma.post.findMany({
      where: { communityId: community.id, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const enriched = await Promise.all(posts.map(p => enrichPost(p, req.user?.userId)));
    return ApiResponse.success(res, enriched);
  } catch (e) { next(e); }
};

// ─── POST /api/communities/:id/posts ────────────────────────────────────────
export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id: communityId } = req.params;
    const { body, title, tags, isAnonymous, anonymousAlias } = req.body;

    if (!body?.trim())
      return ApiResponse.error(res, 'BAD_REQUEST', 'Post body is required', 400);

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (!member) return ApiResponse.forbidden(res, 'Join the community to post');

    const post = await prisma.post.create({
      data: {
        communityId:    community.id,
        authorId:       userId,
        body:           body.trim(),
        title:          title?.trim() || null,
        tags:           tags || [],
        isAnonymous:    isAnonymous && community.allowAnonymous ? true : false,
        anonymousAlias: isAnonymous ? (anonymousAlias || 'Anonymous Member') : null,
        status:         'PUBLISHED',
      },
    });

    const enriched = await enrichPost(post, userId);
    return ApiResponse.created(res, enriched);
  } catch (e) { next(e); }
};

// ─── PUT /api/communities/:id/posts/:postId ──────────────────────────────────
export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;
    const { body, title, tags } = req.body;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    if (post.authorId !== userId) return ApiResponse.forbidden(res, 'Not your post');

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { body, title, tags, updatedAt: new Date() },
    });
    return ApiResponse.success(res, updated);
  } catch (e) { next(e); }
};

// ─── DELETE /api/communities/:id/posts/:postId ───────────────────────────────
export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    if (post.authorId !== userId) return ApiResponse.forbidden(res, 'Not your post');

    await prisma.post.delete({ where: { id: postId } });
    return ApiResponse.success(res, null, 'Post deleted');
  } catch (e) { next(e); }
};

// ─── GET /api/communities/posts/:postId/comments ─────────────────────────────
export const getPostComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;
    const comments = await prisma.comment.findMany({
      where:   { postId, isRemoved: false, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        replies: {
          where:   { isRemoved: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const enrich = async (c: any): Promise<any> => {
      let author_name = 'Anonymous Member';
      if (!c.isAnonymous) {
        const user = await prisma.user.findUnique({
          where: { id: c.authorId },
          select: {
            doctorProfile:  { select: { firstName: true, lastName: true } },
            patientProfile: { select: { firstName: true, lastName: true } },
          },
        });
        if (user?.doctorProfile) {
          author_name = `Dr. ${user.doctorProfile.firstName} ${user.doctorProfile.lastName}`;
        } else if (user?.patientProfile) {
          author_name = `${user.patientProfile.firstName} ${user.patientProfile.lastName.charAt(0)}.`;
        }
      }
      return { ...c, author_name, replies: await Promise.all((c.replies || []).map(enrich)) };
    };

    const enriched = await Promise.all(comments.map(enrich));
    return ApiResponse.success(res, enriched);
  } catch (e) { next(e); }
};

// ─── POST /api/communities/posts/:postId/comments ────────────────────────────
export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;
    const { body, parentId, isAnonymous } = req.body;

    if (!body?.trim())
      return ApiResponse.error(res, 'BAD_REQUEST', 'Comment body is required', 400);

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId:    userId,
        body:        body.trim(),
        parentId:    parentId || null,
        isAnonymous: !!isAnonymous,
      },
    });
    return ApiResponse.created(res, comment);
  } catch (e) { next(e); }
};

// ─── DELETE /api/communities/comments/:commentId ─────────────────────────────
export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return ApiResponse.notFound(res, 'Comment not found');
    if (comment.authorId !== userId) return ApiResponse.forbidden(res, 'Not your comment');

    await prisma.comment.update({ where: { id: commentId }, data: { isRemoved: true } });
    return ApiResponse.success(res, null, 'Comment removed');
  } catch (e) { next(e); }
};

// ─── POST /api/communities/posts/:postId/react ────────────────────────────────
export const reactToPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;
    const { reactionType } = req.body as { reactionType: string };

    const validTypes: ReactionType[] = ['LIKE', 'SUPPORT', 'HELPFUL'];
    const type = reactionType?.toUpperCase() as ReactionType;
    if (!validTypes.includes(type))
      return ApiResponse.error(res, 'BAD_REQUEST', 'Invalid reaction type. Use LIKE, SUPPORT or HELPFUL', 400);

    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId_reactionType: { postId, userId, reactionType: type } },
    });

    if (existing) {
      await prisma.postReaction.delete({
        where: { postId_userId_reactionType: { postId, userId, reactionType: type } },
      });
      const reactions = await aggregateReactions(postId);
      return ApiResponse.success(res, { toggled: false, reactions });
    }

    await prisma.postReaction.create({ data: { postId, userId, reactionType: type } });
    const reactions = await aggregateReactions(postId);
    return ApiResponse.success(res, { toggled: true, reactions });
  } catch (e) { next(e); }
};

// ─── DELETE /api/communities/posts/:postId/react ──────────────────────────────
export const removeReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;
    const { reactionType } = req.query as { reactionType: string };

    if (reactionType) {
      await prisma.postReaction.deleteMany({
        where: { postId, userId, reactionType: reactionType.toUpperCase() as ReactionType },
      });
    } else {
      await prisma.postReaction.deleteMany({ where: { postId, userId } });
    }
    const reactions = await aggregateReactions(postId);
    return ApiResponse.success(res, { reactions });
  } catch (e) { next(e); }
};


// ─── POST /api/v1/communities/request ────────────────────────────────────────
export const submitCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Accept both field names: 'communityName' (frontend v4) and 'name' (legacy)
    const communityName = (req.body.communityName || req.body.name || '').trim();
    const { category, reason } = req.body;
    const userId = (req as any).user?.userId ?? null; // optionalAuth — may be null for guests

    if (!communityName)
      return ApiResponse.error(res, 'BAD_REQUEST', 'Community name is required', 400);
    if (!reason?.trim())
      return ApiResponse.error(res, 'BAD_REQUEST', 'Reason is required', 400);

    // Return existing PENDING request instead of creating a duplicate
    if (userId) {
      const existing = await prisma.communityRequest.findFirst({
        where: { requestedBy: userId, status: 'PENDING' },
      });
      if (existing) {
        return ApiResponse.success(res, existing, 'You already have a pending request');
      }
    }

    const request = await prisma.communityRequest.create({
      data: {
        communityName,
        category: category?.trim() || null,
        reason:   reason.trim(),
        requestedBy: userId,
      },
    });

    // Notify all admins in-app (non-fatal)
    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type:   'COMMUNITY_REQUEST' as const,
            title:  '💡 New Community Request',
            body:   `"${communityName}" was requested${userId ? ' by a member' : ' by a guest'}.`,
            data:   { requestId: request.id, link: '/admin/community-requests' },
            isRead: false,
          })),
          skipDuplicates: true,
        });
      }
    } catch (notifErr) {
      console.warn('[submitCommunityRequest] Notification error (non-fatal):', notifErr);
    }

    return ApiResponse.created(res, request, 'Request submitted. Our team will review within 48 hours.');
  } catch (e) { next(e); }
};

// ─── GET /api/v1/communities/request/status ──────────────────────────────────
export const getMyCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication required', 401);

    const request = await prisma.communityRequest.findFirst({
      where:   { requestedBy: userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!request) return ApiResponse.notFound(res, 'No request found');
    return ApiResponse.success(res, request);
  } catch (e) { next(e); }
};

// ─── GET /api/v1/communities/admin/requests ───────────────────────────────────
export const adminListCommunityRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if ((req as any).user?.role !== 'ADMIN')
      return ApiResponse.forbidden(res, 'Admin access required');

    const { status } = req.query;
    const page  = Math.max(1, parseInt((req.query.page  as string) || '1'));
    const limit = Math.min(50, parseInt((req.query.limit as string) || '20'));
    const where: any = status ? { status } : {};

    const [requests, total] = await Promise.all([
      prisma.communityRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:  (page - 1) * limit,
        take:  limit,
        include: {
          requester: {
            select: {
              id: true, email: true,
              patientProfile: { select: { firstName: true, lastName: true } },
              doctorProfile:  { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.communityRequest.count({ where }),
    ]);

    return ApiResponse.success(res, {
      requests,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) { next(e); }
};

// ─── PATCH /api/v1/communities/admin/requests/:id ────────────────────────────
export const adminReviewCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if ((req as any).user?.role !== 'ADMIN')
      return ApiResponse.forbidden(res, 'Admin access required');

    const { id }                = req.params;
    const { status, adminNote } = req.body;
    const adminId               = (req as any).user?.userId;

    if (!['APPROVED', 'REJECTED'].includes(status))
      return ApiResponse.error(res, 'BAD_REQUEST', 'Status must be APPROVED or REJECTED', 400);

    const request = await prisma.communityRequest.update({
      where: { id },
      data: {
        status,
        adminNote:  adminNote?.trim() || null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Notify the requester (non-fatal)
    if (request.requestedBy) {
      try {
        const isApproved = status === 'APPROVED';
        await prisma.notification.create({
          data: {
            userId: request.requestedBy,
            type:   'COMMUNITY_REQUEST_UPDATE' as const,
            title:  isApproved ? '✅ Community Request Approved!' : '❌ Community Request Update',
            body:   isApproved
              ? `Great news! "${request.communityName}" has been approved and will be live soon.`
              : `Your request for "${request.communityName}" was not approved.${adminNote ? ` Reason: ${adminNote}` : ''}`,
            data:   { requestId: request.id, link: '/communities' },
            isRead: false,
          },
        });
      } catch (notifErr) {
        console.warn('[adminReviewCommunityRequest] Notification error (non-fatal):', notifErr);
      }
    }

    return ApiResponse.success(res, request);
  } catch (e) { next(e); }
};

// ─── POLLS ───────────────────────────────────────────────────────────────────
export const getCommunityPolls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: communityId } = req.params;
    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
      select: { id: true },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');

    const polls = await (prisma as any).$queryRaw`
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

    return ApiResponse.success(res, polls);
  } catch (e) { next(e); }
};

export const createPoll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id: communityId } = req.params;
    const { question, options, endsAt } = req.body;

    if (!question?.trim()) return ApiResponse.error(res, 'BAD_REQUEST', 'Question is required', 400);
    if (!options || options.length < 2 || options.length > 6)
      return ApiResponse.error(res, 'BAD_REQUEST', 'Need 2-6 options', 400);

    // Must be a community member
    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
      select: { id: true },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (!member) return ApiResponse.forbidden(res, 'Join the community to create polls');

    const poll = await (prisma as any).$queryRaw`
      INSERT INTO community_polls
        (id, "communityId", "createdBy", question, options, "endsAt", "isActive", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid()::text, ${community.id}, ${userId}, ${question.trim()},
         ${options}::text[], ${endsAt ? new Date(endsAt) : null}, true, NOW(), NOW())
      RETURNING *
    `;

    return ApiResponse.created(res, (poll as any)[0], 'Poll created');
  } catch (e) { next(e); }
};

export const votePoll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { pollId } = req.params;
    const { optionIndex } = req.body;

    if (optionIndex === undefined || optionIndex < 0)
      return ApiResponse.error(res, 'BAD_REQUEST', 'Valid optionIndex required', 400);

    // Upsert vote (change allowed)
    await (prisma as any).$executeRaw`
      INSERT INTO poll_votes (id, "pollId", "userId", "optionIndex", "createdAt")
      VALUES (gen_random_uuid()::text, ${pollId}, ${userId}, ${optionIndex}, NOW())
      ON CONFLICT ("pollId", "userId") DO UPDATE SET "optionIndex" = ${optionIndex}
    `;

    // Return updated counts
    const breakdown = await (prisma as any).$queryRaw`
      SELECT "optionIndex", COUNT(*)::int as count
      FROM poll_votes WHERE "pollId" = ${pollId}
      GROUP BY "optionIndex" ORDER BY "optionIndex"
    `;

    const total = (breakdown as any[]).reduce((a: number, b: any) => a + b.count, 0);

    return ApiResponse.success(res, { breakdown, total, user_vote: optionIndex });
  } catch (e) { next(e); }
};

// ─── BOOKMARKS ───────────────────────────────────────────────────────────────
export const toggleBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { postId } = req.params;

    const existing = await (prisma as any).$queryRaw`
      SELECT id FROM post_bookmarks WHERE "postId" = ${postId} AND "userId" = ${userId} LIMIT 1
    ` as any[];

    if (existing.length > 0) {
      await (prisma as any).$executeRaw`
        DELETE FROM post_bookmarks WHERE "postId" = ${postId} AND "userId" = ${userId}
      `;
      return ApiResponse.success(res, { bookmarked: false }, 'Bookmark removed');
    } else {
      await (prisma as any).$executeRaw`
        INSERT INTO post_bookmarks (id, "postId", "userId", "createdAt")
        VALUES (gen_random_uuid()::text, ${postId}, ${userId}, NOW())
      `;
      return ApiResponse.success(res, { bookmarked: true }, 'Post bookmarked');
    }
  } catch (e) { next(e); }
};

export const getMyBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page   = parseInt(req.query.page  as string) || 1;
    const limit  = parseInt(req.query.limit as string) || 20;

    const bookmarks = await (prisma as any).$queryRaw`
      SELECT pb."createdAt" as bookmarked_at, p.*,
        c.name as community_name, c.slug as community_slug, c.emoji as community_emoji
      FROM post_bookmarks pb
      JOIN posts p ON p.id = pb."postId"
      JOIN communities c ON c.id = p."communityId"
      WHERE pb."userId" = ${userId}
      ORDER BY pb."createdAt" DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;

    return ApiResponse.success(res, bookmarks);
  } catch (e) { next(e); }
};

// ─── COMMUNITY HEALTH SCORE ───────────────────────────────────────────────────
export const getCommunityHealthScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: slugOrId } = req.params;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: slugOrId }, { slug: slugOrId }] },
      select: { id: true, name: true },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [
      totalMembers, totalPosts, recentPosts, doctorMembers, totalReactions,
    ] = await Promise.all([
      prisma.communityMember.count({ where: { communityId: community.id, isApproved: true } }),
      prisma.post.count({ where: { communityId: community.id, status: 'PUBLISHED' } }),
      prisma.post.count({ where: { communityId: community.id, status: 'PUBLISHED', createdAt: { gte: thirtyDaysAgo } } }),
      // Count doctor moderators
      (prisma as any).$queryRaw`
        SELECT COUNT(*)::int as count FROM community_members cm
        JOIN users u ON u.id = cm."userId"
        WHERE cm."communityId" = ${community.id} AND u.role = 'DOCTOR'
      ` as Promise<any[]>,
      prisma.postReaction.count({
        where: { post: { communityId: community.id } },
      }),
    ]);

    const drCount = (doctorMembers as any[])[0]?.count || 0;

    // Score calculation (0-100)
    const activityScore  = Math.min(recentPosts * 3, 30);         // max 30 pts
    const engagementScore= Math.min((totalReactions / Math.max(totalPosts, 1)) * 10, 20); // max 20 pts
    const memberScore    = Math.min(totalMembers / 50, 20);        // max 20 pts
    const doctorScore    = Math.min(drCount * 10, 20);             // max 20 pts
    const baseScore      = 10;                                     // base 10 pts

    const total = Math.round(baseScore + activityScore + engagementScore + memberScore + doctorScore);

    const grade =
      total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : total >= 35 ? 'D' : 'F';

    return ApiResponse.success(res, {
      score: total,
      grade,
      breakdown: {
        activity:    Math.round(activityScore),
        engagement:  Math.round(engagementScore),
        membership:  Math.round(memberScore),
        doctorPresence: Math.round(doctorScore),
      },
      meta: { totalMembers, totalPosts, recentPosts, doctorParticipants: drCount },
      label: total >= 80 ? 'Thriving' : total >= 65 ? 'Active' : total >= 50 ? 'Growing' : total >= 35 ? 'Early Stage' : 'Needs Attention',
    });
  } catch (e) { next(e); }
};

// ─── PEOPLE LIKE ME MATCHING ──────────────────────────────────────────────────
export const getPeopleLikeMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Find user's joined communities
    const myMemberships = await prisma.communityMember.findMany({
      where: { userId, isApproved: true },
      select: { communityId: true },
    });
    const myCommunityIds = myMemberships.map(m => m.communityId);

    if (myCommunityIds.length === 0)
      return ApiResponse.success(res, [], 'Join communities to find matches');

    // Find users in same communities (excluding self)
    const matches = await (prisma as any).$queryRaw`
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

    return ApiResponse.success(res, matches);
  } catch (e) { next(e); }
};
