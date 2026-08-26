'use client';

const NAV_ITEMS=[
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0B8F7C',wash:'#DDF5EE',icon:'♥'},
  {label:'Health Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#7C3AED',wash:'#EEE5FF',icon:'◎'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#2563EB',wash:'#E4EDFF',icon:'▣'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#0F766E',wash:'#DDF3EF',icon:'⌕'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#0284C7',wash:'#E1F3FC',icon:'▤'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#C2410C',wash:'#FCEBDD',icon:'₹'},
] as const;

const MY_HEALTH_ARTWORK='/images/my-health/my-health-overview.png';

export default function AudienceJourneys(){
  const goto=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});

  return <section className="journey-root" id="platform-tour">
    <style>{`
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff}
      .journey-nav-wrap{max-width:1380px;margin:0 auto;padding:34px 28px 0}
      .journey-nav-title{text-align:center;color:#0B7E72;font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;margin-bottom:15px}
      .journey-nav{padding:14px;border-radius:22px;background:linear-gradient(120deg,#064E49,#0B7168);display:grid;grid-template-columns:repeat(6,1fr);gap:10px;box-shadow:0 16px 34px rgba(5,73,67,.14)}
      .journey-pill{min-height:96px;border:0;border-radius:16px;padding:14px 13px;text-align:left;display:flex;align-items:center;gap:11px;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}
      .journey-pill:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(0,0,0,.12)}
      .journey-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:0 0 auto;background:rgba(255,255,255,.82);font-size:19px;font-weight:900}
      .journey-pill b{display:block;font-size:14px;line-height:1.25;color:#10243C}
      .journey-pill span:last-child{display:block;margin-top:4px;font-size:12px;line-height:1.3;color:#405D70}

      .myhealth-section{padding:72px 22px 86px;background:#fff;scroll-margin-top:94px}
      .myhealth-artwork-shell{width:min(100%,1664px);margin:0 auto;overflow:hidden;background:#fff}
      .myhealth-artwork{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:contain;object-position:center center}

      @media(max-width:1080px){
        .journey-nav{grid-template-columns:repeat(3,1fr)}
        .myhealth-section{padding:58px 18px 72px}
      }
      @media(max-width:720px){
        .journey-nav-wrap{padding:24px 14px 0}
        .journey-nav{grid-template-columns:1fr 1fr}
        .journey-pill{min-height:84px}
        .myhealth-section{padding:44px 8px 58px}
      }
      @media(max-width:480px){
        .journey-nav{grid-template-columns:1fr}
        .myhealth-section{padding-left:0;padding-right:0}
      }
    `}</style>

    <div className="journey-nav-wrap">
      <div className="journey-nav-title">Explore HealthConnect</div>
      <div className="journey-nav">
        {NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}>{item.icon}</span><span><b>{item.label}</b><span>{item.sub}</span></span></button>)}
      </div>
    </div>

    <section className="myhealth-section" id="my-health-story" aria-label="My Health Patient Dashboard">
      <div className="myhealth-artwork-shell">
        <img className="myhealth-artwork" src={MY_HEALTH_ARTWORK} alt="My Health Patient Dashboard: health score, appointments, medication tracking, health communities, connected care, health history and privacy in one HealthConnect journey" />
      </div>
    </section>
  </section>;
}
