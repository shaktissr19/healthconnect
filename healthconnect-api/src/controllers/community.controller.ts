import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';

const MODERATOR_ROLES = new Set(['MODERATOR', 'OWNER', 'ADMIN']);

const intParam = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.trunc(parsed))) : fallback;
};

const findCommunity = (ref: string) => prisma.community.findFirst({
  where: { isActive: true, OR: [{ id: ref }, { slug: ref }] },
});

const membershipFor = (communityId: string, userId?: string) => userId
  ? prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } })
  : Promise.resolve(null);

const isAdmin = (req: Request) => req.user?.role === 'ADMIN';
const approved = (membership: any) => Boolean(membership?.isApproved);
const moderator = (req: Request, membership: any) =>
  isAdmin(req) || (approved(membership) && MODERATOR_ROLES.has(String(membership.role || '').toUpperCase()));

const canSeeMetadata = (community: any, req: Request, membership: any) =>
  isAdmin(req) || community.visibility !== 'PRIVATE' || approved(membership);

const canSeeContent = (community: any, req: Request, membership: any) =>
  isAdmin(req) || community.visibility === 'PUBLIC' || approved(membership);

async function countsForCommunities(ids: string[]) {
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

async function enrichCommunities(rows: any[], userId?: string) {
  const ids = rows.map(row => row.id);
  const [counts, memberships] = await Promise.all([
    countsForCommunities(ids),
    userId && ids.length
      ? prisma.communityMember.findMany({ where: { userId, communityId: { in: ids } } })
      : Promise.resolve([] as any[]),
  ]);
  const membershipMap = new Map(memberships.map(m => [m.communityId, m]));
  return rows.map(row => {
    const membership: any = membershipMap.get(row.id);
    const memberCount = counts.members.get(row.id) || 0;
    const postCount = counts.posts.get(row.id) || 0;
    return {
      ...row,
      memberCount,
      member_count: memberCount,
      postCount,
      post_count: postCount,
      isJoined: Boolean(membership?.isApproved),
      is_joined: Boolean(membership?.isApproved),
      membershipStatus: membership ? (membership.isApproved ? 'JOINED' : 'PENDING_APPROVAL') : 'NOT_JOINED',
      membershipRole: membership ? (membership.isApproved ? membership.role : 'PENDING') : null,
      allows_anonymous: row.allowAnonymous,
      type: row.visibility,
    };
  });
}

async function profileMap(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return new Map<string, any>();
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      role: true,
      patientProfile: { select: { firstName: true, lastName: true } },
      doctorProfile: { select: { id: true, firstName: true, lastName: true, isVerified: true, verificationStatus: true } },
      hospitalProfile: { select: { id: true, name: true, isVerified: true, verificationStatus: true } },
    },
  });
  return new Map(users.map(user => {
    let name = 'HealthConnect Member';
    let firstName = '';
    let lastName = '';
    let doctorId: string | null = null;
    let verified = false;
    if (user.doctorProfile) {
      firstName = user.doctorProfile.firstName;
      lastName = user.doctorProfile.lastName;
      name = `Dr. ${firstName} ${lastName}`.trim();
      doctorId = user.doctorProfile.id;
      verified = user.doctorProfile.isVerified || user.doctorProfile.verificationStatus === 'VERIFIED';
    } else if (user.patientProfile) {
      firstName = user.patientProfile.firstName;
      lastName = user.patientProfile.lastName;
      name = `${firstName} ${lastName}`.trim();
    } else if (user.hospitalProfile) {
      name = user.hospitalProfile.name;
      verified = user.hospitalProfile.isVerified || user.hospitalProfile.verificationStatus === 'VERIFIED';
    } else if (user.role === 'ADMIN') {
      name = 'HealthConnect Team';
      verified = true;
    }
    return [user.id, { id: user.id, role: user.role, firstName, lastName, name, doctorId, verified }];
  }));
}

