'use client';

import { useMemo, useState } from 'react';
import { patientAPI } from '@/lib/api';

const C = {
  bg: '#0C1628', border: 'rgba(20,184,166,0.18)', teal: '#14B8A6', tealDk: '#0D9488',
  rose: '#F43F5E', text: '#E8F0FE', muted: '#8BA0BF', dim: '#536987',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
  background: 'rgba(255,255,255,0.045)', color: C.text, fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, color: C.muted, fontSize: 11, fontWeight: 750,
  letterSpacing: '.07em', textTransform: 'uppercase',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div style={{ marginBottom: 15 }}><label style={labelStyle}>{label}{required && <span style={{ color: C.rose }}> *</span>}</label>{children}</div>;
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => <option key={option.value} value={option.value} style={{ background: C.bg }}>{option.label}</option>)}
    </select>
  );
}

const dateOnly = (value?: string | null) => value ? String(value).slice(0, 10) : '';
const validIndianMobile = (value: string) => /^[6-9]\d{9}$/.test(value);

interface Props {
  profile: any;
  userName?: string;
  onComplete: (profile: any) => void;
  onClose: () => void;
}

export default function PatientProfileOnboardingModal({ profile, userName, onComplete, onClose }: Props) {
  const primary = useMemo(
    () => (profile?.emergencyContacts ?? []).find((contact: any) => contact.isPrimary) ?? profile?.emergencyContacts?.[0] ?? null,
    [profile],
  );

  const initialStep = profile?.completion?.sections?.personal?.complete
    ? profile?.completion?.sections?.contact?.complete
      ? 2
      : 1
    : 0;

  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [dob, setDob] = useState(dateOnly(profile?.dateOfBirth));
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup === 'UNKNOWN' ? '' : (profile?.bloodGroup ?? ''));

  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [district, setDistrict] = useState(profile?.district ?? '');
  const [state, setState] = useState(profile?.state ?? '');

  const [contactId] = useState(primary?.id ?? '');
  const [contactName, setContactName] = useState(primary?.name ?? '');
  const [relationship, setRelationship] = useState(primary?.relationship ?? '');
  const [contactPhone, setContactPhone] = useState(primary?.phone ?? '');

  const canContinue = [
    Boolean(dob && gender),
    Boolean(validIndianMobile(phone) && city.trim() && district.trim() && state.trim()),
    Boolean(contactName.trim() && relationship && validIndianMobile(contactPhone)),
  ][step];

  const saveStep = async () => {
    setSaving(true);
    setError('');
    try {
      if (step === 0) {
        await patientAPI.updateProfile({
          dateOfBirth: dob,
          gender,
          ...(bloodGroup ? { bloodGroup } : {}),
        });
        setStep(1);
        return;
      }

      if (step === 1) {
        await patientAPI.updateProfile({
          phone,
          city: city.trim(),
          district: district.trim(),
          state: state.trim(),
        });
        setStep(2);
        return;
      }

      const contactPayload = {
        name: contactName.trim(),
        relationship,
        phone: contactPhone,
        isPrimary: true,
      };

      if (contactId) await patientAPI.updateEmergencyContact(contactId, contactPayload);
      else await patientAPI.addEmergencyContact(contactPayload);

      const response: any = await patientAPI.getProfile();
      const canonical = response?.data?.data ?? response?.data ?? {};
      if (!canonical?.completion?.coreComplete) {
        setError('A required profile detail is still missing. Please review the highlighted steps.');
        return;
      }
      onComplete(canonical);
    } catch (e: any) {
      const apiErrors = e?.response?.data?.errors;
      const validationMessage = Array.isArray(apiErrors) && apiErrors[0]?.message ? apiErrors[0].message : null;
      setError(validationMessage ?? e?.response?.data?.message ?? 'Unable to save these details. Please check the information and try again.');
    } finally {
      setSaving(false);
    }
  };

  const steps = ['Personal details', 'Contact & location', 'Emergency contact'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,8,20,.86)', backdropFilter: 'blur(12px)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,.45)', padding: '26px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, marginBottom: 18 }}>
          <div>
            <div style={{ color: C.teal, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 7 }}>Complete your patient profile</div>
            <h2 style={{ color: C.text, margin: '0 0 5px', fontSize: 22 }}>Welcome{userName ? `, ${userName}` : ''}! 👋</h2>
            <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Three short steps. Your medical information and Health Score are managed separately.</p>
          </div>
          <button onClick={onClose} title="Remind me later" aria-label="Close profile setup" style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,.05)', color: C.muted, cursor: 'pointer', fontSize: 17 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {steps.map((title, index) => (
            <div key={title} style={{ flex: 1 }}>
              <div style={{ color: index === step ? C.text : C.dim, fontSize: 10, fontWeight: 700, marginBottom: 7 }}>{index + 1}. {title}</div>
              <div style={{ height: 3, borderRadius: 99, background: index < step ? C.teal : index === step ? 'rgba(20,184,166,.55)' : 'rgba(255,255,255,.08)' }} />
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Date of birth" required><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} style={{ ...inputStyle, colorScheme: 'dark' }} /></Field>
              <Field label="Gender" required><Select value={gender} onChange={setGender} placeholder="Select gender" options={[{value:'MALE',label:'Male'},{value:'FEMALE',label:'Female'},{value:'OTHER',label:'Other'},{value:'PREFER_NOT_TO_SAY',label:'Prefer not to say'}]} /></Field>
            </div>
            <Field label="Blood group — optional"><Select value={bloodGroup} onChange={setBloodGroup} placeholder="Select only if known" options={[{value:'A_POSITIVE',label:'A+'},{value:'A_NEGATIVE',label:'A-'},{value:'B_POSITIVE',label:'B+'},{value:'B_NEGATIVE',label:'B-'},{value:'AB_POSITIVE',label:'AB+'},{value:'AB_NEGATIVE',label:'AB-'},{value:'O_POSITIVE',label:'O+'},{value:'O_NEGATIVE',label:'O-'},{value:'UNKNOWN',label:'Unknown'}]} /></Field>
            <div style={{ padding: '10px 13px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'rgba(20,184,166,.05)', color: C.muted, fontSize: 12 }}>Blood group is useful in care, but it is optional and does not affect Profile Completion.</div>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Mobile number" required><input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit Indian mobile number" style={inputStyle} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="City" required><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Ambala" style={inputStyle} /></Field>
              <Field label="District" required><input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Ambala" style={inputStyle} /></Field>
            </div>
            <Field label="State / UT" required><input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Haryana" style={inputStyle} /></Field>
            <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>City is required so HealthConnect can support location-based discovery and care services. District and State/UT provide consistent India-specific location context.</div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ padding: '10px 13px', borderRadius: 10, background: 'rgba(244,63,94,.06)', border: '1px solid rgba(244,63,94,.20)', color: '#FDA4AF', fontSize: 12, marginBottom: 15 }}>Emergency contact details are used only for care and emergency-support purposes.</div>
            <Field label="Contact name" required><input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" style={inputStyle} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Relationship" required><Select value={relationship} onChange={setRelationship} placeholder="Select relationship" options={[{value:'Spouse',label:'Spouse'},{value:'Parent',label:'Parent'},{value:'Child',label:'Child'},{value:'Sibling',label:'Sibling'},{value:'Guardian',label:'Guardian'},{value:'Friend',label:'Friend'},{value:'Other',label:'Other'}]} /></Field>
              <Field label="Mobile number" required><input value={contactPhone} onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit mobile number" style={inputStyle} /></Field>
            </div>
          </>
        )}

        {error && <div style={{ marginTop: 14, padding: '10px 13px', borderRadius: 9, background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.22)', color: '#FDA4AF', fontSize: 12 }}>⚠️ {error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && <button onClick={() => { setError(''); setStep((current) => current - 1); }} disabled={saving} style={{ padding: '11px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 650 }}>← Back</button>}
            <button onClick={onClose} disabled={saving} style={{ padding: '11px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, cursor: saving ? 'not-allowed' : 'pointer' }}>Remind me later</button>
          </div>
          <button onClick={saveStep} disabled={!canContinue || saving} style={{ minWidth: 140, padding: '12px 22px', borderRadius: 10, border: 'none', background: !canContinue || saving ? 'rgba(255,255,255,.07)' : `linear-gradient(135deg,${C.tealDk},${C.teal})`, color: !canContinue || saving ? C.dim : '#fff', cursor: !canContinue || saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 750, boxShadow: !canContinue || saving ? 'none' : '0 4px 16px rgba(20,184,166,.25)' }}>{saving ? 'Saving…' : step < 2 ? 'Continue →' : 'Complete Profile ✓'}</button>
        </div>
      </div>
    </div>
  );
}
