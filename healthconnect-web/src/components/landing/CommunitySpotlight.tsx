'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import communityApiV2 from '@/lib/communityApiV2';

const emoji: Record<string,string> = { Diabetes:'🩸','Heart Health':'❤️','Mental Wellness':'🧠','PCOS/PCOD':'🌸','Cancer Support':'🎗️',Thyroid:'🦋',Arthritis:'🦴',Hypertension:'💊','Kidney Health':'🫘',Respiratory:'🫁','Nutrition & Diet':'🥗','Senior Care':'👴',General:'🌿' };

export default function CommunitySpotlight() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        let result: any = await communityApiV2.list({ featured: 'true', limit: 4 });
        let communities = Array.isArray(result?.communities) ? result.communities : [];
        if (communities.length < 3) {
          result = await communityApiV2.list({ limit: 4 });
          communities = Array.isArray(result?.communities) ? result.communities : [];
        }
        if (alive) setItems(communities.slice(0, 4));
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => { alive = false; };
  }, []);

  return (
    <section className="community-home">
      <style>{`
        .community-home{background:#07162A;padding:76px 28px;font-family:'DM Sans',Arial,sans-serif;color:#fff;position:relative;overflow:hidden}
        .community-home:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 0,rgba(52,211,153,.13),transparent 27%),radial-gradient(circle at 10% 90%,rgba(14,165,233,.08),transparent 24%);pointer-events:none}
        .community-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1}
        .community-head{display:grid;grid-template-columns:1fr .8fr;gap:50px;align-items:end;margin-bottom:32px}
        .community-kicker{font-size:11px;font-weight:850;letter-spacing:.17em;color:#6EE7B7;margin-bottom:11px}.community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3.3vw,3.7rem);line-height:1.05;letter-spacing:-.045em;margin:0;color:#F7FBFF}.community-copy{font-size:14px;line-height:1.75;color:#AFC3D9;margin:0 0 15px}.community-trust{display:flex;gap:7px;flex-wrap:wrap}.community-trust span{font-size:9px;font-weight:800;color:#C6F6E7;border:1px solid rgba(110,231,183,.18);background:rgba(16,185,129,.07);padding:5px 8px;border-radius:999px}
        .community-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}.community-card{background:rgba(255,255,255,.055);border:1px solid rgba(148,163,184,.16);border-radius:17px;padding:18px;min-height:210px;text-decoration:none;color:#fff;transition:.18s}.community-card:hover{transform:translateY(-3px);border-color:rgba(110,231,183,.38);background:rgba(255,255,255,.075)}.community-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:rgba(52,211,153,.12);font-size:20px;margin-bottom:14px}.community-card h3{font-family:'Sora',sans-serif;font-size:15px;line-height:1.3;margin:0 0 7px}.community-card p{font-size:11px;line-height:1.55;color:#9FB3C9;margin:0 0 16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.community-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:9px;color:#82A0BD}.community-meta b{color:#D7E5F2;font-weight:750}.community-empty{grid-column:1/-1;border:1px dashed rgba(148,163,184,.2);border-radius:16px;padding:24px;color:#AFC3D9;text-align:center}.community-bottom{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:24px;padding-top:20px;border-top:1px solid rgba(148,163,184,.12)}.community-bottom p{font-size:11px;color:#8EA6BF;margin:0;max-width:650px}.community-cta{display:inline-flex;text-decoration:none;color:#062017;background:#6EE7B7;border-radius:10px;padding:11px 17px;font-size:11px;font-weight:900;white-space:nowrap}
        @media(max-width:980px){.community-grid{grid-template-columns:1fr 1fr}.community-head{grid-template-columns:1fr}}
        @media(max-width:600px){.community-home{padding:58px 16px}.community-grid{grid-template-columns:1fr}.community-bottom{align-items:flex-start;flex-direction:column}}
      `}</style>
      <div className="community-inner">
        <div className="community-head">
          <div><div className="community-kicker">HEALTH COMMUNITIES</div><h2 className="community-title">Support can continue after the consultation ends.</h2></div>
          <div><p className="community-copy">Browse real HealthConnect communities, join conversations, attend Q&A events and use anonymous posting where the community allows it. Anonymous posts hide your identity from other community members while moderation and safety controls remain available.</p><div className="community-trust"><span>Approved membership rules</span><span>Anonymous posting controls</span><span>Reports & moderation</span><span>Events & RSVP</span></div></div>
        </div>

        <div className="community-grid">
          {loading ? [1,2,3,4].map(i => <div className="community-card" key={i} style={{ opacity:.45 }}><div className="community-icon">…</div><h3>Loading community</h3></div>) : items.length ? items.map(c => (
            <Link key={c.id} href={`/communities/${c.slug || c.id}`} className="community-card">
              <div className="community-icon">{c.emoji || emoji[c.category] || '🌿'}</div>
              <h3>{c.name}</h3>
              <p>{c.description || 'A HealthConnect health support community.'}</p>
              <div className="community-meta"><span><b>{Number(c.member_count || c.memberCount || 0).toLocaleString('en-IN')}</b> members</span><span><b>{Number(c.post_count || c.postCount || 0).toLocaleString('en-IN')}</b> posts</span></div>
            </Link>
          )) : <div className="community-empty">Communities are temporarily unavailable. The public directory remains the source of truth when service is restored.</div>}
        </div>
        <div className="community-bottom"><p>Community content supports peer conversation and education; it does not replace professional medical care.</p><Link href="/communities" className="community-cta">Explore Health Communities →</Link></div>
      </div>
    </section>
  );
}
