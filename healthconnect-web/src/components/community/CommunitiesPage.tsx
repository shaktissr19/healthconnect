'use client';
// src/components/community/CommunitiesPage.tsx
// Dashboard Communities Tab — Full Featured v3
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { patientAPI, communityAPI } from '@/lib/api';

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  teal:       '#4db6a0',
  tealLight:  '#e6f4f1',
  tealMid:    '#c8e8e2',
  tealDark:   '#2e9e86',
  tealBorder: '#b8ddd7',
  bg:         '#f0f9f7',
  cardBg:     '#eaf4f1',
  white:      '#ffffff',
  text:       '#1a3c35',
  textMid:    '#3d6b62',
  textSub:    '#5f8f86',
  textMuted:  '#8ab3ad',
  border:     '#cce4df',
  shadow:     '0 2px 12px rgba(77,182,160,0.10)',
  shadowHover:'0 8px 28px rgba(77,182,160,0.18)',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isJoined?: boolean;
  icon?: string;
  color?: string;
  postsToday?: number;
  activeMembersToday?: number;
  isMuted?: boolean;
  isTrending?: boolean;
  recentMembers?: string[];
  latestPostSnippet?: string;
  latestPostTime?: string;
  unreadCount?: number;
}

interface Comment {
  id: string;
  author: string;
  authorInitial: string;
  isDoctor?: boolean;
  body: string;
  timeAgo: string;
}

interface Post {
  id: string;
  title?: string;
  body: string;
  author: string;
  authorInitial: string;
  isAnonymous: boolean;
  isDoctor?: boolean;
  timeAgo: string;
  tags?: string[];
  postType?: 'normal' | 'ask-doctor' | 'tip' | 'success';
  isPinned?: boolean;
  reactions: { like: Rxn; support: Rxn; helpful: Rxn };
  comments: Comment[];
  commentsExpanded?: boolean;
  commentCount: number;
  isBookmarked?: boolean;
}
interface Rxn { type: string; count: number; userReacted: boolean; }

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_COMMUNITIES: Community[] = [
  { id: 'c1', name: 'Diabetes Connect', description: 'Managing diabetes together — glucose tracking, meal planning, and emotional support.', category: 'Chronic Condition', memberCount: 2847, isJoined: true, icon: '🩸', color: '#ef4444', postsToday: 12, activeMembersToday: 89, isTrending: true, recentMembers: ['P','R','S','A'], latestPostSnippet: 'Finally got my HbA1c below 7 after 8 months of consistent effort…', latestPostTime: '2 min ago', unreadCount: 4 },
  { id: 'c2', name: 'Heart Health Warriors', description: 'Cardiac patients, caregivers, and survivors sharing their journey.', category: 'Cardiac Care', memberCount: 1923, isJoined: true, icon: '❤️', color: '#f97316', postsToday: 8, activeMembersToday: 54, recentMembers: ['M','K','D'], latestPostSnippet: 'New study on statins: what patients should know about side effects…', latestPostTime: '18 min ago', unreadCount: 1 },
  { id: 'c3', name: 'Mental Wellness Circle', description: 'A safe, anonymous space for mental health conversations and peer support.', category: 'Mental Health', memberCount: 4201, isJoined: false, icon: '🧠', color: '#8b5cf6', postsToday: 31, activeMembersToday: 142, isTrending: true, recentMembers: ['A','V','N','T','R'] },
  { id: 'c4', name: 'Cancer Support Network', description: 'Oncology patients and families navigating treatment together.', category: 'Oncology', memberCount: 1156, isJoined: false, icon: '🎗️', color: '#ec4899', postsToday: 5, activeMembersToday: 33, recentMembers: ['S','L'] },
  { id: 'c5', name: 'Thyroid Warriors', description: 'Hypothyroid, hyperthyroid, and Hashimoto\'s patients sharing labs and what\'s worked.', category: 'Hormonal', memberCount: 987, isJoined: false, icon: '🦋', color: '#06b6d4', postsToday: 7, activeMembersToday: 28, recentMembers: ['G','F','H'] },
  { id: 'c6', name: 'Arthritis & Joint Pain', description: 'RA, OA, and other arthritis types — management strategies and daily living tips.', category: 'Musculoskeletal', memberCount: 1432, isJoined: false, icon: '🦴', color: '#10b981', postsToday: 9, activeMembersToday: 47, recentMembers: ['J','K','B','C'] },
  { id: 'c7', name: 'Pregnancy & New Moms', description: 'A supportive community for expecting mothers and new parents.', category: "Women's Health", memberCount: 3654, isJoined: false, icon: '🤱', color: '#f59e0b', postsToday: 22, activeMembersToday: 118, isTrending: true, recentMembers: ['R','S','P','T'] },
  { id: 'c8', name: 'Hypertension Hub', description: 'Blood pressure management, medication experiences, and lifestyle tips.', category: 'Chronic Condition', memberCount: 2109, isJoined: false, icon: '💊', color: '#3b82f6', postsToday: 14, activeMembersToday: 62, recentMembers: ['A','N'] },
];

