'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';

const C = {
  pageBg:      '#F0F4FF',
  heroBg:      'linear-gradient(135deg,#0D1B4B 0%,#0C3460 30%,#0A4080 60%,#0C6B82 85%,#0D9488 100%)',
  cardBg:      '#FFFFFF',
  cardBorder:  '#E8EDF8',
  textPrimary: '#0C1A3A',
  textSecondary:'#334155',
  textMuted:   '#64748B',
  blue:        '#2563EB',
  blueBg:      'rgba(37,99,235,0.07)',
  blueBorder:  'rgba(37,99,235,0.18)',
  teal:        '#0D9488',
};

const TYPE_COLOR: Record<string,string> = {
  'Government':        '#1D4ED8',
  'Private':           '#B45309',
  'Trust/NGO':         '#15803D',
  'Teaching Hospital': '#6D28D9',
};

const HOSPITALS = [
  { id:'h01', name:'AIIMS New Delhi',              city:'Delhi',      area:'Ansari Nagar',      type:'Government',        rating:4.8, reviews:8900,  beds:2478, doctors:1200, est:1956, specs:['Cardiology','Neurology','Oncology','Orthopedics','Transplant','Pediatrics'],  facs:['ICU','NICU','Dialysis','Cath Lab','MRI','PET Scan'],         emergency:true,  teleconsult:true,  ayushman:true,  nabh:true,  about:'Premier central government medical institute offering world-class tertiary care.' },
  { id:'h02', name:'Apollo Hospitals Chennai',     city:'Chennai',    area:'Greams Road',       type:'Private',           rating:4.7, reviews:5400,  beds:500,  doctors:350,  est:1983, specs:['Cardiology','Transplant','Oncology','Neurology','Spine'],                      facs:['ICU','Robotic Surgery','Cath Lab','PET Scan','BMT'],         emergency:true,  teleconsult:true,  ayushman:false, nabh:true,  about:'Asia\'s foremost integrated healthcare provider with clinical excellence.' },
  { id:'h03', name:'Narayana Health City',         city:'Bangalore',  area:'Bommasandra',       type:'Private',           rating:4.9, reviews:6700,  beds:1000, doctors:400,  est:2000, specs:['Cardiac Surgery','Pediatrics','Trauma','Oncology','Neurology'],                facs:['CTVS','Cath Lab','PICU','NICU','BMT'],                       emergency:true,  teleconsult:true,  ayushman:true,  nabh:true,  about:'World\'s most cost-effective cardiac care. 50+ open heart surgeries daily.' },
  { id:'h04', name:'Kokilaben Ambani Hospital',    city:'Mumbai',     area:'Andheri West',      type:'Private',           rating:4.8, reviews:5900,  beds:700,  doctors:300,  est:2009, specs:['Neurosurgery','Cardiac','Liver Transplant','Oncology'],                        facs:['Robotic Surgery','da Vinci','ICU','PET Scan','Proton'],      emergency:true,  teleconsult:true,  ayushman:false, nabh:true,  about:'Harbours some of India\'s most eminent specialists across all disciplines.' },
  { id:'h05', name:'Medanta The Medicity',         city:'Gurugram',   area:'Sector 38',         type:'Private',           rating:4.7, reviews:4800,  beds:1250, doctors:500,  est:2009, specs:['Cardiology','Orthopedics','Cancer','Neurology','Urology'],                     facs:['ICU','Cath Lab','Robotic Surgery','CyberKnife'],             emergency:true,  teleconsult:true,  ayushman:false, nabh:true,  about:'Multi-super-specialty institute with 45 departments, founded by Dr Naresh Trehan.' },
  { id:'h06', name:'CMC Vellore',                  city:'Vellore',    area:'Ida Scudder Road',  type:'Trust/NGO',         rating:4.9, reviews:11200, beds:2600, doctors:1000, est:1900, specs:['Cardiology','Neurology','Hematology','Orthopedics','Nephrology'],               facs:['ICU','NICU','Dialysis','BMT','PET Scan'],                    emergency:true,  teleconsult:true,  ayushman:true,  nabh:true,  about:'One of the world\'s best hospitals — exceptional care at accessible cost.' },
  { id:'h07', name:'Tata Memorial Hospital',       city:'Mumbai',     area:'Parel',             type:'Government',        rating:4.9, reviews:9100,  beds:600,  doctors:400,  est:1941, specs:['Oncology','Surgical Oncology','Radiation','Pediatric Cancer'],                 facs:['Proton Therapy','BMT','PET Scan','Gamma Knife'],             emergency:true,  teleconsult:true,  ayushman:true,  nabh:true,  about:'India\'s premier cancer treatment and research centre.' },
  { id:'h08', name:'PGIMER Chandigarh',            city:'Chandigarh', area:'Sector 12',         type:'Government',        rating:4.6, reviews:7200,  beds:1946, doctors:900,  est:1962, specs:['Cardiology','Nephrology','Neurology','Gastroenterology'],                       facs:['ICU','Dialysis','BMT','PET Scan','Cath Lab'],                emergency:true,  teleconsult:true,  ayushman:true,  nabh:false, about:'National Institute under Ministry of Health — advanced research and tertiary care.' },
  { id:'h09', name:'Max Super Specialty Hospital', city:'Delhi',      area:'Saket',             type:'Private',           rating:4.7, reviews:4100,  beds:500,  doctors:280,  est:2006, specs:['Oncology','Cardiology','Spine','Renal','Liver'],                               facs:['ICU','NICU','Robotic Surgery','Tomotherapy'],                emergency:true,  teleconsult:true,  ayushman:false, nabh:true,  about:'Comprehensive cancer and cardiac care with internationally trained specialists.' },
  { id:'h10', name:'Fortis Hospital Bangalore',    city:'Bangalore',  area:'Bannerghatta Road', type:'Private',           rating:4.6, reviews:3200,  beds:350,  doctors:220,  est:2001, specs:['Orthopedics','Neurology','Gastroenterology','Renal'],                          facs:['ICU','NICU','Dialysis','MRI','Cath Lab'],                    emergency:true,  teleconsult:false, ayushman:false, nabh:true,  about:'Compassionate care with cutting-edge technology across Bangalore.' },
  { id:'h11', name:'Amrita Institute',             city:'Kochi',      area:'Elamakkara',        type:'Teaching Hospital', rating:4.7, reviews:4200,  beds:1350, doctors:450,  est:1998, specs:['Cardiology','Neurology','Transplant','Oncology'],                              facs:['ICU','NICU','Cath Lab','PET Scan','Robotic Surgery'],        emergency:true,  teleconsult:true,  ayushman:true,  nabh:true,  about:'State-of-the-art multi-specialty hospital with 30+ super specialty departments.' },
  { id:'h12', name:'Manipal Hospital',             city:'Bangalore',  area:'HAL Airport Road',  type:'Private',           rating:4.6, reviews:2800,  beds:620,  doctors:260,  est:1991, specs:['Neurology','Orthopedics','Transplant','Cardiology'],                           facs:['ICU','MRI','Cath Lab','Dialysis'],                           emergency:true,  teleconsult:false, ayushman:false, nabh:true,  about:'Pioneer in solid organ transplantation and neurosciences in South India.' },
  { id:'h13', name:'Ruby Hall Clinic',             city:'Pune',       area:'Sassoon Road',      type:'Private',           rating:4.5, reviews:2900,  beds:550,  doctors:200,  est:1959, specs:['Cardiology','Orthopedics','Neurology','Oncology'],                             facs:['ICU','Cath Lab','MRI','Dialysis'],                           emergency:true,  teleconsult:false, ayushman:false, nabh:true,  about:'Pune\'s most trusted multi-specialty hospital with 60+ years of excellence.' },
  { id:'h14', name:'NIMHANS Bangalore',            city:'Bangalore',  area:'Hosur Road',        type:'Government',        rating:4.7, reviews:5100,  beds:820,  doctors:300,  est:1925, specs:['Psychiatry','Neurology','Neurosurgery','Clinical Psychology'],                 facs:['ICU','EEG Lab','MRI','De-addiction Center'],                 emergency:true,  teleconsult:true,  ayushman:true,  nabh:false, about:'India\'s premier neuropsychiatric centre.' },
  { id:'h15', name:'Sanjay Gandhi PGI Lucknow',   city:'Lucknow',    area:'Raebareli Road',    type:'Government',        rating:4.5, reviews:7400,  beds:1400, doctors:600,  est:1983, specs:['Nephrology','Gastroenterology','Cardiology','Endocrinology'],                  facs:['ICU','Dialysis','Cath Lab','BMT'],                           emergency:true,  teleconsult:true,  ayushman:true,  nabh:false, about:'Northern India\'s leading post-graduate institute for complex tertiary care.' },
  { id:'h16', name:'Lilavati Hospital',            city:'Mumbai',     area:'Bandra West',       type:'Trust/NGO',         rating:4.5, reviews:3600,  beds:323,  doctors:180,  est:1978, specs:['Cardiology','Neurology','Orthopedics','Gastroenterology'],                    facs:['ICU','Cath Lab','MRI','Dialysis'],                           emergency:true,  teleconsult:false, ayushman:false, nabh:true,  about:'Leading charitable hospital serving Mumbai\'s western suburbs since 1978.' },
  { id:'h17', name:'Rajiv Gandhi Govt Hospital',   city:'Chennai',    area:'Park Town',         type:'Government',        rating:4.2, reviews:6800,  beds:2600, doctors:700,  est:1934, specs:['General Medicine','Surgery','Orthopedics','Gynecology'],                      facs:['ICU','Dialysis','Blood Bank','Trauma Center'],               emergency:true,  teleconsult:false, ayushman:true,  nabh:false, about:'Tamil Nadu\'s largest government hospital serving millions annually.' },
  { id:'h18', name:'Wockhardt Hospital',           city:'Mumbai',     area:'South Mumbai',      type:'Private',           rating:4.5, reviews:2300,  beds:350,  doctors:160,  est:1989, specs:['Orthopedics','Cardiology','Gynecology','Neurology'],                           facs:['ICU','Cath Lab','MRI','Dialysis'],                           emergency:true,  teleconsult:true,  ayushman:false, nabh:true,  about:'Internationally accredited hospital known for orthopedics and cardiac care.' },
];

