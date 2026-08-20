import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';

const MODERATOR_ROLES = new Set(['MODERATOR', 'OWNER', 'ADMIN']);

const toInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
};

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 70)
  .replace(/^-|-$/g, '');

const getCommunity = (ref: string) => prisma.community.findFirst({
  where: {
    isActive: true,
    OR: [{ id: ref }, { slug: ref }],
  },
});

const getMembership = (communityId: string, userId?: string) => {
  if (!userId) return Promise.resolve(null);
  return prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
};

const isGlobalAdmin = (req: Request) => req.user?.role === 'ADMIN';
const isApproved = (membership: any) => Boolean(membership?.isApproved);
const canModerate = (req: Request, membership: any) =>
  isGlobalAdmin(req) || (isApproved(membership) && MODERATOR_ROLES.has(String(membership.role).toUpperCase()));

const canReadCommunity = (community: any, req: Request, membership: any) => {
  if (isGlobalAdmin(req)) return true;
  if (community.visibility === 'PUBLIC') return true;
  if (community.visibility === 'RESTRICTED') return true; // metadata is discoverable; content is not.
  return isApproved(membership); // PRIVATE is visible only to approved members.
};

const canReadContent = (community: any, req: Request, membership: any) => {
  if (isGlobalAdmin(req)) return true;
  if (community.visibility === 'PUBLIC') return true;
  return isApproved(membership);
};

const memberRole = (membership: any) => {
  if (!membership) return null;
  if (!membership.isApproved) return 'PENDING';
  return membership.role || 'MEMBER';
};

async function communityCounts(ids: string[]) {
  if (!ids.length) return { members: new Map<string, number>(), posts: new Map<string, number>() };
  const [memberRows, postRows] = await Promise.all([
    prisma.communityMember.groupBy({
      by: ['communityId'],
      where: { communityId: { in: ids }, isApproved: true },
      _count: { _all: true },
    }),
    prisma.post.groupBy({
      by: ['communityId'],
      where: { communityId: { in: ids }, status: 'PUBLISHED' },
      _count: { _all: true },
    }),
  ]);
  return {
    members: new Map(memberRows.map(row => [row.communityId, row._count._all])),
    posts: new Map(postRows.map(row => [row.communityId, row._count._all])),
  };
}

async function enrichCommunities(communities: any[], userId?: string) {
  const ids = communities.map(c => c.id);
  const [counts, memberships] = await Promise.all([
    communityCounts(ids),
    userId && ids.length
      ? prisma.communityMember.findMany({ where: { communityId: { in: ids }, userId } })
      : Promise.resolve([] as any[]),
  ]);
  const membershipMap = new Map(memberships.map(m => [m.communityId, m]));
  return communities.map(c => {
    const membership: any = membershipMap.get(c.id);
    const members = counts.members.get(c.id) || 0;
    const posts = counts.posts.get(c.id) || 0;
    return {
      ...c,
      memberCount: members,
      member_count: members,
      postCount: posts,
      post_count: posts,
      isJoined: Boolean(membership?.isApproved),
      is_joined: Boolean(membership?.isApproved),
      membershipStatus: membership ? (membership.isApproved ? 'JOINED' : 'PENDING_APPROVAL') : 'NOT_JOINED',
      membershipRole: memberRole(membership),
      allows_anonymous: c.allowAnonymous,
      type: c.visibility,
    };
  });
}

async function authorMap(userIds: string[]) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return new Map<string, any>();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: {
      id: true,
      role: true,
      patientProfile: { select: { firstName: true, lastName: true } },
      doctorProfile: { select: { id: true, firstName: true, lastName: true, isVerified: true, verificationStatus: true } },
      hospitalProfile: { select: { id: true, name: true, isVerified: true, verificationStatus: true } },
    },
  });
  return new Map(users.map(u => {
    let firstName = '';
    let lastName = '';
    let name = 'HealthConnect Member';
    let doctorId: string | undefined;
    let verified = false;
    if (u.doctorProfile) {
      firstName = u.doctorProfile.firstName;
      lastName = u.doctorProfile.lastName;
      name = `Dr. ${firstName} ${lastName}`.trim();
      doctorId = u.doctorProfile.id;
      verified = u.doctorProfile.isVerified || u.doctorProfile.verificationStatus === 'VERIFIED';
    } else if (u.patientProfile) {
      firstName = u.patientProfile.firstName;
      lastName = u.patientProfile.lastName;
      name = `${firstName} ${lastName}`.trim();
    } else if (u.hospitalProfile) {
      name = u.hospitalProfile.name;
      verified = u.hospitalProfile.isVerified || u.hospitalProfile.verificationStatus === 'VERIFIED';
    } else if (u.role === 'ADMIN') {
      name = 'HealthConnect Team';
      verified = true;
    }
    return [u.id, { id: u.id, role: u.role, firstName, lastName, name, doctorId, verified }];
  }));
}

