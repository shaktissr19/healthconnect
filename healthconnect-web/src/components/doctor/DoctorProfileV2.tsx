'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';

const C = {
  teal: '#0D9488', tealDark: '#0F766E', green: '#15803D', amber: '#B45309', rose: '#BE123C',
  text: '#0F172A', mid: '#475569', muted: '#64748B', border: '#DDE8E7', bg: '#F5F4F0', card: '#FFFFFF',
};

type Completion = {
  percentage: number;
  completed: number;
  total: number;
  missing: Array<{ key: string; label: string }>;
};

type DoctorProfile = Record<string, any> & { profileCompletion?: Completion };

type FormState = {
  firstName: string; lastName: string; phone: string; dateOfBirth: string; gender: string; profilePhotoUrl: string;
  specialization: string; subSpecializations: string; qualification: string; experienceYears: string;
  medicalLicenseNumber: string; licenseState: string; medicalCouncil: string; registrationYear: string;
  clinicName: string; clinicAddress: string; city: string; state: string; pinCode: string; languagesSpoken: string;
  consultationFee: string; teleconsultFee: string; videoConsultFee: string; audioConsultFee: string;
  offersInPerson: boolean; offersVideoConsult: boolean; offersAudioConsult: boolean; offersChatConsult: boolean;
  isAvailableOnline: boolean; isAcceptingNewPatients: boolean; videoPlatform: string;
  bio: string; careerJourney: string; trainingHospitals: string; hospitalAffiliations: string; awards: string; publications: string;
};

const arrayText = (value: unknown) => Array.isArray(value) ? value.join(', ') : '';
const splitList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
const dateInput = (value: unknown) => {
  if (!value) return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value);
const initials = (profile: DoctorProfile | null) => `${profile?.firstName?.[0] ?? 'D'}${profile?.lastName?.[0] ?? 'R'}`.toUpperCase();

function toForm(profile: DoctorProfile): FormState {
  return {
    firstName: profile.firstName ?? '', lastName: profile.lastName ?? '', phone: profile.phone ?? '',
    dateOfBirth: dateInput(profile.dateOfBirth), gender: profile.gender ?? '', profilePhotoUrl: profile.profilePhotoUrl ?? '',
    specialization: profile.specialization ?? '', subSpecializations: arrayText(profile.subSpecializations),
    qualification: arrayText(profile.qualification), experienceYears: profile.experienceYears?.toString?.() ?? '',
    medicalLicenseNumber: profile.medicalLicenseNumber ?? '', licenseState: profile.licenseState ?? '',
    medicalCouncil: profile.medicalCouncil ?? '', registrationYear: profile.registrationYear?.toString?.() ?? '',
    clinicName: profile.clinicName ?? '', clinicAddress: profile.clinicAddress ?? '', city: profile.city ?? '',
    state: profile.state ?? '', pinCode: profile.pinCode ?? '', languagesSpoken: arrayText(profile.languagesSpoken),
    consultationFee: profile.consultationFee?.toString?.() ?? '', teleconsultFee: profile.teleconsultFee?.toString?.() ?? '',
    videoConsultFee: profile.videoConsultFee?.toString?.() ?? '', audioConsultFee: profile.audioConsultFee?.toString?.() ?? '',
    offersInPerson: profile.offersInPerson !== false, offersVideoConsult: Boolean(profile.offersVideoConsult),
    offersAudioConsult: Boolean(profile.offersAudioConsult), offersChatConsult: Boolean(profile.offersChatConsult),
    isAvailableOnline: profile.isAvailableOnline !== false, isAcceptingNewPatients: profile.isAcceptingNewPatients !== false,
    videoPlatform: profile.videoPlatform ?? '', bio: profile.bio ?? '', careerJourney: profile.careerJourney ?? '',
    trainingHospitals: arrayText(profile.trainingHospitals), hospitalAffiliations: arrayText(profile.hospitalAffiliations),
    awards: arrayText(profile.awards), publications: profile.publications?.toString?.() ?? '',
  };
}

