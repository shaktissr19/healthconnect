'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { api } from '@/lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
type Day = (typeof DAYS)[number];
type Session = { start: string; end: string; slotDuration: number };
type Weekly = Record<Day, Session[]>;

const C = {
  teal: '#0D9488', tealDark: '#0F766E', green: '#15803D', amber: '#B45309', rose: '#BE123C',
  text: '#0F172A', mid: '#475569', muted: '#64748B', border: '#DDE8E7', bg: '#F5F4F0', card: '#FFFFFF',
};

const emptyWeekly = (): Weekly => ({
  Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [],
});

const defaultSession = (): Session => ({ start: '09:00', end: '17:00', slotDuration: 30 });
const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

function normalizeWeekly(value: any): Weekly {
  const weekly = emptyWeekly();
  for (const day of DAYS) {
    const sessions = Array.isArray(value?.[day]) ? value[day] : [];
    weekly[day] = sessions
      .map((session: any) => ({
        start: String(session?.start ?? '09:00'),
        end: String(session?.end ?? '17:00'),
        slotDuration: Number(session?.slotDuration ?? 30),
      }))
      .filter((session: Session) => /^\d{2}:\d{2}$/.test(session.start) && /^\d{2}:\d{2}$/.test(session.end));
  }
  return weekly;
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint?: string }) {
  return <button type="button" onClick={() => onChange(!checked)} style={{ ...toggleRow, borderColor: checked ? '#99F6E4' : C.border, background: checked ? '#F0FDFA' : '#fff' }}>
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{hint}</div>}
    </div>
    <span style={{ width: 42, height: 24, borderRadius: 20, background: checked ? C.teal : '#CBD5E1', position: 'relative', flexShrink: 0 }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: checked ? 20 : 2, transition: 'left .15s' }} />
    </span>
  </button>;
}

