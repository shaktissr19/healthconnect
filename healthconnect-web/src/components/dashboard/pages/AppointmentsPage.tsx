'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const C = {
  bg: '#C8E0F4', card: '#FFFFFF', border: '#E2EEF0',
  teal: '#0D9488', tealLight: '#14B8A6', tealBg: '#F0FDF9',
  text: '#0F2D2A', text2: '#4B6E6A', text3: '#64748B',
  red: '#EF4444', amber: '#F59E0B', green: '#22C55E', purple: '#8B5CF6', blue: '#3B82F6',
};
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: '0 2px 8px rgba(27,59,111,0.08)' };

type Appointment = {
  id: string; doctorName: string; doctorInitials?: string; specialization: string;
  scheduledAt: string; type: 'IN_PERSON' | 'TELECONSULT' | 'HOME_VISIT';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string; meetingLink?: string; reasonForVisit?: string;
};

const TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  IN_PERSON:   { label: 'In Person',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  TELECONSULT: { label: 'Video Call', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  HOME_VISIT:  { label: 'Home Visit', color: '#0D9488', bg: 'rgba(13,148,136,0.1)' },
};
const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  CONFIRMED:  { color: '#16A34A', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.25)' },
  PENDING:    { color: '#D97706', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.25)' },
  COMPLETED:  { color: C.text3,   bg: 'rgba(100,116,139,0.1)', border: C.border },
  CANCELLED:  { color: C.red,     bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
  NO_SHOW:    { color: C.red,     bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
};

export default function AppointmentsPage() {
  const [appts,   setAppts]   = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'Upcoming' | 'Awaiting' | 'Past' | 'All'>('Upcoming');
  const [showBook, setShowBook] = useState(false);
  const [preselect, setPreselect] = useState<{id:string; name:string; spec:string} | null>(null);
  const [toast, setToast]      = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Auto-open booking modal if URL has ?book=doctorId params (from /doctors page)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('book');
    const bookName = params.get('doctorName');
    const specialty = params.get('specialty');
    if (bookId) {
      setPreselect({ id: bookId, name: bookName ?? '', spec: specialty ?? '' });
      setShowBook(true);
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await api.get('/patient/appointments');
      const raw = r?.data?.data ?? r?.data?.appointments ?? r?.data ?? [];
      setAppts(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error('Appointments load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // FIX 3: Listen for appointment booked events from anywhere in the app
  useEffect(() => {
    const handleBooked = () => loadData();
    window.addEventListener('hcAppointmentBooked', handleBooked);
    return () => window.removeEventListener('hcAppointmentBooked', handleBooked);
  }, [loadData]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      try {
        await api.put(`/appointments/${id}/cancel`, { status: 'CANCELLED' });
      } catch {
        try {
          await api.put(`/patient/appointments/${id}`, { status: 'CANCELLED' });
        } catch {
          await api.delete(`/patient/appointments/${id}`);
        }
      }
      showToast('Appointment cancelled');
      loadData();
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Failed to cancel');
    }
  };

  const now = new Date();
  const upcoming  = appts.filter(a => ['CONFIRMED','PENDING'].includes(a.status) && new Date(a.scheduledAt) >= now);
  const awaiting  = appts.filter(a => a.status === 'PENDING');
  const confirmed = appts.filter(a => a.status === 'CONFIRMED');
  const completed = appts.filter(a => a.status === 'COMPLETED');
  const past      = appts.filter(a => ['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status));
  const all       = appts;

  const displayed =
    filter === 'Upcoming' ? upcoming :
    filter === 'Awaiting' ? awaiting :
    filter === 'Past'     ? past     : all;

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ height:36, width:240, borderRadius:10, background:'rgba(255,255,255,0.08)', animation:'hcPulse 1.5s ease infinite' }} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height:100, borderRadius:16, background:'rgba(255,255,255,0.06)', animation:'hcPulse 1.5s ease infinite' }} />)}
      </div>
      <style>{`@keyframes hcPulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      {toast && (
        <div style={{ position:'fixed', bottom:28, right:28, zIndex:9999, background:'#0F2D2A', color:'#fff', padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', border:'1px solid rgba(20,184,166,0.3)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'#0A1628', margin:'0 0 6px', display:'flex', alignItems:'center', gap:10 }}>📅 My Appointments</h1>
          <p style={{ color:'#5A7A9B', fontSize:14, margin:0 }}>{upcoming.length} upcoming</p>
        </div>
        <button onClick={() => setShowBook(true)} style={{ padding:'10px 20px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(13,148,136,0.35)' }}>
          + Book Appointment
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {[
          { icon:'📅', label:'Upcoming',  value: upcoming.length,  color: C.teal },
          { icon:'⏳', label:'Pending',   value: awaiting.length,  color: C.amber },
          { icon:'✅', label:'Confirmed', value: confirmed.length, color: '#16A34A' },
          { icon:'✓',  label:'Completed', value: completed.length, color: C.text3 },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding:'20px 22px', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:22 }}>{k.icon}</div>
            <div style={{ fontSize:30, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:13, fontWeight:600, color:C.text2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          {(['Upcoming','Awaiting','Past','All'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'8px 16px', borderRadius:100,
              border:`1.5px solid ${filter===f ? C.teal : C.border}`,
              background: filter===f ? C.tealBg : C.card,
              color: filter===f ? C.teal : C.text3,
              fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
              display:'flex', alignItems:'center', gap:6,
            }}>
              {f}
              {f === 'Awaiting' && awaiting.length > 0 && (
                <span style={{ background:C.amber, color:'#fff', borderRadius:100, fontSize:10, fontWeight:700, padding:'1px 6px', minWidth:18, textAlign:'center' }}>{awaiting.length}</span>
              )}
            </button>
          ))}
        </div>
        <span style={{ fontSize:13, color:C.text3 }}>{displayed.length} appointment{displayed.length!==1?'s':''}</span>
      </div>

      {/* Appointment list */}
      {displayed.length === 0 ? (
        <div style={{ ...card, padding:'48px 24px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📅</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>No appointments found</div>
          <div style={{ fontSize:14, color:C.text3, marginBottom:20 }}>
            {filter==='Upcoming' ? "You don't have any upcoming appointments." : `No ${filter.toLowerCase()} appointments.`}
          </div>
          <button onClick={() => setShowBook(true)} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            + Book Appointment
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {displayed.map(appt => {
            const dt      = new Date(appt.scheduledAt);
            const st      = STATUS_STYLE[appt.status] ?? STATUS_STYLE.PENDING;
            const tt      = TYPE_LABEL[appt.type] ?? TYPE_LABEL.IN_PERSON;
            const initials = appt.doctorInitials ?? ((appt.doctorName ?? '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'DR');
            const isUpcoming = new Date(appt.scheduledAt) > now && ['CONFIRMED','PENDING'].includes(appt.status);
            const canJoin   = appt.type === 'TELECONSULT' && appt.status === 'CONFIRMED' && isUpcoming && appt.meetingLink;

            return (
              <div key={appt.id} style={{ ...card, overflow:'hidden' }}>
                <div style={{ height:3, background:`linear-gradient(90deg,${C.teal},${C.tealLight})` }} />
                <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                  {/* Date block */}
                  <div style={{ textAlign:'center', minWidth:52, flexShrink:0 }}>
                    <div style={{ fontSize:26, fontWeight:800, color:C.teal, lineHeight:1 }}>{dt.getDate()}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:C.text3 }}>{dt.toLocaleString('en-IN',{month:'short'})}</div>
                    <div style={{ fontSize:11, color:C.text3 }}>{dt.getFullYear()}</div>
                  </div>

                  {/* Doctor avatar */}
                  <div style={{ width:48, height:48, borderRadius:'50%', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15, flexShrink:0 }}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:4 }}>{appt.doctorName ?? 'Doctor'}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                      <span style={{ fontSize:13, color:C.text2 }}>🩺 {appt.specialization}</span>
                      <span style={{ fontSize:13, color:C.text3 }}>⏰ {dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700, background:tt.bg, color:tt.color }}>
                        {tt.label === 'Video Call' ? '📹 ' : tt.label === 'Home Visit' ? '🏠 ' : '🏥 '}{tt.label}
                      </span>
                      <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
                        {appt.status}
                      </span>
                    </div>
                    {appt.reasonForVisit && (
                      <div style={{ fontSize:12, color:C.text3, marginTop:6, fontStyle:'italic' }}>"{appt.reasonForVisit}"</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    {canJoin && (
                      <a href={appt.meetingLink} target="_blank" rel="noreferrer" style={{ padding:'9px 18px', borderRadius:9, textDecoration:'none', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, color:'#fff', fontSize:13, fontWeight:700 }}>
                        📹 Join Call
                      </a>
                    )}
                    {isUpcoming && (
                      <button onClick={() => handleCancel(appt.id)} style={{ padding:'9px 18px', borderRadius:9, border:`1.5px solid rgba(239,68,68,0.25)`, background:'transparent', color:C.red, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showBook && (
        <BookModal
          preselect={preselect}
          onClose={() => { setShowBook(false); setPreselect(null); }}
          onSaved={() => {
            setShowBook(false);
            setPreselect(null);
            loadData();
            showToast('✅ Appointment booked successfully!');
          }}
        />
      )}
    </div>
  );
}

// ── Book Appointment Modal ────────────────────────────────────────────────────
function BookModal({ onClose, onSaved, preselect }: { onClose: () => void; onSaved: () => void; preselect: {id:string;name:string;spec:string} | null }) {
  const [step,        setStep]       = useState<'doctor' | 'slot'>('doctor');
  const [doctors,     setDoctors]    = useState<any[]>([]);
  const [filtered,    setFiltered]   = useState<any[]>([]);
  const [search,      setSearch]     = useState('');
  const [specFilter,  setSpecFilter] = useState('All');
  const [specs,       setSpecs]      = useState<string[]>([]);
  const [selDoctor,   setSelDoctor]  = useState<any>(
    preselect
      ? {
          id: preselect.id,
          firstName: preselect.name.replace('Dr. ','').split(' ')[0],
          lastName: preselect.name.replace('Dr. ','').split(' ').slice(1).join(' '),
          specialization: preselect.spec,
        }
      : null
  );
  const [avail,       setAvail]      = useState<any>(null);
  const [availLoad,   setAvailLoad]  = useState(false);
  const [selDate,     setSelDate]    = useState('');
  const [selSlot,     setSelSlot]    = useState('');
  const [apptType,    setApptType]   = useState('IN_PERSON');
  const [reason,      setReason]     = useState('');
  const [saving,      setSaving]     = useState(false);
  const [err,         setErr]        = useState('');
  const [docLoading,  setDocLoading] = useState(true);

  // If pre-selected doctor from /doctors page, go straight to slot step
  useEffect(() => {
    if (preselect?.id) {
      setStep('slot');
      setAvailLoad(true);
      const fetchAvail = async () => {
        let availData: any = null;
        for (const ep of [
          `/public/doctors/${preselect.id}/availability`,
          `/doctors/${preselect.id}/availability`,
          `/api/public/doctors/${preselect.id}/availability`,
        ]) {
          try {
            const r: any = await api.get(ep);
            availData = r?.data?.data ?? r?.data ?? {};
            if (availData && (availData.availability || availData.slots)) break;
          } catch { /**/ }
        }
        setAvail(availData ?? { _noSchedule: true });
        setAvailLoad(false);
      };
      fetchAvail();
    }
  }, [preselect]);

  // Load all doctors
  useEffect(() => {
    (async () => {
      setDocLoading(true);
      try {
        let docs: any[] = [];
        const endpoints = ['/public/doctors', '/doctors', '/api/public/doctors', '/patient/doctors'];
        for (const ep of endpoints) {
          try {
            const r: any = await api.get(ep, { params: { limit: 100, verified: true } });
            const raw = r?.data?.data ?? r?.data?.doctors ?? r?.data ?? [];
            const arr = Array.isArray(raw) ? raw : (raw?.doctors ?? raw?.data ?? []);
            if (arr.length > 0) { docs = arr; break; }
          } catch { /**/ }
        }
        setDoctors(docs);
        setFiltered(docs);
        const allSpecs = [...new Set(docs.map((d: any) => d.specialization).filter(Boolean))];
        setSpecs(allSpecs as string[]);
      } catch { /**/ }
      setDocLoading(false);
    })();
  }, []);

  // Filter doctors
  useEffect(() => {
    let f = doctors;
    if (specFilter !== 'All') f = f.filter(d => d.specialization === specFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(d => `${d.firstName} ${d.lastName} ${d.specialization} ${d.hospital ?? ''}`.toLowerCase().includes(q));
    }
    setFiltered(f);
  }, [search, specFilter, doctors]);

  // When doctor selected — fetch availability
  const selectDoctor = async (doc: any) => {
    setSelDoctor(doc);
    setSelDate('');
    setSelSlot('');
    setAvail(null);
    setStep('slot');
    setAvailLoad(true);
    try {
      let availData: any = null;
      const endpoints = [
        `/public/doctors/${doc.id}/availability`,
        `/doctors/${doc.id}/availability`,
        `/api/public/doctors/${doc.id}/availability`,
        `/doctors/${doc.id}/slots`,
      ];
      for (const ep of endpoints) {
        try {
          const r: any = await api.get(ep);
          availData = r?.data?.data ?? r?.data ?? {};
          if (availData && (availData.availability || availData.slots || availData.schedule)) break;
        } catch { /**/ }
      }
      setAvail(availData ?? { _noSchedule: true });
    } catch { setAvail({ _noSchedule: true }); }
    setAvailLoad(false);
  };

  // Generate time slots for a date
  const getSlotsForDate = (date: string): string[] => {
    if (!avail || !date) return [];
    if (avail._noSchedule || (!avail.availability && !avail.slots && !avail.schedule)) {
      return ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
    }
    const dow = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const schedule = avail.availability ?? avail.schedule ?? avail.slots ?? [];
    const dayAvail = Array.isArray(schedule)
      ? schedule.find((a: any) => (a.dayOfWeek ?? a.day ?? '').toUpperCase() === dow)
      : null;
    if (!dayAvail) return ['09:00','10:00','11:00','14:00','15:00','16:00'];

    const slots: string[] = [];
    const start = dayAvail.startTime ?? dayAvail.from ?? dayAvail.openTime ?? '09:00';
    const end   = dayAvail.endTime   ?? dayAvail.to   ?? dayAvail.closeTime ?? '17:00';
    const dur   = dayAvail.slotDuration ?? dayAvail.duration ?? 30;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let cur = sh * 60 + (sm || 0);
    const endMin = eh * 60 + (em || 0);
    const booked = (avail.bookedSlots ?? avail.appointments ?? [])
      .filter((b: any) => {
        const bDate = b.date ?? b.scheduledAt?.substring(0, 10);
        return bDate === date;
      })
      .map((b: any) => b.time ?? b.scheduledAt?.substring(11, 16));
    while (cur + dur <= endMin) {
      const h = Math.floor(cur / 60).toString().padStart(2, '0');
      const m = (cur % 60).toString().padStart(2, '0');
      const t = `${h}:${m}`;
      if (!booked.includes(t)) slots.push(t);
      cur += dur;
    }
    return slots.length > 0 ? slots : ['09:00','10:00','11:00','14:00','15:00','16:00'];
  };

  // ── FIX 1: Cleaned-up save function ──────────────────────────────────────
  const save = async () => {
    if (!selDoctor || !selDate || !selSlot) {
      setErr('Please select a doctor, date and time slot');
      return;
    }
    setSaving(true);
    setErr('');

    // Debug log — remove after confirming doctorId is correct
    console.log('[HC] Booking with doctorId:', selDoctor.id, '| Full doctor object:', selDoctor);

    // Resolve doctorId — backend may store it under different keys
    const doctorId = selDoctor.id ?? selDoctor._id ?? selDoctor.doctorId ?? selDoctor.userId;
    if (!doctorId) {
      setErr('Could not resolve doctor ID. Please go back and select the doctor again.');
      setSaving(false);
      return;
    }

    const scheduledAt = new Date(`${selDate}T${selSlot}:00`).toISOString();

    // FIX: Only send EXACT enum values the backend accepts — no CLINIC, no PHYSICAL
    // FIX: Do NOT send appointmentType — only 'type' key is expected by validator
    const payload: Record<string, any> = {
      doctorId,
      scheduledAt,
      type: apptType, // Always one of: IN_PERSON | TELECONSULT | HOME_VISIT
    };

    // Only attach reason fields if user filled them in
    const notes = reason.trim() || undefined;
    if (notes) {
      payload.reasonForVisit = notes;
    }

    // Try both endpoints in order; stop as soon as one succeeds
    const endpoints = ['/patient/appointments', '/appointments'];
    let lastErr = '';
    let booked  = false;

    for (const ep of endpoints) {
      try {
        await api.post(ep, payload);
        booked = true;
        break;
      } catch (e: any) {
        const errData = e?.response?.data;
        const status  = e?.response?.status;
        const msgArr  = Array.isArray(errData?.errors)
          ? errData.errors.map((x: any) => x.message ?? x.msg ?? JSON.stringify(x)).join(' | ')
          : '';
        lastErr = msgArr || errData?.message || errData?.error || errData?.details || 'Booking failed';

        console.error(`[HC] Booking failed on ${ep} (${status}):`, lastErr);

        if (status === 401 || status === 403) {
          setErr('Session expired. Please sign in again.');
          setSaving(false);
          return;
        }
        // 404 = endpoint doesn't exist, try next
        // 400/422 = validation error — surface to user immediately (no retries with wrong values)
        if (status !== 404) break;
      }
    }

    if (booked) {
      // FIX 3: Dispatch event so HomePage + any other dashboard component refreshes
      window.dispatchEvent(new CustomEvent('hcAppointmentBooked'));
      onSaved();
      return;
    }

    setErr(lastErr || 'Could not book appointment. Please try again.');
    setSaving(false);
  };

  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  const slots   = getSlotsForDate(selDate);

  const BLU = '#1A6BB5';
  const inp: React.CSSProperties = {
    display:'block', width:'100%', padding:'9px 12px', borderRadius:9,
    border:'1px solid #C8DFF0', fontSize:13, color:'#0A1628',
    outline:'none', fontFamily:'inherit', background:'#F8FBFF',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,22,40,0.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth: step === 'doctor' ? 680 : 520, maxHeight:'88vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(10,22,40,0.3)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #E8F0F8', display:'flex', alignItems:'center', gap:12 }}>
          {step !== 'doctor' && (
            <button onClick={() => { setStep('doctor'); setSelSlot(''); }} style={{ background:'none', border:'1px solid #C8DFF0', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:12, color:'#2C5282', fontWeight:600 }}>← Back</button>
          )}
          <div style={{ flex:1 }}>
            <h2 style={{ fontSize:17, fontWeight:800, color:'#0A1628', margin:0 }}>
              {step === 'doctor' ? '🩺 Choose a Doctor' : `📅 Pick a Slot — Dr. ${selDoctor?.lastName}`}
            </h2>
            <div style={{ fontSize:11, color:'#5A7A9B', marginTop:2 }}>
              Step {step === 'doctor' ? '1' : '2'} of 2
            </div>
          </div>
          {/* Step dots */}
          <div style={{ display:'flex', gap:6 }}>
            {(['doctor','slot'] as const).map((s, i) => (
              <div key={s} style={{ width:8, height:8, borderRadius:'50%', background: step === s ? BLU : (i < ['doctor','slot'].indexOf(step) ? '#4ADE80' : '#C8DFF0'), transition:'all 0.2s' }}/>
            ))}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#94A3B8', lineHeight:1 }}>✕</button>
        </div>

        <div style={{ padding:'16px 24px 24px', flex:1 }}>

          {/* ── STEP 1: Choose Doctor ── */}
          {step === 'doctor' && (
            <>
              <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                <div style={{ flex:1, position:'relative' }}>
                  <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, specialization..." style={{ ...inp, paddingLeft:32 }} />
                </div>
                <select value={specFilter} onChange={e => setSpecFilter(e.target.value)} style={{ ...inp, width:'auto', minWidth:140 }}>
                  <option value="All">All Specializations</option>
                  {specs.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {docLoading ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#5A7A9B', fontSize:13 }}>Loading doctors…</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#5A7A9B', fontSize:13 }}>No doctors found. Try a different search.</div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxHeight:420, overflowY:'auto' }}>
                  {filtered.map((doc: any) => (
                    <button key={doc.id} onClick={() => selectDoctor(doc)}
                      style={{ padding:'12px 14px', borderRadius:12, border:'1.5px solid #C8DFF0', background:'#F8FBFF', cursor:'pointer', textAlign:'left', transition:'all 0.15s', fontFamily:'inherit' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = BLU; (e.currentTarget as HTMLElement).style.background = '#EBF4FF'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#C8DFF0'; (e.currentTarget as HTMLElement).style.background = '#F8FBFF'; }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${BLU},#5B9CF6)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, flexShrink:0 }}>
                          {(doc.firstName?.[0] ?? '')}{(doc.lastName?.[0] ?? '')}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:13, color:'#0A1628', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Dr. {doc.firstName} {doc.lastName}</div>
                          <div style={{ fontSize:11, color:BLU, fontWeight:600 }}>{doc.specialization}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, fontSize:11, color:'#5A7A9B', flexWrap:'wrap' }}>
                        {doc.experience && <span>⏱ {doc.experience}y exp</span>}
                        {doc.consultationFee && <span>₹{doc.consultationFee}</span>}
                        {doc.rating && <span>⭐ {doc.rating}</span>}
                        {doc.isVerified && <span style={{ color:'#16A34A', fontWeight:700 }}>✓ Verified</span>}
                      </div>
                      {doc.hospital && <div style={{ fontSize:10, color:'#94A3B8', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>🏥 {doc.hospital}</div>}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ textAlign:'center', marginTop:10, fontSize:11, color:'#94A3B8' }}>{filtered.length} doctors available</div>
            </>
          )}

          {/* ── STEP 2: Pick Date + Slot ── */}
          {step === 'slot' && (
            <>
              {/* Selected doctor summary */}
              <div style={{ background:'#F0F7FF', borderRadius:12, padding:'12px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:10, background:`linear-gradient(135deg,${BLU},#5B9CF6)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15 }}>
                  {(selDoctor?.firstName?.[0] ?? '')}{(selDoctor?.lastName?.[0] ?? '')}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0A1628' }}>Dr. {selDoctor?.firstName} {selDoctor?.lastName}</div>
                  <div style={{ fontSize:12, color:BLU }}>{selDoctor?.specialization}</div>
                  {selDoctor?.consultationFee && <div style={{ fontSize:12, color:'#5A7A9B' }}>₹{selDoctor.consultationFee} / visit</div>}
                </div>
              </div>

              {/* FIX 1: Consultation type — only valid backend enum values */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#5A7A9B', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Consultation Type</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[
                    { v:'IN_PERSON',   l:'🏥 In Person'  },
                    { v:'TELECONSULT', l:'📹 Video Call'  },
                    { v:'HOME_VISIT',  l:'🏠 Home Visit'  },
                  ].map(t => (
                    <button key={t.v} onClick={() => setApptType(t.v)}
                      style={{ flex:1, padding:'8px 0', borderRadius:9, border:`1.5px solid ${apptType===t.v?BLU:'#C8DFF0'}`, background:apptType===t.v?'#EBF4FF':'#F8FBFF', color:apptType===t.v?BLU:'#5A7A9B', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date picker */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#5A7A9B', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Select Date</label>
                <input type="date" min={minDate} max={maxDate} value={selDate} onChange={e => { setSelDate(e.target.value); setSelSlot(''); }} style={inp} />
              </div>

              {/* Time slots */}
              {selDate && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#5A7A9B', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Available Slots</label>
                  {availLoad ? (
                    <div style={{ textAlign:'center', padding:'20px 0', color:'#5A7A9B', fontSize:13 }}>Loading slots…</div>
                  ) : slots.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'16px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, color:'#92400E', fontSize:13 }}>
                      No slots available on this date. Please choose another date.
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                      {slots.map(s => (
                        <button key={s} onClick={() => setSelSlot(s)}
                          style={{ padding:'9px 0', borderRadius:9, border:`1.5px solid ${selSlot===s?BLU:'#C8DFF0'}`, background:selSlot===s?BLU:'#F8FBFF', color:selSlot===s?'#fff':'#1A365D', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#5A7A9B', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Reason for Visit (optional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe your symptoms or reason for the visit..." rows={3}
                  style={{ ...inp, resize:'vertical' as const }} />
              </div>

              {err && (
                <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, padding:'10px 14px', color:'#DC2626', fontSize:13, marginBottom:12 }}>
                  ⚠️ {err}
                </div>
              )}

              <button
                onClick={save}
                disabled={saving || !selDate || !selSlot}
                style={{
                  width:'100%', padding:'13px 0', borderRadius:11, border:'none',
                  background:(!selDate||!selSlot) ? '#C8DFF0' : `linear-gradient(135deg,${BLU},#5B9CF6)`,
                  color:(!selDate||!selSlot) ? '#94A3B8' : '#fff',
                  fontSize:15, fontWeight:800,
                  cursor:(!selDate||!selSlot) ? 'not-allowed' : 'pointer',
                  transition:'all 0.2s', fontFamily:'inherit',
                  boxShadow:(!selDate||!selSlot) ? 'none' : '0 4px 16px rgba(26,107,181,0.35)',
                  opacity: saving ? 0.8 : 1,
                }}
              >
                {saving ? '⏳ Booking...' : '✅ Confirm Appointment'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