async function serializePosts(posts: any[], userId?: string) {
  if (!posts.length) return [];
  const postIds = posts.map(post => post.id);
  const [reactionRows, ownRows, profiles] = await Promise.all([
    prisma.postReaction.groupBy({
      by: ['postId', 'reactionType'],
      where: { postId: { in: postIds } },
      _count: { _all: true },
    }),
    userId
      ? prisma.postReaction.findMany({ where: { postId: { in: postIds }, userId }, select: { postId: true, reactionType: true } })
      : Promise.resolve([] as any[]),
    profileMap(posts.filter(post => !post.isAnonymous).map(post => post.authorId)),
  ]);

  const counts = new Map<string, Record<string, number>>();
  reactionRows.forEach(row => {
    const current = counts.get(row.postId) || { LIKE: 0, SUPPORT: 0, HELPFUL: 0 };
    current[row.reactionType] = row._count._all;
    counts.set(row.postId, current);
  });
  const own = new Map<string, string[]>();
  ownRows.forEach(row => own.set(row.postId, [...(own.get(row.postId) || []), row.reactionType.toLowerCase()]));

  return posts.map(post => {
    const author = post.isAnonymous ? null : profiles.get(post.authorId);
    const reactionCount = counts.get(post.id) || { LIKE: 0, SUPPORT: 0, HELPFUL: 0 };
    const userReactions = own.get(post.id) || [];
    const authorName = post.isAnonymous ? (post.anonymousAlias || 'Anonymous Member') : (author?.name || 'HealthConnect Member');
    return {
      id: post.id,
      communityId: post.communityId,
      ...(post.isAnonymous ? {} : { authorId: post.authorId }),
      title: post.title,
      body: post.body,
      tags: post.tags || [],
      isAnonymous: post.isAnonymous,
      anonymousAlias: post.isAnonymous ? authorName : null,
      status: post.status,
      isPinned: post.isPinned,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.isAnonymous ? null : author,
      author_name: authorName,
      is_doctor: Boolean(author?.role === 'DOCTOR' && author?.verified),
      commentCount: post._count?.comments || 0,
      comment_count: post._count?.comments || 0,
      reactions: {
        like: reactionCount.LIKE || 0,
        support: reactionCount.SUPPORT || 0,
        helpful: reactionCount.HELPFUL || 0,
      },
      userReactions,
      userReaction: userReactions[0] || null,
      user_reaction: userReactions[0] || null,
      isMine: Boolean(userId && post.authorId === userId),
    };
  });
}

async function serializeComments(rows: any[]) {
  const all = rows.flatMap(row => [row, ...(row.replies || [])]);
  const profiles = await profileMap(all.filter(row => !row.isAnonymous).map(row => row.authorId));
  const serialize = (row: any): any => {
    const author = row.isAnonymous ? null : profiles.get(row.authorId);
    return {
      id: row.id,
      postId: row.postId,
      parentId: row.parentId,
      body: row.isRemoved ? '[removed]' : row.body,
      isAnonymous: row.isAnonymous,
      isRemoved: row.isRemoved,
      author: row.isAnonymous ? null : author,
      author_name: row.isAnonymous ? 'Anonymous Member' : (author?.name || 'HealthConnect Member'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      replies: (row.replies || []).filter((reply: any) => !reply.isRemoved).map(serialize),
    };
  };
  return rows.filter(row => !row.isRemoved).map(serialize);
}

async function notifyUsers(userIds: string[], title: string, body: string, data: Record<string, any>) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  const users = await prisma.user.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, settings: { select: { communityActivity: true } } },
  });
  const recipients = users.filter(user => user.settings?.communityActivity !== false).map(user => user.id);
  if (!recipients.length) return;
  await prisma.notification.createMany({
    data: recipients.map(userId => ({ userId, type: 'COMMUNITY_ACTIVITY', title, body, data, isRead: false })),
  });
}

async function moderationAccess(req: Request, communityId: string) {
  const membership = await membershipFor(communityId, req.user?.userId);
  return { membership, allowed: moderator(req, membership) };
}

// Directory ------------------------------------------------------------------
export const getCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = intParam(req.query.page, 1, 1, 100000);
    const limit = intParam(req.query.limit, 24, 1, 100);
    const userId = req.user?.userId;
    const clauses: any[] = [{ isActive: true }];
    if (!isAdmin(req)) {
      clauses.push(userId
        ? { OR: [{ visibility: { in: ['PUBLIC', 'RESTRICTED'] } }, { members: { some: { userId, isApproved: true } } }] }
        : { visibility: 'PUBLIC' });
    }
    if (req.query.category) clauses.push({ category: { equals: String(req.query.category), mode: 'insensitive' } });
    if (req.query.language) clauses.push({ language: String(req.query.language) });
    if (req.query.visibility) clauses.push({ visibility: String(req.query.visibility) });
    if (req.query.featured === 'true') clauses.push({ isFeatured: true });
    if (req.query.featured === 'false') clauses.push({ isFeatured: false });
    if (req.query.search) {
      const search = String(req.query.search);
      clauses.push({ OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ] });
    }
    const where: any = { AND: clauses };
    const [rows, total] = await Promise.all([
      prisma.community.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }] }),
      prisma.community.count({ where }),
    ]);
    return ApiResponse.success(res, { communities: await enrichCommunities(rows, userId), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) { next(error); }
};

