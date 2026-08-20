import { api } from '@/lib/api';

export type CommunityListParams = {
  search?: string;
  category?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  language?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
};

export type CommunityPostParams = {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'popular' | 'trending';
  authorId?: string;
  search?: string;
};

export const unwrap = <T = any>(response: any): T => response?.data?.data as T;

export const communityApiV2 = {
  list: async (params?: CommunityListParams) => unwrap(await api.get('/communities', { params: {
    ...params,
    ...(params?.featured !== undefined ? { featured: String(params.featured) } : {}),
  } })),
  featured: async () => unwrap(await api.get('/communities/featured')),
  recommended: async () => unwrap(await api.get('/communities/recommended')),
  get: async (idOrSlug: string) => unwrap(await api.get(`/communities/${idOrSlug}`)),
  healthScore: async (communityId: string) => unwrap(await api.get(`/communities/${communityId}/health-score`)),

  join: async (communityId: string) => unwrap(await api.post(`/communities/${communityId}/join`)),
  leave: async (communityId: string) => unwrap(await api.delete(`/communities/${communityId}/leave`)),
  members: async (communityId: string, params?: { page?: number; limit?: number }) =>
    unwrap(await api.get(`/communities/${communityId}/members`, { params })),
  membershipRequests: async (communityId: string) => unwrap(await api.get(`/communities/${communityId}/membership-requests`)),
  approveMembership: async (communityId: string, membershipId: string) =>
    unwrap(await api.patch(`/communities/${communityId}/members/${membershipId}/approve`)),
  rejectMembership: async (communityId: string, membershipId: string) =>
    unwrap(await api.delete(`/communities/${communityId}/members/${membershipId}`)),

  posts: async (communityId: string, params?: CommunityPostParams) =>
    unwrap(await api.get(`/communities/${communityId}/posts`, { params })),
  recentPosts: async (communityId: string, limit = 5) =>
    unwrap(await api.get(`/communities/${communityId}/posts/recent`, { params: { limit } })),
  createPost: async (communityId: string, data: {
    title?: string;
    body: string;
    tags?: string[];
    isAnonymous?: boolean;
    anonymousAlias?: string;
  }) => unwrap(await api.post(`/communities/${communityId}/posts`, data)),
  updatePost: async (communityId: string, postId: string, data: { title?: string | null; body?: string; tags?: string[] }) =>
    unwrap(await api.put(`/communities/${communityId}/posts/${postId}`, data)),
  deletePost: async (communityId: string, postId: string) =>
    unwrap(await api.delete(`/communities/${communityId}/posts/${postId}`)),
  pinPost: async (communityId: string, postId: string) =>
    unwrap(await api.patch(`/communities/${communityId}/posts/${postId}/pin`)),

  comments: async (postId: string) => unwrap(await api.get(`/communities/posts/${postId}/comments`)),
  addComment: async (postId: string, data: { body: string; parentId?: string; isAnonymous?: boolean }) =>
    unwrap(await api.post(`/communities/posts/${postId}/comments`, data)),
  deleteComment: async (commentId: string) => unwrap(await api.delete(`/communities/comments/${commentId}`)),

  react: async (postId: string, reactionType: 'LIKE' | 'SUPPORT' | 'HELPFUL') =>
    unwrap(await api.post(`/communities/posts/${postId}/react`, { reactionType })),
  removeReaction: async (postId: string, reactionType?: 'LIKE' | 'SUPPORT' | 'HELPFUL') =>
    unwrap(await api.delete(`/communities/posts/${postId}/react`, { params: reactionType ? { reactionType } : undefined })),

  requestCommunity: async (data: { communityName: string; category?: string; reason: string }) =>
    unwrap(await api.post('/communities/request', data)),
  requestStatus: async () => unwrap(await api.get('/communities/request/status')),

  events: async (communityId: string, all = false) =>
    unwrap(await api.get(`/communities/${communityId}/events`, { params: all ? { all: 'true' } : undefined })),
  createEvent: async (communityId: string, data: {
    title: string;
    description?: string;
    eventDate: string;
    format: 'ONLINE' | 'OFFLINE' | 'HYBRID';
    location?: string;
    meetLink?: string;
  }) => unwrap(await api.post(`/communities/${communityId}/events`, data)),
  rsvpEvent: async (eventId: string, status: 'GOING' | 'NOT_GOING' | 'MAYBE') =>
    unwrap(await api.post(`/communities/events/${eventId}/rsvp`, { status })),
  cancelEvent: async (eventId: string) => unwrap(await api.delete(`/communities/events/${eventId}`)),

  report: async (communityId: string, data: {
    targetType: 'POST' | 'COMMENT';
    targetId: string;
    reason: 'MISINFORMATION' | 'HARASSMENT' | 'SPAM' | 'INAPPROPRIATE' | 'OTHER';
    details?: string;
  }) => unwrap(await api.post(`/communities/${communityId}/reports`, data)),
  reports: async (communityId: string, status: 'PENDING' | 'RESOLVED' | 'DISMISSED' = 'PENDING') =>
    unwrap(await api.get(`/communities/${communityId}/reports`, { params: { status } })),
  resolveReport: async (communityId: string, reportId: string, data: { action: 'DISMISS' | 'DELETE_CONTENT'; resolution: string }) =>
    unwrap(await api.patch(`/communities/${communityId}/reports/${reportId}`, data)),
};

export default communityApiV2;
