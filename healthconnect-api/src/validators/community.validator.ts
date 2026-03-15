import { z } from 'zod';

export const communitySearchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']).optional(),
  language: z.string().optional(),
  featured: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const createPostSchema = z.object({
  title: z.string().optional(),
  body: z.string().min(1, 'Post content is required'),
  tags: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment is required'),
  parentId: z.string().uuid().optional(),
  isAnonymous: z.boolean().optional(),
});

export const reactionSchema = z.object({
  reactionType: z.enum(['LIKE', 'SUPPORT', 'HELPFUL']),
});
