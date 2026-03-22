'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import BookAppointmentModal from '@/components/dashboard/BookAppointmentModal';

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
      // Correct endpoint — backend mounts at /appointments, not /patient/appointments
      const r: any = await api.get('/appointments');
      const raw = r?.data?.data?.appointments ?? r?.data?.appointments ?? r?.data?.data ?? r?.data ?? [];
      // Normalize doctor name from nested object if needed
      const normalized = (Array.isArray(raw) ? raw : []).map((a: any) => ({
        ...a,
        doctorName: a.doctorName ?? (a.doctor ? `Dr. ${a.doctor.firstName ?? ''} ${a.doctor.lastName ?? ''}`.trim() : 'Doctor'),
        specialization: a.specialization ?? a.doctor?.specialization ?? 'General Physician',
        meetingLink: a.meetingLink ?? (a.type === 'TELECONSULT' ? `https://meet.jit.si/hc-${a.id}` : undefined),
      }));
      setAppts(normalized);
    } catch (e) {
      console.error('Appointments load error:', e);
      setAppts([]);
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
      await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by patient' });
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
        <BookAppointmentModal
          preselectedDoctorId={preselect?.id}
          onClose={() => { setShowBook(false); setPreselect(null); }}
          onSuccess={() => {
            setShowBook(false);
            setPreselect(null);
            loadData();
            showToast('✅ Appointment booked successfully!');
            window.dispatchEvent(new CustomEvent('hcAppointmentBooked'));
          }}
        />
      )}
    </div>
  );
}
