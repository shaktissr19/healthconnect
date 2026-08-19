'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

const C = {
  page: '#F5F4F0', card: '#FFFFFF', border: '#DDE7E5', navy: '#0F172A', text: '#334155', muted: '#64748B',
  teal: '#0D9488', tealDark: '#0F766E', green: '#15803D', amber: '#B45309', red: '#BE123C', blue: '#1D4ED8',
};

const ACTIVE = new Set(['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'IN_PROGRESS']);
const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);

const extract = (response: any) => response?.data?.data ?? response?.data ?? null;
const errMessage = (error: any, fallback: string) => error?.response?.data?.message ?? error?.response?.data?.error ?? fallback;

function fmt(value: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(value));
}

function Status({ value }: { value: string }) {
  const tones: Record<string, [string, string]> = {
    PENDING: [C.amber, '#FEF3C7'], CONFIRMED: [C.blue, '#DBEAFE'], RESCHEDULED: ['#7C3AED', '#EDE9FE'],
    CHECKED_IN: [C.tealDark, '#CCFBF1'], IN_PROGRESS: [C.tealDark, '#CCFBF1'], COMPLETED: [C.green, '#DCFCE7'],
    CANCELLED: [C.red, '#FFE4E6'], NO_SHOW: [C.red, '#FFE4E6'],
  };
  const [color, background] = tones[value] ?? [C.muted, '#F1F5F9'];
  return <span style={{ color, background, borderRadius: 999, padding: '4px 9px', fontSize: 10, fontWeight: 850 }}>{value.replaceAll('_', ' ')}</span>;
}

function Button({ children, onClick, disabled, danger = false, ghost = false }: any) {
  return <button onClick={onClick} disabled={disabled} style={{
    border: ghost ? `1px solid ${C.border}` : 'none', borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 800,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1,
    background: ghost ? '#fff' : danger ? C.red : `linear-gradient(135deg,${C.tealDark},${C.teal})`, color: ghost ? C.text : '#fff',
  }}>{children}</button>;
}