export const getFeaturedCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.community.findMany({ where: { isActive: true, isFeatured: true, visibility: 'PUBLIC' }, take: 12, orderBy: { createdAt: 'asc' } });
    return ApiResponse.success(res, await enrichCommunities(rows, req.user?.userId));
  } catch (error) { next(error); }
};

export const getRecommendedCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const joined = await prisma.communityMember.findMany({
      where: { userId, isApproved: true },
      select: { communityId: true, community: { select: { category: true } } },
    });
    const joinedIds = joined.map(row => row.communityId);
    const categories = [...new Set(joined.map(row => row.community.category).filter(Boolean) as string[])];
    let rows = await prisma.community.findMany({
      where: { isActive: true, visibility: { in: ['PUBLIC', 'RESTRICTED'] }, id: { notIn: joinedIds }, ...(categories.length ? { category: { in: categories } } : {}) },
      take: 8,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
    });
    if (!rows.length) rows = await prisma.community.findMany({ where: { isActive: true, visibility: 'PUBLIC', id: { notIn: joinedIds } }, take: 8, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }] });
    return ApiResponse.success(res, await enrichCommunities(rows, userId));
  } catch (error) { next(error); }
};

export const getCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.slug);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await membershipFor(community.id, req.user?.userId);
    if (!canSeeMetadata(community, req, membership)) return ApiResponse.notFound(res, 'Community not found');
    const [result] = await enrichCommunities([community], req.user?.userId);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

// Membership -----------------------------------------------------------------
export const joinCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    if (community.visibility === 'PRIVATE') return ApiResponse.forbidden(res, 'PRIVATE_COMMUNITY', 'This community is invitation-only');
    const userId = req.user!.userId;
    const existing = await membershipFor(community.id, userId);
    if (existing?.isApproved) return ApiResponse.success(res, { membershipStatus: 'JOINED' }, 'Already a member');
    if (existing) return ApiResponse.success(res, { membershipStatus: 'PENDING_APPROVAL' }, 'Your join request is pending approval');
    const needsApproval = community.requireApproval || community.visibility === 'RESTRICTED';
    const membership = await prisma.communityMember.create({ data: { communityId: community.id, userId, role: 'MEMBER', isApproved: !needsApproval } });
    if (needsApproval) {
      const mods = await prisma.communityMember.findMany({ where: { communityId: community.id, isApproved: true, role: { in: ['MODERATOR', 'OWNER', 'ADMIN'] } }, select: { userId: true } });
      await notifyUsers(mods.map(row => row.userId), 'Community join request', `A member requested to join ${community.name}.`, { communityId: community.id, membershipId: membership.id, action: 'MEMBERSHIP_REQUEST' });
      return ApiResponse.created(res, { membershipId: membership.id, membershipStatus: 'PENDING_APPROVAL' }, 'Join request submitted');
    }
    return ApiResponse.created(res, { membershipId: membership.id, membershipStatus: 'JOINED' }, 'Joined community successfully');
  } catch (error) { next(error); }
};

export const leaveCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await membershipFor(community.id, req.user!.userId);
    if (!membership) return ApiResponse.success(res, null, 'You are not a member of this community');
    if (String(membership.role).toUpperCase() === 'OWNER') return ApiResponse.error(res, 'OWNER_CANNOT_LEAVE', 'Transfer ownership before leaving', 409);
    await prisma.communityMember.delete({ where: { id: membership.id } });
    return ApiResponse.success(res, null, 'Left community successfully');
  } catch (error) { next(error); }
};

