'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { communityAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const T = {
  bg:         '#0D1B2E',
  teal:       '#14B8A6',
  tealDark:   '#0D9488',
  tealGlow:   'rgba(20,184,166,0.1)',
  tealBorder: 'rgba(20,184,166,0.3)',
  textHi:     '#E2E8F0',
  textMid:    '#94A3B8',
  textLow:    '#64748B',
  cardBg:     'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  violet:     '#8B5CF6',
  green:      '#22C55E',
  amber:      '#F59E0B',
} as const;

const CATEGORY_META: Record<string, { emoji: string; accent: string }> = {
  DIABETES:      { emoji: '🩸', accent: 'rgba(20,184,166,0.12)'  },
  CARDIOLOGY:    { emoji: '🫀', accent: 'rgba(244,63,94,0.10)'   },
  MENTAL_HEALTH: { emoji: '🧠', accent: 'rgba(139,92,246,0.12)'  },
  CANCER:        { emoji: '🎗️', accent: 'rgba(245,158,11,0.12)' },
  WOMENS_HEALTH: { emoji: '🌸', accent: 'rgba(244,63,94,0.08)'   },
  NUTRITION:     { emoji: '🥗', accent: 'rgba(34,197,94,0.10)'   },
  FITNESS:       { emoji: '🏃', accent: 'rgba(245,158,11,0.10)'  },
  RARE_DISEASES: { emoji: '🔬', accent: 'rgba(139,92,246,0.12)'  },
  GENERAL:       { emoji: '💬', accent: 'rgba(100,116,139,0.15)' },
};
const catMeta = (c: string) => CATEGORY_META[c] ?? { emoji: '💬', accent: 'rgba(100,116,139,0.15)' };

const FALLBACK = [
  { id: 'm1', name: 'Diabetes Connect',     category: 'DIABETES',      _count: { members: 5602, posts: 312 }, visibility: 'PUBLIC'  },
  { id: 'm2', name: 'Heart Warriors',       category: 'CARDIOLOGY',    _count: { members: 4231, posts: 198 }, visibility: 'PUBLIC'  },
  { id: 'm3', name: 'Mental Health Matters',category: 'MENTAL_HEALTH', _count: { members: 7814, posts: 621 }, visibility: 'PRIVATE' },
  { id: 'm4', name: 'Nutrition India',      category: 'NUTRITION',     _count: { members: 2190, posts: 145 }, visibility: 'PUBLIC'  },
];

export default function LandingCommunitiesSection() {
  const [communities, setCommunities] = useState<any[]>(FALLBACK);

  useEffect(() => {
    communityAPI.list({ limit: 4 })
      .then(r => {
        const data = r?.data?.data?.communities ?? r?.data?.communities ?? [];
        if (Array.isArray(data) && data.length > 0) setCommunities(data.slice(0, 4));
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  return (
    <section style={{ padding: '100px 24px', background: T.bg, position: 'relative', overflow: 'hidden' }}>
      {/* Subtle background grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 20% 50%, rgba(20,184,166,0.04) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 60%)`, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-block', fontSize: 11, fontFamily: 'monospace', color: T.teal, textTransform: 'uppercase', letterSpacing: '0.12em', background: T.tealGlow, border: `1px solid ${T.tealBorder}`, borderRadius: 100, padding: '4px 14px', marginBottom: 18 }}>
            Community
          </div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 38, fontWeight: 800, color: T.textHi, margin: '0 0 16px', lineHeight: 1.2 }}>
            You're not alone on<br />your health journey
          </h2>
          <p style={{ fontSize: 15, color: T.textMid, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Join condition-specific communities where patients share experiences, offer support, and navigate health challenges together.
          </p>
        </div>

        {/* Community cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
          {communities.map((c) => {
            const { emoji, accent } = catMeta(c.category);
            const members = c._count?.members ?? 0;
            const posts   = c._count?.posts ?? 0;
            return (
              <Link key={c.id} href={`/communities/${c.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.tealBorder; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 8px 28px rgba(20,184,166,0.1)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.cardBorder; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: accent, border: `1px solid ${T.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{emoji}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 800, color: T.textHi }}>{c.name}</div>
                      {c.visibility === 'PRIVATE' && (
                        <span style={{ fontSize: 9, background: 'rgba(139,92,246,0.1)', color: T.violet, border: '1px solid rgba(139,92,246,0.2)', borderRadius: 100, padding: '1px 7px', fontFamily: 'monospace' }}>PRIVATE</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: T.textLow, fontFamily: 'monospace', marginTop: 2 }}>{c.category?.replace(/_/g, ' ')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: T.textLow, marginTop: 'auto' }}>
                    <span>👥 <b style={{ color: T.textMid }}>{members.toLocaleString()}</b></span>
                    <span>💬 <b style={{ color: T.textMid }}>{posts.toLocaleString()}</b></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats strip */}
        <div style={{ background: T.tealGlow, border: `1px solid ${T.tealBorder}`, borderRadius: 16, padding: '28px 36px', marginBottom: 40, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
          {[['28,000+', 'Active Members'], ['50+', 'Communities'], ['1,200+', 'Posts/Week'], ['100%', 'Anonymous Option']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color: T.teal }}>{val}</div>
              <div style={{ fontSize: 12, color: T.textMid, fontFamily: 'monospace', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/communities" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '13px 32px', borderRadius: 12, background: `linear-gradient(135deg,${T.tealDark},${T.teal})`, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: "'Poppins',sans-serif", cursor: 'pointer', boxShadow: '0 4px 18px rgba(20,184,166,0.3)' }}>
              Browse All Communities →
            </div>
          </Link>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '13px 32px', borderRadius: 12, border: `1px solid ${T.cardBorder}`, background: T.cardBg, color: T.textMid, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              Sign up to join
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
