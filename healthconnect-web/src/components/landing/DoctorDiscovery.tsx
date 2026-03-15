'use client';
import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

const SPECIALTIES = [
  { l: 'All Specialties',      v: 'all' },
  { l: '❤️ Cardiologist',      v: 'Cardiologist' },
  { l: '🧴 Dermatologist',     v: 'Dermatologist' },
  { l: '🧠 Neurologist',       v: 'Neurologist' },
  { l: '🦴 Orthopedic',        v: 'Orthopedic' },
  { l: '👶 Pediatrician',      v: 'Pediatrician' },
  { l: '🧘 Psychiatrist',      v: 'Psychiatrist' },
  { l: '🩺 General Physician', v: 'General Physician' },
];

const GRAD_COLORS = [
  'linear-gradient(135deg,#0D9488,#8B5CF6)',
  'linear-gradient(135deg,#0D9488,#6D28D9)',
  'linear-gradient(135deg,#0D9488,#0369A1)',
  'linear-gradient(135deg,#14B8A6,#8B5CF6)',
  'linear-gradient(135deg,#92400E,#F59E0B)',
  'linear-gradient(135deg,#0D9488,#14B8A6)',
];
const EMOJI = ['👨‍⚕️', '👩‍⚕️', '👨‍⚕️', '👩‍⚕️', '👨‍⚕️', '👩‍⚕️'];

