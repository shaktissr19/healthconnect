'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import { useAuthStore } from '@/store/authStore';
import communityApiV2 from '@/lib/communityApiV2';

const C = {
  page: '#F5F7FA', card: '#FFFFFF', border: '#DDE6EF', navy: '#0F1F38',
  text: '#33465F', muted: '#687A90', teal: '#0D9488', tealDark: '#0F766E',
  tealSoft: '#ECFDF9', blue: '#2563EB', amber: '#B45309', amberSoft: '#FFF8E8',
  red: '#B42318', green: '#15803D',
};

const categories = ['All','Diabetes','Heart Health','Mental Wellness','PCOS/PCOD','Cancer Support','Thyroid','Arthritis','Hypertension','Kidney Health','Respiratory','Nutrition & Diet','Senior Care','General'];

const categoryEmoji: Record<string,string> = {
  Diabetes:'🩸','Heart Health':'❤️','Mental Wellness':'🧠','PCOS/PCOD':'🌸','Cancer Support':'🎗️',
  Thyroid:'🦋',Arthritis:'🦴',Hypertension:'💊','Kidney Health':'🫘',Respiratory:'🫁',
  'Nutrition & Diet':'🥗','Senior Care':'👴',General:'🏥',
};

const statusLabel = (community:any) => community.membershipStatus || (community.is_joined || community.isJoined ? 'JOINED' : 'NOT_JOINED');

function RequestCommunityModal({ onClose, onSubmitted }:{ onClose:()=>void; onSubmitted:(r:any)=>void }) {
  const [name,setName]=useState('');
  const [category,setCategory]=useState('General');
  const [reason,setReason]=useState('');
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  const submit=async()=>{
    setError('');
    if(name.trim().length<2){setError('Enter a community name.');return;}
    if(reason.trim().length<10){setError('Tell us a little more about why this community is needed.');return;}
    setSaving(true);
    try{
      const result=await communityApiV2.requestCommunity({communityName:name.trim(),category,reason:reason.trim()});
      onSubmitted(result);
    }catch(e:any){setError(e?.response?.data?.message||'Unable to submit your request. Please try again.');}
    finally{setSaving(false);}
  };

  return <div onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:'fixed',inset:0,zIndex:2100,background:'rgba(15,31,56,.48)',display:'grid',placeItems:'center',padding:18}}>
    <div style={{width:'min(560px,96vw)',background:'#fff',borderRadius:20,padding:24,boxShadow:'0 24px 70px rgba(15,31,56,.24)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',marginBottom:18}}>
        <div><div style={{fontSize:20,fontWeight:850,color:C.navy}}>Request a health community</div><p style={{fontSize:12.5,color:C.muted,lineHeight:1.55,margin:'6px 0 0'}}>Requests are reviewed by HealthConnect before a new community is created.</p></div>
        <button onClick={onClose} aria-label="Close" style={iconButton}>×</button>
      </div>
      {error&&<div style={errorBox}>{error}</div>}
      <label style={label}>Community name<input value={name} onChange={e=>setName(e.target.value)} maxLength={160} placeholder="e.g. Migraine Support India" style={input}/></label>
      <label style={label}>Category<select value={category} onChange={e=>setCategory(e.target.value)} style={input}>{categories.filter(x=>x!=='All').map(x=><option key={x}>{x}</option>)}</select></label>
      <label style={label}>Why is this community needed?<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={1500} rows={4} placeholder="Who would this help and what conversations should it support?" style={{...input,resize:'vertical'}}/></label>
      <div style={{display:'flex',gap:10,marginTop:18}}><button onClick={onClose} style={{...secondary,flex:1}}>Cancel</button><button onClick={submit} disabled={saving} style={{...primary,flex:2,opacity:saving?.65:1}}>{saving?'Submitting…':'Submit for review'}</button></div>
    </div>
  </div>;
}

