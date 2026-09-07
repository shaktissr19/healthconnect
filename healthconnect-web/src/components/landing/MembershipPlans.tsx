'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type Plan = {
  id: string;
  name: string;
  displayName: string;
  targetRole: string;
  features?: string[];
  monthlyPrice?: number;
  pricing?: { monthlyPaise?: number; currency?: string };
  introOffer?: {
    code?: string;
    amountPaise?: number;
    cycles?: number;
    available?: boolean;
    description?: string;
  } | null;
};

const FALLBACK_PATIENT = 14900;
const FALLBACK_DOCTOR = 79900;
const money = (paise:number) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const unwrap = (r:any) => r?.data?.data ?? r?.data ?? [];

const patientFallback = [
  'My Health, reports and prescriptions',
  'Health Score, vitals and medicines',
  'Appointments, reminders and payment history',
  'Health Communities and connected care',
];
const doctorFallback = [
  'Professional profile and discovery',
  'Availability and appointments',
  'Patient-shared health context',
  'Practice workspace and billing',
];

export default function MembershipPlans(){
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [plans,setPlans] = useState<Plan[]>([]);

  useEffect(()=>{
    let active=true;
    api.get('/subscription/plans')
      .then(r=>{ if(active){ const data=unwrap(r); setPlans(Array.isArray(data)?data:[]); } })
      .catch(()=>{ if(active) setPlans([]); });
    return()=>{active=false};
  },[]);

  const patient = useMemo(()=>plans.find(p=>p.targetRole==='PATIENT'&&p.name==='premium') || plans.find(p=>p.targetRole==='PATIENT'&&Number(p.pricing?.monthlyPaise||0)>0),[plans]);
  const doctor = useMemo(()=>plans.find(p=>p.targetRole==='DOCTOR'&&Number(p.pricing?.monthlyPaise||0)>0) || plans.find(p=>p.targetRole==='DOCTOR'),[plans]);

  const choose=(role:'PATIENT'|'DOCTOR')=>{
    const destination=role==='PATIENT'?'/dashboard?tab=subscription':'/doctor-dashboard/membership';
    if(isAuthenticated&&user){
      const current=String(user.role||'').toUpperCase();
      if(current===role){ router.push(destination); return; }
      router.push(current==='ADMIN'?'/admin-dashboard':current==='HOSPITAL'?'/hospital-dashboard':current==='DOCTOR'?'/doctor-dashboard':'/dashboard');
      return;
    }
    try{
      sessionStorage.setItem('hc_signup_role',role);
      sessionStorage.setItem('hc_post_login_redirect',destination);
    }catch{}
    openAuthModal('register');
  };

  const patientPaise=Number(patient?.pricing?.monthlyPaise||FALLBACK_PATIENT);
  const doctorPaise=Number(doctor?.pricing?.monthlyPaise||FALLBACK_DOCTOR);
  const intro=patient?.introOffer;
  const patientFeatures=(patient?.features?.length?patient.features:patientFallback).slice(0,4);
  const doctorFeatures=(doctor?.features?.length?doctor.features:doctorFallback).slice(0,4);

  return <section id="plans" className="hc-plans" aria-labelledby="plans-title">
    <style>{`
      .hc-plans{scroll-margin-top:82px;background:linear-gradient(135deg,#EAF7F4 0%,#EEF5FB 54%,#F7F5FC 100%);padding:40px 28px 44px;font-family:'DM Sans',Arial,sans-serif;color:#102338;border-top:1px solid #D6E8E4;border-bottom:1px solid #DCE5EC}.hc-plans-wrap{max-width:1160px;margin:0 auto}.hc-plans-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.62fr);gap:34px;align-items:end;margin-bottom:19px}.hc-plans-kicker{font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B8F7C;margin-bottom:7px}.hc-plans h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.9rem,2.6vw,2.65rem);line-height:1.03;letter-spacing:-.045em;margin:0;max-width:620px;color:#0B1D32}.hc-plans-head p{font-size:14.5px;line-height:1.55;color:#536B7E;margin:0 0 4px;max-width:460px}.hc-plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.hc-plan-card{background:#fff;border:1px solid #D9E6E3;border-radius:16px;padding:20px 22px;box-shadow:0 8px 22px rgba(18,55,68,.06);position:relative;overflow:hidden;transition:transform .18s ease,box-shadow .18s ease}.hc-plan-card:hover{transform:translateY(-2px);box-shadow:0 13px 29px rgba(18,55,68,.10)}.hc-plan-card.patient{border-top:4px solid #2563EB}.hc-plan-card.doctor{border-top:4px solid #0D9488}.hc-plan-role{font-size:12.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px}.patient .hc-plan-role{color:#2563EB}.doctor .hc-plan-role{color:#0D9488}.hc-plan-title{font-family:'Sora','DM Sans',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.025em;margin:0;color:#102338}.hc-plan-price{display:flex;align-items:baseline;gap:7px;margin:8px 0 3px}.hc-plan-price strong{font-family:'Sora','DM Sans',sans-serif;font-size:31px;letter-spacing:-.05em}.patient .hc-plan-price strong{color:#1D4ED8}.doctor .hc-plan-price strong{color:#0B7F70}.hc-plan-price span{font-size:13.5px;color:#6B7F8F;font-weight:650}.hc-plan-offer{margin:9px 0 12px;padding:9px 11px;border-radius:10px;background:#FFF7ED;border:1px solid #FED7AA;color:#9A3412;font-size:11.5px;line-height:1.42;font-weight:650}.hc-plan-sub{font-size:13.5px;color:#60778A;line-height:1.45;margin-bottom:10px}.hc-plan-list{list-style:none;padding:0;margin:0 0 13px;display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.hc-plan-list li{display:flex;gap:8px;padding:5px 0;color:#29455A;font-size:13.5px;line-height:1.4}.hc-plan-list li:before{content:'✓';width:19px;height:19px;border-radius:50%;display:grid;place-items:center;flex:0 0 19px;font-size:11px;font-weight:900}.patient .hc-plan-list li:before{background:#DBEAFE;color:#1D4ED8}.doctor .hc-plan-list li:before{background:#DDF6EF;color:#087565}.hc-plan-btn{border:0;border-radius:9px;padding:10px 14px;font-size:13.5px;font-weight:900;cursor:pointer;color:#fff;box-shadow:0 8px 18px rgba(20,45,65,.12);transition:transform .16s ease,box-shadow .16s ease}.hc-plan-btn:hover{transform:translateY(-1px);box-shadow:0 11px 21px rgba(20,45,65,.16)}.hc-plan-btn:focus-visible{outline:3px solid rgba(37,99,235,.24);outline-offset:3px}.patient .hc-plan-btn{background:linear-gradient(135deg,#1849A9,#2563EB)}.doctor .hc-plan-btn{background:linear-gradient(135deg,#0F766E,#14B8A6)}.hc-plan-note{margin-top:12px;border-radius:11px;background:linear-gradient(100deg,#EAF7F3,#EEF5FB);border:1px solid #D4E5E2;padding:11px 13px;display:flex;justify-content:space-between;gap:28px;align-items:center;color:#405C6E;font-size:13.5px;line-height:1.5}.hc-plan-note strong{color:#17384A}.hc-plan-public{font-weight:750;color:#0B7F70;white-space:nowrap}
      @media(max-width:850px){.hc-plans-head{grid-template-columns:1fr;gap:8px}.hc-plan-grid{grid-template-columns:1fr}.hc-plan-list{grid-template-columns:1fr}.hc-plan-note{align-items:flex-start;flex-direction:column;gap:7px}.hc-plan-public{white-space:normal}}
      @media(max-width:560px){.hc-plans{padding:42px 14px 48px}.hc-plan-card{padding:20px 18px}.hc-plans h2{font-size:2.25rem}.hc-plan-price strong{font-size:30px}}
    `}</style>
    <div className="hc-plans-wrap">
      <div className="hc-plans-head">
        <div><div className="hc-plans-kicker">Membership & billing</div><h2 id="plans-title">Simple memberships. Clear value.</h2></div>
        <p>Pay for the HealthConnect platform, not for a bundled consultation. Doctor consultation fees stay separate.</p>
      </div>

      <div className="hc-plan-grid">
        <article className="hc-plan-card patient">
          <div className="hc-plan-role">For Patients</div>
          <h3 className="hc-plan-title">HealthConnect Patient</h3>
          <div className="hc-plan-price"><strong>{money(patientPaise)}</strong><span>/ month</span></div>
          {intro?.available&&<div className="hc-plan-offer"><strong>{intro.code||'LAUNCH99'}:</strong> {intro.description||`${money(Number(intro.amountPaise||9900))}/month for the first ${intro.cycles||3} months, then ${money(patientPaise)}/month.`}</div>}
          <div className="hc-plan-sub">Your health information and care journey, organised in one account.</div>
          <ul className="hc-plan-list">{patientFeatures.map((f,i)=><li key={`${f}-${i}`}>{f}</li>)}</ul>
          <button type="button" className="hc-plan-btn" onClick={()=>choose('PATIENT')}>{isAuthenticated&&String(user?.role).toUpperCase()==='PATIENT'?'Manage Patient Membership →':'Start Patient Membership →'}</button>
        </article>

        <article className="hc-plan-card doctor">
          <div className="hc-plan-role">For Doctors</div>
          <h3 className="hc-plan-title">HealthConnect Doctor</h3>
          <div className="hc-plan-price"><strong>{money(doctorPaise)}</strong><span>/ month</span></div>
          <div className="hc-plan-sub">Your HealthConnect professional workspace for connected patient care.</div>
          <ul className="hc-plan-list">{doctorFeatures.map((f,i)=><li key={`${f}-${i}`}>{f}</li>)}</ul>
          <button type="button" className="hc-plan-btn" onClick={()=>choose('DOCTOR')}>{isAuthenticated&&String(user?.role).toUpperCase()==='DOCTOR'?'Manage Doctor Membership →':'Join as a Doctor →'}</button>
        </article>
      </div>

      <div className="hc-plan-note"><div><strong>Consultation fees are separate.</strong> They are set by individual doctors and shown clearly during appointment booking.</div><div className="hc-plan-public">Public access → Find Doctors · Find Hospitals · Knowledge Hub</div></div>
    </div>
  </section>;
}