const CITIES = ['All Cities','Mumbai','Delhi','Bangalore','Chennai','Gurugram','Chandigarh','Pune','Kochi','Lucknow','Vellore'];
const TYPES  = ['All Types','Government','Private','Trust/NGO','Teaching Hospital'];
const SPECS  = ['All Specialties','Cardiology','Oncology','Neurology','Orthopedics','Transplant','Psychiatry','Nephrology','Gastroenterology','Pediatrics'];
const SORTS  = ['Best Rated','Most Reviews','Most Beds','Established'];

const HERO_FACTS = [
  { tag:'PLATFORM FACT', stat:'340+', sub:'Partner hospitals nationwide',    quote:'"Found a NABH-accredited hospital near me instantly. Booked OPD without any calls."',     author:'Meena S., Pune',     role:'Patient · Saved ₹1,200 in travel' },
  { tag:'AYUSHMAN',      stat:'120+', sub:'Ayushman Bharat empanelled',       quote:'"HealthConnect helped us find an empanelled hospital for cardiac surgery — zero cost."',   author:'Ravi K., Lucknow',   role:'Caregiver · Cardiac Surgery' },
  { tag:'PATIENT STORY', stat:'98%',  sub:'OPD booking success rate',         quote:'"The ICU filter saved crucial time during an emergency. Found available beds instantly."', author:'Dr. Priya M., Delhi', role:'Doctor · Emergency Care' },
];

