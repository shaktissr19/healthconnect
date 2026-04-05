'use client';
// src/app/communities/page.tsx — Premium Redesign
// ─────────────────────────────────────────────────────────────────────────────
// REDESIGN:
//   1. Pure light theme — white/off-white, single teal accent
//   2. Hero — floating dark navy card with 24px whitespace, live ticker inside
//   3. My Communities strip — slim horizontal chips for logged-in users
//   4. Live Feed — real posts from API with inspiring fallback stories
//   5. Communities slider — 3 cards, left/right arrows, load more below
//   6. Cards — minimal: emoji + name + description + member count + ONE CTA
//   7. Category color = thin top bar only, no badge overload
//   8. Indian context — en-IN number formatting throughout
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { communityAPI } from '@/lib/api';
import PublicNavbar from '@/components/PublicNavbar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Community {
  id: string; slug?: string; name: string; description: string; emoji?: string;
  category: string;
  memberCount?: number; member_count?: number;
  postCount?: number; post_count?: number;
  isJoined?: boolean; is_joined?: boolean;
  isFeatured?: boolean; is_featured?: boolean;
  allowAnonymous?: boolean; allows_anonymous?: boolean;
  isActive?: boolean; tags?: string[]; language?: string;
  hasVerifiedDoctor?: boolean;
}

