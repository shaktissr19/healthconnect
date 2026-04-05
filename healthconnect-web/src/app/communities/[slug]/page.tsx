'use client';
// src/app/communities/[slug]/page.tsx
// FIXES:
//   1. Removed broken sidebar APIs (/polls, /health-score, /match, /bookmark)
//   2. Token read now checks hc-auth Zustand store first, then cookie, then localStorage
//   3. Non-members see teaser (3 blurred posts + join CTA) instead of full feed
//   4. "Open Feed" from dashboard panel now correctly navigates here
//   5. PublicNavbar used so nav is consistent with rest of public pages
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import PublicNavbar from '@/components/PublicNavbar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id: string; body: string; title?: string; tags: string[];
  isAnonymous: boolean; anonymousAlias?: string;
  author_name: string; is_doctor: boolean;
  createdAt: string; isPinned: boolean; viewCount: number;
  comment_count: number;
  reactions: { like: number; support: number; helpful: number };
  user_reaction: string | null;
}
interface Comment {
  id: string; body: string; isAnonymous: boolean; author_name: string;
  createdAt: string; parentId: string | null; replies: Comment[];
}
interface Community {
  id: string; slug: string; name: string; description?: string;
  emoji?: string; category?: string; visibility: string;
  allowAnonymous: boolean; allows_anonymous?: boolean;
  isFeatured: boolean; member_count: number; post_count: number;
  is_joined: boolean; rules?: string;
}
interface AuthUser { id: string; name: string; role: string; token: string; }

// API base
const API_ENV = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';
const API = API_ENV.endsWith('/api/v1') ? API_ENV.slice(0, -7) : API_ENV.replace(/\/$/, '');

// ─── Get raw token for fetch() Authorization headers ─────────────────────────
// Checks: Zustand store (in-memory, most reliable) → cookie → localStorage legacy
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // 1. Zustand in-memory store (primary — set by AuthModal, survives page nav)
  try {
    const s = (useAuthStore as any).getState?.();
    if (s?.isAuthenticated && s?.token) return s.token;
  } catch { /**/ }
  // 2. Persisted hc-auth in localStorage (Zustand persist)
  try {
    const raw = localStorage.getItem('hc-auth');
    if (raw) {
      const state = JSON.parse(raw)?.state ?? JSON.parse(raw);
      if (state?.token) return state.token;
    }
  } catch { /**/ }
  // 3. Cookie (set by /api/auth/set-cookie route after login)
  try {
    const m = document.cookie.match(/hc_token=([^;]+)/);
    if (m?.[1]) return m[1];
  } catch { /**/ }
  // 4. Legacy localStorage
  try {
    const t = localStorage.getItem('hc_token') || sessionStorage.getItem('hc_token');
    if (t) return t;
  } catch { /**/ }
  return null;
};

// ─── Build AuthUser from Zustand store or localStorage ───────────────────────
const getAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const token = getToken();
  if (!token) return null;
  // Try Zustand store user
  try {
    const s = (useAuthStore as any).getState?.();
    if (s?.user) {
      const u = s.user;
      return {
        id: u.id ?? u.userId,
        name: (`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()) || u.name || 'User',
        role: u.role ?? 'PATIENT',
        token,
      };
    }
  } catch { /**/ }
  // Try persisted store
  try {
    const raw = localStorage.getItem('hc-auth');
    if (raw) {
      const state = JSON.parse(raw)?.state ?? JSON.parse(raw);
      if (state?.user) {
        const u = state.user;
        return {
          id: u.id ?? u.userId,
          name: (`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()) || u.name || 'User',
          role: u.role ?? 'PATIENT',
          token,
        };
      }
    }
  } catch { /**/ }
  // Try hc_user key
  try {
    const userRaw = localStorage.getItem('hc_user') || sessionStorage.getItem('hc_user');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      return {
        id: u.id ?? u.userId,
        name: ((u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()) || 'User'),
        role: u.role ?? 'PATIENT',
        token,
      };
    }
  } catch { /**/ }
  return null;
};

const getDashboardRoute = (r: string) =>
  r === 'DOCTOR' ? '/doctor-dashboard' : r === 'HOSPITAL' ? '/hospital-dashboard' : '/dashboard';