export const getCommunityMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await membershipFor(community.id, req.user?.userId);
    if (!canSeeContent(community, req, membership)) return ApiResponse.forbidden(res, 'Approved membership required');
    const page = intParam(req.query.page, 1, 1, 100000);
    const limit = intParam(req.query.limit, 20, 1, 50);
    const where = { communityId: community.id, isApproved: true };
    const [rows, total] = await Promise.all([
      prisma.communityMember.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { joinedAt: 'asc' } }),
      prisma.communityMember.count({ where }),
    ]);
    const profiles = await profileMap(rows.map(row => row.userId));
    return ApiResponse.success(res, {
      members: rows.map(row => ({ id: row.id, role: row.role, joinedAt: row.joinedAt, user: profiles.get(row.userId) || { id: row.userId, name: 'HealthConnect Member' } })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) { next(error); }
};

export const getMembershipRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const access = await moderationAccess(req, community.id);
    if (!access.allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const rows = await prisma.communityMember.findMany({ where: { communityId: community.id, isApproved: false }, orderBy: { joinedAt: 'asc' } });
    const profiles = await profileMap(rows.map(row => row.userId));
    return ApiResponse.success(res, rows.map(row => ({ id: row.id, joinedAt: row.joinedAt, user: profiles.get(row.userId) || { id: row.userId, name: 'HealthConnect Member' } })));
  } catch (error) { next(error); }
};

export const approveMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const access = await moderationAccess(req, community.id);
    if (!access.allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const pending = await prisma.communityMember.findFirst({ where: { id: req.params.memberId, communityId: community.id, isApproved: false } });
    if (!pending) return ApiResponse.notFound(res, 'Membership request not found');
    await prisma.communityMember.update({ where: { id: pending.id }, data: { isApproved: true } });
    await notifyUsers([pending.userId], 'Community request approved', `You can now participate in ${community.name}.`, { communityId: community.id, action: 'MEMBERSHIP_APPROVED' });
    return ApiResponse.success(res, null, 'Membership approved');
  } catch (error) { next(error); }
};

export const rejectMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const access = await moderationAccess(req, community.id);
    if (!access.allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const pending = await prisma.communityMember.findFirst({ where: { id: req.params.memberId, communityId: community.id, isApproved: false } });
    if (!pending) return ApiResponse.notFound(res, 'Membership request not found');
    await prisma.communityMember.delete({ where: { id: pending.id } });
    await notifyUsers([pending.userId], 'Community request update', `Your request to join ${community.name} was not approved.`, { communityId: community.id, action: 'MEMBERSHIP_REJECTED' });
    return ApiResponse.success(res, null, 'Membership request rejected');
  } catch (error) { next(error); }
};

// Posts ----------------------------------------------------------------------
export const getCommunityPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await membershipFor(community.id, req.user?.userId);
    if (!canSeeContent(community, req, membership)) return ApiResponse.forbidden(res, 'Approved membership required to view this community feed');
    const page = intParam(req.query.page, 1, 1, 100000);
    const limit = intParam(req.query.limit, 20, 1, 50);
    const sort = String(req.query.sort || 'newest');
    const where: any = { communityId: community.id, status: 'PUBLISHED' };
    if (req.query.search) {
      const search = String(req.query.search);
      where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { body: { contains: search, mode: 'insensitive' } }];
    }
    if (req.query.authorId) {
      const authorId = String(req.query.authorId);
      if (authorId !== req.user?.userId && !moderator(req, membership)) return ApiResponse.forbidden(res, 'You can only filter to your own posts');
      where.authorId = authorId;
    }
    let orderBy: any = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'oldest') orderBy = [{ isPinned: 'desc' }, { createdAt: 'asc' }];
    if (sort === 'popular' || sort === 'trending') orderBy = [{ isPinned: 'desc' }, { reactions: { _count: 'desc' } }, { comments: { _count: 'desc' } }, { createdAt: 'desc' }];
    const [posts, total] = await Promise.all([
      prisma.post.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy, include: { _count: { select: { comments: true, reactions: true } } } }),
      prisma.post.count({ where }),
    ]);
    return ApiResponse.success(res, { posts: await serializePosts(posts, req.user?.userId), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) { next(error); }
};

