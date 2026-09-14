'use client';

import { useEffect, useMemo, useState, type CSSProperties, type SyntheticEvent } from 'react';
import Link from 'next/link';
import communityApiV2 from '@/lib/communityApiV2';
import { api } from '@/lib/api';
import InfoPopover from '@/components/landing/InfoPopover';

const FEATURES = [
  { title: 'Find your community', copy: 'Discover condition-focused spaces built around shared health journeys.', icon: 'people', href: '/communities', bg: '#2E5B60', iconBg: '#426F73' },
  { title: 'Share & learn', copy: 'Ask questions, exchange experience and learn from people who understand.', icon: 'chat', href: '/communities', bg: '#405A73', iconBg: '#55708A' },
  { title: 'Guides & resources', copy: 'Move from discussion into practical explainers and educational content.', icon: 'book', href: '/learn', bg: '#5B5572', iconBg: '#706A87' },
  { title: 'Safe participation', copy: 'Moderation, reporting and membership controls support constructive spaces.', icon: 'shield', href: '/communities', bg: '#59665B', iconBg: '#6E7B70' },
] as const;

const MAIN_IMAGE = '/images/communities/health-communities-main.png';
const POPULAR_ACCENTS = ['#B85678', '#5E86AD', '#806AA8', '#668A6B'] as const;

