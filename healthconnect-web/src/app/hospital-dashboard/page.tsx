'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import SessionTimeoutManager from '@/components/SessionTimeoutManager';

const C = {
  page: '#F5F4F0', card: '#FFFFFF', border: '#DDE7E5', teal: '#0D9488', tealDark: '#0F766E',
  navy: '#0F172A', text: '#334155', muted: '#64748B', soft: '#ECF8F6', danger: '#BE123C', amber: '#B45309',
};

type Tab = 'overview' | 'profile' | 'doctors' | 'departments' | 'appointments';

type ProfileForm = {
  name: string; phone: string; email: string; website: string; addressLine1: string; city: string; state: string;
  pinCode: string; totalBeds: string; icuBeds: string; opdTimings: string; specialties: string; accreditations: string;
  emergencyAvailable: boolean;
};

const emptyProfile: ProfileForm = {
  name: '', phone: '', email: '', website: '', addressLine1: '', city: '', state: '', pinCode: '', totalBeds: '',
  icuBeds: '', opdTimings: '', specialties: '', accreditations: '', emergencyAvailable: false,
};

const extract = (response: any) => response?.data?.data ?? response?.data ?? null;
const splitCsv = (value: string) => value.split(',').map(v => v.trim()).filter(Boolean);

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18, boxShadow:'0 2px 10px rgba(15,23,42,0.04)' }}>
      <div style={{ fontSize:12, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</div>
      <div style={{ marginTop:8, fontSize:28, lineHeight:1, fontWeight:850, color:C.navy }}>{value}</div>
      {sub && <div style={{ marginTop:7, fontSize:12, color:C.muted }}>{sub}</div>}
    </div>
  );
}

function Button({ children, onClick, disabled, danger=false }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ border:'none', borderRadius:10, padding:'9px 15px', fontWeight:750, fontSize:13,
      cursor:disabled?'not-allowed':'pointer', color:'#fff', background:disabled?'#94A3B8':danger?C.danger:`linear-gradient(135deg,${C.tealDark},${C.teal})` }}>
      {children}
    </button>
  );
}

function Input({ label, ...props }: any) {
  return <label style={{ display:'block' }}><span style={{ display:'block', fontSize:12, fontWeight:700, color:C.text, marginBottom:6 }}>{label}</span>
    <input {...props} style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, background:'#fff', borderRadius:10, padding:'10px 12px', fontSize:13, color:C.navy, outline:'none', ...(props.style||{}) }} />
  </label>;
}