export const getRecentPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await membershipFor(community.id, req.user?.userId);
    if (!canSeeContent(community, req, membership)) return ApiResponse.forbidden(res, 'Approved membership required');
    const limit = intParam(req.query.limit, 5, 1, 10);
    const posts = await prisma.post.findMany({ where: { communityId: community.id, status: 'PUBLISHED' }, take: limit, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }], include: { _count: { select: { comments: true, reactions: true } } } });
    return ApiResponse.success(res, await serializePosts(posts, req.user?.userId));
  } catch (error) { next(error); }
};

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const userId = req.user!.userId;
    const membership = await membershipFor(community.id, userId);
    if (!isAdmin(req) && !approved(membership)) return ApiResponse.forbidden(res, 'Join this community before posting');
    const isAnonymous = Boolean(req.body.isAnonymous);
    if (isAnonymous) {
      if (!community.allowAnonymous) return ApiResponse.forbidden(res, 'Anonymous posting is disabled in this community');
      const settings = await prisma.userSettings.findUnique({ where: { userId } });
      if (settings?.allowAnonymousPosting === false) return ApiResponse.forbidden(res, 'Anonymous posting is disabled in your privacy settings');
    }
    const post = await prisma.post.create({
      data: { communityId: community.id, authorId: userId, title: req.body.title || null, body: req.body.body, tags: req.body.tags || [], isAnonymous, anonymousAlias: isAnonymous ? (req.body.anonymousAlias || 'Anonymous Member') : null, status: 'PUBLISHED' },
      include: { _count: { select: { comments: true, reactions: true } } },
    });
    const [result] = await serializePosts([post], userId);
    return ApiResponse.created(res, result, 'Post published');
  } catch (error) { next(error); }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, communityId: community.id, status: { not: 'REMOVED' } } });
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    if (post.authorId !== req.user!.userId) return ApiResponse.forbidden(res, 'Only the post author can edit this post');
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: { ...(req.body.title !== undefined ? { title: req.body.title || null } : {}), ...(req.body.body !== undefined ? { body: req.body.body } : {}), ...(req.body.tags !== undefined ? { tags: req.body.tags } : {}) },
      include: { _count: { select: { comments: true, reactions: true } } },
    });
    const [result] = await serializePosts([updated], req.user!.userId);
    return ApiResponse.success(res, result, 'Post updated');
  } catch (error) { next(error); }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, communityId: community.id, status: { not: 'REMOVED' } } });
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    const membership = await membershipFor(community.id, req.user!.userId);
    const isModerator = moderator(req, membership);
    if (post.authorId !== req.user!.userId && !isModerator) return ApiResponse.forbidden(res, 'You do not have permission to remove this post');
    await prisma.post.update({ where: { id: post.id }, data: { status: 'REMOVED', isPinned: false } });
    if (isModerator && post.authorId !== req.user!.userId) await prisma.communityModerationLog.create({ data: { communityId: community.id, moderatorId: req.user!.userId, action: 'DELETE_CONTENT', targetType: 'POST', targetId: post.id, reason: 'Removed by moderator' } });
    return ApiResponse.success(res, null, 'Post removed');
  } catch (error) { next(error); }
};

export const setPostPinned = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const access = await moderationAccess(req, community.id);
    if (!access.allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, communityId: community.id, status: 'PUBLISHED' } });
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    const isPinned = !post.isPinned;
    await prisma.$transaction([
      prisma.post.update({ where: { id: post.id }, data: { isPinned } }),
      prisma.communityModerationLog.create({ data: { communityId: community.id, moderatorId: req.user!.userId, action: isPinned ? 'PIN_POST' : 'UNPIN_POST', targetType: 'POST', targetId: post.id } }),
    ]);
    return ApiResponse.success(res, { isPinned }, isPinned ? 'Post pinned' : 'Post unpinned');
  } catch (error) { next(error); }
};