function Icon({ kind, size = 20 }: { kind: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (kind === 'people') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if (kind === 'chat') return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/></svg>;
  if (kind === 'book') return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if (kind === 'shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

function formatCount(value: number | null | undefined) {
  if (!Number.isFinite(Number(value)) || Number(value) < 0) return '—';
  const n = Number(value);
  if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toLocaleString('en-IN');
}

export default function HealthCommunitiesShowcase() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [communityTotal, setCommunityTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [directory, statsResponse] = await Promise.allSettled([
          communityApiV2.list({ limit: 50 }),
          api.get('/public/stats'),
        ]);
        if (!alive) return;
        if (directory.status === 'fulfilled') {
          const result: any = directory.value || {};
          const items = Array.isArray(result?.communities) ? result.communities : Array.isArray(result) ? result : [];
          setCommunities(items);
          const directoryTotal = Number(result?.total ?? result?.pagination?.total ?? result?.meta?.total);
          if (Number.isFinite(directoryTotal)) setCommunityTotal(directoryTotal);
        }
        if (statsResponse.status === 'fulfilled') {
          const raw: any = statsResponse.value?.data?.data ?? statsResponse.value?.data ?? {};
          const total = Number(raw?.communities);
          if (Number.isFinite(total)) setCommunityTotal(total);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => { alive = false; };
  }, []);

  const totals = useMemo(() => communities.reduce((acc, c) => ({
    members: acc.members + Number(c?.member_count ?? c?.memberCount ?? 0),
    posts: acc.posts + Number(c?.post_count ?? c?.postCount ?? 0),
  }), { members: 0, posts: 0 }), [communities]);
  const popular = useMemo(() => communities.slice(0, 4), [communities]);
  const hideBrokenImage = (event: SyntheticEvent<HTMLImageElement>) => { event.currentTarget.style.display = 'none'; };

  return <section className="hc-community-showcase" id="health-communities-story" aria-labelledby="hc-community-title">
    <style>{`
      .hc-community-showcase{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#D9E3DF;padding:42px 22px 48px;scroll-margin-top:76px;border-top:1px solid #C2D0CA;border-bottom:1px solid #C2D0CA}.hc-community-shell{width:min(100%,1380px);margin:0 auto}.hc-community-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.55fr);gap:44px;align-items:end;margin:0 6px 18px}.hc-community-kicker{font-size:13px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#8B5A43;margin-bottom:7px}.hc-community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.95rem,2.45vw,2.7rem);line-height:1.04;letter-spacing:-.047em;color:#17364D;margin:0;max-width:760px}.hc-community-title span{color:#5D557A}.hc-community-head p{font-size:15px;line-height:1.5;color:#3D596A;margin:0 0 4px;max-width:520px}
      .hc-community-stage{position:relative;min-height:430px;border:1px solid #C9C3BA;border-radius:26px;overflow:hidden;background:linear-gradient(110deg,#F3EEE7 0%,#F3EEE7 50%,#E4EAEB 64%,#DCE6E8 100%);box-shadow:0 17px 38px rgba(42,55,68,.10)}.hc-community-visual{position:absolute;z-index:0;right:0;top:0;width:55%;height:100%;overflow:hidden;background:#E3EAEC}.hc-community-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 50%;display:block}.hc-community-visual:before{content:'';position:absolute;z-index:2;left:-1px;top:0;bottom:0;width:26%;background:linear-gradient(90deg,#F3EEE7 0%,rgba(243,238,231,.76) 38%,rgba(243,238,231,.18) 76%,transparent 100%);pointer-events:none}.hc-community-content{position:relative;z-index:3;width:57%;padding:31px 34px 28px 38px;box-sizing:border-box}.hc-community-content h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.62rem,1.9vw,2rem);letter-spacing:-.04em;line-height:1.08;margin:0 0 7px;color:#17364D}.hc-community-content>p{font-size:13.8px;line-height:1.46;color:#526B7A;margin:0 0 12px;max-width:520px}.hc-community-rule{width:42px;height:3px;border-radius:999px;background:#8B5A43;margin-bottom:13px}
      .hc-community-feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.hc-community-feature{min-height:108px;display:grid;grid-template-columns:42px 1fr;gap:12px;align-items:start;padding:14px 15px;text-decoration:none;color:#fff;border-radius:15px;background:var(--feature-bg);border:1px solid rgba(255,255,255,.10);box-shadow:0 9px 20px rgba(31,51,66,.10);transition:transform .17s ease,box-shadow .17s ease}.hc-community-feature:hover{transform:translateY(-2px);box-shadow:0 13px 25px rgba(31,51,66,.14)}.hc-community-feature-icon{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:var(--icon-bg);color:#fff}.hc-community-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:13.5px;line-height:1.2;color:#fff}.hc-community-feature span span{display:block;margin-top:4px;font-size:11.7px;line-height:1.4;color:#E3EBEE}
      .hc-community-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:13px}.hc-community-action{display:inline-flex;align-items:center;gap:7px;border-radius:10px;padding:10px 13px;text-decoration:none;font-size:12px;font-weight:900}.hc-community-action.primary{background:#2F4E6F;color:#fff;box-shadow:0 8px 18px rgba(47,78,111,.17)}.hc-community-action.secondary{background:#ECE8E1;color:#4D5666;border:1px solid #CFC8BE}
      .hc-community-visual-label{position:absolute;z-index:3;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.92);border:1px solid #D3DADD;box-shadow:0 5px 13px rgba(19,50,68,.09);font-size:9.2px;font-weight:900;color:#17364D;white-space:nowrap}.hc-community-visual-label.peer{left:43%;top:12%;border-left:4px solid #4B6A86}.hc-community-visual-label.women{left:71%;top:18%;border-left:4px solid #8A6557}.hc-community-visual-label.heart{right:3%;top:43%;border-left:4px solid #9B6578}.hc-community-visual-label.wellbeing{right:4%;bottom:12%;border-left:4px solid #64806C}
      .hc-community-pulse{margin-top:18px;border-radius:20px;background:#EAF0ED;border:1px solid #B9CBC6;box-shadow:0 12px 26px rgba(28,50,64,.08);overflow:hidden}.hc-community-pulse-top{display:grid;grid-template-columns:minmax(230px,1.15fr) repeat(3,minmax(110px,.55fr)) auto;align-items:stretch}.hc-community-pulse-intro{padding:15px 17px;display:flex;align-items:center;gap:9px}.hc-community-pulse-intro h3{font-family:'Sora','DM Sans',sans-serif;font-size:16px;line-height:1.15;color:#17364D;margin:0}.hc-community-pulse-intro p{font-size:10.5px;line-height:1.35;color:#5A7180;margin:4px 0 0}.hc-community-pulse-metric{padding:14px 16px;border-left:1px solid #C6D4D0;display:flex;flex-direction:column;justify-content:center}.hc-community-pulse-metric strong{font-family:'Sora','DM Sans',sans-serif;font-size:20px;line-height:1;color:#17364D}.hc-community-pulse-metric span{font-size:10.5px;color:#586F7E;margin-top:4px}.hc-community-pulse-link{align-self:center;margin:0 14px;text-decoration:none;background:#244B61;color:#fff;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:900;white-space:nowrap;box-shadow:0 7px 16px rgba(36,75,97,.14)}.hc-community-pulse-list{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid #C6D4D0;background:#F5F3EE}.hc-community-pulse-card{position:relative;display:flex;align-items:center;gap:10px;padding:13px 15px;text-decoration:none;color:#17364D;border-right:1px solid #D7D7D1;transition:background .17s ease}.hc-community-pulse-card:last-child{border-right:0}.hc-community-pulse-card:before{content:'';position:absolute;left:0;top:11px;bottom:11px;width:3px;border-radius:3px;background:var(--community-accent)}.hc-community-pulse-card:hover{background:#fff}.hc-community-pulse-card i{font-style:normal;width:34px;height:34px;border-radius:10px;background:#fff;display:grid;place-items:center;font-size:16px;margin-left:3px;box-shadow:inset 0 0 0 1px rgba(23,54,77,.05)}.hc-community-pulse-card b{display:block;font-size:12px;color:#17364D}.hc-community-pulse-card small{display:block;margin-top:2px;color:#526B7A;font-size:10px}.hc-community-empty{font-size:10.8px;color:#526B7A;padding:13px 15px;background:#F5F3EE}
      @media(max-width:1050px){.hc-community-head{grid-template-columns:1fr;gap:8px}.hc-community-stage{min-height:0;padding-top:405px}.hc-community-visual{top:0;left:0;right:0;width:100%;height:405px}.hc-community-visual:before{left:0;right:0;top:auto;width:100%;height:30%;bottom:0;background:linear-gradient(180deg,transparent,#F3EEE7)}.hc-community-content{width:100%;padding:28px}.hc-community-pulse-top{grid-template-columns:1fr 1fr 1fr}.hc-community-pulse-intro{grid-column:1/-1}.hc-community-pulse-link{grid-column:1/-1;margin:12px 14px 14px;justify-self:start}.hc-community-pulse-metric:first-of-type{border-left:0}.hc-community-pulse-list{grid-template-columns:1fr 1fr}.hc-community-pulse-card:nth-child(2){border-right:0}.hc-community-pulse-card:nth-child(-n+2){border-bottom:1px solid #D7D7D1}}
      @media(max-width:650px){.hc-community-showcase{padding:36px 12px 40px}.hc-community-title{font-size:2rem}.hc-community-head p{font-size:14.5px}.hc-community-stage{padding-top:330px}.hc-community-visual{height:330px}.hc-community-content{padding:24px 19px}.hc-community-feature-grid{grid-template-columns:1fr}.hc-community-pulse-top{grid-template-columns:1fr}.hc-community-pulse-metric{border-left:0;border-top:1px solid #C6D4D0;flex-direction:row;align-items:center;justify-content:space-between}.hc-community-pulse-list{grid-template-columns:1fr}.hc-community-pulse-card{border-right:0;border-bottom:1px solid #D7D7D1}.hc-community-pulse-card:last-child{border-bottom:0}.hc-community-pulse-intro p{display:none}.hc-community-visual-label{font-size:8px}.hc-community-visual-label.peer{left:25%}.hc-community-visual-label.women{left:auto;right:4%;top:16%}.hc-community-visual-label.heart{top:48%}}
    `}</style>

    <div className="hc-community-shell">
      <div className="hc-community-head">
        <div><div className="hc-community-kicker">Health Communities</div><h2 className="hc-community-title" id="hc-community-title">Better support starts with <span>connection.</span></h2></div>
        <p>Find the right community, learn from lived experience and stay supported between visits without turning the section into another dashboard.</p>
      </div>

      <div className="hc-community-stage">
        <div className="hc-community-content">
          <h3>Find support that fits your journey.</h3>
          <p>Four clear ways to connect, learn and participate safely.</p>
          <div className="hc-community-rule"/>
          <div className="hc-community-feature-grid">
            {FEATURES.map(feature => <Link key={feature.title} href={feature.href} className="hc-community-feature" style={{ '--feature-bg': feature.bg, '--icon-bg': feature.iconBg } as CSSProperties}><span className="hc-community-feature-icon"><Icon kind={feature.icon} size={18}/></span><span><b>{feature.title}</b><span>{feature.copy}</span></span></Link>)}
          </div>
          <div className="hc-community-actions"><Link href="/communities" className="hc-community-action primary">Explore communities</Link><Link href="/learn" className="hc-community-action secondary">Knowledge Hub</Link></div>
        </div>

        <div className="hc-community-visual" aria-hidden="true">
          <img className="hc-community-photo" src={MAIN_IMAGE} alt="" onError={hideBrokenImage}/>
          <span className="hc-community-visual-label peer">Peer support</span><span className="hc-community-visual-label women">Women&apos;s health</span><span className="hc-community-visual-label heart">Heart health</span><span className="hc-community-visual-label wellbeing">Wellbeing</span>
        </div>
      </div>

      <div className="hc-community-pulse" aria-label="Community activity and popular communities">
        <div className="hc-community-pulse-top">
          <div className="hc-community-pulse-intro">
            <div><h3>Community pulse</h3><p>Live activity and popular spaces in one compact view.</p></div>
            <InfoPopover ariaLabel="About Health Communities statistics" title="About these numbers" width={220}>Community counts and activity come from the current HealthConnect community directory when available. They change as communities, memberships and posts change. Peer support does not replace professional medical advice.</InfoPopover>
          </div>
          <div className="hc-community-pulse-metric"><strong>{loading ? '—' : formatCount(communityTotal ?? communities.length)}</strong><span>Communities</span></div>
          <div className="hc-community-pulse-metric"><strong>{loading ? '—' : formatCount(totals.members)}</strong><span>Members</span></div>
          <div className="hc-community-pulse-metric"><strong>{loading ? '—' : formatCount(totals.posts)}</strong><span>Posts</span></div>
          <Link href="/communities" className="hc-community-pulse-link">View all communities</Link>
        </div>
        <div className="hc-community-pulse-list">
          {loading ? [1,2,3,4].map(i => <div className="hc-community-empty" key={i}>Loading community…</div>) : popular.length ? popular.map((community: any, index: number) => <Link key={community.id} href={`/communities/${community.slug || community.id}`} className="hc-community-pulse-card" style={{ '--community-accent': POPULAR_ACCENTS[index % POPULAR_ACCENTS.length] } as CSSProperties}><i>{community.emoji || '🌿'}</i><span><b>{community.name}</b><small>{Number(community.member_count ?? community.memberCount ?? 0).toLocaleString('en-IN')} members · {Number(community.post_count ?? community.postCount ?? 0).toLocaleString('en-IN')} posts</small></span></Link>) : <div className="hc-community-empty">Community directory temporarily unavailable.</div>}
        </div>
      </div>
    </div>
  </section>;
}