async function serializePosts(posts: any[], userId?: string) {
  if (!posts.length) return [];
  const ids = posts.map(p => p.id);
  const [grouped, ownReactions, authors] = await Promise.all([
    prisma.postReaction.groupBy({
      by: ['postId', 'reactionType'],
      where: { postId: { in: ids } },
      _count: { _all: true },
    }),
    userId
      ? prisma.postReaction.findMany({ where: { postId: { in: ids }, userId }, select: { postId: true, reactionType: true } })
      : Promise.resolve([] as any[]),
    authorMap(posts.filter(p => !p.isAnonymous).map(p => p.authorId)),
  ]);

  const reactionCounts = new Map<string, Record<string, number>>();
  grouped.forEach(row => {
    const current = reactionCounts.get(row.postId) || { LIKE: 0, SUPPORT: 0, HELPFUL: 0 };
    current[row.reactionType] = row._count._all;
    reactionCounts.set(row.postId, current);
  });
  const own = new Map<string, string[]>();
  ownReactions.forEach(row => own.set(row.postId, [...(own.get(row.postId) || []), row.reactionType.toLowerCase()]));

  return posts.map(p => {
    const counts = reactionCounts.get(p.id) || { LIKE: 0, SUPPORT: 0, HELPFUL: 0 };
    const userReactions = own.get(p.id) || [];
    const author = p.isAnonymous ? null : authors.get(p.authorId);
    const displayName = p.isAnonymous ? (p.anonymousAlias || 'Anonymous Member') : (author?.name || 'HealthConnect Member');
    return {
      id: p.id,
      communityId: p.communityId,
      ...(p.isAnonymous ? {} : { authorId: p.authorId }),
      title: p.title,
      body: p.body,
      tags: p.tags || [],
      isAnonymous: p.isAnonymous,
      anonymousAlias: p.isAnonymous ? displayName : null,
      status: p.status,
      isPinned: p.isPinned,
      viewCount: p.viewCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: p.isAnonymous ? null : author,
      author_name: displayName,
      is_doctor: Boolean(author?.role === 'DOCTOR' && author?.verified),
      commentCount: p._count?.comments || 0,
      comment_count: p._count?.comments || 0,
      reactions: {
        like: counts.LIKE || 0,
        support: counts.SUPPORT || 0,
        helpful: counts.HELPFUL || 0,
      },
      userReactions,
      userReaction: userReactions[0] || null,
      user_reaction: userReactions[0] || null,
      isMine: Boolean(userId && p.authorId === userId),
    };
  });
}

async function serializeComments(comments: any[]) {
  const all = comments.flatMap(c => [c, ...(c.replies || [])]);
  const authors = await authorMap(all.filter(c => !c.isAnonymous).map(c => c.authorId));
  const one = (c: any) => {
    const author = c.isAnonymous ? null : authors.get(c.authorId);
    return {
      id: c.id,
      postId: c.postId,
      parentId: c.parentId,
      body: c.isRemoved ? '[removed]' : c.body,
      isAnonymous: c.isAnonymous,
      isRemoved: c.isRemoved,
      author: c.isAnonymous ? null : author,
      author_name: c.isAnonymous ? 'Anonymous Member' : (author?.name || 'HealthConnect Member'),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      replies: (c.replies || []).filter((r: any) => !r.isRemoved).map(one),
    };
  };
  return comments.filter(c => !c.isRemoved).map(one);
}

async function notifyCommunityUsers(userIds: string[], title: string, body: string, data: Record<string, any>) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  const users = await prisma.user.findMany({
    where: { id: { in: unique }, isActive: true },
    select: { id: true, settings: { select: { communityActivity: true } } },
  });
  const recipients = users.filter(u => u.settings?.communityActivity !== false).map(u => u.id);
  if (!recipients.length) return;
  await prisma.notification.createMany({
    data: recipients.map(id => ({
      userId: id,
      type: 'COMMUNITY_ACTIVITY',
      title,
      body,
      data,
      isRead: false,
    })),
  });
}

async function moderatorMembership(req: Request, communityId: string) {
  const membership = await getMembership(communityId, req.user?.userId);
  return { membership, allowed: canModerate(req, membership) };
}

// ─── Directory / discovery ─────────────────────────────────────────────────