// ── Horizontal hospital card — Practo/Apollo style ────────────────────────────
function HospitalCard({ h, onSelect }: { h: typeof HOSPITALS[0]; onSelect: (h: typeof HOSPITALS[0]) => void }) {
  const [hov, setHov] = useState(false);
  const tc = TYPE_COLOR[h.type] || C.textMuted;
  // Letter avatar — first 2 initials of hospital name
  const initials = h.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSelect(h)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? '#BFDBFE' : C.cardBorder}`,
        borderLeft: `3px solid ${hov ? C.blue : tc}`,
        borderRadius: 12,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hov ? '0 4px 20px rgba(37,99,235,0.08)' : '0 1px 3px rgba(12,26,58,0.05)',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
      }}>

      {/* Letter avatar */}
      <div style={{ width: 46, height: 46, borderRadius: 10, background: `${tc}15`, border: `1.5px solid ${tc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: tc }}>
        {initials}
      </div>

      {/* Info block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name */}
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14.5, color: C.textPrimary, lineHeight: 1.3, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
        {/* Meta — single muted line, type colored only */}
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>{h.area}, {h.city}</span>
          <span style={{ color: '#CBD5E1' }}>·</span>
          <span style={{ color: tc, fontWeight: 600 }}>{h.type}</span>
          <span style={{ color: '#CBD5E1' }}>·</span>
          <span>{h.beds.toLocaleString('en-IN')} beds</span>
          {h.emergency && <><span style={{ color: '#CBD5E1' }}>·</span><span style={{ color: '#EF4444', fontWeight: 500 }}>Emergency</span></>}
        </div>
        {/* Specialties */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {h.specs.slice(0, 3).map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: '#475569', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 20, padding: '2px 9px', fontWeight: 500 }}>{s}</span>
          ))}
          {h.specs.length > 3 && <span style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>+{h.specs.length - 3}</span>}
        </div>
      </div>

      {/* Right — rating + button */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#B45309' }}>★</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: '#92400E' }}>{h.rating.toFixed(1)}</span>
          <span style={{ fontSize: 11, color: C.textMuted }}>({h.reviews.toLocaleString('en-IN')})</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onSelect(h); }}
          style={{ background: hov ? 'linear-gradient(135deg,#1A6BB5,#2E86D4)' : '#fff', border: `1.5px solid ${hov ? 'transparent' : '#BFDBFE'}`, color: hov ? '#fff' : C.blue, borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', transition: 'all 0.18s', whiteSpace: 'nowrap', boxShadow: hov ? '0 3px 10px rgba(37,99,235,0.22)' : 'none' }}>
          Book OPD →
        </button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function HospitalModal({ h, onClose }: { h: typeof HOSPITALS[0]; onClose: () => void }) {
  const [tab, setTab] = useState<'overview'|'facilities'|'specialties'>('overview');
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  const tc = TYPE_COLOR[h.type] || C.blue;
  const initials = h.name.split(' ').slice(0,2).map((w: string)=>w[0]).join('').toUpperCase();
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(8,20,34,0.6)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, maxWidth:820, width:'100%', maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 40px 100px rgba(8,20,34,0.28)' }}>

        {/* Header */}
        <div style={{ background: C.heroBg, padding:'28px 32px 0', position:'relative', flexShrink:0 }}>
          <button onClick={onClose}
            style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', color:'#fff', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.22)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.12)'}>×</button>

          <div style={{ display:'flex', gap:18, alignItems:'flex-start', marginBottom:22 }}>
            <div style={{ width:60, height:60, borderRadius:14, background:`${tc}25`, border:`2px solid ${tc}60`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-heading)', fontWeight:900, fontSize:18, color:'#fff', flexShrink:0 }}>{initials}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:'var(--font-heading)', marginBottom:5, lineHeight:1.2 }}>{h.name}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginBottom:10 }}>📍 {h.area}, {h.city} &nbsp;·&nbsp; Est. {h.est} &nbsp;·&nbsp; {h.beds.toLocaleString('en-IN')} beds &nbsp;·&nbsp; {h.doctors}+ doctors</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {h.ayushman   && <span style={{ fontSize:11, fontWeight:600, color:'#4ADE80', background:'rgba(74,222,128,0.15)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:20, padding:'3px 10px' }}>🏛 Ayushman Bharat</span>}
                {h.nabh       && <span style={{ fontSize:11, fontWeight:600, color:'#C4B5FD', background:'rgba(196,181,253,0.15)', border:'1px solid rgba(196,181,253,0.3)', borderRadius:20, padding:'3px 10px' }}>NABH Accredited</span>}
                {h.emergency  && <span style={{ fontSize:11, fontWeight:600, color:'#FCA5A5', background:'rgba(252,165,165,0.15)', border:'1px solid rgba(252,165,165,0.25)', borderRadius:20, padding:'3px 10px' }}>🚨 24/7 Emergency</span>}
                {h.teleconsult&& <span style={{ fontSize:11, fontWeight:600, color:'#5EEAD4', background:'rgba(94,234,212,0.15)', border:'1px solid rgba(94,234,212,0.3)', borderRadius:20, padding:'3px 10px' }}>📱 Teleconsult</span>}
                <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:20, padding:'3px 10px' }}>{h.type}</span>
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.18)', borderRadius:12, padding:'10px 16px', textAlign:'center', flexShrink:0 }}>
              <div style={{ fontFamily:'var(--font-heading)', fontWeight:900, fontSize:22, color:'#FDE68A', lineHeight:1 }}>★ {h.rating.toFixed(1)}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4 }}>{h.reviews.toLocaleString('en-IN')} reviews</div>
            </div>
          </div>

          <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
            {(['overview','facilities','specialties'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'13px', border:'none', background:tab===t?'#F8FAFF':'transparent', color:tab===t?C.blue:'rgba(255,255,255,0.55)', fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, cursor:'pointer', borderRadius:tab===t?'10px 10px 0 0':0, transition:'all 0.2s', textTransform:'capitalize' }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Body — light bg, fixed scroll area */}
        <div style={{ background:'#F8FAFF', flex:1, overflowY:'auto', minHeight:300 }}>
          <div style={{ padding:'28px 32px' }}>

            {tab==='overview' && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
                  {[
                    { n:h.beds.toLocaleString('en-IN'), l:'Total Beds',    icon:'🛏' },
                    { n:`${h.doctors}+`,                l:'Doctors',       icon:'👨‍⚕️' },
                    { n:`${h.est}`,                      l:'Established',   icon:'🏛' },
                    { n:h.type.split('/')[0],            l:'Hospital Type', icon:'🏥' },
                  ].map(s => (
                    <div key={s.l} style={{ background:'#fff', border:'1px solid #E2EBF8', borderRadius:12, padding:'16px 12px', textAlign:'center', boxShadow:'0 1px 3px rgba(12,26,58,0.04)' }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                      <div style={{ fontFamily:'var(--font-heading)', fontWeight:900, fontSize:19, color:C.textPrimary, lineHeight:1 }}>{s.n}</div>
                      <div style={{ fontSize:11, color:C.textMuted, marginTop:4, fontWeight:500 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#fff', border:'1px solid #E2EBF8', borderRadius:12, padding:'20px 22px', marginBottom:18 }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:C.blue, letterSpacing:'0.09em', marginBottom:8 }}>ABOUT</div>
                  <p style={{ fontSize:14.5, color:C.textSecondary, lineHeight:1.85, margin:0 }}>{h.about}</p>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#15803D', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:20, padding:'5px 14px' }}>✓ OPD Booking</span>
                  {h.emergency   && <span style={{ fontSize:12, fontWeight:600, color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:20, padding:'5px 14px' }}>🚨 24/7 Emergency</span>}
                  {h.teleconsult && <span style={{ fontSize:12, fontWeight:600, color:C.teal, background:'#F0FDFA', border:'1px solid #CCFBF1', borderRadius:20, padding:'5px 14px' }}>📱 Teleconsult</span>}
                  {h.nabh        && <span style={{ fontSize:12, fontWeight:600, color:'#6D28D9', background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:20, padding:'5px 14px' }}>NABH Accredited</span>}
                </div>
              </>
            )}

            {tab==='facilities' && (
              <>
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, letterSpacing:'0.08em', marginBottom:16 }}>AVAILABLE FACILITIES & EQUIPMENT</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {h.facs.map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', background:'#fff', border:'1px solid #E2EBF8', borderRadius:12, boxShadow:'0 1px 3px rgba(12,26,58,0.04)' }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:C.blueBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ color:C.blue, fontWeight:800, fontSize:12 }}>✦</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:C.textSecondary }}>{f}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab==='specialties' && (
              <>
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, letterSpacing:'0.08em', marginBottom:16 }}>MEDICAL SPECIALTIES & DEPARTMENTS</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {h.specs.map((s,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#fff', border:'1px solid #E2EBF8', borderRadius:12, boxShadow:'0 1px 3px rgba(12,26,58,0.04)' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:tc, flexShrink:0, display:'inline-block' }}/>
                      <span style={{ fontSize:13.5, fontWeight:600, color:C.textSecondary }}>{s}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 32px', borderTop:'1px solid #E2EBF8', background:'#fff', display:'flex', gap:12, flexShrink:0 }}>
          <button style={{ flex:1, background:'none', border:'1.5px solid #E2EBF8', color:C.textSecondary, borderRadius:10, padding:'13px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-heading)' }}>📞 Call Hospital</button>
          <button style={{ flex:2.5, background:'linear-gradient(135deg,#1A6BB5,#2E86D4)', color:'#fff', border:'none', borderRadius:10, padding:'13px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-heading)', boxShadow:'0 4px 16px rgba(37,99,235,0.28)' }}>Book OPD Appointment →</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HospitalsPage() {
  const router = useRouter();
  const [search,      setSearch]      = useState('');
  const [city,        setCity]        = useState('All Cities');
  const [type,        setType]        = useState('All Types');
  const [spec,        setSpec]        = useState('All Specialties');
  const [sortBy,      setSortBy]      = useState('Best Rated');
  const [ayushman,    setAyushman]    = useState(false);
  const [emergency,   setEmergency]   = useState(false);
  const [nabh,        setNabh]        = useState(false);
  const [teleconsult, setTeleconsult] = useState(false);
  const [selected,    setSelected]    = useState<typeof HOSPITALS[0]|null>(null);
  const [shown,       setShown]       = useState(6);
  const [factIdx,     setFactIdx]     = useState(0);
  const [factPct,     setFactPct]     = useState(0);

  useEffect(() => {
    let elapsed = 0; const dur = 6000, tick = 500;
    const t = setInterval(() => {
      elapsed += tick; setFactPct(Math.min((elapsed/dur)*100,100));
      if (elapsed >= dur) { setFactIdx(i=>(i+1)%HERO_FACTS.length); elapsed=0; setFactPct(0); }
    }, tick);
    return () => clearInterval(t);
  }, [factIdx]);

  useEffect(() => { setShown(6); }, [search,city,type,spec,ayushman,emergency,nabh,teleconsult,sortBy]);

  const fact = HERO_FACTS[factIdx];
  const filtered = HOSPITALS.filter(h => {
    if (search) { const q=search.toLowerCase(); if (!h.name.toLowerCase().includes(q)&&!h.city.toLowerCase().includes(q)&&!h.area.toLowerCase().includes(q)&&!h.specs.some(s=>s.toLowerCase().includes(q))) return false; }
    if (city!=='All Cities'&&h.city!==city) return false;
    if (type!=='All Types'&&h.type!==type) return false;
    if (spec!=='All Specialties'&&!h.specs.some(s=>s.toLowerCase().includes(spec.toLowerCase()))) return false;
    if (ayushman&&!h.ayushman) return false;
    if (emergency&&!h.emergency) return false;
    if (nabh&&!h.nabh) return false;
    if (teleconsult&&!h.teleconsult) return false;
    return true;
  }).sort((a,b)=>sortBy==='Best Rated'?b.rating-a.rating:sortBy==='Most Reviews'?b.reviews-a.reviews:sortBy==='Most Beds'?b.beds-a.beds:a.est-b.est);

  const displayed  = filtered.slice(0, shown);
  const hasMore    = shown < filtered.length;
  const hasFilters = city!=='All Cities'||type!=='All Types'||spec!=='All Specialties'||ayushman||emergency||nabh||teleconsult||!!search;
  const clearAll   = () => { setCity('All Cities');setType('All Types');setSpec('All Specialties');setAyushman(false);setEmergency(false);setNabh(false);setTeleconsult(false);setSearch('');setSortBy('Best Rated'); };

  return (
    <>
      <PublicNavbar />
      <style>{`
        @keyframes hpUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes hpPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.5)} }
        .hp-card { animation:hpUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .hp-sel  { background:#fff; border:1.5px solid #D1D9F0; border-radius:8px; padding:6px 11px; font-size:12.5px; color:#0C1A3A; outline:none; cursor:pointer; font-family:var(--font-body); transition:border-color 0.15s; }
        .hp-sel:focus,.hp-sel:hover { border-color:#2563EB; }
        .hp-wrap { max-width:900px; margin:0 auto; }
        .hp-hero-inner { display:grid; grid-template-columns:1fr 360px; gap:44px; align-items:center; position:relative; z-index:1; }
        .hp-hero-right { display:block; }
        @media(max-width:768px){
          .hp-hero-inner { grid-template-columns:1fr; }
          .hp-hero-right { display:none; }
          .hp-wrap { padding-left:16px !important; padding-right:16px !important; }
        }
        @media(min-width:769px) and (max-width:1100px){
          .hp-hero-inner { grid-template-columns:1fr; }
          .hp-hero-right { display:none; }
        }
      `}</style>

      <div style={{ background: C.pageBg, minHeight:'100vh', fontFamily:'var(--font-body)', paddingTop:64 }}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <div style={{ padding:'20px 48px 0', background: C.pageBg }}>
          <div style={{ background:C.heroBg, borderRadius:20, position:'relative', overflow:'hidden', padding:'44px 52px 40px', boxShadow:'0 20px 60px rgba(6,14,30,0.35)' }}>
            <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.04,pointerEvents:'none' }}><defs><pattern id="dp" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff"/></pattern></defs><rect width="100%" height="100%" fill="url(#dp)"/></svg>
            <div style={{ position:'absolute',right:'-4%',top:'-30%',width:480,height:480,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,148,136,0.14) 0%,transparent 65%)',pointerEvents:'none' }}/>
            <div className="hp-hero-inner">
              <div>
                <div style={{ display:'inline-flex',alignItems:'center',gap:7,background:'rgba(13,148,136,0.15)',border:'1px solid rgba(13,148,136,0.3)',borderRadius:20,padding:'4px 14px',marginBottom:18 }}>
                  <span style={{ width:6,height:6,borderRadius:'50%',background:'#4ADE80',display:'inline-block',animation:'hpPulse 2s ease-in-out infinite' }}/>
                  <span style={{ fontSize:11,color:'#A7F3D0',fontWeight:700,letterSpacing:'0.08em' }}>🏥 HOSPITAL NETWORK</span>
                </div>
                <h1 style={{ fontSize:'clamp(28px,3vw,42px)',fontWeight:900,color:'#fff',margin:'0 0 14px',fontFamily:'var(--font-heading)',lineHeight:1.1,letterSpacing:'-0.02em' }}>
                  Find the Right<br/>
                  <span style={{ fontStyle:'italic',background:'linear-gradient(90deg,#5EEAD4,#A7F3D0)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>Hospital Near You</span>
                </h1>
                <p style={{ fontSize:15,color:'rgba(255,255,255,0.6)',lineHeight:1.75,margin:'0 0 28px',maxWidth:480 }}>
                  340+ NABH-accredited hospitals across India — filtered by specialty, city, Ayushman Bharat, and emergency availability.
                </p>
                <div style={{ position:'relative',maxWidth:500,marginBottom:24 }}>
                  <span style={{ position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',fontSize:16,color:'rgba(255,255,255,0.35)',pointerEvents:'none' }}>🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hospital, city, specialty…"
                    style={{ width:'100%',background:'rgba(255,255,255,0.97)',border:'none',borderRadius:12,padding:'13px 16px 13px 46px',fontSize:14,color:C.textPrimary,fontFamily:'var(--font-body)',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',boxSizing:'border-box',outline:'none' }}/>
                </div>
                <div style={{ display:'flex',gap:28,flexWrap:'wrap' }}>
                  {[{n:'340+',l:'Hospitals'},{n:'18',l:'Cities'},{n:'1L+',l:'Beds'},{n:'Free',l:'OPD Booking'}].map(s=>(
                    <div key={s.l}>
                      <div style={{ fontFamily:'var(--font-heading)',fontWeight:900,fontSize:22,color:'#A7F3D0',lineHeight:1 }}>{s.n}</div>
                      <div style={{ fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600,marginTop:4,letterSpacing:'0.07em' }}>{s.l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hp-hero-right" style={{ background:'rgba(255,255,255,0.07)',borderRadius:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ height:3,background:'linear-gradient(90deg,#5EEAD4,#0D9488)' }}/>
                <div style={{ padding:'20px 22px' }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
                    <span style={{ fontSize:10,fontWeight:800,color:'#5EEAD4',letterSpacing:'0.1em',background:'rgba(94,234,212,0.15)',borderRadius:6,padding:'3px 9px',border:'1px solid rgba(94,234,212,0.25)' }}>{fact.tag}</span>
                    <div style={{ display:'flex',gap:5 }}>
                      {HERO_FACTS.map((_,i)=>(
                        <button key={i} onClick={()=>setFactIdx(i)} style={{ width:i===factIdx?18:6,height:6,borderRadius:4,background:i===factIdx?'#5EEAD4':'rgba(255,255,255,0.2)',border:'none',cursor:'pointer',transition:'all 0.3s',padding:0 }}/>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontFamily:'var(--font-heading)',fontWeight:900,fontSize:44,color:'#fff',lineHeight:1,letterSpacing:'-0.02em',marginBottom:4 }}>{fact.stat}</div>
                  <div style={{ fontSize:12,color:'#5EEAD4',fontWeight:700,marginBottom:16 }}>{fact.sub}</div>
                  <div style={{ fontSize:13,color:'rgba(255,255,255,0.78)',lineHeight:1.7,fontStyle:'italic',background:'rgba(255,255,255,0.06)',borderRadius:10,padding:'14px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:14 }}>{fact.quote}</div>
                  <div style={{ fontSize:12,fontWeight:700,color:'#fff' }}>{fact.author}</div>
                  <div style={{ fontSize:11,color:'#5EEAD4',marginTop:2 }}>{fact.role}</div>
                </div>
                <div style={{ height:3,background:'rgba(255,255,255,0.07)' }}>
                  <div style={{ height:'100%',background:'#5EEAD4',transition:'width 0.5s linear',width:`${factPct}%` }}/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTERS ───────────────────────────────────────────────────────── */}
        <div style={{ background:'#fff',borderBottom:`1px solid ${C.cardBorder}`,position:'sticky',top:64,zIndex:90,boxShadow:'0 1px 6px rgba(12,26,58,0.04)' }}>
          <div style={{ maxWidth:1200,margin:'0 auto',padding:'11px 48px',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center' }}>
            <select value={city}   onChange={e=>setCity(e.target.value)}   className="hp-sel">{CITIES.map(c=><option key={c}>{c}</option>)}</select>
            <select value={type}   onChange={e=>setType(e.target.value)}   className="hp-sel">{TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select value={spec}   onChange={e=>setSpec(e.target.value)}   className="hp-sel">{SPECS.map(s=><option key={s}>{s}</option>)}</select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="hp-sel">{SORTS.map(s=><option key={s}>{s}</option>)}</select>
            {[{l:'🏛 Ayushman',v:ayushman,s:setAyushman},{l:'🚨 Emergency',v:emergency,s:setEmergency},{l:'NABH',v:nabh,s:setNabh},{l:'📱 Teleconsult',v:teleconsult,s:setTeleconsult}].map(({l,v,s})=>(
              <button key={l} onClick={()=>s(!v)} style={{ fontSize:12, fontWeight:600, background:v?C.blueBg:'none', border:`1.5px solid ${v?C.blue:'#D1D9F0'}`, color:v?C.blue:C.textMuted, borderRadius:20, padding:'5px 12px', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>{l}</button>
            ))}
            {hasFilters&&<button onClick={clearAll} style={{ fontSize:12, fontWeight:600, color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:20, padding:'5px 12px', cursor:'pointer' }}>Clear ×</button>}
          </div>
        </div>

        {/* ── RESULTS — narrow single column list ───────────────────────────── */}
        <div style={{ maxWidth:900,margin:'0 auto',padding:'32px 48px 60px' }}>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ margin:0,fontFamily:'var(--font-heading)',fontWeight:700,fontSize:18,color:C.textPrimary }}>{city!=='All Cities'?`Hospitals in ${city}`:'All Hospitals'}</h2>
            <p style={{ margin:'4px 0 0',fontSize:12.5,color:C.textMuted }}>
              Showing <strong style={{ color:C.textPrimary }}>{displayed.length}</strong> of <strong style={{ color:C.textPrimary }}>{filtered.length}</strong> hospitals
              {search&&<> for <em style={{ color:C.blue,fontStyle:'normal',fontWeight:600 }}>"{search}"</em></>}
            </p>
          </div>

          {filtered.length===0 ? (
            <div style={{ textAlign:'center',padding:'72px 20px',background:'#fff',borderRadius:16,border:`1px solid ${C.cardBorder}` }}>
              <div style={{ fontSize:40,marginBottom:14 }}>🏥</div>
              <div style={{ fontFamily:'var(--font-heading)',fontWeight:700,fontSize:18,color:C.textPrimary,marginBottom:8 }}>No hospitals found</div>
              <div style={{ fontSize:13.5,color:C.textMuted,marginBottom:24 }}>Try adjusting your filters.</div>
              <button onClick={clearAll} style={{ background:C.textPrimary,color:'#fff',border:'none',borderRadius:10,padding:'11px 28px',fontSize:13.5,fontWeight:700,cursor:'pointer' }}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {displayed.map((h,i) => (
                  <div key={h.id} className="hp-card" style={{ animationDelay:`${i*0.04}s` }}>
                    <HospitalCard h={h} onSelect={setSelected}/>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div style={{ textAlign:'center',marginTop:32 }}>
                  <button onClick={()=>setShown(n=>n+6)}
                    style={{ background:'#fff',border:`1.5px solid ${C.cardBorder}`,color:C.textSecondary,borderRadius:40,padding:'12px 36px',fontSize:13.5,fontWeight:600,cursor:'pointer',transition:'all 0.2s',boxShadow:'0 1px 6px rgba(12,26,58,0.06)' }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.blue;(e.currentTarget as HTMLElement).style.color=C.blue; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.cardBorder;(e.currentTarget as HTMLElement).style.color=C.textSecondary; }}>
                    View {Math.min(filtered.length-shown,6)} more hospitals
                  </button>
                  <p style={{ fontSize:11.5,color:C.textMuted,marginTop:8 }}>{filtered.length-shown} more available</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <div style={{ margin:'0 48px 52px',background:C.heroBg,borderRadius:20,overflow:'hidden',position:'relative' }}>
          <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.04,pointerEvents:'none' }}><defs><pattern id="dp2" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff"/></pattern></defs><rect width="100%" height="100%" fill="url(#dp2)"/></svg>
          <div style={{ position:'relative',zIndex:1,padding:'36px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20 }}>
            <div>
              <div style={{ fontSize:10,fontWeight:700,color:'#5EEAD4',letterSpacing:'0.1em',marginBottom:10 }}>FOR HOSPITALS</div>
              <h2 style={{ margin:'0 0 8px',fontFamily:'var(--font-heading)',fontWeight:900,fontSize:'clamp(18px,2.2vw,24px)',color:'#fff',lineHeight:1.2 }}>List Your Hospital on HealthConnect</h2>
              <p style={{ fontSize:13.5,color:'rgba(255,255,255,0.5)',margin:0,maxWidth:440,lineHeight:1.7 }}>Connect with 1,20,000+ patients. Manage OPD online and accept Ayushman Bharat patients digitally.</p>
            </div>
            <div style={{ display:'flex',gap:12,flexShrink:0 }}>
              <button onClick={()=>router.push('/register?role=hospital')} style={{ background:'linear-gradient(135deg,#0D9488,#14B8A6)',color:'#fff',border:'none',borderRadius:40,padding:'13px 28px',fontSize:13.5,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(13,148,136,0.4)',whiteSpace:'nowrap' }}>Register Your Hospital →</button>
            </div>
          </div>
        </div>

      </div>
      {selected&&<HospitalModal h={selected} onClose={()=>setSelected(null)}/>}
    </>
  );
}