export default function HospitalDashboardPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile);
  const [doctorForm, setDoctorForm] = useState({ email:'', department:'', isPrimary:false });
  const [departmentForm, setDepartmentForm] = useState({ name:'', headName:'', phone:'' });
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;
    const resolve = (state: any) => {
      if (state.isAuthenticated && state.user?.role === 'HOSPITAL') setAuthReady(true);
      else if (state.isAuthenticated) router.replace('/dashboard');
      else router.replace('/');
    };
    const state = useAuthStore.getState() as any;
    if (state._hasHydrated) { resolve(state); return; }
    let done = false;
    const unsub = (useAuthStore as any).subscribe((next: any) => {
      if (!done && next._hasHydrated) { done = true; unsub(); resolve(next); }
    });
    const timer = setTimeout(() => { if (!done) { done = true; unsub(); resolve(useAuthStore.getState() as any); } }, 1200);
    return () => { clearTimeout(timer); unsub(); };
  }, [router]);

  const hydrateProfileForm = (hospital: any) => {
    if (!hospital) return;
    setProfileForm({
      name:hospital.name ?? '', phone:hospital.phone ?? '', email:hospital.email ?? '', website:hospital.website ?? '',
      addressLine1:hospital.addressLine1 ?? '', city:hospital.city ?? '', state:hospital.state ?? '', pinCode:hospital.pinCode ?? '',
      totalBeds:hospital.totalBeds?.toString?.() ?? '', icuBeds:hospital.icuBeds?.toString?.() ?? '', opdTimings:hospital.opdTimings ?? '',
      specialties:Array.isArray(hospital.specialties)?hospital.specialties.join(', '):'',
      accreditations:Array.isArray(hospital.accreditations)?hospital.accreditations.join(', '):'',
      emergencyAvailable:Boolean(hospital.emergencyAvailable),
    });
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [dashRes, profileRes, doctorsRes, depsRes, apptsRes] = await Promise.all([
        api.get('/hospitals/dashboard'), api.get('/hospitals/profile/me'), api.get('/hospitals/doctors'),
        api.get('/hospitals/departments'), api.get('/hospitals/appointments?limit=50'),
      ]);
      const dash = extract(dashRes); const profile = extract(profileRes); const docData = extract(doctorsRes); const depData = extract(depsRes); const apptData = extract(apptsRes);
      setDashboard(dash); setProfileUser(profile); setDoctors(Array.isArray(docData)?docData:[]); setDepartments(Array.isArray(depData)?depData:[]);
      setAppointments(Array.isArray(apptData?.appointments)?apptData.appointments:[]); hydrateProfileForm(profile?.hospitalProfile);
    } catch (e:any) {
      setError(e?.response?.data?.message ?? 'Unable to load hospital dashboard.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (authReady) load(); }, [authReady]);
  useEffect(() => { if (!toast) return; const t=setTimeout(()=>setToast(''),3200); return()=>clearTimeout(t); }, [toast]);

  const hospital = profileUser?.hospitalProfile ?? dashboard?.profile ?? {};
  const stats = dashboard?.stats ?? {};
  const nav = useMemo(() => [
    ['overview','Overview'],['profile','Hospital Profile'],['doctors','Doctors'],['departments','Departments'],['appointments','Appointments'],
  ] as [Tab,string][], []);

  const saveProfile = async () => {
    setSaving(true); setError('');
    try {
      const payload:any = {
        name:profileForm.name, phone:profileForm.phone || undefined, email:profileForm.email || undefined, website:profileForm.website || undefined,
        addressLine1:profileForm.addressLine1 || undefined, city:profileForm.city || undefined, state:profileForm.state || undefined,
        pinCode:profileForm.pinCode || undefined, totalBeds:profileForm.totalBeds===''?undefined:Number(profileForm.totalBeds),
        icuBeds:profileForm.icuBeds===''?undefined:Number(profileForm.icuBeds), emergencyAvailable:profileForm.emergencyAvailable,
        opdTimings:profileForm.opdTimings || undefined, specialties:splitCsv(profileForm.specialties), accreditations:splitCsv(profileForm.accreditations),
      };
      await api.put('/hospitals/profile/me', payload); setToast('Hospital profile saved'); await load(); setTab('profile');
    } catch(e:any){ setError(e?.response?.data?.message ?? 'Failed to save hospital profile.'); }
    finally{ setSaving(false); }
  };

  const addDoctor = async () => {
    if (!doctorForm.email.trim()) return;
    setSaving(true); setError('');
    try { await api.post('/hospitals/doctors/invite', { email:doctorForm.email.trim(), department:doctorForm.department||undefined, isPrimary:doctorForm.isPrimary });
      setDoctorForm({email:'',department:'',isPrimary:false}); setToast('Doctor added to hospital'); await load(); setTab('doctors');
    } catch(e:any){ setError(e?.response?.data?.message ?? 'Failed to add doctor.'); } finally{ setSaving(false); }
  };

  const removeDoctor = async (doctorId:string) => {
    if (!window.confirm('Remove this doctor from the hospital directory?')) return;
    try { await api.delete(`/hospitals/doctors/${doctorId}`); setToast('Doctor removed'); await load(); }
    catch(e:any){ setError(e?.response?.data?.message ?? 'Failed to remove doctor.'); }
  };

  const addDepartment = async () => {
    if (!departmentForm.name.trim()) return;
    setSaving(true); setError('');
    try { await api.post('/hospitals/departments', { name:departmentForm.name.trim(), headName:departmentForm.headName||undefined, phone:departmentForm.phone||undefined });
      setDepartmentForm({name:'',headName:'',phone:''}); setToast('Department created'); await load(); setTab('departments');
    } catch(e:any){ setError(e?.response?.data?.message ?? 'Failed to create department.'); } finally{ setSaving(false); }
  };

  const deleteDepartment = async (id:string) => {
    if (!window.confirm('Delete this department?')) return;
    try { await api.delete(`/hospitals/departments/${id}`); setToast('Department deleted'); await load(); }
    catch(e:any){ setError(e?.response?.data?.message ?? 'Failed to delete department.'); }
  };

  if (!authReady || loading) return <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:C.page, color:C.text }}><div>Loading Hospital Portal…</div></div>;

  return (
    <div style={{ minHeight:'100vh', background:C.page, color:C.navy, fontFamily:'Arial, sans-serif' }}>
      <SessionTimeoutManager />
      {toast && <div style={{ position:'fixed', right:22, bottom:22, zIndex:50, background:C.tealDark, color:'#fff', padding:'11px 16px', borderRadius:12, boxShadow:'0 10px 30px rgba(15,23,42,.18)', fontSize:13, fontWeight:700 }}>✓ {toast}</div>}
      <header style={{ height:66, background:'#fff', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}><div style={{ width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${C.tealDark},${C.teal})`,color:'#fff',display:'grid',placeItems:'center',fontWeight:900 }}>HC</div>
          <div><div style={{ fontWeight:850, fontSize:15 }}>{hospital.name || 'Hospital Portal'}</div><div style={{ fontSize:11,color:C.muted }}>HealthConnect India · {profileUser?.registrationId ?? ''}</div></div></div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:11,fontWeight:800,padding:'5px 9px',borderRadius:999,background:hospital.isVerified?'#DCFCE7':'#FEF3C7',color:hospital.isVerified?'#166534':C.amber }}>{hospital.isVerified?'✓ Verified':'Verification pending'}</span>
          <button onClick={load} style={{ border:`1px solid ${C.border}`,background:'#fff',borderRadius:9,padding:'7px 10px',cursor:'pointer' }}>Refresh</button></div>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'220px minmax(0,1fr)', minHeight:'calc(100vh - 66px)' }}>
        <aside style={{ background:'#fff', borderRight:`1px solid ${C.border}`, padding:'18px 12px' }}>
          {nav.map(([key,label]) => <button key={key} onClick={()=>{setTab(key);setError('')}} style={{ width:'100%',textAlign:'left',border:'none',borderRadius:10,padding:'11px 12px',marginBottom:5,cursor:'pointer',fontSize:13,fontWeight:750,background:tab===key?C.soft:'transparent',color:tab===key?C.tealDark:C.text }}>{label}</button>)}
          <div style={{ marginTop:22,padding:12,borderRadius:12,background:'#F8FAFC',border:`1px solid ${C.border}`,fontSize:11,color:C.muted,lineHeight:1.5 }}>Hospital management uses live database records. Public verification and premium status cannot be self-edited.</div>
        </aside>

        <main style={{ padding:24, minWidth:0 }}>
          <div style={{ marginBottom:20 }}><h1 style={{ margin:0,fontSize:24 }}>Hospital Management</h1><div style={{ marginTop:5,fontSize:13,color:C.muted }}>Manage hospital operations without changing the public directory design.</div></div>
          {error && <div style={{ marginBottom:16,padding:'11px 14px',borderRadius:10,background:'#FFF1F2',border:'1px solid #FECDD3',color:C.danger,fontSize:13 }}>⚠ {error}</div>}

          {tab==='overview' && <>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14 }}>
              <StatCard label="Doctors" value={stats.doctors??0}/><StatCard label="Departments" value={stats.departments??0}/><StatCard label="Patients" value={stats.patients??0}/><StatCard label="Today's appointments" value={stats.todayAppointments??0}/>
              <StatCard label="Upcoming" value={stats.upcomingAppointments??0}/><StatCard label="Total beds" value={stats.totalBeds??0}/><StatCard label="ICU beds" value={stats.icuBeds??0}/><StatCard label="Emergency" value={hospital.emergencyAvailable?'Available':'No'}/>
            </div>
            <section style={{ marginTop:20,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18 }}><h2 style={{ margin:'0 0 14px',fontSize:17 }}>Recent appointments</h2>
              {(dashboard?.recentAppointments??[]).length===0?<div style={{color:C.muted,fontSize:13}}>No hospital-linked appointments yet.</div>:(dashboard.recentAppointments??[]).map((a:any)=><div key={a.id} style={{ display:'grid',gridTemplateColumns:'1.1fr 1.1fr .8fr .8fr',gap:10,padding:'10px 0',borderTop:`1px solid ${C.border}`,fontSize:12 }}><span>{a.patient?.firstName} {a.patient?.lastName}</span><span>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</span><span>{a.status}</span><span>{formatDate(a.scheduledAt)}</span></div>)}
            </section>
          </>}

          {tab==='profile' && <section style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}><div><h2 style={{margin:0,fontSize:18}}>Hospital Profile</h2><div style={{fontSize:12,color:C.muted,marginTop:4}}>Contact, capacity, specialties and public hospital information.</div></div><Button onClick={saveProfile} disabled={saving}>{saving?'Saving…':'Save profile'}</Button></div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:14 }}>
              <Input label="Hospital name" value={profileForm.name} onChange={(e:any)=>setProfileForm(p=>({...p,name:e.target.value}))}/><Input label="Phone" value={profileForm.phone} onChange={(e:any)=>setProfileForm(p=>({...p,phone:e.target.value}))}/>
              <Input label="Public email" value={profileForm.email} onChange={(e:any)=>setProfileForm(p=>({...p,email:e.target.value}))}/><Input label="Website" value={profileForm.website} onChange={(e:any)=>setProfileForm(p=>({...p,website:e.target.value}))}/>
              <Input label="Address" value={profileForm.addressLine1} onChange={(e:any)=>setProfileForm(p=>({...p,addressLine1:e.target.value}))}/><Input label="City" value={profileForm.city} onChange={(e:any)=>setProfileForm(p=>({...p,city:e.target.value}))}/>
              <Input label="State" value={profileForm.state} onChange={(e:any)=>setProfileForm(p=>({...p,state:e.target.value}))}/><Input label="PIN code" value={profileForm.pinCode} onChange={(e:any)=>setProfileForm(p=>({...p,pinCode:e.target.value}))}/>
              <Input label="Total beds" type="number" min="0" value={profileForm.totalBeds} onChange={(e:any)=>setProfileForm(p=>({...p,totalBeds:e.target.value}))}/><Input label="ICU beds" type="number" min="0" value={profileForm.icuBeds} onChange={(e:any)=>setProfileForm(p=>({...p,icuBeds:e.target.value}))}/>
              <Input label="OPD timings" value={profileForm.opdTimings} onChange={(e:any)=>setProfileForm(p=>({...p,opdTimings:e.target.value}))}/><label style={{display:'flex',alignItems:'center',gap:9,marginTop:24,fontSize:13,fontWeight:700,color:C.text}}><input type="checkbox" checked={profileForm.emergencyAvailable} onChange={e=>setProfileForm(p=>({...p,emergencyAvailable:e.target.checked}))}/> 24×7 Emergency available</label>
            </div>
            <div style={{marginTop:14}}><Input label="Specialties (comma-separated)" value={profileForm.specialties} onChange={(e:any)=>setProfileForm(p=>({...p,specialties:e.target.value}))}/></div>
            <div style={{marginTop:14}}><Input label="Accreditations (comma-separated)" value={profileForm.accreditations} onChange={(e:any)=>setProfileForm(p=>({...p,accreditations:e.target.value}))}/></div>
          </section>}

          {tab==='doctors' && <><section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18,marginBottom:16}}><h2 style={{margin:'0 0 12px',fontSize:17}}>Add existing HealthConnect doctor</h2><div style={{display:'grid',gridTemplateColumns:'2fr 1fr auto auto',gap:10,alignItems:'end'}}><Input label="Doctor login email" placeholder="firstname.lastname@demo.hc" value={doctorForm.email} onChange={(e:any)=>setDoctorForm(p=>({...p,email:e.target.value}))}/><Input label="Department" value={doctorForm.department} onChange={(e:any)=>setDoctorForm(p=>({...p,department:e.target.value}))}/><label style={{fontSize:12,fontWeight:700,color:C.text,paddingBottom:10}}><input type="checkbox" checked={doctorForm.isPrimary} onChange={e=>setDoctorForm(p=>({...p,isPrimary:e.target.checked}))}/> Primary</label><Button onClick={addDoctor} disabled={saving}>Add doctor</Button></div></section>
            <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18}}><h2 style={{margin:'0 0 12px',fontSize:17}}>Affiliated Doctors ({doctors.length})</h2>{doctors.length===0?<div style={{color:C.muted,fontSize:13}}>No doctors linked yet.</div>:doctors.map((d:any)=><div key={d.id} style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr auto',gap:12,alignItems:'center',padding:'11px 0',borderTop:`1px solid ${C.border}`}}><div><div style={{fontWeight:800,fontSize:13}}>Dr. {d.firstName} {d.lastName}</div><div style={{fontSize:11,color:C.muted}}>{d.email} · {d.hcDoctorId??d.registrationId??''}</div></div><div style={{fontSize:12}}>{d.specialization??'—'}</div><div style={{fontSize:12,color:C.muted}}>{d.department??'No department'}{d.isPrimary?' · Primary':''}</div><Button danger onClick={()=>removeDoctor(d.id)}>Remove</Button></div>)}</section></>}

          {tab==='departments' && <><section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18,marginBottom:16}}><h2 style={{margin:'0 0 12px',fontSize:17}}>Create Department</h2><div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr 1fr auto',gap:10,alignItems:'end'}}><Input label="Department name" value={departmentForm.name} onChange={(e:any)=>setDepartmentForm(p=>({...p,name:e.target.value}))}/><Input label="Head" value={departmentForm.headName} onChange={(e:any)=>setDepartmentForm(p=>({...p,headName:e.target.value}))}/><Input label="Phone" value={departmentForm.phone} onChange={(e:any)=>setDepartmentForm(p=>({...p,phone:e.target.value}))}/><Button onClick={addDepartment} disabled={saving}>Create</Button></div></section>
            <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18}}><h2 style={{margin:'0 0 12px',fontSize:17}}>Departments ({departments.length})</h2>{departments.length===0?<div style={{color:C.muted,fontSize:13}}>No departments configured.</div>:departments.map((d:any)=><div key={d.id} style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr auto',gap:12,alignItems:'center',padding:'11px 0',borderTop:`1px solid ${C.border}`,fontSize:12}}><strong>{d.name}</strong><span>{d.headName??'—'}</span><span>{d.phone??'—'}</span><Button danger onClick={()=>deleteDepartment(d.id)}>Delete</Button></div>)}</section></>}

          {tab==='appointments' && <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><h2 style={{margin:0,fontSize:17}}>Hospital-linked Appointments ({appointments.length})</h2><Button onClick={load}>Refresh</Button></div>{appointments.length===0?<div style={{color:C.muted,fontSize:13}}>No appointments currently linked to this hospital.</div>:appointments.map((a:any)=><div key={a.id} style={{display:'grid',gridTemplateColumns:'1.1fr 1.1fr .8fr .8fr 1.1fr',gap:10,padding:'11px 0',borderTop:`1px solid ${C.border}`,fontSize:12}}><span>{a.patient?.firstName} {a.patient?.lastName}</span><span>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</span><span>{a.type}</span><span>{a.status}</span><span>{formatDate(a.scheduledAt)}</span></div>)}</section>}
        </main>
      </div>
    </div>
  );
}
