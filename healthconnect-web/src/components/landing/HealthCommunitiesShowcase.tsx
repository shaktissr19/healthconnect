'use client';

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import communityApiV2 from '@/lib/communityApiV2';
import { api } from '@/lib/api';
import InfoPopover from '@/components/landing/InfoPopover';

const HEADLINES=['Stronger together.','Support between visits.','Learn from shared journeys.','You are not alone.'] as const;
const PRIMARY_FEATURES=[
  {title:'Join Communities',copy:'Meet people navigating similar health journeys.',icon:'people',href:'/communities',wash:'#CDE8DF',accent:'#087D72'},
  {title:'Share Experiences',copy:'Ask, share and learn from real experiences.',icon:'chat',href:'/communities',wash:'#D9E5F5',accent:'#2459C4'},
  {title:'Learn & Discover',copy:'Find practical guidance and peer perspectives.',icon:'bulb',href:'/learn',wash:'#E6DDF3',accent:'#6D45C6'},
] as const;
const SECONDARY_FEATURES=[
  {title:'Events & Webinars',icon:'calendar',href:'/communities',wash:'#F1DED2',accent:'#C4531A'},
  {title:'Guides & Resources',icon:'book',href:'/learn',wash:'#DCE7F4',accent:'#2459C4'},
  {title:'Safe & Supportive',icon:'shield',href:'/communities',wash:'#D8EADB',accent:'#167044'},
] as const;
const FALLBACK_BADGES=[
  {name:'Explore communities',emoji:'🤝'},
  {name:'Peer support',emoji:'💬'},
  {name:'Shared learning',emoji:'💡'},
  {name:'Wellbeing',emoji:'🌿'},
] as const;
const MAIN_IMAGE='/images/communities/health-communities-main.png';

