'use client';

import type { CSSProperties } from 'react';

const ITEMS=[
  {title:'Private by default',copy:'Personal health information stays behind authenticated access.',accent:'#2F5BEA',wash:'#E4EBFF',icon:'lock',tag:'PRIVATE ACCESS'},
  {title:'Share by choice',copy:'Supported sharing follows the patient and the care workflow.',accent:'#0F766E',wash:'#DDF3EE',icon:'share',tag:'YOUR CONTROL'},
  {title:'Provider status',copy:'Verification status is shown clearly where HealthConnect supports it.',accent:'#7357D8',wash:'#EDE7FA',icon:'check',tag:'CLEAR STATUS'},
  {title:'Safer communities',copy:'Reporting, moderation and membership rules support constructive spaces.',accent:'#C45A31',wash:'#F7E7DC',icon:'shield',tag:'SAFER SPACES'},
] as const;

function Icon({kind,size=28}:{kind:string;size?:number}){
  const base={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='lock')return <svg {...base}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>;
  if(kind==='share')return <svg {...base}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>;
  if(kind==='check')return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
  if(kind==='eye')return <svg {...base}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  return <svg {...base}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
}

export default function TrustSection(){
  return <section className="trust-section" id="trust-privacy" aria-labelledby="trust-title">
    <style>{`
      .trust-section{background:#F2EEF7;padding:44px 22px 48px;font-family:'DM Sans',Arial,sans-serif;color:#10243C;border-top:1px solid #DED6E8}.trust-shell{max-width:1340px;margin:0 auto}.trust-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.58fr);gap:44px;align-items:end;margin:0 6px 20px}.trust-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#7357D8;margin-bottom:7px}.trust-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.9rem);line-height:1.03;letter-spacing:-.05em;color:#102E45;margin:0}.trust-head p{font-size:15.5px;line-height:1.52;color:#53677A;margin:0 0 4px;max-width:520px}.trust-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.trust-card{min-height:155px;border:1px solid var(--trust-border);border-radius:18px;padding:16px;background:var(--trust-wash);position:relative;overflow:hidden;box-shadow:0 10px 24px rgba(24,43,60,.06)}.trust-card:after{content:'';position:absolute;width:92px;height:92px;border-radius:50%;right:-38px;top:-38px;background:var(--trust-accent);opacity:.10}.trust-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.76);color:var(--trust-accent);margin-bottom:12px}.trust-card h3{font-family:'Sora','DM Sans',sans-serif;font-size:15px;line-height:1.22;letter-spacing:-.025em;color:#17354A;margin:0 0 5px}.trust-card p{font-size:11.6px;line-height:1.42;color:#526B7B;margin:0;max-width:245px}.trust-tag{display:inline-flex;margin-top:12px;padding:5px 7px;border-radius:999px;background:rgba(255,255,255,.66);color:var(--trust-accent);font-size:8.8px;font-weight:900;letter-spacing:.10em}.trust-story{margin-top:13px;border-radius:18px;background:linear-gradient(120deg,#17384A 0%,#244B61 55%,#2A5D6A 100%);color:#fff;padding:17px 19px;display:grid;grid-template-columns:minmax(260px,.8fr) minmax(0,1.2fr);gap:22px;align-items:center;box-shadow:0 12px 28px rgba(22,48,64,.12)}.trust-story-copy{display:flex;align-items:center;gap:12px}.trust-story-lock{width:45px;height:45px;border-radius:13px;display:grid;place-items:center;background:#F7C96C;color:#17384A;flex:0 0 auto}.trust-story h3{font-family:'Sora','DM Sans',sans-serif;font-size:18px;line-height:1.2;margin:0 0 4px}.trust-story p{font-size:11.5px;line-height:1.4;color:#D8E5EB;margin:0}.trust-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.trust-step{padding:10px 11px;border-radius:11px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10)}.trust-step b{display:block;font-size:10.5px;color:#fff;margin-bottom:2px}.trust-step span{display:block;font-size:9.7px;line-height:1.33;color:#C8D8DF}.trust-foot{margin-top:10px;color:#64798A;font-size:10.5px;line-height:1.42;text-align:center}
      @media(max-width:1050px){.trust-head{grid-template-columns:1fr;gap:8px}.trust-cards{grid-template-columns:1fr 1fr}.trust-story{grid-template-columns:1fr}.trust-steps{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:650px){.trust-section{padding:36px 12px 40px}.trust-head{margin:0 4px 16px}.trust-head h2{font-size:2.15rem}.trust-head p{font-size:14.5px}.trust-cards{grid-template-columns:1fr}.trust-card{min-height:0}.trust-story{padding:16px}.trust-story-copy{align-items:flex-start}.trust-steps{grid-template-columns:1fr}}
    `}</style>

    <div className="trust-shell">
      <div className="trust-head"><div><div className="trust-kicker">Trust & Privacy</div><h2 id="trust-title">Private where it matters. Clear where it counts.</h2></div><p>Public discovery and private health information stay deliberately separate, with simple controls around sharing, status and community participation.</p></div>

      <div className="trust-cards">{ITEMS.map(item=><article className="trust-card" key={item.title} style={{'--trust-accent':item.accent,'--trust-wash':item.wash,'--trust-border':`${item.accent}33`} as CSSProperties}><div className="trust-icon"><Icon kind={item.icon} size={22}/></div><h3>{item.title}</h3><p>{item.copy}</p><span className="trust-tag">{item.tag}</span></article>)}</div>

      <div className="trust-story"><div className="trust-story-copy"><span className="trust-story-lock"><Icon kind="lock" size={22}/></span><div><h3>Discover publicly. Keep personal health context private.</h3><p>Browsing care options should not turn private health information into public profile content.</p></div></div><div className="trust-steps"><div className="trust-step"><b>Explore</b><span>Doctors, hospitals, communities and learning.</span></div><div className="trust-step"><b>Keep private</b><span>Health records remain in the authenticated workspace.</span></div><div className="trust-step"><b>Share by choice</b><span>Supported sharing follows the care journey.</span></div></div></div>
      <div className="trust-foot">HealthConnect supports organisation, discovery and sharing workflows; it does not replace emergency services, diagnosis or professional medical judgement.</div>
    </div>
  </section>;
}
