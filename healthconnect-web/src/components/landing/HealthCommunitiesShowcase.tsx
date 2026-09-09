'use client';

import { useEffect, useMemo, useState, type CSSProperties, type SyntheticEvent } from 'react';
import Link from 'next/link';
import communityApiV2 from '@/lib/communityApiV2';
import { api } from '@/lib/api';
import InfoPopover from '@/components/landing/InfoPopover';

const HEADLINES=['Stronger together.','Support between visits.','Learn from shared journeys.','You are not alone.'] as const;
const FEATURES=[
  {title:'Find your community',copy:'Explore condition-focused spaces built around shared health journeys.',icon:'people',href:'/communities',accent:'#0F766E'},
  {title:'Share experiences',copy:'Ask questions and learn from relevant lived experience.',icon:'chat',href:'/communities',accent:'#2459C4'},
  {title:'Learn with context',copy:'Move from peer discussion into practical guides and educational resources.',icon:'bulb',href:'/learn',accent:'#6D45C6'},
] as const;
const MAIN_IMAGE='/images/communities/health-communities-main.png';
const COMMUNITY_TINTS=['#F2E8EC','#E8EFF7','#EEE8F6','#E7F0EB'] as const;
const COMMUNITY_BORDERS=['#DFC9D1','#C9D8E7','#D7CCE7','#CADDCF'] as const;

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

  const totals=useMemo(()=>communities.reduce((acc,c)=>({members:acc.members+Number(c?.member_count??c?.memberCount??0),posts:acc.posts+Number(c?.post_count??c?.postCount??0)}),{members:0,posts:0}),[communities]);
  const popular=useMemo(()=>communities.slice(0,4),[communities]);
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="hc-community-showcase" id="health-communities-story" aria-labelledby="hc-community-title">
    <style>{`
      .hc-community-showcase{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#F2F4F6;padding:42px 22px 46px;scroll-margin-top:76px;border-top:1px solid #E0E5E9}.hc-community-shell{width:min(100%,1380px);margin:0 auto}.hc-community-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.55fr);gap:42px;align-items:end;margin:0 6px 18px}.hc-community-kicker{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0F766E;margin-bottom:6px}.hc-community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.65vw,2.85rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.hc-community-title span{display:block;color:#0F766E;margin-top:3px;min-height:1.04em}.hc-headline-animate{animation:hcHeadline .35s ease both}@keyframes hcHeadline{from{opacity:.18;transform:translateY(4px)}to{opacity:1;transform:none}}.hc-community-head p{font-size:15px;line-height:1.5;color:#4E6878;margin:0 0 3px;max-width:510px}
      .hc-community-stage{position:relative;min-height:400px;border:1px solid #D3DCE3;border-radius:23px;overflow:hidden;background:#EEF1F3;box-shadow:0 12px 28px rgba(24,52,69,.06)}.hc-community-visual{position:absolute;z-index:0;right:12px;top:12px;width:64%;height:calc(100% - 24px);overflow:hidden;border-radius:18px;background:#E7ECEF}.hc-community-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 50%;display:block}.hc-community-stage:after{content:'';position:absolute;z-index:1;inset:0;background:linear-gradient(90deg,#FAFAFA 0%,#FAFAFA 40%,rgba(250,250,250,.97) 48%,rgba(250,250,250,.82) 57%,rgba(250,250,250,.28) 70%,transparent 80%);pointer-events:none}.hc-community-content{position:relative;z-index:2;width:55%;padding:30px 30px 26px 34px;box-sizing:border-box}.hc-community-content h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.55rem,1.9vw,2rem);letter-spacing:-.04em;line-height:1.08;margin:0 0 7px;color:#17354A}.hc-community-content>p{font-size:13.5px;line-height:1.47;color:#536B7A;margin:0 0 11px;max-width:520px}.hc-community-rule{width:40px;height:3px;border-radius:999px;background:#0F766E;margin-bottom:6px}.hc-community-feature-list{display:grid}.hc-community-feature{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:center;padding:8px 0;text-decoration:none;color:#17354A;border-bottom:1px solid #E2E7EA}.hc-community-feature:last-child{border-bottom:0}.hc-community-feature-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:#EEF2F4}.hc-community-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:12.2px;line-height:1.2}.hc-community-feature span span{display:block;margin-top:2px;font-size:10.8px;line-height:1.34;color:#607584}.hc-community-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:13px}.hc-community-action{display:inline-flex;align-items:center;gap:7px;border-radius:9px;padding:9px 12px;text-decoration:none;font-size:11.5px;font-weight:900}.hc-community-action.primary{background:#17384A;color:#fff}.hc-community-action.secondary{background:#E8EEF4;color:#2459C4;border:1px solid #C9D6E2}.hc-community-safety{display:inline-flex;align-items:center;gap:6px;color:#607584;font-size:10.5px;font-weight:800}.hc-community-safety i{width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#E8EFEC;color:#167044;font-style:normal}
      .hc-community-visual-label{position:absolute;z-index:2;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.88);border:1px solid rgba(208,220,226,.9);box-shadow:0 4px 12px rgba(19,50,68,.08);font-size:8.5px;font-weight:900;color:#17354A;white-space:nowrap;backdrop-filter:blur(5px)}.hc-community-visual-label.peer{left:47%;top:12%}.hc-community-visual-label.women{left:76%;top:18%}.hc-community-visual-label.heart{right:3%;top:43%}.hc-community-visual-label.wellbeing{right:4%;bottom:12%}
      .hc-community-statsbar{display:grid;grid-template-columns:auto repeat(3,1fr) auto;gap:0;align-items:center;margin-top:12px;border:1px solid #D4DDE3;border-radius:13px;background:#E2E7EB;overflow:visible;position:relative;z-index:10}.hc-community-statslabel{padding:11px 14px;font-size:10px;font-weight:900;letter-spacing:.10em;text-transform:uppercase;color:#5E7382;display:flex;align-items:center;gap:6px}.hc-community-stat{padding:10px 14px;border-left:1px solid #CFD8DE}.hc-community-stat strong{font-family:'Sora','DM Sans',sans-serif;font-size:16px;color:#17354A}.hc-community-stat span{display:block;margin-top:2px;font-size:9.5px;color:#708390}.hc-community-view{padding:10px 14px;border-left:1px solid #CFD8DE;color:#2459C4;font-size:10.5px;font-weight:900;text-decoration:none;white-space:nowrap}
      .hc-community-popular{margin-top:12px;border-radius:16px;background:#E3E8ED;border:1px solid #CED8E0;padding:14px 16px 16px}.hc-community-popular-head{display:flex;justify-content:space-between;align-items:center;gap:14px}.hc-community-popular-head h3{font-family:'Sora','DM Sans',sans-serif;font-size:16px;color:#17354A;margin:0}.hc-community-popular-head a{font-size:11px;font-weight:900;color:#2459C4;text-decoration:none}.hc-community-popular-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:9px}.hc-community-popular-card{display:flex;align-items:center;gap:9px;padding:10px 11px;border-radius:11px;text-decoration:none;color:#17354A;border:1px solid var(--community-border);background:var(--community-tint);transition:border-color .17s ease,transform .17s ease,box-shadow .17s ease}.hc-community-popular-card:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(20,50,70,.06)}.hc-community-popular-card i{font-style:normal;width:31px;height:31px;border-radius:9px;background:rgba(255,255,255,.58);display:grid;place-items:center;font-size:15px}.hc-community-popular-card b{display:block;font-size:11px}.hc-community-popular-card small{display:block;margin-top:2px;color:#617584;font-size:9.4px}.hc-community-empty{font-size:10.8px;color:#708390;padding:10px;border:1px dashed #BAC8D2;border-radius:10px;background:#EEF2F5}
      @media(max-width:1050px){.hc-community-head{grid-template-columns:1fr;gap:8px}.hc-community-stage{min-height:0;padding-top:405px}.hc-community-visual{top:12px;left:12px;right:12px;width:calc(100% - 24px);height:375px}.hc-community-stage:after{background:linear-gradient(180deg,transparent 0%,rgba(250,250,250,.18) 40%,#FAFAFA 57%,#FAFAFA 100%)}.hc-community-content{width:100%;padding:26px}.hc-community-popular-grid{grid-template-columns:1fr 1fr}.hc-community-statsbar{grid-template-columns:1fr 1fr}.hc-community-statslabel,.hc-community-view{grid-column:1/-1}.hc-community-view{border-left:0;border-top:1px solid #CFD8DE}.hc-community-stat:nth-of-type(2){border-left:0}}
      @media(max-width:650px){.hc-community-showcase{padding:34px 12px 38px}.hc-community-title{font-size:2.05rem}.hc-community-head p{font-size:14px}.hc-community-stage{padding-top:335px}.hc-community-visual{height:305px}.hc-community-content{padding:22px 18px}.hc-community-popular-grid{grid-template-columns:1fr}.hc-community-actions{display:grid;grid-template-columns:1fr}.hc-community-action{justify-content:center}.hc-community-safety{justify-content:center}.hc-community-visual-label{font-size:7.8px;padding:3px 6px}}
    `}</style>

    <div className="hc-community-shell">
      <div className="hc-community-head"><div><div className="hc-community-kicker">Health Communities</div><h2 className="hc-community-title" id="hc-community-title">Support that continues.<span key={headlineIndex} className="hc-headline-animate">{HEADLINES[headlineIndex]}</span></h2></div><p>Find condition-focused spaces, learn from relevant lived experience and stay connected between appointments.</p></div>

      <div className="hc-community-stage">
        <div className="hc-community-visual" aria-label="Health community members learning and supporting one another online"><img className="hc-community-photo" src={MAIN_IMAGE} alt="Indian HealthConnect community members using a phone together" onError={hideBrokenImage}/><span className="hc-community-visual-label peer">Peer support</span><span className="hc-community-visual-label women">Women&apos;s health</span><span className="hc-community-visual-label heart">Heart health</span><span className="hc-community-visual-label wellbeing">Wellbeing</span></div>
        <div className="hc-community-content"><h3>Community support, without the clutter.</h3><p>Start with the journey that matters to you, then move into the full directory when you want more.</p><div className="hc-community-rule"/>
          <div className="hc-community-feature-list">{FEATURES.map(item=><Link key={item.title} href={item.href} className="hc-community-feature"><span className="hc-community-feature-icon" style={{color:item.accent}}><Icon kind={item.icon}/></span><span><b>{item.title}</b><span>{item.copy}</span></span></Link>)}</div>
          <div className="hc-community-actions"><Link href="/communities" className="hc-community-action primary"><Icon kind="people" size={15}/>Explore communities</Link><Link href="/learn" className="hc-community-action secondary"><Icon kind="book" size={15}/>Guides & resources</Link><span className="hc-community-safety"><i><Icon kind="shield" size={13}/></i>Moderated participation</span></div>
        </div>
      </div>

      <div className="hc-community-statsbar" aria-label="Live Health Communities summary"><div className="hc-community-statslabel">Live activity <InfoPopover ariaLabel="About Health Communities statistics" title="About these numbers" width={230}>Community counts and activity come from the current HealthConnect community directory when available. They change as communities, memberships and posts change. Peer support does not replace professional medical advice.</InfoPopover></div><div className="hc-community-stat"><strong>{loading?'—':formatCount(communityTotal??communities.length)}</strong><span>Communities</span></div><div className="hc-community-stat"><strong>{loading?'—':formatCount(totals.members)}</strong><span>Members</span></div><div className="hc-community-stat"><strong>{loading?'—':formatCount(totals.posts)}</strong><span>Posts</span></div><Link href="/communities" className="hc-community-view">View directory</Link></div>

      <div className="hc-community-popular"><div className="hc-community-popular-head"><h3>Popular Health Communities</h3><Link href="/communities">View all</Link></div><div className="hc-community-popular-grid">{loading?[1,2,3,4].map(i=><div className="hc-community-empty" key={i}>Loading community…</div>):popular.length?popular.map((community:any,index:number)=><Link key={community.id} href={`/communities/${community.slug||community.id}`} className="hc-community-popular-card" style={{'--community-tint':COMMUNITY_TINTS[index%COMMUNITY_TINTS.length],'--community-border':COMMUNITY_BORDERS[index%COMMUNITY_BORDERS.length]} as CSSProperties}><i>{community.emoji||'🌿'}</i><span><b>{community.name}</b><small>{Number(community.member_count??community.memberCount??0).toLocaleString('en-IN')} members · {Number(community.post_count??community.postCount??0).toLocaleString('en-IN')} posts</small></span></Link>):<div className="hc-community-empty">Community directory temporarily unavailable.</div>}</div></div>
    </div>
  </section>;
}
