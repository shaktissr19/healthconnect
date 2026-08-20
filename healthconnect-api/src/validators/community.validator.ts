import { z } from 'zod';

const shortText = z.string().trim().min(1).max(160);

export const communitySearchSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']).optional(),
  language: z.string().trim().min(2).max(12).optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const postSearchSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  sort: z.enum(['newest', 'oldest', 'popular', 'trending']).optional(),
  authorId: z.string().trim().min(1).max(128).optional(),
  search: z.string().trim().max(100).optional(),
});

export const createPostSchema = z.object({
  title: z.string().trim().max(180).optional(),
  body: z.string().trim().min(1, 'Post content is required').max(10000),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  isAnonymous: z.boolean().optional(),
  anonymousAlias: z.string().trim().min(2).max(40).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().trim().max(180).nullable().optional(),
  body: z.string().trim().min(1).max(10000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
}).refine(value => Object.keys(value).length > 0, 'At least one field is required');

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment is required').max(3000),
  parentId: z.string().trim().min(1).max(128).optional(),
  isAnonymous: z.boolean().optional(),
});

export const reactionSchema = z.object({
  reactionType: z.enum(['LIKE', 'SUPPORT', 'HELPFUL']),
});

export const createCommunityRequestSchema = z.object({
  communityName: shortText,
  category: z.string().trim().max(80).optional(),
  reason: z.string().trim().min(10, 'Please explain why this community is needed').max(1500),
});

export const createCommunityEventSchema = z.object({
  title: shortText,
  description: z.string().trim().max(2500).optional(),
  eventDate: z.coerce.date(),
  format: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).default('ONLINE'),
  location: z.string().trim().max(250).optional(),
  meetLink: z.string().trim().url().max(500).optional(),
});

export const eventRsvpSchema = z.object({
  status: z.enum(['GOING', 'NOT_GOING', 'MAYBE']),
});

export const communityReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().trim().min(1).max(128),
  reason: z.enum(['MISINFORMATION', 'HARASSMENT', 'SPAM', 'INAPPROPRIATE', 'OTHER']).default('OTHER'),
  details: z.string().trim().max(1500).optional(),
});

export const resolveCommunityReportSchema = z.object({
  action: z.enum(['DISMISS', 'DELETE_CONTENT']),
  resolution: z.string().trim().min(2).max(1500),
});
