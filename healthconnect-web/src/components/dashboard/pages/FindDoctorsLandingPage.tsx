'use client';

import { useRouter } from 'next/navigation';

const C={card:'#FFFFFF',border:'#D8E2EE',navy:'#10213B',text:'#34475E',muted:'#61758D',blue:'#2563EB',blueDark:'#1D4ED8',teal:'#0D9488',tealDark:'#0F766E'};

export default function FindDoctorsLandingPage(){
  const router=useRouter();

  return <div className="hc-find-care-page" style={{fontFamily:"'Plus Jakarta Sans','Inter',sans-serif"}}>
    <section style={{
      background:'linear-gradient(125deg,#0F766E 0%,#0E7490 48%,#1D4ED8 100%)',
      borderRadius:22,
      padding:'34px 38px',
      marginBottom:24,
      color:'#FFFFFF',
      boxShadow:'0 14px 34px rgba(15,118,110,.18)',
      border:'1px solid rgba(255,255,255,.16)',
      position:'relative',
      overflow:'hidden',
    }}>
      <div aria-hidden style={{position:'absolute',right:-70,top:-95,width:260,height:260,borderRadius:'50%',background:'rgba(255,255,255,.08)'}}/>
      <div aria-hidden style={{position:'absolute',right:130,bottom:-105,width:220,height:220,borderRadius:'50%',background:'rgba(255,255,255,.055)'}}/>
      <div style={{position:'relative',zIndex:1}}>
        <div style={{fontSize:10.5,fontWeight:850,color:'#D9FFFA',textTransform:'uppercase',letterSpacing:'.14em'}}>HealthConnect India · Care Discovery</div>
        <h1 style={{fontSize:'clamp(28px,3vw,36px)',lineHeight:1.16,fontWeight:900,margin:'10px 0 10px',color:'#FFFFFF',letterSpacing:'-.025em'}}>Find the right care for you</h1>
        <p style={{fontSize:14,lineHeight:1.7,color:'#EDF8FF',maxWidth:830,margin:0,fontWeight:520}}>Choose a verified doctor when you know the specialist you need, or find a verified hospital when departments, facilities, insurance, government schemes or hospital-specific OPD availability matter.</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:18}}>
          {['Verified providers','Doctor & hospital discovery','Hospital-specific OPD'].map(x=><span key={x} style={{fontSize:10.5,fontWeight:750,padding:'5px 9px',borderRadius:999,background:'rgba(255,255,255,.13)',border:'1px solid rgba(255,255,255,.22)',color:'#FFFFFF'}}>{x}</span>)}
        </div>
      </div>
    </section>

    <div className="hc-find-care-grid" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:18,marginBottom:24}}>
      <button onClick={()=>router.push('/doctors')} style={{...card,textAlign:'left',cursor:'pointer'}} aria-label="Browse verified doctors">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div style={{width:52,height:52,borderRadius:15,background:'#EEF4FF',display:'grid',placeItems:'center',fontSize:27,border:'1px solid #DCE8FF'}}>🩺</div>
          <span style={{fontSize:10.5,fontWeight:800,color:C.blue,background:'#EFF6FF',border:'1px solid #DBEAFE',padding:'5px 8px',borderRadius:999}}>DOCTORS</span>
        </div>
        <h2 style={{fontSize:22,color:C.navy,margin:'18px 0 7px'}}>Find Doctors</h2>
        <p style={{fontSize:13.2,color:C.text,lineHeight:1.65,margin:'0 0 18px'}}>Browse verified specialists, compare experience and consultation modes, review availability and choose the clinician who fits your care need.</p>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>{['Specialty','City','Rating','Video consult'].map(x=><span key={x} style={chip}>{x}</span>)}</div>
        <span style={{fontSize:13,fontWeight:850,color:C.blueDark}}>Browse verified doctors →</span>
      </button>

      <button onClick={()=>router.push('/hospitals')} style={{...card,textAlign:'left',cursor:'pointer'}} aria-label="Browse verified hospitals and clinics">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div style={{width:52,height:52,borderRadius:15,background:'#ECFDF8',display:'grid',placeItems:'center',fontSize:27,border:'1px solid #CFF7E9'}}>🏥</div>
          <span style={{fontSize:10.5,fontWeight:800,color:C.tealDark,background:'#F0FDFA',border:'1px solid #CCFBF1',padding:'5px 8px',borderRadius:999}}>HOSPITALS & CLINICS</span>
        </div>
        <h2 style={{fontSize:22,color:C.navy,margin:'18px 0 7px'}}>Find Hospitals & Clinics</h2>
        <p style={{fontSize:13.2,color:C.text,lineHeight:1.65,margin:'0 0 18px'}}>Search verified hospitals by department, services, facilities, emergency care, insurance, government schemes and real hospital OPD.</p>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>{['Facilities','Departments','Insurance','Hospital OPD'].map(x=><span key={x} style={{...chip,background:'#F0FDFA',color:C.tealDark,borderColor:'#CCFBF1'}}>{x}</span>)}</div>
        <span style={{fontSize:13,fontWeight:850,color:C.teal}}>Browse verified hospitals →</span>
      </button>
    </div>

    <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22,boxShadow:'0 5px 18px rgba(15,23,42,.045)'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div>
          <h2 style={{fontSize:17,color:C.navy,margin:'0 0 5px'}}>Not sure where to start?</h2>
          <p style={{fontSize:12.5,color:C.muted,margin:'0 0 14px'}}>HealthConnect keeps doctor discovery and hospital discovery separate, but connects both through the same patient journey.</p>
        </div>
      </div>
      <div className="hc-care-help-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12}}>
        <div style={help}><b style={{color:C.navy}}>Choose a Doctor</b><span>When you know the specialty or want a specific clinician.</span></div>
        <div style={help}><b style={{color:C.navy}}>Choose a Hospital</b><span>When you need a facility, department, emergency service, insurance network or government scheme.</span></div>
        <div style={help}><b style={{color:C.navy}}>Book Hospital OPD</b><span>Book an affiliated doctor only in the hospital-specific slots published by that verified hospital.</span></div>
      </div>
    </section>

    <style>{`
      .hc-find-care-grid > button{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
      .hc-find-care-grid > button:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(15,23,42,.09)!important;border-color:#B9CBE0!important}
      @media(max-width:760px){.hc-find-care-grid,.hc-care-help-grid{grid-template-columns:1fr!important}}
    `}</style>
  </div>;
}

const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:26,boxShadow:'0 5px 18px rgba(15,23,42,.045)',fontFamily:'inherit'};
const chip:React.CSSProperties={fontSize:11,fontWeight:750,padding:'5px 8px',borderRadius:999,background:'#EFF6FF',color:'#1D4ED8',border:'1px solid #DBEAFE'};
const help:React.CSSProperties={background:'#F7F9FC',border:`1px solid ${C.border}`,borderRadius:13,padding:14,display:'grid',gap:6,fontSize:12,color:C.text,lineHeight:1.55};