function Icon({kind,size=20}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='people') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='chat') return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/></svg>;
  if(kind==='bulb') return <svg {...common}><path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5C14.6 15.2 14 16.2 14 17h-4c0-.8-.6-1.8-1.5-2.5Z"/></svg>;
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
  if(kind==='book') return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if(kind==='shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

function formatCount(value:number|null|undefined){
  if(!Number.isFinite(Number(value))||Number(value)<=0)return '—';
  const n=Number(value);if(n>=1000000)return `${(n/1000000).toFixed(n>=10000000?0:1)}M`;if(n>=1000)return `${(n/1000).toFixed(n>=10000?0:1)}K`;return n.toLocaleString('en-IN');
}

export default function HealthCommunitiesShowcase(){
  const router=useRouter();
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
  const badgeItems=useMemo(()=>communities.slice(0,4),[communities]);
  const popular=useMemo(()=>communities.slice(0,4),[communities]);
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="hc-community-showcase" id="health-communities-story" aria-labelledby="hc-community-title">
    <style>{`
      .hc-community-showcase{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#DDEFE7;padding:30px 22px 32px;scroll-margin-top:76px}.hc-community-shell{width:min(100%,1380px);margin:0 auto}
      .hc-community-canvas{position:relative;min-height:455px;border:1px solid #AACFC2;border-radius:24px;overflow:hidden;background:linear-gradient(108deg,#F3F8F5 0%,#ECF5F1 51%,#CFE3DE 100%);box-shadow:0 16px 34px rgba(24,69,82,.08)}
      .hc-community-photo-wrap{position:absolute;z-index:0;right:0;top:0;width:61%;height:100%;overflow:hidden;background:#CCE2DC}.hc-community-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 50%;display:block}.hc-community-photo-wrap:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(243,248,245,.98) 0%,rgba(243,248,245,.92) 14%,rgba(243,248,245,.58) 28%,rgba(243,248,245,.1) 45%,transparent 58%),linear-gradient(180deg,transparent 60%,rgba(6,64,60,.11) 100%)}
      .hc-community-left{position:relative;z-index:2;width:57%;padding:32px 26px 29px 34px;box-sizing:border-box}.hc-community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.6vw,2.85rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.hc-community-title span{display:block;color:#0A8D7D;margin-top:3px;min-height:1.04em}.hc-headline-animate{animation:hcHeadline .35s ease both}@keyframes hcHeadline{from{opacity:.18;transform:translateY(4px)}to{opacity:1;transform:none}}.hc-community-intro{font-size:14.5px;line-height:1.5;color:#35566A;max-width:610px;margin:10px 0 13px}.hc-community-rule{width:42px;height:3px;border-radius:999px;background:#0A8D7D;margin-bottom:13px}
      .hc-community-primary{display:grid;gap:7px;max-width:630px}.hc-community-primary-link{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:11px;padding:11px 13px;border-radius:14px;text-decoration:none;color:#15364A;border:1px solid rgba(113,158,149,.22);transition:transform .17s ease,box-shadow .17s ease}.hc-community-primary-link:hover{transform:translateX(2px);box-shadow:0 7px 16px rgba(31,75,78,.07)}.hc-community-primary-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.54)}.hc-community-primary-link b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:14px;line-height:1.22}.hc-community-primary-link span span{display:block;margin-top:3px;font-size:12.5px;line-height:1.38;color:#486275}.hc-community-primary-arrow{font-size:17px;font-weight:900;opacity:.55}
      .hc-community-secondary{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.hc-community-secondary-link{display:inline-flex;align-items:center;gap:7px;padding:8px 10px;border-radius:999px;text-decoration:none;color:#244556;font-size:11.8px;font-weight:850;border:1px solid rgba(111,150,147,.22)}.hc-community-secondary-icon{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.55)}

      .hc-community-stats{position:absolute;z-index:4;left:59%;top:20px;width:190px;border-radius:16px;background:rgba(250,253,252,.95);border:1px solid #C6DDDA;box-shadow:0 10px 24px rgba(25,61,80,.11);padding:13px 14px 11px;backdrop-filter:blur(8px)}.hc-community-stats-head{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12.5px;font-weight:900;color:#16354A}.hc-community-count{text-align:center;font-family:'Sora','DM Sans',sans-serif;font-size:32px;font-weight:800;color:#0B2B45;line-height:1;margin:10px 0 2px}.hc-community-count-label{text-align:center;font-size:10.5px;color:#486275;margin-bottom:6px}.hc-community-stat-row{display:grid;grid-template-columns:26px 1fr auto;align-items:center;gap:7px;padding:5px 0;border-top:1px solid #E0EAE8}.hc-community-stat-icon{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#DCE8F4;color:#2459C4}.hc-community-stat-row b{font-size:11.2px;color:#14344A}.hc-community-stat-row small{display:block;font-size:9.8px;color:#617887}.hc-community-live{font-size:8.5px;font-weight:900;color:#087D72;background:#DCEFEA;border-radius:999px;padding:3px 5px}.hc-community-explore{display:inline-flex;margin-top:7px;color:#087D72;font-size:10.5px;font-weight:900;text-decoration:none}
      .hc-community-badges{position:absolute;z-index:3;right:20px;top:20px;width:330px;display:grid;grid-template-columns:1fr 1fr;gap:7px}.hc-community-badge{min-width:0;display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:12px;background:rgba(246,251,249,.92);border:1px solid rgba(208,226,222,.95);box-shadow:0 7px 17px rgba(22,52,65,.08);text-decoration:none;color:#17354A;backdrop-filter:blur(7px)}.hc-community-badge-emoji{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#DCEEE9;font-size:14px;flex:0 0 auto}.hc-community-badge b{display:block;font-size:10.5px;line-height:1.18}.hc-community-badge span span{display:block;font-size:9px;color:#607786;margin-top:2px}
      .hc-community-support{position:absolute;z-index:4;left:59%;right:20px;bottom:20px;min-height:70px;border-radius:15px;background:rgba(225,241,237,.95);border:1px solid #B8D8D1;display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;padding:10px 12px;box-sizing:border-box;box-shadow:0 9px 22px rgba(24,69,82,.1);backdrop-filter:blur(8px)}.hc-community-support-icon{width:37px;height:37px;border-radius:50%;display:grid;place-items:center;background:#C9E8E0;color:#087D72}.hc-community-support b{display:block;font-size:12.2px;color:#0A655D}.hc-community-support span{display:block;margin-top:2px;font-size:10.8px;line-height:1.32;color:#526B7B}.hc-community-joinbtn{border:0;border-radius:9px;background:#087F75;color:#fff;padding:10px 12px;font-size:11.2px;font-weight:900;cursor:pointer;white-space:nowrap}.hc-community-joinbtn:hover{background:#066C64}

      .hc-community-popular{margin-top:13px;border-radius:18px;background:linear-gradient(125deg,#0A5555,#0B6863 62%,#155F6A);padding:15px 17px 17px;box-shadow:0 10px 24px rgba(8,67,67,.12)}.hc-community-popular-head{display:flex;justify-content:space-between;align-items:center;gap:14px}.hc-community-popular-head h3{font-family:'Sora','DM Sans',sans-serif;font-size:17px;color:#fff;margin:0}.hc-community-popular-head a{font-size:11.5px;font-weight:900;color:#BDF7EA;text-decoration:none}.hc-community-popular-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.hc-community-popular-card{display:flex;align-items:center;gap:9px;padding:10px 11px;border-radius:12px;text-decoration:none;color:#fff;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.10);transition:background .17s ease,transform .17s ease}.hc-community-popular-card:hover{background:rgba(255,255,255,.16);transform:translateY(-1px)}.hc-community-popular-card i{font-style:normal;width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.13);display:grid;place-items:center;font-size:16px}.hc-community-popular-card b{display:block;font-size:11.2px}.hc-community-popular-card small{display:block;margin-top:2px;color:#CFE9E5;font-size:9.7px}.hc-community-empty{font-size:11px;color:#D7EBE8;padding:10px;border:1px dashed rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.06)}

      @media(max-width:1100px){.hc-community-canvas{min-height:0;display:flex;flex-direction:column}.hc-community-photo-wrap{position:relative;width:100%;height:430px;order:1}.hc-community-photo-wrap:after{background:linear-gradient(180deg,rgba(243,248,245,.05) 46%,#F3F8F5 100%)}.hc-community-left{width:100%;order:2;padding:27px}.hc-community-stats{left:20px;top:20px}.hc-community-badges{top:20px;right:20px}.hc-community-support{position:relative;left:auto;right:auto;bottom:auto;order:3;margin:0 20px 20px}.hc-community-popular-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:720px){.hc-community-showcase{padding:24px 12px 28px}.hc-community-title{font-size:2.05rem}.hc-community-intro{font-size:14px}.hc-community-photo-wrap{height:360px}.hc-community-badges{width:250px}.hc-community-popular-grid{grid-template-columns:1fr}.hc-community-secondary{display:grid;grid-template-columns:1fr 1fr}.hc-community-secondary-link{border-radius:12px}}
      @media(max-width:480px){.hc-community-photo-wrap{height:330px}.hc-community-stats{position:relative;left:auto;top:auto;order:2;margin:12px 12px 0;width:auto}.hc-community-badges{position:relative;right:auto;top:auto;width:auto;order:3;margin:12px;grid-template-columns:1fr}.hc-community-left{order:4;padding:22px 18px}.hc-community-support{order:5;grid-template-columns:36px 1fr;margin:0 12px 12px}.hc-community-joinbtn{grid-column:1/-1;width:100%}.hc-community-secondary{grid-template-columns:1fr}}
    `}</style>

    <div className="hc-community-shell">
      <div className="hc-community-canvas">
        <div className="hc-community-photo-wrap" aria-hidden="true"><img className="hc-community-photo" src={MAIN_IMAGE} alt="" onError={hideBrokenImage}/></div>

        <div className="hc-community-left">
          <h2 className="hc-community-title" id="hc-community-title">Health Communities.<span key={headlineIndex} className="hc-headline-animate">{HEADLINES[headlineIndex]}</span></h2>
          <p className="hc-community-intro">Find condition-focused spaces to share experiences, learn and stay supported between visits.</p>
          <div className="hc-community-rule"/>
          <div className="hc-community-primary">{PRIMARY_FEATURES.map(item=><Link key={item.title} href={item.href} className="hc-community-primary-link" style={{background:item.wash}}><span className="hc-community-primary-icon" style={{color:item.accent}}><Icon kind={item.icon}/></span><span><b>{item.title}</b><span>{item.copy}</span></span><span className="hc-community-primary-arrow">→</span></Link>)}</div>
          <div className="hc-community-secondary">{SECONDARY_FEATURES.map(item=><Link key={item.title} href={item.href} className="hc-community-secondary-link" style={{background:item.wash}}><span className="hc-community-secondary-icon" style={{color:item.accent}}><Icon kind={item.icon} size={15}/></span>{item.title}</Link>)}</div>
        </div>

        <aside className="hc-community-stats" aria-label="Live Health Communities summary">
          <div className="hc-community-stats-head"><span>Active Communities</span><InfoPopover ariaLabel="About Health Communities statistics" title="About these numbers" width={188}>Community counts and activity come from the current HealthConnect community directory when available. They change as communities, memberships and posts change. Peer support does not replace professional medical advice.</InfoPopover></div>
          <div className="hc-community-count">{loading?'—':formatCount(communityTotal??communities.length)}</div><div className="hc-community-count-label">Communities</div>
          <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="people" size={13}/></div><div><b>{loading?'—':formatCount(totals.members)}</b><small>Members</small></div><span className="hc-community-live">LIVE</span></div>
          <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="chat" size={13}/></div><div><b>{loading?'—':formatCount(totals.posts)}</b><small>Posts</small></div><span className="hc-community-live">LIVE</span></div>
          <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="shield" size={13}/></div><div><b>{loading?'—':formatCount(totals.featured)}</b><small>Featured</small></div><span className="hc-community-live">LIVE</span></div>
          <Link href="/communities" className="hc-community-explore">Explore all communities →</Link>
        </aside>

        <div className="hc-community-badges">{(badgeItems.length?badgeItems:FALLBACK_BADGES).map((item:any,index)=>{
          const href=item?.id?`/communities/${item.slug||item.id}`:'/communities';const name=item?.name||FALLBACK_BADGES[index]?.name||'Explore community';const emoji=item?.emoji||'🌿';const members=Number(item?.member_count??item?.memberCount??0);
          return <Link key={item?.id||name} href={href} className="hc-community-badge"><span className="hc-community-badge-emoji">{emoji}</span><span><b>{name}</b><span>{members>0?`${members.toLocaleString('en-IN')} members`:'Explore'}</span></span></Link>;
        })}</div>

        <div className="hc-community-support"><div className="hc-community-support-icon"><Icon kind="people" size={19}/></div><div><b>Support between visits</b><span>Learn from lived experience and stay connected between appointments.</span></div><button type="button" className="hc-community-joinbtn" onClick={()=>router.push('/communities')}>Join a Community</button></div>
      </div>

      <div className="hc-community-popular">
        <div className="hc-community-popular-head"><h3>Popular Health Communities</h3><Link href="/communities">View All →</Link></div>
        <div className="hc-community-popular-grid">
          {loading?[1,2,3,4].map(i=><div className="hc-community-empty" key={i}>Loading community…</div>):popular.length?popular.map((community:any)=><Link key={community.id} href={`/communities/${community.slug||community.id}`} className="hc-community-popular-card"><i>{community.emoji||'🌿'}</i><span><b>{community.name}</b><small>{Number(community.member_count??community.memberCount??0).toLocaleString('en-IN')} members · {Number(community.post_count??community.postCount??0).toLocaleString('en-IN')} posts</small></span></Link>):<div className="hc-community-empty">Community directory temporarily unavailable.</div>}
        </div>
      </div>
    </div>
  </section>;
}
