'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Community {
  id: string; slug: string; name: string; description: string;
  emoji: string; category: string; visibility: string;
  allowAnonymous: boolean; allows_anonymous: boolean;
  isFeatured: boolean; isActive: boolean;
  member_count: number; post_count: number; is_joined: boolean;
  rules?: string; language?: string; tags?: string[];
}
interface AuthUser { id: string; name: string; role: string; token: string; }

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs';

const CAT_COLOR: Record<string,string> = {
  'Diabetes':'#E53E3E','Heart Health':'#E53E56','Mental Wellness':'#6B46C1',
  'Cancer Support':'#D53F8C','Thyroid':'#805AD5','PCOS/PCOD':'#D53F8C',
  'Arthritis':'#2B6CB0','Hypertension':'#276749','Kidney Health':'#285E61',
  'Respiratory':'#2C5282','Nutrition & Diet':'#276749','Fitness':'#B7791F',
  'Women Health':'#97266D','Pediatric Health':'#285E61','Senior Care':'#C05621',
};

const CAT_BG: Record<string,string> = {
  'Diabetes':'#FFF5F5','Heart Health':'#FFF5F7','Mental Wellness':'#FAF5FF',
  'Cancer Support':'#FFF0F5','Thyroid':'#F5F0FF','PCOS/PCOD':'#FFF0F5',
  'Arthritis':'#EBF8FF','Hypertension':'#F0FFF4','Kidney Health':'#E6FFFA',
  'Respiratory':'#EBF8FF','Nutrition & Diet':'#F0FFF4','Fitness':'#FFFAF0',
  'Women Health':'#FFF5F7','Pediatric Health':'#E6FFFA','Senior Care':'#FFFAF0',
};

const LANGUAGES = ['All Languages','Hindi','English','Tamil','Telugu','Malayalam','Kannada','Bengali','Gujarati','Marathi'];

const CATEGORIES = [
  { key:'all',              label:'All',            emoji:'🏥' },
  { key:'Diabetes',         label:'Diabetes',       emoji:'🩸' },
  { key:'Heart Health',     label:'Heart Health',   emoji:'❤️' },
  { key:'Mental Wellness',  label:'Mental Wellness',emoji:'🧠' },
  { key:'PCOS/PCOD',        label:'PCOS / PCOD',    emoji:'🌸' },
  { key:'Cancer Support',   label:'Cancer Support', emoji:'🎗️' },
  { key:'Thyroid',          label:'Thyroid',        emoji:'🦋' },
  { key:'Arthritis',        label:'Arthritis',      emoji:'🦴' },
  { key:'Hypertension',     label:'Hypertension',   emoji:'💊' },
  { key:'Kidney Health',    label:'Kidney Health',  emoji:'🫘' },
  { key:'Respiratory',      label:'Respiratory',    emoji:'🫁' },
  { key:'Nutrition & Diet', label:'Nutrition',      emoji:'🥗' },
  { key:'Senior Care',      label:'Senior Care',    emoji:'👴' },
];

// Live activity feed (realistic recent activity)
const ACTIVITY_FEED = [
  { name:'Priya M.', action:'posted in', community:'Diabetes Warriors', time:'2m ago', emoji:'🩸' },
  { name:'Dr. Arun K.', action:'answered in', community:'Heart Health Circle', time:'5m ago', emoji:'❤️' },
  { name:'Anonymous', action:'shared a story in', community:'Mental Wellness India', time:'8m ago', emoji:'🧠' },
  { name:'Sunita R.', action:'joined', community:'PCOS Sisters', time:'12m ago', emoji:'🌸' },
  { name:'Rahul V.', action:'posted in', community:'Hypertension Heroes', time:'15m ago', emoji:'💊' },
  { name:'Dr. Kavitha I.', action:'replied in', community:'PCOS Sisters', time:'18m ago', emoji:'🌸' },
  { name:'Anonymous', action:'posted in', community:'Cancer Support Network', time:'22m ago', emoji:'🎗️' },
  { name:'Meena S.', action:'joined', community:'Thyroid Talk', time:'25m ago', emoji:'🦋' },
];

