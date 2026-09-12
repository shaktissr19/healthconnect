'use client';

import { useEffect, useMemo, useState, type CSSProperties, type SyntheticEvent } from 'react';
import Link from 'next/link';
import communityApiV2 from '@/lib/communityApiV2';
import { api } from '@/lib/api';
import InfoPopover from '@/components/landing/InfoPopover';

const HEADLINES=['Stronger together.','Support between visits.','Learn from shared journeys.','You are not alone.'] as const;
const FEATURES=[
  {title:'Find your community',copy:'Discover condition-focused spaces built around shared health journeys.',icon:'people',href:'/communities',bg:'#2E5B60',iconBg:'#426F73'},
  {title:'Share & learn',copy:'Ask questions, exchange experience and learn from people who understand.',icon:'chat',href:'/communities',bg:'#405A73',iconBg:'#55708A'},
  {title:'Guides & resources',copy:'Move from discussion into practical explainers and educational content.',icon:'book',href:'/learn',bg:'#5B5572',iconBg:'#706A87'},
  {title:'Safe participation',copy:'Moderation, reporting and membership controls support constructive spaces.',icon:'shield',href:'/communities',bg:'#59665B',iconBg:'#6E7B70'},
] as const;

const MAIN_IMAGE='/images/communities/health-communities-main.png';
const POPULAR_ACCENTS=['#D98BA3','#86A9CC','#A797C7','#89A98F'] as const;

function Icon({kind,size=20}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='people')return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='chat')return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/></svg>;
  if(kind==='book')return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if(kind==='shield')return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

function formatCount(value:number|null|undefined){
  if(!Number.isFinite(Number(value))||Number(value)<0)return '—';
  const n=Number(value);
  if(n>=1000000)return `${(n/1000000).toFixed(n>=10000000?0:1)}M`;
  if(n>=1000)return `${(n/1000).toFixed(n>=10000?0:1)}K`;
  return n.toLocaleString('en-IN');
}