export const getCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = toInt(req.query.page, 1, 1, 100000);
    const limit = toInt(req.query.limit, 24, 1, 100);
    const userId = req.user?.userId;
    const and: any[] = [{ isActive: true }];

    if (!isGlobalAdmin(req)) {
      if (userId) {
        and.push({
          OR: [
            { visibility: { in: ['PUBLIC', 'RESTRICTED'] } },
            { members: { some: { userId, isApproved: true } } },
          ],
        });
      } else {
        and.push({ visibility: 'PUBLIC' });
      }
    }
    if (req.query.category) and.push({ category: { equals: String(req.query.category), mode: 'insensitive' } });
    if (req.query.language) and.push({ language: String(req.query.language) });
    if (req.query.featured === 'true') and.push({ isFeatured: true });
    if (req.query.featured === 'false') and.push({ isFeatured: false });
    if (req.query.visibility) and.push({ visibility: String(req.query.visibility) });
    if (req.query.search) {
      const search = String(req.query.search);
      and.push({ OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ] });
    }

    const where: any = { AND: and };
    const [rows, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
      }),
      prisma.community.count({ where }),
    ]);
    const communities = await enrichCommunities(rows, userId);
    return ApiResponse.success(res, { communities, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};

export const getFeaturedCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.community.findMany({
      where: { isActive: true, isFeatured: true, visibility: 'PUBLIC' },
      take: 12,
      orderBy: { createdAt: 'asc' },
    });
    return ApiResponse.success(res, await enrichCommunities(rows, req.user?.userId));
  } catch (e) { next(e); }
};

export const getRecommendedCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const joined = await prisma.communityMember.findMany({
      where: { userId, isApproved: true },
      select: { communityId: true, community: { select: { category: true } } },
    });
    const categories = [...new Set(joined.map(m => m.community.category).filter(Boolean) as string[])];
    const rows = await prisma.community.findMany({
      where: {
        isActive: true,
        visibility: { in: ['PUBLIC', 'RESTRICTED'] },
        id: { notIn: joined.map(m => m.communityId) },
        ...(categories.length ? { category: { in: categories } } : {}),
      },
      take: 8,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
    });
    const fallback = rows.length ? rows : await prisma.community.findMany({
      where: { isActive: true, visibility: 'PUBLIC', id: { notIn: joined.map(m => m.communityId) } },
      take: 8,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
    });
    return ApiResponse.success(res, await enrichCommunities(fallback, userId));
  } catch (e) { next(e); }
};

export const getCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.slug);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await getMembership(community.id, req.user?.userId);
    if (!canReadCommunity(community, req, membership)) return ApiResponse.notFound(res, 'Community not found');
    const [enriched] = await enrichCommunities([community], req.user?.userId);
    return ApiResponse.success(res, enriched);
  } catch (e) { next(e); }
};

// ─── Membership ─────────────────────────────────────────────────────────────

export const joinCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    if (community.visibility === 'PRIVATE') {
      return ApiResponse.forbidden(res, 'PRIVATE_COMMUNITY', 'This community is invitation-only');
    }
    const userId = req.user!.userId;
    const existing = await getMembership(community.id, userId);
    if (existing?.isApproved) return ApiResponse.success(res, { membershipStatus: 'JOINED' }, 'Already a member');
    if (existing && !existing.isApproved) return ApiResponse.success(res, { membershipStatus: 'PENDING_APPROVAL' }, 'Your join request is pending approval');

    const requiresApproval = community.requireApproval || community.visibility === 'RESTRICTED';
    const membership = await prisma.communityMember.create({
      data: { communityId: community.id, userId, role: 'MEMBER', isApproved: !requiresApproval },
    });

    if (requiresApproval) {
      const moderators = await prisma.communityMember.findMany({
        where: { communityId: community.id, isApproved: true, role: { in: ['MODERATOR', 'OWNER', 'ADMIN'] } },
        select: { userId: true },
      });
      await notifyCommunityUsers(
        moderators.map(m => m.userId),
        'Community join request',
        `A member requested to join ${community.name}.`,
        { communityId: community.id, membershipId: membership.id, action: 'MEMBERSHIP_REQUEST' },
      );
      return ApiResponse.created(res, { membershipId: membership.id, membershipStatus: 'PENDING_APPROVAL' }, 'Join request submitted');
    }

    return ApiResponse.created(res, { membershipId: membership.id, membershipStatus: 'JOINED' }, 'Joined community successfully');
  } catch (e) { next(e); }
};

export const leaveCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const userId = req.user!.userId;
    const membership = await getMembership(community.id, userId);
    if (!membership) return ApiResponse.success(res, null, 'You are not a member of this community');
    if (String(membership.role).toUpperCase() === 'OWNER') {
      return ApiResponse.error(res, 'OWNER_CANNOT_LEAVE', 'Transfer community ownership before leaving', 409);
    }
    await prisma.communityMember.delete({ where: { id: membership.id } });
    return ApiResponse.success(res, null, 'Left community successfully');
  } catch (e) { next(e); }
};

