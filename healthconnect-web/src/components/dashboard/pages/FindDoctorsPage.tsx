'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const C = {
  bg: '#0B1E1C', card: '#FFFFFF', border: '#E2EEF0',
  teal: '#0D9488', tealLight: '#14B8A6', tealBg: '#F0FDF9',
  tealDark: '#0F766E',
  text: '#0F2D2A', text2: '#4B6E6A', text3: '#64748B',
  red: '#EF4444', amber: '#F59E0B', green: '#22C55E',
};
const card: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

type Doctor = {
  id: string; firstName: string; lastName: string;
  specialization?: string; qualification?: string;
  experienceYears?: number; rating?: number; reviewCount?: number;
  consultationFee?: number; languages?: string[];
  isAvailableToday?: boolean; isVerified?: boolean;
  about?: string; hospitalName?: string; hospital?: string;
  city?: string; state?: string;
};

const SPECIALIZATIONS = [
  'All','Cardiology','Dermatology','General Medicine','Neurology',
  'Orthopedics','Pediatrics','Psychiatry','Gynecology','Ophthalmology',
  'ENT','Endocrinology','Gastroenterology','Nephrology','Oncology',
  'Pulmonology','Rheumatology','Urology',
];

const SPEC_ICONS: Record<string,string> = {
  Cardiology:'❤️', Dermatology:'🧴', 'General Medicine':'🩺',
  Neurology:'🧠', Orthopedics:'🦴', Pediatrics:'👶',
  Psychiatry:'🧘', Gynecology:'🌸', Ophthalmology:'👁️',
  ENT:'👂', Endocrinology:'⚗️', Gastroenterology:'🫃',
  Nephrology:'🫘', Oncology:'🎗️', Pulmonology:'🫁',
  Rheumatology:'🦵', Urology:'💧',
};