const generateMockPosts = (communityId: string): Post[] => [
  {
    id: `pin-${communityId}`, isPinned: true, postType: 'normal',
    title: '📌 Community Guidelines & Welcome',
    body: 'Welcome to this community! Please be respectful, supportive, and kind. Share personal experiences, not medical advice. Verified doctors have a special badge. Posts violating guidelines will be removed.',
    author: 'Community Moderator', authorInitial: 'M', isAnonymous: false, isDoctor: false,
    timeAgo: '3 days ago', tags: ['pinned', 'rules'],
    reactions: { like: { type: 'like', count: 142, userReacted: false }, support: { type: 'support', count: 0, userReacted: false }, helpful: { type: 'helpful', count: 89, userReacted: false } },
    comments: [], commentsExpanded: false, commentCount: 0, isBookmarked: false,
  },
  {
    id: `p1-${communityId}`, postType: 'success',
    title: '🎉 Finally got my HbA1c below 7 after 8 months!',
    body: 'After 8 months of consistent effort — meal planning, daily walks, and tracking every meal — I finally got my HbA1c down to 6.8. My doctor was so happy. I just wanted to share this with people who truly understand how hard this journey is.',
    author: 'Priya M.', authorInitial: 'P', isAnonymous: false, isDoctor: false,
    timeAgo: '2 min ago', tags: ['success', 'hba1c', 'motivation'],
    reactions: { like: { type: 'like', count: 47, userReacted: false }, support: { type: 'support', count: 23, userReacted: false }, helpful: { type: 'helpful', count: 18, userReacted: false } },
    comments: [
      { id: 'cmt1', author: 'Dr. Arjun K.', authorInitial: 'A', isDoctor: true, body: 'Congratulations! This is a significant achievement. Consistency is key and you\'ve demonstrated it beautifully.', timeAgo: '1 min ago' },
      { id: 'cmt2', author: 'Anonymous', authorInitial: '?', isDoctor: false, body: 'This gives me so much hope. I\'m at 8.2 right now. What did your meal plan look like?', timeAgo: '30 sec ago' },
    ],
    commentsExpanded: false, commentCount: 2, isBookmarked: false,
  },
  {
    id: `p2-${communityId}`, postType: 'ask-doctor',
    body: 'Has anyone tried the Libre continuous glucose monitor? My doctor suggested it but it\'s quite expensive. Is it worth the investment? Would love to hear from people who have actually used it.',
    author: 'Anonymous', authorInitial: '?', isAnonymous: true, isDoctor: false,
    timeAgo: '15 min ago', tags: ['cgm', 'question', 'technology'],
    reactions: { like: { type: 'like', count: 12, userReacted: false }, support: { type: 'support', count: 8, userReacted: false }, helpful: { type: 'helpful', count: 31, userReacted: true } },
    comments: [{ id: 'cmt3', author: 'Rahul S.', authorInitial: 'R', isDoctor: false, body: 'Been using Libre 2 for 6 months. Absolutely worth it. The peace of mind alone is priceless.', timeAgo: '10 min ago' }],
    commentsExpanded: false, commentCount: 1, isBookmarked: true,
  },
  {
    id: `p3-${communityId}`, postType: 'tip',
    title: '💡 Low-glycemic Indian meals that actually taste good',
    body: 'Been working with a dietitian for 3 months and built a list of traditional Indian dishes for blood sugar control. Moong dal chilla, methi paratha with less ghee, and rajma with brown rice are my go-tos. Happy to share the full list!',
    author: 'Dr. Sneha P.', authorInitial: 'S', isAnonymous: false, isDoctor: true,
    timeAgo: '1 hr ago', tags: ['diet', 'indian-food', 'tips'],
    reactions: { like: { type: 'like', count: 89, userReacted: false }, support: { type: 'support', count: 12, userReacted: false }, helpful: { type: 'helpful', count: 76, userReacted: false } },
    comments: [], commentsExpanded: false, commentCount: 0, isBookmarked: false,
  },
];

// ─── Auth helper ──────────────────────────────────────────────────────────────
function readAuth() {
  if (typeof window === 'undefined') return { token: null, user: null };
  try {
    const raw = localStorage.getItem('hc-auth');
    if (raw) {
      const s = (JSON.parse(raw)?.state ?? JSON.parse(raw));
      if (s?.token && s?.isAuthenticated) return { token: s.token, user: s.user };
    }
  } catch { /**/ }
  try {
    const m = document.cookie.match(/hc_token=([^;]+)/);
    if (m?.[1]) return { token: m[1], user: null };
  } catch { /**/ }
  return { token: null, user: null };
}

