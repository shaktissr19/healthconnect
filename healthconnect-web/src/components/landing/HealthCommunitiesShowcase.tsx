'use client';

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import communityApiV2 from '@/lib/communityApiV2';
import { api } from '@/lib/api';
import InfoPopover from '@/components/landing/InfoPopover';

const HEADLINES=['Stronger together.','Support between visits.','Learn from shared journeys.','You are not alone.'] as const;
const FEATURE_CARDS=[
  {title:'Join Communities',copy:'Connect with people facing similar health conditions and life stages.',icon:'people',href:'/communities',wash:'#E9F8F4',accent:'#0B9F8D'},
  {title:'Share Experiences',copy:'Ask questions, share your story and get support from real people.',icon:'chat',href:'/communities',wash:'#EAF2FF',accent:'#2563EB'},
  {title:'Learn & Discover',copy:'Get practical tips, trusted resources and useful peer perspectives.',icon:'bulb',href:'/learn',wash:'#F2EAFE',accent:'#7C3AED'},
  {title:'Events & Webinars',copy:'Join live sessions, Q&A and community-led wellness events.',icon:'calendar',href:'/communities',wash:'#FFF0E5',accent:'#EA580C'},
  {title:'Guides & Resources',copy:'Access curated articles, FAQs and community resources.',icon:'book',href:'/learn',wash:'#E9F1FF',accent:'#2563EB'},
  {title:'Safe & Supportive',copy:'Moderated, respectful spaces with reporting and privacy controls.',icon:'shield',href:'/communities',wash:'#EAF8EE',accent:'#15803D'},
] as const;
const FALLBACK_BADGES=[{name:'Explore communities',emoji:'🤝'},{name:'Peer support',emoji:'💬'},{name:'Shared learning',emoji:'💡'},{name:'Wellbeing',emoji:'🌿'}] as const;
const MAIN_IMAGE='/images/communities/health-communities-main.png';

function Icon({kind,size=22}:{kind:string;size?:number}){
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
  const n=Number(value); if(n>=1000000)return `${(n/1000000).toFixed(n>=10000000?0:1)}M`; if(n>=1000)return `${(n/1000).toFixed(n>=10000?0:1)}K`; return n.toLocaleString('en-IN');
}