export default function HealthCommunitiesShowcase(){
  const [headlineIndex,setHeadlineIndex]=useState(0);
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
          const total=Number(raw?.communities);
          if(Number.isFinite(total))setCommunityTotal(total);
        }
      }finally{if(alive)setLoading(false)}
    };
    void load();
    return()=>{alive=false};
  },[]);

  const totals=useMemo(()=>communities.reduce((acc,c)=>({members:acc.members+Number(c?.member_count??c?.memberCount??0),posts:acc.posts+Number(c?.post_count??c?.postCount??0)}),{members:0,posts:0}),[communities]);
  const popular=useMemo(()=>communities.slice(0,4),[communities]);
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="hc-community-showcase" id="health-communities-story" aria-labelledby="hc-community-title">
    <style>{`
      .hc-community-showcase{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#E2E7E9;padding:42px 22px 48px;scroll-margin-top:76px;border-top:1px solid #CDD6DA;border-bottom:1px solid #CDD6DA}.hc-community-shell{width:min(100%,1380px);margin:0 auto}.hc-community-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.55fr);gap:44px;align-items:end;margin:0 6px 18px}.hc-community-kicker{font-size:13px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#8B5A43;margin-bottom:7px}.hc-community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.9rem);line-height:1.03;letter-spacing:-.05em;color:#17364D;margin:0}.hc-community-title span{display:block;color:#5D557A;margin-top:3px;min-height:1.04em}.hc-headline-animate{animation:hcHeadline .35s ease both}@keyframes hcHeadline{from{opacity:.18;transform:translateY(4px)}to{opacity:1;transform:none}}.hc-community-head p{font-size:15.5px;line-height:1.5;color:#465F70;margin:0 0 4px;max-width:520px}
      .hc-community-stage{position:relative;min-height:430px;border:1px solid #C9C3BA;border-radius:26px;overflow:hidden;background:linear-gradient(110deg,#F5F1EB 0%,#F5F1EB 50%,#E5EAEC 64%,#DCE6E8 100%);box-shadow:0 17px 38px rgba(42,55,68,.10)}.hc-community-visual{position:absolute;z-index:0;right:0;top:0;width:55%;height:100%;overflow:hidden;background:#E3EAEC}.hc-community-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 50%;display:block}.hc-community-visual:before{content:'';position:absolute;z-index:2;left:-1px;top:0;bottom:0;width:26%;background:linear-gradient(90deg,#F5F1EB 0%,rgba(245,241,235,.76) 38%,rgba(245,241,235,.18) 76%,transparent 100%);pointer-events:none}.hc-community-content{position:relative;z-index:3;width:57%;padding:31px 34px 28px 38px;box-sizing:border-box}.hc-community-content h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.72rem,2vw,2.12rem);letter-spacing:-.04em;line-height:1.08;margin:0 0 7px;color:#17364D}.hc-community-content>p{font-size:13.8px;line-height:1.46;color:#596E7E;margin:0 0 12px;max-width:520px}.hc-community-rule{width:42px;height:3px;border-radius:999px;background:#8B5A43;margin-bottom:13px}
      .hc-community-feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.hc-community-feature{min-height:108px;display:grid;grid-template-columns:42px 1fr;gap:12px;align-items:start;padding:14px 15px;text-decoration:none;color:#fff;border-radius:15px;background:var(--feature-bg);border:1px solid rgba(255,255,255,.10);box-shadow:0 9px 20px rgba(31,51,66,.10);transition:transform .17s ease,box-shadow .17s ease}.hc-community-feature:hover{transform:translateY(-2px);box-shadow:0 13px 25px rgba(31,51,66,.14)}.hc-community-feature-icon{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:var(--icon-bg);color:#fff}.hc-community-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:13.5px;line-height:1.2;color:#fff}.hc-community-feature span span{display:block;margin-top:4px;font-size:11.7px;line-height:1.4;color:#E3EBEE}
      .hc-community-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:13px}.hc-community-action{display:inline-flex;align-items:center;gap:7px;border-radius:10px;padding:10px 13px;text-decoration:none;font-size:12px;font-weight:900}.hc-community-action.primary{background:#2F4E6F;color:#fff;box-shadow:0 8px 18px rgba(47,78,111,.17)}.hc-community-action.secondary{background:#ECE8E1;color:#4D5666;border:1px solid #CFC8BE}
      .hc-community-visual-label{position:absolute;z-index:3;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.92);border:1px solid #D3DADD;box-shadow:0 5px 13px rgba(19,50,68,.09);font-size:9.2px;font-weight:900;color:#17364D;white-space:nowrap}.hc-community-visual-label.peer{left:43%;top:12%;border-left:4px solid #4B6A86}.hc-community-visual-label.women{left:71%;top:18%;border-left:4px solid #8A6557}.hc-community-visual-label.heart{right:3%;top:43%;border-left:4px solid #9B6578}.hc-community-visual-label.wellbeing{right:4%;bottom:12%;border-left:4px solid #64806C}
      .hc-community-statsbar{display:grid;grid-template-columns:auto repeat(3,1fr) auto;align-items:center;margin-top:14px;border:1px solid #2F4B60;border-radius:14px;background:#203A4D;overflow:visible;position:relative;z-index:20;box-shadow:0 8px 18px rgba(24,52,75,.11)}.hc-community-statslabel{padding:12px 15px;font-size:11px;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#EAF1F4;display:flex;align-items:center;gap:7px}.hc-community-stat{padding:11px 15px;border-left:1px solid #3B5669}.hc-community-stat strong{font-family:'Sora','DM Sans',sans-serif;font-size:19px;color:#fff}.hc-community-stat span{display:block;margin-top:2px;font-size:10.5px;color:#C9D7DF}.hc-community-view{padding:10px 14px;border-left:1px solid #3B5669;color:#E8D8B7;font-size:11.4px;font-weight:900;text-decoration:none;white-space:nowrap}
      .hc-community-popular{margin-top:14px;border-radius:18px;background:#183347;border:1px solid #183347;padding:16px 17px 18px;box-shadow:0 14px 30px rgba(24,43,60,.14)}.hc-community-popular-head{display:flex;justify-content:space-between;align-items:center;gap:14px}.hc-community-popular-head h3{font-family:'Sora','DM Sans',sans-serif;font-size:18px;color:#fff;margin:0}.hc-community-popular-head a{font-size:11.4px;font-weight:900;color:#17364D;text-decoration:none;background:#E8D8B7;border-radius:8px;padding:7px 10px}.hc-community-popular-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:11px}.hc-community-popular-card{position:relative;display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;color:#fff;border:1px solid #3F596B;background:#29485C;transition:transform .17s ease,background .17s ease}.hc-community-popular-card:before{content:'';position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:3px;background:var(--community-accent)}.hc-community-popular-card:hover{transform:translateY(-2px);background:#315267}.hc-community-popular-card i{font-style:normal;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.10);display:grid;place-items:center;font-size:16px;margin-left:3px}.hc-community-popular-card b{display:block;font-size:12.1px;color:#fff}.hc-community-popular-card small{display:block;margin-top:2px;color:#D0DCE2;font-size:10.1px}.hc-community-empty{font-size:10.8px;color:#D7E2EC;padding:10px;border:1px dashed #607789;border-radius:10px;background:#29485C}
      @media(max-width:1050px){.hc-community-head{grid-template-columns:1fr;gap:8px}.hc-community-stage{min-height:0;padding-top:405px}.hc-community-visual{top:0;left:0;right:0;width:100%;height:405px}.hc-community-visual:before{left:0;right:0;top:auto;width:100%;height:30%;bottom:0;background:linear-gradient(180deg,transparent,#F5F1EB)}.hc-community-content{width:100%;padding:28px}.hc-community-popular-grid{grid-template-columns:1fr 1fr}.hc-community-statsbar{grid-template-columns:1fr 1fr}.hc-community-statslabel,.hc-community-view{grid-column:1/-1}.hc-community-view{border-left:0;border-top:1px solid #3B5669}.hc-community-stat:nth-of-type(2){border-left:0}}
      @media(max-width:650px){.hc-community-showcase{padding:36px 12px 40px}.hc-community-title{font-size:2.15rem}.hc-community-head p{font-size:14.5px}.hc-community-stage{padding-top:330px}.hc-community-visual{height:330px}.hc-community-content{padding:24px 19px}.hc-community-feature-grid{grid-template-columns:1fr}.hc-community-popular-grid{grid-template-columns:1fr}.hc-community-statsbar{grid-template-columns:1fr}.hc-community-stat,.hc-community-view{border-left:0;border-top:1px solid #3B5669}.hc-community-visual-label{font-size:8px}.hc-community-visual-label.peer{left:25%}.hc-community-visual-label.women{left:auto;right:4%;top:16%}.hc-community-visual-label.heart{top:48%}}
    `}</style>

    <div className="hc-community-shell">
      <div className="hc-community-head">
        <div><div className="hc-community-kicker">Health Communities</div><h2 className="hc-community-title" id="hc-community-title">Support that continues.<span key={headlineIndex} className="hc-headline-animate">{HEADLINES[headlineIndex]}</span></h2></div>
        <p>Find the right community, learn from lived experience and stay supported between visits without turning the section into another dashboard.</p>
      </div>

      <div className="hc-community-stage">
        <div className="hc-community-content">
          <h3>Find support that fits your journey.</h3>
          <p>Four clear ways to connect, learn and participate safely.</p>
          <div className="hc-community-rule"/>
          <div className="hc-community-feature-grid">
            {FEATURES.map(feature=><Link key={feature.title} href={feature.href} className="hc-community-feature" style={{'--feature-bg':feature.bg,'--icon-bg':feature.iconBg} as CSSProperties}><span className="hc-community-feature-icon"><Icon kind={feature.icon} size={18}/></span><span><b>{feature.title}</b><span>{feature.copy}</span></span></Link>)}
          </div>
          <div className="hc-community-actions"><Link href="/communities" className="hc-community-action primary">Explore communities</Link><Link href="/learn" className="hc-community-action secondary">Knowledge Hub</Link></div>
        </div>

        <div className="hc-community-visual" aria-hidden="true">
          <img className="hc-community-photo" src={MAIN_IMAGE} alt="" onError={hideBrokenImage}/>
          <span className="hc-community-visual-label peer">Peer support</span><span className="hc-community-visual-label women">Women&apos;s health</span><span className="hc-community-visual-label heart">Heart health</span><span className="hc-community-visual-label wellbeing">Wellbeing</span>
        </div>
      </div>

      <div className="hc-community-statsbar" aria-label="Live Health Communities summary">
        <div className="hc-community-statslabel">Live activity <InfoPopover ariaLabel="About Health Communities statistics" title="About these numbers" width={220}>Community counts and activity come from the current HealthConnect community directory when available. They change as communities, memberships and posts change. Peer support does not replace professional medical advice.</InfoPopover></div>
        <div className="hc-community-stat"><strong>{loading?'—':formatCount(communityTotal??communities.length)}</strong><span>Communities</span></div>
        <div className="hc-community-stat"><strong>{loading?'—':formatCount(totals.members)}</strong><span>Members</span></div>
        <div className="hc-community-stat"><strong>{loading?'—':formatCount(totals.posts)}</strong><span>Posts</span></div>
        <Link href="/communities" className="hc-community-view">View directory</Link>
      </div>

      <div className="hc-community-popular">
        <div className="hc-community-popular-head"><h3>Popular Health Communities</h3><Link href="/communities">View all</Link></div>
        <div className="hc-community-popular-grid">
          {loading?[1,2,3,4].map(i=><div className="hc-community-empty" key={i}>Loading community…</div>):popular.length?popular.map((community:any,index:number)=><Link key={community.id} href={`/communities/${community.slug||community.id}`} className="hc-community-popular-card" style={{'--community-accent':POPULAR_ACCENTS[index%POPULAR_ACCENTS.length]} as CSSProperties}><i>{community.emoji||'🌿'}</i><span><b>{community.name}</b><small>{Number(community.member_count??community.memberCount??0).toLocaleString('en-IN')} members · {Number(community.post_count??community.postCount??0).toLocaleString('en-IN')} posts</small></span></Link>):<div className="hc-community-empty">Community directory temporarily unavailable.</div>}
        </div>
      </div>
    </div>
  </section>;
}