// Normalize doctor from API (firstName+lastName) or fallback (name)
function normalizeDoctor(d: any, idx: number) {
  return {
    id:           d.id ?? String(idx),
    name:         (d.name ?? `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim()) || 'Dr. Unknown',
    specialization: d.specialization ?? 'General Physician',
    hospital:     d.clinicName ?? d.hospital ?? '',
    city:         d.city ?? '',
    state:        d.state ?? '',
    experience:   d.experienceYears ?? d.experience ?? null,
    languages:    d.languagesSpoken ?? d.languages ?? [],
    rating:       Number(d.averageRating ?? d.rating ?? 4.5),
    reviews:      d.totalReviews ?? d.reviews ?? 0,
    isAvailable:  d.isAvailableOnline ?? d.isAvailable ?? false,
    fee:          d.consultationFee ?? null,
  };
}

const FALLBACK = [
  { id: '1', name: 'Dr. Arvind Sharma',  specialization: 'Cardiologist',        hospital: 'AIIMS Delhi',          city: 'Delhi',     experience: 18, languages: ['Hindi', 'English'],             rating: 4.9, reviews: 203, isAvailable: true,  fee: 800  },
  { id: '2', name: 'Dr. Priya Nair',     specialization: 'Dermatologist',       hospital: 'Fortis Mumbai',        city: 'Mumbai',    experience: 12, languages: ['Malayalam', 'Hindi', 'English'], rating: 4.8, reviews: 178, isAvailable: true,  fee: 600  },
  { id: '3', name: 'Dr. Rajesh Mehta',   specialization: 'Neurologist',         hospital: 'Narayana BLR',         city: 'Bengaluru', experience: 22, languages: ['Kannada', 'Hindi'],             rating: 4.7, reviews: 312, isAvailable: false, fee: 1200 },
  { id: '4', name: 'Dr. Sunita Agarwal', specialization: 'Pediatrician',        hospital: 'Max Healthcare Delhi', city: 'Delhi',     experience: 9,  languages: ['Hindi', 'English'],             rating: 4.9, reviews: 96,  isAvailable: true,  fee: 500  },
  { id: '5', name: 'Dr. Vikram Patel',   specialization: 'Orthopedic Surgeon',  hospital: 'Apollo Ahmedabad',     city: 'Ahmedabad', experience: 15, languages: ['Gujarati', 'Hindi'],            rating: 4.8, reviews: 241, isAvailable: false, fee: 900  },
  { id: '6', name: 'Dr. Ananya Roy',     specialization: 'Psychiatrist',        hospital: 'NIMHANS BLR',          city: 'Bengaluru', experience: 11, languages: ['Bengali', 'Hindi', 'English'],  rating: 5.0, reviews: 87,  isAvailable: true,  fee: 700  },
];

export default function DoctorDiscovery() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [hov,     setHov]     = useState<string | null>(null);
  const { openAuthModal } = useUIStore() as any;
  const router = useRouter();

  const fetchDoctors = useCallback(async (specialty: string, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '6' });
      if (specialty !== 'all') params.set('specialty', specialty);
      if (q.trim())            params.set('search', q.trim());
      const res  = await fetch(`${API}/public/doctors?${params}`);
      const json = await res.json();
      const raw: any[] = json?.data ?? [];
      setDoctors(raw.length > 0 ? raw.map((d, i) => normalizeDoctor(d, i)) : FALLBACK);
    } catch {
      setDoctors(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(filter, search); }, [filter, fetchDoctors]);
  useEffect(() => {
    const t = setTimeout(() => fetchDoctors(filter, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <section id="doctors" style={{ background: '#1C2D42', padding: '100px 5%' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#14B8A6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '24px', height: '1px', background: '#14B8A6', display: 'inline-block' }} />
          Doctor Discovery
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(28px,4vw,48px)', color: '#E2E8F0', marginBottom: '16px', lineHeight: 1.15 }}>
          Find Your Doctor,<br />Book Instantly
        </h2>
        <p style={{ fontSize: '16px', color: '#94A3B8', maxWidth: '520px', lineHeight: 1.7 }}>
          Search by specialty, city, or language. Real-time availability. Verified credentials.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name, specialty, hospital or city..."
          style={{ flex: 1, minWidth: '240px', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#E2E8F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => (e.target.style.borderColor = '#14B8A6')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      {/* Specialty chips */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
        {SPECIALTIES.map(c => (
          <button key={c.v} onClick={() => setFilter(c.v)} style={{
            padding: '8px 18px', borderRadius: '100px',
            border: filter === c.v ? '1px solid #14B8A6' : '1px solid rgba(255,255,255,0.1)',
            background: filter === c.v ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.04)',
            color: filter === c.v ? '#14B8A6' : '#94A3B8',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-heading)',
          }}>{c.l}</button>
        ))}
      </div>

      {/* Doctor grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px', height: '220px', animation: 'hcDPulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px' }}>
          {doctors.map((d, idx) => (
            <div
              key={d.id}
              onMouseEnter={() => setHov(d.id)}
              onMouseLeave={() => setHov(null)}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: hov === d.id ? '1px solid rgba(13,148,136,0.35)' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: '18px', padding: '24px', transition: 'all 0.3s', cursor: 'pointer',
                position: 'relative',
                transform: hov === d.id ? 'translateY(-3px)' : '',
                boxShadow: hov === d.id ? '0 10px 40px rgba(0,0,0,0.3)' : '',
              }}
            >
              {/* Available badge */}
              {d.isAvailable && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '100px', padding: '2px 8px', fontSize: '10px', color: '#22C55E', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'hcDAvail 1.5s infinite' }} />
                  Available Now
                </div>
              )}

              {/* Avatar */}
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: GRAD_COLORS[idx % GRAD_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '14px', position: 'relative' }}>
                {EMOJI[idx % EMOJI.length]}
                {d.isAvailable && <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#22C55E', border: '2px solid #1C2D42', animation: 'hcDAvail 1.5s infinite' }} />}
              </div>

              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: '#E2E8F0', marginBottom: '3px' }}>{d.name}</div>
              <div style={{ fontSize: '13px', color: '#14B8A6', fontWeight: 600, marginBottom: '4px' }}>{d.specialization}</div>

              {/* Info row */}
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '10px', lineHeight: 1.5 }}>
                {[d.hospital, d.city, d.experience ? `${d.experience} yrs exp` : null].filter(Boolean).join(' · ')}
              </div>

              {/* Languages */}
              {d.languages.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {d.languages.slice(0, 3).map((l: string) => (
                    <span key={l} style={{ padding: '2px 8px', borderRadius: '100px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)', fontSize: '10px', color: '#14B8A6', fontFamily: 'var(--font-mono)' }}>{l}</span>
                  ))}
                </div>
              )}

              {/* Rating + fee row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: '#F59E0B', fontSize: '13px' }}>
                  {'★'.repeat(Math.min(5, Math.floor(d.rating)))}{'☆'.repeat(Math.max(0, 5 - Math.floor(d.rating)))}
                  <span style={{ color: '#94A3B8', fontSize: '11px' }}> {d.rating.toFixed(1)} ({d.reviews})</span>
                </div>
                {d.fee && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#22C55E' }}>₹{d.fee}</span>
                )}
              </div>

              {/* Hover CTA */}
              {hov === d.id && (
                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>
                  <button onClick={() => openAuthModal('register')} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
                    Book Appointment →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && doctors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <p>No doctors found. Try a different specialty or search term.</p>
        </div>
      )}


      {/* ── View All Doctors CTA ── */}
      {!loading && doctors.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 36, marginBottom: 4 }}>
          <button
            onClick={() => router.push('/doctors')}
            style={{ padding: '13px 44px', borderRadius: 11, border: '1.5px solid rgba(20,184,166,0.35)', background: 'rgba(20,184,166,0.08)', color: '#14B8A6', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', transition: 'all 0.25s', display: 'inline-flex', alignItems: 'center', gap: 10 }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(20,184,166,0.18)'; e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(20,184,166,0.08)'; e.currentTarget.style.transform=''; }}
          >
            🔍 Browse Full Doctor Dictionary →
          </button>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
            Search by name · specialty · city · area · pincode · language · fee · experience
          </p>
        </div>
      )}

      {/* CTA to register as doctor */}
      <div style={{ marginTop: '48px', padding: '28px 32px', borderRadius: '18px', border: '1.5px dashed rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: '#E2E8F0', marginBottom: '4px' }}>🩺 Are you a Doctor?</div>
          <div style={{ fontSize: '13px', color: '#94A3B8' }}>Join 500+ verified doctors on HealthConnect. Get your HCDxxxxx ID and start seeing patients today.</div>
        </div>
        <button onClick={() => openAuthModal('register')} style={{ padding: '11px 28px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}>
          Register as Doctor →
        </button>
      </div>

      <style>{`
        @keyframes hcDAvail{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}50%{box-shadow:0 0 0 5px rgba(34,197,94,0)}}
        @keyframes hcDPulse{0%,100%{opacity:0.5}50%{opacity:1}}
      `}</style>
    </section>
  );
}
