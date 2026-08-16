'use client';
// HealthConnect profile completion UI.
// Patient completion is based only on stable patient-profile data.
// Account/security and clinical/Health Score data are intentionally excluded.

import { useMemo, useState } from 'react';

const C = {
  teal: '#14B8A6', tealDk: '#0D9488', green: '#22C55E', amber: '#F59E0B', rose: '#F43F5E',
  txt: '#E8F0FE', txt2: '#7A8FAF', txt3: '#4A5568', card: '#111E33', border: 'rgba(20,184,166,0.15)',
};

export interface ProfileSection {
  key: string;
  label: string;
  points: number;
  done: boolean;
  action: string;
}

const PATIENT_CORE = [
  { key: 'name', label: 'First and last name' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'phone', label: 'Mobile number' },
  { key: 'city', label: 'City' },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State / UT' },
  { key: 'primaryEmergencyContact', label: 'Primary emergency contact' },
] as const;

function fallbackPatientSections(profile: any): ProfileSection[] {
  const primaryEmergency = (profile?.emergencyContacts ?? []).some((c: any) =>
    c?.isPrimary && c?.name?.trim?.() && c?.relationship?.trim?.() && c?.phone?.trim?.(),
  );
  const done: Record<string, boolean> = {
    name: Boolean(profile?.firstName?.trim?.() && profile?.lastName?.trim?.()),
    dateOfBirth: Boolean(profile?.dateOfBirth),
    gender: Boolean(profile?.gender),
    phone: Boolean(profile?.phone?.trim?.()),
    city: Boolean(profile?.city?.trim?.()),
    district: Boolean(profile?.district?.trim?.()),
    state: Boolean(profile?.state?.trim?.()),
    primaryEmergencyContact: primaryEmergency,
  };
  return PATIENT_CORE.map((item) => ({ ...item, points: 1, done: done[item.key], action: 'profile' }));
}

export function useProfileScore(profile: any, role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL'): {
  score: number;
  sections: ProfileSection[];
  total: number;
} {
  return useMemo(() => {
    if (!profile) return { score: 0, sections: [], total: 0 };

    let sections: ProfileSection[] = [];

    if (role === 'PATIENT') {
      const serverCompletion = profile?.completion;
      if (serverCompletion && Array.isArray(serverCompletion.missing)) {
        const missing = new Set(serverCompletion.missing.map((item: any) => item.key));
        sections = PATIENT_CORE.map((item) => ({
          ...item,
          points: 1,
          done: !missing.has(item.key),
          action: 'profile',
        }));
        return {
          score: Number(serverCompletion.percentage ?? 0),
          sections,
          total: PATIENT_CORE.length,
        };
      }

      // Transitional fallback while API/web processes are restarted during deployment.
      sections = fallbackPatientSections(profile);
    }

    if (role === 'DOCTOR') {
      sections = [
        { key: 'basic', label: 'Phone & gender', points: 10, done: !!(profile.phone && profile.gender), action: 'profile' },
        { key: 'spec', label: 'Specialization & city', points: 15, done: !!(profile.specialization && profile.city), action: 'profile' },
        { key: 'license', label: 'Medical license number', points: 15, done: !!profile.medicalLicenseNumber, action: 'profile' },
        { key: 'qual', label: 'Education / degree', points: 10, done: !!(profile.qualification?.length > 0), action: 'profile' },
        { key: 'experience', label: 'Years of experience', points: 5, done: !!profile.experienceYears, action: 'profile' },
        { key: 'fee', label: 'Consultation fee set', points: 10, done: !!profile.consultationFee, action: 'profile' },
        { key: 'availability', label: 'Availability schedule', points: 15, done: !!(profile.availabilitySchedule || profile.availability?.length > 0), action: 'availability' },
        { key: 'bio', label: 'Bio / about you', points: 10, done: !!profile.bio, action: 'profile' },
        { key: 'photo', label: 'Profile photo', points: 5, done: !!profile.profilePhotoUrl, action: 'profile' },
        { key: 'languages', label: 'Languages spoken', points: 5, done: !!(profile.languagesSpoken?.length > 0), action: 'profile' },
      ];
    }

    if (role === 'HOSPITAL') {
      sections = [
        { key: 'basic', label: 'Phone & hospital type', points: 15, done: !!(profile.phone && profile.hospitalType), action: 'profile' },
        { key: 'address', label: 'Full address & city', points: 15, done: !!(profile.address && profile.city), action: 'profile' },
        { key: 'reg', label: 'Registration number', points: 20, done: !!profile.registrationNumber, action: 'profile' },
        { key: 'beds', label: 'Bed count', points: 10, done: !!profile.bedCount, action: 'profile' },
        { key: 'specs', label: 'Specialties offered', points: 15, done: !!(profile.specialties?.length > 0), action: 'profile' },
        { key: 'photo', label: 'Hospital photo', points: 10, done: !!profile.profilePhotoUrl, action: 'profile' },
        { key: 'website', label: 'Website', points: 5, done: !!profile.website, action: 'profile' },
        { key: 'accred', label: 'Accreditations', points: 10, done: !!(profile.accreditations?.length > 0), action: 'profile' },
      ];
    }

    const total = sections.reduce((sum, section) => sum + section.points, 0);
    const earned = sections.filter((section) => section.done).reduce((sum, section) => sum + section.points, 0);
    return { score: total ? Math.round((earned / total) * 100) : 0, sections, total };
  }, [profile, role]);
}

