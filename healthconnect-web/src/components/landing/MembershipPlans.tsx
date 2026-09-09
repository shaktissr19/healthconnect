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
      .hc-plans{scroll-margin-top:76px;background:#F4F1EC;padding:42px 22px 46px;font-family:'DM Sans',Arial,sans-serif;color:#102338;border-top:1px solid #E1DCD4;border-bottom:1px solid #E1DCD4}.hc-plans-wrap{max-width:1220px;margin:0 auto}.hc-plans-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.62fr);gap:38px;align-items:end;margin:0 6px 18px}.hc-plans-kicker{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#137B73;margin-bottom:6px}.hc-plans h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.95rem,2.5vw,2.65rem);line-height:1.03;letter-spacing:-.045em;margin:0;max-width:650px;color:#0B1D32}.hc-plans-head p{font-size:14px;line-height:1.5;color:#536B7E;margin:0 0 3px;max-width:500px}.hc-plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.hc-plan-card{border-radius:18px;padding:20px 22px 20px;box-shadow:0 9px 22px rgba(18,55,68,.055);position:relative;overflow:hidden;transition:transform .18s ease,box-shadow .18s ease;background:#fff;border:1px solid #D9E0E5}.hc-plan-card:before{content:'';position:absolute;left:0;right:0;top:0;height:4px}.hc-plan-card.patient:before{background:#2459C4}.hc-plan-card.doctor:before{background:#087D72}.hc-plan-card:hover{transform:translateY(-2px);box-shadow:0 14px 28px rgba(18,55,68,.09)}.hc-plan-role{font-size:11.5px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;margin-bottom:6px}.patient .hc-plan-role{color:#2459C4}.doctor .hc-plan-role{color:#087D72}.hc-plan-title{font-family:'Sora','DM Sans',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.025em;margin:0;color:#102338}.hc-plan-price{display:flex;align-items:baseline;gap:7px;margin:8px 0 4px}.hc-plan-price strong{font-family:'Sora','DM Sans',sans-serif;font-size:32px;letter-spacing:-.05em}.patient .hc-plan-price strong{color:#1E4FAF}.doctor .hc-plan-price strong{color:#0A6E64}.hc-plan-price span{font-size:13.5px;color:#60778A;font-weight:700}.hc-plan-offer{margin:9px 0 12px;padding:9px 11px;border-radius:10px;background:#FBF1E5;border:1px solid #E8D4BA;color:#8B3A12;font-size:12px;line-height:1.4;font-weight:700}.hc-plan-sub{font-size:13.5px;color:#455F72;line-height:1.44;margin-bottom:10px}.hc-plan-list{list-style:none;padding:0;margin:0 0 14px;display:grid;grid-template-columns:1fr 1fr;gap:2px 14px}.hc-plan-list li{display:flex;gap:8px;padding:5px 0;color:#29455A;font-size:13px;line-height:1.38}.hc-plan-list li:before{content:'✓';width:19px;height:19px;border-radius:50%;display:grid;place-items:center;flex:0 0 19px;font-size:10px;font-weight:900;background:#F0F3F6}.patient .hc-plan-list li:before{color:#1E4FAF}.doctor .hc-plan-list li:before{color:#087565}.hc-plan-btn{border:0;border-radius:9px;padding:10px 14px;font-size:12.5px;font-weight:900;cursor:pointer;color:#fff;box-shadow:0 7px 16px rgba(20,45,65,.10);transition:transform .16s ease,box-shadow .16s ease}.hc-plan-btn:hover{transform:translateY(-1px);box-shadow:0 10px 19px rgba(20,45,65,.14)}.hc-plan-btn:focus-visible{outline:3px solid rgba(37,99,235,.24);outline-offset:3px}.patient .hc-plan-btn{background:#2459C4}.doctor .hc-plan-btn{background:#087D72}.hc-plan-note{margin-top:12px;border-radius:12px;background:#E9E7E2;border:1px solid #D6D3CD;padding:11px 13px;display:flex;justify-content:space-between;gap:24px;align-items:center;color:#405C6E;font-size:12.5px;line-height:1.45}.hc-plan-note strong{color:#17384A}.hc-plan-public{font-weight:800;color:#137B73;white-space:nowrap}
      @media(max-width:850px){.hc-plans-head{grid-template-columns:1fr;gap:8px}.hc-plan-grid{grid-template-columns:1fr}.hc-plan-list{grid-template-columns:1fr}.hc-plan-note{align-items:flex-start;flex-direction:column;gap:7px}.hc-plan-public{white-space:normal}}
      @media(max-width:560px){.hc-plans{padding:36px 12px 40px}.hc-plans-head{margin:0 4px 16px}.hc-plan-card{padding:19px 17px}.hc-plans h2{font-size:2.05rem}.hc-plan-price strong{font-size:30px}}
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
          <button type="button" className="hc-plan-btn" onClick={()=>choose('PATIENT')}>{isAuthenticated&&String(user?.role).toUpperCase()==='PATIENT'?'Manage Patient Membership':'Start Patient Membership'}</button>
        </article>

        <article className="hc-plan-card doctor">
          <div className="hc-plan-role">For Doctors</div>
          <h3 className="hc-plan-title">HealthConnect Doctor</h3>
          <div className="hc-plan-price"><strong>{money(doctorPaise)}</strong><span>/ month</span></div>
          <div className="hc-plan-sub">Your HealthConnect professional workspace for connected patient care.</div>
          <ul className="hc-plan-list">{doctorFeatures.map((f,i)=><li key={`${f}-${i}`}>{f}</li>)}</ul>
          <button type="button" className="hc-plan-btn" onClick={()=>choose('DOCTOR')}>{isAuthenticated&&String(user?.role).toUpperCase()==='DOCTOR'?'Manage Doctor Membership':'Join as a Doctor'}</button>
        </article>
      </div>

      <div className="hc-plan-note"><div><strong>Consultation fees are separate.</strong> They are set by individual doctors and shown clearly during appointment booking.</div><div className="hc-plan-public">Public access · Find Doctors · Find Hospitals · Knowledge Hub</div></div>
    </div>
  </section>;
}