const POST_TYPE_META: Record<string, { bg: string; color: string; label: string }> = {
  'success':    { bg: '#d1fae5', color: '#065f46', label: '🎉 Success Story' },
  'tip':        { bg: '#fef3c7', color: '#92400e', label: '💡 Tip & Advice' },
  'ask-doctor': { bg: '#ede9fe', color: '#5b21b6', label: '🩺 Ask the Community' },
  'normal':     { bg: T.tealLight, color: T.tealDark, label: '' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Av: React.FC<{ initial: string; size?: number; isDoctor?: boolean; isMod?: boolean }> = ({ initial, size = 36, isDoctor, isMod }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: isMod ? 'linear-gradient(135deg,#64748b,#94a3b8)' : isDoctor ? 'linear-gradient(135deg,#059669,#0d9488)' : initial === '?' ? '#94a3b8' : `linear-gradient(135deg,${T.teal},${T.tealDark})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: size * 0.38,
  }}>{initial}</div>
);

// ─── Reaction Button ──────────────────────────────────────────────────────────
const RxnBtn: React.FC<{ emoji: string; label: string; count: number; active: boolean; onClick: () => void }> = ({ emoji, label, count, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
    background: active ? T.tealLight : '#f4faf8',
    color: active ? T.tealDark : T.textSub,
    boxShadow: active ? `0 0 0 1.5px ${T.teal}` : `0 0 0 1px ${T.border}`,
  }}>
    <span>{emoji}</span><span>{count}</span>
    <span style={{ fontSize: 10, opacity: 0.75 }}>{label}</span>
  </button>
);

// ─── Post Composer ────────────────────────────────────────────────────────────
const PostComposer: React.FC<{
  communityId: string;
  onPost: (p: Post) => void;
  userName: string;
  userInitial: string;
  defaultOpen?: boolean;
  onClose?: () => void;
}> = ({ communityId, onPost, userName, userInitial, defaultOpen = false, onClose }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postType, setPostType] = useState<'normal' | 'ask-doctor' | 'tip' | 'success'>('normal');
  const [submitting, setSubmitting] = useState(false);

  const close = () => { setOpen(false); onClose?.(); };

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try { await communityAPI.createPost(communityId, { title: title.trim() || undefined, body: body.trim(), isAnonymous }); } catch { /**/ }
    onPost({
      id: `local-${Date.now()}`, title: title.trim() || undefined, body: body.trim(),
      author: isAnonymous ? 'Anonymous' : userName,
      authorInitial: isAnonymous ? '?' : (userInitial[0]?.toUpperCase() ?? 'P'),
      isAnonymous, isDoctor: false, timeAgo: 'Just now', tags: [], postType,
      reactions: { like: { type: 'like', count: 0, userReacted: false }, support: { type: 'support', count: 0, userReacted: false }, helpful: { type: 'helpful', count: 0, userReacted: false } },
      comments: [], commentsExpanded: false, commentCount: 0, isBookmarked: false,
    });
    setTitle(''); setBody(''); setSubmitting(false); close();
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      width: '100%', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
      background: T.white, borderRadius: 12, border: `1px solid ${T.border}`,
      cursor: 'pointer', marginBottom: 12, textAlign: 'left', boxShadow: T.shadow,
    }}>
      <Av initial={userInitial} size={32} />
      <span style={{ color: T.textMuted, fontSize: 13 }}>✏️ Share something with this community…</span>
    </button>
  );

  return (
    <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.tealBorder}`, marginBottom: 12, padding: 14, boxShadow: T.shadow }}>
      {/* Post type chips */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
        {([['normal','💬 General'], ['success','🎉 Success Story'], ['tip','💡 Tip'], ['ask-doctor','🩺 Ask Community']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setPostType(t)} style={{
            padding: '3px 10px', borderRadius: 14, border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 700,
            background: postType === t ? POST_TYPE_META[t].bg : T.cardBg,
            color: postType === t ? POST_TYPE_META[t].color : T.textMuted,
            boxShadow: postType === t ? `0 0 0 1.5px ${POST_TYPE_META[t].color}60` : 'none',
          }}>{label}</button>
        ))}
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)"
        style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 11px', fontSize: 13, marginBottom: 7, outline: 'none', background: T.cardBg, color: T.text }} />
      <textarea value={body} onChange={e => setBody(e.target.value)}
        placeholder="What's on your mind? Ask a question, share an experience, or offer a tip…"
        rows={4} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 11px', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', background: T.cardBg, color: T.text }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: T.textSub }}>
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ width: 14, height: 14 }} />
          Post anonymously
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={close} style={{ padding: '6px 13px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', fontSize: 12, color: T.textSub }}>Cancel</button>
          <button onClick={submit} disabled={!body.trim() || submitting} style={{
            padding: '6px 16px', borderRadius: 8, border: 'none',
            background: body.trim() ? `linear-gradient(135deg,${T.teal},${T.tealDark})` : T.border,
            color: body.trim() ? '#fff' : T.textMuted,
            cursor: body.trim() ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 700,
          }}>{submitting ? 'Posting…' : 'Post'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Post Card ────────────────────────────────────────────────────────────────
const PostCard: React.FC<{
  post: Post;
  communityId: string;
  onReact: (id: string, type: 'like' | 'support' | 'helpful') => void;
  onToggleComments: (id: string) => void;
  onAddComment: (id: string, body: string) => void;
  onBookmark: (id: string) => void;
}> = ({ post, communityId, onReact, onToggleComments, onAddComment, onBookmark }) => {
  const [replyText, setReplyText] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const meta = POST_TYPE_META[post.postType ?? 'normal'];

  return (
    <div style={{
      background: post.isPinned ? T.cardBg : T.white,
      borderRadius: 14, border: `1px solid ${post.isPinned ? T.tealBorder : T.border}`,
      marginBottom: 10, overflow: 'hidden',
      boxShadow: post.isPinned ? `0 2px 10px ${T.teal}20` : T.shadow,
    }}>
      {/* Badge bar */}
      {(post.isPinned || (post.postType && post.postType !== 'normal')) && (
        <div style={{ padding: '5px 13px', background: meta.bg, display: 'flex', alignItems: 'center', gap: 6 }}>
          {post.isPinned && <span style={{ fontSize: 10, color: T.textSub, fontWeight: 700 }}>📌 Pinned</span>}
          {post.postType && post.postType !== 'normal' && meta.label && (
            <span style={{ fontSize: 10, color: meta.color, fontWeight: 700, marginLeft: post.isPinned ? 8 : 0 }}>{meta.label}</span>
          )}
        </div>
      )}

      <div style={{ padding: '11px 13px 0' }}>
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Av initial={post.authorInitial} size={34} isDoctor={post.isDoctor} isMod={post.author === 'Community Moderator'} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{post.author}</span>
              {post.isDoctor && <span style={{ fontSize: 9, background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: 9, fontWeight: 700 }}>✓ Verified Doctor</span>}
              {post.isAnonymous && <span style={{ fontSize: 9, background: T.cardBg, color: T.textSub, padding: '1px 6px', borderRadius: 9 }}>Anonymous</span>}
            </div>
            <div style={{ fontSize: 10, color: T.textMuted }}>{post.timeAgo}</div>
          </div>
          <button onClick={() => onBookmark(post.id)} title="Bookmark" style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 15,
            opacity: post.isBookmarked ? 1 : 0.3, transition: 'opacity 0.15s',
          }}>🔖</button>
        </div>

        {post.title && <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{post.title}</div>}
        <p style={{ fontSize: 13, color: T.textMid, lineHeight: '1.6', margin: '0 0 8px' }}>{post.body}</p>

        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {post.tags.map(tag => (
              <span key={tag} style={{ fontSize: 10, background: T.tealLight, color: T.tealDark, padding: '1px 7px', borderRadius: 9, fontWeight: 600 }}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Reactions */}
      <div style={{ padding: '0 13px 9px', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        <RxnBtn emoji="❤️" label="Like" count={post.reactions.like.count} active={post.reactions.like.userReacted} onClick={() => onReact(post.id, 'like')} />
        <RxnBtn emoji="🤝" label="Support" count={post.reactions.support.count} active={post.reactions.support.userReacted} onClick={() => onReact(post.id, 'support')} />
        <RxnBtn emoji="💡" label="Helpful" count={post.reactions.helpful.count} active={post.reactions.helpful.userReacted} onClick={() => onReact(post.id, 'helpful')} />
        <button onClick={() => onToggleComments(post.id)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px',
          borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
          background: '#f4faf8', color: T.textSub, boxShadow: `0 0 0 1px ${T.border}`, marginLeft: 'auto',
        }}>💬 {post.commentCount > 0 ? `${post.commentCount}` : ''} {post.commentCount === 1 ? 'reply' : post.commentCount > 1 ? 'replies' : 'Reply'}</button>
      </div>

      {/* Comments section */}
      {post.commentsExpanded && (
        <div style={{ borderTop: `1px solid ${T.tealLight}`, padding: '9px 13px', background: T.cardBg }}>
          {post.comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
              <Av initial={c.authorInitial} size={26} isDoctor={c.isDoctor} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: T.text }}>{c.author}</span>
                  {c.isDoctor && <span style={{ fontSize: 8, background: '#d1fae5', color: '#065f46', padding: '1px 5px', borderRadius: 7, fontWeight: 700 }}>Dr.</span>}
                  <span style={{ fontSize: 10, color: T.textMuted }}>{c.timeAgo}</span>
                </div>
                <p style={{ fontSize: 12, color: T.textMid, margin: 0, lineHeight: '1.5' }}>{c.body}</p>
              </div>
            </div>
          ))}
          {post.comments.length === 0 && <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 7px' }}>No replies yet. Be the first!</p>}
          {!replyOpen ? (
            <button onClick={() => setReplyOpen(true)} style={{ fontSize: 12, color: T.teal, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>+ Add a reply…</button>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (replyText.trim()) { onAddComment(post.id, replyText); setReplyText(''); setReplyOpen(false); } } }}
                placeholder="Write a reply… (Enter to send)"
                style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, outline: 'none', background: T.white }} autoFocus />
              <button onClick={() => { setReplyOpen(false); setReplyText(''); }} style={{ fontSize: 11, color: T.textMuted, background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0 9px', cursor: 'pointer' }}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Community Panel ──────────────────────────────────────────────────────────
const CommunityPanel: React.FC<{
  community: Community;
  onClose: () => void;
  onLeave: (id: string) => void;
  userName: string;
  userInitial: string;
  defaultComposerOpen?: boolean;
}> = ({ community, onClose, onLeave, userName, userInitial, defaultComposerOpen = false }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'newest' | 'trending'>('newest');
  const [feedTab, setFeedTab] = useState<'feed' | 'bookmarks' | 'my-posts'>('feed');
  const [searchFeed, setSearchFeed] = useState('');
  const [isMuted, setIsMuted] = useState(community.isMuted ?? false);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityAPI.getPosts(community.id, { sort, limit: 20 });
      const d = res?.data;
      const raw = d?.data?.posts ?? d?.posts ?? d?.data ?? d ?? [];
      const fetched: Post[] = Array.isArray(raw) ? raw.map((p: any) => ({
        id: p.id ?? p._id ?? `r-${Math.random()}`,
        title: p.title, body: p.body ?? p.content ?? '',
        author: p.isAnonymous ? 'Anonymous' : (p.author?.name ?? p.authorName ?? 'Member'),
        authorInitial: p.isAnonymous ? '?' : ((p.author?.firstName ?? p.authorName ?? 'M')[0].toUpperCase()),
        isAnonymous: !!p.isAnonymous, isDoctor: p.author?.role === 'doctor',
        timeAgo: fmtTime(p.createdAt), tags: p.tags ?? [], postType: p.postType ?? 'normal', isPinned: !!p.isPinned,
        reactions: {
          like: { type: 'like', count: p.reactions?.like ?? 0, userReacted: p.userReaction === 'like' },
          support: { type: 'support', count: p.reactions?.support ?? 0, userReacted: p.userReaction === 'support' },
          helpful: { type: 'helpful', count: p.reactions?.helpful ?? 0, userReacted: p.userReaction === 'helpful' },
        },
        comments: (p.comments ?? []).map((c: any) => ({
          id: c.id ?? c._id, author: c.isAnonymous ? 'Anonymous' : (c.author?.name ?? 'Member'),
          authorInitial: c.isAnonymous ? '?' : ((c.author?.firstName ?? 'M')[0].toUpperCase()),
          isDoctor: c.author?.role === 'doctor', body: c.body ?? '', timeAgo: fmtTime(c.createdAt),
        })),
        commentsExpanded: false, commentCount: p.commentCount ?? p.comments?.length ?? 0, isBookmarked: !!p.isBookmarked,
      })) : [];
      setPosts(fetched.length > 0 ? fetched : generateMockPosts(community.id));
    } catch {
      setPosts(generateMockPosts(community.id));
    } finally { setLoading(false); }
  }, [community.id, sort]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const handleReact = async (postId: string, type: 'like' | 'support' | 'helpful') => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const r = p.reactions[type];
      return { ...p, reactions: { ...p.reactions, [type]: { ...r, count: r.count + (r.userReacted ? -1 : 1), userReacted: !r.userReacted } } };
    }));
    try { await communityAPI.reactToPost(community.id, postId, type); } catch { /**/ }
  };

  const handleToggleComments = (id: string) => setPosts(prev => prev.map(p => p.id === id ? { ...p, commentsExpanded: !p.commentsExpanded } : p));

  const handleAddComment = async (postId: string, body: string) => {
    const c: Comment = { id: `lc-${Date.now()}`, author: userName, authorInitial: userInitial, body, timeAgo: 'Just now' };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, c], commentCount: p.commentCount + 1, commentsExpanded: true } : p));
    try { await communityAPI.addComment(community.id, postId, body); } catch { /**/ }
  };

  const handleBookmark = (postId: string) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p));
  const handleNewPost = (post: Post) => setPosts(prev => [post, ...prev.filter(p => !p.isPinned)]);

  const pinnedPosts = posts.filter(p => p.isPinned);
  const feedPosts = posts.filter(p => !p.isPinned);
  const filteredFeed = feedPosts.filter(p =>
    !searchFeed || p.body.toLowerCase().includes(searchFeed.toLowerCase()) || (p.title ?? '').toLowerCase().includes(searchFeed.toLowerCase())
  );
  const bookmarkedPosts = posts.filter(p => p.isBookmarked);
  const displayPosts = feedTab === 'bookmarks' ? bookmarkedPosts : feedTab === 'my-posts' ? [] : [...pinnedPosts, ...filteredFeed];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,30,26,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div ref={panelRef} style={{ width: '100%', maxWidth: 560, background: T.bg, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-6px 0 40px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding: '13px 16px', background: T.white, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${community.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{community.icon ?? '🏥'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{community.name}</span>
                {community.isTrending && <span style={{ fontSize: 9, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 8, fontWeight: 800 }}>🔥 Hot</span>}
              </div>
              <div style={{ fontSize: 11, color: T.textSub }}>🟢 {community.activeMembersToday ?? '—'} active · {community.memberCount?.toLocaleString()} members</div>
            </div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <button onClick={() => setIsMuted(!isMuted)} title={isMuted ? 'Unmute' : 'Mute'} style={{ background: isMuted ? T.cardBg : T.white, border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 7px', cursor: 'pointer', fontSize: 13 }}>
                {isMuted ? '🔕' : '🔔'}
              </button>
              <button onClick={() => onLeave(community.id)} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#ef4444', cursor: 'pointer' }}>Leave</button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: T.textMuted }}>✕</button>
            </div>
          </div>

          {/* Feed sub-tabs */}
          <div style={{ display: 'flex', gap: 3, background: T.cardBg, borderRadius: 9, padding: 3 }}>
            {[['feed','📰 Feed'], ['bookmarks',`🔖 Saved${bookmarkedPosts.length > 0 ? ` (${bookmarkedPosts.length})` : ''}`], ['my-posts','👤 My Posts']].map(([key, label]) => (
              <button key={key} onClick={() => setFeedTab(key as any)} style={{
                flex: 1, padding: '5px 7px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: 700,
                background: feedTab === key ? T.white : 'transparent',
                color: feedTab === key ? T.tealDark : T.textSub,
                boxShadow: feedTab === key ? T.shadow : 'none',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Sort + search */}
        {feedTab === 'feed' && (
          <div style={{ padding: '7px 14px', display: 'flex', gap: 7, background: T.white, borderBottom: `1px solid ${T.tealLight}`, flexShrink: 0, alignItems: 'center' }}>
            {(['newest','trending'] as const).map(s => (
              <button key={s} onClick={() => setSort(s)} style={{
                padding: '4px 11px', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                background: sort === s ? `linear-gradient(135deg,${T.teal},${T.tealDark})` : T.cardBg,
                color: sort === s ? '#fff' : T.textSub,
              }}>{s === 'newest' ? '🕐 Newest' : '🔥 Trending'}</button>
            ))}
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11 }}>🔍</span>
              <input value={searchFeed} onChange={e => setSearchFeed(e.target.value)} placeholder="Search posts…"
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 8px 5px 24px', fontSize: 11, outline: 'none', background: T.cardBg }} />
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {feedTab === 'feed' && <PostComposer communityId={community.id} onPost={handleNewPost} userName={userName} userInitial={userInitial} defaultOpen={defaultComposerOpen} />}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: T.textMuted }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 13 }}>Loading posts…</div>
            </div>
          ) : displayPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: T.textMuted }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>{feedTab === 'bookmarks' ? '🔖' : feedTab === 'my-posts' ? '👤' : '💬'}</div>
              <div style={{ fontWeight: 700, color: T.textSub, marginBottom: 4, fontSize: 13 }}>
                {feedTab === 'bookmarks' ? 'No saved posts yet' : feedTab === 'my-posts' ? "You haven't posted yet" : 'No posts found'}
              </div>
              <div style={{ fontSize: 11 }}>
                {feedTab === 'bookmarks' ? 'Tap 🔖 on any post to save it' : feedTab === 'my-posts' ? 'Share something with the community!' : 'Be the first to share!'}
              </div>
            </div>
          ) : (
            displayPosts.map(post => (
              <PostCard key={post.id} post={post} communityId={community.id}
                onReact={handleReact} onToggleComments={handleToggleComments}
                onAddComment={handleAddComment} onBookmark={handleBookmark} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function fmtTime(iso?: string) {
  if (!iso) return '';
  try {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
    return `${Math.floor(s / 86400)}d ago`;
  } catch { return ''; }
}

const CAT_COLORS: Record<string, string> = {
  'Chronic Condition': '#ef4444', 'Cardiac Care': '#f97316', 'Mental Health': '#8b5cf6',
  'Oncology': '#ec4899', 'Hormonal': '#06b6d4', 'Musculoskeletal': '#10b981',
  "Women's Health": '#f59e0b', 'General Wellness': '#3b82f6',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CommunitiesPage: React.FC = () => {
  const [zustandUser, setZustandUser] = useState<any>(() => (useAuthStore.getState() as any).user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!(useAuthStore.getState() as any).isAuthenticated);
  const _hasHydrated = true;
  useEffect(() => { const u = (useAuthStore as any).subscribe((s:any) => { setZustandUser(s.user); setIsAuthenticated(!!s.isAuthenticated); }); return () => u(); }, []);
  const [mounted, setMounted] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [openComposerFor, setOpenComposerFor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'joined' | 'discover'>('joined');
  const [searchQuery, setSearchQuery] = useState('');

  const authFb = readAuth();
  const effectiveUser = zustandUser ?? authFb.user;
  const userName = effectiveUser ? `${effectiveUser.firstName ?? ''} ${effectiveUser.lastName ?? ''}`.trim() || 'Patient' : 'Patient';
  const userInitial = userName[0]?.toUpperCase() ?? 'P';

  useEffect(() => { setMounted(true); }, []);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    let bridge: string[] = [];
    try { bridge = JSON.parse(localStorage.getItem('hc_joined_communities') ?? '[]'); } catch { /**/ }

    let joined: Community[] = [];
    let all: Community[] = [];

    try {
      const r = await patientAPI.getMyCommunities();
      const d = r?.data;
      joined = (d?.data ?? d?.communities ?? d?.data?.communities ?? d ?? []).map((c: any) => ({
        id: c.id ?? c._id ?? c.communityId, name: c.name ?? 'Community', description: c.description ?? '',
        category: c.category ?? 'General', memberCount: c.memberCount ?? 0, isJoined: true,
        icon: c.icon, color: CAT_COLORS[c.category] ?? T.teal,
        postsToday: c.postsToday ?? 0, activeMembersToday: c.activeMembersToday ?? 0,
        isTrending: c.isTrending ?? false, recentMembers: c.recentMembers ?? [],
        latestPostSnippet: c.latestPostSnippet, latestPostTime: c.latestPostTime, unreadCount: c.unreadCount ?? 0,
      }));
    } catch { /**/ }

    try {
      const r = await communityAPI.list();
      const d = r?.data;
      all = (d?.data?.communities ?? d?.communities ?? d?.data ?? d ?? []).map((c: any) => ({
        id: c.id ?? c._id, name: c.name ?? 'Community', description: c.description ?? '',
        category: c.category ?? 'General', memberCount: c.memberCount ?? 0, isJoined: c.isJoined ?? false,
        icon: c.icon, color: CAT_COLORS[c.category] ?? T.teal,
        postsToday: c.postsToday ?? 0, activeMembersToday: c.activeMembersToday ?? 0,
        isTrending: c.isTrending ?? false, recentMembers: c.recentMembers ?? [],
        latestPostSnippet: c.latestPostSnippet, latestPostTime: c.latestPostTime, unreadCount: c.unreadCount ?? 0,
      }));
    } catch { /**/ }

    if (joined.length > 0 && all.length > 0) {
      const jIds = new Set(joined.map(j => j.id));
      all = all.map(c => ({ ...c, isJoined: jIds.has(c.id) }));
    }
    if (bridge.length > 0) {
      if (all.length > 0) all = all.map(c => ({ ...c, isJoined: c.isJoined || bridge.includes(c.id) }));
      else if (joined.length === 0) joined = MOCK_COMMUNITIES.filter(c => bridge.includes(c.id));
    }
    if (all.length === 0) all = MOCK_COMMUNITIES.map(c => ({ ...c, isJoined: bridge.includes(c.id) || (c.isJoined ?? false) }));

    const jIds2 = new Set([...joined.map(j => j.id), ...bridge]);
    setCommunities(all.map(c => ({ ...c, isJoined: jIds2.has(c.id) })));
    setLoading(false);
  }, []);

  useEffect(() => { if (mounted && _hasHydrated) loadCommunities(); }, [mounted, _hasHydrated, loadCommunities]);

  useEffect(() => {
    const h = () => { if (document.visibilityState === 'visible') loadCommunities(); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [loadCommunities]);

  const writeBridge = (id: string, joined: boolean) => {
    try {
      const b: string[] = JSON.parse(localStorage.getItem('hc_joined_communities') ?? '[]');
      localStorage.setItem('hc_joined_communities', JSON.stringify(joined ? [...new Set([...b, id])] : b.filter(i => i !== id)));
    } catch { /**/ }
  };

  const handleJoin = async (id: string) => {
    setCommunities(prev => prev.map(c => c.id === id ? { ...c, isJoined: true, memberCount: c.memberCount + 1 } : c));
    writeBridge(id, true);
    try { await communityAPI.join(id); } catch { /**/ }
  };

  const handleLeave = async (id: string) => {
    setCommunities(prev => prev.map(c => c.id === id ? { ...c, isJoined: false, memberCount: Math.max(0, c.memberCount - 1) } : c));
    setActiveCommunity(null); setOpenComposerFor(null);
    writeBridge(id, false);
    try { await communityAPI.leave(id); } catch { /**/ }
  };

  if (!mounted) return null;

  const joinedCommunities = communities.filter(c => c.isJoined);
  const discoverCommunities = communities.filter(c => !c.isJoined).filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const allFiltered = communities.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalUnread = joinedCommunities.reduce((a, c) => a + (c.unreadCount ?? 0), 0);

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 800, color: T.text, margin: '0 0 3px' }}>Communities</h2>
          <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>Connect with patients who truly understand your journey</p>
        </div>
        {totalUnread > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.tealLight, border: `1px solid ${T.tealBorder}`, borderRadius: 20, padding: '5px 13px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.teal }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: T.tealDark }}>{totalUnread} new {totalUnread === 1 ? 'post' : 'posts'} in your communities</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 18, background: T.tealMid, borderRadius: 11, padding: 3, width: 'fit-content' }}>
        {[['joined', `My Communities${joinedCommunities.length > 0 ? ` (${joinedCommunities.length})` : ''}`], ['discover', 'Discover']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key as any)} style={{
            padding: '7px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
            background: activeTab === key ? T.white : 'transparent',
            color: activeTab === key ? T.tealDark : T.textSub,
            boxShadow: activeTab === key ? `0 1px 6px rgba(77,182,160,0.15)` : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: T.textMuted }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 13 }}>Loading communities…</div>
        </div>

      ) : activeTab === 'joined' ? (
        joinedCommunities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: T.white, borderRadius: 16, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🏘️</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 7 }}>No communities joined yet</div>
            <p style={{ fontSize: 13, color: T.textSub, maxWidth: 320, margin: '0 auto 18px', lineHeight: '1.6' }}>
              Join communities to connect with patients who share your health journey and get real peer support.
            </p>
            <button onClick={() => setActiveTab('discover')} style={{ padding: '9px 22px', borderRadius: 9, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${T.teal},${T.tealDark})`, color: '#fff', fontWeight: 700, fontSize: 13 }}>Discover Communities →</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
            {joinedCommunities.map(c => (
              <div key={c.id} style={{
                background: T.cardBg, borderRadius: 14,
                border: `1px solid ${T.tealBorder}`,
                padding: '14px', transition: 'all 0.2s', boxShadow: T.shadow,
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowHover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Color strip */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.teal},${T.tealDark})` }} />

                {/* Unread badge */}
                {(c.unreadCount ?? 0) > 0 && (
                  <div style={{ position: 'absolute', top: 10, right: 10, background: T.teal, color: '#fff', borderRadius: '50%', width: 19, height: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>{c.unreadCount}</div>
                )}

                {/* Community info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 9, paddingTop: 4 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{c.icon ?? '🏥'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{c.name}</span>
                      {c.isTrending && <span style={{ fontSize: 8, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 7, fontWeight: 800 }}>🔥</span>}
                    </div>
                    <span style={{ fontSize: 9, color: '#fff', background: c.color ?? T.teal, padding: '1px 6px', borderRadius: 7, display: 'inline-block', fontWeight: 700, marginTop: 2 }}>{c.category}</span>
                  </div>
                </div>

                {/* Latest post preview */}
                {c.latestPostSnippet && (
                  <div style={{ background: T.white, borderRadius: 7, padding: '7px 9px', marginBottom: 9, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 2, fontWeight: 600 }}>💬 {c.latestPostTime}</div>
                    <div style={{ fontSize: 11, color: T.textMid, lineHeight: '1.4', overflow: 'hidden', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>{c.latestPostSnippet}</div>
                  </div>
                )}

                {/* Stats + avatars */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: T.textSub }}>👥 {c.memberCount?.toLocaleString()} · 💬 {c.postsToday ?? 0} today</div>
                  {c.recentMembers && c.recentMembers.length > 0 && (
                    <div style={{ display: 'flex' }}>
                      {c.recentMembers.slice(0, 4).map((m, i) => (
                        <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${T.cardBg}`, background: `linear-gradient(135deg,${T.teal},${T.tealDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 800, marginLeft: i > 0 ? -5 : 0 }}>{m}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => handleLeave(c.id)} style={{ padding: '5px 8px', borderRadius: 7, fontSize: 10, fontWeight: 700, border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', whiteSpace: 'nowrap' }}>Leave</button>
                  <button onClick={() => { setActiveCommunity(c); setOpenComposerFor(null); }} style={{ flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 10, fontWeight: 700, border: `1px solid ${T.tealBorder}`, background: T.white, color: T.tealDark, cursor: 'pointer' }}>📰 Feed</button>
                  <button onClick={() => { setActiveCommunity(c); setOpenComposerFor(c.id); }} style={{ flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 10, fontWeight: 700, border: 'none', background: `linear-gradient(135deg,${T.teal},${T.tealDark})`, color: '#fff', cursor: 'pointer' }}>✏️ Post</button>
                </div>
              </div>
            ))}
          </div>
        )

      ) : (
        <>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search communities…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 13px 9px 36px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, outline: 'none', background: T.white, color: T.text }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
            {(searchQuery ? allFiltered : discoverCommunities).map(c => (
              <div key={c.id} style={{
                background: T.cardBg, borderRadius: 14,
                border: c.isJoined ? `1.5px solid ${T.teal}60` : `1px solid ${T.border}`,
                padding: '14px', transition: 'all 0.2s', boxShadow: T.shadow,
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = T.shadowHover; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${c.color ?? T.teal},${c.color ?? T.teal}88)` }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 9, paddingTop: 4 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{c.icon ?? '🏥'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{c.name}</span>
                      {c.isTrending && <span style={{ fontSize: 8, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 7, fontWeight: 800 }}>🔥 Hot</span>}
                      {c.isJoined && <span style={{ fontSize: 8, background: T.tealLight, color: T.tealDark, padding: '1px 5px', borderRadius: 7, fontWeight: 800 }}>✓ Joined</span>}
                    </div>
                    <span style={{ fontSize: 9, color: '#fff', background: c.color ?? T.teal, padding: '1px 6px', borderRadius: 7, display: 'inline-block', fontWeight: 700, marginTop: 2 }}>{c.category}</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: T.textMid, margin: '0 0 9px', lineHeight: '1.55', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 10, color: T.textSub }}>
                  <span>👥 {c.memberCount?.toLocaleString()}</span>
                  {(c.postsToday ?? 0) > 0 && <span>💬 {c.postsToday} today</span>}
                  {(c.activeMembersToday ?? 0) > 0 && <span>🟢 {c.activeMembersToday} active</span>}
                </div>
                {c.isJoined ? (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => handleLeave(c.id)} style={{ padding: '6px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700, border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#ef4444', cursor: 'pointer' }}>Leave</button>
                    <button onClick={() => setActiveCommunity(c)} style={{ flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 10, fontWeight: 700, border: 'none', background: `linear-gradient(135deg,${T.teal},${T.tealDark})`, color: '#fff', cursor: 'pointer' }}>View Feed →</button>
                  </div>
                ) : (
                  <button onClick={() => handleJoin(c.id)} style={{ width: '100%', padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, border: 'none', background: `linear-gradient(135deg,${T.teal},${T.tealDark})`, color: '#fff', cursor: 'pointer', boxShadow: `0 3px 10px ${T.teal}40` }}>+ Join Community</button>
                )}
              </div>
            ))}
            {(searchQuery ? allFiltered : discoverCommunities).length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '36px', color: T.textMuted, background: T.white, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 30, marginBottom: 7 }}>🔍</div>
                <div style={{ fontSize: 13 }}>No communities found for "{searchQuery}"</div>
              </div>
            )}
          </div>
        </>
      )}

      {activeCommunity && (
        <CommunityPanel
          community={activeCommunity}
          onClose={() => { setActiveCommunity(null); setOpenComposerFor(null); }}
          onLeave={handleLeave}
          userName={userName}
          userInitial={userInitial}
          defaultComposerOpen={openComposerFor === activeCommunity.id}
        />
      )}
    </div>
  );
};

export default CommunitiesPage;