const blankForm: FormState = toForm({});

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return <section style={card}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
    {children}
  </section>;
}

function Field({ label, value, children, required }: { label: string; value?: ReactNode; children?: ReactNode; required?: boolean }) {
  return <div style={{ minWidth: 0 }}>
    <div style={labelStyle}>{label}{required ? ' *' : ''}</div>
    {children ?? <div style={valueStyle}>{value || <span style={{ color: '#94A3B8' }}>Not added</span>}</div>}
  </div>;
}

function Input({ value, onChange, type = 'text', placeholder, maxLength }: { value: string; onChange: (value: string) => void; type?: string; placeholder?: string; maxLength?: number }) {
  return <input type={type} value={value} maxLength={maxLength} placeholder={placeholder} onChange={event => onChange(event.target.value)} style={inputStyle} />;
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (checked: boolean) => void; label: string; hint?: string }) {
  return <button type="button" onClick={() => onChange(!checked)} style={{ ...toggleRow, borderColor: checked ? '#99F6E4' : C.border, background: checked ? '#F0FDFA' : '#fff' }}>
    <div style={{ textAlign: 'left' }}><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{label}</div>{hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{hint}</div>}</div>
    <span style={{ width: 40, height: 22, borderRadius: 20, background: checked ? C.teal : '#CBD5E1', position: 'relative', flexShrink: 0 }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: checked ? 20 : 2, transition: 'left .15s' }} />
    </span>
  </button>;
}

const verificationCopy: Record<string, { label: string; color: string; bg: string }> = {
  VERIFIED: { label: 'Verified', color: '#047857', bg: '#ECFDF5' },
  SUBMITTED: { label: 'Submitted', color: '#1D4ED8', bg: '#EFF6FF' },
  UNDER_REVIEW: { label: 'Under review', color: '#7C3AED', bg: '#F5F3FF' },
  REJECTED: { label: 'Needs attention', color: '#BE123C', bg: '#FFF1F2' },
  SUSPENDED: { label: 'Suspended', color: '#BE123C', bg: '#FFF1F2' },
  PENDING: { label: 'Verification pending', color: '#B45309', bg: '#FFFBEB' },
};

