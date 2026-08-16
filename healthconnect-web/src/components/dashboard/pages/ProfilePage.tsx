'use client';

import { useEffect, useMemo, useState } from 'react';
import { patientAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';

const C = {
  card: '#FDFCFB', border: '#E5E7EB', soft: '#F5F7F8', teal: '#0D9488', teal2: '#14B8A6',
  blue: '#1A6BB5', text: '#132238', text2: '#4B647E', text3: '#718096', green: '#15803D',
  amber: '#B45309', rose: '#BE123C',
};
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: '0 2px 10px rgba(15,23,42,.05)' };
const input: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #D8E2EA', background: '#FFF', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const label: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 10.5, fontWeight: 800, color: C.text3, letterSpacing: '.06em', textTransform: 'uppercase' };

const BLOOD_GROUPS = [
  {v:'UNKNOWN',l:'Unknown / not provided'}, {v:'O_POSITIVE',l:'O+'},{v:'O_NEGATIVE',l:'O-'},{v:'A_POSITIVE',l:'A+'},{v:'A_NEGATIVE',l:'A-'},
  {v:'B_POSITIVE',l:'B+'},{v:'B_NEGATIVE',l:'B-'},{v:'AB_POSITIVE',l:'AB+'},{v:'AB_NEGATIVE',l:'AB-'},
];
const BLOOD_DISPLAY: Record<string,string> = { O_POSITIVE:'O+',O_NEGATIVE:'O-',A_POSITIVE:'A+',A_NEGATIVE:'A-',B_POSITIVE:'B+',B_NEGATIVE:'B-',AB_POSITIVE:'AB+',AB_NEGATIVE:'AB+',UNKNOWN:'Unknown' };
const GENDERS = [{v:'MALE',l:'Male'},{v:'FEMALE',l:'Female'},{v:'OTHER',l:'Other'},{v:'PREFER_NOT_TO_SAY',l:'Prefer not to say'}];
const CONTACT_METHODS = [{v:'APP',l:'HealthConnect app'},{v:'SMS',l:'SMS'},{v:'EMAIL',l:'Email'},{v:'CALL',l:'Phone call'}];
const RH = [{v:'UNKNOWN',l:'Unknown / not provided'},{v:'POSITIVE',l:'Positive (+)'},{v:'NEGATIVE',l:'Negative (-)'}];

const dateOnly = (value?: string | null) => value ? String(value).slice(0, 10) : '';
const csvToArray = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const arrayToCsv = (value?: string[] | null) => Array.isArray(value) ? value.join(', ') : '';

function Field({ title, required, children, help }: { title: string; required?: boolean; children: React.ReactNode; help?: string }) {
  return <div><label style={label}>{title}{required && <span style={{ color: C.rose }}> *</span>}</label>{children}{help && <div style={{ marginTop: 5, fontSize: 10.5, color: C.text3, lineHeight: 1.4 }}>{help}</div>}</div>;
}

function SectionCard({ icon, title, subtitle, status, expanded, onToggle, children }: any) {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', border: 0, background: '#FFF', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{title}</div><div style={{ marginTop: 2, fontSize: 11.5, color: C.text3 }}>{subtitle}</div></div>
        {status && <span style={{ fontSize: 10.5, fontWeight: 750, color: status.color ?? C.blue, background: status.bg ?? '#EFF6FF', padding: '4px 9px', borderRadius: 99 }}>{status.label}</span>}
        <span style={{ fontSize: 20, color: C.blue, fontWeight: 400 }}>{expanded ? '−' : '+'}</span>
      </button>
      {expanded && <div style={{ borderTop: `1px solid ${C.border}`, padding: '22px 20px', background: '#FDFCFB' }}>{children}</div>}
    </div>
  );
}