export const getCommunityMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await getMembership(community.id, req.user?.userId);
    if (!canReadContent(community, req, membership)) return ApiResponse.forbidden(res, 'Membership required');
    const page = toInt(req.query.page, 1, 1, 100000);
    const limit = toInt(req.query.limit, 20, 1, 50);
    const where = { communityId: community.id, isApproved: true };
    const [rows, total] = await Promise.all([
      prisma.communityMember.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { joinedAt: 'asc' } }),
      prisma.communityMember.count({ where }),
    ]);
    const profiles = await authorMap(rows.map(m => m.userId));
    const members = rows.map(m => ({ id: m.id, role: m.role, joinedAt: m.joinedAt, user: profiles.get(m.userId) || { id: m.userId, name: 'HealthConnect Member' } }));
    return ApiResponse.success(res, { members, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};

export const getMembershipRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const { allowed } = await moderatorMembership(req, community.id);
    if (!allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const rows = await prisma.communityMember.findMany({ where: { communityId: community.id, isApproved: false }, orderBy: { joinedAt: 'asc' } });
    const profiles = await authorMap(rows.map(m => m.userId));
    return ApiResponse.success(res, rows.map(m => ({ id: m.id, joinedAt: m.joinedAt, user: profiles.get(m.userId) || { id: m.userId, name: 'HealthConnect Member' } })));
  } catch (e) { next(e); }
};

export const approveMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const { allowed } = await moderatorMembership(req, community.id);
    if (!allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const pending = await prisma.communityMember.findFirst({ where: { id: req.params.memberId, communityId: community.id } });
    if (!pending) return ApiResponse.notFound(res, 'Membership request not found');
    await prisma.communityMember.update({ where: { id: pending.id }, data: { isApproved: true } });
    await notifyCommunityUsers([pending.userId], 'Community request approved', `You can now participate in ${community.name}.`, { communityId: community.id, action: 'MEMBERSHIP_APPROVED' });
    return ApiResponse.success(res, null, 'Membership approved');
  } catch (e) { next(e); }
};

export const rejectMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const { allowed } = await moderatorMembership(req, community.id);
    if (!allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const pending = await prisma.communityMember.findFirst({ where: { id: req.params.memberId, communityId: community.id, isApproved: false } });
    if (!pending) return ApiResponse.notFound(res, 'Membership request not found');
    await prisma.communityMember.delete({ where: { id: pending.id } });
    await notifyCommunityUsers([pending.userId], 'Community request update', `Your request to join ${community.name} was not approved.`, { communityId: community.id, action: 'MEMBERSHIP_REJECTED' });
    return ApiResponse.success(res, null, 'Membership request rejected');
  } catch (e) { next(e); }
};

// ─── Posts ──────────────────────────────────────────────────────────────────