export default function DoctorProfileV2() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/doctor/profile');
      const data = response?.data?.data ?? response?.data;
      setProfile(data);
      setForm(toForm(data));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to load doctor profile.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const completion: Completion = profile?.profileCompletion ?? {
    percentage: Number(profile?.profileScore ?? 0), completed: 0, total: 0, missing: [],
  };
  const verification = verificationCopy[profile?.verificationStatus ?? 'PENDING'] ?? verificationCopy.PENDING;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(previous => ({ ...previous, [key]: value }));

  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const payload = {
        firstName: form.firstName, lastName: form.lastName, phone: form.phone || null,
        dateOfBirth: form.dateOfBirth || null, gender: form.gender || null, profilePhotoUrl: form.profilePhotoUrl || null,
        specialization: form.specialization || null, subSpecializations: splitList(form.subSpecializations),
        qualification: splitList(form.qualification), experienceYears: numberOrNull(form.experienceYears),
        medicalLicenseNumber: form.medicalLicenseNumber || null, licenseState: form.licenseState || null,
        medicalCouncil: form.medicalCouncil || null, registrationYear: numberOrNull(form.registrationYear),
        clinicName: form.clinicName || null, clinicAddress: form.clinicAddress || null, city: form.city || null,
        state: form.state || null, pinCode: form.pinCode || null, languagesSpoken: splitList(form.languagesSpoken),
        consultationFee: numberOrNull(form.consultationFee), teleconsultFee: numberOrNull(form.teleconsultFee),
        videoConsultFee: numberOrNull(form.videoConsultFee), audioConsultFee: numberOrNull(form.audioConsultFee),
        offersInPerson: form.offersInPerson, offersVideoConsult: form.offersVideoConsult,
        offersAudioConsult: form.offersAudioConsult, offersChatConsult: form.offersChatConsult,
        isAvailableOnline: form.isAvailableOnline, isAcceptingNewPatients: form.isAcceptingNewPatients,
        videoPlatform: form.videoPlatform || null,
        bio: form.bio || null, careerJourney: form.careerJourney || null,
        trainingHospitals: splitList(form.trainingHospitals), hospitalAffiliations: splitList(form.hospitalAffiliations),
        awards: splitList(form.awards), publications: numberOrNull(form.publications),
      };
      const response = await api.put('/doctor/profile', payload);
      const data = response?.data?.data ?? response?.data;
      setProfile(data); setForm(toForm(data)); setEditing(false);
      setMessage('Profile saved successfully.');
    } catch (err: any) {
      const validation = err?.response?.data?.errors;
      setError(validation?.[0]?.message ?? err?.response?.data?.message ?? 'Unable to save doctor profile.');
    } finally { setSaving(false); }
  };

  const missingNames = useMemo(() => completion.missing?.map(item => item.label) ?? [], [completion.missing]);

  if (loading) return <div style={{ ...card, padding: 36, textAlign: 'center', color: C.muted }}>Loading doctor profile…</div>;
  if (!profile) return <div style={{ ...card, padding: 36 }}><div style={{ color: C.rose, fontWeight: 700 }}>{error || 'Doctor profile not found.'}</div><button onClick={() => void load()} style={primaryBtn}>Retry</button></div>;

  return <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ ...card, padding: 22, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ width: 68, height: 68, borderRadius: 18, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#0F766E,#14B8A6)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 900 }}>
        {profile.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt="Doctor profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(profile)}
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 21, color: C.text }}>Dr. {profile.firstName} {profile.lastName}</h1>
          <span style={{ padding: '4px 9px', borderRadius: 100, fontSize: 10, fontWeight: 800, color: verification.color, background: verification.bg }}>{verification.label}</span>
        </div>
        <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>{profile.specialization || 'Specialization not added'}{profile.hcDoctorId ? ` · ${profile.hcDoctorId}` : ''}</div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{profile.email}{profile.registrationId ? ` · ${profile.registrationId}` : ''}</div>
      </div>
      <div style={{ minWidth: 210 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}><b style={{ color: C.text }}>Core profile</b><b style={{ color: completion.percentage === 100 ? C.green : C.teal }}>{completion.percentage}%</b></div>
        <div style={{ height: 8, background: '#E2E8F0', borderRadius: 8, overflow: 'hidden' }}><div style={{ height: '100%', width: `${completion.percentage}%`, background: 'linear-gradient(90deg,#0D9488,#14B8A6)', borderRadius: 8 }} /></div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>{completion.completed}/{completion.total} essential requirements complete</div>
      </div>
      {!editing ? <button onClick={() => { setForm(toForm(profile)); setEditing(true); setError(''); setMessage(''); }} style={primaryBtn}>Edit Profile</button> : <div style={{ display: 'flex', gap: 8 }}><button onClick={() => { setEditing(false); setForm(toForm(profile)); }} style={ghostBtn} disabled={saving}>Cancel</button><button onClick={() => void save()} style={primaryBtn} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button></div>}
    </div>

    {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', color: C.green, fontSize: 12, fontWeight: 700 }}>✓ {message}</div>}
    {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FFF1F2', border: '1px solid #FECDD3', color: C.rose, fontSize: 12, fontWeight: 700 }}>⚠ {error}</div>}

    {missingNames.length > 0 && <div style={{ ...card, padding: '14px 18px', borderColor: '#FDE68A', background: '#FFFBEB' }}><div style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>Complete your essential profile</div><div style={{ fontSize: 11, color: '#A16207', marginTop: 4 }}>{missingNames.join(' · ')}</div><div style={{ fontSize: 10, color: '#A16207', marginTop: 5 }}>Optional narrative, consultation and availability fields do not reduce core completion.</div></div>}

    <div style={twoCol}>
      <Section title="Personal & Contact" sub="Core identity details used by onboarding and your doctor profile.">
        <div style={grid}>
          <Field label="First name" required>{editing ? <Input value={form.firstName} onChange={value => set('firstName', value)} /> : <div style={valueStyle}>{profile.firstName}</div>}</Field>
          <Field label="Last name" required>{editing ? <Input value={form.lastName} onChange={value => set('lastName', value)} /> : <div style={valueStyle}>{profile.lastName}</div>}</Field>
          <Field label="Mobile" required>{editing ? <Input value={form.phone} onChange={value => set('phone', value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" /> : <div style={valueStyle}>{profile.phone || 'Not added'}</div>}</Field>
          <Field label="Date of birth" required>{editing ? <Input type="date" value={form.dateOfBirth} onChange={value => set('dateOfBirth', value)} /> : <div style={valueStyle}>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : 'Not added'}</div>}</Field>
          <Field label="Gender" required>{editing ? <select value={form.gender} onChange={event => set('gender', event.target.value)} style={inputStyle}><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select> : <div style={valueStyle}>{profile.gender ? String(profile.gender).replaceAll('_', ' ') : 'Not added'}</div>}</Field>
          <Field label="Profile photo URL">{editing ? <Input value={form.profilePhotoUrl} onChange={value => set('profilePhotoUrl', value)} placeholder="https://…" /> : <div style={valueStyle}>{profile.profilePhotoUrl ? 'Photo configured' : 'Optional'}</div>}</Field>
        </div>
      </Section>

      <Section title="Professional Registration" sub="Professional identity. Verification status is admin-controlled.">
        <div style={grid}>
          <Field label="Specialization" required>{editing ? <Input value={form.specialization} onChange={value => set('specialization', value)} /> : <div style={valueStyle}>{profile.specialization || 'Not added'}</div>}</Field>
          <Field label="Experience (years)" required>{editing ? <Input type="number" value={form.experienceYears} onChange={value => set('experienceYears', value)} /> : <div style={valueStyle}>{profile.experienceYears ?? 'Not added'}</div>}</Field>
          <Field label="License / registration no." required>{editing ? <Input value={form.medicalLicenseNumber} onChange={value => set('medicalLicenseNumber', value)} /> : <div style={valueStyle}>{profile.medicalLicenseNumber || 'Not added'}</div>}</Field>
          <Field label="Medical council" required>{editing ? <Input value={form.medicalCouncil} onChange={value => set('medicalCouncil', value)} /> : <div style={valueStyle}>{profile.medicalCouncil || 'Not added'}</div>}</Field>
          <Field label="License state">{editing ? <Input value={form.licenseState} onChange={value => set('licenseState', value)} /> : <div style={valueStyle}>{profile.licenseState || 'Optional'}</div>}</Field>
          <Field label="Registration year">{editing ? <Input type="number" value={form.registrationYear} onChange={value => set('registrationYear', value)} /> : <div style={valueStyle}>{profile.registrationYear || 'Optional'}</div>}</Field>
        </div>
        <div style={{ marginTop: 12 }}><Field label="Qualifications (comma-separated)" required>{editing ? <Input value={form.qualification} onChange={value => set('qualification', value)} placeholder="MBBS, MD, DNB" /> : <div style={chipWrap}>{(profile.qualification ?? []).map((item: string) => <span key={item} style={chip}>{item}</span>)}</div>}</Field></div>
        <div style={{ marginTop: 12 }}><Field label="Sub-specializations">{editing ? <Input value={form.subSpecializations} onChange={value => set('subSpecializations', value)} placeholder="Interventional Cardiology, Heart Failure" /> : <div style={chipWrap}>{(profile.subSpecializations ?? []).map((item: string) => <span key={item} style={chip}>{item}</span>)}</div>}</Field></div>
      </Section>
    </div>

    <Section title="Practice & Communication" sub="Location and language information used for patient discovery.">
      <div style={gridWide}>
        <Field label="Clinic / practice name">{editing ? <Input value={form.clinicName} onChange={value => set('clinicName', value)} /> : <div style={valueStyle}>{profile.clinicName || 'Optional'}</div>}</Field>
        <Field label="Clinic address">{editing ? <Input value={form.clinicAddress} onChange={value => set('clinicAddress', value)} /> : <div style={valueStyle}>{profile.clinicAddress || 'Optional'}</div>}</Field>
        <Field label="City" required>{editing ? <Input value={form.city} onChange={value => set('city', value)} /> : <div style={valueStyle}>{profile.city || 'Not added'}</div>}</Field>
        <Field label="State" required>{editing ? <Input value={form.state} onChange={value => set('state', value)} /> : <div style={valueStyle}>{profile.state || 'Not added'}</div>}</Field>
        <Field label="PIN code">{editing ? <Input value={form.pinCode} onChange={value => set('pinCode', value.replace(/\D/g, '').slice(0, 6))} /> : <div style={valueStyle}>{profile.pinCode || 'Optional'}</div>}</Field>
        <Field label="Languages">{editing ? <Input value={form.languagesSpoken} onChange={value => set('languagesSpoken', value)} placeholder="Hindi, English" /> : <div style={valueStyle}>{arrayText(profile.languagesSpoken) || 'Not added'}</div>}</Field>
      </div>
    </Section>

    <Section title="Consultation Modes" sub="Existing booking modes and fees remain connected to the public doctor profile.">
      {editing ? <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginBottom: 14 }}>
          <Toggle checked={form.offersInPerson} onChange={value => set('offersInPerson', value)} label="In-person" />
          <Toggle checked={form.offersVideoConsult} onChange={value => set('offersVideoConsult', value)} label="Video consultation" />
          <Toggle checked={form.offersAudioConsult} onChange={value => set('offersAudioConsult', value)} label="Audio consultation" />
          <Toggle checked={form.offersChatConsult} onChange={value => set('offersChatConsult', value)} label="Chat consultation" />
          <Toggle checked={form.isAvailableOnline} onChange={value => set('isAvailableOnline', value)} label="Available online" />
          <Toggle checked={form.isAcceptingNewPatients} onChange={value => set('isAcceptingNewPatients', value)} label="Accepting new patients" />
        </div>
        <div style={gridWide}>
          <Field label="In-person fee"><Input type="number" value={form.consultationFee} onChange={value => set('consultationFee', value)} /></Field>
          <Field label="Teleconsult fee"><Input type="number" value={form.teleconsultFee} onChange={value => set('teleconsultFee', value)} /></Field>
          <Field label="Video fee"><Input type="number" value={form.videoConsultFee} onChange={value => set('videoConsultFee', value)} /></Field>
          <Field label="Audio fee"><Input type="number" value={form.audioConsultFee} onChange={value => set('audioConsultFee', value)} /></Field>
          <Field label="Video platform"><Input value={form.videoPlatform} onChange={value => set('videoPlatform', value)} placeholder="jitsi, daily, custom…" /></Field>
        </div>
      </> : <div style={gridWide}>
        <Field label="In-person" value={profile.offersInPerson !== false ? `Available${profile.consultationFee != null ? ` · ₹${profile.consultationFee}` : ''}` : 'Off'} />
        <Field label="Video" value={profile.offersVideoConsult ? `Available${profile.videoConsultFee != null ? ` · ₹${profile.videoConsultFee}` : ''}` : 'Off'} />
        <Field label="Audio" value={profile.offersAudioConsult ? `Available${profile.audioConsultFee != null ? ` · ₹${profile.audioConsultFee}` : ''}` : 'Off'} />
        <Field label="Chat" value={profile.offersChatConsult ? 'Available' : 'Off'} />
        <Field label="Online status" value={profile.isAvailableOnline ? 'Available online' : 'Offline'} />
        <Field label="New patients" value={profile.isAcceptingNewPatients ? 'Accepting' : 'Not accepting'} />
      </div>}
      <button onClick={() => (useUIStore.getState() as any).setActivePage?.('availability')} style={{ ...ghostBtn, marginTop: 14 }}>Manage weekly availability →</button>
    </Section>

    <div style={twoCol}>
      <Section title="About & Career" sub="Optional narrative shown on your public doctor profile.">
        <Field label="Bio">{editing ? <textarea value={form.bio} onChange={event => set('bio', event.target.value)} rows={4} style={textAreaStyle} /> : <div style={longValue}>{profile.bio || 'Optional'}</div>}</Field>
        <div style={{ marginTop: 12 }}><Field label="Career journey">{editing ? <textarea value={form.careerJourney} onChange={event => set('careerJourney', event.target.value)} rows={5} style={textAreaStyle} /> : <div style={longValue}>{profile.careerJourney || 'Optional'}</div>}</Field></div>
      </Section>
      <Section title="Training & Recognition" sub="Optional supporting professional information.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Training hospitals">{editing ? <Input value={form.trainingHospitals} onChange={value => set('trainingHospitals', value)} /> : <div style={longValue}>{arrayText(profile.trainingHospitals) || 'Optional'}</div>}</Field>
          <Field label="Hospital affiliations">{editing ? <Input value={form.hospitalAffiliations} onChange={value => set('hospitalAffiliations', value)} /> : <div style={longValue}>{arrayText(profile.hospitalAffiliations) || 'Optional'}</div>}</Field>
          <Field label="Awards">{editing ? <Input value={form.awards} onChange={value => set('awards', value)} /> : <div style={longValue}>{arrayText(profile.awards) || 'Optional'}</div>}</Field>
          <Field label="Publications">{editing ? <Input type="number" value={form.publications} onChange={value => set('publications', value)} /> : <div style={valueStyle}>{profile.publications ?? 'Optional'}</div>}</Field>
        </div>
      </Section>
    </div>

    {editing && <div style={{ ...card, padding: 16, position: 'sticky', bottom: 12, zIndex: 5, display: 'flex', justifyContent: 'flex-end', gap: 8, boxShadow: '0 10px 30px rgba(15,23,42,.12)' }}><button onClick={() => { setEditing(false); setForm(toForm(profile)); }} style={ghostBtn} disabled={saving}>Cancel</button><button onClick={() => void save()} style={primaryBtn} disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button></div>}
  </div>;
}

const card: CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' };
const twoCol: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 16 };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 13 };
const gridWide: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 13 };
const labelStyle: CSSProperties = { fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 };
const valueStyle: CSSProperties = { minHeight: 35, display: 'flex', alignItems: 'center', color: C.text, fontSize: 13, fontWeight: 600, wordBreak: 'break-word' };
const longValue: CSSProperties = { color: C.mid, fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap' };
const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 10px', background: '#FBFDFC', color: C.text, outline: 'none', fontSize: 13, fontFamily: 'inherit' };
const textAreaStyle: CSSProperties = { ...inputStyle, resize: 'vertical' };
const primaryBtn: CSSProperties = { border: 0, borderRadius: 9, padding: '9px 16px', background: 'linear-gradient(135deg,#0F766E,#14B8A6)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' };
const ghostBtn: CSSProperties = { border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 14px', background: '#fff', color: C.mid, fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const toggleRow: CSSProperties = { border: '1px solid', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'inherit' };
const chipWrap: CSSProperties = { minHeight: 35, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 };
const chip: CSSProperties = { padding: '4px 8px', borderRadius: 100, background: '#F0FDFA', border: '1px solid #99F6E4', color: C.tealDark, fontSize: 11, fontWeight: 700 };
