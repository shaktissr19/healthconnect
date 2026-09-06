'use client';

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import communityApiV2 from '@/lib/communityApiV2';
import { api } from '@/lib/api';

const HEADLINES=[
  'Stronger together.',
  'Support between visits.',
  'Learn from shared journeys.',
  'You are not alone.',
] as const;

const FEATURE_CARDS=[
  {title:'Join Communities',copy:'Connect with people facing similar health conditions and life stages.',icon:'people',href:'/communities',wash:'#E9F8F4',accent:'#0B9F8D'},
  {title:'Share Experiences',copy:'Ask questions, share your story and get support from real people.',icon:'chat',href:'/communities',wash:'#EAF2FF',accent:'#2563EB'},
  {title:'Learn & Discover',copy:'Get practical tips, trusted resources and useful peer perspectives.',icon:'bulb',href:'/learn',wash:'#F2EAFE',accent:'#7C3AED'},
  {title:'Events & Webinars',copy:'Join live sessions, Q&A and community-led wellness events.',icon:'calendar',href:'/communities',wash:'#FFF0E5',accent:'#EA580C'},
  {title:'Guides & Resources',copy:'Access curated articles, FAQs and community resources.',icon:'book',href:'/learn',wash:'#E9F1FF',accent:'#2563EB'},
  {title:'Safe & Supportive',copy:'Moderated, respectful spaces with reporting and privacy controls.',icon:'shield',href:'/communities',wash:'#EAF8EE',accent:'#15803D'},
] as const;

const FALLBACK_BADGES=[
  {name:'Explore communities',emoji:'🤝'},
  {name:'Peer support',emoji:'💬'},
  {name:'Shared learning',emoji:'💡'},
  {name:'Wellbeing',emoji:'🌿'},
] as const;

const MAIN_IMAGE='/images/communities/health-communities-main.png';

