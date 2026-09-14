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

type AuthMode='login'|'register';
type NavItem={label:string;target:string};

const PRIMARY_NAV:NavItem[]=[
  {label:'Home',target:'top'},
  {label:'Health Communities',target:'health-communities-story'},
  {label:'Find Doctors',target:'care-discovery'},
  {label:'Find Hospitals',target:'care-discovery'},
  {label:'Knowledge Hub',target:'knowledge-hub'},
  {label:'Plans',target:'plans'},
];
const WORKSPACE_NAV:NavItem[]=[
  {label:'My Health',target:'my-health-story'},
  {label:'My Patients',target:'doctor-platform-story'},
];
const TRACKED_SECTIONS=['my-health-story','health-communities-story','doctor-platform-story','care-discovery','knowledge-hub','plans'];

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
  return <div ref={ref} style={{position:'relative'}}><button type="button" onClick={()=>setOpen(v=>!v)} className="hc-user-trigger" aria-haspopup="menu" aria-expanded={open} aria-controls="hc-user-menu"><span className="hc-user-avatar">{initials}</span><span className="hc-user-name">{user?.firstName||'Account'}</span><span aria-hidden="true" style={{fontSize:9,color:'#C3D6E3'}}>⌄</span></button>{open&&<div className="hc-user-menu" id="hc-user-menu" role="menu"><div className="hc-user-head"><div className="hc-user-avatar big">{initials}</div><strong>{fullName}</strong><span>{user?.email}</span></div><button role="menuitem" onClick={()=>{router.push(dash);setOpen(false)}}>My Dashboard</button><button role="menuitem" onClick={()=>{router.push(`${dash}?tab=profile`);setOpen(false)}}>Profile</button><button role="menuitem" onClick={()=>{router.push(`${dash}?tab=settings`);setOpen(false)}}>Settings</button><button role="menuitem" className="danger" onClick={()=>{onSignOut();setOpen(false);window.location.href='/?home=1'}}>Sign Out</button></div>}</div>;
}

