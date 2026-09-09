'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

function getDashRoute(role?: string){
  switch(String(role??'').toUpperCase()){
    case 'DOCTOR': return '/doctor-dashboard';
    case 'HOSPITAL': return '/hospital-dashboard';
    case 'ADMIN': return '/admin-dashboard';
    default: return '/dashboard';
  }
}

type AuthMode = 'login'|'register';

function UserMenu({user,onSignOut}:{user:any;onSignOut:()=>void}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const initials=`${user?.firstName?.[0]??''}${user?.lastName?.[0]??''}`.toUpperCase()||'U';
  const fullName=`${user?.firstName??''} ${user?.lastName??''}`.trim()||'HealthConnect user';

  useEffect(()=>{
    const closeOutside=(event:MouseEvent)=>{if(ref.current&&!ref.current.contains(event.target as Node))setOpen(false)};
    const closeEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    document.addEventListener('mousedown',closeOutside);
    document.addEventListener('keydown',closeEscape);
    return()=>{document.removeEventListener('mousedown',closeOutside);document.removeEventListener('keydown',closeEscape)};
  },[]);

  const dash=getDashRoute(user?.role);
  return <div ref={ref} style={{position:'relative'}}>
    <button type="button" onClick={()=>setOpen(v=>!v)} className="hc-user-trigger" aria-haspopup="menu" aria-expanded={open} aria-controls="hc-user-menu"><span className="hc-user-avatar">{initials}</span><span className="hc-user-name">{user?.firstName||'Account'}</span><span aria-hidden="true" style={{fontSize:9,color:'#A7D7D0'}}>⌄</span></button>
    {open&&<div className="hc-user-menu" id="hc-user-menu" role="menu"><div className="hc-user-head"><div className="hc-user-avatar big">{initials}</div><strong>{fullName}</strong><span>{user?.email}</span></div><button role="menuitem" onClick={()=>{router.push(dash);setOpen(false)}}>My Dashboard <span>→</span></button><button role="menuitem" onClick={()=>{router.push(`${dash}?tab=profile`);setOpen(false)}}>Profile <span>›</span></button><button role="menuitem" onClick={()=>{router.push(`${dash}?tab=settings`);setOpen(false)}}>Settings <span>›</span></button><button role="menuitem" className="danger" onClick={()=>{onSignOut();setOpen(false);window.location.href='/?home=1'}}>Sign Out <span>↪</span></button></div>}
  </div>;
}