function Icon({kind,size=22}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='people') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='chat') return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/></svg>;
  if(kind==='bulb') return <svg {...common}><path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5C14.6 15.2 14 16.2 14 17h-4c0-.8-.6-1.8-1.5-2.5Z"/></svg>;
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
  if(kind==='book') return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if(kind==='shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if(kind==='info') return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

function formatCount(value:number|null|undefined){
  if(!Number.isFinite(Number(value))||Number(value)<=0)return '—';
  const n=Number(value);
  if(n>=1000000)return `${(n/1000000).toFixed(n>=10000000?0:1)}M`;
  if(n>=1000)return `${(n/1000).toFixed(n>=10000?0:1)}K`;
  return n.toLocaleString('en-IN');
}

export default function HealthCommunitiesShowcase(){
  const router=useRouter();
  const [headlineIndex,setHeadlineIndex]=useState(0);
  const [infoOpen,setInfoOpen]=useState(false);
  const [communities,setCommunities]=useState<any[]>([]);
  const [communityTotal,setCommunityTotal]=useState<number|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setHeadlineIndex(i=>(i+1)%HEADLINES.length),4600);
    return()=>window.clearInterval(timer);
  },[]);

  useEffect(()=>{
    let alive=true;
    const load=async()=>{
      try{
        const [directory,statsResponse]=await Promise.allSettled([
          communityApiV2.list({limit:50}),
          api.get('/public/stats'),
        ]);
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
          const total=Number(raw?.communities);
          if(Number.isFinite(total))setCommunityTotal(total);
        }
      }finally{if(alive)setLoading(false)}
    };
    void load();
    return()=>{alive=false};
  },[]);

  const totals=useMemo(()=>{
    return communities.reduce((acc,c)=>({
      members:acc.members+Number(c?.member_count??c?.memberCount??0),
      posts:acc.posts+Number(c?.post_count??c?.postCount??0),
      featured:acc.featured+(c?.featured||c?.isFeatured?1:0),
    }),{members:0,posts:0,featured:0});
  },[communities]);

  const badgeItems=useMemo(()=>communities.slice(0,4),[communities]);
  const popular=useMemo(()=>communities.slice(0,4),[communities]);
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="hc-community-showcase" id="health-communities-story" aria-labelledby="hc-community-title">
    <style>{`
      .hc-community-showcase{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff;padding:18px 28px 82px;scroll-margin-top:92px}.hc-community-shell{max-width:1664px;margin:0 auto}.hc-community-canvas{position:relative;min-height:700px;border:1px solid #C8E7E3;border-radius:30px;overflow:hidden;background:linear-gradient(115deg,#F9FCFC 0%,#F5FAFA 47%,#E9F5F4 100%);box-shadow:0 20px 48px rgba(24,69,82,.08)}.hc-community-canvas:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 42% 34%,rgba(255,255,255,.95),rgba(255,255,255,.58) 30%,transparent 52%);pointer-events:none;z-index:1}
      .hc-community-photo-wrap{position:absolute;z-index:0;right:0;top:0;width:52%;height:100%;overflow:hidden;background:linear-gradient(135deg,#DCEFED,#BFDCD9)}.hc-community-photo{width:100%;height:100%;object-fit:cover;object-position:center;display:block}.hc-community-photo-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(244,251,250,.96) 0%,rgba(244,251,250,.45) 18%,rgba(244,251,250,.06) 37%,rgba(244,251,250,0) 60%)}
      .hc-community-left{position:relative;z-index:3;width:47.5%;padding:47px 0 40px 51px}.hc-community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.45rem,3.4vw,4rem);line-height:1.02;letter-spacing:-.05em;color:#0B2B45;margin:0}.hc-community-title span{display:block;color:#0B9B8D;margin-top:4px;min-height:1.05em}.hc-community-title .hc-headline-animate{animation:hcHeadline .42s ease both}@keyframes hcHeadline{from{opacity:.15;transform:translateY(5px)}to{opacity:1;transform:none}}.hc-community-intro{font-size:17px;line-height:1.55;color:#35566A;max-width:650px;margin:17px 0 0}.hc-community-rule{width:54px;height:4px;border-radius:999px;background:#0B9B8D;margin:23px 0}
      .hc-community-features{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:720px}.hc-community-feature{min-height:176px;border-radius:20px;padding:18px 17px;text-decoration:none;color:#10243C;border:1px solid rgba(199,220,221,.8);box-shadow:0 9px 23px rgba(35,73,84,.06);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.hc-community-feature:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(35,73,84,.11);border-color:#A9D6D0}.hc-community-feature-icon{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.72);margin-bottom:11px}.hc-community-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:15px;line-height:1.25}.hc-community-feature span{display:block;margin-top:7px;font-size:12.8px;line-height:1.43;color:#486275}
      .hc-community-stats{position:absolute;z-index:7;left:45.3%;top:37px;width:230px;border-radius:21px;background:rgba(255,255,255,.96);border:1px solid #D1E4E5;box-shadow:0 16px 36px rgba(25,61,80,.13);padding:18px 18px 15px}.hc-community-stats-head{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:900;color:#16354A}.hc-community-info-wrap{position:relative}.hc-community-info{width:27px;height:27px;border-radius:50%;border:1.5px solid #476579;background:#fff;color:#23475E;display:grid;place-items:center;padding:0;cursor:pointer}.hc-community-info:hover,.hc-community-info[aria-expanded='true']{background:#0B9B8D;color:#fff;border-color:#0B9B8D}.hc-community-popover{position:absolute;right:-6px;top:34px;width:280px;padding:13px 14px;border-radius:14px;background:#0B2B45;color:#fff;box-shadow:0 18px 42px rgba(11,43,69,.25);font-size:11.8px;line-height:1.48;font-weight:500;z-index:30}.hc-community-popover b{display:block;color:#D9FFFA;margin-bottom:5px;font-size:12.5px}.hc-community-popover:before{content:'';position:absolute;right:12px;top:-6px;width:12px;height:12px;background:#0B2B45;transform:rotate(45deg)}.hc-community-count{text-align:center;font-family:'Sora','DM Sans',sans-serif;font-size:45px;font-weight:800;color:#0B2B45;line-height:1;margin:22px 0 2px}.hc-community-count-label{text-align:center;font-size:12px;color:#486275;margin-bottom:15px}.hc-community-stat-row{display:grid;grid-template-columns:26px 1fr auto;align-items:center;gap:8px;padding:10px 0;border-top:1px solid #E6EEF0}.hc-community-stat-icon{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#EAF4FF;color:#2563EB}.hc-community-stat-row b{font-size:13px;color:#14344A}.hc-community-stat-row small{display:block;font-size:10.5px;color:#617887;margin-top:2px}.hc-community-live{font-size:10px;font-weight:900;color:#0B9B8D;background:#E5F7F3;border-radius:999px;padding:4px 7px}.hc-community-explore{display:inline-flex;margin-top:11px;color:#0B8F83;font-size:12px;font-weight:900;text-decoration:none}
      .hc-community-badge{position:absolute;z-index:6;display:flex;align-items:center;gap:9px;min-width:175px;max-width:225px;padding:9px 12px;border-radius:16px;background:rgba(255,255,255,.93);border:1px solid rgba(221,232,232,.9);box-shadow:0 9px 22px rgba(22,52,65,.12);text-decoration:none;color:#17354A;backdrop-filter:blur(8px)}.hc-community-badge:nth-of-type(1){right:23.5%;top:14%}.hc-community-badge:nth-of-type(2){right:2.4%;top:18%}.hc-community-badge:nth-of-type(3){right:1.8%;top:41%}.hc-community-badge:nth-of-type(4){right:3.2%;top:64%}.hc-community-badge-emoji{width:39px;height:39px;border-radius:50%;display:grid;place-items:center;background:#EEF8F6;font-size:20px;flex:0 0 auto}.hc-community-badge b{display:block;font-size:11.5px;line-height:1.25}.hc-community-badge span{display:block;font-size:9.8px;color:#607786;margin-top:2px}.hc-community-badge:hover{transform:translateY(-2px)}
      .hc-community-note-card{position:absolute;z-index:6;left:51.5%;bottom:16%;width:260px;padding:14px 15px;border-radius:17px;background:rgba(255,255,255,.94);border:1px solid rgba(221,232,232,.9);box-shadow:0 12px 28px rgba(22,52,65,.12);color:#17354A}.hc-community-note-card b{display:block;font-size:12.5px;color:#0B665C}.hc-community-note-card span{display:block;margin-top:5px;font-size:11.4px;line-height:1.42;color:#526B7B}
      .hc-community-joinbar{position:absolute;z-index:7;right:2.2%;bottom:5.8%;width:34%;min-height:88px;border-radius:19px;background:rgba(240,251,249,.95);border:1px solid #D2EAE6;display:grid;grid-template-columns:54px 1fr auto;gap:13px;align-items:center;padding:14px 17px;box-sizing:border-box;box-shadow:0 11px 28px rgba(24,69,82,.11);backdrop-filter:blur(8px)}.hc-community-join-icon{width:49px;height:49px;border-radius:50%;display:grid;place-items:center;background:#DFF6F1;color:#0B9B8D}.hc-community-joinbar span{font-size:11.5px;line-height:1.42;color:#425F70}.hc-community-joinbtn{border:0;border-radius:11px;background:#0B9F97;color:#fff;padding:13px 19px;font-size:12.5px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:0 7px 16px rgba(11,159,151,.18)}.hc-community-joinbtn:hover{background:#087F78}
      .hc-community-popular{margin-top:14px;border-radius:23px;border:1px solid #D7E7E7;background:#fff;padding:19px 24px 22px}.hc-community-popular-head{display:flex;justify-content:space-between;align-items:center;gap:16px}.hc-community-popular-head h3{font-family:'Sora','DM Sans',sans-serif;font-size:22px;color:#0B2B45;margin:0}.hc-community-popular-head a{font-size:12px;font-weight:900;color:#0B8F83;text-decoration:none}.hc-community-popular-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-top:14px}.hc-community-popular-card{display:flex;align-items:center;gap:10px;padding:12px 13px;border-radius:14px;text-decoration:none;color:#17354A;border:1px solid #E1ECEC;background:linear-gradient(135deg,#FAFDFD,#F2F9F8)}.hc-community-popular-card:hover{border-color:#B8DDD8;transform:translateY(-2px)}.hc-community-popular-card i{font-style:normal;width:37px;height:37px;border-radius:11px;background:#E6F6F2;display:grid;place-items:center;font-size:19px}.hc-community-popular-card b{display:block;font-size:11.5px}.hc-community-popular-card small{display:block;margin-top:3px;color:#6A7F8C;font-size:9.8px}.hc-community-empty{font-size:11px;color:#6A7F8C;padding:12px;border:1px dashed #D9E7E7;border-radius:13px}
      @media(max-width:1240px){.hc-community-showcase{padding-left:18px;padding-right:18px}.hc-community-left{width:46%;padding-left:34px}.hc-community-stats{left:43.5%;transform:scale(.92);transform-origin:top left}.hc-community-badge{min-width:155px;max-width:190px}.hc-community-joinbar{width:39%}}
      @media(max-width:980px){.hc-community-canvas{min-height:1060px}.hc-community-photo-wrap{left:0;right:0;top:530px;width:100%;height:530px}.hc-community-left{width:auto;padding:40px 28px}.hc-community-features{max-width:none}.hc-community-stats{left:auto;right:28px;top:485px;transform:none}.hc-community-badge:nth-of-type(1){left:28px;right:auto;top:610px}.hc-community-badge:nth-of-type(2){right:28px;top:625px}.hc-community-badge:nth-of-type(3){right:28px;top:770px}.hc-community-badge:nth-of-type(4){left:28px;right:auto;top:795px}.hc-community-note-card{left:28px;bottom:135px}.hc-community-joinbar{right:28px;bottom:32px;width:calc(100% - 56px)}.hc-community-popular-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:680px){.hc-community-showcase{padding:8px 10px 60px}.hc-community-canvas{min-height:1390px;border-radius:22px}.hc-community-left{padding:31px 18px}.hc-community-title{font-size:2.45rem}.hc-community-intro{font-size:15px}.hc-community-features{grid-template-columns:1fr 1fr}.hc-community-feature{min-height:155px;padding:15px}.hc-community-photo-wrap{top:835px;height:555px}.hc-community-stats{right:18px;top:790px;width:210px}.hc-community-badge{min-width:142px;max-width:175px}.hc-community-badge:nth-of-type(1){left:18px;top:940px}.hc-community-badge:nth-of-type(2){right:18px;top:955px}.hc-community-badge:nth-of-type(3){right:18px;top:1090px}.hc-community-badge:nth-of-type(4){left:18px;top:1115px}.hc-community-note-card{left:18px;bottom:145px;width:220px}.hc-community-joinbar{left:18px;right:18px;width:auto;bottom:24px;grid-template-columns:44px 1fr}.hc-community-join-icon{width:42px;height:42px}.hc-community-joinbtn{grid-column:1/-1;width:100%}.hc-community-popular-grid{grid-template-columns:1fr}.hc-community-popular-head{align-items:flex-start}.hc-community-popular-head h3{font-size:19px}}
      @media(max-width:460px){.hc-community-features{grid-template-columns:1fr}.hc-community-canvas{min-height:1730px}.hc-community-photo-wrap{top:1160px;height:570px}.hc-community-stats{top:1115px}.hc-community-badge:nth-of-type(1){top:1260px}.hc-community-badge:nth-of-type(2){top:1320px}.hc-community-badge:nth-of-type(3){top:1400px}.hc-community-badge:nth-of-type(4){top:1460px}.hc-community-note-card{display:none}}
    `}</style>

    <div className="hc-community-shell">
      <div className="hc-community-canvas">
        <div className="hc-community-photo-wrap" aria-hidden="true">
          <img className="hc-community-photo" src={MAIN_IMAGE} alt="" onError={hideBrokenImage}/>
          <div className="hc-community-photo-shade"/>
        </div>

        <div className="hc-community-left">
          <h2 className="hc-community-title" id="hc-community-title">Health Communities.<span key={headlineIndex} className="hc-headline-animate">{HEADLINES[headlineIndex]}</span></h2>
          <p className="hc-community-intro">Real conversations. Shared experiences. Trusted support. Find people who understand, learn from others and feel less alone on your health journey.</p>
          <div className="hc-community-rule"/>
          <div className="hc-community-features">
            {FEATURE_CARDS.map(card=><Link key={card.title} href={card.href} className="hc-community-feature" style={{background:card.wash}}><div className="hc-community-feature-icon" style={{color:card.accent}}><Icon kind={card.icon}/></div><b>{card.title}</b><span>{card.copy}</span></Link>)}
          </div>
        </div>

        <aside className="hc-community-stats" aria-label="Live Health Communities summary">
          <div className="hc-community-stats-head"><span>Active Communities</span><span className="hc-community-info-wrap"><button type="button" className="hc-community-info" aria-label="About Health Communities statistics" aria-expanded={infoOpen} onClick={()=>setInfoOpen(v=>!v)} onKeyDown={event=>{if(event.key==='Escape')setInfoOpen(false)}}><Icon kind="info" size={16}/></button>{infoOpen&&<span className="hc-community-popover" role="tooltip"><b>About these numbers</b>Community counts and activity shown here come from the current HealthConnect community directory when available. They may change as communities, memberships and posts change. Health Communities are for peer learning and support and do not replace professional medical advice.</span>}</span></div>
          <div className="hc-community-count">{loading?'—':formatCount(communityTotal??communities.length)}</div><div className="hc-community-count-label">Communities</div>
          <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="people" size={15}/></div><div><b>{loading?'—':formatCount(totals.members)}</b><small>Members</small></div><span className="hc-community-live">LIVE</span></div>
          <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="chat" size={15}/></div><div><b>{loading?'—':formatCount(totals.posts)}</b><small>Posts</small></div><span className="hc-community-live">LIVE</span></div>
          <div className="hc-community-stat-row"><div className="hc-community-stat-icon"><Icon kind="shield" size={15}/></div><div><b>{loading?'—':formatCount(totals.featured)}</b><small>Featured</small></div><span className="hc-community-live">LIVE</span></div>
          <Link href="/communities" className="hc-community-explore">Explore all communities →</Link>
        </aside>

        {(badgeItems.length?badgeItems:FALLBACK_BADGES).map((item:any,index)=>{
          const href=item?.id?`/communities/${item.slug||item.id}`:'/communities';
          const name=item?.name||FALLBACK_BADGES[index]?.name||'Explore community';
          const emoji=item?.emoji||'🌿';
          const members=Number(item?.member_count??item?.memberCount??0);
          return <Link key={item?.id||name} href={href} className="hc-community-badge"><span className="hc-community-badge-emoji">{emoji}</span><span><b>{name}</b><span>{members>0?`${members.toLocaleString('en-IN')} members`:'Explore community'}</span></span></Link>;
        })}

        <div className="hc-community-note-card"><b>Support between visits</b><span>Learn from lived experience, prepare better questions and stay connected between appointments.</span></div>

        <div className="hc-community-joinbar"><div className="hc-community-join-icon"><Icon kind="people" size={24}/></div><span>Be part of a supportive health community today.</span><button type="button" className="hc-community-joinbtn" onClick={()=>router.push('/communities')}>Join a Community</button></div>
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