// Comments -------------------------------------------------------------------
export const getPostComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, status: 'PUBLISHED' }, include: { community: true } });
    if (!post || !post.community.isActive) return ApiResponse.notFound(res, 'Post not found');
    const membership = await membershipFor(post.communityId, req.user?.userId);
    if (!canSeeContent(post.community, req, membership)) return ApiResponse.forbidden(res, 'Approved membership required');
    const rows = await prisma.comment.findMany({ where: { postId: post.id, parentId: null, isRemoved: false }, orderBy: { createdAt: 'asc' }, include: { replies: { where: { isRemoved: false }, orderBy: { createdAt: 'asc' } } } });
    return ApiResponse.success(res, await serializeComments(rows));
  } catch (error) { next(error); }
};

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, status: 'PUBLISHED' }, include: { community: true } });
    if (!post || !post.community.isActive) return ApiResponse.notFound(res, 'Post not found');
    const userId = req.user!.userId;
    const membership = await membershipFor(post.communityId, userId);
    if (!isAdmin(req) && !approved(membership)) return ApiResponse.forbidden(res, 'Join this community before replying');
    if (req.body.parentId) {
      const parent = await prisma.comment.findFirst({ where: { id: req.body.parentId, postId: post.id, isRemoved: false } });
      if (!parent) return ApiResponse.error(res, 'INVALID_PARENT', 'Parent comment does not belong to this post', 400);
    }
    if (req.body.isAnonymous) {
      if (!post.community.allowAnonymous) return ApiResponse.forbidden(res, 'Anonymous replies are disabled in this community');
      const settings = await prisma.userSettings.findUnique({ where: { userId } });
      if (settings?.allowAnonymousPosting === false) return ApiResponse.forbidden(res, 'Anonymous posting is disabled in your privacy settings');
    }
    const comment = await prisma.comment.create({ data: { postId: post.id, authorId: userId, body: req.body.body, parentId: req.body.parentId || null, isAnonymous: Boolean(req.body.isAnonymous) } });
    const [result] = await serializeComments([{ ...comment, replies: [] }]);
    return ApiResponse.created(res, result, 'Reply added');
  } catch (error) { next(error); }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId }, include: { post: { include: { community: true } } } });
    if (!comment || !comment.post.community.isActive) return ApiResponse.notFound(res, 'Comment not found');
    const membership = await membershipFor(comment.post.communityId, req.user!.userId);
    const isModerator = moderator(req, membership);
    if (comment.authorId !== req.user!.userId && !isModerator) return ApiResponse.forbidden(res, 'You do not have permission to remove this reply');
    await prisma.comment.update({ where: { id: comment.id }, data: { isRemoved: true, body: '[removed]' } });
    if (isModerator && comment.authorId !== req.user!.userId) await prisma.communityModerationLog.create({ data: { communityId: comment.post.communityId, moderatorId: req.user!.userId, action: 'DELETE_CONTENT', targetType: 'COMMENT', targetId: comment.id, reason: 'Removed by moderator' } });
    return ApiResponse.success(res, null, 'Reply removed');
  } catch (error) { next(error); }
};

// Reactions ------------------------------------------------------------------
export const reactToPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, status: 'PUBLISHED' }, include: { community: true } });
    if (!post || !post.community.isActive) return ApiResponse.notFound(res, 'Post not found');
    const userId = req.user!.userId;
    const membership = await membershipFor(post.communityId, userId);
    if (!isAdmin(req) && !approved(membership)) return ApiResponse.forbidden(res, 'Join this community before reacting');
    const reactionType = req.body.reactionType;
    const existing = await prisma.postReaction.findUnique({ where: { postId_userId_reactionType: { postId: post.id, userId, reactionType } } });
    if (existing) await prisma.postReaction.delete({ where: { id: existing.id } });
    else await prisma.postReaction.create({ data: { postId: post.id, userId, reactionType } });
    const [grouped, own] = await Promise.all([
      prisma.postReaction.groupBy({ by: ['reactionType'], where: { postId: post.id }, _count: { _all: true } }),
      prisma.postReaction.findMany({ where: { postId: post.id, userId }, select: { reactionType: true } }),
    ]);
    const counts: Record<string, number> = { LIKE: 0, SUPPORT: 0, HELPFUL: 0 };
    grouped.forEach(row => { counts[row.reactionType] = row._count._all; });
    return ApiResponse.success(res, { active: !existing, reactionType, reactions: { like: counts.LIKE, support: counts.SUPPORT, helpful: counts.HELPFUL }, userReactions: own.map(row => row.reactionType.toLowerCase()) });
  } catch (error) { next(error); }
};

export const removeReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.postId, status: 'PUBLISHED' }, include: { community: true } });
    if (!post || !post.community.isActive) return ApiResponse.notFound(res, 'Post not found');
    const membership = await membershipFor(post.communityId, req.user!.userId);
    if (!isAdmin(req) && !approved(membership)) return ApiResponse.forbidden(res, 'Approved membership required');
    const type = req.query.reactionType ? String(req.query.reactionType).toUpperCase() : undefined;
    if (type && !['LIKE', 'SUPPORT', 'HELPFUL'].includes(type)) return ApiResponse.error(res, 'INVALID_REACTION', 'Unknown reaction type', 400);
    await prisma.postReaction.deleteMany({ where: { postId: post.id, userId: req.user!.userId, ...(type ? { reactionType: type as any } : {}) } });
    return ApiResponse.success(res, null, 'Reaction removed');
  } catch (error) { next(error); }
};