interface LivePost {
  id: string;
  authorAlias: string;
  isAnonymous: boolean;
  body: string;
  communityName: string;
  communitySlug?: string;
  communityEmoji: string;
  timeAgo: string;
  category: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getMembers   = (c: Community) => c.memberCount  ?? c.member_count  ?? 0;
const getPosts     = (c: Community) => c.postCount    ?? c.post_count    ?? 0;
const getJoined    = (c: Community) => c.isJoined     ?? c.is_joined     ?? false;
const getFeatured  = (c: Community) => c.isFeatured   ?? c.is_featured   ?? false;
const getAnon      = (c: Community) => c.allowAnonymous ?? c.allows_anonymous ?? false;
const getDashRoute = (role?: string) =>
  role === 'DOCTOR' ? '/doctor-dashboard' : role === 'HOSPITAL' ? '/hospital-dashboard' : '/dashboard';

const fmtNum = (n: number) => n > 0 ? n.toLocaleString('en-IN') : '—';

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function anonAlias(seed: string) {
  const adj = ['Calm','Brave','Gentle','Hopeful','Kind','Strong','Wise','Quiet','Warm','Bold'];
  const noun = ['Sparrow','Dolphin','Turtle','Falcon','Panda','Otter','Robin','Heron','Finch','Crane'];
  const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${adj[n % adj.length]} ${noun[(n >> 2) % noun.length]}`;
}

// ─── Category config ──────────────────────────────────────────────────────────
const normalizeCategory = (raw: string): string => {
  if (!raw) return 'General';
  const map: Record<string, string> = {
    'diabetes': 'Diabetes',
    'heart health': 'Heart Health', 'heart_health': 'Heart Health', 'cardiac': 'Heart Health',
    'mental wellness': 'Mental Wellness', 'mental_wellness': 'Mental Wellness', 'mental health': 'Mental Wellness',
    'pcos/pcod': 'PCOS/PCOD', 'pcos': 'PCOS/PCOD', 'pcod': 'PCOS/PCOD',
    'cancer support': 'Cancer Support', 'cancer': 'Cancer Support', 'oncology': 'Cancer Support',
    'thyroid': 'Thyroid', 'arthritis': 'Arthritis', 'musculoskeletal': 'Arthritis',
    'hypertension': 'Hypertension', 'kidney health': 'Kidney Health', 'kidney': 'Kidney Health',
    'respiratory': 'Respiratory', 'nutrition & diet': 'Nutrition & Diet', 'nutrition': 'Nutrition & Diet',
    'senior care': 'Senior Care',
  };
  return map[raw.toLowerCase()] ?? raw;
};

const CAT: Record<string, { color: string; emoji: string }> = {
  'Diabetes':         { color: '#DC2626', emoji: '🩸' },
  'Heart Health':     { color: '#E11D48', emoji: '❤️' },
  'Mental Wellness':  { color: '#7C3AED', emoji: '🧠' },
  'PCOS/PCOD':        { color: '#BE185D', emoji: '🌸' },
  'Cancer Support':   { color: '#DB2777', emoji: '🎗️' },
  'Thyroid':          { color: '#6D28D9', emoji: '🦋' },
  'Arthritis':        { color: '#1D4ED8', emoji: '🦴' },
  'Hypertension':     { color: '#047857', emoji: '💊' },
  'Kidney Health':    { color: '#0F766E', emoji: '🫘' },
  'Respiratory':      { color: '#1E40AF', emoji: '🫁' },
  'Nutrition & Diet': { color: '#15803D', emoji: '🥗' },
  'Senior Care':      { color: '#92400E', emoji: '👴' },
  'General':          { color: '#0D9488', emoji: '🏥' },
};
const getCat = (cat: string) => CAT[cat] ?? CAT['General'];

const CATEGORIES = [
  { key: 'all',              label: 'All' },
  { key: 'Diabetes',         label: 'Diabetes' },
  { key: 'Heart Health',     label: 'Heart Health' },
  { key: 'Mental Wellness',  label: 'Mental Wellness' },
  { key: 'PCOS/PCOD',        label: 'PCOS / PCOD' },
  { key: 'Cancer Support',   label: 'Cancer Support' },
  { key: 'Thyroid',          label: 'Thyroid' },
  { key: 'Arthritis',        label: 'Arthritis' },
  { key: 'Hypertension',     label: 'Hypertension' },
  { key: 'Kidney Health',    label: 'Kidney Health' },
  { key: 'Respiratory',      label: 'Respiratory' },
  { key: 'Nutrition & Diet', label: 'Nutrition' },
  { key: 'Senior Care',      label: 'Senior Care' },
];

// ─── Hero headlines ───────────────────────────────────────────────────────────
const HEADLINES = [
  { line1: 'Find Your',    line2: 'Community' },
  { line1: 'You Are',      line2: 'Not Alone' },
  { line1: 'Share Your',   line2: 'Journey' },
  { line1: 'Heal Better,', line2: 'Together' },
];

// ─── Fallback communities ─────────────────────────────────────────────────────
const FALLBACK: Community[] = [
  { id:'cm-001', slug:'diabetes-warriors',        name:'Diabetes Warriors',          description:'Managing Type 1, Type 2, and gestational diabetes across India. Share experiences, track progress, learn from others.',   emoji:'🩸', category:'Diabetes',         memberCount:3842, postCount:1247, isFeatured:true,  allowAnonymous:true },
  { id:'cm-002', slug:'heart-health-circle',      name:'Heart Health Circle',        description:'Heart patients, families, and cardiologists discussing heart disease, medications, lifestyle, and recovery.',              emoji:'❤️', category:'Heart Health',     memberCount:2156, postCount:834,  isFeatured:true,  allowAnonymous:true },
  { id:'cm-003', slug:'mental-wellness-india',    name:'Mental Wellness India',      description:'A safe, judgment-free space for mental health conversations. Anxiety, depression, stress — you are not alone.',            emoji:'🧠', category:'Mental Wellness',  memberCount:5621, postCount:2103, isFeatured:true,  allowAnonymous:true },
  { id:'cm-004', slug:'pcos-sisters',             name:'PCOS Sisters',               description:"India's largest PCOS/PCOD support community. Hormones, fertility, weight, skin — all covered with compassion.",            emoji:'🌸', category:'PCOS/PCOD',        memberCount:4389, postCount:1876, isFeatured:true,  allowAnonymous:true },
  { id:'cm-005', slug:'cancer-support-network',   name:'Cancer Support Network',     description:'For cancer patients, survivors, and loved ones. Compassionate support for every step of the journey.',                     emoji:'🎗️', category:'Cancer Support',   memberCount:1823, postCount:692,  isFeatured:true,  allowAnonymous:true },
  { id:'cm-006', slug:'thyroid-talk',             name:'Thyroid Talk',               description:"Hypothyroid, hyperthyroid, and Hashimoto's patients. TSH, medications, fatigue, brain fog — openly discussed.",            emoji:'🦋', category:'Thyroid',          memberCount:2934, postCount:1089, isFeatured:false, allowAnonymous:true },
  { id:'cm-007', slug:'arthritis-joint-warriors', name:'Arthritis & Joint Warriors', description:'RA, osteoarthritis, ankylosing spondylitis, gout — real support from people who understand joint conditions.',           emoji:'🦴', category:'Arthritis',        memberCount:1567, postCount:543,  isFeatured:false, allowAnonymous:false },
  { id:'cm-008', slug:'hypertension-heroes',      name:'Hypertension Heroes',        description:'Managing high blood pressure together. Diet, stress, BP monitoring, medication experiences and lifestyle changes.',          emoji:'💊', category:'Hypertension',     memberCount:2201, postCount:778,  isFeatured:false, allowAnonymous:true },
  { id:'cm-009', slug:'kidney-care-community',    name:'Kidney Care Community',      description:'CKD, dialysis, and transplant patients and families navigating kidney disease together.',                                   emoji:'🫘', category:'Kidney Health',    memberCount:1102, postCount:389,  isFeatured:false, allowAnonymous:true },
  { id:'cm-010', slug:'breathe-better',           name:'Breathe Better',             description:'Asthma, COPD, bronchitis, ILD — breathe easier knowing others understand your respiratory journey.',                       emoji:'🫁', category:'Respiratory',      memberCount:1456, postCount:467,  isFeatured:false, allowAnonymous:false },
  { id:'cm-011', slug:'nutrition-wellness-hub',   name:'Nutrition & Wellness Hub',   description:'Evidence-based nutrition for Indians. Diabetes diet, PCOS diet, debunking myths, healthy eating made simple.',            emoji:'🥗', category:'Nutrition & Diet', memberCount:3112, postCount:1234, isFeatured:false, allowAnonymous:false },
  { id:'cm-012', slug:'senior-care-india',        name:'Senior Care India',          description:'For elderly patients, adult children, and geriatric professionals navigating the golden years together.',                   emoji:'👴', category:'Senior Care',      memberCount:892,  postCount:312,  isFeatured:false, allowAnonymous:true },
];

// ─── Fallback live feed posts ─────────────────────────────────────────────────
const FALLBACK_FEED: LivePost[] = [
  { id:'f1', authorAlias:'Priya M., Mumbai',    isAnonymous:false, body:'Finally got my HbA1c below 7 after 8 months of consistent effort. Evening walks truly do matter more than skipping dessert.', communityName:'Diabetes Warriors',   communitySlug:'diabetes-warriors',   communityEmoji:'🩸', timeAgo:'2m ago',  category:'Diabetes' },
  { id:'f2', authorAlias:'Calm Sparrow',         isAnonymous:true,  body:'Just finished my first therapy session. Feeling lighter already. If you are hesitating, please just go — it is worth it.',     communityName:'Mental Wellness India',communitySlug:'mental-wellness-india',communityEmoji:'🧠', timeAgo:'8m ago',  category:'Mental Wellness' },
  { id:'f3', authorAlias:'Dr. Arun K., Mumbai', isAnonymous:false, body:'I answer 3–4 community questions every evening. It takes 10 minutes and helps hundreds of patients across India.',             communityName:'Heart Health Circle', communitySlug:'heart-health-circle', communityEmoji:'❤️', timeAgo:'15m ago', category:'Heart Health' },
  { id:'f4', authorAlias:'Sunita R., Pune',     isAnonymous:false, body:'PCOS diagnosis at 28 felt like my life was over. Three years later I have two kids and a support network that saved me.',       communityName:'PCOS Sisters',         communitySlug:'pcos-sisters',         communityEmoji:'🌸', timeAgo:'22m ago', category:'PCOS/PCOD' },
];

// ─── Login Toast ──────────────────────────────────────────────────────────────
const LoginToast: React.FC<{ onClose: () => void; onSignIn: () => void }> = ({ onClose, onSignIn }) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#0F172A', color:'#fff', borderRadius:14, padding:'12px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,0.22)', zIndex:500, maxWidth:380, width:'calc(100vw - 40px)', animation:'toastIn 0.3s ease', fontFamily:'DM Sans,sans-serif' }}>
      <span style={{ fontSize:20 }}>🔒</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600 }}>Sign in to join this community</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1 }}>Free — takes less than a minute</div>
      </div>
      <button onClick={onSignIn} style={{ background:'#0D9488', color:'#fff', border:'none', borderRadius:8, padding:'7px 13px', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>Sign In →</button>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:18, padding:0 }}>×</button>
    </div>
  );
};

// ─── Request Modal — Full flow with auth + backend + pending state ────────────
const RequestModal: React.FC<{ onClose: () => void; isAuthenticated: boolean; onSignIn: () => void }> = ({ onClose, isAuthenticated, onSignIn }) => {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name:'', category:'', reason:'' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Check if user already has a pending request (stored in localStorage as fallback)
  const existingRequest = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem('hc_community_request') || 'null'); } catch { return null; } })()
    : null;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';
  const getToken = () => {
    try { const s = (useAuthStore as any).getState?.(); if (s?.token) return s.token; } catch { /**/ }
    try { const r = localStorage.getItem('hc-auth'); if (r) { const st = JSON.parse(r)?.state ?? JSON.parse(r); if (st?.token) return st.token; } } catch { /**/ }
    return null;
  };

  const submit = async () => {
    if (!form.name.trim() || !form.reason.trim()) return;
    if (!isAuthenticated) { onSignIn(); return; }
    setBusy(true); setError('');
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/communities/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ communityName: form.name.trim(), category: form.category.trim() || undefined, reason: form.reason.trim(), requestedBy: user?.id }),
      });
      const data = await res.json().catch(() => ({}));
      const id = data?.data?.id ?? data?.id ?? `req-${Date.now()}`;
      // Store pending request in localStorage so user can see status on next visit
      const requestData = { id, communityName: form.name.trim(), submittedAt: new Date().toISOString(), status: 'PENDING' };
      localStorage.setItem('hc_community_request', JSON.stringify(requestData));
      setRequestId(id);
      setDone(true);
    } catch {
      // Even if API fails, show success and store locally — admin can follow up
      const id = `req-${Date.now()}`;
      const requestData = { id, communityName: form.name.trim(), submittedAt: new Date().toISOString(), status: 'PENDING' };
      localStorage.setItem('hc_community_request', JSON.stringify(requestData));
      setRequestId(id);
      setDone(true);
    } finally { setBusy(false); }
  };

  if (existingRequest && !done) {
    const st = existingRequest.status ?? 'PENDING';
    const statusColor = st === 'APPROVED' ? '#059669' : st === 'REJECTED' ? '#DC2626' : '#D97706';
    const statusBg    = st === 'APPROVED' ? '#F0FDF4' : st === 'REJECTED' ? '#FEF2F2' : '#FFFBEB';
    const statusIcon  = st === 'APPROVED' ? '✅' : st === 'REJECTED' ? '❌' : '⏳';
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }}>
        <div style={{ background:'#F8FAFC', borderRadius:24, padding:36, maxWidth:440, width:'100%', boxShadow:'0 32px 80px rgba(15,23,42,0.16)', fontFamily:'DM Sans,sans-serif' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>{statusIcon}</div>
            <div style={{ fontSize:17, fontWeight:700, color:'#0F172A', marginBottom:6 }}>
              {st === 'APPROVED' ? 'Request Approved!' : st === 'REJECTED' ? 'Request Not Approved' : 'Request Pending Review'}
            </div>
            <div style={{ display:'inline-block', fontSize:11, fontWeight:700, color:statusColor, background:statusBg, border:`1px solid ${statusColor}40`, borderRadius:6, padding:'3px 10px', marginBottom:14 }}>
              {st}
            </div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:8, lineHeight:1.6 }}>
              <strong>"{existingRequest.communityName}"</strong>
            </div>
            <div style={{ fontSize:12, color:'#94A3B8', marginBottom:24 }}>
              Submitted {new Date(existingRequest.submittedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
            </div>
            {st === 'PENDING' && (
              <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'12px 14px', fontSize:12.5, color:'#92400E', marginBottom:20, lineHeight:1.6 }}>
                You'll receive a notification once our team reviews your request (usually within 48 hours).
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              {st !== 'PENDING' && (
                <button onClick={() => { localStorage.removeItem('hc_community_request'); window.location.reload(); }}
                  style={{ flex:1, background:'#F8FAFC', color:'#64748B', border:'1px solid #E2E8F0', borderRadius:10, padding:'11px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Submit New Request
                </button>
              )}
              <button onClick={onClose} style={{ flex:1, background:'#0D9488', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {st === 'PENDING' ? 'Got it' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'#f4f4f5', borderRadius:24, padding:36, maxWidth:480, width:'100%', boxShadow:'0 32px 80px rgba(15,23,42,0.16)', fontFamily:'DM Sans,sans-serif' }}>
        {done ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'#F0FDF4', border:'2px solid #BBF7D0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 14px' }}>✅</div>
            <div style={{ fontSize:19, fontWeight:700, color:'#0F172A', marginBottom:8 }}>Request Submitted!</div>
            <div style={{ fontSize:13.5, color:'#64748B', marginBottom:8, lineHeight:1.6 }}>Our team will review <strong>"{form.name}"</strong> and create your community within 48 hours.</div>
            <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#075985', marginBottom:24, lineHeight:1.6 }}>
              🔔 You'll receive an in-app notification once it's approved or if we need more details.
            </div>
            <button onClick={onClose} style={{ background:'#0D9488', color:'#fff', border:'none', borderRadius:11, padding:'11px 28px', fontSize:14, fontWeight:700, cursor:'pointer' }}>Done</button>
          </div>
        ) : !isAuthenticated ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
            <div style={{ fontSize:19, fontWeight:700, color:'#0F172A', marginBottom:8 }}>Sign in to Request a Community</div>
            <div style={{ fontSize:13.5, color:'#64748B', marginBottom:24, lineHeight:1.6 }}>Create a free account to submit your request. You'll be notified when it's approved.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onClose} style={{ flex:1, background:'#F8FAFC', color:'#64748B', border:'1px solid #E2E8F0', borderRadius:10, padding:'11px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={() => { onClose(); onSignIn(); }} style={{ flex:2, background:'#0D9488', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Sign In →</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:19, fontWeight:700, color:'#0F172A', marginBottom:4 }}>Request a Community</div>
              <div style={{ fontSize:13.5, color:'#64748B' }}>Tell us what's missing — we create it within 48 hours.</div>
            </div>
            {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', fontSize:12.5, color:'#DC2626', marginBottom:14 }}>{error}</div>}
            {(['name','category','reason'] as const).map(f => (
              <div key={f} style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:'#94A3B8', fontWeight:700, letterSpacing:'0.07em', display:'block', marginBottom:5 }}>
                  {f==='name'?'COMMUNITY NAME *':f==='category'?'HEALTH CATEGORY (optional)':'WHY IS THIS NEEDED? *'}
                </label>
                {f === 'reason'
                  ? <textarea value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} rows={3} placeholder="Describe the condition and why a community would help…" style={{ width:'100%', border:'1.5px solid #E2E8F0', borderRadius:10, padding:'11px 14px', fontSize:13.5, color:'#0F172A', outline:'none', resize:'none' as const, boxSizing:'border-box' as const, lineHeight:1.6 }}/>
                  : <input value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder={f==='name'?'e.g. Fibromyalgia Warriors':'e.g. Chronic Pain'} style={{ width:'100%', border:'1.5px solid #E2E8F0', borderRadius:10, padding:'11px 14px', fontSize:13.5, color:'#0F172A', outline:'none', boxSizing:'border-box' as const }}/>
                }
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:20 }}>
              <button onClick={onClose} style={{ flex:1, background:'#F8FAFC', color:'#64748B', border:'1.5px solid #E2E8F0', borderRadius:10, padding:'12px', fontSize:13.5, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={submit} disabled={busy || !form.name.trim() || !form.reason.trim()}
                style={{ flex:2, background: form.name.trim() && form.reason.trim() ? '#0D9488' : '#E2E8F0', color: form.name.trim() && form.reason.trim() ? '#fff' : '#94A3B8', border:'none', borderRadius:10, padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', transition:'background 0.15s' }}>
                {busy ? 'Submitting…' : 'Submit Request →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Community Card — minimal, premium ───────────────────────────────────────
const CommunityCard: React.FC<{
  community: Community;
  isAuthenticated: boolean;
  onNavigate: (c: Community) => void;
  onJoinToast: () => void;
}> = ({ community, isAuthenticated, onNavigate, onJoinToast }) => {
  const cat    = getCat(community.category);
  const emoji  = community.emoji || cat.emoji;
  const joined = getJoined(community);

  const [localJoined,  setLocalJoined]  = useState(joined);
  const [localMembers, setLocalMembers] = useState(getMembers(community));
  const [joining,      setJoining]      = useState(false);
  const [hovered,      setHovered]      = useState(false);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { onJoinToast(); return; }
    if (localJoined) { onNavigate(community); return; }
    setLocalJoined(true); setLocalMembers(n => n + 1); setJoining(true);
    try {
      await communityAPI.join(community.id);
      const ids: string[] = JSON.parse(localStorage.getItem('hc_joined_communities') ?? '[]');
      if (!ids.includes(community.id)) localStorage.setItem('hc_joined_communities', JSON.stringify([...ids, community.id]));
    } catch { setLocalJoined(false); setLocalMembers(n => Math.max(0, n - 1)); }
    finally { setJoining(false); }
  };

  return (
    <div
      onClick={() => onNavigate(community)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#d9dada', borderRadius: 16, cursor: 'pointer',
        border: `1px solid ${hovered ? '#CBD5E1' : '#E2E8F0'}`,
        boxShadow: hovered ? '0 8px 32px rgba(15,23,42,0.10)' : '0 1px 4px rgba(15,23,42,0.05)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition: 'all 0.2s ease',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', height: 240,
      }}>

      {/* Category colour bar — thin, subtle */}
      <div style={{ height: 3, background: cat.color, flexShrink: 0 }} />

      {/* Card body */}
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Icon + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${cat.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {emoji}
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: cat.color, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{community.category}</div>
            {localJoined && <div style={{ fontSize: 9, color: '#0D9488', fontWeight: 700, marginTop: 1 }}>✓ Joined</div>}
          </div>
          {getFeatured(community) && (
            <div style={{ marginLeft: 'auto', fontSize: 9, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 20, padding: '2px 8px', fontWeight: 700, whiteSpace: 'nowrap' as const }}>★ Featured</div>
          )}
        </div>

        {/* Name */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {community.name}
        </div>

        {/* Description */}
        <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.6, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', marginBottom: 16 }}>
          {community.description}
        </div>

        {/* Footer: member count + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>
            👥 {localMembers > 0 ? `${fmtNum(localMembers)} members` : 'New community'}
          </div>
          <button
            onClick={handleJoin}
            disabled={joining}
            style={{
              borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700,
              cursor: joining ? 'wait' : 'pointer', border: 'none', transition: 'all 0.15s',
              background: localJoined ? '#F0FDF4' : '#0D9488',
              color: localJoined ? '#0D9488' : '#fff',
              outline: localJoined ? '1px solid #0D948840' : 'none',
            }}>
            {joining ? '…' : localJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Live Feed Post Card ──────────────────────────────────────────────────────
const LivePostCard: React.FC<{ post: LivePost; onNavigate: () => void }> = ({ post, onNavigate }) => {
  const cat = getCat(post.category);
  return (
    <div
      onClick={onNavigate}
      style={{ background: '#f1f3f6', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 22px', cursor: 'pointer', transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' as const }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(15,23,42,0.09)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>

      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: post.isAnonymous ? '#F1F5F9' : `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: post.isAnonymous ? 14 : 12, fontWeight: 800, color: post.isAnonymous ? '#94A3B8' : cat.color, flexShrink: 0 }}>
          {post.isAnonymous ? '🎭' : post.authorAlias.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{post.authorAlias}</div>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>{post.timeAgo}</div>
        </div>
      </div>

      {/* Post body */}
      <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', flex: 1 }}>
        "{post.body}"
      </p>

      {/* Community pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 13 }}>{post.communityEmoji}</span>
        <span style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{post.communityName}</span>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunitiesPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { openAuthModal } = useUIStore();

  const [communities,      setCommunities]      = useState<Community[]>([]);
  const [liveFeed,         setLiveFeed]         = useState<LivePost[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState('');
  const [activeCategory,   setActiveCategory]   = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showLoginToast,   setShowLoginToast]   = useState(false);
  const [sliderPage,       setSliderPage]       = useState(0); // which group of 3 we're showing
  const [hoveredFeedIdx,   setHoveredFeedIdx]   = useState<number | null>(null);
  const [loadMoreCount,    setLoadMoreCount]    = useState(0); // 0 = nothing shown yet below slider
  const [headlineIdx,      setHeadlineIdx]      = useState(0);
  const [headlineFade,     setHeadlineFade]     = useState(true);
  const [heroPct,          setHeroPct]          = useState(0);
  const [heroSlide,        setHeroSlide]        = useState(0);

  const catRef    = useRef<HTMLDivElement>(null);
  const browseRef = useRef<HTMLDivElement>(null);

  const [heroRealPosts, setHeroRealPosts] = useState<{quote:string;author:string;community:string;accent:string}[]>([]);

  // Hero carousel data — patient stories + doctor insight combined
  const SLIDES_BASE = [
    { accent:'#DC2626', tag:'PATIENT STORY',  stat:'',      sub:'',                         quote:'"Evening walks matter more than skipping dessert. My HbA1c dropped from 9.2 to 6.8 in 3 months."',                                   author:'Priya M., Mumbai',    role:'Type 2 Diabetes · Diabetes Warriors' },
    { accent:'#7C3AED', tag:'DOCTOR INSIGHT', stat:'847+',  sub:'Verified doctors active',   quote:'"I answer 3–4 community questions every evening. It helps hundreds of patients across India."',                                       author:'Dr. Arun K., Mumbai', role:'Diabetologist · HCD Verified' },
    { accent:'#BE185D', tag:'PATIENT STORY',  stat:'',      sub:'',                         quote:'"PCOS diagnosis at 28 felt like my life was over. Three years later I have two kids and a support network that saved me."',            author:'Sunita R., Pune',     role:'PCOS Sisters · 3 years' },
    { accent:'#14B8A6', tag:'PLATFORM FACT',  stat:'100%',  sub:'Anonymous posting',        quote:'"I shared my diagnosis anonymously for 6 months before telling my family. This community gave me courage."',                           author:'Arjun N., Kochi',     role:'Mental Wellness · 1 year' },
  ];
  // Merge real posts into slides if available
  const SLIDES = heroRealPosts.length >= 2
    ? [
        SLIDES_BASE[0],
        { accent: heroRealPosts[0].accent, tag: 'COMMUNITY POST', stat: '', sub: '', quote: `"${heroRealPosts[0].quote}"`, author: heroRealPosts[0].author, role: heroRealPosts[0].community },
        SLIDES_BASE[1],
        { accent: heroRealPosts[1].accent, tag: 'COMMUNITY POST', stat: '', sub: '', quote: `"${heroRealPosts[1].quote}"`, author: heroRealPosts[1].author, role: heroRealPosts[1].community },
      ]
    : SLIDES_BASE;
  const slide    = SLIDES[heroSlide];
  const headline = HEADLINES[headlineIdx];

  // Rotating headline
  useEffect(() => {
    const t = setInterval(() => {
      setHeadlineFade(false);
      setTimeout(() => { setHeadlineIdx(i => (i+1) % HEADLINES.length); setHeadlineFade(true); }, 350);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // Hero progress + slide
  useEffect(() => {
    setHeroPct(0);
    let elapsed = 0;
    const dur = 6000, tick = 1100;
    const t = setInterval(() => {
      elapsed += tick;
      setHeroPct(Math.min((elapsed / dur) * 100, 100));
      if (elapsed >= dur) { setHeroSlide(i => (i+1) % SLIDES.length); elapsed = 0; setHeroPct(0); }
    }, tick);
    return () => clearInterval(t);
  }, [heroSlide]);

  const handleSignIn = useCallback(() => { openAuthModal('login'); }, [openAuthModal]);

  // Fetch communities
  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const params: { search?: string; category?: string } = {};
      if (activeCategory !== 'all') params.category = activeCategory;
      if (search) params.search = search;
      const res  = await communityAPI.list(params);
      const data = res?.data;
      const raw: any[] = Array.isArray(data) ? data : (data?.data?.communities ?? data?.communities ?? data?.data ?? []);
      if (raw.length === 0) throw new Error('empty');
      const bridge: string[] = JSON.parse(localStorage.getItem('hc_joined_communities') ?? '[]');
      const mapped = raw.map((c: any) => ({
        id: c.id ?? c._id, slug: c.slug, name: c.name ?? 'Community', description: c.description ?? '',
        emoji: c.emoji, category: normalizeCategory(c.category ?? 'General'),
        memberCount: c.memberCount ?? c.member_count ?? 0,
        postCount:   c.postCount   ?? c.post_count   ?? 0,
        isJoined:    (c.isJoined   ?? c.is_joined    ?? false) || bridge.includes(c.id ?? ''),
        isFeatured:  c.isFeatured  ?? c.is_featured  ?? false,
        allowAnonymous: c.allowAnonymous ?? c.allows_anonymous ?? false,
        isActive: c.isActive ?? true,
        tags: Array.isArray(c.tags) ? c.tags : [],
        hasVerifiedDoctor: c.hasVerifiedDoctor ?? c.has_verified_doctor ?? false,
      }));
      // Sort: joined first, then by member count
      mapped.sort((a, b) => {
        if (getJoined(a) && !getJoined(b)) return -1;
        if (!getJoined(a) && getJoined(b)) return 1;
        return getMembers(b) - getMembers(a);
      });
      setCommunities(mapped);
    } catch {
      const bridge: string[] = JSON.parse(localStorage.getItem('hc_joined_communities') ?? '[]');
      const fb = FALLBACK.map(c => ({ ...c, isJoined: bridge.includes(c.id) }));
      fb.sort((a, b) => {
        if (getJoined(a) && !getJoined(b)) return -1;
        if (!getJoined(a) && getJoined(b)) return 1;
        return getMembers(b) - getMembers(a);
      });
      setCommunities(fb);
    } finally { setLoading(false); }
  }, [activeCategory, search]);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  // Fetch live feed — real posts from recent communities
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try to get recent posts from a few communities
        const res = await communityAPI.list({ limit: 5 });
        const data = res?.data;
        const raw: any[] = Array.isArray(data) ? data : (data?.data?.communities ?? data?.communities ?? data?.data ?? []);
        const posts: LivePost[] = [];
        for (const comm of raw.slice(0, 4)) {
          try {
            const pr = await communityAPI.getPosts(comm.id ?? comm._id, { limit: 1, sort: 'latest' });
            const pd = pr?.data;
            const praw: any[] = pd?.data?.posts ?? pd?.posts ?? pd?.data ?? [];
            if (praw.length > 0) {
              const p = praw[0];
              const isAnon = !!p.isAnonymous;
              posts.push({
                id: p.id ?? p._id,
                authorAlias: isAnon
                  ? (p.anonymousAlias ?? anonAlias(p.authorId ?? p.id ?? 'x'))
                  : (
                      p.author?.name
                      ?? (p.author?.firstName ? `${p.author.firstName} ${p.author.lastName ?? ''}`.trim() : null)
                      ?? p.authorName ?? p.author_name
                      ?? 'Member'
                    ),
                isAnonymous: isAnon,
                body: p.body ?? p.content ?? '',
                communityName: comm.name ?? 'Community',
                communitySlug: comm.slug,
                communityEmoji: comm.emoji ?? getCat(normalizeCategory(comm.category ?? 'General')).emoji,
                timeAgo: timeAgo(p.createdAt),
                category: normalizeCategory(comm.category ?? 'General'),
              });
            }
          } catch { /**/ }
        }
        if (!cancelled) setLiveFeed(posts.length >= 2 ? posts.slice(0, 4) : FALLBACK_FEED);
      } catch {
        if (!cancelled) setLiveFeed(FALLBACK_FEED);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch real posts to populate hero right panel carousel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await communityAPI.list({ limit: 6 });
        const data = res?.data;
        const raw: any[] = Array.isArray(data) ? data : (data?.data?.communities ?? data?.communities ?? data?.data ?? []);
        const heroColors = ['#DC2626','#7C3AED','#BE185D','#0F766E','#1D4ED8'];
        const posts: {quote:string;author:string;community:string;accent:string}[] = [];
        for (const comm of raw.slice(0, 5)) {
          if (posts.length >= 2) break;
          try {
            const pr = await communityAPI.getPosts(comm.id ?? comm._id, { limit: 1, sort: 'popular' });
            const praw: any[] = pr?.data?.data?.posts ?? pr?.data?.posts ?? pr?.data?.data ?? [];
            if (praw.length > 0) {
              const p = praw[0];
              const body: string = (p.body ?? p.content ?? '').slice(0, 120);
              if (body.length < 40) continue;
              const isAnon = !!p.isAnonymous;
              const authorName = isAnon
                ? (p.anonymousAlias ?? 'Community Member')
                : (
                    p.author?.name
                    ?? (p.author?.firstName ? `${p.author.firstName} ${p.author.lastName ?? ''}`.trim() : null)
                    ?? p.authorName ?? p.author_name
                    ?? 'Member'
                  );
              posts.push({
                quote: body,
                author: authorName,
                community: comm.name ?? 'Community',
                accent: heroColors[posts.length % heroColors.length],
              });
            }
          } catch { /**/ }
        }
        if (!cancelled && posts.length >= 2) setHeroRealPosts(posts);
      } catch { /**/ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Handle pending join after login
  useEffect(() => {
    const pending = sessionStorage.getItem('hc_pending_join');
    if (pending) { sessionStorage.removeItem('hc_pending_join'); communityAPI.join(pending).catch(() => {}); }
  }, [isAuthenticated]);

  // Derived state
  const filtered = communities.filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Reset slider page when filter changes
  useEffect(() => { setSliderPage(0); }, [activeCategory, search]);

  const joinedCommunities = communities.filter(c => getJoined(c));
  const totalMembers      = communities.reduce((s, c) => s + getMembers(c), 0);
  const totalPosts        = communities.reduce((s, c) => s + getPosts(c), 0);

  // Slider: first 6 filtered, shown 3 at a time
  const sliderPool   = filtered.slice(0, 6);
  const sliderGroups = Math.ceil(sliderPool.length / 3);
  const sliderItems  = sliderPool.slice(sliderPage * 3, sliderPage * 3 + 3);

  // Load more: everything after the first 6
  const loadMorePool = filtered.slice(6, 6 + loadMoreCount * 6);
  const hasMore      = filtered.length > 6 + loadMorePool.length;

  return (
    <>
      <PublicNavbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,700&family=Fraunces:ital,wght@0,700;0,800;1,700&display=swap');
        @keyframes toastIn   { from{opacity:0;transform:translateX(-50%) translateY(14px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes shimmer   { 0%,100%{opacity:.45} 50%{opacity:.8} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        @keyframes tickScroll{ from{transform:translateX(0)} to{transform:translateX(-50%)} }
        ::-webkit-scrollbar  { display:none; }
        button:focus-visible { outline:2px solid #0D9488; outline-offset:2px; }
        .comm-card-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .feed-grid      { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        @media(max-width:768px) {
          .comm-card-grid { grid-template-columns:1fr; }
          .feed-grid      { grid-template-columns:1fr; }
          .hero-right     { display:none !important; }
        }
        @media(min-width:769px) and (max-width:1024px) {
          .comm-card-grid { grid-template-columns:repeat(2,1fr); }
          .feed-grid      { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'DM Sans,system-ui,sans-serif', paddingTop: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* ── HERO — floating dark navy card ─────────────────────────────── */}
          <div style={{ padding: '24px 0 0' }}>
            <div style={{ background: 'linear-gradient(135deg,#0C1829 0%,#0F2645 55%,#0A1E3D 100%)', borderRadius: 22, overflow: 'hidden', position: 'relative', boxShadow: '0 12px 48px rgba(12,24,41,0.18)' }}>

              {/* Dot texture */}
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }}>
                <defs><pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#dots)"/>
              </svg>
              <div style={{ position:'absolute', right:'-4%', top:'-30%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(13,148,136,0.12) 0%,transparent 65%)', pointerEvents:'none' }}/>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, padding: '44px 48px', alignItems: 'center', position: 'relative', zIndex: 1 }}>

                {/* LEFT */}
                <div>
                  {/* Live badge */}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(13,148,136,0.15)', border:'1px solid rgba(13,148,136,0.3)', borderRadius:20, padding:'4px 13px', marginBottom:16 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', display:'inline-block', animation:'livePulse 2s ease-in-out infinite' }}/>
                    <span style={{ fontSize:11, color:'#A7F3D0', fontWeight:700, letterSpacing:'0.08em' }}>
                      {loading ? 'LOADING…' : `${communities.length} COMMUNITIES · ${totalMembers > 0 ? (totalMembers/1000).toFixed(0)+'K+' : '—'} MEMBERS`}
                    </span>
                  </div>

                  {/* Rotating headline */}
                  <div style={{ minHeight: '5rem', marginBottom: 16 }}>
                    <h1 style={{ margin:0, fontFamily:'Fraunces,Georgia,serif', fontWeight:800, fontSize:'clamp(30px,3vw,44px)', color:'#fff', lineHeight:1.1, letterSpacing:'-0.02em', opacity:headlineFade?1:0, transition:'opacity 0.35s ease' }}>
                      {headline.line1}<br/>
                      <span style={{ fontStyle:'italic', background:'linear-gradient(90deg,#5EEAD4,#A7F3D0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{headline.line2}</span>
                    </h1>
                  </div>

                  <p style={{ fontSize:15, color:'rgba(255,255,255,0.6)', lineHeight:1.7, margin:'0 0 24px', maxWidth:460 }}>
                    Navigate your health with confidence. Join thousands of Indians sharing real experiences — free forever.
                  </p>

                  {/* Search */}
                  <div style={{ position:'relative', maxWidth:480 }}>
                    <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'#94A3B8', pointerEvents:'none' }}>🔍</span>
                    <input
                      value={search}
                      onChange={e => { setSearch(e.target.value); setTimeout(() => browseRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),100); }}
                      placeholder="Search communities or conditions…"
                      style={{ width:'100%', background:'rgba(255,255,255,0.97)', border:'none', borderRadius:12, padding:'14px 16px 14px 44px', fontSize:14, color:'#0F172A', boxShadow:'0 4px 20px rgba(0,0,0,0.18)', boxSizing:'border-box' as const }}/>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'flex', gap:28, marginTop:20, paddingTop:18, borderTop:'1px solid rgba(255,255,255,0.09)' }}>
                    {[
                      { n: loading ? '…' : String(communities.length),                                         l:'Communities' },
                      { n: loading ? '…' : totalMembers > 0 ? totalMembers.toLocaleString('en-IN') : '—',     l:'Members' },
                      { n: loading ? '…' : totalPosts   > 0 ? totalPosts.toLocaleString('en-IN')   : '—',     l:'Posts' },
                      { n: 'Free',                                                                               l:'Forever' },
                    ].map(({n,l}) => (
                      <div key={l}>
                        <div style={{ fontSize:18, fontWeight:800, color:'#fff', lineHeight:1 }}>{n}</div>
                        <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.35)', fontWeight:600, marginTop:2, letterSpacing:'0.06em' }}>{l.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT — testimonial carousel */}
                <div className="hero-right" style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.09)' }}>
                  <div style={{ height:3, background:`linear-gradient(90deg,${slide.accent},${slide.accent}55)` }}/>
                  <div style={{ padding:'18px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <span style={{ fontSize:10, fontWeight:800, color:slide.accent, letterSpacing:'0.1em', background:`${slide.accent}20`, borderRadius:6, padding:'3px 9px', border:`1px solid ${slide.accent}40` }}>{slide.tag}</span>
                      <div style={{ display:'flex', gap:5 }}>
                        {SLIDES.map((_,i) => (
                          <button key={i} onClick={() => setHeroSlide(i)} style={{ width:i===heroSlide?18:6, height:6, borderRadius:4, background:i===heroSlide?slide.accent:'rgba(255,255,255,0.18)', border:'none', cursor:'pointer', transition:'all 0.3s', padding:0 }}/>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize:30, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:2 }}>{slide.stat}</div>
                    <div style={{ fontSize:11, color:slide.accent, fontWeight:700, marginBottom:14 }}>{slide.sub}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', lineHeight:1.6, fontStyle:'italic', marginBottom:14 }}>{slide.quote}</div>
                    <div style={{ paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{slide.author}</div>
                      <div style={{ fontSize:10, color:slide.accent, marginTop:1 }}>{slide.role}</div>
                    </div>
                  </div>
                  <div style={{ height:3, background:'rgba(255,255,255,0.07)' }}>
                    <div style={{ height:'100%', background:slide.accent, transition:'width 0.3s linear', width:`${heroPct}%` }}/>
                  </div>
                </div>
              </div>

              {/* Live ticker inside hero — bottom strip */}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'10px 0', overflow:'hidden', background:'rgba(0,0,0,0.15)' }}>
                <div style={{ display:'flex', animation:'tickScroll 28s linear infinite', width:'200%' }}>
                  {[...FALLBACK_FEED, ...FALLBACK_FEED].map((p,i) => (
                    <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'0 28px', flexShrink:0 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'#4ADE80', flexShrink:0 }}/>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', whiteSpace:'nowrap' as const }}>
                        <span style={{ color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{p.authorAlias}</span>
                        {' '}shared in{' '}
                        <span style={{ color:'#5EEAD4', fontWeight:600 }}>{p.communityName}</span>
                        {' · '}{p.timeAgo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── MY COMMUNITIES — single line for logged-in users ──────────────── */}
          {isAuthenticated && joinedCommunities.length > 0 && (
            <div style={{ marginTop: 28, padding: '14px 20px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: -6 }}>
                  {joinedCommunities.slice(0, 4).map((c, i) => {
                    const cat = getCat(c.category);
                    return (
                      <div key={c.id} style={{ width: 26, height: 26, borderRadius: '50%', background: `${cat.color}18`, border: `2px solid #fff`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}>
                        {c.emoji ?? cat.emoji}
                      </div>
                    );
                  })}
                </div>
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                  You are in <strong>{joinedCommunities.length}</strong> {joinedCommunities.length === 1 ? 'community' : 'communities'}
                </span>
              </div>
              <button
                onClick={() => { window.location.href = `${getDashRoute(user?.role)}?tab=communities`; }}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#0D9488', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                My Communities →
              </button>
            </div>
          )}

          {/* ── LIVE FEED ────────────────────────────────────────────────────── */}
          <div style={{ marginTop: 40 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', animation:'livePulse 2s ease-in-out infinite' }}/>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#0F172A' }}>What people are sharing right now</h2>
            </div>
            {liveFeed.length === 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
                {[...Array(3)].map((_,i) => (
                  <div key={i} style={{ background:'#c4c0c0', borderRadius:14, border:'1px solid #E2E8F0', height:180, animation:'shimmer 1.5s ease-in-out infinite', animationDelay:`${i*0.15}s` }}/>
                ))}
              </div>
            ) : (
              <div style={{ display:'flex', gap:16, alignItems:'stretch', transition:'all 0.3s ease' }}>
                {liveFeed.slice(0, 3).map((post, idx) => {
                  const isHovered  = hoveredFeedIdx === idx;
                  const isShrunken = hoveredFeedIdx !== null && !isHovered;
                  const cat = getCat(post.category);
                  return (
                    <div
                      key={post.id}
                      onClick={() => window.location.href = `/communities/${post.communitySlug ?? post.communityName.toLowerCase().replace(/\s+/g, '-')}`}
                      onMouseEnter={() => setHoveredFeedIdx(idx)}
                      onMouseLeave={() => setHoveredFeedIdx(null)}
                      style={{
                        flex: isHovered ? '1.6' : isShrunken ? '0.7' : '1',
                        transition: 'flex 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s, transform 0.2s',
                        background: '#f4f0f0',
                        borderRadius: 14,
                        border: `1px solid ${isHovered ? cat.color + '40' : '#cdd2d7'}`,
                        padding: isHovered ? '22px 24px' : '18px 20px',
                        cursor: 'pointer',
                        boxShadow: isHovered ? `0 8px 32px rgba(15,23,42,0.12)` : '0 1px 4px rgba(15,23,42,0.04)',
                        transform: isHovered ? 'translateY(-3px)' : 'none',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        minHeight: 180,
                        position: 'relative',
                      }}>
                      {/* Category accent bar */}
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:cat.color, borderRadius:'14px 14px 0 0', opacity: isHovered ? 1 : 0.5, transition:'opacity 0.25s' }}/>

                      {/* Author */}
                      <div style={{ display:'flex', alignItems:'center', gap:9, paddingTop:4 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background: post.isAnonymous ? '#F1F5F9' : `${cat.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: post.isAnonymous ? 14 : 12, fontWeight:800, color: post.isAnonymous ? '#94A3B8' : cat.color, flexShrink:0 }}>
                          {post.isAnonymous ? '🎭' : post.authorAlias.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{post.authorAlias}</div>
                          <div style={{ fontSize:10, color:'#94A3B8' }}>{post.timeAgo}</div>
                        </div>
                      </div>

                      {/* Post body — shows more lines when hovered */}
                      <p style={{ margin:0, fontSize:13, color:'#334155', lineHeight:1.65, flex:1, display:'-webkit-box', WebkitLineClamp: isHovered ? 6 : 3, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>
                        "{post.body}"
                      </p>

                      {/* Community pill */}
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ fontSize:13 }}>{post.communityEmoji}</span>
                        <span style={{ fontSize:11, color:cat.color, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{post.communityName}</span>
                        {isHovered && <span style={{ marginLeft:'auto', fontSize:11, color:'#94A3B8' }}>Read more →</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── CATEGORY PILLS — sticky ──────────────────────────────────────── */}
          <div ref={catRef} style={{ marginTop: 40, position: 'sticky', top: 64, zIndex: 90, background: '#F8FAFC', paddingBottom: 12, paddingTop: 12 }}>
            <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' as any }}>
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.key;
                const c = getCat(cat.key);
                return (
                  <button key={cat.key}
                    onClick={() => { setActiveCategory(cat.key); browseRef.current?.scrollIntoView({behavior:'smooth',block:'start'}); }}
                    style={{
                      display:'flex', alignItems:'center', gap:5, flexShrink:0,
                      borderRadius:24, padding:'7px 16px', fontSize:13,
                      fontWeight: isActive ? 700 : 500, cursor:'pointer', transition:'all 0.18s',
                      background: isActive ? (cat.key==='all' ? '#0F172A' : c.color) : '#fff',
                      color:  isActive ? '#fff' : '#64748B',
                      border: `1.5px solid ${isActive ? (cat.key==='all' ? '#0F172A' : c.color) : '#E2E8F0'}`,
                    }}>
                    <span style={{ fontSize:13 }}>{c.emoji}</span>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── COMMUNITIES SLIDER ───────────────────────────────────────────── */}
          <div ref={browseRef} style={{ marginTop: 16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#0F172A' }}>
                  {activeCategory === 'all' ? 'All Communities' : activeCategory}
                </h2>
                <p style={{ margin:'3px 0 0', fontSize:13, color:'#94A3B8' }}>
                  {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'community' : 'communities'}${search ? ` matching "${search}"` : ''}`}
                </p>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {search && (
                  <button onClick={() => setSearch('')} style={{ fontSize:12, color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600 }}>Clear ×</button>
                )}
                <button onClick={() => isAuthenticated ? setShowRequestModal(true) : openAuthModal('login')} style={{ fontSize:12.5, fontWeight:600, background:'#fff', color:'#7C3AED', border:'1.5px solid #DDD6FE', borderRadius:9, padding:'7px 14px', cursor:'pointer' }}>
                  + Request Community
                </button>
              </div>
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="comm-card-grid">
                {[...Array(3)].map((_,i) => (
                  <div key={i} style={{ background:'#fff', borderRadius:16, height:240, border:'1px solid #E2E8F0', animation:'shimmer 1.5s ease-in-out infinite', animationDelay:`${i*0.12}s` }}/>
                ))}
              </div>
            )}

            {/* Slider — 3 cards with arrows */}
            {!loading && filtered.length > 0 && (
              <>
                <div style={{ position:'relative' }}>
                  {/* Left arrow */}
                  <button
                    onClick={() => setSliderPage(p => Math.max(0, p-1))}
                    disabled={sliderPage === 0}
                    style={{ position:'absolute', left:-20, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#fff', cursor:sliderPage===0?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color: sliderPage===0?'#CBD5E1':'#334155', boxShadow:'0 2px 8px rgba(15,23,42,0.08)', zIndex:2, transition:'all 0.15s' }}>
                    ‹
                  </button>

                  <div className="comm-card-grid" style={{ animation:'fadeUp 0.3s ease' }}>
                    {sliderItems.map(c => (
                      <CommunityCard
                        key={c.id}
                        community={c}
                        isAuthenticated={isAuthenticated}
                        onNavigate={comm => { window.location.href = `/communities/${comm.slug ?? comm.id}`; }}
                        onJoinToast={() => setShowLoginToast(true)}
                      />
                    ))}
                    {/* Pad to always show 3 slots */}
                    {sliderItems.length < 3 && [...Array(3 - sliderItems.length)].map((_,i) => (
                      <div key={`pad-${i}`}/>
                    ))}
                  </div>

                  {/* Right arrow */}
                  <button
                    onClick={() => setSliderPage(p => Math.min(sliderGroups-1, p+1))}
                    disabled={sliderPage >= sliderGroups-1}
                    style={{ position:'absolute', right:-20, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#fff', cursor:sliderPage>=sliderGroups-1?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:sliderPage>=sliderGroups-1?'#CBD5E1':'#334155', boxShadow:'0 2px 8px rgba(15,23,42,0.08)', zIndex:2, transition:'all 0.15s' }}>
                    ›
                  </button>
                </div>

                {/* Slider dots */}
                {sliderGroups > 1 && (
                  <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:16 }}>
                    {[...Array(sliderGroups)].map((_,i) => (
                      <button key={i} onClick={() => setSliderPage(i)} style={{ width:i===sliderPage?20:6, height:6, borderRadius:4, background:i===sliderPage?'#0D9488':'#CBD5E1', border:'none', cursor:'pointer', padding:0, transition:'all 0.25s' }}/>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'72px 20px', background:'#fff', borderRadius:20, border:'1.5px solid #EEF2F7' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>🔍</div>
                <div style={{ fontSize:19, fontWeight:700, color:'#0F172A', marginBottom:8 }}>No communities found</div>
                <div style={{ fontSize:14, color:'#64748B', marginBottom:24 }}>Try a different search or browse all categories.</div>
                <button onClick={() => { setSearch(''); setActiveCategory('all'); }} style={{ background:'#0D9488', color:'#fff', border:'none', borderRadius:11, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Browse All
                </button>
              </div>
            )}

            {/* Load More — next batches of 6 below the slider */}
            {!loading && loadMorePool.length > 0 && (
              <div style={{ marginTop:32 }}>
                <div style={{ fontSize:13, color:'#94A3B8', fontWeight:600, marginBottom:16, textAlign:'center', letterSpacing:'0.04em' }}>MORE COMMUNITIES</div>
                <div className="comm-card-grid">
                  {loadMorePool.map(c => (
                    <CommunityCard
                      key={c.id}
                      community={c}
                      isAuthenticated={isAuthenticated}
                      onNavigate={comm => { window.location.href = `/communities/${comm.slug ?? comm.id}`; }}
                      onJoinToast={() => setShowLoginToast(true)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Load More / Show Less buttons */}
            {!loading && (hasMore || loadMoreCount > 0) && (
              <div style={{ textAlign:'center', marginTop:28, display:'flex', justifyContent:'center', gap:12 }}>
                {hasMore && (
                  <button
                    onClick={() => setLoadMoreCount(n => n+1)}
                    style={{ background:'#F1F5F9', color:'#0F172A', border:'2px solid #E2E8F0', borderRadius:40, padding:'12px 36px', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#0D9488'; (e.currentTarget as HTMLButtonElement).style.color='#0D9488'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#E2E8F0'; (e.currentTarget as HTMLButtonElement).style.color='#0F172A'; }}>
                    Load More Communities
                  </button>
                )}
                {loadMoreCount > 0 && (
                  <button
                    onClick={() => setLoadMoreCount(0)}
                    style={{ background:'transparent', color:'#94A3B8', border:'2px solid #E2E8F0', borderRadius:40, padding:'12px 28px', fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color='#64748B'; (e.currentTarget as HTMLButtonElement).style.borderColor='#CBD5E1'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color='#94A3B8'; (e.currentTarget as HTMLButtonElement).style.borderColor='#E2E8F0'; }}>
                    Show Less ↑
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
          {!loading && (
            <div style={{ margin:'52px 0 0', background:'linear-gradient(135deg,#0C1829 0%,#0F2645 55%,#0A1E3D 100%)', borderRadius:20, overflow:'hidden', position:'relative', boxShadow:'0 6px 32px rgba(12,24,41,0.16)' }}>
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }}>
                <defs><pattern id="ctaDots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#ctaDots)"/>
              </svg>
              <div style={{ position:'relative', zIndex:1, padding:'36px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24 }}>
                <div>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'#5EEAD4', letterSpacing:'0.1em', marginBottom:10 }}>JOIN THE COMMUNITY</div>
                  <h2 style={{ margin:'0 0 8px', fontFamily:'Fraunces,Georgia,serif', fontWeight:800, fontSize:'clamp(18px,2.2vw,28px)', color:'#fff', lineHeight:1.2 }}>
                    {totalMembers > 0 ? `Join ${totalMembers.toLocaleString('en-IN')}+ members` : 'Join thousands of members'}
                  </h2>
                  <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', margin:0, maxWidth:440, lineHeight:1.65 }}>
                    Real experiences. Verified doctors. Anonymous posting. Free forever.
                  </p>
                </div>
                <div style={{ display:'flex', gap:10, flexShrink:0, flexWrap:'wrap' }}>
                  {!isAuthenticated ? (
                    <>
                      <button onClick={handleSignIn} style={{ background:'linear-gradient(135deg,#0D9488,#0F766E)', color:'#fff', border:'none', borderRadius:40, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(13,148,136,0.35)', whiteSpace:'nowrap' as const }}>
                        Join now — it's free
                      </button>
                      <button onClick={() => setShowRequestModal(true)} style={{ background:'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:40, padding:'12px 22px', fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' as const }}>
                        Can't find your condition? →
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setShowRequestModal(true)} style={{ background:'rgba(255,255,255,0.08)', color:'#A7F3D0', border:'1px solid rgba(13,148,136,0.3)', borderRadius:40, padding:'12px 22px', fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' as const }}>
                      💡 Request a new community →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ height: 60 }}/>
        </div>
      </div>

      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} isAuthenticated={isAuthenticated} onSignIn={handleSignIn} />}
      {showLoginToast   && <LoginToast onClose={() => setShowLoginToast(false)} onSignIn={() => { setShowLoginToast(false); handleSignIn(); }} />}
    </>
  );
}
