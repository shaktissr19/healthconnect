'use client';
// src/components/onboarding/ProfileCompleteness.tsx
// HealthConnect — Profile Completeness
// Two exports:
//   1. useProfileScore(profile, role)  — hook to compute 0-100 score
//   2. ProfileCompletenessBanner       — dismissible dashboard banner
//   3. ProfileCompletenessRing         — sidebar mini ring widget

import { useMemo, useState } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  teal:    '#14B8A6',
  tealDk:  '#0D9488',
  green:   '#22C55E',
  amber:   '#F59E0B',
  rose:    '#F43F5E',
  txt:     '#E8F0FE',
  txt2:    '#7A8FAF',
  txt3:    '#4A5568',
  card:    '#111E33',
  border:  'rgba(20,184,166,0.15)',
};

// ─────────────────────────────────────────────────────────────────────────────
// SCORING LOGIC
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileSection {
  key:    string;
  label:  string;
  points: number;
  done:   boolean;
  action: string; // e.g. route or page name
}

export function useProfileScore(profile: any, role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL'): {
  score:    number;
  sections: ProfileSection[];
  total:    number;
} {
  return useMemo(() => {
    if (!profile) return { score: 0, sections: [], total: 0 };

    let sections: ProfileSection[] = [];

    if (role === 'PATIENT') {
      // name + email are always present from registration — ensures score starts > 0% for any signed-up user
      sections = [
        { key: 'name',      label: 'Full name',               points:  8, done: !!(profile.firstName?.trim() || profile.user?.firstName?.trim()), action: 'profile' },
        { key: 'email',     label: 'Email address',           points:  7, done: !!(profile.email?.trim()     || profile.user?.email?.trim()),     action: 'profile' },
        { key: 'basic',     label: 'Date of birth & gender',  points: 20, done: !!(profile.dateOfBirth && profile.gender),       action: 'profile' },
        { key: 'contact',   label: 'Phone & city',            points: 15, done: !!(profile.phone && profile.city),               action: 'profile' },
        { key: 'emergency', label: 'Emergency contact',       points: 15, done: !!(profile.emergencyContacts?.length > 0),       action: 'profile' },
        { key: 'blood',     label: 'Blood group',             points:  5, done: !!(profile.bloodGroup && profile.bloodGroup !== 'UNKNOWN'), action: 'profile' },
        { key: 'conditions',label: 'Medical conditions',      points: 10, done: !!(profile.conditions?.length > 0),              action: 'my-health' },
        { key: 'allergies', label: 'Allergies',               points: 10, done: !!(profile.allergies?.length > 0),               action: 'my-health' },
        { key: 'meds',      label: 'Active medications',      points: 10, done: !!(profile.medications?.length > 0),             action: 'my-health' },
        { key: 'vitals',    label: 'Vitals logged',           points: 10, done: !!(profile.vitals?.length > 0),                  action: 'vitals' },
        { key: 'photo',     label: 'Profile photo',           points:  5, done: !!(profile.profilePhotoUrl),                     action: 'profile' },
      ];
    }

    if (role === 'DOCTOR') {
      sections = [
        { key: 'basic',       label: 'Phone & gender',           points: 10, done: !!(profile.phone && profile.gender),              action: 'profile' },
        { key: 'spec',        label: 'Specialization & city',    points: 15, done: !!(profile.specialization && profile.city),        action: 'profile' },
        { key: 'license',     label: 'Medical license number',   points: 15, done: !!(profile.medicalLicenseNumber),                  action: 'profile' },
        { key: 'qual',        label: 'Education / degree',       points: 10, done: !!(profile.qualification?.length > 0),             action: 'profile' },
        { key: 'experience',  label: 'Years of experience',      points:  5, done: !!(profile.experienceYears),                       action: 'profile' },
        { key: 'fee',         label: 'Consultation fee set',     points: 10, done: !!(profile.consultationFee),                       action: 'profile' },
        { key: 'availability',label: 'Availability schedule',    points: 15, done: !!(profile.availabilitySchedule || profile.availability?.length > 0), action: 'availability' },
        { key: 'bio',         label: 'Bio / about you',          points: 10, done: !!(profile.bio),                                   action: 'profile' },
        { key: 'photo',       label: 'Profile photo',            points:  5, done: !!(profile.profilePhotoUrl),                       action: 'profile' },
        { key: 'languages',   label: 'Languages spoken',         points:  5, done: !!(profile.languagesSpoken?.length > 0),           action: 'profile' },
      ];
    }

    if (role === 'HOSPITAL') {
      sections = [
        { key: 'basic',    label: 'Phone & hospital type',    points: 15, done: !!(profile.phone && profile.hospitalType),      action: 'profile' },
        { key: 'address',  label: 'Full address & city',      points: 15, done: !!(profile.address && profile.city),            action: 'profile' },
        { key: 'reg',      label: 'Registration number',      points: 20, done: !!(profile.registrationNumber),                 action: 'profile' },
        { key: 'beds',     label: 'Bed count',                points: 10, done: !!(profile.bedCount),                          action: 'profile' },
        { key: 'specs',    label: 'Specialties offered',      points: 15, done: !!(profile.specialties?.length > 0),            action: 'profile' },
        { key: 'photo',    label: 'Hospital photo',           points: 10, done: !!(profile.profilePhotoUrl),                    action: 'profile' },
        { key: 'website',  label: 'Website',                  points:  5, done: !!(profile.website),                            action: 'profile' },
        { key: 'accred',   label: 'Accreditations',           points: 10, done: !!(profile.accreditations?.length > 0),         action: 'profile' },
      ];
    }

    const total = sections.reduce((s, x) => s + x.points, 0);
    const earned = sections.filter(x => x.done).reduce((s, x) => s + x.points, 0);
    const score = total > 0 ? Math.round((earned / total) * 100) : 0;

    return { score, sections, total };
  }, [profile, role]);
}