// Full fallback — 18 communities (shown until API loads)
const MOCK_FALLBACK: Community[] = [
  { id:'cm-001',slug:'diabetes-warriors',name:'Diabetes Warriors',description:'A supportive community for people managing Type 1, Type 2, and gestational diabetes across India.',emoji:'🩸',category:'Diabetes',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:true,isActive:true,member_count:3842,post_count:1247,is_joined:false,language:'en',tags:['insulin','HbA1c','diet','CGM'] },
  { id:'cm-002',slug:'heart-health-circle',name:'Heart Health Circle',description:'For heart patients, families, and cardiologists. Discuss heart disease, medications, lifestyle, and recovery.',emoji:'❤️',category:'Heart Health',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:true,isActive:true,member_count:2156,post_count:834,is_joined:false,language:'en',tags:['angioplasty','cardiac','BP'] },
  { id:'cm-003',slug:'mental-wellness-india',name:'Mental Wellness India',description:'A safe, judgment-free space for mental health conversations. Anxiety, depression, stress — you are not alone.',emoji:'🧠',category:'Mental Wellness',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:true,isActive:true,member_count:5621,post_count:2103,is_joined:false,language:'en',tags:['anxiety','depression','therapy'] },
  { id:'cm-004',slug:'pcos-sisters',name:'PCOS Sisters',description:'India\'s largest PCOS/PCOD support community. Hormones, fertility, weight, skin — all covered.',emoji:'🌸',category:'PCOS/PCOD',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:true,isActive:true,member_count:4389,post_count:1876,is_joined:false,language:'en',tags:['hormones','fertility','inositol'] },
  { id:'cm-005',slug:'cancer-support-network',name:'Cancer Support Network',description:'For cancer patients, survivors, and their loved ones. Compassionate support for every journey.',emoji:'🎗️',category:'Cancer Support',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:true,isActive:true,member_count:1823,post_count:692,is_joined:false,language:'en',tags:['chemo','radiation','survivor'] },
  { id:'cm-006',slug:'thyroid-talk',name:'Thyroid Talk',description:'For hypothyroid, hyperthyroid, and Hashimoto\'s patients. TSH, medications, fatigue, brain fog — all discussed.',emoji:'🦋',category:'Thyroid',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:2934,post_count:1089,is_joined:false,language:'en',tags:['TSH','T3','T4','Hashimotos'] },
  { id:'cm-007',slug:'arthritis-joint-warriors',name:'Arthritis & Joint Warriors',description:'For RA, osteoarthritis, ankylosing spondylitis, gout, and all joint conditions.',emoji:'🦴',category:'Arthritis',visibility:'PUBLIC',allowAnonymous:false,allows_anonymous:false,isFeatured:false,isActive:true,member_count:1567,post_count:543,is_joined:false,language:'en',tags:['RA','biologics','physiotherapy'] },
  { id:'cm-008',slug:'hypertension-heroes',name:'Hypertension Heroes',description:'For people managing high blood pressure. Diet tips, stress management, BP monitoring, and lifestyle changes.',emoji:'💊',category:'Hypertension',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:2201,post_count:778,is_joined:false,language:'en',tags:['BP','salt','amlodipine'] },
  { id:'cm-009',slug:'kidney-care-community',name:'Kidney Care Community',description:'For CKD, dialysis, and transplant patients and families. Navigate kidney disease together.',emoji:'🫘',category:'Kidney Health',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:1102,post_count:389,is_joined:false,language:'en',tags:['CKD','dialysis','creatinine'] },
  { id:'cm-010',slug:'breathe-better-respiratory',name:'Breathe Better',description:'For asthma, COPD, bronchitis, ILD, and all respiratory conditions.',emoji:'🫁',category:'Respiratory',visibility:'PUBLIC',allowAnonymous:false,allows_anonymous:false,isFeatured:false,isActive:true,member_count:1456,post_count:467,is_joined:false,language:'en',tags:['asthma','inhaler','COPD'] },
  { id:'cm-011',slug:'nutrition-wellness-hub',name:'Nutrition & Wellness Hub',description:'Evidence-based nutrition for Indians. Diabetes diet, PCOS diet, debunking myths, and healthy eating.',emoji:'🥗',category:'Nutrition & Diet',visibility:'PUBLIC',allowAnonymous:false,allows_anonymous:false,isFeatured:false,isActive:true,member_count:3112,post_count:1234,is_joined:false,language:'en',tags:['diet','millets','glycemic'] },
  { id:'cm-012',slug:'senior-care-india',name:'Senior Care India',description:'For elderly patients, adult children, and geriatric care professionals.',emoji:'👴',category:'Senior Care',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:892,post_count:312,is_joined:false,language:'en',tags:['elderly','falls','polypharmacy'] },
  { id:'ex-001',slug:'heart-warriors',name:'Heart Warriors',description:'Heart patients and families sharing recovery stories and cardiac wellness tips.',emoji:'💓',category:'Heart Health',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:1240,post_count:432,is_joined:false },
  { id:'ex-002',slug:'diabetes-connect',name:'Diabetes Connect',description:'Connecting diabetics across India for mutual support, advice, and management strategies.',emoji:'🩺',category:'Diabetes',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:987,post_count:321,is_joined:false },
  { id:'ex-003',slug:'mental-health-matters',name:'Mental Health Matters',description:'Breaking stigma around mental health in India. Safe space for open conversations.',emoji:'💙',category:'Mental Wellness',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:2134,post_count:876,is_joined:false },
  { id:'ex-004',slug:'maternal-health-circle',name:'Maternal Health Circle',description:'For expecting and new mothers sharing pregnancy, delivery, and postpartum experiences.',emoji:'🤱',category:'PCOS/PCOD',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:1876,post_count:654,is_joined:false },
  { id:'ex-005',slug:'diabetes-nutrition-india',name:'Diabetes Nutrition India',description:'Indian dietary approaches to managing diabetes. Recipes, meal plans, and nutrition science.',emoji:'🍛',category:'Nutrition & Diet',visibility:'PUBLIC',allowAnonymous:false,allows_anonymous:false,isFeatured:false,isActive:true,member_count:743,post_count:289,is_joined:false },
  { id:'ex-006',slug:'hypertension-warriors',name:'Hypertension Warriors',description:'Managing high blood pressure together. Lifestyle tips, medication experiences, and BP tracking.',emoji:'🫀',category:'Hypertension',visibility:'PUBLIC',allowAnonymous:true,allows_anonymous:true,isFeatured:false,isActive:true,member_count:1102,post_count:398,is_joined:false },
];

const getAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw   = localStorage.getItem('hc_user')  || sessionStorage.getItem('hc_user');
    const token = localStorage.getItem('hc_token') || sessionStorage.getItem('hc_token');
    if (!raw || !token) return null;
    const u = JSON.parse(raw);
    return { id: u.id||u.userId, name: u.name||`${u.firstName||''} ${u.lastName||''}`.trim(), role: u.role, token };
  } catch { return null; }
};
const getDashboardRoute = (r: string) => r==='DOCTOR'?'/doctor-dashboard':r==='HOSPITAL'?'/hospital-dashboard':'/dashboard';