export default function DoctorAppointmentsV2() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState<'active' | 'pending' | 'completed' | 'all'>('active');
  const [reschedule, setReschedule] = useState<any>(null);
  const [newDateTime, setNewDateTime] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/appointments', { params: { limit: 100 } });
      const data = extract(response);
      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (error: any) {
      setError(errMessage(error, 'Unable to load appointments.'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);

  const visible = useMemo(() => appointments.filter(a => {
    if (filter === 'pending') return a.status === 'PENDING';
    if (filter === 'completed') return TERMINAL.has(a.status);
    if (filter === 'active') return ACTIVE.has(a.status);
    return true;
  }), [appointments, filter]);

  const run = async (id: string, action: () => Promise<any>, success: string) => {
    setBusyId(id); setError('');
    try {
      await action();
      setToast(success);
      await load();
      return true;
    } catch (error: any) {
      setError(errMessage(error, 'Appointment update failed. No changes were saved.'));
      return false;
    } finally { setBusyId(''); }
  };

  const setStatus = (appointment: any, status: string) => run(
    appointment.id,
    () => api.put(`/appointments/${appointment.id}/status`, { status }),
    `Appointment ${status.replaceAll('_', ' ').toLowerCase()}`,
  );

  const cancel = async (appointment: any) => {
    const reason = window.prompt('Cancellation reason', 'Cancelled by doctor');
    if (!reason) return;
    await run(appointment.id, () => api.put(`/appointments/${appointment.id}/cancel`, { reason }), 'Appointment cancelled');
  };

  const saveReschedule = async () => {
    if (!reschedule || !newDateTime) return;
    const date = new Date(newDateTime);
    if (Number.isNaN(date.getTime())) { setError('Choose a valid date and time.'); return; }
    const ok = await run(
      reschedule.id,
      () => api.put(`/appointments/${reschedule.id}/reschedule`, { scheduledAt: date.toISOString() }),
      'Appointment rescheduled; confirmation is required',
    );
    if (ok) { setReschedule(null); setNewDateTime(''); }
  };

  if (loading) return <div style={{ minHeight: 420, display: 'grid', placeItems: 'center', color: C.muted }}>Loading appointments…</div>;

  return <div style={{ maxWidth: 1180, margin: '0 auto', color: C.navy, fontFamily: 'Arial,sans-serif' }}>
    {toast && <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 1000, background: C.tealDark, color: '#fff', borderRadius: 10, padding: '11px 15px', fontSize: 12, fontWeight: 800 }}>✓ {toast}</div>}
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'end', marginBottom: 16, flexWrap: 'wrap' }}>
      <div><h1 style={{ margin: 0, fontSize: 24 }}>Appointments</h1><div style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Real Patient ↔ Doctor ↔ Hospital appointment state. Failed API actions never show as successful.</div></div>
      <Button ghost onClick={() => void load()}>Refresh</Button>
    </div>

    {error && <div style={{ background: '#FFF1F2', color: C.red, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12 }}>⚠ {error}</div>}

    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, marginBottom: 14, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {(['active','pending','completed','all'] as const).map(x => <button key={x} onClick={() => setFilter(x)} style={{ border: `1px solid ${filter === x ? C.teal : C.border}`, background: filter === x ? '#ECFDF5' : '#fff', color: filter === x ? C.tealDark : C.text, borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize' }}>{x}</button>)}
    </div>

    <div style={{ display: 'grid', gap: 10 }}>
      {visible.length === 0 && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 34, textAlign: 'center', color: C.muted }}>No appointments in this view.</div>}
      {visible.map(a => <div key={a.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1.25fr) minmax(190px,1.1fr) minmax(150px,.9fr) auto', gap: 14, alignItems: 'center' }}>
          <div><div style={{ fontWeight: 900 }}>{a.patient ? `${a.patient.firstName ?? ''} ${a.patient.lastName ?? ''}`.trim() : 'Patient'}</div><div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{a.reasonForVisit || 'General consultation'}</div></div>
          <div><div style={{ fontWeight: 800 }}>{fmt(a.scheduledAt)}</div><div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{a.type === 'TELECONSULT' ? '📹 Teleconsult' : '🏥 In person'} · {a.durationMinutes || 30} min</div></div>
          <div><Status value={a.status}/><div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>{a.hospital?.name ? `Hospital: ${a.hospital.name}` : 'Independent consultation'}</div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
            {a.status === 'PENDING' && <Button disabled={busyId === a.id} onClick={() => void setStatus(a, 'CONFIRMED')}>Confirm</Button>}
            {['PENDING','CONFIRMED','RESCHEDULED'].includes(a.status) && <Button ghost disabled={busyId === a.id} onClick={() => { setReschedule(a); setNewDateTime(''); }}>Reschedule</Button>}
            {['CONFIRMED','RESCHEDULED','CHECKED_IN','IN_PROGRESS'].includes(a.status) && <Button disabled={busyId === a.id} onClick={() => void setStatus(a, 'COMPLETED')}>Complete</Button>}
            {ACTIVE.has(a.status) && <Button ghost disabled={busyId === a.id} onClick={() => void setStatus(a, 'NO_SHOW')}>No-show</Button>}
            {ACTIVE.has(a.status) && <Button danger disabled={busyId === a.id} onClick={() => void cancel(a)}>Cancel</Button>}
            {a.type === 'TELECONSULT' && a.meetingLink && ACTIVE.has(a.status) && <Button ghost onClick={() => window.open(a.meetingLink, '_blank', 'noopener,noreferrer')}>Join</Button>}
          </div>
        </div>
      </div>)}
    </div>

    {reschedule && <div onClick={() => setReschedule(null)} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15,23,42,.55)', display: 'grid', placeItems: 'center', padding: 16 }}><div onClick={e => e.stopPropagation()} style={{ width: 'min(440px,95vw)', background: '#fff', borderRadius: 16, padding: 20 }}>
      <h3 style={{ margin: 0 }}>Reschedule appointment</h3><div style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>The backend will re-check Doctor/Hospital availability and conflicts before saving.</div>
      <input type="datetime-local" value={newDateTime} onChange={e => setNewDateTime(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', marginTop: 16, padding: 10, border: `1px solid ${C.border}`, borderRadius: 9 }}/>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 14 }}><Button ghost onClick={() => setReschedule(null)}>Cancel</Button><Button disabled={!newDateTime || busyId === reschedule.id} onClick={() => void saveReschedule()}>Save new time</Button></div>
    </div></div>}
  </div>;
}