export default function PublicNavbar(){
  const router=useRouter();
  const pathname=usePathname();
  const {user,isAuthenticated,clearAuth,_hasHydrated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const [scrolled,setScrolled]=useState(false);
  const [scrollPct,setScrollPct]=useState(0);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [activeTarget,setActiveTarget]=useState('top');
  const [careChoice,setCareChoice]=useState<'doctors'|'hospitals'>('doctors');

  useEffect(()=>{
    const update=()=>{
      setScrolled(window.scrollY>18);
      const h=document.documentElement.scrollHeight-window.innerHeight;
      setScrollPct(h>0?(window.scrollY/h)*100:0);
      if(pathname!=='/')return;
      let current='top';
      for(const id of TRACKED_SECTIONS){
        const element=document.getElementById(id);
        if(element&&element.getBoundingClientRect().top<=145)current=id;
      }
      setActiveTarget(current);
    };
    update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update)};
  },[pathname]);

  useEffect(()=>{
    if(pathname!=='/'||typeof window==='undefined')return;
    const hash=window.location.hash.replace('#','');
    if(!hash)return;
    const timer=window.setTimeout(()=>document.getElementById(hash)?.scrollIntoView({behavior:'smooth',block:'start'}),100);
    return()=>window.clearTimeout(timer);
  },[pathname]);

  useEffect(()=>setMobileOpen(false),[pathname]);
  useEffect(()=>{
    const previous=document.body.style.overflow;
    if(mobileOpen)document.body.style.overflow='hidden';else document.body.style.overflow=previous;
    const closeEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setMobileOpen(false)};
    document.addEventListener('keydown',closeEscape);
    return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',closeEscape)};
  },[mobileOpen]);

  const requestAuth=(mode:AuthMode)=>{setMobileOpen(false);if(pathname==='/'){openAuthModal(mode);return;}window.location.href=`/?home=1&auth=${mode}`;};

  const openSection=(item:NavItem)=>{
    setMobileOpen(false);
    if(item.label==='Find Doctors')setCareChoice('doctors');
    if(item.label==='Find Hospitals')setCareChoice('hospitals');
    if(pathname==='/'){
      if(item.target==='top'){
        window.scrollTo({top:0,behavior:'smooth'});
        window.history.replaceState(null,'','/?home=1');
        setActiveTarget('top');
        return;
      }
      const element=document.getElementById(item.target);
      if(element){element.scrollIntoView({behavior:'smooth',block:'start'});setActiveTarget(item.target);window.history.replaceState(null,'',`/?home=1#${item.target}`);}
      return;
    }
    window.location.href=item.target==='top'?'/?home=1':`/?home=1#${item.target}`;
  };

  const isActive=(item:NavItem)=>{
    if(item.target==='top')return pathname==='/'&&activeTarget==='top';
    if(pathname!=='/'||activeTarget!==item.target)return false;
    if(item.target!=='care-discovery')return true;
    return item.label==='Find Doctors'?careChoice==='doctors':careChoice==='hospitals';
  };

  return <>
    <style>{`
      .hc-public-nav{position:fixed;top:0;left:0;right:0;height:74px;z-index:1000;background:#12364B;border-bottom:1px solid rgba(255,255,255,.10);font-family:'DM Sans',Arial,sans-serif;transition:box-shadow .2s,background .2s;box-shadow:0 5px 20px rgba(11,36,53,.18)}.hc-public-nav.scrolled{background:rgba(18,54,75,.98);backdrop-filter:blur(16px);box-shadow:0 11px 30px rgba(11,36,53,.24)}
      .hc-nav-inner{max-width:1480px;height:100%;margin:0 auto;padding:0 30px;display:flex;align-items:center}.hc-brand{display:flex;align-items:center;gap:11px;border:0;background:none;padding:0;margin-right:34px;cursor:pointer;flex-shrink:0}.hc-brand-logo{width:43px;height:43px;border-radius:12px;background:#F7FAFC;display:grid;place-items:center;color:#0F766E;font-family:'Sora',sans-serif;font-size:14px;font-weight:900;box-shadow:0 5px 16px rgba(0,0,0,.12)}.hc-brand-copy{text-align:left}.hc-brand-copy strong{display:block;font-family:'Sora',sans-serif;color:#fff;font-size:20px;line-height:1.02;letter-spacing:-.025em}.hc-brand-copy span{display:block;color:#C9D9E4;font-size:8.5px;font-weight:750;margin-top:4px;white-space:nowrap}
      .hc-nav-links{display:flex;align-items:center;gap:4px;flex:1}.hc-nav-link{position:relative;border:0;background:transparent;padding:25px 9px 22px;color:#E7EEF4;font-size:12.5px;font-weight:750;white-space:nowrap;cursor:pointer;transition:color .16s}.hc-nav-link:after{content:'';position:absolute;left:9px;right:9px;bottom:13px;height:2px;border-radius:2px;background:#71D7C9;transform:scaleX(0);transition:transform .16s}.hc-nav-link:hover{color:#fff}.hc-nav-link:hover:after,.hc-nav-link.active:after{transform:scaleX(1)}.hc-nav-link.active{color:#fff}.hc-nav-separator{width:1px;height:24px;background:rgba(255,255,255,.16);margin:0 5px}.hc-nav-auth{display:flex;gap:9px;align-items:center;margin-left:14px}.hc-signin,.hc-signup,.hc-dashboard-btn{border-radius:10px;padding:10px 17px;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap;transition:.16s}.hc-signin{border:1px solid #6E8CA0;background:#274D64;color:#fff}.hc-signin:hover{background:#315A73;border-color:#8AA5B7}.hc-signup{border:1px solid #E7C36F;background:#E7C36F;color:#17354A;box-shadow:0 7px 18px rgba(10,30,44,.18)}.hc-signup:hover{background:#F0CE7C;transform:translateY(-1px)}.hc-dashboard-btn{border:1px solid #BCD0DF;background:#E9F0F5;color:#17354A}.hc-dashboard-btn:hover{background:#fff}
      .hc-brand:focus-visible,.hc-nav-link:focus-visible,.hc-signin:focus-visible,.hc-signup:focus-visible,.hc-dashboard-btn:focus-visible,.hc-user-trigger:focus-visible,.hc-hamburger:focus-visible,.hc-mobile-menu button:focus-visible{outline:3px solid rgba(113,215,201,.58);outline-offset:2px}.hc-user-trigger{display:flex;align-items:center;gap:7px;border:1px solid #5D7D92;background:#274D64;border-radius:10px;padding:4px 9px 4px 4px;cursor:pointer}.hc-user-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#F7FAFC;color:#0F766E;font-size:10px;font-weight:900}.hc-user-avatar.big{width:42px;height:42px;font-size:14px;margin:0 auto 7px;background:linear-gradient(135deg,#315B69,#6B6287);color:#fff}.hc-user-name{font-size:11px;font-weight:800;color:#fff;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hc-user-menu{position:absolute;right:0;top:calc(100% + 9px);width:220px;background:#fff;border:1px solid #DCE4EA;border-radius:14px;box-shadow:0 16px 40px rgba(15,23,42,.16);overflow:hidden}.hc-user-head{text-align:center;padding:15px;border-bottom:1px solid #EEF2F6}.hc-user-head strong{display:block;font-size:12px;color:#0F172A}.hc-user-head span{display:block;font-size:9px;color:#94A3B8;margin-top:2px;overflow:hidden;text-overflow:ellipsis}.hc-user-menu>button{width:100%;border:0;border-bottom:1px solid #F1F5F9;background:#fff;padding:10px 13px;color:#475569;font-size:11px;font-weight:650;cursor:pointer;text-align:left}.hc-user-menu>button:hover,.hc-user-menu>button:focus-visible{background:#F6F8FB;outline:none}.hc-user-menu>button.danger{color:#C83232}.hc-progress{position:absolute;bottom:0;left:0;height:2px;background:linear-gradient(90deg,#71D7C9,#8BAFC8,#A79AC1)}
      .hc-hamburger{display:none;margin-left:auto;border:1px solid #6E8CA0;background:#274D64;border-radius:9px;width:40px;height:40px;cursor:pointer;font-size:18px;color:#fff}.hc-mobile-menu{position:fixed;z-index:999;top:74px;left:0;right:0;bottom:0;background:#F1F5F7;padding:17px;transform:translateX(100%);transition:transform .25s ease,visibility .25s ease;overflow-y:auto;font-family:'DM Sans',Arial,sans-serif;visibility:hidden;pointer-events:none}.hc-mobile-menu.open{transform:translateX(0);visibility:visible;pointer-events:auto}.hc-mobile-menu button{width:100%;border:1px solid #D5DFE5;background:#fff;border-radius:10px;padding:12px 13px;text-align:left;color:#17324D;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:5px}.hc-mobile-menu button.active{background:#DDE7EC;border-color:#9CB4C1;color:#24495D}.hc-mobile-divider{height:1px;background:#DCE4EA;margin:10px 0}.hc-mobile-auth{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.hc-mobile-auth button{text-align:center;margin:0}.hc-mobile-auth .primary{background:#E7C36F;color:#17354A;border-color:#E7C36F}
      @media(max-width:1120px){.hc-nav-links,.hc-nav-auth{display:none}.hc-hamburger{display:block}.hc-brand{margin-right:0}}@media(max-width:480px){.hc-nav-inner{padding:0 14px}.hc-brand-copy span{display:none}.hc-brand-copy strong{font-size:17px}.hc-brand-logo{width:39px;height:39px}}
    `}</style>
    <nav className={`hc-public-nav ${scrolled?'scrolled':''}`} aria-label="Primary navigation"><div className="hc-progress" style={{width:`${scrollPct}%`}} aria-hidden="true"/><div className="hc-nav-inner"><button type="button" className="hc-brand" onClick={()=>openSection({label:'Home',target:'top'})} aria-label="HealthConnect home"><span className="hc-brand-logo">HC</span><span className="hc-brand-copy"><strong>HealthConnect</strong><span>India&apos;s Unified Healthcare Platform</span></span></button><div className="hc-nav-links">{PRIMARY_NAV.map(item=><button type="button" key={item.label} className={`hc-nav-link ${isActive(item)?'active':''}`} onClick={()=>openSection(item)}>{item.label}</button>)}<div className="hc-nav-separator" aria-hidden="true"/>{WORKSPACE_NAV.map(item=><button type="button" key={item.label} className={`hc-nav-link ${isActive(item)?'active':''}`} title={item.label==='My Health'?'Preview the patient health workspace':'Preview the doctor patient-workspace journey'} onClick={()=>openSection(item)}>{item.label}</button>)}</div><div className="hc-nav-auth">{_hasHydrated&&isAuthenticated&&user?<><button type="button" className="hc-dashboard-btn" onClick={()=>router.push(getDashRoute(user.role))}>My Dashboard</button><UserMenu user={user} onSignOut={clearAuth}/></>:<><button type="button" className="hc-signin" onClick={()=>requestAuth('login')}>Sign In</button><button type="button" className="hc-signup" onClick={()=>requestAuth('register')}>Sign Up</button></>}</div><button type="button" className="hc-hamburger" aria-label={mobileOpen?'Close menu':'Open menu'} aria-expanded={mobileOpen} aria-controls="hc-mobile-menu" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?'×':'☰'}</button></div></nav>
    <div id="hc-mobile-menu" className={`hc-mobile-menu ${mobileOpen?'open':''}`} aria-hidden={!mobileOpen}>{PRIMARY_NAV.map(item=><button type="button" key={item.label} className={isActive(item)?'active':''} onClick={()=>openSection(item)}>{item.label}</button>)}<div className="hc-mobile-divider"/>{WORKSPACE_NAV.map(item=><button type="button" key={item.label} className={isActive(item)?'active':''} onClick={()=>openSection(item)}>{item.label}</button>)}<div className="hc-mobile-auth">{isAuthenticated&&user?<><button type="button" className="primary" onClick={()=>{router.push(getDashRoute(user.role));setMobileOpen(false)}}>My Dashboard</button><button type="button" onClick={()=>{clearAuth();setMobileOpen(false);window.location.href='/?home=1'}}>Sign Out</button></>:<><button type="button" onClick={()=>requestAuth('login')}>Sign In</button><button type="button" className="primary" onClick={()=>requestAuth('register')}>Sign Up</button></>}</div></div>
  </>;
}