export default function PublicNavbar(){
  const router=useRouter();
  const pathname=usePathname();
  const {user,isAuthenticated,clearAuth,_hasHydrated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const [scrolled,setScrolled]=useState(false);
  const [scrollPct,setScrollPct]=useState(0);
  const [mobileOpen,setMobileOpen]=useState(false);

  useEffect(()=>{
    const update=()=>{setScrolled(window.scrollY>18);const h=document.documentElement.scrollHeight-window.innerHeight;setScrollPct(h>0?(window.scrollY/h)*100:0)};
    update();
    window.addEventListener('scroll',update,{passive:true});
    return()=>window.removeEventListener('scroll',update);
  },[]);

  useEffect(()=>setMobileOpen(false),[pathname]);

  useEffect(()=>{
    const previous=document.body.style.overflow;
    if(mobileOpen)document.body.style.overflow='hidden';
    else document.body.style.overflow=previous;
    const closeEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setMobileOpen(false)};
    document.addEventListener('keydown',closeEscape);
    return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',closeEscape)};
  },[mobileOpen]);

  const requestAuth=(mode:AuthMode)=>{
    setMobileOpen(false);
    if(pathname==='/'){openAuthModal(mode);return;}
    window.location.href=`/?home=1&auth=${mode}`;
  };
  const goHome=()=>{window.location.href='/?home=1'};
  const go=(href:string)=>{setMobileOpen(false);if(href==='/'){goHome();return;}router.push(href)};
  const active=(href:string)=>href==='/'?pathname==='/':pathname===href||pathname.startsWith(`${href}/`);
  const goPlans=()=>{setMobileOpen(false);if(pathname==='/'){document.getElementById('plans')?.scrollIntoView({behavior:'smooth',block:'start'});return;}window.location.href='/?home=1#plans';};

  const accountShortcut=(intent:'health'|'patients')=>{
    setMobileOpen(false);
    if(!isAuthenticated||!user){
      try{sessionStorage.setItem('hc_post_login_redirect',intent==='health'?'/dashboard':'/doctor-dashboard?tab=patients')}catch{}
      requestAuth('login');
      return;
    }
    const role=String(user.role??'').toUpperCase();
    if(intent==='health'&&role==='PATIENT'){router.push('/dashboard');return;}
    if(intent==='patients'&&role==='DOCTOR'){router.push('/doctor-dashboard?tab=patients');return;}
    router.push(getDashRoute(role));
  };

  const links=[['Home','/'],['Health Communities','/communities'],['Find Doctors','/doctors'],['Find Hospitals','/hospitals'],['Knowledge Hub','/learn']] as const;

  return <>
    <style>{`
      .hc-public-nav{position:fixed;top:0;left:0;right:0;height:74px;z-index:1000;background:#075B57;border-bottom:1px solid rgba(255,255,255,.12);font-family:'DM Sans',Arial,sans-serif;transition:box-shadow .2s,background .2s;box-shadow:0 4px 18px rgba(2,42,47,.12)}
      .hc-public-nav.scrolled{background:rgba(5,82,79,.97);backdrop-filter:blur(16px);box-shadow:0 10px 30px rgba(2,42,47,.20)}
      .hc-nav-inner{max-width:1480px;height:100%;margin:0 auto;padding:0 30px;display:flex;align-items:center}.hc-brand{display:flex;align-items:center;gap:11px;border:0;background:none;padding:0;margin-right:34px;cursor:pointer;flex-shrink:0}.hc-brand-logo{width:43px;height:43px;border-radius:12px;background:#fff;display:grid;place-items:center;color:#087F70;font-family:'Sora',sans-serif;font-size:14px;font-weight:900;box-shadow:0 5px 16px rgba(0,0,0,.12)}.hc-brand-copy{text-align:left}.hc-brand-copy strong{display:block;font-family:'Sora',sans-serif;color:#fff;font-size:20px;line-height:1.02;letter-spacing:-.025em}.hc-brand-copy span{display:block;color:#BFE9E3;font-size:8.5px;font-weight:750;margin-top:4px;white-space:nowrap}
      .hc-nav-links{display:flex;align-items:center;gap:4px;flex:1}.hc-nav-link{position:relative;border:0;background:transparent;padding:25px 9px 22px;color:#EAF8F5;font-size:12.5px;font-weight:750;white-space:nowrap;cursor:pointer;transition:color .16s}.hc-nav-link:after{content:'';position:absolute;left:9px;right:9px;bottom:13px;height:2px;border-radius:2px;background:#8EE7DA;transform:scaleX(0);transition:transform .16s}.hc-nav-link:hover{color:#fff}.hc-nav-link:hover:after,.hc-nav-link.active:after{transform:scaleX(1)}.hc-nav-link.active{color:#fff}.hc-nav-separator{width:1px;height:24px;background:rgba(255,255,255,.20);margin:0 5px}.hc-nav-auth{display:flex;gap:9px;align-items:center;margin-left:14px}.hc-signin,.hc-signup,.hc-dashboard-btn{border-radius:10px;padding:10px 17px;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap;transition:.16s}.hc-signin{border:1px solid rgba(255,255,255,.58);background:rgba(255,255,255,.11);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}.hc-signin:hover{background:rgba(255,255,255,.17);border-color:rgba(255,255,255,.78)}.hc-signup{border:1px solid #F7FAF9;background:#F7FAF9;color:#075B57;box-shadow:0 6px 17px rgba(0,0,0,.12)}.hc-signup:hover{background:#fff;transform:translateY(-1px)}.hc-dashboard-btn{border:1px solid #D8EEEA;background:#F1F8F6;color:#075B57}.hc-dashboard-btn:hover{background:#fff}
      .hc-brand:focus-visible,.hc-nav-link:focus-visible,.hc-signin:focus-visible,.hc-signup:focus-visible,.hc-dashboard-btn:focus-visible,.hc-user-trigger:focus-visible,.hc-hamburger:focus-visible,.hc-mobile-menu button:focus-visible{outline:3px solid rgba(153,246,228,.55);outline-offset:2px}
      .hc-user-trigger{display:flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.08);border-radius:10px;padding:4px 9px 4px 4px;cursor:pointer}.hc-user-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#087F70;font-size:10px;font-weight:900}.hc-user-avatar.big{width:42px;height:42px;font-size:14px;margin:0 auto 7px;background:linear-gradient(135deg,#0F766E,#14B8A6);color:#fff}.hc-user-name{font-size:11px;font-weight:800;color:#fff;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hc-user-menu{position:absolute;right:0;top:calc(100% + 9px);width:220px;background:#fff;border:1px solid #E2E8F0;border-radius:14px;box-shadow:0 14px 40px rgba(15,23,42,.14);overflow:hidden}.hc-user-head{text-align:center;padding:15px;border-bottom:1px solid #EEF2F6}.hc-user-head strong{display:block;font-size:12px;color:#0F172A}.hc-user-head span{display:block;font-size:9px;color:#94A3B8;margin-top:2px;overflow:hidden;text-overflow:ellipsis}.hc-user-menu>button{width:100%;display:flex;justify-content:space-between;border:0;border-bottom:1px solid #F1F5F9;background:#fff;padding:10px 13px;color:#475569;font-size:11px;font-weight:650;cursor:pointer;text-align:left}.hc-user-menu>button:hover,.hc-user-menu>button:focus-visible{background:#F8FAFC;outline:none}.hc-user-menu>button.danger{color:#DC2626}.hc-progress{position:absolute;bottom:0;left:0;height:2px;background:linear-gradient(90deg,#8EE7DA,#C4FFF4,#7DD3FC)}
      .hc-hamburger{display:none;margin-left:auto;border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.08);border-radius:9px;width:40px;height:40px;cursor:pointer;font-size:18px;color:#fff}.hc-mobile-menu{position:fixed;z-index:999;top:74px;left:0;right:0;bottom:0;background:#fff;padding:17px;transform:translateX(100%);transition:transform .25s ease,visibility .25s ease;overflow-y:auto;font-family:'DM Sans',Arial,sans-serif;visibility:hidden;pointer-events:none}.hc-mobile-menu.open{transform:translateX(0);visibility:visible;pointer-events:auto}.hc-mobile-menu button{width:100%;border:1px solid #E6EEF1;background:#F8FBFC;border-radius:10px;padding:12px 13px;text-align:left;color:#17324D;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:5px}.hc-mobile-menu button.active{background:#E9F8F5;border-color:#B7E4DC;color:#0F766E}.hc-mobile-divider{height:1px;background:#E6EEF1;margin:10px 0}.hc-mobile-help{font-size:9px;color:#71879A;padding:0 13px 7px;line-height:1.45}.hc-mobile-auth{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.hc-mobile-auth button{text-align:center;margin:0}.hc-mobile-auth .primary{background:#075B57;color:#fff;border-color:#075B57}
      @media(max-width:1120px){.hc-nav-links,.hc-nav-auth{display:none}.hc-hamburger{display:block}.hc-brand{margin-right:0}}@media(max-width:480px){.hc-nav-inner{padding:0 14px}.hc-brand-copy span{display:none}.hc-brand-copy strong{font-size:17px}.hc-brand-logo{width:39px;height:39px}}
    `}</style>
    <nav className={`hc-public-nav ${scrolled?'scrolled':''}`} aria-label="Primary navigation"><div className="hc-progress" style={{width:`${scrollPct}%`}} aria-hidden="true"/><div className="hc-nav-inner"><button type="button" className="hc-brand" onClick={goHome} aria-label="HealthConnect home"><span className="hc-brand-logo">HC</span><span className="hc-brand-copy"><strong>HealthConnect</strong><span>India&apos;s Unified Healthcare Platform</span></span></button><div className="hc-nav-links">{links.map(([label,href])=><button type="button" key={href} className={`hc-nav-link ${active(href)?'active':''}`} aria-current={active(href)?'page':undefined} onClick={()=>go(href)}>{label}</button>)}<button type="button" className="hc-nav-link" onClick={goPlans}>Plans</button><div className="hc-nav-separator" aria-hidden="true"/><button type="button" className="hc-nav-link" title="Your reports, medicines, appointments and health journey" onClick={()=>accountShortcut('health')}>My Health</button><button type="button" className="hc-nav-link" title="Doctor workspace for patients, schedules and consultations" onClick={()=>accountShortcut('patients')}>My Patients</button></div><div className="hc-nav-auth">{_hasHydrated&&isAuthenticated&&user?<><button type="button" className="hc-dashboard-btn" onClick={()=>router.push(getDashRoute(user.role))}>My Dashboard</button><UserMenu user={user} onSignOut={clearAuth}/></>:<><button type="button" className="hc-signin" onClick={()=>requestAuth('login')}>Sign In</button><button type="button" className="hc-signup" onClick={()=>requestAuth('register')}>Sign Up</button></>}</div><button type="button" className="hc-hamburger" aria-label={mobileOpen?'Close menu':'Open menu'} aria-expanded={mobileOpen} aria-controls="hc-mobile-menu" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?'×':'☰'}</button></div></nav>
    <div id="hc-mobile-menu" className={`hc-mobile-menu ${mobileOpen?'open':''}`} aria-hidden={!mobileOpen}>{links.map(([label,href])=><button type="button" key={href} className={active(href)?'active':''} aria-current={active(href)?'page':undefined} onClick={()=>go(href)}>{label} <span style={{float:'right',opacity:.4}} aria-hidden="true">→</span></button>)}<button type="button" onClick={goPlans}>Plans <span style={{float:'right',opacity:.4}} aria-hidden="true">→</span></button><div className="hc-mobile-divider"/><button type="button" onClick={()=>accountShortcut('health')}>♡ My Health <span style={{float:'right',opacity:.4}} aria-hidden="true">→</span></button><div className="hc-mobile-help">Your reports, medicines, appointments and health journey.</div><button type="button" onClick={()=>accountShortcut('patients')}>👥 My Patients <span style={{float:'right',opacity:.4}} aria-hidden="true">→</span></button><div className="hc-mobile-help">Doctor workspace for patients, schedules and consultations.</div><div className="hc-mobile-auth">{isAuthenticated&&user?<><button type="button" className="primary" onClick={()=>{router.push(getDashRoute(user.role));setMobileOpen(false)}}>My Dashboard</button><button type="button" onClick={()=>{clearAuth();setMobileOpen(false);goHome()}}>Sign Out</button></>:<><button type="button" onClick={()=>requestAuth('login')}>Sign In</button><button type="button" className="primary" onClick={()=>requestAuth('register')}>Sign Up</button></>}</div></div>
  </>;
}