const CAT_COLOR: Record<string, string> = {
  'Diabetes': '#E53E3E', 'Heart Health': '#C53030', 'Mental Wellness': '#6B46C1',
  'Cancer Support': '#B7791F', 'Thyroid': '#805AD5', 'PCOS/PCOD': '#D53F8C',
  'Arthritis': '#2B6CB0', 'Hypertension': '#276749', 'Kidney Health': '#285E61',
  'Respiratory': '#2C5282', 'Nutrition & Diet': '#276749', 'Senior Care': '#C05621',
  'General': '#0D9488',
};
const CAT_BG: Record<string, string> = {
  'Diabetes': '#FFF5F5', 'Heart Health': '#FFF5F5', 'Mental Wellness': '#FAF5FF',
  'Cancer Support': '#FFFAF0', 'Thyroid': '#F5F0FF', 'PCOS/PCOD': '#FFF0F5',
  'Arthritis': '#EBF8FF', 'Hypertension': '#F0FFF4', 'Kidney Health': '#E6FFFA',
  'Respiratory': '#EBF8FF', 'Nutrition & Diet': '#F0FFF4', 'Senior Care': '#FFFAF0',
  'General': '#F0FDFA',
};

const POST_TYPES = ['General', 'Question', 'Tip / Advice', 'Success Story', 'Need Support', 'News & Research'];
const TYPE_META: Record<string, { color: string; bg: string; icon: string }> = {
  'Success Story':   { color: '#276749', bg: '#F0FFF4', icon: '🏆' },
  'Question':        { color: '#2B6CB0', bg: '#EBF8FF', icon: '❓' },
  'Tip / Advice':    { color: '#B7791F', bg: '#FFFAF0', icon: '💡' },
  'Need Support':    { color: '#C53030', bg: '#FFF5F5', icon: '🤝' },
  'News & Research': { color: '#6B46C1', bg: '#FAF5FF', icon: '📰' },
  'General':         { color: '#475569', bg: '#F8FAFC', icon: '💬' },
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000)    return 'Just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