export default function HealthCommunitiesShowcase(){
  const router=useRouter();
  const [headlineIndex,setHeadlineIndex]=useState(0);
  const [communities,setCommunities]=useState<any[]>([]);
  const [communityTotal,setCommunityTotal]=useState<number|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{if(typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=window.setInterval(()=>setHeadlineIndex(i=>(i+1)%HEADLINES.length),4600);return()=>window.clearInterval(timer)},[]);
  useEffect(()=>{let alive=true;const load=async()=>{try{const [directory,statsResponse]=await Promise.allSettled([communityApiV2.list({limit:50}),api.get('/public/stats')]);if(!alive)return;if(directory.status==='fulfilled'){const result:any=directory.value||{};const items=Array.isArray(result?.communities)?result.communities:Array.isArray(result)?result:[];setCommunities(items);const directoryTotal=Number(result?.total??result?.pagination?.total??result?.meta?.total);if(Number.isFinite(directoryTotal))setCommunityTotal(directoryTotal)}if(statsResponse.status==='fulfilled'){const raw:any=statsResponse.value?.data?.data??statsResponse.value?.data??{};const total=Number(raw?.communities);if(Number.isFinite(total))setCommunityTotal(total)}}finally{if(alive)setLoading(false)}};void load();return()=>{alive=false}},[]);

  const totals=useMemo(()=>communities.reduce((acc,c)=>({members:acc.members+Number(c?.member_count??c?.memberCount??0),posts:acc.posts+Number(c?.post_count??c?.postCount??0),featured:acc.featured+(c?.featured||c?.isFeatured?1:0)}),{members:0,posts:0,featured:0}),[communities]);
  const badgeItems=useMemo(()=>communities.slice(0,4),[communities]);
  const popular=useMemo(()=>communities.slice(0,4),[communities]);
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none'};

  return <section className="hc-community-showcase" id="health-communities-story" aria-labelledby="hc-community-title">
    <style>{`
      .hc-community-showcase{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff;padding:24px 22px 48px;scroll-margin-top:76px}.hc-community-shell{width:min(100%,1380px);margin:0 auto}
      .hc-community-canvas{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(430px,.98fr);min-height:500px;border:1px solid #C8E7E3;border-radius:24px;overflow:hidden;background:linear-gradient(115deg,#F9FCFC 0%,#F3FAF9 100%);box-shadow:0 16px 38px rgba(24,69,82,.07)}
      .hc-community-left{padding:30px 28px 28px 34px;min-width:0;display:flex;flex-direction:column;justify-content:center}.hc-community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.95rem,2.55vw,2.8rem);line-height:1.02;letter-spacing:-.048em;color:#0B2B45;margin:0}.hc-community-title span{display:block;color:#0B9B8D;margin-top:3px;min-height:1.03em}.hc-community-title .hc-headline-animate{animation:hcHeadline .35s ease both}@keyframes hcHeadline{from{opacity:.2;transform:translateY(4px)}to{opacity:1;transform:none}}
      .hc-community-intro{font-size:13.5px;line-height:1.46;color:#35566A;max-width:650px;margin:10px 0 0}.hc-community-rule{width:42px;height:3px;border-radius:999px;background:#0B9B8D;margin:12px 0}
      .hc-community-features{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:8px}.hc-community-feature{min-width:0;min-height:94px;border-radius:13px;padding:10px;text-decoration:none;color:#10243C;border:1px solid rgba(199,220,221,.84);box-shadow:0 5px 14px rgba(35,73,84,.045);transition:transform .18s ease,box-shadow .18s ease}.hc-community-feature:hover{transform:translateY(-2px);box-shadow:0 9px 18px rgba(35,73,84,.08)}.hc-community-feature-icon{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.8);margin-bottom:6px}.hc-community-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:10.9px;line-height:1.22}.hc-community-feature span{display:block;margin-top:4px;font-size:9.5px;line-height:1.34;color:#486275}

      .hc-community-visual{position:relative;min-height:500px;overflow:hidden;background:#E8F4F2}.hc-community-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block}.hc-community-photo-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(240,249,248,.28),transparent 27%),linear-gradient(180deg,rgba(8,60,61,.02) 40%,rgba(8,60,61,.14) 100%)}
      .hc-community-stats{position:absolute;z-index:4;left:14px;top:14px;width:164px;border-radius:14px;background:rgba(255,255,255,.95);border:1px solid #D1E4E5;box-shadow:0 10px 24px rgba(25,61,80,.11);padding:10px 10px 9px;backdrop-filter:blur(8px)}.hc-community-stats-head{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:10.2px;font-weight:900;color:#16354A}.hc-community-count{text-align:center;font-family:'Sora','DM Sans',sans-serif;font-size:30px;font-weight:800;color:#0B2B45;line-height:1;margin:9px 0 1px}.hc-community-count-label{text-align:center;font-size:8.5px;color:#486275;margin-bottom:5px}.hc-community-stat-row{display:grid;grid-template-columns:20px 1fr auto;align-items:center;gap:5px;padding:4px 0;border-top:1px solid #E6EEF0}.hc-community-stat-icon{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#EAF4FF;color:#2563EB}.hc-community-stat-row b{font-size:9px;color:#14344A}.hc-community-stat-row small{display:block;font-size:7.8px;color:#617887}.hc-community-live{font-size:7px;font-weight:900;color:#0B9B8D;background:#E5F7F3;border-radius:999px;padding:2px 4px}.hc-community-explore{display:inline-flex;margin-top:5px;color:#0B8F83;font-size:8.4px;font-weight:900;text-decoration:none}
      .hc-community-badges{position:absolute;z-index:4;right:14px;top:14px;width:min(320px,48%);display:grid;grid-template-columns:1fr 1fr;gap:7px}.hc-community-badge{min-width:0;display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:12px;background:rgba(255,255,255,.93);border:1px solid rgba(221,232,232,.9);box-shadow:0 7px 18px rgba(22,52,65,.09);text-decoration:none;color:#17354A;backdrop-filter:blur(8px)}.hc-community-badge-emoji{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#EEF8F6;font-size:14px;flex:0 0 auto}.hc-community-badge b{display:block;font-size:8.6px;line-height:1.2}.hc-community-badge span{display:block;font-size:7.5px;color:#607786;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hc-community-badge:hover{transform:translateY(-1px)}
      .hc-community-joinbar{position:absolute;z-index:4;left:14px;right:14px;bottom:14px;min-height:64px;border-radius:14px;background:rgba(245,252,251,.95);border:1px solid #D2EAE6;display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:9px;align-items:center;padding:8px 10px;box-sizing:border-box;box-shadow:0 9px 22px rgba(24,69,82,.1);backdrop-filter:blur(8px)}.hc-community-join-icon{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#DFF6F1;color:#0B9B8D}.hc-community-joincopy b{display:block;font-size:9.5px;color:#0B665C}.hc-community-joincopy span{display:block;margin-top:2px;font-size:8.6px;line-height:1.3;color:#425F70}.hc-community-joinbtn{border:0;border-radius:9px;background:#0B9F97;color:#fff;padding:8px 11px;font-size:9.5px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:0 6px 14px rgba(11,159,151,.16)}.hc-community-joinbtn:hover{background:#087F78}

      .hc-community-popular{margin-top:10px;border-radius:16px;border:1px solid #D7E7E7;background:#fff;padding:13px 16px 14px}.hc-community-popular-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.hc-community-popular-head h3{font-family:'Sora','DM Sans',sans-serif;font-size:16px;color:#0B2B45;margin:0}.hc-community-popular-head a{font-size:10px;font-weight:900;color:#0B8F83;text-decoration:none}.hc-community-popular-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:9px}.hc-community-popular-card{display:flex;align-items:center;gap:7px;padding:8px 9px;border-radius:11px;text-decoration:none;color:#17354A;border:1px solid #E1ECEC;background:linear-gradient(135deg,#FAFDFD,#F2F9F8)}.hc-community-popular-card:hover{border-color:#B8DDD8;transform:translateY(-1px)}.hc-community-popular-card i{font-style:normal;width:30px;height:30px;border-radius:9px;background:#E6F6F2;display:grid;place-items:center;font-size:15px}.hc-community-popular-card b{display:block;font-size:9.5px}.hc-community-popular-card small{display:block;margin-top:2px;color:#6A7F8C;font-size:8px}.hc-community-empty{font-size:9px;color:#6A7F8C;padding:9px;border:1px dashed #D9E7E7;border-radius:10px}

      @media(max-height:820px) and (min-width:1101px){.hc-community-showcase{padding-top:18px;padding-bottom:40px}.hc-community-canvas,.hc-community-visual{min-height:470px}.hc-community-left{padding-top:25px;padding-bottom:24px}.hc-community-title{font-size:clamp(1.85rem,2.35vw,2.55rem)}.hc-community-intro{font-size:12.8px}.hc-community-feature{min-height:86px;padding:8px 9px}.hc-community-feature span{font-size:9px}.hc-community-popular{padding-top:11px;padding-bottom:12px}}
      @media(max-width:1100px){.hc-community-canvas{grid-template-columns:1fr}.hc-community-left{padding:28px}.hc-community-visual{min-height:500px}.hc-community-popular-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:700px){.hc-community-showcase{padding:18px 10px 40px}.hc-community-left{padding:24px 16px}.hc-community-title{font-size:2.15rem}.hc-community-intro{font-size:14px}.hc-community-features{grid-template-columns:1fr 1fr}.hc-community-visual{min-height:540px}.hc-community-stats{left:10px;top:10px}.hc-community-badges{right:10px;top:10px;width:46%;grid-template-columns:1fr}.hc-community-joinbar{left:10px;right:10px;bottom:10px;grid-template-columns:34px 1fr}.hc-community-joinbtn{grid-column:1/-1;justify-self:start}.hc-community-popular-grid{grid-template-columns:1fr}}
      @media(max-width:460px){.hc-community-features{grid-template-columns:1fr}.hc-community-visual{min-height:600px}.hc-community-badges{top:180px;width:160px}.hc-community-popular-head{align-items:flex-start}}
    `}</style>

    <div className="hc-community-shell">
      <div className="hc-community-canvas">
        <div className="hc-community-left">
          <h2 className="hc-community-title" id="hc-community-title">Health Communities.<span key={headlineIndex} className="hc-headline-animate">{HEADLINES[headlineIndex]}</span></h2>
          <p className="hc-community-intro">Real conversations. Shared experiences. Trusted support. Find people who understand, learn from others and feel less alone on your health journey.</p>
          <div className="hc-community-rule"/>
          <div className="hc-community-features">{FEATURE_CARDS.map(card=><Link key={card.title} href={card.href} className="hc-community-feature" style={{background:card.wash}}><div className="hc-community-feature-icon" style={{color:card.accent}}><Icon kind={card.icon} size={18}/></div><b>{card.title}</b><span>{card.copy}</span></Link>)}</div>
        </div>

        <div className="hc-community-visual">
          <img className="hc-community-photo" src={MAIN_IMAGE} alt="Indian HealthConnect community members supporting one another" onError={hideBrokenImage}/><div className="hc-community-photo-shade" aria-hidden="true"/>
          <aside className="hc-community-stats" aria-label="Live Health Communities summary">
            <div className="hc-community-stats-head"><span>Active Communities</span><InfoPopover ariaLabel="About Health Communities statistics" title="About these numbers" width={188}>Community counts and activity come from the current HealthConnect community directory when available. They change as communities, memberships and posts change. Peer support does not replace professional medical advice.</InfoPopover></div>
            <div className="hc-community-count">{loading?'—':formatCount(communityTotal??communities.length)}</div><div className="hc-community-count-label">Communities</div>
            <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="people" size={12}/></div><div><b>{loading?'—':formatCount(totals.members)}</b><small>Members</small></div><span className="hc-community-live">LIVE</span></div>
            <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="chat" size={12}/></div><div><b>{loading?'—':formatCount(totals.posts)}</b><small>Posts</small></div><span className="hc-community-live">LIVE</span></div>
            <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="shield" size={12}/></div><div><b>{loading?'—':formatCount(totals.featured)}</b><small>Featured</small></div><span className="hc-community-live">LIVE</span></div>
            <Link href="/communities" className="hc-community-explore">Explore all communities →</Link>
          </aside>
          <div className="hc-community-badges">{(badgeItems.length?badgeItems:FALLBACK_BADGES).map((item:any,index)=>{const href=item?.id?`/communities/${item.slug||item.id}`:'/communities';const name=item?.name||FALLBACK_BADGES[index]?.name||'Explore community';const emoji=item?.emoji||'🌿';const members=Number(item?.member_count??item?.memberCount??0);return <Link key={item?.id||name} href={href} className="hc-community-badge"><span className="hc-community-badge-emoji">{emoji}</span><span><b>{name}</b><span>{members>0?`${members.toLocaleString('en-IN')} members`:'Explore community'}</span></span></Link>})}</div>
          <div className="hc-community-joinbar"><div className="hc-community-join-icon"><Icon kind="people" size={19}/></div><div className="hc-community-joincopy"><b>Support between visits</b><span>Learn from lived experience, prepare better questions and stay connected between appointments.</span></div><button type="button" className="hc-community-joinbtn" onClick={()=>router.push('/communities')}>Join a Community</button></div>
        </div>
      </div>

      <div className="hc-community-popular">
        <div className="hc-community-popular-head"><h3>Popular Health Communities</h3><Link href="/communities">View All →</Link></div>
        <div className="hc-community-popular-grid">{loading?[1,2,3,4].map(i=><div className="hc-community-empty" key={i}>Loading community…</div>):popular.length?popular.map((community:any)=><Link key={community.id} href={`/communities/${community.slug||community.id}`} className="hc-community-popular-card"><i>{community.emoji||'🌿'}</i><span><b>{community.name}</b><small>{Number(community.member_count??community.memberCount??0).toLocaleString('en-IN')} members · {Number(community.post_count??community.postCount??0).toLocaleString('en-IN')} posts</small></span></Link>):<div className="hc-community-empty">Community directory temporarily unavailable.</div>}</div>
      </div>
    </div>
  </section>;
}