function scoreColor(score: number): string {
  if (score >= 80) return C.green;
  if (score >= 50) return C.amber;
  return C.rose;
}

function scoreLabel(score: number): string {
  if (score >= 100) return 'Profile complete';
  if (score >= 75) return 'Almost there';
  if (score >= 50) return 'Getting there';
  return 'Getting started';
}

interface RingProps { score: number; size?: number; onClick?: () => void; }

export function ProfileCompletenessRing({ score, size = 44, onClick }: RingProps) {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const progress = circ - (score / 100) * circ;
  const color = scoreColor(score);
  if (score >= 100) return null;

  return (
    <div onClick={onClick} title={`Profile ${score}% complete — click to complete`}
      style={{ cursor: onClick ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(15,45,42,0.10)" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={progress} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <span style={{ fontSize: size < 36 ? 8 : 10, fontWeight: 800, color, position: 'relative', zIndex: 1 }}>{score}%</span>
    </div>
  );
}

interface BannerProps {
  score: number;
  role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL';
  sections: ProfileSection[];
  onGoToProfile: () => void;
}

export function ProfileCompletenessBanner({ score, role, sections, onGoToProfile }: BannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const completionThreshold = role === 'PATIENT' ? 100 : 80;
  if (dismissed || score >= completionThreshold) return null;

  const allIncomplete = sections.filter((section) => !section.done);
  const incomplete = allIncomplete.slice(0, 3);
  const color = scoreColor(score);
  const roleMessage: Record<string, string> = {
    PATIENT: 'Add the remaining core details so your personal and emergency information is complete.',
    DOCTOR: 'Complete profiles help patients make informed booking decisions.',
    HOSPITAL: 'Complete your hospital profile to help patients find the right care.',
  };
  const bg = score >= 50 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.05)';
  const border = score >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.18)';

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${color}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', position: 'relative' }}>
      <ProfileCompletenessRing score={score} size={52} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>Profile {score}% complete</span>
          <span style={{ fontSize: 11, color, fontWeight: 700, background: color + '15', padding: '1px 8px', borderRadius: 100 }}>{scoreLabel(score)}</span>
        </div>
        <p style={{ color: '#475569', fontSize: 12, margin: '0 0 8px' }}>{roleMessage[role]}</p>
        {incomplete.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {incomplete.map((section) => (
              <span key={section.key} style={{ fontSize: 10, fontWeight: 650, padding: '2px 8px', borderRadius: 100, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#475569' }}>+ {section.label}</span>
            ))}
            {allIncomplete.length > 3 && <span style={{ fontSize: 10, color: '#475569' }}>+{allIncomplete.length - 3} more</span>}
          </div>
        )}
      </div>
      <button onClick={onGoToProfile} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${C.tealDk},${C.teal})`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(20,184,166,0.25)', flexShrink: 0 }}>Complete Profile →</button>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss profile reminder" style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
    </div>
  );
}

interface CardProps { score: number; sections: ProfileSection[]; onNavigate?: (action: string) => void; }

export function ProfileCompletenessCard({ score, sections, onNavigate }: CardProps) {
  const color = scoreColor(score);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const prog = circ - (score / 100) * circ;
  const incompleteCount = sections.filter((section) => !section.done).length;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
          <svg width={96} height={96} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
            <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={prog} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color }}>{score}%</span>
            <span style={{ fontSize: 9, color: C.txt2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complete</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.txt, marginBottom: 4 }}>{scoreLabel(score)}</div>
          <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.5 }}>{incompleteCount ? `${incompleteCount} core profile detail${incompleteCount === 1 ? '' : 's'} remaining.` : 'Your core profile is complete.'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((section) => (
          <div key={section.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: section.done ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${section.done ? 'rgba(34,197,94,0.12)' : C.border}` }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: section.done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: section.done ? C.green : C.txt3 }}>{section.done ? '✓' : '○'}</div>
            <span style={{ flex: 1, fontSize: 13, color: section.done ? C.txt2 : C.txt }}>{section.label}</span>
            {!section.done && onNavigate && <button onClick={() => onNavigate(section.action)} style={{ fontSize: 10, color: C.teal, background: C.tealDk + '15', border: `1px solid ${C.teal}30`, padding: '3px 10px', borderRadius: 100, cursor: 'pointer', fontWeight: 700 }}>Add →</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