export const getCommunityPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await getMembership(community.id, req.user?.userId);
    if (!canReadContent(community, req, membership)) return ApiResponse.forbidden(res, 'Approved membership required to view this community feed');

    const page = toInt(req.query.page, 1, 1, 100000);
    const limit = toInt(req.query.limit, 20, 1, 50);
    const sort = String(req.query.sort || 'newest');
    const where: any = { communityId: community.id, status: 'PUBLISHED' };
    if (req.query.search) {
      const search = String(req.query.search);
      where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { body: { contains: search, mode: 'insensitive' } }];
    }
    if (req.query.authorId) {
      const requestedAuthor = String(req.query.authorId);
      if (requestedAuthor !== req.user?.userId && !canModerate(req, membership)) {
        return ApiResponse.forbidden(res, 'You can only filter the feed to your own posts');
      }
      where.authorId = requestedAuthor;
    }

    let orderBy: any = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'oldest') orderBy = [{ isPinned: 'desc' }, { createdAt: 'asc' }];
    if (sort === 'popular' || sort === 'trending') orderBy = [{ isPinned: 'desc' }, { reactions: { _count: 'desc' } }, { comments: { _count: 'desc' } }, { createdAt: 'desc' }];

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: { _count: { select: { comments: { where: { isRemoved: false } }, reactions: true } } },
      }),
      prisma.post.count({ where }),
    ]);
    return ApiResponse.success(res, { posts: await serializePosts(posts, req.user?.userId), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};

export const getRecentPosts = async (req: Request, res: Response, next: NextFunction) => {
  req.query = { ...req.query, page: 1, limit: Math.min(10, toInt(req.query.limit, 5, 1, 10)), sort: 'newest' } as any;
  return getCommunityPosts(req, res, next);
};

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const userId = req.user!.userId;
    const membership = await getMembership(community.id, userId);
    if (!isGlobalAdmin(req) && !isApproved(membership)) return ApiResponse.forbidden(res, 'Join this community before posting');

    const isAnonymous = Boolean(req.body.isAnonymous);
    if (isAnonymous) {
      if (!community.allowAnonymous) return ApiResponse.forbidden(res, 'Anonymous posting is disabled in this community');
      const settings = await prisma.userSettings.findUnique({ where: { userId } });
      if (settings?.allowAnonymousPosting === false) return ApiResponse.forbidden(res, 'Anonymous posting is disabled in your privacy settings');
    }

    const post = await prisma.post.create({
      data: {
        communityId: community.id,
        authorId: userId,
        title: req.body.title || null,
        body: req.body.body,
        tags: req.body.tags || [],
        isAnonymous,
        anonymousAlias: isAnonymous ? (req.body.anonymousAlias || 'Anonymous Member') : null,
        status: 'PUBLISHED',
      },
      include: { _count: { select: { comments: true, reactions: true } } },
    });
    const [serialized] = await serializePosts([post], userId);
    return ApiResponse.created(res, serialized, 'Post published');
  } catch (e) { next(e); }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, communityId: community.id, status: { not: 'REMOVED' } } });
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    if (post.authorId !== req.user!.userId) return ApiResponse.forbidden(res, 'Only the post author can edit this post');
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        ...(req.body.title !== undefined ? { title: req.body.title || null } : {}),
        ...(req.body.body !== undefined ? { body: req.body.body } : {}),
        ...(req.body.tags !== undefined ? { tags: req.body.tags } : {}),
      },
      include: { _count: { select: { comments: true, reactions: true } } },
    });
    const [serialized] = await serializePosts([updated], req.user!.userId);
    return ApiResponse.success(res, serialized, 'Post updated');
  } catch (e) { next(e); }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, communityId: community.id, status: { not: 'REMOVED' } } });
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    const membership = await getMembership(community.id, req.user!.userId);
    const moderator = canModerate(req, membership);
    if (post.authorId !== req.user!.userId && !moderator) return ApiResponse.forbidden(res, 'You do not have permission to remove this post');
    await prisma.post.update({ where: { id: post.id }, data: { status: 'REMOVED', isPinned: false } });
    if (moderator && post.authorId !== req.user!.userId) {
      await prisma.communityModerationLog.create({
        data: { communityId: community.id, moderatorId: req.user!.userId, action: 'DELETE_CONTENT', targetType: 'POST', targetId: post.id, reason: 'Removed by moderator' },
      });
    }
    return ApiResponse.success(res, null, 'Post removed');
  } catch (e) { next(e); }
};

export const setPostPinned = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const { allowed } = await moderatorMembership(req, community.id);
    if (!allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, communityId: community.id, status: 'PUBLISHED' } });
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    const isPinned = !post.isPinned;
    await prisma.$transaction([
      prisma.post.update({ where: { id: post.id }, data: { isPinned } }),
      prisma.communityModerationLog.create({ data: { communityId: community.id, moderatorId: req.user!.userId, action: isPinned ? 'PIN_POST' : 'UNPIN_POST', targetType: 'POST', targetId: post.id } }),
    ]);
    return ApiResponse.success(res, { isPinned }, isPinned ? 'Post pinned' : 'Post unpinned');
  } catch (e) { next(e); }
};

// ─── Comments ───────────────────────────────────────────────────────────────

