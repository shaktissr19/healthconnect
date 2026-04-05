'use client';
// src/components/onboarding/ProfileOnboardingModal.tsx
// HealthConnect — First-Login Profile Onboarding Modal
// Matches dark modal style of BookAppointmentModal.tsx
// Supports: PATIENT | DOCTOR | HOSPITAL
// Mandatory fields enforced; optional fields skippable with snooze reminder

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

// ── Design tokens — matches BookAppointmentModal exactly ─────────────────
const C = {
  bg:        '#0C1628',
  card:      '#111E33',
  card2:     '#162236',
  border:    'rgba(20,184,166,0.15)',
  borderHi:  'rgba(20,184,166,0.35)',
  teal:      '#14B8A6',
  tealDk:    '#0D9488',
  tealGlow:  'rgba(20,184,166,0.08)',
  green:     '#22C55E',
  amber:     '#F59E0B',
  rose:      '#F43F5E',
  txt:       '#E8F0FE',
  txt2:      '#7A8FAF',
  txt3:      '#4A5568',
};

// ── Storage key for snooze ────────────────────────────────────────────────
const SNOOZE_KEY  = 'hc_onboarding_snoozed';
const DONE_KEY    = 'hc_onboarding_done';

export function isOnboardingDone():    boolean { return localStorage.getItem(DONE_KEY)   === 'true'; }
export function isOnboardingSnoozed(): boolean {
  const v = localStorage.getItem(SNOOZE_KEY);
  if (!v) return false;
  // Snooze lasts for the current browser session only (sessionStorage would also work)
  return v === 'session';
}
export function snoozeOnboarding()  { localStorage.setItem(SNOOZE_KEY, 'session'); }
export function completeOnboarding(){ localStorage.setItem(DONE_KEY, 'true'); localStorage.removeItem(SNOOZE_KEY); }

// ── Shared input style ────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)',
  color: C.txt, fontSize: 14, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
};
const label: React.CSSProperties = {
  fontSize: 11, color: C.txt2, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  display: 'block', marginBottom: 6,
};
const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

// ── Field group component ─────────────────────────────────────────────────
function Field({ l, required, children }: { l: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={label}>{l}{required && <span style={{ color: C.rose, marginLeft: 3 }}>*</span>}</label>
      {children}
    </div>
  );
}

// ── Select component ──────────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: {v:string;l:string}[]; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inp, cursor: 'pointer', appearance: 'none' as any }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.v} value={o.v} style={{ background: C.card }}>{o.l}</option>)}
    </select>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────