export default function DoctorAvailabilityV2() {
  const [weekly, setWeekly] = useState<Weekly>(emptyWeekly());
  const [fees, setFees] = useState({ inPerson: '', video: '', phone: '' });
  const [modes, setModes] = useState({ offersInPerson: true, offersVideoConsult: false, offersAudioConsult: false, offersChatConsult: false });
  const [isAvailableOnline, setIsAvailableOnline] = useState(true);
  const [isAcceptingNewPatients, setIsAcceptingNewPatients] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response: any = await api.get('/doctor/availability');
      const data = response?.data?.data ?? response?.data ?? {};
      setWeekly(normalizeWeekly(data.weeklySchedule));
      setConfigured(Boolean(data.configured));
      setFees({
        inPerson: data.fees?.inPerson == null ? '' : String(data.fees.inPerson),
        video: data.fees?.video == null ? '' : String(data.fees.video),
        phone: data.fees?.phone == null ? '' : String(data.fees.phone),
      });
      setModes({
        offersInPerson: data.consultationModes?.offersInPerson !== false,
        offersVideoConsult: Boolean(data.consultationModes?.offersVideoConsult),
        offersAudioConsult: Boolean(data.consultationModes?.offersAudioConsult),
        offersChatConsult: Boolean(data.consultationModes?.offersChatConsult),
      });
      setIsAvailableOnline(data.isAvailableOnline !== false);
      setIsAcceptingNewPatients(data.isAcceptingNewPatients !== false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to load availability.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalSessions = useMemo(() => DAYS.reduce((sum, day) => sum + weekly[day].length, 0), [weekly]);

  const setDayEnabled = (day: Day, enabled: boolean) => {
    setWeekly(previous => ({ ...previous, [day]: enabled ? (previous[day].length ? previous[day] : [defaultSession()]) : [] }));
  };

  const addSession = (day: Day) => {
    setWeekly(previous => {
      if (previous[day].length >= 4) return previous;
      const last = previous[day][previous[day].length - 1];
      const next = last ? { start: last.end, end: '18:00', slotDuration: last.slotDuration } : defaultSession();
      if (toMinutes(next.end) <= toMinutes(next.start)) next.end = '23:00';
      return { ...previous, [day]: [...previous[day], next] };
    });
  };

  const removeSession = (day: Day, index: number) => {
    setWeekly(previous => ({ ...previous, [day]: previous[day].filter((_, i) => i !== index) }));
  };

  const updateSession = (day: Day, index: number, patch: Partial<Session>) => {
    setWeekly(previous => ({
      ...previous,
      [day]: previous[day].map((session, i) => i === index ? { ...session, ...patch } : session),
    }));
  };

  const validateClient = () => {
    for (const day of DAYS) {
      const sessions = [...weekly[day]].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
      for (let i = 0; i < sessions.length; i += 1) {
        if (toMinutes(sessions[i].end) <= toMinutes(sessions[i].start)) return `${day}: end time must be after start time.`;
        if (i > 0 && toMinutes(sessions[i].start) < toMinutes(sessions[i - 1].end)) return `${day}: sessions cannot overlap.`;
      }
    }
    return '';
  };

  const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value);

  const save = async () => {
    const clientError = validateClient();
    if (clientError) { setError(clientError); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      const response: any = await api.put('/doctor/availability', {
        weeklySchedule: weekly,
        fees: {
          inPerson: numberOrNull(fees.inPerson),
          video: numberOrNull(fees.video),
          phone: numberOrNull(fees.phone),
        },
        ...modes,
        isAvailableOnline,
        isAcceptingNewPatients,
      });
      const data = response?.data?.data ?? response?.data ?? {};
      setWeekly(normalizeWeekly(data.weeklySchedule));
      setConfigured(Boolean(data.configured));
      setMessage('Availability saved. Patient booking now uses this schedule.');
    } catch (err: any) {
      const validation = err?.response?.data?.errors;
      setError(validation?.[0]?.message ?? err?.response?.data?.message ?? 'Unable to save availability.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ ...card, padding: 40, textAlign: 'center', color: C.muted }}>Loading doctor availability…</div>;

  return <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <section style={{ ...card, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: C.text }}>Availability & Consultation</h1>
          <div style={{ marginTop: 5, color: C.muted, fontSize: 12 }}>All schedule times use India Standard Time (Asia/Kolkata). Patient booking reads this same schedule.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: configured ? '#ECFDF5' : '#FFFBEB', color: configured ? C.green : C.amber, fontSize: 11, fontWeight: 800 }}>
            {configured ? `${totalSessions} bookable session${totalSessions === 1 ? '' : 's'}` : 'Schedule not configured'}
          </span>
          <button onClick={() => void save()} disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : 'Save Availability'}</button>
        </div>
      </div>
    </section>

    {message && <div style={successBox}>✓ {message}</div>}
    {error && <div style={errorBox}>⚠ {error}</div>}

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(280px,.8fr)', gap: 16, alignItems: 'start' }}>
      <section style={card}>
        <div style={{ marginBottom: 18 }}>
          <div style={sectionTitle}>Weekly Schedule</div>
          <div style={sectionSub}>You can add split sessions such as morning and evening OPD. Maximum four sessions per day.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DAYS.map(day => {
            const sessions = weekly[day];
            const enabled = sessions.length > 0;
            return <div key={day} style={{ border: `1px solid ${enabled ? '#BDE8E3' : C.border}`, borderRadius: 12, padding: 14, background: enabled ? '#FBFFFE' : '#FAFAF9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: enabled ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={enabled} onChange={event => setDayEnabled(day, event.target.checked)} style={{ width: 16, height: 16, accentColor: C.teal }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{day}</div>
                </div>
                {enabled && <button type="button" onClick={() => addSession(day)} disabled={sessions.length >= 4} style={smallBtn}>+ Add session</button>}
              </div>

              {enabled && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map((session, index) => <div key={`${day}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: 8, alignItems: 'end' }}>
                  <label style={fieldLabel}>Start<input type="time" value={session.start} onChange={event => updateSession(day, index, { start: event.target.value })} style={inputStyle} /></label>
                  <label style={fieldLabel}>End<input type="time" value={session.end} onChange={event => updateSession(day, index, { end: event.target.value })} style={inputStyle} /></label>
                  <label style={fieldLabel}>Slot<select value={session.slotDuration} onChange={event => updateSession(day, index, { slotDuration: Number(event.target.value) })} style={inputStyle}>
                    {[15, 20, 30, 45, 60].map(value => <option key={value} value={value}>{value} min</option>)}
                  </select></label>
                  <button type="button" onClick={() => removeSession(day, index)} style={removeBtn} aria-label={`Remove ${day} session`}>×</button>
                </div>)}
              </div>}
            </div>;
          })}
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section style={card}>
          <div style={sectionTitle}>Booking Status</div>
          <div style={{ ...sectionSub, marginBottom: 12 }}>Control whether patients can discover/book active consultation modes.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Toggle checked={isAcceptingNewPatients} onChange={setIsAcceptingNewPatients} label="Accepting new patients" />
            <Toggle checked={isAvailableOnline} onChange={setIsAvailableOnline} label="Available online" hint="Used for teleconsult availability status" />
          </div>
        </section>

        <section style={card}>
          <div style={sectionTitle}>Consultation Modes</div>
          <div style={{ ...sectionSub, marginBottom: 12 }}>These stay synchronized with Doctor Profile and public Doctor Directory.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Toggle checked={modes.offersInPerson} onChange={value => setModes(previous => ({ ...previous, offersInPerson: value }))} label="In-person consultation" />
            <Toggle checked={modes.offersVideoConsult} onChange={value => setModes(previous => ({ ...previous, offersVideoConsult: value }))} label="Video consultation" />
            <Toggle checked={modes.offersAudioConsult} onChange={value => setModes(previous => ({ ...previous, offersAudioConsult: value }))} label="Audio consultation" />
            <Toggle checked={modes.offersChatConsult} onChange={value => setModes(previous => ({ ...previous, offersChatConsult: value }))} label="Chat consultation" />
          </div>
        </section>

        <section style={card}>
          <div style={sectionTitle}>Consultation Fees</div>
          <div style={{ ...sectionSub, marginBottom: 12 }}>₹0 is allowed. Leave blank if a mode has no configured fee.</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={fieldLabel}>In person<input type="number" min="0" max="100000" value={fees.inPerson} onChange={event => setFees(previous => ({ ...previous, inPerson: event.target.value }))} placeholder="₹" style={inputStyle} /></label>
            <label style={fieldLabel}>Video<input type="number" min="0" max="100000" value={fees.video} onChange={event => setFees(previous => ({ ...previous, video: event.target.value }))} placeholder="₹" style={inputStyle} /></label>
            <label style={fieldLabel}>Audio / phone<input type="number" min="0" max="100000" value={fees.phone} onChange={event => setFees(previous => ({ ...previous, phone: event.target.value }))} placeholder="₹" style={inputStyle} /></label>
          </div>
        </section>
      </div>
    </div>
  </div>;
}

const card: CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, boxShadow: '0 2px 9px rgba(15,23,42,.04)' };
const sectionTitle: CSSProperties = { fontSize: 15, fontWeight: 900, color: C.text };
const sectionSub: CSSProperties = { fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5 };
const fieldLabel: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, color: C.muted, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.03em' };
const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 9, background: '#fff', color: C.text, padding: '9px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit' };
const primaryBtn: CSSProperties = { border: 'none', borderRadius: 10, background: `linear-gradient(135deg,${C.tealDark},${C.teal})`, color: '#fff', fontWeight: 800, fontSize: 12, padding: '10px 16px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(13,148,136,.2)' };
const smallBtn: CSSProperties = { border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', color: C.tealDark, fontSize: 10, fontWeight: 800, padding: '6px 9px', cursor: 'pointer' };
const removeBtn: CSSProperties = { width: 34, height: 36, border: '1px solid #FECDD3', borderRadius: 9, background: '#FFF1F2', color: C.rose, fontSize: 18, cursor: 'pointer' };
const toggleRow: CSSProperties = { width: '100%', border: '1px solid', borderRadius: 11, padding: '10px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer' };
const successBox: CSSProperties = { padding: '11px 14px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', color: C.green, fontSize: 12, fontWeight: 700 };
const errorBox: CSSProperties = { padding: '11px 14px', borderRadius: 10, background: '#FFF1F2', border: '1px solid #FECDD3', color: C.rose, fontSize: 12, fontWeight: 700 };
