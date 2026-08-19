'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import { api } from '@/lib/api';

const C = {
  page:'#F0F4FF', card:'#FFFFFF', navy:'#0C1A3A', text:'#334155', muted:'#64748B',
  border:'#DFE7F5', blue:'#2563EB', teal:'#0D9488', green:'#15803D', amber:'#B45309', red:'#DC2626',
};

const typeLabel: Record<string,string> = {
  GOVERNMENT:'Government', PRIVATE:'Private', TRUST_NGO:'Trust / NGO', TEACHING:'Teaching Hospital',
  CHARITABLE:'Charitable', OTHER:'Other',
};

function list(value: unknown): string[] { return Array.isArray(value) ? value.filter(Boolean).map(String) : []; }

function Badge({ children, tone='blue' }: { children: React.ReactNode; tone?:'blue'|'green'|'amber'|'red'|'teal' }) {
  const tones = {
    blue:['#EFF6FF','#1D4ED8','#BFDBFE'], green:['#F0FDF4','#15803D','#BBF7D0'],
    amber:['#FFFBEB','#B45309','#FDE68A'], red:['#FEF2F2','#DC2626','#FECACA'], teal:['#F0FDFA','#0F766E','#99F6E4'],
  } as const;
  const [bg,color,border] = tones[tone];
  return <span style={{background:bg,color,border:`1px solid ${border}`,borderRadius:999,padding:'3px 9px',fontSize:10.5,fontWeight:750,whiteSpace:'nowrap'}}>{children}</span>;
}

function HospitalCard({ hospital, onOpen }: { hospital:any; onOpen:()=>void }) {
  const facilities = list(hospital.facilities);
  const specialties = list(hospital.specialties);
  const schemes = list(hospital.governmentSchemes);
  const initials = String(hospital.name ?? 'Hospital').split(/\s+/).slice(0,2).map((x:string)=>x[0]).join('').toUpperCase();
  return <article onClick={onOpen} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18,cursor:'pointer',boxShadow:'0 2px 12px rgba(12,26,58,.05)',display:'grid',gridTemplateColumns:'58px minmax(0,1fr) auto',gap:15,alignItems:'center'}}>
    <div style={{width:58,height:58,borderRadius:14,background:'linear-gradient(135deg,#E0F2FE,#CCFBF1)',display:'grid',placeItems:'center',overflow:'hidden',fontWeight:900,color:'#0F766E'}}>
      {hospital.logoUrl ? <img src={hospital.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : initials}
    </div>
    <div style={{minWidth:0}}>
      <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
        <h3 style={{margin:0,fontSize:16,color:C.navy}}>{hospital.name}</h3>
        {hospital.isVerified && <Badge tone="green">✓ HC Verified</Badge>}
        {hospital.hospitalType && <Badge>{typeLabel[hospital.hospitalType] ?? hospital.hospitalType}</Badge>}
      </div>
      <div style={{fontSize:12,color:C.muted,marginTop:5}}>{[hospital.addressLine1,hospital.city,hospital.state].filter(Boolean).join(', ') || 'Location not added'}</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:9}}>
        {specialties.slice(0,4).map(item=><Badge key={item}>{item}</Badge>)}
        {specialties.length>4 && <Badge>+{specialties.length-4} specialties</Badge>}
        {hospital.emergencyAvailable && <Badge tone="red">24/7 Emergency</Badge>}
        {hospital.teleconsultAvailable && <Badge tone="teal">Teleconsult</Badge>}
        {schemes.slice(0,2).map(item=><Badge key={item} tone="green">{item}</Badge>)}
      </div>
      {facilities.length>0 && <div style={{fontSize:11,color:C.muted,marginTop:8}}>Facilities: {facilities.slice(0,5).join(' · ')}{facilities.length>5?' …':''}</div>}
    </div>
    <div style={{textAlign:'right',minWidth:105}}>
      {(hospital.averageRating ?? 0)>0 ? <><div style={{fontWeight:900,color:'#92400E'}}>★ {Number(hospital.averageRating).toFixed(1)}</div><div style={{fontSize:10,color:C.muted}}>{hospital.totalReviews ?? hospital.reviewCount ?? 0} reviews</div></> : <div style={{fontSize:11,color:C.muted}}>New on HealthConnect</div>}
      <div style={{fontSize:11,color:C.text,marginTop:9}}>{hospital.totalBeds != null ? `${hospital.totalBeds} beds` : 'Beds not listed'}</div>
      <div style={{fontSize:11,color:C.text,marginTop:3}}>{hospital.doctorCount ?? 0} affiliated doctors</div>
      <button onClick={e=>{e.stopPropagation();onOpen();}} style={{marginTop:10,border:'none',borderRadius:9,padding:'8px 12px',background:'linear-gradient(135deg,#1D4ED8,#2563EB)',color:'#fff',fontWeight:750,fontSize:11,cursor:'pointer'}}>View Hospital →</button>
    </div>
  </article>;
}