// ── Request Modal ─────────────────────────────────────────────────────────────
const RequestModal = ({ onClose, token }: { onClose:()=>void; token:string }) => {
  const [form, setForm] = useState({ name:'', category:'', reason:'' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async () => {
    if (!form.name.trim()||!form.reason.trim()) return;
    setSubmitting(true);
    try { await fetch(`${API}/api/communities/request`,{ method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(form) }); setDone(true); }
    catch { setDone(true); } finally { setSubmitting(false); }
  };
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'#fff',borderRadius:16,padding:32,maxWidth:460,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        {done ? (
          <div style={{ textAlign:'center',padding:'20px 0' }}>
            <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
            <div style={{ fontSize:18,fontWeight:800,color:'#1E293B',marginBottom:8 }}>Request Submitted!</div>
            <div style={{ fontSize:13,color:'#64748B',marginBottom:24 }}>Our team will create your community within 48 hours.</div>
            <button onClick={onClose} style={{ background:'#6366F1',color:'#fff',border:'none',borderRadius:10,padding:'10px 28px',fontSize:13,fontWeight:700,cursor:'pointer' }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize:17,fontWeight:800,color:'#1E293B',marginBottom:20 }}>💡 Request a New Community</div>
            {(['name','category','reason'] as const).map(field => (
              <div key={field} style={{ marginBottom:14 }}>
                <label style={{ fontSize:11,color:'#64748B',fontWeight:700,letterSpacing:'0.08em',display:'block',marginBottom:6 }}>
                  {field==='name'?'COMMUNITY NAME *':field==='category'?'HEALTH CATEGORY':'WHY IS THIS NEEDED? *'}
                </label>
                {field==='reason'?(
                  <textarea value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} rows={3} placeholder="Describe the health condition and why a community would help..."
                    style={{ width:'100%',border:'1px solid #E2E8F0',borderRadius:9,padding:'10px 14px',fontSize:13,color:'#1E293B',outline:'none',resize:'none',fontFamily:'inherit',boxSizing:'border-box' }}/>
                ):(
                  <input value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={field==='name'?'e.g. Fibromyalgia Warriors':'e.g. Chronic Pain'}
                    style={{ width:'100%',border:'1px solid #E2E8F0',borderRadius:9,padding:'10px 14px',fontSize:13,color:'#1E293B',outline:'none',fontFamily:'inherit',boxSizing:'border-box' }}/>
                )}
              </div>
            ))}
            <div style={{ display:'flex',gap:10,marginTop:20 }}>
              <button onClick={onClose} style={{ flex:1,background:'#F8FAFC',color:'#64748B',border:'1px solid #E2E8F0',borderRadius:10,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer' }}>Cancel</button>
              <button onClick={submit} disabled={submitting||!form.name.trim()||!form.reason.trim()}
                style={{ flex:2,background:form.name.trim()&&form.reason.trim()?'#6366F1':'#E2E8F0',color:form.name.trim()&&form.reason.trim()?'#fff':'#94A3B8',border:'none',borderRadius:10,padding:'10px',fontSize:13,fontWeight:800,cursor:'pointer' }}>
                {submitting?'Submitting...':'Submit Request →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Community Card — light theme ──────────────────────────────────────────────
const CommunityCard = ({ community, user, onJoin, onNavigate, onSignIn, viewMode='tile' }: {
  community:Community; user:AuthUser|null;
  onJoin:(c:Community)=>void; onNavigate:(c:Community)=>void; onSignIn:()=>void;
  viewMode?:'tile'|'list';
}) => {
  const accent = CAT_COLOR[community.category]||'#6366F1';
  const bg     = CAT_BG[community.category]||'#F8FAFC';
  const [joining,setJoining] = useState(false);
  const [joined,setJoined]   = useState(community.is_joined);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onSignIn(); return; }
    if (joined) { onNavigate(community); return; }
    setJoining(true);
    try {
      const res = await fetch(`${API}/api/communities/${community.id}/join`,{ method:'POST', headers:{ Authorization:`Bearer ${user.token}`,'Content-Type':'application/json' } });
      if (res.ok) {
        setJoined(true);
        const ids:string[] = JSON.parse(localStorage.getItem('hc_joined_communities')||'[]');
        if (!ids.includes(community.id)) localStorage.setItem('hc_joined_communities',JSON.stringify([...ids,community.id]));
      }
    } catch { setJoined(true); } finally { setJoining(false); }
  };

  const hasVerified = ['diabetes-warriors','heart-health-circle','mental-wellness-india','pcos-sisters','cancer-support-network'].includes(community.slug);
  const isNew = community.id?.startsWith('cm-0') || community.id?.startsWith('seed-cm');

  const ActionButtons = () => (
    <div style={{ display:'flex',gap:7 }}>
      <button onClick={e=>{e.stopPropagation();e.preventDefault();const slug=community.slug||community.id;if(slug) window.location.href=`/communities/${slug}`;}}
        style={{ flex:1,background:`${accent}18`,color:accent,border:`1px solid ${accent}33`,borderRadius:8,padding:'7px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap' }}>
        View Feed
      </button>
      <button onClick={handleJoin} disabled={joining}
        style={{ flex:1.3,background:joined?`${accent}18`:accent,color:joined?accent:'#fff',border:joined?`1px solid ${accent}44`:'none',borderRadius:8,padding:'7px',fontSize:11,fontWeight:800,cursor:'pointer',whiteSpace:'nowrap' }}>
        {joining?'...':joined?'✓ Joined':user?'Join Free':'Sign in'}
      </button>
    </div>
  );

  /* ── LIST VIEW ── */
  if (viewMode === 'list') {
    return (
      <div onClick={()=>onNavigate(community)}
        style={{ background:'#fff',border:'1px solid #E8EEF5',borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'all 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',display:'flex',alignItems:'stretch' }}
        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=`0 4px 18px ${accent}1A`;(e.currentTarget as HTMLDivElement).style.borderColor=`${accent}44`;}}
        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 4px rgba(0,0,0,0.05)';(e.currentTarget as HTMLDivElement).style.borderColor='#E8EEF5';}}>
        {/* Left accent bar */}
        <div style={{ width:4,background:`linear-gradient(180deg,${accent},${accent}55)`,flexShrink:0 }}/>
        <div style={{ flex:1,padding:'12px 16px',display:'flex',alignItems:'center',gap:14 }}>
          {/* Emoji */}
          <div style={{ width:44,height:44,borderRadius:11,background:bg,border:`1px solid ${accent}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>
            {community.emoji}
          </div>
          {/* Name + desc */}
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:3 }}>
              <span style={{ fontSize:14,fontWeight:800,color:'#1E293B' }}>{community.name}</span>
              {hasVerified && <span style={{ fontSize:9,background:'#EBF5FB',color:'#2980B9',border:'1px solid #AED6F1',borderRadius:5,padding:'1px 5px',fontWeight:700 }}>✓ Doctor</span>}
              {isNew && <span style={{ fontSize:9,background:'#F0FFF4',color:'#276749',border:'1px solid #9AE6B4',borderRadius:5,padding:'1px 5px',fontWeight:700 }}>NEW</span>}
              {community.isFeatured && <span style={{ fontSize:9,background:`${accent}15`,color:accent,border:`1px solid ${accent}33`,borderRadius:5,padding:'1px 5px',fontWeight:700 }}>★</span>}
            </div>
            <div style={{ fontSize:12,color:'#64748B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:400 }}>{community.description}</div>
          </div>
          {/* Category */}
          <div style={{ flexShrink:0,textAlign:'center',minWidth:90 }}>
            <div style={{ fontSize:10,color:accent,fontWeight:700,background:`${accent}12`,borderRadius:6,padding:'2px 8px' }}>{community.category}</div>
          </div>
          {/* Stats */}
          <div style={{ display:'flex',gap:20,flexShrink:0 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:14,fontWeight:800,color:'#1E293B' }}>{(community.member_count||0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize:9,color:'#94A3B8',fontWeight:600 }}>MEMBERS</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:14,fontWeight:800,color:'#1E293B' }}>{(community.post_count||0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize:9,color:'#94A3B8',fontWeight:600 }}>POSTS</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:14,fontWeight:800,color:'#1E293B' }}>{(community.allowAnonymous||community.allows_anonymous)?'✓':'✗'}</div>
              <div style={{ fontSize:9,color:'#94A3B8',fontWeight:600 }}>ANON</div>
            </div>
          </div>
          {/* Actions */}
          <div style={{ flexShrink:0 }} onClick={e=>e.stopPropagation()}>
            <ActionButtons/>
          </div>
        </div>
      </div>
    );
  }

  /* ── TILE VIEW ── */
  return (
    <div onClick={()=>onNavigate(community)}
      style={{ background:'#fff',border:'1px solid #E8EEF5',borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all 0.2s',display:'flex',flexDirection:'column',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=`0 8px 28px ${accent}22`;(e.currentTarget as HTMLDivElement).style.borderColor=`${accent}55`;(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 4px rgba(0,0,0,0.06)';(e.currentTarget as HTMLDivElement).style.borderColor='#E8EEF5';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';}}>

      <div style={{ height:3,background:`linear-gradient(90deg,${accent},${accent}66)` }}/>

      <div style={{ padding:'14px 16px',flex:1,display:'flex',flexDirection:'column',gap:9 }}>
        <div style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
          <div style={{ width:42,height:42,borderRadius:11,background:bg,border:`1px solid ${accent}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:21,flexShrink:0 }}>
            {community.emoji}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',marginBottom:1 }}>
              <div style={{ fontSize:13.5,fontWeight:800,color:'#1E293B',lineHeight:1.3 }}>{community.name}</div>
              {isNew && <span style={{ fontSize:9,background:'#F0FFF4',color:'#276749',border:'1px solid #9AE6B4',borderRadius:5,padding:'1px 5px',fontWeight:700 }}>NEW</span>}
              {hasVerified && <span style={{ fontSize:9,background:'#EBF5FB',color:'#2980B9',border:'1px solid #AED6F1',borderRadius:5,padding:'1px 5px',fontWeight:700 }}>✓ Doctor</span>}
            </div>
            <div style={{ fontSize:10,color:accent,fontWeight:700,letterSpacing:'0.06em' }}>{community.category.toUpperCase()}</div>
          </div>
          {community.isFeatured && <span style={{ fontSize:9,background:`${accent}15`,color:accent,border:`1px solid ${accent}33`,borderRadius:7,padding:'2px 6px',fontWeight:800,whiteSpace:'nowrap',flexShrink:0 }}>★ FEATURED</span>}
        </div>

        <p style={{ fontSize:12,color:'#475569',lineHeight:1.6,margin:0,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>
          {community.description}
        </p>

        {community.tags && community.tags.length > 0 && (
          <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
            {community.tags.slice(0,3).map(t=>(
              <span key={t} style={{ fontSize:10,color:accent,background:`${accent}12`,borderRadius:5,padding:'1px 7px',fontWeight:600 }}>#{t}</span>
            ))}
          </div>
        )}

        <div style={{ display:'flex',gap:0,marginTop:'auto',background:'#F8FAFC',borderRadius:9,overflow:'hidden',border:'1px solid #E8EEF5' }}>
          {[
            { val:(community.member_count||0).toLocaleString('en-IN'), label:'Members', icon:'👥' },
            { val:(community.post_count||0).toLocaleString('en-IN'),   label:'Posts',   icon:'💬' },
            { val:(community.allowAnonymous||community.allows_anonymous)?'Yes':'No', label:'Anonymous', icon:'🎭' },
          ].map((s,i)=>(
            <div key={i} style={{ flex:1,padding:'7px 0',textAlign:'center',borderRight:i<2?'1px solid #E8EEF5':'none' }}>
              <div style={{ fontSize:12,fontWeight:800,color:'#1E293B' }}>{s.icon} {s.val}</div>
              <div style={{ fontSize:9,color:'#64748B',fontWeight:600,letterSpacing:'0.05em' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop:8,borderTop:'1px solid #F1F5F9' }} onClick={e=>e.stopPropagation()}>
          <ActionButtons/>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CommunitiesPage() {
  const router   = useRouter();
  const browseRef = useRef<HTMLDivElement>(null);
  const { openAuthModal } = useUIStore() as any;

  const [user,            setUser]            = useState<AuthUser|null>(null);
  const [communities,     setCommunities]     = useState<Community[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [activeCategory,  setActiveCategory]  = useState('all');
  const [activeLang,      setActiveLang]      = useState('All Languages');
  const [showMyOnly,      setShowMyOnly]      = useState(false);
  const [showRequestModal,setShowRequestModal]= useState(false);
  const [carouselIdx,     setCarouselIdx]     = useState(0);
  const [activityIdx,     setActivityIdx]     = useState(0);
  const [progressPct,     setProgressPct]     = useState(0);
  const [viewMode,        setViewMode]        = useState<'tile'|'list'>('tile');

  // Carousel slides: 6 rich slides with two-panel layout
  const SLIDES = [
    { accent:'#E53E3E', tag:'PATIENT STORY', emoji:'🩸',
      stat:'3,842', statLabel:'Diabetes Warriors',
      headline:'HbA1c from 9.2 → 6.8',
      subtext:'in just 3 months',
      quote:'"The community helped me understand that evening walks matter more than skipping dessert. My numbers speak for themselves."',
      author:'Priya M., Mumbai', role:'Type 2 Diabetes • 2 years',
      facts:['Average HbA1c improvement: 1.8 points','78% report better medication adherence','Doctor moderates every week'] },
    { accent:'#6B46C1', tag:'PLATFORM FACT', emoji:'🎭',
      stat:'100%', statLabel:'Anonymous',
      headline:'Post without fear',
      subtext:'your identity stays yours',
      quote:'"I shared my depression diagnosis anonymously for 6 months before telling my family. This community gave me the courage."',
      author:'Arjun N., Kochi', role:'Mental Wellness • 1 year',
      facts:['Zero identity revealed ever','Same alias across all sessions','Doctors cannot see your real name'] },
    { accent:'#276749', tag:'DOCTOR INSIGHT', emoji:'🩺',
      stat:'847+', statLabel:'Verified Doctors',
      headline:'Real doctors, real answers',
      subtext:'actively participating daily',
      quote:'"I answer 3-4 community questions every evening. It takes 10 minutes and helps hundreds of patients understand their conditions better."',
      author:'Dr. Arun K., Mumbai', role:'Diabetologist • HealthConnect Verified',
      facts:['Avg response time: 4 hours','All doctors HCD-verified','Doctor answers marked with ✓ badge'] },
    { accent:'#D53F8C', tag:'COMMUNITY IMPACT', emoji:'🌸',
      stat:'4,389', statLabel:'PCOS Sisters',
      headline:'India\'s largest PCOS community',
      subtext:'growing by 200 members/month',
      quote:'"PCOS Sisters helped me understand inositol, cut through the noise of social media myths, and find a doctor who actually listened."',
      author:'Sunita P., Ahmedabad', role:'PCOS/PCOD • 3 years',
      facts:['70% report better symptom awareness','Monthly Q&A with gynaecologists','Anonymous fertility discussions allowed'] },
    { accent:'#2B6CB0', tag:'WHY IT WORKS', emoji:'📊',
      stat:'15K+', statLabel:'Posts & Counting',
      headline:'Evidence-based discussions only',
      subtext:'no misinformation tolerated',
      quote:'"Every post in our community is moderated. We remove harmful advice and pin doctor-verified guidance. Safety is our top priority."',
      author:'HealthConnect Medical Team', role:'Community Standards',
      facts:['AI + human moderation 24/7','Misinformation removed in <2 hours','Cited sources required for medical claims'] },
    { accent:'#C05621', tag:'INDIA FIRST', emoji:'🌍',
      stat:'Free', statLabel:'Forever',
      headline:'Built for Bharat, not Silicon Valley',
      subtext:'8 languages, every state covered',
      quote:'"I post in Hindi, my doctor replies in Hindi. For the first time, I understand my own health condition in my own language."',
      author:'Ramesh G., Lucknow', role:'Hypertension Heroes • 8 months',
      facts:['Hindi, Tamil, Telugu, Malayalam & more','Bharat-first UI design','No paywall, no ads, no data selling'] },
  ];

  const slide = SLIDES[carouselIdx];

  // Auto-advance carousel with progress
  useEffect(() => {
    setProgressPct(0);
    const duration = 5500;
    const interval = 60;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setProgressPct(Math.min((elapsed/duration)*100, 100));
      if (elapsed >= duration) {
        setCarouselIdx(i => (i+1) % SLIDES.length);
        elapsed = 0;
        setProgressPct(0);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [carouselIdx]);

  // Auto-advance activity ticker
  useEffect(() => {
    const t = setInterval(() => setActivityIdx(i=>(i+1)%ACTIVITY_FEED.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setUser(getAuthUser()); }, []);

  const handleSignIn = useCallback(() => {
    openAuthModal?.('login');
    if (typeof window !== 'undefined' && window.location.pathname !== '/') router.push('/');
  }, [openAuthModal, router]);

  const handleJoinUnauthenticated = useCallback((community: Community) => {
    sessionStorage.setItem('hc_pending_join', community.id);
    handleSignIn();
  }, [handleSignIn]);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (search) params.set('search', search);
      const headers: Record<string,string> = {};
      const u = getAuthUser();
      if (u) headers['Authorization'] = `Bearer ${u.token}`;
      const res = await fetch(`${API}/api/communities?${params}`, { headers });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const list: Community[] = Array.isArray(data)?data:(data.data||data.communities||[]);
      const joinedIds: string[] = JSON.parse(localStorage.getItem('hc_joined_communities')||'[]');
      const merged = list.map(c=>({ ...c, is_joined:c.is_joined||joinedIds.includes(c.id) }));
      setCommunities(merged.length>0 ? merged : MOCK_FALLBACK);
    } catch { setCommunities(MOCK_FALLBACK); }
    finally { setLoading(false); }
  }, [activeCategory, search]);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  // Handle pending join after auth redirect
  useEffect(() => {
    const pending = sessionStorage.getItem('hc_pending_join');
    const u = getAuthUser();
    if (pending && u) {
      sessionStorage.removeItem('hc_pending_join');
      fetch(`${API}/api/communities/${pending}/join`,{ method:'POST', headers:{ Authorization:`Bearer ${u.token}`,'Content-Type':'application/json' } }).catch(()=>{});
    }
  }, []);

  const handleNavigate = (c: Community) => router.push(`/communities/${c.slug || c.id}`);

  // Language code map
  const LANG_CODE: Record<string,string> = {
    'Hindi':'hi','English':'en','Tamil':'ta','Telugu':'te',
    'Malayalam':'ml','Kannada':'kn','Bengali':'bn','Gujarati':'gu','Marathi':'mr',
  };

  const filteredCommunities = communities.filter(c => {
    if (showMyOnly && !c.is_joined) return false;
    // Language filter — only filter if a specific language is selected AND community has language set
    if (activeLang !== 'All Languages') {
      const targetCode = LANG_CODE[activeLang];
      if (targetCode && c.language && c.language !== targetCode) return false;
    }
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    }
    // Category filter
    if (activeCategory !== 'all' && c.category !== activeCategory) return false;
    return true;
  });

  const featuredCommunities = communities.filter(c=>c.isFeatured).slice(0,5);
  const activity = ACTIVITY_FEED[activityIdx];

  return (
    <div style={{ minHeight:'100vh', background:'#F0F5FB', fontFamily:'system-ui,-apple-system,sans-serif' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{ background:'#0A1628',borderBottom:'1px solid rgba(255,255,255,0.08)',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ maxWidth:1260,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',gap:20,height:62 }}>
          <button onClick={()=>router.push('/')} style={{ background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:'linear-gradient(135deg,#14B8A6,#6366F1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff' }}>H</div>
            <div>
              <div style={{ fontSize:16,fontWeight:900,color:'#fff',lineHeight:1,fontFamily:'Poppins,sans-serif' }}>HealthConnect</div>
              <div style={{ fontSize:10,color:'rgba(255,255,255,0.5)',letterSpacing:'0.18em',lineHeight:1.3 }}>INDIA</div>
            </div>
          </button>

          {/* Live activity ticker */}
          <div style={{ flex:1,display:'flex',justifyContent:'center' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.06)',borderRadius:20,padding:'5px 14px',maxWidth:420,overflow:'hidden' }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'#4ADE80',flexShrink:0,animation:'livePulse 1.5s ease-in-out infinite' }}/>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.65)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                <span style={{ color:'rgba(255,255,255,0.9)',fontWeight:600 }}>{activity.name}</span> {activity.action} <span style={{ color:'#14B8A6' }}>{activity.community}</span> · {activity.time}
              </span>
            </div>
          </div>

          <div style={{ display:'flex',gap:8,alignItems:'center',flexShrink:0 }}>
            {[['/',false,'Home'],['/doctors',false,'Doctors'],['/communities',true,'Communities'],['/hospitals',false,'Hospitals'],['/learn',false,'Learn']].map(([href,active,label])=>(
              <button key={href as string} onClick={()=>router.push(href as string)}
                style={{ background:'none',border:'none',cursor:'pointer',padding:'5px 11px',borderRadius:8,fontSize:13,fontWeight:active?800:500,color:active?'#A5B4FC':'rgba(255,255,255,0.65)',borderBottom:active?'2px solid #6366F1':'2px solid transparent' }}>
                {label as string}
              </button>
            ))}
          </div>

          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            {user ? (
              <button onClick={()=>router.push(getDashboardRoute(user.role))} style={{ background:'rgba(99,102,241,0.15)',color:'#A5B4FC',border:'1px solid rgba(99,102,241,0.3)',borderRadius:9,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer' }}>My Dashboard</button>
            ) : (
              <button onClick={handleSignIn} style={{ background:'linear-gradient(135deg,#14B8A6,#6366F1)',color:'#fff',border:'none',borderRadius:9,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 10px rgba(20,184,166,0.3)' }}>Sign In</button>
            )}
            <button onClick={()=>router.push('/doctors')} style={{ background:'linear-gradient(135deg,#14B8A6,#0D9488)',color:'#fff',border:'none',borderRadius:9,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer' }}>Find Doctors</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(145deg,#1A4A7A 0%,#1E5799 35%,#2980B9 65%,#1A6EA8 100%)',position:'relative',overflow:'hidden' }}>
        {/* Hex pattern */}
        <svg style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%',opacity:0.06,pointerEvents:'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="hexP" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse"><polygon points="30,2 58,17 58,47 30,62 2,47 2,17" fill="none" stroke="#fff" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#hexP)"/>
        </svg>
        <div style={{ position:'absolute',top:'-30%',right:'3%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)',pointerEvents:'none' }}/>
        <svg style={{ position:'absolute',bottom:0,left:0,width:'100%',opacity:0.07,pointerEvents:'none' }} height="50" viewBox="0 0 1200 50">
          <polyline points="0,35 180,35 210,35 230,8 250,45 270,18 290,38 320,35 560,35 590,35 610,8 630,45 650,18 670,38 700,35 1200,35" fill="none" stroke="#fff" strokeWidth="1.5"/>
        </svg>

        <div style={{ maxWidth:1260,margin:'0 auto',padding:'22px 24px 26px',display:'grid',gridTemplateColumns:'1fr 620px',gap:24,alignItems:'stretch',position:'relative',zIndex:1 }}>

          {/* Left */}
          <div style={{ display:'flex',flexDirection:'column',justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:20,padding:'5px 14px',marginBottom:14 }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:'#4ADE80',display:'inline-block' }}/>
                <span style={{ fontSize:11.5,color:'#E0F7FA',fontWeight:700,letterSpacing:'0.08em' }}>18 ACTIVE COMMUNITIES · 22,000+ MEMBERS</span>
              </div>
              <h1 style={{ fontSize:'clamp(24px,3.6vw,40px)',fontWeight:900,color:'#fff',margin:'0 0 12px',lineHeight:1.2,fontFamily:'Poppins,sans-serif' }}>
                Health Communities<br/>
                <span style={{ background:'linear-gradient(90deg,#7EE8E0,#A5F3EF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>Built for Bharat</span>
              </h1>
              <p style={{ fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.7,margin:'0 0 20px',maxWidth:480 }}>
                Join thousands of patients sharing real experiences, learning from verified doctors, and supporting each other — in your language, for your condition, free forever.
              </p>
              <button onClick={()=>browseRef.current?.scrollIntoView({behavior:'smooth'})}
                style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)',color:'#fff',border:'none',borderRadius:11,padding:'12px 28px',fontSize:14,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 20px rgba(99,102,241,0.4)' }}>
                Browse Communities ↓
              </button>
            </div>

            {/* Stats — compact inline strip, no tiles */}
            <div style={{ display:'flex',gap:20,marginTop:18,paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.12)' }}>
              {[['👥','22,000+','Members'],['🏥','18','Communities'],['💬','15,000+','Posts']].map(([e,n,l])=>(
                <div key={l} style={{ display:'flex',alignItems:'center',gap:7 }}>
                  <span style={{ fontSize:16 }}>{e}</span>
                  <div>
                    <div style={{ fontSize:16,fontWeight:900,color:'#fff',lineHeight:1 }}>{n}</div>
                    <div style={{ fontSize:9,color:'rgba(255,255,255,0.5)',fontWeight:600 }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Full-height dual-panel carousel */}
          <div style={{ background:'rgba(15,30,62,0.48)',borderRadius:20,backdropFilter:'blur(22px)',boxShadow:'0 20px 60px rgba(0,0,0,0.32)',overflow:'hidden',display:'flex',flexDirection:'column' }}>
            {/* Accent top strip */}
            <div style={{ height:4,background:`linear-gradient(90deg,${slide.accent},${slide.accent}55)`,flexShrink:0 }}/>

            {/* Tag */}
            <div style={{ padding:'16px 20px 0',flexShrink:0 }}>
              <span style={{ fontSize:11,fontWeight:800,color:slide.accent,letterSpacing:'0.1em',background:`${slide.accent}22`,borderRadius:6,padding:'4px 12px',border:`1px solid ${slide.accent}55` }}>{slide.tag}</span>
            </div>

            {/* Three-panel body */}
            <div style={{ display:'grid',gridTemplateColumns:'1.1fr 1fr 0.9fr',gap:0,flex:1,minHeight:0 }}>

              {/* Panel 1 — Big stat + headline + subtext */}
              <div style={{ padding:'14px 14px 14px 18px',display:'flex',flexDirection:'column',borderRight:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:44,fontWeight:900,color:'#fff',lineHeight:1,letterSpacing:'-0.03em' }}>{slide.stat}</div>
                  <div style={{ fontSize:11,color:slide.accent,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase' as const,marginTop:3 }}>{slide.statLabel}</div>
                </div>
                <div style={{ fontSize:17,fontWeight:800,color:'#fff',lineHeight:1.3,marginBottom:5 }}>{slide.headline}</div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.55)',marginBottom:12 }}>{slide.subtext}</div>
                {/* Slide nav emoji buttons */}
                <div style={{ marginTop:'auto',display:'flex',flexWrap:'wrap' as const,gap:5 }}>
                  {SLIDES.map((s,i)=>(
                    <button key={i} onClick={()=>setCarouselIdx(i)}
                      style={{ fontSize:15,background:i===carouselIdx?`${s.accent}44`:'rgba(255,255,255,0.07)',border:`1px solid ${i===carouselIdx?s.accent+'66':'rgba(255,255,255,0.1)'}`,borderRadius:8,width:30,height:30,cursor:'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {s.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel 2 — Patient quote */}
              <div style={{ padding:'14px 14px',display:'flex',flexDirection:'column',borderRight:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',marginBottom:10 }}>PATIENT VOICE</div>
                <div style={{ flex:1,background:'rgba(255,255,255,0.05)',borderRadius:10,padding:'12px 13px',borderLeft:`3px solid ${slide.accent}`,display:'flex',flexDirection:'column' as const }}>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,0.82)',lineHeight:1.65,fontStyle:'italic',flex:1 }}>{slide.quote}</div>
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:11,fontWeight:800,color:'#fff' }}>{slide.author}</div>
                    <div style={{ fontSize:10,color:slide.accent,fontWeight:600 }}>{slide.role}</div>
                  </div>
                </div>
              </div>

              {/* Panel 3 — Platform facts */}
              <div style={{ padding:'14px 16px 14px 12px',display:'flex',flexDirection:'column',gap:8 }}>
                <div style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',marginBottom:2 }}>PLATFORM FACTS</div>
                {slide.facts.map((f,i)=>(
                  <div key={i} style={{ background:'rgba(255,255,255,0.06)',borderRadius:9,padding:'9px 11px',border:'1px solid rgba(255,255,255,0.08)',flex:1 }}>
                    <div style={{ display:'flex',alignItems:'flex-start',gap:7 }}>
                      <span style={{ color:slide.accent,fontSize:12,lineHeight:1,flexShrink:0,marginTop:1 }}>✦</span>
                      <span style={{ fontSize:11,color:'rgba(255,255,255,0.8)',lineHeight:1.5,fontWeight:500 }}>{f}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height:3,background:'rgba(255,255,255,0.08)',flexShrink:0 }}>
              <div style={{ height:'100%',background:slide.accent,transition:'width 0.06s linear',width:`${progressPct}%` }}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── Featured strip ───────────────────────────────────────────────── */}
      {featuredCommunities.length > 0 && (
        <div style={{ background:'#fff',borderBottom:'1px solid #D1DCE8',padding:'16px 24px' }}>
          <div style={{ maxWidth:1260,margin:'0 auto' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
              <span style={{ fontSize:11,fontWeight:800,color:'#475569',letterSpacing:'0.08em',flexShrink:0 }}>FEATURED:</span>
            </div>
            {/* Grid — 4 cols so every row aligns perfectly */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
              {featuredCommunities.map(c=>(
                <button key={c.id} onClick={()=>handleNavigate(c)}
                  style={{ display:'flex',alignItems:'center',gap:8,background:'#F8FAFC',border:'1px solid #CBD5E1',borderRadius:22,padding:'8px 14px',fontSize:13,fontWeight:700,color:'#1E293B',cursor:'pointer',transition:'all 0.2s',overflow:'hidden' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=CAT_COLOR[c.category]||'#6366F1';(e.currentTarget as HTMLButtonElement).style.background='#EEF4FB';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='#CBD5E1';(e.currentTarget as HTMLButtonElement).style.background='#F8FAFC';}}>
                  <span style={{ fontSize:17,flexShrink:0 }}>{c.emoji}</span>
                  <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize:11,color:'#94A3B8',flexShrink:0,marginLeft:'auto' }}>{(c.member_count||0).toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Browse section ───────────────────────────────────────────────── */}
      <div style={{ maxWidth:1260,margin:'0 auto',padding:'24px 24px' }}>
        <div style={{ display:'grid',gridTemplateColumns:'252px 1fr',gap:22,alignItems:'start' }}>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div style={{ position:'sticky',top:76 }}>
            {/* Search */}
            <div style={{ background:'#DDE8F5',borderRadius:12,padding:14,marginBottom:11,border:'1px solid #C0D4EC' }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search communities..."
                style={{ width:'100%',background:'#fff',border:'1px solid #C0D4EC',borderRadius:9,padding:'9px 14px',fontSize:13,color:'#1E293B',outline:'none',boxSizing:'border-box',fontFamily:'inherit' }}/>
            </div>

            {/* Language filter — NEW */}
            <div style={{ background:'#DDE8F5',borderRadius:12,padding:14,marginBottom:11,border:'1px solid #C0D4EC' }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#3B5272',letterSpacing:'0.08em',marginBottom:9 }}>🌐 LANGUAGE</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                {['All Languages','Hindi','English','Tamil','Telugu','Malayalam'].map(lang=>(
                  <button key={lang} onClick={()=>setActiveLang(lang)}
                    style={{ fontSize:11,fontWeight:activeLang===lang?700:500,color:activeLang===lang?'#fff':'#475569',background:activeLang===lang?'#6366F1':'#fff',border:`1px solid ${activeLang===lang?'#6366F1':'#CBD5E1'}`,borderRadius:7,padding:'4px 9px',cursor:'pointer' }}>
                    {lang==='All Languages'?'🌐 All':lang}
                  </button>
                ))}
              </div>
            </div>

            {/* My Communities */}
            {user && (
              <div style={{ background:'#DDE8F5',borderRadius:12,padding:14,marginBottom:11,border:'1px solid #C0D4EC' }}>
                <div style={{ fontSize:11,fontWeight:800,color:'#3B5272',letterSpacing:'0.08em',marginBottom:9 }}>MY COMMUNITIES</div>
                <button onClick={()=>setShowMyOnly(!showMyOnly)}
                  style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:showMyOnly?'rgba(99,102,241,0.1)':'#fff',border:`1px solid ${showMyOnly?'rgba(99,102,241,0.4)':'#C0D4EC'}`,borderRadius:9,padding:'8px 12px',fontSize:13,fontWeight:700,color:showMyOnly?'#6366F1':'#334155',cursor:'pointer' }}>
                  Show Joined Only
                  <span style={{ fontSize:12,background:showMyOnly?'#6366F1':'#CBD5E1',color:showMyOnly?'#fff':'#64748B',borderRadius:6,padding:'1px 8px' }}>
                    {communities.filter(c=>c.is_joined).length}
                  </span>
                </button>
              </div>
            )}

            {/* Categories */}
            <div style={{ background:'#DDE8F5',borderRadius:12,padding:14,marginBottom:11,border:'1px solid #C0D4EC' }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#3B5272',letterSpacing:'0.08em',marginBottom:9 }}>CATEGORIES</div>
              {CATEGORIES.map(cat=>(
                <button key={cat.key} onClick={()=>setActiveCategory(cat.key)}
                  style={{ width:'100%',display:'flex',alignItems:'center',gap:8,background:activeCategory===cat.key?'rgba(99,102,241,0.12)':'transparent',border:'none',borderRadius:8,padding:'8px 10px',fontSize:13,fontWeight:activeCategory===cat.key?700:500,color:activeCategory===cat.key?'#6366F1':'#334155',cursor:'pointer',textAlign:'left',marginBottom:2 }}>
                  <span style={{ fontSize:15 }}>{cat.emoji}</span>{cat.label}
                  <span style={{ marginLeft:'auto',fontSize:11,color:'#94A3B8' }}>
                    {cat.key==='all'?communities.length:communities.filter(c=>c.category===cat.key).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Request community */}
            <div style={{ background:'linear-gradient(135deg,#DDE8F5,#D0E0F0)',border:'1px solid #C0D4EC',borderRadius:12,padding:14,textAlign:'center' }}>
              <div style={{ fontSize:22,marginBottom:7 }}>💡</div>
              <div style={{ fontSize:13,fontWeight:800,color:'#1E3A5F',marginBottom:5 }}>Can't Find Your Condition?</div>
              <div style={{ fontSize:12,color:'#475569',marginBottom:11,lineHeight:1.5 }}>Request a community — created within 48 hours.</div>
              <button onClick={()=>user?setShowRequestModal(true):handleSignIn()}
                style={{ width:'100%',background:'#6366F1',color:'#fff',border:'none',borderRadius:9,padding:'9px',fontSize:13,fontWeight:700,cursor:'pointer' }}>
                Request Community
              </button>
            </div>
          </div>

          {/* ── Main grid ────────────────────────────────────────────────── */}
          <div ref={browseRef}>
            {/* Header + view toggle */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8 }}>
              <div style={{ fontSize:18,fontWeight:800,color:'#1E293B' }}>
                {activeCategory==='all'?'All Communities':activeCategory}
                <span style={{ fontSize:13,fontWeight:500,color:'#64748B',marginLeft:8 }}>({filteredCommunities.length} found)</span>
              </div>
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                {showMyOnly && (
                  <button onClick={()=>setShowMyOnly(false)} style={{ fontSize:11,background:'rgba(99,102,241,0.1)',color:'#6366F1',border:'1px solid rgba(99,102,241,0.25)',borderRadius:8,padding:'4px 12px',fontWeight:700,cursor:'pointer' }}>
                    Joined only ×
                  </button>
                )}
                {/* View mode toggle */}
                <div style={{ display:'flex',background:'#E8EEF5',borderRadius:9,padding:2,gap:2 }}>
                  <button onClick={()=>setViewMode('tile')}
                    style={{ background:viewMode==='tile'?'#fff':'transparent',border:'none',borderRadius:7,padding:'5px 10px',fontSize:13,cursor:'pointer',color:viewMode==='tile'?'#1E293B':'#64748B',boxShadow:viewMode==='tile'?'0 1px 4px rgba(0,0,0,0.1)':'none',fontWeight:viewMode==='tile'?700:400,transition:'all 0.15s' }}
                    title="Tile view">
                    ⊞
                  </button>
                  <button onClick={()=>setViewMode('list')}
                    style={{ background:viewMode==='list'?'#fff':'transparent',border:'none',borderRadius:7,padding:'5px 10px',fontSize:13,cursor:'pointer',color:viewMode==='list'?'#1E293B':'#64748B',boxShadow:viewMode==='list'?'0 1px 4px rgba(0,0,0,0.1)':'none',fontWeight:viewMode==='list'?700:400,transition:'all 0.15s' }}
                    title="List view">
                    ☰
                  </button>
                </div>
              </div>
            </div>

            {loading && (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(276px,1fr))',gap:14 }}>
                {[...Array(6)].map((_,i)=>(
                  <div key={i} style={{ background:'#E2EAF3',borderRadius:14,height:200,animation:'shimmer 1.5s ease-in-out infinite',opacity:0.7 }}/>
                ))}
              </div>
            )}

            {!loading && filteredCommunities.length > 0 && (
              <div style={{ display:viewMode==='tile'?'grid':'flex', gridTemplateColumns:viewMode==='tile'?'repeat(auto-fill,minmax(276px,1fr))':undefined, flexDirection:viewMode==='list'?'column':undefined, gap:viewMode==='tile'?14:10 }}>
                {filteredCommunities.map(c=>(
                  <CommunityCard key={c.id} community={c} user={user} viewMode={viewMode}
                    onJoin={handleJoinUnauthenticated} onNavigate={handleNavigate} onSignIn={handleSignIn}/>
                ))}
              </div>
            )}

            {!loading && filteredCommunities.length === 0 && (
              <div style={{ textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:14,border:'1px solid #E8EEF5' }}>
                <div style={{ fontSize:44,marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:16,fontWeight:700,color:'#1E293B',marginBottom:8 }}>No communities found</div>
                <div style={{ fontSize:13,color:'#64748B',marginBottom:20 }}>Try a different search or category</div>
                <button onClick={()=>{setSearch('');setActiveCategory('all');setShowMyOnly(false);}}
                  style={{ background:'#6366F1',color:'#fff',border:'none',borderRadius:9,padding:'10px 24px',fontSize:13,fontWeight:700,cursor:'pointer' }}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRequestModal && user && <RequestModal onClose={()=>setShowRequestModal(false)} token={user.token}/>}

      <style>{`
        @keyframes shimmer{0%,100%{opacity:0.5}50%{opacity:0.9}}
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.2)}}
      `}</style>
    </div>
  );
}