export const getPostComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, status: 'PUBLISHED' }, include: { community: true } });
    if (!post || !post.community.isActive) return ApiResponse.notFound(res, 'Post not found');
    const membership = await getMembership(post.communityId, req.user?.userId);
    if (!canReadContent(post.community, req, membership)) return ApiResponse.forbidden(res, 'Approved membership required');
    const comments = await prisma.comment.findMany({
      where: { postId: post.id, parentId: null, isRemoved: false },
      orderBy: { createdAt: 'asc' },
      include: { replies: { where: { isRemoved: false }, orderBy: { createdAt: 'asc' } } },
    });
    return ApiResponse.success(res, await serializeComments(comments));
  } catch (e) { next(e); }
};

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, status: 'PUBLISHED' }, include: { community: true } });
    if (!post || !post.community.isActive) return ApiResponse.notFound(res, 'Post not found');
    const userId = req.user!.userId;
    const membership = await getMembership(post.communityId, userId);
    if (!isGlobalAdmin(req) && !isApproved(membership)) return ApiResponse.forbidden(res, 'Join this community before replying');
    if (req.body.parentId) {
      const parent = await prisma.comment.findFirst({ where: { id: req.body.parentId, postId: post.id, isRemoved: false } });
      if (!parent) return ApiResponse.error(res, 'INVALID_PARENT', 'Parent comment does not belong to this post', 400);
    }
    if (req.body.isAnonymous) {
      if (!post.community.allowAnonymous) return ApiResponse.forbidden(res, 'Anonymous replies are disabled in this community');
      const settings = await prisma.userSettings.findUnique({ where: { userId } });
      if (settings?.allowAnonymousPosting === false) return ApiResponse.forbidden(res, 'Anonymous posting is disabled in your privacy settings');
    }
    const comment = await prisma.comment.create({
      data: { postId: post.id, authorId: userId, body: req.body.body, parentId: req.body.parentId || null, isAnonymous: Boolean(req.body.isAnonymous) },
    });
    const [serialized] = await serializeComments([{ ...comment, replies: [] }]);
    return ApiResponse.created(res, serialized, 'Reply added');
  } catch (e) { next(e); }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId }, include: { post: { include: { community: true } } } });
    if (!comment || !comment.post.community.isActive) return ApiResponse.notFound(res, 'Comment not found');
    const membership = await getMembership(comment.post.communityId, req.user!.userId);
    const moderator = canModerate(req, membership);
    if (comment.authorId !== req.user!.userId && !moderator) return ApiResponse.forbidden(res, 'You do not have permission to remove this reply');
    await prisma.comment.update({ where: { id: comment.id }, data: { isRemoved: true, body: '[removed]' } });
    if (moderator && comment.authorId !== req.user!.userId) {
      await prisma.communityModerationLog.create({ data: { communityId: comment.post.communityId, moderatorId: req.user!.userId, action: 'DELETE_CONTENT', targetType: 'COMMENT', targetId: comment.id, reason: 'Removed by moderator' } });
    }
    return ApiResponse.success(res, null, 'Reply removed');
  } catch (e) { next(e); }
};

// ─── Reactions ──────────────────────────────────────────────────────────────

export const reactToPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, status: 'PUBLISHED' }, include: { community: true } });
    if (!post || !post.community.isActive) return ApiResponse.notFound(res, 'Post not found');
    const userId = req.user!.userId;
    const membership = await getMembership(post.communityId, userId);
    if (!isGlobalAdmin(req) && !isApproved(membership)) return ApiResponse.forbidden(res, 'Join this community before reacting');
    const reactionType = req.body.reactionType;
    const existing = await prisma.postReaction.findUnique({ where: { postId_userId_reactionType: { postId: post.id, userId, reactionType } } });
    if (existing) await prisma.postReaction.delete({ where: { id: existing.id } });
    else await prisma.postReaction.create({ data: { postId: post.id, userId, reactionType } });

    const [counts, own] = await Promise.all([
      prisma.postReaction.groupBy({ by: ['reactionType'], where: { postId: post.id }, _count: { _all: true } }),
      prisma.postReaction.findMany({ where: { postId: post.id, userId }, select: { reactionType: true } }),
    ]);
    const map: Record<string, number> = { LIKE: 0, SUPPORT: 0, HELPFUL: 0 };
    counts.forEach(c => { map[c.reactionType] = c._count._all; });
    return ApiResponse.success(res, {
      active: !existing,
      reactionType,
      reactions: { like: map.LIKE, support: map.SUPPORT, helpful: map.HELPFUL },
      userReactions: own.map(r => r.reactionType.toLowerCase()),
    });
  } catch (e) { next(e); }
};

export const removeReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, status: 'PUBLISHED' }, include: { community: true } });
    if (!post || !post.community.isActive) return ApiResponse.notFound(res, 'Post not found');
    const userId = req.user!.userId;
    const membership = await getMembership(post.communityId, userId);
    if (!isGlobalAdmin(req) && !isApproved(membership)) return ApiResponse.forbidden(res, 'Approved membership required');
    const reactionType = req.query.reactionType ? String(req.query.reactionType).toUpperCase() : undefined;
    if (reactionType && !['LIKE', 'SUPPORT', 'HELPFUL'].includes(reactionType)) return ApiResponse.error(res, 'INVALID_REACTION', 'Unknown reaction type', 400);
    await prisma.postReaction.deleteMany({ where: { postId: post.id, userId, ...(reactionType ? { reactionType: reactionType as any } : {}) } });
    return ApiResponse.success(res, null, 'Reaction removed');
  } catch (e) { next(e); }
};

// ─── Community requests ─────────────────────────────────────────────────────

export const submitCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const normalized = req.body.communityName.trim();
    const existingCommunity = await prisma.community.findFirst({ where: { name: { equals: normalized, mode: 'insensitive' } } });
    if (existingCommunity) return ApiResponse.error(res, 'COMMUNITY_EXISTS', 'A community with this name already exists', 409);
    const duplicate = await prisma.communityRequest.findFirst({
      where: { requestedBy: userId, status: 'PENDING', communityName: { equals: normalized, mode: 'insensitive' } },
    });
    if (duplicate) return ApiResponse.success(res, duplicate, 'This request is already pending');

    const request = await prisma.communityRequest.create({
      data: { communityName: normalized, category: req.body.category || null, reason: req.body.reason, requestedBy: userId },
    });
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map(a => ({ userId: a.id, type: 'COMMUNITY_REQUEST', title: 'New community request', body: `${normalized} was requested for review.`, data: { requestId: request.id }, isRead: false })),
      });
    }
    return ApiResponse.created(res, request, 'Community request submitted');
  } catch (e) { next(e); }
};