function StepBar({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 100,
          background: i < current ? C.teal : i === current ? `linear-gradient(90deg,${C.teal},${C.tealGlow})` : 'rgba(255,255,255,0.08)',
          transition: 'background 0.3s' }} />
      ))}
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, disabled, loading }: any) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ padding: '12px 28px', borderRadius: 10, border: 'none',
        background: (disabled || loading) ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${C.tealDk},${C.teal})`,
        color: (disabled || loading) ? C.txt3 : '#fff', fontSize: 14, fontWeight: 700,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        boxShadow: (disabled || loading) ? 'none' : '0 4px 16px rgba(20,184,166,0.3)',
        transition: 'all 0.15s' }}>
      {loading ? '⟳ Saving…' : children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT ONBOARDING
// Steps: 1-About You  2-Contact  3-Emergency Contact
// ─────────────────────────────────────────────────────────────────────────────
function PatientOnboarding({ onComplete, onSnooze }: { onComplete: () => void; onSnooze: () => void }) {
  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Step 0 — About You
  const [dob,         setDob]         = useState('');
  const [gender,      setGender]      = useState('');
  const [bloodGroup,  setBloodGroup]  = useState('');

  // Step 1 — Contact
  const [phone,  setPhone]  = useState('');
  const [city,   setCity]   = useState('');
  const [state,  setState]  = useState('');

  // Step 2 — Emergency Contact
  const [ecName,     setEcName]     = useState('');
  const [ecRelation, setEcRelation] = useState('');
  const [ecPhone,    setEcPhone]    = useState('');

  const STEPS = [
    { title: 'About You',        sub: 'Basic health information',        icon: '👤' },
    { title: 'Contact Details',  sub: 'Where you are located',           icon: '📍' },
    { title: 'Emergency Contact',sub: 'Who to contact in an emergency',  icon: '🆘' },
  ];

  const canNext = [
    dob && gender,
    phone && city,
    ecName && ecRelation && ecPhone,
  ][step];

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      // Step 0+1 data saved together at end, or per step — save all at final step
      if (step < 2) { setStep(s => s + 1); setSaving(false); return; }

      // Final step — save everything
      await api.patch('/patient/profile', {
        dateOfBirth:  dob,
        gender:       gender.toUpperCase(),
        bloodGroup:   bloodGroup || undefined,
        phone,
        city,
        state:        state || undefined,
      });

      // Save emergency contact
      await api.post('/patient/emergency-contacts', {
        name: ecName, relationship: ecRelation, phone: ecPhone, isPrimary: true,
      }).catch(() => {}); // non-blocking if endpoint varies

      onComplete();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Step 0: About You */}
      {step === 0 && (
        <>
          <div style={{ row2 } as any}>
            <div style={row2}>
              <Field l="Date of Birth" required>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                  style={{ ...inp, colorScheme: 'dark' }} max={new Date().toISOString().split('T')[0]} />
              </Field>
              <Field l="Gender" required>
                <Select value={gender} onChange={setGender} placeholder="Select gender"
                  options={[{v:'MALE',l:'Male'},{v:'FEMALE',l:'Female'},{v:'OTHER',l:'Other'},{v:'PREFER_NOT_TO_SAY',l:'Prefer not to say'}]} />
              </Field>
            </div>
            <Field l="Blood Group">
              <Select value={bloodGroup} onChange={setBloodGroup} placeholder="Select blood group (optional)"
                options={[
                  {v:'A_POSITIVE',l:'A+'},{v:'A_NEGATIVE',l:'A-'},
                  {v:'B_POSITIVE',l:'B+'},{v:'B_NEGATIVE',l:'B-'},
                  {v:'AB_POSITIVE',l:'AB+'},{v:'AB_NEGATIVE',l:'AB-'},
                  {v:'O_POSITIVE',l:'O+'},{v:'O_NEGATIVE',l:'O-'},
                  {v:'UNKNOWN',l:'Unknown'},
                ]} />
            </Field>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(20,184,166,0.06)', border: `1px solid ${C.border}`, fontSize: 12, color: C.txt2, marginTop: 4 }}>
            💡 This helps doctors provide better care and emergency services to use the right blood type.
          </div>
        </>
      )}

      {/* Step 1: Contact */}
      {step === 1 && (
        <>
          <Field l="Phone Number" required>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
              placeholder="10-digit mobile number" style={inp} />
          </Field>
          <div style={row2}>
            <Field l="City" required>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Your city" style={inp} />
            </Field>
            <Field l="State">
              <input value={state} onChange={e => setState(e.target.value)} placeholder="State (optional)" style={inp} />
            </Field>
          </div>
        </>
      )}

      {/* Step 2: Emergency Contact */}
      {step === 2 && (
        <>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', fontSize: 12, color: '#FDA4AF', marginBottom: 16 }}>
            🆘 Emergency contacts are only used in medical emergencies and are never shared with third parties.
          </div>
          <Field l="Contact Name" required>
            <input value={ecName} onChange={e => setEcName(e.target.value)} placeholder="e.g. Rahul Sharma" style={inp} />
          </Field>
          <div style={row2}>
            <Field l="Relationship" required>
              <Select value={ecRelation} onChange={setEcRelation} placeholder="Select relation"
                options={[
                  {v:'Spouse',l:'Spouse'},{v:'Parent',l:'Parent'},{v:'Child',l:'Child'},
                  {v:'Sibling',l:'Sibling'},{v:'Friend',l:'Friend'},{v:'Other',l:'Other'},
                ]} />
            </Field>
            <Field l="Phone Number" required>
              <input type="tel" value={ecPhone} onChange={e => setEcPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                placeholder="10-digit number" style={inp} />
            </Field>
          </div>
        </>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: C.rose, fontSize: 13, marginTop: 8 }}>⚠️ {error}</div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.txt2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Back
            </button>
          )}
          <button onClick={onSnooze}
            style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.txt3, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Remind me later
          </button>
        </div>
        <PrimaryBtn onClick={handleSave} disabled={!canNext} loading={saving}>
          {step < 2 ? 'Continue →' : '✓ Complete Profile'}
        </PrimaryBtn>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR ONBOARDING
// Steps: 0-Basic  1-Practice  2-Credentials  3-Journey (optional)
// ─────────────────────────────────────────────────────────────────────────────
function DoctorOnboarding({ onComplete, onSnooze }: { onComplete: () => void; onSnooze: () => void }) {
  const [step,   setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Step 0 — Basic
  const [phone,  setPhone]  = useState('');
  const [dob,    setDob]    = useState('');
  const [gender, setGender] = useState('');

  // Step 1 — Practice
  const [specialization, setSpecialization] = useState('');
  const [city,            setCity]           = useState('');
  const [state,           setState]          = useState('');
  const [consultationFee, setConsultationFee]= useState('');

  // Step 2 — Credentials
  const [licenseNumber,  setLicenseNumber]  = useState('');
  const [experienceYears,setExperienceYears]= useState('');
  const [qualification,  setQualification]  = useState('');
  const [medicalCouncil, setMedicalCouncil] = useState('');

  // Step 3 — Journey (fully optional)
  const [bio,              setBio]              = useState('');
  const [careerJourney,    setCareerJourney]    = useState('');
  const [awards,           setAwards]           = useState('');
  const [trainingHospitals,setTrainingHospitals]= useState('');

  const STEPS = [
    { title: 'Basic Details',      sub: 'Personal information',          icon: '👤' },
    { title: 'Your Practice',      sub: 'Specialization & location',     icon: '🏥' },
    { title: 'Credentials',        sub: 'License & qualifications',      icon: '🎓' },
    { title: 'Your Story',         sub: 'Help patients know you better', icon: '✍️', optional: true },
  ];

  const canNext = [
    phone && gender,
    specialization && city,
    licenseNumber,
    true, // step 3 is fully optional
  ][step];

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (step < 3) { setStep(s => s + 1); setSaving(false); return; }

      // Build awards array from comma-separated string
      const awardsArr = awards.split(',').map(s => s.trim()).filter(Boolean);
      const hospitalsArr = trainingHospitals.split(',').map(s => s.trim()).filter(Boolean);
      const qualArr = qualification.split(',').map(s => s.trim()).filter(Boolean);

      await api.put('/doctor/profile', {
        phone,
        dateOfBirth:      dob || undefined,
        gender:           gender.toUpperCase() || undefined,
        specialization,
        city,
        state:            state || undefined,
        consultationFee:  consultationFee ? parseFloat(consultationFee) : undefined,
        medicalLicenseNumber: licenseNumber,
        experienceYears:  experienceYears ? parseInt(experienceYears) : undefined,
        qualification:    qualArr.length ? qualArr : undefined,
        medicalCouncil:   medicalCouncil || undefined,
        bio:              bio || undefined,
        careerJourney:    careerJourney || undefined,
        awards:           awardsArr.length ? awardsArr : undefined,
        trainingHospitals:hospitalsArr.length ? hospitalsArr : undefined,
      });

      onComplete();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const SPECIALIZATIONS = [
    'General Physician','Cardiologist','Neurologist','Psychiatrist','Dermatologist',
    'Gynecologist','Endocrinologist','Gastroenterologist','Nephrologist','Urologist',
    'Pulmonologist','Ophthalmologist','ENT Specialist','Oncologist','Orthopedic Surgeon',
    'Pediatrician','Physiotherapist','Nutritionist','Radiologist','Anesthesiologist',
  ];

  return (
    <>
      {/* Step 0: Basic */}
      {step === 0 && (
        <>
          <Field l="Phone Number" required>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
              placeholder="10-digit mobile number" style={inp} autoFocus />
          </Field>
          <div style={row2}>
            <Field l="Date of Birth">
              <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                style={{ ...inp, colorScheme: 'dark' }} max={new Date().toISOString().split('T')[0]} />
            </Field>
            <Field l="Gender" required>
              <Select value={gender} onChange={setGender} placeholder="Select gender"
                options={[{v:'MALE',l:'Male'},{v:'FEMALE',l:'Female'},{v:'OTHER',l:'Other'}]} />
            </Field>
          </div>
        </>
      )}

      {/* Step 1: Practice */}
      {step === 1 && (
        <>
          <Field l="Specialization" required>
            <Select value={specialization} onChange={setSpecialization} placeholder="Select your specialization"
              options={SPECIALIZATIONS.map(s => ({ v: s, l: s }))} />
          </Field>
          <div style={row2}>
            <Field l="City" required>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="City where you practice" style={inp} />
            </Field>
            <Field l="State">
              <input value={state} onChange={e => setState(e.target.value)} placeholder="State" style={inp} />
            </Field>
          </div>
          <Field l="Consultation Fee (₹)">
            <input type="number" value={consultationFee} onChange={e => setConsultationFee(e.target.value)}
              placeholder="e.g. 500 (optional — can set later)" style={inp} min="0" />
          </Field>
        </>
      )}

      {/* Step 2: Credentials */}
      {step === 2 && (
        <>
          <Field l="Medical License Number" required>
            <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
              placeholder="e.g. MCI-12345" style={inp} autoFocus />
          </Field>
          <Field l="Education / Degree">
            <input value={qualification} onChange={e => setQualification(e.target.value)}
              placeholder="e.g. MBBS, MD, DM Cardiology (comma separated)" style={inp} />
          </Field>
          <div style={row2}>
            <Field l="Years of Experience">
              <input type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)}
                placeholder="e.g. 12" style={inp} min="0" max="60" />
            </Field>
            <Field l="Medical Council">
              <input value={medicalCouncil} onChange={e => setMedicalCouncil(e.target.value)}
                placeholder="e.g. MCI, Delhi MC" style={inp} />
            </Field>
          </div>
        </>
      )}

      {/* Step 3: Story (optional) */}
      {step === 3 && (
        <>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(20,184,166,0.06)', border: `1px solid ${C.border}`, fontSize: 12, color: C.txt2, marginBottom: 16 }}>
            ✍️ <strong style={{ color: C.teal }}>Optional but powerful</strong> — Doctors with a complete story get significantly more patient trust and bookings. You can also add this from your profile page later.
          </div>
          <Field l="About You (Bio)">
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Brief introduction — who you are, what you treat, your approach to care…"
              style={{ ...inp, resize: 'vertical' as any, lineHeight: 1.5 }} />
          </Field>
          <Field l="Career Journey">
            <textarea value={careerJourney} onChange={e => setCareerJourney(e.target.value)} rows={3}
              placeholder="Your journey in medicine — where you trained, hospitals worked, milestones…"
              style={{ ...inp, resize: 'vertical' as any, lineHeight: 1.5 }} />
          </Field>
          <Field l="Training Hospitals">
            <input value={trainingHospitals} onChange={e => setTrainingHospitals(e.target.value)}
              placeholder="e.g. AIIMS Delhi, Fortis, Apollo (comma separated)" style={inp} />
          </Field>
          <Field l="Awards & Accreditations">
            <input value={awards} onChange={e => setAwards(e.target.value)}
              placeholder="e.g. Best Cardiologist 2023, NABH Accredited (comma separated)" style={inp} />
          </Field>
        </>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: C.rose, fontSize: 13, marginTop: 8 }}>⚠️ {error}</div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.txt2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Back
            </button>
          )}
          <button onClick={onSnooze}
            style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.txt3, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {step === 3 ? 'Skip for now' : 'Remind me later'}
          </button>
        </div>
        <PrimaryBtn onClick={handleSave} disabled={!canNext} loading={saving}>
          {step < 3 ? 'Continue →' : '✓ Complete Profile'}
        </PrimaryBtn>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITAL ONBOARDING
// Steps: 0-Basic  1-Location  2-Details
// ─────────────────────────────────────────────────────────────────────────────
function HospitalOnboarding({ onComplete, onSnooze }: { onComplete: () => void; onSnooze: () => void }) {
  const [step,   setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const [phone,          setPhone]          = useState('');
  const [hospitalType,   setHospitalType]   = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [city,           setCity]           = useState('');
  const [state,          setState]          = useState('');
  const [address,        setAddress]        = useState('');
  const [bedCount,       setBedCount]       = useState('');
  const [website,        setWebsite]        = useState('');
  const [specialties,    setSpecialties]    = useState('');

  const canNext = [
    phone && hospitalType,
    city && address,
    registrationNo,
  ][step];

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (step < 2) { setStep(s => s + 1); setSaving(false); return; }
      await api.put('/hospital/profile', {
        phone, hospitalType, registrationNumber: registrationNo,
        city, state, address,
        bedCount:   bedCount   ? parseInt(bedCount)    : undefined,
        website:    website    || undefined,
        specialties: specialties ? specialties.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      });
      onComplete();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {step === 0 && (
        <>
          <Field l="Phone Number" required>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
              placeholder="Hospital contact number" style={inp} autoFocus />
          </Field>
          <Field l="Hospital Type" required>
            <Select value={hospitalType} onChange={setHospitalType} placeholder="Select type"
              options={[
                {v:'GOVERNMENT',l:'Government Hospital'},{v:'PRIVATE',l:'Private Hospital'},
                {v:'CLINIC',l:'Clinic'},{v:'MULTISPECIALTY',l:'Multi-specialty Hospital'},
                {v:'DIAGNOSTIC',l:'Diagnostic Centre'},{v:'NURSING_HOME',l:'Nursing Home'},
              ]} />
          </Field>
        </>
      )}

      {step === 1 && (
        <>
          <Field l="Address" required>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
              placeholder="Full hospital address" style={{ ...inp, resize: 'vertical' as any }} />
          </Field>
          <div style={row2}>
            <Field l="City" required>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" style={inp} />
            </Field>
            <Field l="State">
              <input value={state} onChange={e => setState(e.target.value)} placeholder="State" style={inp} />
            </Field>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Field l="Registration Number" required>
            <input value={registrationNo} onChange={e => setRegistrationNo(e.target.value)}
              placeholder="Hospital registration / NABH number" style={inp} autoFocus />
          </Field>
          <div style={row2}>
            <Field l="Bed Count">
              <input type="number" value={bedCount} onChange={e => setBedCount(e.target.value)}
                placeholder="Total beds" style={inp} min="1" />
            </Field>
            <Field l="Website">
              <input value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://..." style={inp} />
            </Field>
          </div>
          <Field l="Specialties Offered">
            <input value={specialties} onChange={e => setSpecialties(e.target.value)}
              placeholder="e.g. Cardiology, Neurology, Oncology (comma separated)" style={inp} />
          </Field>
        </>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: C.rose, fontSize: 13, marginTop: 8 }}>⚠️ {error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.txt2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Back
            </button>
          )}
          <button onClick={onSnooze}
            style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.txt3, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Remind me later
          </button>
        </div>
        <PrimaryBtn onClick={handleSave} disabled={!canNext} loading={saving}>
          {step < 2 ? 'Continue →' : '✓ Complete Profile'}
        </PrimaryBtn>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL — role-based rendering
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL';
  userName?: string;
  onClose: () => void;
}

export default function ProfileOnboardingModal({ role, userName, onClose }: Props) {

  const ROLE_CONFIG = {
    PATIENT:  { steps: 3, icon: '🩺', color: '#14B8A6', label: 'Patient Profile' },
    DOCTOR:   { steps: 4, icon: '👨‍⚕️', color: '#6366F1', label: 'Doctor Profile' },
    HOSPITAL: { steps: 3, icon: '🏥', color: '#F59E0B', label: 'Hospital Profile' },
  };

  const [step, setCurrentStep] = useState(0); // tracked by child but reflected here for stepbar

  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.PATIENT;

  const handleComplete = useCallback(() => {
    completeOnboarding();
    onClose();
  }, [onClose]);

  const handleSnooze = useCallback(() => {
    snoozeOnboarding();
    onClose();
  }, [onClose]);

  const STEP_TITLES: Record<string, string[]> = {
    PATIENT:  ['About You', 'Contact Details', 'Emergency Contact'],
    DOCTOR:   ['Basic Details', 'Your Practice', 'Credentials', 'Your Story'],
    HOSPITAL: ['Basic Info', 'Location', 'Registration'],
  };

  // We track step externally by reading the child's progress via a shared counter approach
  // For simplicity we render based on child's internal step via a wrapper ref approach
  // Using a simpler approach: pass setCurrentStep down

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,8,20,0.88)', backdropFilter: 'blur(14px)', padding: 16,
    }}>
      <div style={{
        background: C.bg, borderRadius: 20, width: '100%', maxWidth: 520,
        border: `1px solid ${C.border}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(20,184,166,0.08)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: config.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Complete Your {config.label}
                </span>
                <span style={{ fontSize: 10, background: 'rgba(244,63,94,0.15)', color: C.rose, border: '1px solid rgba(244,63,94,0.25)', padding: '1px 7px', borderRadius: 100, fontWeight: 700 }}>
                  Required
                </span>
              </div>
              <h2 style={{ color: C.txt, fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>
                Welcome{userName ? `, ${userName}` : ''}! 👋
              </h2>
              <p style={{ color: C.txt2, fontSize: 13, margin: 0 }}>
                Just a few details to get you set up — takes under 2 minutes.
              </p>
            </div>
            {/* No close button — use Remind me later instead */}
          </div>

          {/* Step pills */}
          <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
            {STEP_TITLES[role].map((t, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                color: C.txt2,
              }}>
                {i + 1}. {t}
              </span>
            ))}
          </div>

          {/* Progress bar placeholder — children update step */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {STEP_TITLES[role].map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 100, background: 'rgba(255,255,255,0.08)' }}
                id={`hc-ob-step-${i}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
          {role === 'PATIENT'  && <PatientOnboarding  onComplete={handleComplete} onSnooze={handleSnooze} />}
          {role === 'DOCTOR'   && <DoctorOnboarding   onComplete={handleComplete} onSnooze={handleSnooze} />}
          {role === 'HOSPITAL' && <HospitalOnboarding onComplete={handleComplete} onSnooze={handleSnooze} />}
        </div>
      </div>

      <style>{`
        @keyframes hcObSlideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        select option { background: #111E33; color: #E8F0FE; }
        input::placeholder, textarea::placeholder { color: rgba(122,143,175,0.5); }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(20,184,166,0.25); border-radius: 4px; }
      `}</style>
    </div>
  );
}