function SaveRow({ onSave, saving, error }: { onSave: () => void; saving: boolean; error?: string }) {
  return <><div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}><button onClick={onSave} disabled={saving} style={{ padding: '11px 22px', border: 0, borderRadius: 10, background: `linear-gradient(135deg,${C.teal},${C.teal2})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: saving ? .7 : 1 }}>{saving ? 'Saving…' : 'Save changes'}</button></div>{error && <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 9, background: '#FFF1F2', border: '1px solid #FECDD3', color: C.rose, fontSize: 12 }}>⚠️ {error}</div>}</>;
}

export default function ProfilePage() {
  const ui = useUIStore() as any;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string>('personal');
  const [saving, setSaving] = useState<string>('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [secondaryLanguages, setSecondaryLanguages] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [draftContact, setDraftContact] = useState<any>(null);

  const applyCanonical = (canonical: any) => {
    setProfile(canonical);
    setSecondaryLanguages(arrayToCsv(canonical?.secondaryLanguages));
    setAccessibilityNeeds(arrayToCsv(canonical?.accessibilityNeeds));
    window.dispatchEvent(new CustomEvent('hc:patient-profile-updated', { detail: canonical }));
  };

  const load = async () => {
    setLoading(true);
    try {
      const response: any = await patientAPI.getProfile();
      applyCanonical(response?.data?.data ?? response?.data ?? {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (key: string, value: any) => setProfile((current: any) => ({ ...current, [key]: value }));
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const validationMessage = (e: any) => {
    const errors = e?.response?.data?.errors;
    return Array.isArray(errors) && errors[0]?.message ? errors[0].message : (e?.response?.data?.message ?? 'Unable to save. Please review the information.');
  };

  const save = async (section: string, payload: any) => {
    setSaving(section); setError('');
    try {
      const response: any = await patientAPI.updateProfile(payload);
      applyCanonical(response?.data?.data ?? response?.data ?? {});
      showToast('✓ Profile updated');
    } catch (e: any) { setError(validationMessage(e)); }
    finally { setSaving(''); }
  };

  const refreshAfterContact = async (message: string) => {
    const response: any = await patientAPI.getProfile();
    applyCanonical(response?.data?.data ?? response?.data ?? {});
    setDraftContact(null);
    showToast(message);
  };

  const saveContact = async (contact: any) => {
    setSaving(`contact-${contact.id ?? 'new'}`); setError('');
    try {
      const payload = {
        name: contact.name?.trim(), relationship: contact.relationship, phone: contact.phone,
        alternatePhone: contact.alternatePhone?.trim() || null, email: contact.email?.trim() || null,
        isPrimary: Boolean(contact.isPrimary),
      };
      if (contact.id) await patientAPI.updateEmergencyContact(contact.id, payload);
      else await patientAPI.addEmergencyContact(payload);
      await refreshAfterContact('✓ Emergency contact saved');
    } catch (e: any) { setError(validationMessage(e)); }
    finally { setSaving(''); }
  };

  const deleteContact = async (contact: any) => {
    if (!contact?.id) { setDraftContact(null); return; }
    setSaving(`contact-${contact.id}`); setError('');
    try { await patientAPI.deleteEmergencyContact(contact.id); await refreshAfterContact('Emergency contact removed'); }
    catch (e: any) { setError(validationMessage(e)); }
    finally { setSaving(''); }
  };

  const completion = profile?.completion;
  const missing = completion?.missing ?? [];
  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName = [profile?.firstName, profile?.middleName, profile?.lastName].filter(Boolean).join(' ') || 'Patient';
  const snapshot = profile?.medicalSnapshot ?? {};
  const contacts = profile?.emergencyContacts ?? [];

  const sectionStatus = useMemo(() => ({
    personal: completion?.sections?.personal?.complete ? { label: 'Core ready', color: C.green, bg: '#ECFDF3' } : { label: `${completion?.sections?.personal?.completed ?? 0}/${completion?.sections?.personal?.total ?? 3} core ready` },
    contact: completion?.sections?.contact?.complete ? { label: 'Core ready', color: C.green, bg: '#ECFDF3' } : { label: `${completion?.sections?.contact?.completed ?? 0}/${completion?.sections?.contact?.total ?? 4} core ready` },
    emergency: completion?.sections?.emergency?.complete ? { label: 'Primary contact ready', color: C.green, bg: '#ECFDF3' } : { label: 'Primary contact needed', color: C.amber, bg: '#FFF7ED' },
  }), [completion]);

  if (loading) return <div style={{ display: 'grid', gap: 14 }}>{[1,2,3].map((item) => <div key={item} style={{ height: 110, borderRadius: 16, background: '#EEF1F3' }} />)}</div>;
  if (!profile) return <div style={{ ...card, padding: 24, color: C.rose }}>Unable to load your profile.</div>;

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {toast && <div style={{ position: 'fixed', right: 28, bottom: 28, zIndex: 9999, padding: '11px 18px', borderRadius: 11, background: '#123B37', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}>{toast}</div>}
      <style>{`@media(max-width:760px){.pp-grid2,.pp-grid3{grid-template-columns:1fr!important}.pp-summary{align-items:flex-start!important}.pp-header{flex-direction:column!important;align-items:flex-start!important}}`}</style>

      <div className="pp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div><h1 style={{ margin: 0, fontSize: 27, color: C.text, fontWeight: 850 }}>👤 My Profile</h1><p style={{ margin: '5px 0 0', color: C.text3, fontSize: 13 }}>Personal, contact and emergency information used across HealthConnect.</p></div>
        <div style={{ padding: '7px 12px', borderRadius: 99, background: completion?.coreComplete ? '#ECFDF3' : '#FFF7ED', color: completion?.coreComplete ? C.green : C.amber, fontSize: 11.5, fontWeight: 800 }}>{completion?.coreComplete ? '✓ Profile setup complete' : `${completion?.percentage ?? 0}% core profile complete`}</div>
      </div>

      <div className="pp-summary" style={{ ...card, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${C.blue},${C.teal2})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, fontWeight: 850, flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 20, fontWeight: 850, color: C.text }}>{fullName}</div><div style={{ marginTop: 4, display: 'flex', gap: 9, flexWrap: 'wrap', color: C.text3, fontSize: 11.5 }}><span>{profile.registrationId}</span><span>•</span><span>{profile.email}</span>{profile.isEmailVerified && <span style={{ color: C.green }}>✓ verified</span>}{profile.bloodGroup && profile.bloodGroup !== 'UNKNOWN' && <span>• {BLOOD_DISPLAY[profile.bloodGroup]} Blood</span>}</div></div>
      </div>

      {!completion?.coreComplete && (
        <div style={{ ...card, padding: '16px 18px', borderLeft: `4px solid ${C.amber}`, background: '#FFFBF3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div><div style={{ fontSize: 13.5, fontWeight: 850, color: C.text }}>Complete {completion?.missingCount ?? missing.length} remaining core detail{(completion?.missingCount ?? missing.length) === 1 ? '' : 's'}</div><div style={{ marginTop: 3, fontSize: 11.5, color: C.text3 }}>Only personal, location and primary emergency-contact details count toward Profile Completion.</div></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{missing.slice(0,4).map((item:any)=><span key={item.key} style={{ padding: '4px 8px', borderRadius: 99, background: '#FFF', border: '1px solid #F2D6A7', color: C.amber, fontSize: 10.5, fontWeight: 700 }}>{item.label}</span>)}</div></div>
        </div>
      )}

      <SectionCard icon="👤" title="Personal Details" subtitle="Identity and demographic information" status={sectionStatus.personal} expanded={expanded==='personal'} onToggle={()=>setExpanded(expanded==='personal'?'':'personal')}>
        <div className="pp-grid3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Field title="First name" required><input value={profile.firstName ?? ''} onChange={e=>set('firstName',e.target.value)} style={input}/></Field>
          <Field title="Middle name"><input value={profile.middleName ?? ''} onChange={e=>set('middleName',e.target.value)} style={input}/></Field>
          <Field title="Last name" required><input value={profile.lastName ?? ''} onChange={e=>set('lastName',e.target.value)} style={input}/></Field>
          <Field title="Preferred name"><input value={profile.preferredName ?? ''} onChange={e=>set('preferredName',e.target.value)} placeholder="How you prefer to be addressed" style={input}/></Field>
          <Field title="Date of birth" required><input type="date" value={dateOnly(profile.dateOfBirth)} onChange={e=>set('dateOfBirth',e.target.value)} max={new Date().toISOString().slice(0,10)} style={input}/></Field>
          <Field title="Gender" required><select value={profile.gender ?? ''} onChange={e=>set('gender',e.target.value)} style={input}><option value="">Select gender</option>{GENDERS.map(x=><option key={x.v} value={x.v}>{x.l}</option>)}</select></Field>
          <Field title="Preferred pronouns"><input value={profile.preferredPronouns ?? ''} onChange={e=>set('preferredPronouns',e.target.value)} placeholder="Optional" style={input}/></Field>
          <Field title="Marital status"><input value={profile.maritalStatus ?? ''} onChange={e=>set('maritalStatus',e.target.value)} placeholder="Optional" style={input}/></Field>
          <Field title="Blood group" help="Optional; unknown is a valid value."><select value={profile.bloodGroup ?? 'UNKNOWN'} onChange={e=>set('bloodGroup',e.target.value)} style={input}>{BLOOD_GROUPS.map(x=><option key={x.v} value={x.v}>{x.l}</option>)}</select></Field>
          <Field title="Rh factor"><select value={profile.rhFactor ?? 'UNKNOWN'} onChange={e=>set('rhFactor',e.target.value)} style={input}>{RH.map(x=><option key={x.v} value={x.v}>{x.l}</option>)}</select></Field>
        </div>
        <SaveRow saving={saving==='personal'} error={saving===''?error:''} onSave={()=>save('personal',{firstName:profile.firstName,lastName:profile.lastName,middleName:profile.middleName||null,preferredName:profile.preferredName||null,dateOfBirth:dateOnly(profile.dateOfBirth),gender:profile.gender,preferredPronouns:profile.preferredPronouns||null,maritalStatus:profile.maritalStatus||null,bloodGroup:profile.bloodGroup??'UNKNOWN',rhFactor:profile.rhFactor??'UNKNOWN'})}/>
      </SectionCard>

      <SectionCard icon="📍" title="Contact & Address" subtitle="Location used for patient services and city-based discovery" status={sectionStatus.contact} expanded={expanded==='contact'} onToggle={()=>setExpanded(expanded==='contact'?'':'contact')}>
        <div className="pp-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field title="Mobile number" required><input value={profile.phone ?? ''} onChange={e=>set('phone',e.target.value.replace(/\D/g,'').slice(0,10))} inputMode="numeric" style={input}/></Field>
          <Field title="Alternate mobile"><input value={profile.alternatePhone ?? ''} onChange={e=>set('alternatePhone',e.target.value.replace(/\D/g,'').slice(0,10))} inputMode="numeric" style={input}/></Field>
          <Field title="Email" help="Login email is managed through Account Security."><input value={profile.email ?? ''} readOnly style={{...input,background:'#F3F5F6',color:C.text3}}/></Field>
          <Field title="Preferred contact method"><select value={profile.preferredContactMethod ?? ''} onChange={e=>set('preferredContactMethod',e.target.value)} style={input}><option value="">No preference</option>{CONTACT_METHODS.map(x=><option key={x.v} value={x.v}>{x.l}</option>)}</select></Field>
          <Field title="Address line 1"><input value={profile.addressLine1 ?? ''} onChange={e=>set('addressLine1',e.target.value)} style={input}/></Field>
          <Field title="Address line 2 / landmark"><input value={profile.addressLine2 ?? ''} onChange={e=>set('addressLine2',e.target.value)} style={input}/></Field>
          <Field title="City" required><input value={profile.city ?? ''} onChange={e=>set('city',e.target.value)} placeholder="City" style={input}/></Field>
          <Field title="District" required><input value={profile.district ?? ''} onChange={e=>set('district',e.target.value)} placeholder="District" style={input}/></Field>
          <Field title="State / UT" required><input value={profile.state ?? ''} onChange={e=>set('state',e.target.value)} placeholder="State / UT" style={input}/></Field>
          <Field title="PIN code"><input value={profile.pinCode ?? ''} onChange={e=>set('pinCode',e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" style={input}/></Field>
          <Field title="Country"><input value={profile.country ?? 'India'} onChange={e=>set('country',e.target.value)} style={input}/></Field>
        </div>
        <SaveRow saving={saving==='contact'} error={saving===''?error:''} onSave={()=>save('contact',{phone:profile.phone,alternatePhone:profile.alternatePhone||null,preferredContactMethod:profile.preferredContactMethod||null,addressLine1:profile.addressLine1||null,addressLine2:profile.addressLine2||null,city:profile.city,district:profile.district,state:profile.state,pinCode:profile.pinCode||null,country:profile.country||'India'})}/>
      </SectionCard>

      <SectionCard icon="🆘" title="Emergency Contacts" subtitle="Primary contact plus optional additional contacts" status={sectionStatus.emergency} expanded={expanded==='emergency'} onToggle={()=>setExpanded(expanded==='emergency'?'':'emergency')}>
        <div style={{ marginBottom: 14, fontSize: 11.5, color: C.text3 }}>At least one primary emergency contact with name, relationship and valid mobile number is required for Core Profile Completion.</div>
        <div style={{ display: 'grid', gap: 12 }}>
          {[...contacts, ...(draftContact ? [draftContact] : [])].map((contact:any,index:number)=><div key={contact.id ?? 'new'} style={{ border: '1px solid #E3E8ED', borderRadius: 13, padding: 16, background: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 13 }}><div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{contact.name || `Emergency contact ${index+1}`} {contact.isPrimary && <span style={{ marginLeft: 7, fontSize: 9.5, color: C.green, background: '#ECFDF3', padding: '3px 7px', borderRadius: 99 }}>PRIMARY</span>}</div><div style={{ display: 'flex', gap: 7 }}>{!contact.isPrimary&&<button onClick={()=>saveContact({...contact,isPrimary:true})} style={{border:'1px solid #CFE0ED',background:'#F6FAFD',color:C.blue,borderRadius:8,padding:'6px 9px',fontSize:10.5,cursor:'pointer'}}>Make primary</button>}<button onClick={()=>deleteContact(contact)} style={{border:'1px solid #F6D0D5',background:'#FFF5F6',color:C.rose,borderRadius:8,padding:'6px 9px',fontSize:10.5,cursor:'pointer'}}>Remove</button></div></div>
            <div className="pp-grid3" style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
              <Field title="Name" required><input value={contact.name??''} onChange={e=>contact.id?setProfile((p:any)=>({...p,emergencyContacts:p.emergencyContacts.map((x:any)=>x.id===contact.id?{...x,name:e.target.value}:x)})):setDraftContact((x:any)=>({...x,name:e.target.value}))} style={input}/></Field>
              <Field title="Relationship" required><select value={contact.relationship??''} onChange={e=>contact.id?setProfile((p:any)=>({...p,emergencyContacts:p.emergencyContacts.map((x:any)=>x.id===contact.id?{...x,relationship:e.target.value}:x)})):setDraftContact((x:any)=>({...x,relationship:e.target.value}))} style={input}><option value="">Select</option>{['Spouse','Parent','Child','Sibling','Guardian','Friend','Other'].map(x=><option key={x}>{x}</option>)}</select></Field>
              <Field title="Mobile" required><input value={contact.phone??''} onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,10);contact.id?setProfile((p:any)=>({...p,emergencyContacts:p.emergencyContacts.map((x:any)=>x.id===contact.id?{...x,phone:v}:x)})):setDraftContact((x:any)=>({...x,phone:v}))}} inputMode="numeric" style={input}/></Field>
              <Field title="Alternate mobile"><input value={contact.alternatePhone??''} onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,10);contact.id?setProfile((p:any)=>({...p,emergencyContacts:p.emergencyContacts.map((x:any)=>x.id===contact.id?{...x,alternatePhone:v}:x)})):setDraftContact((x:any)=>({...x,alternatePhone:v}))}} inputMode="numeric" style={input}/></Field>
              <Field title="Email"><input value={contact.email??''} onChange={e=>contact.id?setProfile((p:any)=>({...p,emergencyContacts:p.emergencyContacts.map((x:any)=>x.id===contact.id?{...x,email:e.target.value}:x)})):setDraftContact((x:any)=>({...x,email:e.target.value}))} style={input}/></Field>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}><button onClick={()=>saveContact(contact)} disabled={saving===`contact-${contact.id??'new'}`} style={{border:0,borderRadius:9,padding:'8px 13px',background:C.teal,color:'#fff',fontSize:11,fontWeight:750,cursor:'pointer'}}>{saving===`contact-${contact.id??'new'}`?'Saving…':'Save contact'}</button></div>
          </div>)}
          {!draftContact&&<button onClick={()=>setDraftContact({name:'',relationship:'',phone:'',alternatePhone:'',email:'',isPrimary:contacts.length===0})} style={{ border:'1px dashed #BFD3E0',background:'#F8FBFD',borderRadius:12,padding:13,color:C.blue,fontWeight:750,cursor:'pointer' }}>+ Add emergency contact</button>}
        </div>
        {error&&expanded==='emergency'&&<div style={{marginTop:12,color:C.rose,fontSize:12}}>⚠️ {error}</div>}
      </SectionCard>

      <SectionCard icon="💬" title="Communication & Accessibility" subtitle="Language, contact and accessibility preferences" expanded={expanded==='communication'} onToggle={()=>setExpanded(expanded==='communication'?'':'communication')}>
        <div className="pp-grid2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Field title="Preferred language"><input value={profile.languagePreference??'en'} onChange={e=>set('languagePreference',e.target.value)} placeholder="en" style={input}/></Field>
          <Field title="Secondary languages" help="Comma separated, e.g. Hindi, Punjabi"><input value={secondaryLanguages} onChange={e=>setSecondaryLanguages(e.target.value)} style={input}/></Field>
          <Field title="Accessibility needs" help="Optional; comma separated"><input value={accessibilityNeeds} onChange={e=>setAccessibilityNeeds(e.target.value)} placeholder="e.g. wheelchair assistance, large text" style={input}/></Field>
        </div>
        <SaveRow saving={saving==='communication'} error={saving===''?error:''} onSave={()=>save('communication',{languagePreference:profile.languagePreference??'en',secondaryLanguages:csvToArray(secondaryLanguages),accessibilityNeeds:csvToArray(accessibilityNeeds)})}/>
      </SectionCard>

      <SectionCard icon="🛡️" title="Coverage & Health IDs" subtitle="Insurance and government health-scheme information" expanded={expanded==='coverage'} onToggle={()=>setExpanded(expanded==='coverage'?'':'coverage')}>
        <div className="pp-grid2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Field title="Insurance provider"><input value={profile.insuranceProvider??''} onChange={e=>set('insuranceProvider',e.target.value)} style={input}/></Field>
          <Field title="Policy / member number"><input value={profile.insurancePolicyNumber??''} onChange={e=>set('insurancePolicyNumber',e.target.value)} style={input}/></Field>
          <Field title="Insurance expiry"><input type="date" value={dateOnly(profile.insuranceExpiry)} onChange={e=>set('insuranceExpiry',e.target.value)} style={input}/></Field>
          <Field title="Government health scheme"><input value={profile.governmentScheme??''} onChange={e=>set('governmentScheme',e.target.value)} placeholder="e.g. PM-JAY" style={input}/></Field>
          <Field title="Scheme / beneficiary ID"><input value={profile.governmentSchemeId??''} onChange={e=>set('governmentSchemeId',e.target.value)} style={input}/></Field>
        </div>
        <div style={{marginTop:14,padding:'10px 12px',borderRadius:10,background:'#F4F8FB',color:C.text3,fontSize:11}}>ABHA will be connected through a verified ABDM integration flow rather than stored as an unverified free-text profile field.</div>
        <SaveRow saving={saving==='coverage'} error={saving===''?error:''} onSave={()=>save('coverage',{insuranceProvider:profile.insuranceProvider||null,insurancePolicyNumber:profile.insurancePolicyNumber||null,insuranceExpiry:dateOnly(profile.insuranceExpiry)||null,governmentScheme:profile.governmentScheme||null,governmentSchemeId:profile.governmentSchemeId||null})}/>
      </SectionCard>

      <div style={{ ...card, padding: '20px' }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:15}}><div><div style={{fontSize:15,fontWeight:850,color:C.text}}>🩺 Medical Snapshot</div><div style={{marginTop:3,fontSize:11.5,color:C.text3}}>Clinical information is managed in My Health and never affects Profile Completion.</div></div><button onClick={()=>ui.setActivePage('my-health')} style={{border:'1px solid #CFE0ED',background:'#F6FAFD',color:C.blue,borderRadius:9,padding:'8px 12px',fontSize:11,fontWeight:750,cursor:'pointer'}}>Manage in My Health →</button></div>
        <div className="pp-grid3" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[['Conditions',snapshot.conditionsCount??0],['Allergies',snapshot.allergiesCount??0],['Active medications',snapshot.activeMedicationsCount??0],['Vitals logged',snapshot.vitalsCount??0]].map(([title,value])=><div key={String(title)} style={{padding:'13px 14px',borderRadius:11,background:'#F5F7F8',border:'1px solid #E8ECEF'}}><div style={{fontSize:10.5,color:C.text3}}>{title}</div><div style={{marginTop:3,fontSize:19,fontWeight:850,color:C.text}}>{value}</div></div>)}
        </div>
      </div>
    </div>
  );
}