export const getMyCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.communityRequest.findMany({ where: { requestedBy: req.user!.userId }, orderBy: { createdAt: 'desc' }, take: 20 });
    return ApiResponse.success(res, { requests, latest: requests[0] || null });
  } catch (e) { next(e); }
};

// ─── Events / Q&A foundation ────────────────────────────────────────────────

export const getCommunityEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await getMembership(community.id, req.user?.userId);
    if (!canReadContent(community, req, membership)) return ApiResponse.forbidden(res, 'Approved membership required');
    const events = await prisma.communityEvent.findMany({
      where: { communityId: community.id, isCancelled: false, ...(req.query.all === 'true' ? {} : { eventDate: { gte: new Date() } }) },
      orderBy: { eventDate: 'asc' },
      take: 50,
      include: { _count: { select: { rsvps: true } }, rsvps: req.user?.userId ? { where: { userId: req.user.userId }, select: { status: true } } : false },
    });
    return ApiResponse.success(res, events.map((event: any) => ({ ...event, rsvpCount: event._count.rsvps, myRsvp: event.rsvps?.[0]?.status || null, _count: undefined, rsvps: undefined })));
  } catch (e) { next(e); }
};

export const createCommunityEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const { allowed } = await moderatorMembership(req, community.id);
    if (!allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    if (new Date(req.body.eventDate).getTime() <= Date.now()) return ApiResponse.error(res, 'INVALID_EVENT_DATE', 'Event must be scheduled in the future', 400);
    const event = await prisma.communityEvent.create({
      data: {
        communityId: community.id,
        createdBy: req.user!.userId,
        title: req.body.title,
        description: req.body.description || null,
        eventDate: new Date(req.body.eventDate),
        format: req.body.format,
        location: req.body.location || null,
        meetLink: req.body.meetLink || null,
      },
    });
    const members = await prisma.communityMember.findMany({ where: { communityId: community.id, isApproved: true, userId: { not: req.user!.userId } }, select: { userId: true } });
    await notifyCommunityUsers(members.map(m => m.userId), `New event in ${community.name}`, event.title, { communityId: community.id, eventId: event.id, action: 'EVENT_CREATED' });
    return ApiResponse.created(res, event, 'Community event created');
  } catch (e) { next(e); }
};

export const cancelCommunityEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.communityEvent.findUnique({ where: { id: req.params.eventId }, include: { community: true } });
    if (!event || !event.community.isActive) return ApiResponse.notFound(res, 'Event not found');
    const { allowed } = await moderatorMembership(req, event.communityId);
    if (!allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    await prisma.communityEvent.update({ where: { id: event.id }, data: { isCancelled: true } });
    return ApiResponse.success(res, null, 'Event cancelled');
  } catch (e) { next(e); }
};

export const rsvpCommunityEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.communityEvent.findUnique({ where: { id: req.params.eventId }, include: { community: true } });
    if (!event || event.isCancelled || !event.community.isActive) return ApiResponse.notFound(res, 'Event not found');
    if (event.eventDate.getTime() <= Date.now()) return ApiResponse.error(res, 'EVENT_ENDED', 'This event has already started or ended', 409);
    const membership = await getMembership(event.communityId, req.user!.userId);
    if (!isGlobalAdmin(req) && !isApproved(membership)) return ApiResponse.forbidden(res, 'Join this community before responding to events');
    const rsvp = await prisma.communityEventRsvp.upsert({
      where: { eventId_userId: { eventId: event.id, userId: req.user!.userId } },
      create: { eventId: event.id, userId: req.user!.userId, status: req.body.status },
      update: { status: req.body.status },
    });
    return ApiResponse.success(res, rsvp, 'RSVP updated');
  } catch (e) { next(e); }
};

// ─── Reporting / moderation ────────────────────────────────────────────────