export default function CommunityDirectoryV2(){
  const router=useRouter();
  const user=useAuthStore(s=>(s as any).user);
  const authenticated=useAuthStore(s=>(s as any).isAuthenticated);
  const hydrated=useAuthStore(s=>(s as any)._hasHydrated);
  const [communities,setCommunities]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('All');
  const [joining,setJoining]=useState<string|null>(null);
  const [requestOpen,setRequestOpen]=useState(false);
  const [latestRequest,setLatestRequest]=useState<any>(null);
  const [notice,setNotice]=useState('');

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const result:any=await communityApiV2.list({search:search.trim()||undefined,category:category==='All'?undefined:category,limit:60});
      setCommunities(Array.isArray(result?.communities)?result.communities:[]);
    }catch(e:any){setCommunities([]);setError(e?.response?.data?.message||'Communities are temporarily unavailable.');}
    finally{setLoading(false);}
  },[search,category]);

  useEffect(()=>{const t=setTimeout(()=>void load(),search?250:0);return()=>clearTimeout(t);},[load,search]);
  useEffect(()=>{if(hydrated&&authenticated){communityApiV2.requestStatus().then((r:any)=>setLatestRequest(r?.latest||null)).catch(()=>{});}},[hydrated,authenticated]);

  const signIn=(returnTo='/communities')=>{
    if(typeof window!=='undefined')sessionStorage.setItem('hc_post_login_redirect',returnTo);
    window.location.href='/?auth=login';
  };

  const join=async(c:any)=>{
    if(!authenticated||!user){signIn(`/communities/${c.slug||c.id}`);return;}
    setJoining(c.id);setNotice('');
    try{
      const result:any=await communityApiV2.join(c.id);
      await load();
      setNotice(result?.membershipStatus==='PENDING_APPROVAL' ? `Your request to join ${c.name} is awaiting moderator approval.` : `You joined ${c.name}.`);
    }catch(e:any){setError(e?.response?.data?.message||`Unable to join ${c.name}.`);}
    finally{setJoining(null);}
  };

  const featured=useMemo(()=>communities.filter(c=>c.isFeatured||c.is_featured).length,[communities]);
  const joined=useMemo(()=>communities.filter(c=>statusLabel(c)==='JOINED').length,[communities]);

  return <div style={{minHeight:'100vh',background:C.page,fontFamily:"'Inter','Poppins',system-ui,sans-serif",color:C.navy}}>
    <PublicNavbar/>
    <main style={{paddingTop:64}}>
      <section style={{padding:'42px 5% 34px'}}><div style={{maxWidth:1180,margin:'0 auto',background:'linear-gradient(135deg,#0E3B54 0%,#0F5A68 54%,#0D9488 100%)',borderRadius:26,padding:'38px clamp(24px,5vw,54px)',color:'#fff',boxShadow:'0 18px 48px rgba(15,71,83,.20)'}}>
        <div style={{fontSize:11,fontWeight:850,letterSpacing:'.14em',textTransform:'uppercase',color:'#C9F7F0'}}>HealthConnect · Trusted health communities</div>
        <h1 style={{fontSize:'clamp(30px,5vw,48px)',lineHeight:1.08,margin:'10px 0 12px',maxWidth:800}}>Learn from experience. Connect with people who understand.</h1>
        <p style={{fontSize:15,lineHeight:1.7,maxWidth:820,margin:0,color:'rgba(255,255,255,.88)'}}>Condition-focused communities for patients, caregivers and verified healthcare professionals. Membership, posts, replies and moderation are backed by the live HealthConnect platform.</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:22}}><span style={heroPill}>{communities.length} communities loaded</span>{authenticated&&<span style={heroPill}>{joined} joined</span>}{featured>0&&<span style={heroPill}>{featured} featured</span>}</div>
      </div></section>

      <section style={{maxWidth:1180,margin:'0 auto',padding:'0 5% 70px'}}>
        {notice&&<div style={noticeBox}>{notice}<button onClick={()=>setNotice('')} style={{background:'none',border:0,color:C.tealDark,cursor:'pointer',fontWeight:800}}>×</button></div>}
        {latestRequest&&<div style={{background:latestRequest.status==='APPROVED'?'#F0FDF4':latestRequest.status==='REJECTED'?'#FFF5F5':C.amberSoft,border:`1px solid ${latestRequest.status==='APPROVED'?'#BBF7D0':latestRequest.status==='REJECTED'?'#FECACA':'#FDE68A'}`,borderRadius:14,padding:'12px 16px',fontSize:12.5,color:C.text,marginBottom:16}}><b>Latest request:</b> {latestRequest.communityName} · <b>{String(latestRequest.status).replaceAll('_',' ')}</b>{latestRequest.adminNote?` — ${latestRequest.adminNote}`:''}</div>}

        <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',marginBottom:18}}>
          <div style={{flex:'1 1 460px',display:'flex',gap:10}}><div style={{position:'relative',flex:1}}><span style={{position:'absolute',left:14,top:11,color:C.muted}}>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by condition, topic or community name" style={{...input,paddingLeft:38,marginTop:0}}/></div><button onClick={()=>void load()} style={secondary}>Refresh</button></div>
          <button onClick={()=>authenticated?setRequestOpen(true):signIn('/communities')} style={primary}>+ Request community</button>
        </div>

        <div style={{display:'flex',gap:7,overflowX:'auto',paddingBottom:10,marginBottom:14}}>{categories.map(item=><button key={item} onClick={()=>setCategory(item)} style={{border:`1px solid ${category===item?'#99E7DC':C.border}`,background:category===item?C.tealSoft:'#fff',color:category===item?C.tealDark:C.text,borderRadius:999,padding:'7px 12px',fontSize:11.5,fontWeight:750,whiteSpace:'nowrap',cursor:'pointer'}}>{item}</button>)}</div>

        {error&&<div style={errorBox}>{error} <button onClick={()=>void load()} style={{background:'none',border:0,color:C.red,fontWeight:800,cursor:'pointer'}}>Retry</button></div>}
        {loading?<div style={grid}>{[1,2,3,4,5,6].map(i=><div key={i} style={{height:245,borderRadius:18,background:'linear-gradient(90deg,#EEF2F6,#F8FAFC,#EEF2F6)',border:`1px solid ${C.border}`}}/>)}</div>:
        communities.length===0?<div style={empty}><div style={{fontSize:38}}>🌿</div><h3 style={{margin:'8px 0',color:C.navy}}>No communities match this search</h3><p style={{margin:0,color:C.muted,fontSize:13}}>Try another category or request a community for this topic.</p></div>:
        <div style={grid}>{communities.map(c=>{
          const state=statusLabel(c);const pending=state==='PENDING_APPROVAL';const isJoined=state==='JOINED';
          return <article key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:21,boxShadow:'0 4px 18px rgba(15,31,56,.05)',display:'flex',flexDirection:'column',minHeight:250}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}><div style={{width:50,height:50,borderRadius:15,background:C.tealSoft,display:'grid',placeItems:'center',fontSize:26}}>{c.emoji||categoryEmoji[c.category]||'🏥'}</div><div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'flex-end'}}>{c.isFeatured&&<span style={badge}>Featured</span>}<span style={{...badge,background:c.visibility==='PUBLIC'?'#EFF6FF':'#FFF8E8',color:c.visibility==='PUBLIC'?C.blue:C.amber}}>{c.visibility==='PUBLIC'?'Public':c.visibility==='RESTRICTED'?'Approval required':'Private'}</span></div></div>
            <h2 style={{fontSize:18,margin:'14px 0 7px',color:C.navy}}>{c.name}</h2><p style={{fontSize:12.5,lineHeight:1.6,color:C.text,margin:'0 0 14px',flex:1}}>{c.description||'A HealthConnect support community.'}</p>
            <div style={{display:'flex',gap:14,fontSize:11.5,color:C.muted,borderTop:`1px solid ${C.border}`,paddingTop:12}}><span>👥 {(c.member_count||c.memberCount||0).toLocaleString('en-IN')}</span><span>💬 {(c.post_count||c.postCount||0).toLocaleString('en-IN')}</span><span>{c.allowAnonymous?'🎭 Anonymous':'👤 Named posts'}</span></div>
            <div style={{display:'flex',gap:8,marginTop:14}}><button onClick={()=>router.push(`/communities/${c.slug||c.id}`)} style={{...secondary,flex:1}}>View community</button>{!isJoined&&c.visibility!=='PRIVATE'&&<button disabled={pending||joining===c.id} onClick={()=>join(c)} style={{...primary,flex:1,opacity:pending||joining===c.id?.65:1}}>{joining===c.id?'Working…':pending?'Pending':'Join'}</button>}{isJoined&&<span style={{...successPill,flex:1}}>✓ Joined</span>}</div>
          </article>;
        })}</div>}
      </section>
    </main>
    {requestOpen&&<RequestCommunityModal onClose={()=>setRequestOpen(false)} onSubmitted={r=>{setRequestOpen(false);setLatestRequest(r);setNotice('Community request submitted for review.');}}/>}
    <style>{`@media(max-width:720px){.hc-community-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

const input:React.CSSProperties={width:'100%',boxSizing:'border-box',border:`1px solid ${C.border}`,borderRadius:11,padding:'10px 12px',fontSize:13,color:C.navy,background:'#fff',outline:'none',fontFamily:'inherit',marginTop:6};
const label:React.CSSProperties={display:'block',fontSize:11,fontWeight:800,color:C.text,marginBottom:12,textTransform:'uppercase',letterSpacing:'.05em'};
const primary:React.CSSProperties={border:0,borderRadius:10,padding:'10px 14px',background:`linear-gradient(135deg,${C.tealDark},${C.teal})`,color:'#fff',fontSize:12.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit'};
const secondary:React.CSSProperties={border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 13px',background:'#fff',color:C.text,fontSize:12.5,fontWeight:750,cursor:'pointer',fontFamily:'inherit'};
const iconButton:React.CSSProperties={width:34,height:34,borderRadius:9,border:`1px solid ${C.border}`,background:'#F8FAFC',cursor:'pointer',fontSize:20,color:C.text};
const errorBox:React.CSSProperties={background:'#FFF5F5',border:'1px solid #FECACA',color:C.red,borderRadius:12,padding:'11px 14px',fontSize:12.5,marginBottom:14};
const noticeBox:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',background:C.tealSoft,border:'1px solid #B8EEE6',color:C.tealDark,borderRadius:12,padding:'11px 14px',fontSize:12.5,marginBottom:14};
const heroPill:React.CSSProperties={border:'1px solid rgba(255,255,255,.24)',background:'rgba(255,255,255,.1)',borderRadius:999,padding:'6px 10px',fontSize:11,fontWeight:750};
const badge:React.CSSProperties={background:C.tealSoft,color:C.tealDark,borderRadius:999,padding:'4px 7px',fontSize:9.5,fontWeight:800};
const successPill:React.CSSProperties={display:'grid',placeItems:'center',border:'1px solid #BBF7D0',background:'#F0FDF4',color:C.green,borderRadius:10,padding:'9px 12px',fontSize:12.5,fontWeight:800};
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:15} as React.CSSProperties;
const empty:React.CSSProperties={background:'#fff',border:`1px solid ${C.border}`,borderRadius:18,padding:'52px 20px',textAlign:'center'};
