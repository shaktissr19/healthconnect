'use client';

import { useEffect, useMemo, useState, type CSSProperties, type SyntheticEvent } from 'react';
import Link from 'next/link';
import communityApiV2 from '@/lib/communityApiV2';
import { api } from '@/lib/api';
import InfoPopover from '@/components/landing/InfoPopover';

const HEADLINES=['Stronger together.','Support between visits.','Learn from shared journeys.','You are not alone.'] as const;
const FEATURES=[
  {title:'Find your community',copy:'Explore condition-focused spaces built around shared health journeys.',icon:'people',href:'/communities',accent:'#0F766E',wash:'#DDF3EE'},
  {title:'Share experiences',copy:'Ask questions and learn from relevant lived experience.',icon:'chat',href:'/communities',accent:'#2F5BEA',wash:'#E4EBFF'},
  {title:'Learn with context',copy:'Move from peer discussion into practical guides and educational resources.',icon:'bulb',href:'/learn',accent:'#7357D8',wash:'#EDE7FA'},
] as const;
const MAIN_IMAGE='/images/communities/health-communities-main.png';
const COMMUNITY_TINTS=['#FBE3E8','#E1ECFA','#EEE6FA','#E3F2E8'] as const;
const COMMUNITY_BORDERS=['#E7B8C4','#BCD0E9','#D2C0EB','#BFDAC8'] as const;
const COMMUNITY_ACCENTS=['#C23A63','#2F5BEA','#7357D8','#24714B'] as const;

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
          const result:any=directory.value||{};
          const items=Array.isArray(result?.communities)?result.communities:Array.isArray(result)?result:[];
          setCommunities(items);
          const directoryTotal=Number(result?.total??result?.pagination?.total??result?.meta?.total);
          if(Number.isFinite(directoryTotal))setCommunityTotal(directoryTotal);
        }
        if(statsResponse.status==='fulfilled'){
          const raw:any=statsResponse.value?.data?.data??statsResponse.value?.data??{};
          const total=Number(raw?.communities);if(Number.isFinite(total))setCommunityTotal(total);
        }
      }finally{if(alive)setLoading(false)}
    };
    void load();return()=>{alive=false};
  },[]);

  const totals=useMemo(()=>communities.reduce((acc,c)=>({members:acc.members+Number(c?.member_count??c?.memberCount??0),posts:acc.posts+Number(c?.post_count??c?.postCount??0)}),{members:0,posts:0}),[communities]);
  const popular=useMemo(()=>communities.slice(0,4),[communities]);
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="hc-community-showcase" id="health-communities-story" aria-labelledby="hc-community-title">
    <style>{`
      .hc-community-showcase{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#F7F1EA;padding:44px 22px 48px;scroll-margin-top:76px;border-top:1px solid #E6DDD2}.hc-community-shell{width:min(100%,1380px);margin:0 auto}.hc-community-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.55fr);gap:44px;align-items:end;margin:0 6px 20px}.hc-community-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#C45A31;margin-bottom:7px}.hc-community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.95rem);line-height:1.03;letter-spacing:-.05em;color:#102E45;margin:0}.hc-community-title span{display:block;color:#7357D8;margin-top:3px;min-height:1.04em}.hc-headline-animate{animation:hcHeadline .35s ease both}@keyframes hcHeadline{from{opacity:.18;transform:translateY(4px)}to{opacity:1;transform:none}}.hc-community-head p{font-size:15.5px;line-height:1.52;color:#53677A;margin:0 0 4px;max-width:510px}
      .hc-community-stage{position:relative;min-height:420px;border:1px solid #D8D2CC;border-radius:26px;overflow:hidden;background:linear-gradient(110deg,#FFFDFC 0%,#FFFDFC 48%,#F2EDEA 62%,#E6EEF3 100%);box-shadow:0 16px 36px rgba(42,55,68,.08)}.hc-community-visual{position:absolute;z-index:0;right:0;top:0;width:55%;height:100%;overflow:hidden;background:#E8EEF1}.hc-community-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 50%;display:block}.hc-community-visual:before{content:'';position:absolute;z-index:2;left:-1px;top:0;bottom:0;width:28%;background:linear-gradient(90deg,#FFFDFC 0%,rgba(255,253,252,.80) 35%,rgba(255,253,252,.25) 75%,transparent 100%);pointer-events:none}.hc-community-content{position:relative;z-index:3;width:56%;padding:32px 34px 28px 38px;box-sizing:border-box}.hc-community-content h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.7rem,2vw,2.15rem);letter-spacing:-.04em;line-height:1.08;margin:0 0 7px;color:#17354A}.hc-community-content>p{font-size:13.5px;line-height:1.46;color:#596E7E;margin:0 0 12px;max-width:520px}.hc-community-rule{width:42px;height:3px;border-radius:999px;background:#C45A31;margin-bottom:10px}.hc-community-feature-list{display:grid;gap:7px}.hc-community-feature{display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:center;padding:9px 10px;text-decoration:none;color:#17354A;border-radius:11px;background:var(--feature-wash);border:1px solid rgba(37,56,72,.08)}.hc-community-feature-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.75);color:var(--feature-accent)}.hc-community-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:12.2px;line-height:1.2}.hc-community-feature span span{display:block;margin-top:2px;font-size:10.8px;line-height:1.34;color:#607584}.hc-community-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:13px}.hc-community-action{display:inline-flex;align-items:center;gap:7px;border-radius:10px;padding:10px 13px;text-decoration:none;font-size:11.7px;font-weight:900}.hc-community-action.primary{background:#2F5BEA;color:#fff;box-shadow:0 8px 18px rgba(47,91,234,.18)}.hc-community-action.secondary{background:#EDE7FA;color:#6246C5;border:1px solid #D4C9EC}.hc-community-safety{display:inline-flex;align-items:center;gap:6px;color:#617584;font-size:10.6px;font-weight:800}.hc-community-safety i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#E2F2E9;color:#24714B;font-style:normal}
      .hc-community-visual-label{position:absolute;z-index:3;padding:5px 8px;border-radius:999px;background:#fff;border:1px solid #D7DEE5;box-shadow:0 5px 14px rgba(19,50,68,.10);font-size:8.7px;font-weight:900;color:#17354A;white-space:nowrap}.hc-community-visual-label.peer{left:45%;top:12%;border-left:4px solid #2F5BEA}.hc-community-visual-label.women{left:73%;top:18%;border-left:4px solid #D06B2F}.hc-community-visual-label.heart{right:3%;top:43%;border-left:4px solid #C23A63}.hc-community-visual-label.wellbeing{right:4%;bottom:12%;border-left:4px solid #24714B}
      .hc-community-statsbar{display:grid;grid-template-columns:auto repeat(3,1fr) auto;align-items:center;margin-top:14px;border:1px solid #BDCEE1;border-radius:14px;background:#DDE8F5;overflow:visible;position:relative;z-index:20;box-shadow:0 7px 18px rgba(32,65,96,.05)}.hc-community-statslabel{padding:12px 15px;font-size:10.2px;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#365A76;display:flex;align-items:center;gap:7px}.hc-community-stat{padding:11px 15px;border-left:1px solid #C5D4E3}.hc-community-stat strong{font-family:'Sora','DM Sans',sans-serif;font-size:17px;color:#102E45}.hc-community-stat span{display:block;margin-top:2px;font-size:9.7px;color:#62798D}.hc-community-view{padding:10px 14px;border-left:1px solid #C5D4E3;color:#2F5BEA;font-size:10.8px;font-weight:900;text-decoration:none;white-space:nowrap}
      .hc-community-popular{margin-top:14px;border-radius:18px;background:#26394D;border:1px solid #26394D;padding:16px 17px 18px;box-shadow:0 12px 26px rgba(24,43,60,.10)}.hc-community-popular-head{display:flex;justify-content:space-between;align-items:center;gap:14px}.hc-community-popular-head h3{font-family:'Sora','DM Sans',sans-serif;font-size:17px;color:#fff;margin:0}.hc-community-popular-head a{font-size:11px;font-weight:900;color:#17354A;text-decoration:none;background:#F8FAFC;border-radius:8px;padding:7px 10px}.hc-community-popular-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:11px}.hc-community-popular-card{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;text-decoration:none;color:#17354A;border:1px solid var(--community-border);background:var(--community-tint);transition:transform .17s ease,box-shadow .17s ease}.hc-community-popular-card:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(8,24,38,.14)}.hc-community-popular-card i{font-style:normal;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.70);display:grid;place-items:center;font-size:16px}.hc-community-popular-card b{display:block;font-size:11.3px;color:var(--community-accent)}.hc-community-popular-card small{display:block;margin-top:2px;color:#536B7B;font-size:9.5px}.hc-community-empty{font-size:10.8px;color:#D7E2EC;padding:10px;border:1px dashed #6D8093;border-radius:10px;background:#31465A}
      @media(max-width:1050px){.hc-community-head{grid-template-columns:1fr;gap:8px}.hc-community-stage{min-height:0;padding-top:405px}.hc-community-visual{top:0;left:0;right:0;width:100%;height:405px}.hc-community-visual:before{left:0;right:0;top:auto;width:100%;height:30%;bottom:0;background:linear-gradient(180deg,transparent,#FFFDFC)}.hc-community-content{width:100%;padding:28px}.hc-community-popular-grid{grid-template-columns:1fr 1fr}.hc-community-statsbar{grid-template-columns:1fr 1fr}.hc-community-statslabel,.hc-community-view{grid-column:1/-1}.hc-community-view{border-left:0;border-top:1px solid #C5D4E3}.hc-community-stat:nth-of-type(2){border-left:0}}
      @media(max-width:650px){.hc-community-showcase{padding:36px 12px 40px}.hc-community-title{font-size:2.15rem}.hc-community-head p{font-size:14.5px}.hc-community-stage{padding-top:330px}.hc-community-visual{height:330px}.hc-community-content{padding:24px 19px}.hc-community-popular-grid{grid-template-columns:1fr}.hc-community-actions{display:grid;grid-template-columns:1fr 1fr}.hc-community-action{justify-content:center}.hc-community-safety{grid-column:1/-1;justify-content:center}.hc-community-visual-label{font-size:7.8px;padding:4px 6px}}
    `}</style>

    <div className="hc-community-shell">
      <div className="hc-community-head"><div><div className="hc-community-kicker">Health Communities</div><h2 className="hc-community-title" id="hc-community-title">Support that continues.<span key={headlineIndex} className="hc-headline-animate">{HEADLINES[headlineIndex]}</span></h2></div><p>Find condition-focused spaces, learn from relevant lived experience and stay connected between appointments.</p></div>

      <div className="hc-community-stage">
        <div className="hc-community-visual" aria-hidden="true"><img className="hc-community-photo" src={MAIN_IMAGE} alt="" onError={hideBrokenImage}/><span className="hc-community-visual-label peer">Peer support</span><span className="hc-community-visual-label women">Women&apos;s health</span><span className="hc-community-visual-label heart">Heart health</span><span className="hc-community-visual-label wellbeing">Wellbeing</span></div>
        <div className="hc-community-content"><h3>Find support that fits your journey.</h3><p>Three clear ways to move from discovery into useful community support.</p><div className="hc-community-rule"/><div className="hc-community-feature-list">{FEATURES.map(feature=><Link key={feature.title} href={feature.href} className="hc-community-feature" style={{'--feature-wash':feature.wash,'--feature-accent':feature.accent} as CSSProperties}><span className="hc-community-feature-icon"><Icon kind={feature.icon} size={17}/></span><span><b>{feature.title}</b><span>{feature.copy}</span></span></Link>)}</div><div className="hc-community-actions"><Link href="/communities" className="hc-community-action primary"><Icon kind="people" size={15}/>Explore communities</Link><Link href="/learn" className="hc-community-action secondary"><Icon kind="book" size={15}/>Guides & resources</Link><span className="hc-community-safety"><i><Icon kind="shield" size={14}/></i>Moderated participation</span></div></div>
      </div>

      <div className="hc-community-statsbar"><div className="hc-community-statslabel">Live activity <InfoPopover ariaLabel="About Health Communities statistics" title="About these numbers" width={240}>Community counts and activity come from the current HealthConnect community directory when available. They change as communities, memberships and posts change. Peer support does not replace professional medical advice.</InfoPopover></div><div className="hc-community-stat"><strong>{loading?'—':formatCount(communityTotal??communities.length)}</strong><span>Communities</span></div><div className="hc-community-stat"><strong>{loading?'—':formatCount(totals.members)}</strong><span>Members</span></div><div className="hc-community-stat"><strong>{loading?'—':formatCount(totals.posts)}</strong><span>Posts</span></div><Link href="/communities" className="hc-community-view">View directory</Link></div>

      <div className="hc-community-popular"><div className="hc-community-popular-head"><h3>Popular Health Communities</h3><Link href="/communities">View all</Link></div><div className="hc-community-popular-grid">{loading?[1,2,3,4].map(i=><div className="hc-community-empty" key={i}>Loading community…</div>):popular.length?popular.map((community:any,index:number)=><Link key={community.id} href={`/communities/${community.slug||community.id}`} className="hc-community-popular-card" style={{'--community-tint':COMMUNITY_TINTS[index%COMMUNITY_TINTS.length],'--community-border':COMMUNITY_BORDERS[index%COMMUNITY_BORDERS.length],'--community-accent':COMMUNITY_ACCENTS[index%COMMUNITY_ACCENTS.length]} as CSSProperties}><i>{community.emoji||'🌿'}</i><span><b>{community.name}</b><small>{Number(community.member_count??community.memberCount??0).toLocaleString('en-IN')} members · {Number(community.post_count??community.postCount??0).toLocaleString('en-IN')} posts</small></span></Link>):<div className="hc-community-empty">Community directory temporarily unavailable.</div>}</div></div>
    </div>
  </section>;
}
