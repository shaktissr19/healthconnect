'use client';

import { useRouter } from 'next/navigation';

const C={bg:'#EAF3FB',card:'#FFFFFF',border:'#CFE0EE',navy:'#0A1628',text:'#334155',muted:'#64748B',blue:'#2563EB',teal:'#0D9488'};

export default function FindDoctorsLandingPage(){
  const router=useRouter();
  return <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
    <section style={{background:'linear-gradient(135deg,#0D3349 0%,#0F4C6B 55%,#1A3A6B 100%)',borderRadius:20,padding:'34px 38px',marginBottom:24,color:'#fff',boxShadow:'0 10px 32px rgba(13,51,73,.28)'}}>
      <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,.62)',textTransform:'uppercase',letterSpacing:'.12em'}}>HealthConnect India · Care Discovery</div>
      <h1 style={{fontSize:29,fontWeight:900,margin:'9px 0 9px'}}>Find the right care, not just a doctor</h1>
      <p style={{fontSize:13.5,lineHeight:1.65,color:'rgba(230,242,255,.88)',maxWidth:720,margin:0}}>Search verified doctors when you know the specialist you need, or search verified hospitals when facilities, departments, insurance, government schemes or hospital-specific OPD matter.</p>
    </section>

    <div className="hc-find-care-grid" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:18,marginBottom:24}}>
      <button onClick={()=>router.push('/doctors')} style={{...card,textAlign:'left',cursor:'pointer'}}>
        <div style={{width:52,height:52,borderRadius:15,background:'#EFF6FF',display:'grid',placeItems:'center',fontSize:27}}>🩺</div>
        <h2 style={{fontSize:22,color:C.navy,margin:'18px 0 7px'}}>Find Doctors</h2>
        <p style={{fontSize:13,color:C.text,lineHeight:1.6,margin:'0 0 18px'}}>Browse verified specialists, compare experience and consultation modes, read reviews and book directly.</p>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>{['Specialty','City','Rating','Video consult'].map(x=><span key={x} style={chip}>{x}</span>)}</div>
        <span style={{fontSize:13,fontWeight:850,color:C.blue}}>Browse verified doctors →</span>
      </button>

      <button onClick={()=>router.push('/hospitals')} style={{...card,textAlign:'left',cursor:'pointer'}}>
        <div style={{width:52,height:52,borderRadius:15,background:'#F0FDFA',display:'grid',placeItems:'center',fontSize:27}}>🏥</div>
        <h2 style={{fontSize:22,color:C.navy,margin:'18px 0 7px'}}>Find Hospitals & Clinics</h2>
        <p style={{fontSize:13,color:C.text,lineHeight:1.6,margin:'0 0 18px'}}>Search verified hospitals by department, services, facilities, emergency care, insurance and government schemes.</p>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>{['Facilities','Departments','Insurance','Hospital OPD'].map(x=><span key={x} style={{...chip,background:'#F0FDFA',color:'#0F766E',borderColor:'#CCFBF1'}}>{x}</span>)}</div>
        <span style={{fontSize:13,fontWeight:850,color:C.teal}}>Browse verified hospitals →</span>
      </button>
    </div>

    <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22,boxShadow:'0 3px 12px rgba(15,23,42,.05)'}}>
      <h2 style={{fontSize:17,color:C.navy,margin:'0 0 12px'}}>Which should I choose?</h2>
      <div className="hc-care-help-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12}}>
        <div style={help}><b>Choose a Doctor</b><span>When you know the specialty or want a specific clinician.</span></div>
        <div style={help}><b>Choose a Hospital</b><span>When you need a facility such as MRI, dialysis, ICU, emergency or a specific department.</span></div>
        <div style={help}><b>Hospital OPD</b><span>Book a doctor only in the hospital-specific slots configured by that verified hospital.</span></div>
      </div>
    </section>
    <style>{`@media(max-width:760px){.hc-find-care-grid,.hc-care-help-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:26,boxShadow:'0 4px 16px rgba(15,23,42,.06)',fontFamily:'inherit'};
const chip:React.CSSProperties={fontSize:11,fontWeight:750,padding:'5px 8px',borderRadius:999,background:'#EFF6FF',color:'#1D4ED8',border:'1px solid #DBEAFE'};
const help:React.CSSProperties={background:C.bg,border:`1px solid ${C.border}`,borderRadius:13,padding:14,display:'grid',gap:6,fontSize:12,color:C.text,lineHeight:1.5};