// ─── Post Card ────────────────────────────────────────────────────────────────
const PostCard = ({
  post, accent, user, onReact, onCommentClick, onSignIn, blurred = false,
}: {
  post: Post; accent: string; user: AuthUser | null; blurred?: boolean;
  onReact: (id: string, type: string) => void;
  onCommentClick: (p: Post) => void;
  onSignIn: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayType = POST_TYPES.find(t =>
    (post.tags || []).includes(t.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/ /g, '-'))
  ) || 'General';
  const tm = TYPE_META[displayType] || TYPE_META['General'];

  return (
    <div style={{
      background: '#F1F5F9', border: '1px solid #E8EEF5', borderRadius: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      filter: blurred ? 'blur(4px)' : 'none',
      userSelect: blurred ? 'none' : 'auto',
      pointerEvents: blurred ? 'none' : 'auto',
      transition: 'box-shadow 0.2s',
    }}>
      {post.isPinned && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 10, background: '#FFFBEB', color: '#B7791F', border: '1px solid #F6E05E', borderRadius: 6, padding: '2px 8px', fontWeight: 800 }}>📌 PINNED</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: post.isAnonymous ? '#F1F5F9' : `linear-gradient(135deg,${accent}CC,${accent}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: post.isAnonymous ? 16 : 13, fontWeight: 800, color: post.isAnonymous ? '#64748B' : '#fff', flexShrink: 0 }}>
          {post.isAnonymous ? '🎭' : post.author_name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: post.isAnonymous ? '#94A3B8' : '#1E293B', fontStyle: post.isAnonymous ? 'italic' : 'normal' }}>
              {post.author_name}
            </span>
            {post.is_doctor && !post.isAnonymous && (
              <span style={{ fontSize: 9, background: '#F0FFF4', color: '#276749', border: '1px solid #9AE6B4', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>✓ Verified Doctor</span>
            )}
            <span style={{ fontSize: 10, color: tm.color, background: tm.bg, borderRadius: 8, padding: '2px 8px', fontWeight: 700 }}>{tm.icon} {displayType}</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{timeAgo(post.createdAt)}</div>
        </div>
      </div>

      {post.title && <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginBottom: 8, lineHeight: 1.4 }}>{post.title}</div>}
      <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.72, marginBottom: 14 }}>
        {post.body.length > 300 && !expanded
          ? <>{post.body.slice(0, 300)}... <button onClick={() => setExpanded(true)} style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Read more</button></>
          : post.body}
      </div>

      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {post.tags.map((t, i) => <span key={i} style={{ fontSize: 10, color: '#64748B', background: '#F1F5F9', borderRadius: 5, padding: '2px 7px' }}>#{t}</span>)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
        {[{ emoji: '❤️', key: 'like', count: post.reactions.like }, { emoji: '🤝', key: 'support', count: post.reactions.support }, { emoji: '💡', key: 'helpful', count: post.reactions.helpful }].map(r => (
          <button key={r.key}
            onClick={() => user ? onReact(post.id, r.key) : onSignIn()}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: post.user_reaction === r.key ? `${accent}18` : '#F8FAFC', border: `1px solid ${post.user_reaction === r.key ? accent + '44' : '#E2E8F0'}`, borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontSize: 11.5, color: post.user_reaction === r.key ? accent : '#475569', fontWeight: 600 }}>
            <span style={{ fontSize: 13 }}>{r.emoji}</span>
            {r.count > 0 && <span style={{ fontWeight: 700 }}>{r.count}</span>}
          </button>
        ))}
        <button onClick={() => user ? onCommentClick(post) : onSignIn()}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
          💬 {post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}
        </button>
      </div>
    </div>
  );
};

// ─── Comment Item ─────────────────────────────────────────────────────────────
const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
  <div style={{ marginLeft: depth > 0 ? 28 : 0, marginBottom: 10 }}>
    <div style={{ background: depth === 0 ? '#F8FAFC' : '#fff', border: '1px solid #E8EEF5', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: comment.isAnonymous ? '#F1F5F9' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: comment.isAnonymous ? '#94A3B8' : '#fff', flexShrink: 0 }}>
          {comment.isAnonymous ? '🎭' : comment.author_name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: comment.isAnonymous ? '#94A3B8' : '#1E293B', fontStyle: comment.isAnonymous ? 'italic' : undefined }}>{comment.author_name}</span>
        <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 'auto' }}>{timeAgo(comment.createdAt)}</span>
      </div>
      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.65 }}>{comment.body}</div>
    </div>
    {comment.replies && comment.replies.map(r => <CommentItem key={r.id} comment={r} depth={depth + 1} />)}
  </div>
);

// ─── Teaser wall for non-members ──────────────────────────────────────────────

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const slugOrId = (params?.slug || params?.id || '') as string;
  const { openAuthModal } = useUIStore() as any;

  // ── Auth — use Zustand as primary source, fall back to getAuthUser() ────────
  const zustandAuth = useAuthStore();
  const zustandIsAuth  = (zustandAuth as any).isAuthenticated ?? false;
  const zustandUser    = (zustandAuth as any).user ?? null;

  // Build local user object from Zustand + token
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const buildUser = () => {
      if (zustandIsAuth && zustandUser) {
        const token = getToken();
        if (token) {
          setUser({
            id:    zustandUser.id ?? zustandUser.userId,
            name:  (`${zustandUser.firstName ?? ''} ${zustandUser.lastName ?? ''}`.trim()) || zustandUser.name || 'User',
            role:  zustandUser.role ?? 'PATIENT',
            token,
          });
          return;
        }
      }
      // Fallback to localStorage-based detection
      setUser(getAuthUser());
    };
    buildUser();
  }, [zustandIsAuth, zustandUser]);

  // Also subscribe to Zustand store changes (catches login from AuthModal)
  useEffect(() => {
    const unsub = (useAuthStore as any).subscribe?.((state: any) => {
      if (state.isAuthenticated && state.user) {
        const token = getToken();
        if (token) {
          const u = state.user;
          setUser({
            id:    u.id ?? u.userId,
            name:  (`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()) || u.name || 'User',
            role:  u.role ?? 'PATIENT',
            token,
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsub?.();
  }, []);
  const [community,    setCommunity]    = useState<Community | null>(null);
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [postsLoad,    setPostsLoad]    = useState(true);
  const [tab,          setTab]          = useState<'feed' | 'about'>('feed');
  const [isJoined,     setIsJoined]     = useState(false);
  const [joining,      setJoining]      = useState(false);
  const [sort,         setSort]         = useState<'latest' | 'popular'>('latest');
  const [postContent,  setPostContent]  = useState('');
  const [postType,     setPostType]     = useState('General');
  const [postAnon,     setPostAnon]     = useState(false);
  const [posting,      setPosting]      = useState(false);
  const [commentPost,  setCommentPost]  = useState<Post | null>(null);
  const [comments,     setComments]     = useState<Comment[]>([]);
  const [commentsLoad, setCommentsLoad] = useState(false);
  const [commentBody,  setCommentBody]  = useState('');
  const [commentAnon,  setCommentAnon]  = useState(false);
  const [submittingCmt,setSubmittingCmt]= useState(false);
  const [members,      setMembers]      = useState<{ id: string; name: string; isAnonymous?: boolean; role?: string }[]>([]);

  const accent = community?.category ? (CAT_COLOR[community.category] || '#6366F1') : '#6366F1';
  const bg     = community?.category ? (CAT_BG[community.category]   || '#F8FAFC') : '#F8FAFC';

  const handleSignIn = useCallback(() => {
    sessionStorage.setItem('hc_post_login_redirect', `/communities/${slugOrId}`);
    openAuthModal?.('login');
  }, [openAuthModal, slugOrId]);

  // ── Re-fetch community when user auth state changes ──────────────────────────
  // This ensures is_joined is accurate after login/logout
  useEffect(() => {
    if (slugOrId) fetchCommunity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);  // re-fetch when user identity changes

  // ── Fetch community ──────────────────────────────────────────────────────────
  const fetchCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/v1/communities/${slugOrId}`, { headers });
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      const c = data.data || data;
      setCommunity(c);
      // Check is_joined from API, then also check localStorage bridge
      const bridge: string[] = JSON.parse(localStorage.getItem('hc_joined_communities') ?? '[]');
      setIsJoined(c.is_joined || bridge.includes(c.id));
    } catch {
      setCommunity({
        id: slugOrId, slug: slugOrId,
        name: slugOrId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: 'A health support community.', emoji: '🏥', category: 'General',
        visibility: 'PUBLIC', allowAnonymous: true, isFeatured: false,
        member_count: 0, post_count: 0, is_joined: false,
      });
    } finally { setLoading(false); }
  }, [slugOrId]);

  // ── Fetch posts ──────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (communityId: string) => {
    setPostsLoad(true);
    try {
      const headers: Record<string, string> = {};
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/v1/communities/${communityId}/posts?sort=${sort}&limit=30`, { headers });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const raw = data.data?.posts || data.data || data.posts || data || [];
      setPosts(Array.isArray(raw) ? raw : []);
    } catch { setPosts([]); }
    finally { setPostsLoad(false); }
  }, [sort]);

  // ── Fetch members ────────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async (communityId: string) => {
    try {
      const headers: Record<string, string> = {};
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/v1/communities/${communityId}/members?limit=10`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const raw = data.data?.members || data.members || data.data || [];
      setMembers(Array.isArray(raw) ? raw : []);
    } catch { /**/ }
  }, []);

  useEffect(() => { fetchCommunity(); }, [fetchCommunity]);
  useEffect(() => {
    if (community?.id) {
      fetchPosts(community.id);
      fetchMembers(community.id);
    }
  }, [community?.id, fetchPosts, fetchMembers]);

  // ── Auto-refresh posts every 30s ─────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!community?.id) return;
    intervalRef.current = setInterval(() => fetchPosts(community.id), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [community?.id, fetchPosts]);

  // ── Handle pending join from sessionStorage after login ─────────────────────
  useEffect(() => {
    if (!user || !community) return;
    const pendingId = sessionStorage.getItem('hc_pending_join');
    if (pendingId && pendingId === community.id && !isJoined) {
      sessionStorage.removeItem('hc_pending_join');
      handleJoin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, community]);

  const handleJoin = async () => {
    if (!user) {
      sessionStorage.setItem('hc_pending_join', community?.id || slugOrId);
      handleSignIn();
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`${API}/api/v1/communities/${community!.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken() ?? user?.token ?? ''}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setIsJoined(true);
        setCommunity(c => c ? { ...c, member_count: (c.member_count || 0) + 1 } : c);
        // Bridge to localStorage so dashboard CommunitiesPage stays in sync
        const ids: string[] = JSON.parse(localStorage.getItem('hc_joined_communities') || '[]');
        if (!ids.includes(community!.id)) localStorage.setItem('hc_joined_communities', JSON.stringify([...ids, community!.id]));
        fetchPosts(community!.id);
      }
    } catch { /**/ } finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!user || !community) return;
    try {
      await fetch(`${API}/api/v1/communities/${community.id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken() ?? user?.token ?? ''}` },
      });
      setIsJoined(false);
      setCommunity(c => c ? { ...c, member_count: Math.max(0, (c.member_count || 1) - 1) } : c);
      const ids: string[] = JSON.parse(localStorage.getItem('hc_joined_communities') || '[]');
      localStorage.setItem('hc_joined_communities', JSON.stringify(ids.filter((id: string) => id !== community.id)));
    } catch { /**/ }
  };

  const handleReact = async (postId: string, type: string) => {
    if (!user) return;
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const was = p.user_reaction === type;
      return {
        ...p,
        user_reaction: was ? null : type,
        reactions: {
          ...p.reactions,
          [type]: was
            ? Math.max(0, p.reactions[type as keyof typeof p.reactions] - 1)
            : p.reactions[type as keyof typeof p.reactions] + 1,
        },
      };
    }));
    try {
      await fetch(`${API}/api/v1/communities/posts/${postId}/react`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken() ?? user?.token ?? ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type.toUpperCase() }),
      });
    } catch { /**/ }
  };

  const handlePost = async () => {
    if (!user || !community || !postContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/v1/communities/${community.id}/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken() ?? user?.token ?? ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: postContent.trim(),
          tags: [postType.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/ /g, '-')],
          isAnonymous: postAnon,
          anonymousAlias: postAnon ? 'Anonymous Member' : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newPost: Post = {
          ...(data.data || data),
          reactions: { like: 0, support: 0, helpful: 0 },
          comment_count: 0, user_reaction: null,
          author_name: postAnon ? 'Anonymous Member' : user.name,
          is_doctor: user.role === 'DOCTOR',
        };
        setPosts(prev => [newPost, ...prev]);
        setPostContent(''); setPostType('General'); setPostAnon(false);
        setCommunity(c => c ? { ...c, post_count: (c.post_count || 0) + 1 } : c);
      }
    } catch { /**/ } finally { setPosting(false); }
  };

  const openComments = async (post: Post) => {
    setCommentPost(post); setCommentsLoad(true);
    try {
      const headers: Record<string, string> = {};
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/v1/communities/posts/${post.id}/comments`, { headers });
      if (res.ok) { const data = await res.json(); setComments(data.data || data || []); }
    } catch { setComments([]); } finally { setCommentsLoad(false); }
  };

  const submitComment = async () => {
    if (!user || !commentPost || !commentBody.trim()) return;
    setSubmittingCmt(true);
    try {
      const res = await fetch(`${API}/api/v1/communities/posts/${commentPost.id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken() ?? user?.token ?? ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody.trim(), isAnonymous: commentAnon }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, { ...(data.data || data), author_name: commentAnon ? 'Anonymous Member' : user.name, replies: [] }]);
        setCommentBody('');
        setPosts(prev => prev.map(p => p.id === commentPost.id ? { ...p, comment_count: p.comment_count + 1 } : p));
        setCommentPost(p => p ? { ...p, comment_count: p.comment_count + 1 } : p);
      }
    } catch { /**/ } finally { setSubmittingCmt(false); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F0F5FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `3px solid ${accent}33`, borderTop: `3px solid ${accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 14, color: '#64748B' }}>Loading community...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!community) return (
    <div style={{ minHeight: '100vh', background: '#F0F5FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Community not found</div>
        <button onClick={() => { window.location.href = '/communities'; }} style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Back to Communities
        </button>
      </div>
    </div>
  );

  const allowAnon = community.allowAnonymous || community.allows_anonymous;

  return (
    <>
      <PublicNavbar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ minHeight: '100vh', background: '#F0F5FB', fontFamily: 'system-ui,-apple-system,sans-serif', paddingTop: 64 }}>

        {/* ── Community header ─────────────────────────────────────────────── */}
        <div style={{ background: `linear-gradient(135deg,${bg} 0%,#fff 100%)`, borderBottom: `1px solid ${accent}22`, padding: '16px 24px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Back button — sits above header content, no overlap */}
            <button onClick={() => { window.location.href = '/communities'; }}
              style={{ display:'inline-flex', alignItems:'center', gap:5, background:'none', border:'1px solid #E2E8F0', borderRadius:8, cursor:'pointer', color:'#64748B', fontSize:12, fontWeight:600, padding:'5px 12px', marginBottom:16, transition:'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accent; (e.currentTarget as HTMLButtonElement).style.color = accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLButtonElement).style.color = '#64748B'; }}>
              ← Back to Communities
            </button>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            <div style={{ width: 66, height: 66, borderRadius: 16, background: bg, border: `2px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0, boxShadow: `0 4px 16px ${accent}22` }}>
              {community.emoji || '🏥'}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 'clamp(18px,2.8vw,26px)', fontWeight: 900, color: '#1E293B', margin: 0 }}>{community.name}</h1>
                {community.isFeatured && <span style={{ fontSize: 10, background: `${accent}15`, color: accent, border: `1px solid ${accent}33`, borderRadius: 8, padding: '2px 8px', fontWeight: 800 }}>★ Featured</span>}
                {isJoined && <span style={{ fontSize: 10, background: '#F0FFF4', color: '#276749', border: '1px solid #9AE6B4', borderRadius: 8, padding: '2px 8px', fontWeight: 800 }}>✓ Joined</span>}
              </div>
              {community.description && <p style={{ fontSize: 13.5, color: '#475569', margin: '0 0 14px', lineHeight: 1.6, maxWidth: 600 }}>{community.description}</p>}
              <div style={{ display: 'inline-flex', gap: 0, background: '#F1F5F9', borderRadius: 10, border: '1px solid #E8EEF5', overflow: 'hidden' }}>
                {[
                  { val: (community.member_count || 0).toLocaleString('en-IN'), label: 'Members' },
                  { val: (community.post_count || 0).toLocaleString('en-IN'),   label: 'Posts' },
                  { val: community.visibility,                                   label: 'Visibility' },
                  { val: allowAnon ? 'Allowed' : 'No',                          label: 'Anonymous' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '10px 18px', textAlign: 'center', borderRight: i < 3 ? '1px solid #E8EEF5' : 'none' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#1E293B' }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Join / Leave */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
              {user && (
                <button onClick={() => router.push(getDashboardRoute(user.role))}
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  My Dashboard
                </button>
              )}
              {isJoined ? (
                <button onClick={handleLeave}
                  style={{ background: '#FFF5F5', color: '#E53E3E', border: '1px solid #FEB2B2', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Leave Community
                </button>
              ) : (
                <button onClick={handleJoin} disabled={joining}
                  style={{ background: `linear-gradient(135deg,${accent},${accent}CC)`, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 20px', fontSize: 12, fontWeight: 800, cursor: joining ? 'wait' : 'pointer' }}>
                  {joining ? 'Joining...' : user ? '+ Join Community' : '+ Join Free'}
                </button>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E8EEF5', padding: '0 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 4 }}>
            {[['feed', '💬 Feed'], ['about', 'ℹ️ About']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key as any)}
                style={{ padding: '14px 18px', background: 'none', border: 'none', borderBottom: tab === key ? `3px solid ${accent}` : '3px solid transparent', fontSize: 13, fontWeight: tab === key ? 800 : 500, color: tab === key ? accent : '#64748B', cursor: 'pointer', transition: 'all 0.15s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* ── Main feed column ──────────────────────────────────────────── */}
          <div>
            {tab === 'feed' && (
              <>
                {/* Sort bar — always visible for public communities */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {[['latest', '🕐 Latest'], ['popular', '🔥 Popular']].map(([s, label]) => (
                    <button key={s} onClick={() => setSort(s as any)}
                      style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${sort === s ? accent + '44' : '#E2E8F0'}`, background: sort === s ? `${accent}12` : '#fff', color: sort === s ? accent : '#64748B', fontSize: 11.5, fontWeight: sort === s ? 700 : 500, cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Post composer — members only */}
                {user && isJoined ? (
                  <div style={{ background: '#F1F5F9', border: '1px solid #E8EEF5', borderRadius: 14, padding: '16px 18px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', letterSpacing: '0.06em', marginBottom: 10 }}>SHARE WITH THE COMMUNITY</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                      {POST_TYPES.map(t => {
                        const m = TYPE_META[t];
                        return (
                          <button key={t} onClick={() => setPostType(t)}
                            style={{ padding: '4px 10px', borderRadius: 14, border: `1px solid ${postType === t ? m.color + '55' : '#E2E8F0'}`, background: postType === t ? m.bg : '#F8FAFC', color: postType === t ? m.color : '#64748B', fontSize: 10.5, fontWeight: postType === t ? 700 : 500, cursor: 'pointer' }}>
                            {m.icon} {t}
                          </button>
                        );
                      })}
                    </div>
                    <textarea value={postContent} onChange={e => setPostContent(e.target.value)}
                      placeholder="Share an experience, ask a question, or offer support..."
                      rows={3} style={{ width: '100%', boxSizing: 'border-box' as const, border: '1px solid #E2E8F0', borderRadius: 9, padding: '10px 13px', fontSize: 13, color: '#1E293B', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', background: '#F8FAFC' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap' as const, gap: 8 }}>
                      {allowAnon && (
                        <button onClick={() => setPostAnon(!postAnon)}
                          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <div style={{ width: 32, height: 18, borderRadius: 9, background: postAnon ? accent : '#E2E8F0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', top: 2, left: postAnon ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                          </div>
                          <span style={{ fontSize: 12, color: postAnon ? accent : '#64748B', fontWeight: postAnon ? 700 : 400 }}>🎭 Post Anonymously</span>
                        </button>
                      )}
                      <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: allowAnon ? 0 : 'auto' }}>{postContent.length}/2000</span>
                      <button onClick={handlePost} disabled={posting || !postContent.trim()}
                        style={{ background: postContent.trim() ? `linear-gradient(135deg,${accent},${accent}CC)` : '#E2E8F0', color: postContent.trim() ? '#fff' : '#94A3B8', border: 'none', borderRadius: 9, padding: '9px 22px', fontSize: 12, fontWeight: 800, cursor: postContent.trim() ? 'pointer' : 'not-allowed' }}>
                        {posting ? 'Posting...' : 'Post →'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Not a member — show slim join CTA above the feed (not a teaser wall) */
                  <div style={{ background: `${accent}08`, border: `1px solid ${accent}22`, borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                        {user ? 'Join to participate in this community' : 'Sign in to join and post in this community'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Read the feed below — join free to post, comment, and react</div>
                    </div>
                    <button onClick={user ? handleJoin : handleSignIn} disabled={joining}
                      style={{ background: `linear-gradient(135deg,${accent},${accent}CC)`, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: joining ? 'wait' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                      {joining ? 'Joining...' : user ? '+ Join Community' : 'Sign In → Join Free'}
                    </button>
                  </div>
                )}

                {/* Posts — ALWAYS shown for PUBLIC communities, no teaser wall */}
                {postsLoad ? (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#F1F5F9', borderRadius: 14 }}>
                    <div style={{ width: 36, height: 36, border: `3px solid ${accent}33`, borderTop: `3px solid ${accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 13, color: '#64748B' }}>Loading posts...</div>
                  </div>
                ) : posts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F1F5F9', borderRadius: 14, border: '1px solid #E8EEF5' }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>No posts yet</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>Be the first to share something with this community!</div>
                  </div>
                ) : (
                  posts.map((p, i) => (
                    <PostCard key={p.id || i} post={p} accent={accent} user={user}
                      onReact={handleReact} onCommentClick={openComments} onSignIn={handleSignIn} />
                  ))
                )}
              </>
            )}

            {tab === 'about' && (
              <div style={{ background: '#F1F5F9', border: '1px solid #E8EEF5', borderRadius: 14, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', margin: '0 0 12px' }}>About {community.name}</h3>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>{community.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Members', value: (community.member_count || 0).toLocaleString('en-IN') },
                    { label: 'Total Posts', value: (community.post_count || 0).toLocaleString('en-IN') },
                    { label: 'Privacy', value: community.visibility },
                    { label: 'Anonymous Posts', value: allowAnon ? 'Allowed' : 'Not allowed' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px', border: '1px solid #E8EEF5' }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 5 }}>{s.label.toUpperCase()}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {community.rules && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', marginBottom: 10 }}>COMMUNITY RULES</div>
                    {community.rules.split('.').filter(Boolean).map((rule, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                        <span style={{ color: accent, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>{rule.trim()}.
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <div>
            {/* Members panel */}
            {members.length > 0 && (
              <div style={{ background: '#F1F5F9', border: '1px solid #E8EEF5', borderRadius: 14, padding: '18px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.1em', marginBottom: 12 }}>MEMBERS</div>
                {members.slice(0, 8).map((m, i) => (
                  <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < Math.min(members.length, 8) - 1 ? '1px solid #F8FAFC' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.isAnonymous ? '#F1F5F9' : `linear-gradient(135deg,${accent}CC,${accent}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: m.isAnonymous ? 14 : 11, fontWeight: 800, color: m.isAnonymous ? '#94A3B8' : '#fff', flexShrink: 0 }}>
                      {m.isAnonymous ? '🎭' : (m.name || 'M').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.isAnonymous ? 'Anonymous Member' : m.name}</div>
                      {m.role === 'DOCTOR' && <div style={{ fontSize: 10, color: '#276749', fontWeight: 700 }}>✓ Verified Doctor</div>}
                    </div>
                  </div>
                ))}
                {community.member_count > 8 && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, textAlign: 'center' }}>
                    +{(community.member_count - 8).toLocaleString('en-IN')} more members
                  </div>
                )}
              </div>
            )}

            {/* Ask a Doctor CTA */}
            <div style={{ background: `linear-gradient(135deg,${accent}15,${accent}08)`, border: `1px solid ${accent}33`, borderRadius: 14, padding: '18px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>🩺 Ask a Doctor</div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 1.5 }}>Get a personal consultation with a verified specialist for your condition.</div>
              <button onClick={() => { window.location.href = '/doctors'; }}
                style={{ width: '100%', background: `linear-gradient(135deg,${accent},${accent}CC)`, color: '#fff', border: 'none', borderRadius: 9, padding: '9px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Find a Specialist →
              </button>
            </div>

            {/* Community Rules */}
            {community.rules && (
              <div style={{ background: '#F1F5F9', border: '1px solid #E8EEF5', borderRadius: 14, padding: '18px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.1em', marginBottom: 12 }}>COMMUNITY RULES</div>
                {community.rules.split('.').filter(Boolean).slice(0, 5).map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                    <span style={{ color: accent, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>{r.trim()}.
                  </div>
                ))}
              </div>
            )}

            {/* Quick nav */}
            <div style={{ background: '#F1F5F9', border: '1px solid #E8EEF5', borderRadius: 14, padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.1em', marginBottom: 12 }}>EXPLORE MORE</div>
              <button onClick={() => { window.location.href = '/communities'; }}
                style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', borderRadius: 9, padding: '9px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
                ← All Communities
              </button>
              <button onClick={() => { window.location.href = '/doctors'; }}
                style={{ width: '100%', background: '#F0FFF4', border: '1px solid #9AE6B4', color: '#276749', borderRadius: 9, padding: '9px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Find a Doctor 🩺
              </button>
            </div>
          </div>
        </div>

        {/* ── Comment Drawer ─────────────────────────────────────────────── */}
        {commentPost && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) { setCommentPost(null); setComments([]); } }}>
            <div style={{ background: '#F8FAFC', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 680, maxHeight: '72vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8EEF5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>💬 Replies ({commentPost.comment_count})</div>
                <button onClick={() => { setCommentPost(null); setComments([]); }}
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {commentsLoad
                  ? <div style={{ textAlign: 'center', padding: 30, color: '#64748B', fontSize: 13 }}>Loading...</div>
                  : comments.length === 0
                    ? <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8', fontSize: 13 }}>No replies yet. Be the first!</div>
                    : comments.map(c => <CommentItem key={c.id} comment={c} />)
                }
              </div>
              {user && isJoined ? (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #E8EEF5', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea value={commentBody} onChange={e => setCommentBody(e.target.value)}
                    placeholder="Write a supportive reply..." rows={2}
                    style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: 9, padding: '9px 13px', fontSize: 13, color: '#1E293B', outline: 'none', resize: 'none', fontFamily: 'inherit', background: '#F8FAFC' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {allowAnon && (
                      <button onClick={() => setCommentAnon(!commentAnon)}
                        style={{ fontSize: 11, color: commentAnon ? accent : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                        {commentAnon ? '🎭 Anon' : 'Anon off'}
                      </button>
                    )}
                    <button onClick={submitComment} disabled={submittingCmt || !commentBody.trim()}
                      style={{ background: commentBody.trim() ? `linear-gradient(135deg,${accent},${accent}CC)` : '#E2E8F0', color: commentBody.trim() ? '#fff' : '#94A3B8', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: commentBody.trim() ? 'pointer' : 'not-allowed' }}>
                      {submittingCmt ? '...' : 'Reply'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #E8EEF5', textAlign: 'center' }}>
                  <button onClick={handleSignIn}
                    style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 24px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                    Sign in to reply
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
