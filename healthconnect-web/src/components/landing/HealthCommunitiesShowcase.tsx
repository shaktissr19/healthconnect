'use client';

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import communityApiV2 from '@/lib/communityApiV2';
import { api } from '@/lib/api';
import InfoPopover from '@/components/landing/InfoPopover';

const HEADLINES=['Stronger together.','Support between visits.','Learn from shared journeys.','You are not alone.'] as const;
const PRIMARY_FEATURES=[
  {title:'Find your community',copy:'Explore condition-focused spaces built around shared health journeys.',icon:'people',href:'/communities',accent:'#087D72'},
  {title:'Share experiences',copy:'Ask questions and learn from people with relevant lived experience.',icon:'chat',href:'/communities',accent:'#2459C4'},
  {title:'Learn with context',copy:'Move from peer discussion into practical guides and educational resources.',icon:'bulb',href:'/learn',accent:'#6D45C6'},
] as const;
const MAIN_IMAGE='/images/communities/health-communities-main.png';

function Icon({kind,size=20}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='people') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='chat') return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/></svg>;
  if(kind==='bulb') return <svg {...common}><path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5C14.6 15.2 14 16.2 14 17h-4c0-.8-.6-1.8-1.5-2.5Z"/></svg>;
  if(kind==='book') return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if(kind==='shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

function formatCount(value:number|null|undefined){
  if(!Number.isFinite(Number(value))||Number(value)<0)return '—';
  const n=Number(value);if(n>=1000000)return `${(n/1000000).toFixed(n>=10000000?0:1)}M`;if(n>=1000)return `${(n/1000).toFixed(n>=10000?0:1)}K`;return n.toLocaleString('en-IN');
}

export default function HealthCommunitiesShowcase(){
  const [headlineIndex,setHeadlineIndex]=useState(0);
  const [communities,setCommunities]=useState<any[]>([]);
  const [communityTotal,setCommunityTotal]=useState<number|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setHeadlineIndex(i=>(i+1)%HEADLINES.length),4600);return()=>window.clearInterval(timer);
  },[]);

  useEffect(()=>{
    let alive=true;
    const load=async()=>{
      try{
        const [directory,statsResponse]=await Promise.allSettled([communityApiV2.list({limit:50}),api.get('/public/stats')]);
        if(!alive)return;
        if(directory.status==='fulfilled'){
          const result:any=directory.value||{};const items=Array.isArray(result?.communities)?result.communities:Array.isArray(result)?result:[];setCommunities(items);
          const directoryTotal=Number(result?.total??result?.pagination?.total??result?.meta?.total);if(Number.isFinite(directoryTotal))setCommunityTotal(directoryTotal);
        }
        if(statsResponse.status==='fulfilled'){
          const raw:any=statsResponse.value?.data?.data??statsResponse.value?.data??{};const total=Number(raw?.communities);if(Number.isFinite(total))setCommunityTotal(total);
        }
      }finally{if(alive)setLoading(false)}
    };
    void load();return()=>{alive=false};
  },[]);

  const totals=useMemo(()=>communities.reduce((acc,c)=>({members:acc.members+Number(c?.member_count??c?.memberCount??0),posts:acc.posts+Number(c?.post_count??c?.postCount??0),featured:acc.featured+(c?.featured||c?.isFeatured?1:0)}),{members:0,posts:0,featured:0}),[communities]);
  const popular=useMemo(()=>communities.slice(0,4),[communities]);
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="hc-community-showcase" id="health-communities-story" aria-labelledby="hc-community-title">
    <style>{`
      .hc-community-showcase{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#F3F5F7;padding:30px 22px 34px;scroll-margin-top:76px}.hc-community-shell{width:min(100%,1380px);margin:0 auto}
      .hc-community-canvas{display:grid;grid-template-columns:minmax(0,.93fr) minmax(0,1.07fr);min-height:430px;border:1px solid #D2DBE3;border-radius:24px;overflow:hidden;background:#fff;box-shadow:0 14px 34px rgba(31,57,72,.07)}
      .hc-community-left{padding:32px 30px 28px 34px;box-sizing:border-box;background:linear-gradient(135deg,#FFFFFF 0%,#F7F9FB 100%)}.hc-community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.6vw,2.8rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.hc-community-title span{display:block;color:#137B73;margin-top:3px;min-height:1.04em}.hc-headline-animate{animation:hcHeadline .35s ease both}@keyframes hcHeadline{from{opacity:.18;transform:translateY(4px)}to{opacity:1;transform:none}}.hc-community-intro{font-size:14.5px;line-height:1.5;color:#405B6D;max-width:610px;margin:10px 0 14px}.hc-community-rule{width:42px;height:3px;border-radius:999px;background:#137B73;margin-bottom:14px}
      .hc-community-primary{display:grid;gap:7px}.hc-community-primary-link{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:10px;padding:10px 11px;border-radius:12px;text-decoration:none;color:#15364A;border:1px solid #D9E1E7;background:#fff;transition:transform .17s ease,border-color .17s ease,box-shadow .17s ease}.hc-community-primary-link:hover{transform:translateX(2px);border-color:#B9C8D3;box-shadow:0 7px 16px rgba(31,75,78,.06)}.hc-community-primary-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#F0F4F7}.hc-community-primary-link b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:13.5px;line-height:1.2}.hc-community-primary-link span span{display:block;margin-top:2px;font-size:12px;line-height:1.35;color:#556D7D}.hc-community-primary-arrow{font-size:16px;font-weight:900;color:#8093A0}
      .hc-community-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}.hc-community-action{display:inline-flex;align-items:center;gap:7px;border-radius:9px;padding:9px 11px;text-decoration:none;font-size:11.5px;font-weight:900}.hc-community-action.primary{background:#137B73;color:#fff}.hc-community-action.secondary{background:#EEF3F8;color:#2459C4;border:1px solid #D5E0EA}.hc-community-safety{display:inline-flex;align-items:center;gap:6px;color:#526B7B;font-size:11px;font-weight:800}.hc-community-safety i{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#EEF2F4;color:#167044;font-style:normal}
      .hc-community-metrics{margin-top:14px;border-top:1px solid #DCE3E8;padding-top:12px}.hc-community-metrics-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.hc-community-metrics-head span{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#526879}.hc-community-metrics-head a{font-size:10.8px;font-weight:900;color:#137B73;text-decoration:none}.hc-community-metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.hc-community-metric{min-width:0;padding:8px 9px;border-radius:10px;background:#F3F6F8;border:1px solid #E2E7EB}.hc-community-metric strong{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:17px;line-height:1;color:#17354A}.hc-community-metric span{display:block;margin-top:3px;font-size:9.8px;color:#667D8B}
      .hc-community-photo-wrap{position:relative;min-height:430px;overflow:hidden;background:#E7ECEF}.hc-community-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 50%;display:block}.hc-community-photo-wrap:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.14),transparent 20%),linear-gradient(180deg,transparent 72%,rgba(15,39,52,.16) 100%);pointer-events:none}

      .hc-community-popular{margin-top:14px;border-radius:18px;background:#F8FAFC;border:1px solid #D7E0E7;padding:15px 17px 17px;box-shadow:0 8px 20px rgba(23,53,74,.05)}.hc-community-popular-head{display:flex;justify-content:space-between;align-items:center;gap:14px}.hc-community-popular-head h3{font-family:'Sora','DM Sans',sans-serif;font-size:17px;color:#17354A;margin:0}.hc-community-popular-head a{font-size:11.5px;font-weight:900;color:#137B73;text-decoration:none}.hc-community-popular-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.hc-community-popular-card{display:flex;align-items:center;gap:9px;padding:10px 11px;border-radius:12px;text-decoration:none;color:#17354A;border:1px solid #DDE5EB;background:#fff;transition:border-color .17s ease,transform .17s ease,box-shadow .17s ease}.hc-community-popular-card:hover{border-color:#B9CAD6;transform:translateY(-1px);box-shadow:0 7px 16px rgba(20,50,70,.06)}.hc-community-popular-card i{font-style:normal;width:32px;height:32px;border-radius:10px;background:#EEF2F5;display:grid;place-items:center;font-size:16px}.hc-community-popular-card b{display:block;font-size:11.2px}.hc-community-popular-card small{display:block;margin-top:2px;color:#6B7F8D;font-size:9.7px}.hc-community-empty{font-size:11px;color:#708390;padding:10px;border:1px dashed #CBD6DE;border-radius:10px;background:#fff}

      @media(max-width:1100px){.hc-community-canvas{grid-template-columns:1fr}.hc-community-photo-wrap{min-height:410px;order:1}.hc-community-left{order:2;padding:27px}.hc-community-popular-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:720px){.hc-community-showcase{padding:24px 12px 28px}.hc-community-title{font-size:2.05rem}.hc-community-intro{font-size:14px}.hc-community-photo-wrap{min-height:340px}.hc-community-metrics-grid{grid-template-columns:1fr 1fr}.hc-community-popular-grid{grid-template-columns:1fr}}
      @media(max-width:480px){.hc-community-left{padding:22px 18px}.hc-community-photo-wrap{min-height:310px}.hc-community-actions{display:grid;grid-template-columns:1fr}.hc-community-action{justify-content:center}.hc-community-safety{justify-content:center}}
    `}</style>

    <div className="hc-community-shell">
      <div className="hc-community-canvas">
        <div className="hc-community-left">
          <h2 className="hc-community-title" id="hc-community-title">Health Communities.<span key={headlineIndex} className="hc-headline-animate">{HEADLINES[headlineIndex]}</span></h2>
          <p className="hc-community-intro">Condition-focused spaces for practical peer support, lived experience and learning between visits.</p>
          <div className="hc-community-rule"/>
          <div className="hc-community-primary">{PRIMARY_FEATURES.map(item=><Link key={item.title} href={item.href} className="hc-community-primary-link"><span className="hc-community-primary-icon" style={{color:item.accent}}><Icon kind={item.icon}/></span><span><b>{item.title}</b><span>{item.copy}</span></span><span className="hc-community-primary-arrow">→</span></Link>)}</div>
          <div className="hc-community-actions">
            <Link href="/communities" className="hc-community-action primary"><Icon kind="people" size={15}/>Explore communities</Link>
            <Link href="/learn" className="hc-community-action secondary"><Icon kind="book" size={15}/>Guides & resources</Link>
            <span className="hc-community-safety"><i><Icon kind="shield" size={14}/></i>Moderated participation</span>
          </div>
          <div className="hc-community-metrics" aria-label="Live Health Communities summary">
            <div className="hc-community-metrics-head"><span>Live community activity <InfoPopover ariaLabel="About Health Communities statistics" title="About these numbers" width={210}>Community counts and activity come from the current HealthConnect community directory when available. They change as communities, memberships and posts change. Peer support does not replace professional medical advice.</InfoPopover></span><Link href="/communities">View directory →</Link></div>
            <div className="hc-community-metrics-grid">
              <div className="hc-community-metric"><strong>{loading?'—':formatCount(communityTotal??communities.length)}</strong><span>Communities</span></div>
              <div className="hc-community-metric"><strong>{loading?'—':formatCount(totals.members)}</strong><span>Members</span></div>
              <div className="hc-community-metric"><strong>{loading?'—':formatCount(totals.posts)}</strong><span>Posts</span></div>
              <div className="hc-community-metric"><strong>{loading?'—':formatCount(totals.featured)}</strong><span>Featured</span></div>
            </div>
          </div>
        </div>

        <div className="hc-community-photo-wrap" aria-hidden="true"><img className="hc-community-photo" src={MAIN_IMAGE} alt="" onError={hideBrokenImage}/></div>
      </div>

      <div className="hc-community-popular">
        <div className="hc-community-popular-head"><h3>Popular Health Communities</h3><Link href="/communities">View all →</Link></div>
        <div className="hc-community-popular-grid">
          {loading?[1,2,3,4].map(i=><div className="hc-community-empty" key={i}>Loading community…</div>):popular.length?popular.map((community:any)=><Link key={community.id} href={`/communities/${community.slug||community.id}`} className="hc-community-popular-card"><i>{community.emoji||'🌿'}</i><span><b>{community.name}</b><small>{Number(community.member_count??community.memberCount??0).toLocaleString('en-IN')} members · {Number(community.post_count??community.postCount??0).toLocaleString('en-IN')} posts</small></span></Link>):<div className="hc-community-empty">Community directory temporarily unavailable.</div>}
        </div>
      </div>
    </div>
  </section>;
}