export const reportCommunityContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await getMembership(community.id, req.user!.userId);
    if (!isGlobalAdmin(req) && !isApproved(membership)) return ApiResponse.forbidden(res, 'Join this community before reporting content');
    if (req.body.targetType === 'POST') {
      const target = await prisma.post.findFirst({ where: { id: req.body.targetId, communityId: community.id, status: 'PUBLISHED' } });
      if (!target) return ApiResponse.notFound(res, 'Reported post not found');
    } else {
      const target = await prisma.comment.findFirst({ where: { id: req.body.targetId, post: { communityId: community.id }, isRemoved: false } });
      if (!target) return ApiResponse.notFound(res, 'Reported reply not found');
    }
    const duplicate = await prisma.communityReport.findFirst({ where: { communityId: community.id, reporterId: req.user!.userId, targetId: req.body.targetId } });
    if (duplicate) return ApiResponse.success(res, duplicate, 'You have already reported this content');
    const report = await prisma.communityReport.create({
      data: { communityId: community.id, reporterId: req.user!.userId, targetType: req.body.targetType, targetId: req.body.targetId, reason: req.body.reason, details: req.body.details || null },
    });
    return ApiResponse.created(res, report, 'Report submitted for moderator review');
  } catch (e) { next(e); }
};

export const getCommunityReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const { allowed } = await moderatorMembership(req, community.id);
    if (!allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const status = String(req.query.status || 'PENDING');
    if (!['PENDING', 'RESOLVED', 'DISMISSED'].includes(status)) return ApiResponse.error(res, 'INVALID_STATUS', 'Invalid report status', 400);
    const reports = await prisma.communityReport.findMany({ where: { communityId: community.id, status: status as any }, orderBy: { createdAt: 'asc' }, take: 100 });
    return ApiResponse.success(res, reports);
  } catch (e) { next(e); }
};

export const resolveCommunityReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const { allowed } = await moderatorMembership(req, community.id);
    if (!allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const report = await prisma.communityReport.findFirst({ where: { id: req.params.reportId, communityId: community.id, status: 'PENDING' } });
    if (!report) return ApiResponse.notFound(res, 'Pending report not found');

    const action = req.body.action as 'DISMISS' | 'DELETE_CONTENT';
    await prisma.$transaction(async tx => {
      if (action === 'DELETE_CONTENT') {
        if (report.targetType === 'POST') await tx.post.updateMany({ where: { id: report.targetId, communityId: community.id }, data: { status: 'REMOVED', isPinned: false } });
        if (report.targetType === 'COMMENT') await tx.comment.updateMany({ where: { id: report.targetId, post: { communityId: community.id } }, data: { isRemoved: true, body: '[removed]' } });
      }
      await tx.communityReport.update({
        where: { id: report.id },
        data: { status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED', resolvedBy: req.user!.userId, resolvedAt: new Date(), resolution: req.body.resolution },
      });
      await tx.communityModerationLog.create({
        data: { communityId: community.id, moderatorId: req.user!.userId, action, targetType: report.targetType, targetId: report.targetId, reason: req.body.resolution, details: { reportId: report.id } },
      });
    });
    return ApiResponse.success(res, null, action === 'DISMISS' ? 'Report dismissed' : 'Reported content removed');
  } catch (e) { next(e); }
};

export const getCommunityHealthScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await getCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await getMembership(community.id, req.user?.userId);
    if (!canReadCommunity(community, req, membership)) return ApiResponse.notFound(res, 'Community not found');
    const since = new Date(Date.now() - 30 * 86400000);
    const [members, posts, reactions, comments, pendingReports] = await Promise.all([
      prisma.communityMember.count({ where: { communityId: community.id, isApproved: true } }),
      prisma.post.count({ where: { communityId: community.id, status: 'PUBLISHED', createdAt: { gte: since } } }),
      prisma.postReaction.count({ where: { post: { communityId: community.id, status: 'PUBLISHED' }, createdAt: { gte: since } } }),
      prisma.comment.count({ where: { post: { communityId: community.id, status: 'PUBLISHED' }, isRemoved: false, createdAt: { gte: since } } }),
      prisma.communityReport.count({ where: { communityId: community.id, status: 'PENDING' } }),
    ]);
    const activity = Math.min(45, posts * 3 + comments + reactions * 0.25);
    const membershipScore = Math.min(35, members * 2);
    const safety = Math.max(0, 20 - pendingReports * 3);
    const score = Math.max(0, Math.min(100, Math.round(activity + membershipScore + safety)));
    const grade = score >= 85 ? 'Excellent' : score >= 70 ? 'Healthy' : score >= 50 ? 'Growing' : 'Needs activity';
    return ApiResponse.success(res, { score, grade, members, postsLast30Days: posts, commentsLast30Days: comments, reactionsLast30Days: reactions, pendingReports });
  } catch (e) { next(e); }
};

// Kept for source compatibility only. Following without persistent state previously
// returned a false success, so the endpoint now tells clients to use membership.
export const followCommunity = async (_req: Request, res: Response) =>
  ApiResponse.error(res, 'NOT_SUPPORTED', 'Community following is not a persisted feature. Join the community instead.', 410);