// ── Score colour ──────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return C.green;
  if (score >= 50) return C.amber;
  return C.rose;
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Great profile!';
  if (score >= 50) return 'Getting there';
  return 'Just getting started';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ProfileCompletenessRing — compact sidebar widget
// ─────────────────────────────────────────────────────────────────────────────
interface RingProps {
  score:    number;
  size?:    number;
  onClick?: () => void;
}

export function ProfileCompletenessRing({ score, size = 44, onClick }: RingProps) {
  const r        = (size / 2) - 4;
  const circ     = 2 * Math.PI * r;
  const progress = circ - (score / 100) * circ;
  const color    = scoreColor(score);

  if (score >= 100) return null; // hide when complete

  return (
    <div onClick={onClick}
      title={`Profile ${score}% complete — click to complete`}
      style={{ cursor: onClick ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <span style={{ fontSize: size < 36 ? 8 : 10, fontWeight: 800, color, position: 'relative', zIndex: 1 }}>
        {score}%
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ProfileCompletenessBanner — dashboard home banner
// ─────────────────────────────────────────────────────────────────────────────
interface BannerProps {
  score:       number;
  role:        'PATIENT' | 'DOCTOR' | 'HOSPITAL';
  sections:    ProfileSection[];
  onGoToProfile: () => void;
}

export function ProfileCompletenessBanner({ score, role, sections, onGoToProfile }: BannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || score >= 80) return null;

  const incomplete = sections.filter(s => !s.done).slice(0, 3);
  const color      = scoreColor(score);

  const ROLE_MSG: Record<string, string> = {
    PATIENT:  'Complete your profile so doctors can provide better care.',
    DOCTOR:   'Complete profiles get 3× more patient bookings on HealthConnect.',
    HOSPITAL: 'Complete your hospital profile to attract more patients.',
  };

  // Dynamic colours based on score — uses light theme to match warm-grey dashboard
  const bgMap    = score >= 50 ? 'rgba(245,158,11,0.06)'  : 'rgba(239,68,68,0.05)';
  const bdMap    = score >= 50 ? 'rgba(245,158,11,0.2)'   : 'rgba(239,68,68,0.18)';
  const bdLeft   = score >= 50 ? 'rgba(245,158,11,0.55)'  : color;
  const txtMain  = '#1E293B';
  const txtSub   = '#475569';
  const pillBg   = 'rgba(0,0,0,0.04)';
  const pillBd   = 'rgba(0,0,0,0.08)';

  return (
    <div style={{
      background:   bgMap,
      border:       `1px solid ${bdMap}`,
      borderLeft:   `3px solid ${bdLeft}`,
      borderRadius: 14,
      padding:      '16px 20px',
      marginBottom: 20,
      display:      'flex',
      alignItems:   'center',
      gap:          16,
      flexWrap:     'wrap',
      position:     'relative',
    }}>
      {/* Ring */}
      <ProfileCompletenessRing score={score} size={52} />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: txtMain }}>
            Profile {score}% complete
          </span>
          <span style={{ fontSize: 11, color, fontWeight: 600, background: color + '15', padding: '1px 8px', borderRadius: 100 }}>
            {scoreLabel(score)}
          </span>
        </div>
        <p style={{ color: txtSub, fontSize: 12, margin: '0 0 8px' }}>
          {ROLE_MSG[role]}
        </p>
        {/* Quick list of what's missing */}
        {incomplete.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {incomplete.map(s => (
              <span key={s.key} style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                background: pillBg, border: `1px solid ${pillBd}`,
                color: txtSub,
              }}>
                + {s.label}
              </span>
            ))}
            {sections.filter(s => !s.done).length > 3 && (
              <span style={{ fontSize: 10, color: txtSub }}>
                +{sections.filter(s => !s.done).length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <button onClick={onGoToProfile}
        style={{
          padding: '9px 18px', borderRadius: 9, border: 'none',
          background: `linear-gradient(135deg,${C.tealDk},${C.teal})`,
          color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
          boxShadow: '0 4px 12px rgba(20,184,166,0.25)',
          flexShrink: 0,
        }}>
        Complete Profile →
      </button>

      {/* Dismiss */}
      <button onClick={() => setDismissed(true)}
        style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', border: 'none', color: txtSub,
          cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2,
        }}>×</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ProfileCompletenessCard — full breakdown for profile page
// ─────────────────────────────────────────────────────────────────────────────
interface CardProps {
  score:       number;
  sections:    ProfileSection[];
  onNavigate?: (action: string) => void;
}

export function ProfileCompletenessCard({ score, sections, onNavigate }: CardProps) {
  const color = scoreColor(score);
  const r     = 42;
  const circ  = 2 * Math.PI * r;
  const prog  = circ - (score / 100) * circ;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        {/* Large ring */}
        <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
          <svg width={96} height={96} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
            <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={circ} strokeDashoffset={prog} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color }}>{score}%</span>
            <span style={{ fontSize: 9, color: C.txt2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complete</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.txt, marginBottom: 4 }}>
            {scoreLabel(score)}
          </div>
          <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.5 }}>
            {score < 80
              ? `Add ${sections.filter(s => !s.done).length} more sections to reach a complete profile.`
              : 'Your profile is looking great! Patients will find everything they need.'}
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 10, height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', width: 200 }}>
            <div style={{ height: '100%', borderRadius: 100, background: `linear-gradient(90deg,${C.tealDk},${color})`, width: `${score}%`, transition: 'width 0.8s ease' }} />
          </div>
        </div>
      </div>

      {/* Section list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map(s => (
          <div key={s.key} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 10,
            background: s.done ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${s.done ? 'rgba(34,197,94,0.12)' : C.border}`,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: s.done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${s.done ? 'rgba(34,197,94,0.3)' : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: s.done ? C.green : C.txt3,
            }}>
              {s.done ? '✓' : '○'}
            </div>
            <span style={{ flex: 1, fontSize: 13, color: s.done ? C.txt2 : C.txt, fontWeight: s.done ? 400 : 500 }}>
              {s.label}
            </span>
            <span style={{ fontSize: 11, color: s.done ? C.green : color, fontWeight: 700 }}>
              {s.points} pts
            </span>
            {!s.done && onNavigate && (
              <button onClick={() => onNavigate(s.action)}
                style={{ fontSize: 10, color: C.teal, background: C.tealDk + '15', border: `1px solid ${C.teal}30`, padding: '3px 10px', borderRadius: 100, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' as const, fontFamily: 'inherit' }}>
                Add →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
