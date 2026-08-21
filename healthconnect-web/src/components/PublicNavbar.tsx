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
  useEffect(()=>{const close=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
  const dash=getDashRoute(user?.role);
  return <div ref={ref} style={{position:'relative'}}>
    <button onClick={()=>setOpen(v=>!v)} className="hc-user-trigger"><span className="hc-user-avatar">{initials}</span><span className="hc-user-name">{user?.firstName||'Account'}</span><span style={{fontSize:9,color:'#94A3B8'}}>⌄</span></button>
    {open&&<div className="hc-user-menu"><div className="hc-user-head"><div className="hc-user-avatar big">{initials}</div><strong>{fullName}</strong><span>{user?.email}</span></div><button onClick={()=>{router.push(dash);setOpen(false)}}>My Dashboard <span>→</span></button><button onClick={()=>{router.push(`${dash}?tab=profile`);setOpen(false)}}>Profile <span>›</span></button><button onClick={()=>{router.push(`${dash}?tab=settings`);setOpen(false)}}>Settings <span>›</span></button><button className="danger" onClick={()=>{onSignOut();setOpen(false);window.location.href='/?home=1'}}>Sign Out <span>↪</span></button></div>}
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

  useEffect(()=>{const update=()=>{setScrolled(window.scrollY>18);const h=document.documentElement.scrollHeight-window.innerHeight;setScrollPct(h>0?(window.scrollY/h)*100:0)};update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update)},[]);
  useEffect(()=>setMobileOpen(false),[pathname]);

  const requestAuth=(mode:AuthMode)=>{
    setMobileOpen(false);
    if(pathname==='/'){openAuthModal(mode);return;}
    window.location.href=`/?home=1&auth=${mode}`;
  };

  const goHome=()=>{window.location.href='/?home=1'};
  const go=(href:string)=>{setMobileOpen(false);if(href==='/'){goHome();return;}router.push(href)};
  const active=(href:string)=>href==='/'?pathname==='/':pathname===href||pathname.startsWith(`${href}/`);

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
    // The authenticated identity remains authoritative even if a different public shortcut was clicked.
    router.push(getDashRoute(role));
  };

  const links=[
    ['Home','/'],
    ['Health Communities','/communities'],
    ['Find Doctors','/doctors'],
    ['Find Hospitals','/hospitals'],
    ['Knowledge Hub','/learn'],
  ] as const;

  return <>
    <style>{`
      .hc-public-nav{position:fixed;top:0;left:0;right:0;height:64px;z-index:1000;background:#fff;border-bottom:1px solid #E7EDF2;font-family:'DM Sans',Arial,sans-serif;transition:.2s}.hc-public-nav.scrolled{box-shadow:0 3px 18px rgba(15,23,42,.07)}.hc-nav-inner{max-width:1280px;height:100%;margin:0 auto;padding:0 28px;display:flex;align-items:center}.hc-brand{display:flex;align-items:center;gap:10px;border:0;background:none;padding:0;margin-right:18px;cursor:pointer;flex-shrink:0}.hc-brand-logo{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#0D9488,#14B8A6);display:grid;place-items:center;color:#fff;font-family:'Sora',sans-serif;font-weight:900;box-shadow:0 3px 12px rgba(13,148,136,.2)}.hc-brand-copy{text-align:left}.hc-brand-copy strong{display:block;font-family:'Sora',sans-serif;color:#0F172A;font-size:14px;line-height:1.05}.hc-brand-copy span{display:block;color:#0D9488;font-size:9px;font-weight:700;margin-top:3px;white-space:nowrap}.hc-nav-links{display:flex;align-items:center;gap:1px;flex:1}.hc-nav-link{border:1px solid transparent;background:none;border-radius:8px;padding:7px 9px;color:#374151;font-size:12.5px;font-weight:600;white-space:nowrap;cursor:pointer}.hc-nav-link:hover,.hc-nav-link.active{color:#0D9488;background:#F0FDFA;border-color:#CCFBF1}.hc-nav-separator{width:1px;height:22px;background:#E2E8F0;margin:0 5px}.hc-nav-auth{display:flex;gap:8px;align-items:center;margin-left:10px}.hc-signin,.hc-signup,.hc-dashboard-btn{border-radius:9px;padding:8px 15px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}.hc-signin{border:1px solid #CBD5E1;background:#fff;color:#334155}.hc-signup{border:1px solid #0D9488;background:linear-gradient(135deg,#0D9488,#14B8A6);color:#fff;box-shadow:0 4px 14px rgba(13,148,136,.2)}.hc-dashboard-btn{border:1px solid #DDE5ED;background:#F8FAFC;color:#0F172A}.hc-user-trigger{display:flex;align-items:center;gap:7px;border:1px solid #CCFBF1;background:#F0FDFA;border-radius:9px;padding:4px 9px 4px 4px;cursor:pointer}.hc-user-avatar{width:29px;height:29px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#14B8A6,#0D9488);color:#fff;font-size:10px;font-weight:900}.hc-user-avatar.big{width:42px;height:42px;font-size:14px;margin:0 auto 7px}.hc-user-name{font-size:11px;font-weight:800;color:#0F172A;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hc-user-menu{position:absolute;right:0;top:calc(100% + 8px);width:220px;background:#fff;border:1px solid #E2E8F0;border-radius:14px;box-shadow:0 14px 40px rgba(15,23,42,.14);overflow:hidden}.hc-user-head{text-align:center;padding:15px;border-bottom:1px solid #EEF2F6}.hc-user-head strong{display:block;font-size:12px;color:#0F172A}.hc-user-head span{display:block;font-size:9px;color:#94A3B8;margin-top:2px;overflow:hidden;text-overflow:ellipsis}.hc-user-menu>button{width:100%;display:flex;justify-content:space-between;border:0;border-bottom:1px solid #F1F5F9;background:#fff;padding:10px 13px;color:#475569;font-size:11px;font-weight:650;cursor:pointer;text-align:left}.hc-user-menu>button:hover{background:#F8FAFC}.hc-user-menu>button.danger{color:#DC2626}.hc-progress{position:absolute;bottom:0;left:0;height:2px;background:linear-gradient(90deg,#0D9488,#2DD4BF,#5EEAD4);box-shadow:0 0 7px rgba(45,212,191,.38)}.hc-hamburger{display:none;margin-left:auto;border:1px solid #E2E8F0;background:#F8FAFC;border-radius:8px;width:38px;height:38px;cursor:pointer;font-size:18px;color:#334155}.hc-mobile-menu{position:fixed;z-index:999;top:64px;left:0;right:0;bottom:0;background:#fff;padding:17px;transform:translateX(100%);transition:.25s;overflow-y:auto;font-family:'DM Sans',Arial,sans-serif}.hc-mobile-menu.open{transform:translateX(0)}.hc-mobile-menu button{width:100%;border:1px solid transparent;background:#fff;border-radius:10px;padding:12px 13px;text-align:left;color:#334155;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:3px}.hc-mobile-menu button.active{background:#F0FDFA;border-color:#CCFBF1;color:#0D9488}.hc-mobile-divider{height:1px;background:#E8EEF3;margin:9px 0}.hc-mobile-help{font-size:9px;color:#94A3B8;padding:0 13px 7px;line-height:1.45}.hc-mobile-auth{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.hc-mobile-auth button{text-align:center;margin:0}.hc-mobile-auth .primary{background:#0D9488;color:#fff;border-color:#0D9488}
      @media(max-width:1120px){.hc-nav-links,.hc-nav-auth{display:none}.hc-hamburger{display:block}.hc-brand{margin-right:0}}
      @media(max-width:480px){.hc-nav-inner{padding:0 14px}.hc-brand-copy span{display:none}.hc-brand-copy strong{font-size:13px}}
    `}</style>
    <nav className={`hc-public-nav ${scrolled?'scrolled':''}`}>
      <div className="hc-progress" style={{width:`${scrollPct}%`}}/>
      <div className="hc-nav-inner">
        <button className="hc-brand" onClick={goHome}><span className="hc-brand-logo">HC</span><span className="hc-brand-copy"><strong>HealthConnect</strong><span>India's Unified Healthcare Platform</span></span></button>
        <div className="hc-nav-links">
          {links.map(([label,href])=><button key={href} className={`hc-nav-link ${active(href)?'active':''}`} onClick={()=>go(href)}>{label}</button>)}
          <div className="hc-nav-separator"/>
          <button className="hc-nav-link" title="Your reports, medicines, appointments and health journey" onClick={()=>accountShortcut('health')}>My Health</button>
          <button className="hc-nav-link" title="Doctor workspace for patients, schedules and consultations" onClick={()=>accountShortcut('patients')}>My Patients</button>
        </div>
        <div className="hc-nav-auth">
          {_hasHydrated&&isAuthenticated&&user?<><button className="hc-dashboard-btn" onClick={()=>router.push(getDashRoute(user.role))}>My Dashboard</button><UserMenu user={user} onSignOut={clearAuth}/></>:<><button className="hc-signin" onClick={()=>requestAuth('login')}>Sign In</button><button className="hc-signup" onClick={()=>requestAuth('register')}>Sign Up Free</button></>}
        </div>
        <button className="hc-hamburger" aria-label="Open menu" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?'×':'☰'}</button>
      </div>
    </nav>
    <div className={`hc-mobile-menu ${mobileOpen?'open':''}`}>
      {links.map(([label,href])=><button key={href} className={active(href)?'active':''} onClick={()=>go(href)}>{label} <span style={{float:'right',opacity:.4}}>→</span></button>)}
      <div className="hc-mobile-divider"/>
      <button onClick={()=>accountShortcut('health')}>♡ My Health <span style={{float:'right',opacity:.4}}>→</span></button><div className="hc-mobile-help">Your reports, medicines, appointments and health journey.</div>
      <button onClick={()=>accountShortcut('patients')}>👥 My Patients <span style={{float:'right',opacity:.4}}>→</span></button><div className="hc-mobile-help">Doctor workspace for patients, schedules and consultations.</div>
      <div className="hc-mobile-auth">{isAuthenticated&&user?<><button className="primary" onClick={()=>{router.push(getDashRoute(user.role));setMobileOpen(false)}}>My Dashboard</button><button onClick={()=>{clearAuth();setMobileOpen(false);goHome()}}>Sign Out</button></>:<><button onClick={()=>requestAuth('login')}>Sign In</button><button className="primary" onClick={()=>requestAuth('register')}>Sign Up Free</button></>}</div>
    </div>
  </>;
}