export default function HospitalDirectoryV2() {
  const router = useRouter();
  const [hospitals,setHospitals] = useState<any[]>([]);
  const [total,setTotal] = useState(0);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [search,setSearch] = useState('');
  const [city,setCity] = useState('');
  const [type,setType] = useState('');
  const [specialty,setSpecialty] = useState('');
  const [facility,setFacility] = useState('');
  const [scheme,setScheme] = useState('');
  const [emergency,setEmergency] = useState(false);
  const [teleconsult,setTeleconsult] = useState(false);
  const [sort,setSort] = useState('featured');
  const [nearLoading,setNearLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params:any = { limit:50, sort };
      if (search.trim()) params.search=search.trim();
      if (city.trim()) params.city=city.trim();
      if (type) params.type=type;
      if (specialty.trim()) params.specialty=specialty.trim();
      if (facility.trim()) params.facility=facility.trim();
      if (scheme.trim()) params.scheme=scheme.trim();
      if (emergency) params.emergency='true';
      if (teleconsult) params.teleconsult='true';
      const response = await api.get('/hospitals',{params});
      const data = response?.data?.data ?? {};
      const rows = Array.isArray(data) ? data : data.hospitals;
      setHospitals(Array.isArray(rows)?rows:[]);
      setTotal(Number(data.total ?? (Array.isArray(rows)?rows.length:0)));
    } catch(e:any){ setError(e?.response?.data?.message ?? 'Unable to load hospitals.'); setHospitals([]); }
    finally{ setLoading(false); }
  },[search,city,type,specialty,facility,scheme,emergency,teleconsult,sort]);

  useEffect(()=>{ const timer=setTimeout(()=>void load(),300); return()=>clearTimeout(timer); },[load]);

  const findNearMe = () => {
    if (!navigator.geolocation) { setError('Location is not supported by this browser.'); return; }
    setNearLoading(true); setError('');
    navigator.geolocation.getCurrentPosition(async position=>{
      try {
        const response=await api.get('/hospitals/nearest',{params:{lat:position.coords.latitude,lng:position.coords.longitude,limit:20}});
        const rows=response?.data?.data ?? [];
        setHospitals(Array.isArray(rows)?rows:[]); setTotal(Array.isArray(rows)?rows.length:0);
      } catch(e:any){ setError(e?.response?.data?.message ?? 'Unable to find nearby hospitals.'); }
      finally{ setNearLoading(false); }
    },()=>{ setError('Location permission was not granted.'); setNearLoading(false); },{enableHighAccuracy:false,timeout:8000});
  };

  const clear = () => { setSearch('');setCity('');setType('');setSpecialty('');setFacility('');setScheme('');setEmergency(false);setTeleconsult(false);setSort('featured'); };
  const hasFilters = Boolean(search||city||type||specialty||facility||scheme||emergency||teleconsult||sort!=='featured');
  const headline = useMemo(()=> city ? `Hospitals in ${city}` : 'Verified hospitals on HealthConnect',[city]);

  return <div style={{minHeight:'100vh',background:C.page,color:C.navy,fontFamily:'Nunito,Arial,sans-serif'}}>
    <PublicNavbar />
    <section style={{padding:'112px 5% 36px',background:'linear-gradient(135deg,#0D1B4B,#0C4680 58%,#0D9488)',color:'#fff'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{fontSize:11,fontWeight:800,color:'#99F6E4',letterSpacing:'.1em'}}>HOSPITAL DISCOVERY · LIVE DATABASE</div>
        <h1 style={{fontSize:'clamp(30px,4vw,46px)',margin:'10px 0 8px',lineHeight:1.08}}>Find verified hospital care</h1>
        <p style={{maxWidth:650,color:'rgba(255,255,255,.72)',lineHeight:1.7,margin:'0 0 22px'}}>Search real HealthConnect hospital profiles by location, specialty, facilities, emergency care, government schemes and consultation options.</p>
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:10,maxWidth:760}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hospital, city, specialty or facility…" style={{border:'none',borderRadius:12,padding:'13px 16px',fontSize:14,outline:'none'}}/>
          <button onClick={findNearMe} disabled={nearLoading} style={{border:'1px solid rgba(255,255,255,.3)',borderRadius:12,padding:'0 18px',background:'rgba(255,255,255,.12)',color:'#fff',fontWeight:750,cursor:'pointer'}}>{nearLoading?'Locating…':'⌖ Near me'}</button>
        </div>
      </div>
    </section>

    <div style={{position:'sticky',top:64,zIndex:20,background:'#fff',borderBottom:`1px solid ${C.border}`}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'12px 5%',display:'flex',gap:8,flexWrap:'wrap'}}>
        <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" style={smallInput}/>
        <select value={type} onChange={e=>setType(e.target.value)} style={smallInput}><option value="">All types</option>{Object.entries(typeLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
        <input value={specialty} onChange={e=>setSpecialty(e.target.value)} placeholder="Specialty" style={smallInput}/>
        <input value={facility} onChange={e=>setFacility(e.target.value)} placeholder="Facility (MRI, ICU…)" style={smallInput}/>
        <input value={scheme} onChange={e=>setScheme(e.target.value)} placeholder="Scheme / insurance" style={smallInput}/>
        <button onClick={()=>setEmergency(v=>!v)} style={chip(emergency,C.red)}>Emergency</button>
        <button onClick={()=>setTeleconsult(v=>!v)} style={chip(teleconsult,C.teal)}>Teleconsult</button>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={smallInput}><option value="featured">Recommended</option><option value="rating">Best rated</option><option value="beds">Most beds</option><option value="name">Name A–Z</option></select>
        {hasFilters&&<button onClick={clear} style={{...chip(true,C.red),background:'#FFF1F2'}}>Clear ×</button>}
      </div>
    </div>

    <main style={{maxWidth:1000,margin:'0 auto',padding:'30px 5% 64px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'end',marginBottom:16,gap:12}}>
        <div><h2 style={{margin:0,fontSize:20}}>{headline}</h2><div style={{color:C.muted,fontSize:12,marginTop:4}}>{loading?'Loading…':`${total} matching hospital${total===1?'':'s'}`}</div></div>
        <div style={{fontSize:11,color:C.muted}}>Only active, HealthConnect-verified hospitals are shown publicly.</div>
      </div>
      {error&&<div style={{padding:14,borderRadius:11,background:'#FFF1F2',border:'1px solid #FECDD3',color:C.red,marginBottom:14}}>⚠ {error}</div>}
      {loading ? <div style={{padding:50,textAlign:'center',color:C.muted}}>Loading hospitals…</div>
        : hospitals.length===0 ? <div style={{padding:58,textAlign:'center',background:'#fff',border:`1px solid ${C.border}`,borderRadius:16}}><div style={{fontSize:36}}>🏥</div><h3>No verified hospitals match these filters</h3><button onClick={clear} style={primary}>Clear filters</button></div>
        : <div style={{display:'flex',flexDirection:'column',gap:11}}>{hospitals.map(h=><HospitalCard key={h.id} hospital={h} onOpen={()=>router.push(`/hospitals/${h.id}`)}/>)}</div>}
    </main>
  </div>;
}

const smallInput:React.CSSProperties={border:'1px solid #D1D9E8',borderRadius:9,padding:'7px 10px',fontSize:12,color:'#0F172A',background:'#fff',outline:'none',maxWidth:175};
const chip=(active:boolean,color:string):React.CSSProperties=>({border:`1px solid ${active?color:'#D1D9E8'}`,borderRadius:999,padding:'6px 11px',fontSize:11,fontWeight:700,color:active?color:C.muted,background:active?'#F8FAFC':'#fff',cursor:'pointer'});
const primary:React.CSSProperties={border:'none',borderRadius:9,padding:'9px 15px',background:'linear-gradient(135deg,#0F766E,#0D9488)',color:'#fff',fontWeight:750,cursor:'pointer'};
