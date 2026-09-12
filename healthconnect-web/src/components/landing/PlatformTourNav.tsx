'use client';

const ITEMS = [
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0F8F83',wash:'#DDF5F0',icon:'heart'},
  {label:'Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#7357D8',wash:'#EEE8FA',icon:'community'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#315FEA',wash:'#E7EDFF',icon:'doctor'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#D66B42',wash:'#F9E8DF',icon:'search'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#1686A8',wash:'#E0F1F6',icon:'book'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#B7791F',wash:'#F8EFCF',icon:'rupee'},
] as const;

function Icon({kind,size=18}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='heart') return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
  if(kind==='community') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='doctor') return <svg {...common}><path d="M8 3v4a4 4 0 0 0 8 0V3M12 11v10M8 15h8M5 21h14"/></svg>;
  if(kind==='search') return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if(kind==='book') return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if(kind==='rupee') return <svg {...common}><path d="M7 5h10M7 9h10M8 5c5 0 7 2 7 4s-2 4-7 4l8 7"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function PlatformTourNav(){
  const go=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  return <section className="platform-tour-nav" id="platform-tour" aria-label="Explore HealthConnect">
    <style>{`
      .platform-tour-nav{background:#D6E0E8;padding:18px 22px 14px;font-family:'DM Sans',Arial,sans-serif}.ptn-shell{width:min(100%,1360px);margin:0 auto}.ptn-title{text-align:center;color:#17354A;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}.ptn-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:9px;border-radius:18px;background:#17384A;box-shadow:0 12px 28px rgba(17,48,64,.12)}.ptn-item{min-height:62px;border:0;border-radius:12px;padding:9px 10px;display:flex;align-items:center;gap:9px;text-align:left;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}.ptn-item:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.11)}.ptn-item:focus-visible{outline:3px solid rgba(255,255,255,.82);outline-offset:2px}.ptn-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.84);flex:0 0 auto}.ptn-copy b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.7px;line-height:1.18;color:#10243C}.ptn-copy small{display:block;margin-top:2px;font-size:9.5px;line-height:1.22;color:#526B7B}@media(max-width:1080px){.ptn-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.platform-tour-nav{padding:14px 12px 12px}.ptn-grid{grid-template-columns:1fr 1fr}.ptn-item{min-height:58px}}@media(max-width:430px){.ptn-grid{grid-template-columns:1fr}}
    `}</style>
    <div className="ptn-shell">
      <div className="ptn-title">Explore HealthConnect</div>
      <div className="ptn-grid">
        {ITEMS.map(item=><button key={item.label} type="button" className="ptn-item" style={{background:item.wash}} onClick={()=>go(item.target)}><span className="ptn-icon" style={{color:item.accent}}><Icon kind={item.icon}/></span><span className="ptn-copy"><b>{item.label}</b><small>{item.sub}</small></span></button>)}
      </div>
    </div>
  </section>;
}