export default function FindDoctorsPage() {
  const [doctors,  setDoctors]  = useState<Doctor[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [spec,     setSpec]     = useState('All');
  const [showBook, setShowBook] = useState<Doctor | null>(null);
  const [toast,    setToast]    = useState('');

  const showToast = (msg: string, err = false) => {
    setToast(msg);
    setTimeout(() => setToast(''), err ? 4000 : 3000);
  };

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    let docs: Doctor[] = [];

    // CONFIRMED: public.routes.ts mounted at router.use('/public', publicRoutes)
    // So GET /doctors in public.routes.ts = GET /public/doctors on the API
    // Trying with and without api-level prefix in case baseURL varies
    const endpoints = [
      '/public/doctors',
      '/api/public/doctors',
    ];

    const tried: string[] = [];
    for (const endpoint of endpoints) {
      try {
        const r: any = await api.get(endpoint);
        const raw = r?.data?.data ?? r?.data?.doctors ?? r?.data ?? [];
        const arr = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? Object.values(raw) : []);
        if (arr.length > 0) {
          docs = arr as Doctor[];
          break;
        }
        tried.push(`${endpoint}→empty`);
      } catch (e: any) {
        const status = e?.response?.status ?? '?';
        tried.push(`${endpoint}→${status}`);
      }
    }

    if (docs.length === 0) {
      setError(`Could not load doctors. Tried: ${tried.join(', ')}`);
    }
    setDoctors(docs);
    setLoading(false);
  }, []);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  const filtered = doctors.filter(d => {
    const name = `${d.firstName ?? ''} ${d.lastName ?? ''}`.toLowerCase();
    const matchSearch = !search.trim() ||
      name.includes(search.toLowerCase()) ||
      (d.specialization ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.hospitalName ?? d.hospital ?? '').toLowerCase().includes(search.toLowerCase());
    const matchSpec = spec === 'All' || d.specialization === spec;
    return matchSearch && matchSpec;
  });

  // Get unique specializations from actual data
  const liveSpecs = ['All', ...Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean) as string[]))];

  const initials = (d: Doctor) =>
    `${(d.firstName ?? '')[0] ?? ''}${(d.lastName ?? '')[0] ?? ''}`.toUpperCase() || 'DR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: '#0F2D2A', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', border: '1px solid rgba(20,184,166,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            🔍 Find Doctors
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
            {loading ? 'Loading...' : `${doctors.length} verified specialists available`}
          </p>
        </div>
        <button onClick={loadDoctors} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          ↺ Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && !loading && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 18px', color: '#FCA5A5', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          ⚠️ {error}
          <button onClick={loadDoctors} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#FCA5A5', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.text3, fontSize: 16 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialization, hospital..."
            style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', background: C.card, boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 16 }}>×</button>
          )}
        </div>
      </div>

      {/* Specialization pills — use live data */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {liveSpecs.map(s => (
          <button key={s} onClick={() => setSpec(spec === s ? 'All' : s)} style={{
            padding: '7px 16px', borderRadius: 100,
            border: `1.5px solid ${spec === s ? C.teal : C.border}`,
            background: spec === s ? C.tealBg : C.card,
            color: spec === s ? C.teal : C.text3,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {s !== 'All' && SPEC_ICONS[s] && <span>{SPEC_ICONS[s]}</span>}
            {s}
            {s !== 'All' && (
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                ({doctors.filter(d => d.specialization === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
          Showing {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
          {spec !== 'All' ? ` in ${spec}` : ''}
          {search ? ` matching "${search}"` : ''}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ ...card, padding: 24 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: 14, background: '#E2EEF0', animation: 'hcPulse 1.5s ease infinite', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 16, borderRadius: 6, background: '#E2EEF0', width: '70%', animation: 'hcPulse 1.5s ease infinite' }} />
                  <div style={{ height: 12, borderRadius: 6, background: '#E2EEF0', width: '50%', animation: 'hcPulse 1.5s ease infinite' }} />
                  <div style={{ height: 12, borderRadius: 6, background: '#E2EEF0', width: '40%', animation: 'hcPulse 1.5s ease infinite' }} />
                </div>
              </div>
              <div style={{ height: 36, borderRadius: 9, background: '#E2EEF0', animation: 'hcPulse 1.5s ease infinite' }} />
            </div>
          ))}
          <style>{`@keyframes hcPulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && !error && (
        <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍⚕️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>No doctors found</div>
          <div style={{ fontSize: 14, color: C.text3, marginBottom: 20 }}>
            {search || spec !== 'All'
              ? 'Try adjusting your search or clearing filters.'
              : 'No verified doctors are registered yet.'}
          </div>
          {(search || spec !== 'All') && (
            <button onClick={() => { setSearch(''); setSpec('All'); }} style={{ padding: '10px 24px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.teal, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Doctor cards grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
          {filtered.map(doc => (
            <DoctorCard key={doc.id} doc={doc} initials={initials(doc)} onBook={() => setShowBook(doc)} />
          ))}
        </div>
      )}

      {/* Book Modal */}
      {showBook && (
        <BookModal
          doctor={showBook}
          onClose={() => setShowBook(null)}
          onSaved={(msg: string) => { setShowBook(null); showToast(msg); }}
        />
      )}
    </div>
  );
}

// ── Doctor Card ────────────────────────────────────────────────────────────
function DoctorCard({ doc, initials, onBook }: { doc: Doctor; initials: string; onBook: () => void }) {
  const C2 = { teal: '#0D9488', tealLight: '#14B8A6', tealBg: '#F0FDF9', text: '#0F2D2A', text2: '#4B6E6A', text3: '#64748B', border: '#E2EEF0', green: '#22C55E', amber: '#F59E0B' };
  const hospital = doc.hospitalName ?? doc.hospital ?? '';
  const location = [doc.city, doc.state].filter(Boolean).join(', ');

  return (
    <div style={{ background: '#fff', border: `1px solid ${C2.border}`, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 32px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
    >
      {/* Availability banner */}
      {doc.isAvailableToday && (
        <div style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.2)', padding: '6px 18px', fontSize: 11, fontWeight: 700, color: C2.green, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C2.green, display: 'inline-block', animation: 'hcPulse 2s ease infinite' }} />
          Available Today
        </div>
      )}

      <div style={{ padding: '20px 22px' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 58, height: 58, borderRadius: 14, background: `linear-gradient(135deg,${C2.teal},${C2.tealLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, flexShrink: 0, boxShadow: `0 4px 14px rgba(13,148,136,0.25)` }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C2.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Dr. {doc.firstName} {doc.lastName}
            </div>
            <div style={{ fontSize: 13, color: C2.teal, fontWeight: 700, marginBottom: 3 }}>
              {SPEC_ICONS[doc.specialization ?? ''] ?? '🩺'} {doc.specialization ?? 'General Practitioner'}
            </div>
            {doc.qualification && (
              <div style={{ fontSize: 12, color: C2.text3 }}>{doc.qualification}</div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, padding: '12px 14px', background: '#F8FFFE', borderRadius: 10, border: `1px solid ${C2.border}` }}>
          {doc.experienceYears !== undefined && (
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C2.teal }}>{doc.experienceYears}+</div>
              <div style={{ fontSize: 11, color: C2.text3, fontWeight: 500 }}>Yrs Exp</div>
            </div>
          )}
          {doc.rating !== undefined && (
            <div style={{ textAlign: 'center', flex: 1, borderLeft: `1px solid ${C2.border}`, borderRight: doc.reviewCount !== undefined ? `1px solid ${C2.border}` : 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C2.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                ★ {doc.rating.toFixed(1)}
              </div>
              <div style={{ fontSize: 11, color: C2.text3, fontWeight: 500 }}>Rating</div>
            </div>
          )}
          {doc.reviewCount !== undefined && (
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C2.text2 }}>{doc.reviewCount}</div>
              <div style={{ fontSize: 11, color: C2.text3, fontWeight: 500 }}>Reviews</div>
            </div>
          )}
        </div>

        {/* About */}
        {doc.about && (
          <p style={{ fontSize: 13, color: C2.text2, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box' as any, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
            {doc.about}
          </p>
        )}

        {/* Hospital & Location */}
        {(hospital || location) && (
          <div style={{ marginBottom: 12 }}>
            {hospital && <div style={{ fontSize: 12, color: C2.text3, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>🏥 {hospital}</div>}
            {location && <div style={{ fontSize: 12, color: C2.text3, display: 'flex', alignItems: 'center', gap: 5 }}>📍 {location}</div>}
          </div>
        )}

        {/* Languages */}
        {doc.languages && doc.languages.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
            {doc.languages.slice(0, 4).map(lang => (
              <span key={lang} style={{ padding: '2px 9px', borderRadius: 100, background: '#F1F5F9', color: C2.text3, fontSize: 11, fontWeight: 600 }}>{lang}</span>
            ))}
          </div>
        )}

        {/* Fee + Book */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C2.border}` }}>
          <div>
            {doc.consultationFee !== undefined ? (
              <>
                <span style={{ fontSize: 20, fontWeight: 800, color: C2.text }}>₹{doc.consultationFee}</span>
                <span style={{ fontSize: 12, color: C2.text3 }}> / visit</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: C2.text3 }}>Fee on request</span>
            )}
          </div>
          <button onClick={onBook} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C2.teal},${C2.tealLight})`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.3)', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Book Appointment Modal ─────────────────────────────────────────────────
function BookModal({ doctor, onClose, onSaved }: { doctor: Doctor; onClose: () => void; onSaved: (msg: string) => void }) {
  const C2 = { teal: '#0D9488', tealLight: '#14B8A6', text: '#0F2D2A', text3: '#64748B', border: '#E2EEF0', red: '#EF4444' };
  const [form,   setForm]   = useState({ scheduledAt: '', type: 'IN_PERSON', reasonForVisit: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Minimum datetime = 1 hour from now
  const minDt = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', padding: '11px 14px', borderRadius: 10,
    border: `1.5px solid ${C2.border}`, fontSize: 14, color: C2.text, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', background: '#F8FFFE',
  };

  const save = async () => {
    if (!form.scheduledAt) { setErr('Please select a date and time'); return; }
    const dt = new Date(form.scheduledAt);
    if (dt < new Date()) { setErr('Please select a future date and time'); return; }
    setSaving(true); setErr('');
    try {
      await api.post('/patient/appointments', {
        doctorId: doctor.id,
        scheduledAt: dt.toISOString(),
        type: form.type,
        reasonForVisit: form.reasonForVisit || undefined,
        notes: form.notes || undefined,
      });
      onSaved(`✓ Appointment booked with Dr. ${doctor.lastName}`);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? 'Failed to book. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
        {/* Doctor summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${C2.border}` }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg,${C2.teal},${C2.tealLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>
            {`${(doctor.firstName ?? '')[0] ?? ''}${(doctor.lastName ?? '')[0] ?? ''}`.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C2.text }}>Dr. {doctor.firstName} {doctor.lastName}</div>
            <div style={{ fontSize: 13, color: C2.teal, fontWeight: 600 }}>{doctor.specialization}</div>
            {doctor.consultationFee !== undefined && (
              <div style={{ fontSize: 12, color: C2.text3, marginTop: 2 }}>Consultation fee: ₹{doctor.consultationFee}</div>
            )}
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C2.text3, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C2.text3, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>DATE & TIME *</label>
            <input type="datetime-local" min={minDt} value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C2.text3, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>VISIT TYPE</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="IN_PERSON">🏥 In-Person Visit</option>
              <option value="TELECONSULT">📹 Video Consultation</option>
              <option value="HOME_VISIT">🏠 Home Visit</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C2.text3, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>REASON FOR VISIT</label>
          <textarea value={form.reasonForVisit} onChange={e => set('reasonForVisit', e.target.value)} placeholder="Describe your symptoms or reason for the appointment..." rows={3} style={{ ...inp, resize: 'vertical' }} />
        </div>

        {form.type === 'IN_PERSON' && (
          <div style={{ marginBottom: 14, background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#0F766E' }}>
            ℹ️ Please arrive 10 minutes early and bring any previous reports.
          </div>
        )}
        {form.type === 'TELECONSULT' && (
          <div style={{ marginBottom: 14, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1D4ED8' }}>
            📹 A video link will be sent to your registered email before the appointment.
          </div>
        )}

        {err && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: C2.red, fontSize: 13, marginBottom: 14 }}>
            ⚠️ {err}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '12px 0', borderRadius: 10, border: `1px solid ${C2.border}`, background: 'transparent', color: C2.text3, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '12px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C2.teal},${C2.tealLight})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}>
            {saving ? 'Booking...' : 'Confirm Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