// Requests -------------------------------------------------------------------
export const submitCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const communityName = req.body.communityName.trim();
    const existingCommunity = await prisma.community.findFirst({ where: { name: { equals: communityName, mode: 'insensitive' } } });
    if (existingCommunity) return ApiResponse.error(res, 'COMMUNITY_EXISTS', 'A community with this name already exists', 409);
    const duplicate = await prisma.communityRequest.findFirst({ where: { requestedBy: userId, status: 'PENDING', communityName: { equals: communityName, mode: 'insensitive' } } });
    if (duplicate) return ApiResponse.success(res, duplicate, 'This request is already pending');
    const request = await prisma.communityRequest.create({ data: { communityName, category: req.body.category || null, reason: req.body.reason, requestedBy: userId } });
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    if (admins.length) await prisma.notification.createMany({ data: admins.map(admin => ({ userId: admin.id, type: 'COMMUNITY_REQUEST', title: 'New community request', body: `${communityName} was requested for review.`, data: { requestId: request.id }, isRead: false })) });
    return ApiResponse.created(res, request, 'Community request submitted');
  } catch (error) { next(error); }
};

export const getMyCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.communityRequest.findMany({ where: { requestedBy: req.user!.userId }, orderBy: { createdAt: 'desc' }, take: 20 });
    return ApiResponse.success(res, { requests, latest: requests[0] || null });
  } catch (error) { next(error); }
};

// Events ---------------------------------------------------------------------
export const getCommunityEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await membershipFor(community.id, req.user?.userId);
    if (!canSeeContent(community, req, membership)) return ApiResponse.forbidden(res, 'Approved membership required');
    const userId = req.user?.userId;
    const events = await prisma.communityEvent.findMany({
      where: { communityId: community.id, isCancelled: false, ...(req.query.all === 'true' ? {} : { eventDate: { gte: new Date() } }) },
      orderBy: { eventDate: 'asc' },
      take: 50,
      include: { _count: { select: { rsvps: true } }, ...(userId ? { rsvps: { where: { userId }, select: { status: true } } } : {}) },
    });
    return ApiResponse.success(res, events.map((event: any) => ({ ...event, rsvpCount: event._count?.rsvps || 0, myRsvp: event.rsvps?.[0]?.status || null, _count: undefined, rsvps: undefined })));
  } catch (error) { next(error); }
};

export const createCommunityEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const access = await moderationAccess(req, community.id);
    if (!access.allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const eventDate = new Date(req.body.eventDate);
    if (eventDate.getTime() <= Date.now()) return ApiResponse.error(res, 'INVALID_EVENT_DATE', 'Event must be scheduled in the future', 400);
    const event = await prisma.communityEvent.create({ data: { communityId: community.id, createdBy: req.user!.userId, title: req.body.title, description: req.body.description || null, eventDate, format: req.body.format, location: req.body.location || null, meetLink: req.body.meetLink || null } });
    const members = await prisma.communityMember.findMany({ where: { communityId: community.id, isApproved: true, userId: { not: req.user!.userId } }, select: { userId: true } });
    await notifyUsers(members.map(row => row.userId), `New event in ${community.name}`, event.title, { communityId: community.id, eventId: event.id, action: 'EVENT_CREATED' });
    return ApiResponse.created(res, event, 'Community event created');
  } catch (error) { next(error); }
};

export const cancelCommunityEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.communityEvent.findUnique({ where: { id: req.params.eventId }, include: { community: true } });
    if (!event || !event.community.isActive) return ApiResponse.notFound(res, 'Event not found');
    const access = await moderationAccess(req, event.communityId);
    if (!access.allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    await prisma.communityEvent.update({ where: { id: event.id }, data: { isCancelled: true } });
    return ApiResponse.success(res, null, 'Event cancelled');
  } catch (error) { next(error); }
};

export const rsvpCommunityEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.communityEvent.findUnique({ where: { id: req.params.eventId }, include: { community: true } });
    if (!event || event.isCancelled || !event.community.isActive) return ApiResponse.notFound(res, 'Event not found');
    if (event.eventDate.getTime() <= Date.now()) return ApiResponse.error(res, 'EVENT_ENDED', 'This event has already started or ended', 409);
    const membership = await membershipFor(event.communityId, req.user!.userId);
    if (!isAdmin(req) && !approved(membership)) return ApiResponse.forbidden(res, 'Join this community before responding to events');
    const rsvp = await prisma.communityEventRsvp.upsert({ where: { eventId_userId: { eventId: event.id, userId: req.user!.userId } }, create: { eventId: event.id, userId: req.user!.userId, status: req.body.status }, update: { status: req.body.status } });
    return ApiResponse.success(res, rsvp, 'RSVP updated');
  } catch (error) { next(error); }
};

// Reports and moderation -----------------------------------------------------
export const reportCommunityContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await membershipFor(community.id, req.user!.userId);
    if (!isAdmin(req) && !approved(membership)) return ApiResponse.forbidden(res, 'Join this community before reporting content');
    if (req.body.targetType === 'POST') {
      const post = await prisma.post.findFirst({ where: { id: req.body.targetId, communityId: community.id, status: 'PUBLISHED' } });
      if (!post) return ApiResponse.notFound(res, 'Reported post not found');
    } else {
      const comment = await prisma.comment.findFirst({ where: { id: req.body.targetId, post: { communityId: community.id }, isRemoved: false } });
      if (!comment) return ApiResponse.notFound(res, 'Reported reply not found');
    }
    const duplicate = await prisma.communityReport.findFirst({ where: { communityId: community.id, reporterId: req.user!.userId, targetId: req.body.targetId } });
    if (duplicate) return ApiResponse.success(res, duplicate, 'You have already reported this content');
    const report = await prisma.communityReport.create({ data: { communityId: community.id, reporterId: req.user!.userId, targetType: req.body.targetType, targetId: req.body.targetId, reason: req.body.reason, details: req.body.details || null } });
    return ApiResponse.created(res, report, 'Report submitted for moderator review');
  } catch (error) { next(error); }
};

export const getCommunityReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const access = await moderationAccess(req, community.id);
    if (!access.allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const status = String(req.query.status || 'PENDING').toUpperCase();
    if (!['PENDING', 'RESOLVED', 'DISMISSED'].includes(status)) return ApiResponse.error(res, 'INVALID_STATUS', 'Invalid report status', 400);
    const reports = await prisma.communityReport.findMany({ where: { communityId: community.id, status: status as any }, orderBy: { createdAt: 'asc' }, take: 100 });
    return ApiResponse.success(res, reports);
  } catch (error) { next(error); }
};

export const resolveCommunityReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const access = await moderationAccess(req, community.id);
    if (!access.allowed) return ApiResponse.forbidden(res, 'Moderator access required');
    const report = await prisma.communityReport.findFirst({ where: { id: req.params.reportId, communityId: community.id, status: 'PENDING' } });
    if (!report) return ApiResponse.notFound(res, 'Pending report not found');
    const action = req.body.action as 'DISMISS' | 'DELETE_CONTENT';
    await prisma.$transaction(async tx => {
      if (action === 'DELETE_CONTENT') {
        if (report.targetType === 'POST') await tx.post.updateMany({ where: { id: report.targetId, communityId: community.id }, data: { status: 'REMOVED', isPinned: false } });
        if (report.targetType === 'COMMENT') {
          const target = await tx.comment.findUnique({ where: { id: report.targetId }, include: { post: { select: { communityId: true } } } });
          if (target?.post.communityId === community.id) await tx.comment.update({ where: { id: report.targetId }, data: { isRemoved: true, body: '[removed]' } });
        }
      }
      await tx.communityReport.update({ where: { id: report.id }, data: { status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED', resolvedBy: req.user!.userId, resolvedAt: new Date(), resolution: req.body.resolution } });
      await tx.communityModerationLog.create({ data: { communityId: community.id, moderatorId: req.user!.userId, action, targetType: report.targetType, targetId: report.targetId, reason: req.body.resolution, details: { reportId: report.id } } });
    });
    return ApiResponse.success(res, null, action === 'DISMISS' ? 'Report dismissed' : 'Reported content removed');
  } catch (error) { next(error); }
};

export const getCommunityHealthScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await findCommunity(req.params.id);
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const membership = await membershipFor(community.id, req.user?.userId);
    if (!canSeeMetadata(community, req, membership)) return ApiResponse.notFound(res, 'Community not found');
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
  } catch (error) { next(error); }
};

// Compatibility endpoint: previous implementation returned success without persistence.
export const followCommunity = async (_req: Request, res: Response) =>
  ApiResponse.error(res, 'NOT_SUPPORTED', 'Following is not a persisted Community feature. Join the community instead.', 410);
