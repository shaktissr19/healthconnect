'use client';
// src/components/dashboard/BookAppointmentModal.tsx
// Book-appointment flow — 4 steps
// FIXED: uses /public/doctors/:id/availability (no auth required)
//        shows already-booked slots as greyed out

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const C = {
  bg:       '#0C1628',
  card:     '#111E33',
  card2:    '#162236',
  border:   'rgba(20,184,166,0.15)',
  borderHi: 'rgba(20,184,166,0.35)',
  teal:     '#14B8A6',
  tealDk:   '#0D9488',
  tealGlow: 'rgba(20,184,166,0.08)',
  green:    '#22C55E',
  amber:    '#F59E0B',
  rose:     '#F43F5E',
  txt:      '#E8F0FE',
  txt2:     '#7A8FAF',
  txt3:     '#4A5568',
};

interface Props {
  onClose: () => void;
  onSuccess?: (appointment: any) => void;
  preselectedDoctorId?: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToLabel(cur: number): string {
  const h = Math.floor(cur / 60);
  const m = cur % 60;
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function generateSlots(start = '09:00', end = '17:00', duration = 30): string[] {
  const slots: string[] = [];
  let cur = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  while (cur + duration <= endMin) {
    slots.push(minutesToLabel(cur));
    cur += duration;
  }
  return slots;
}

function getNext14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date:    d,
      label:   d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      short:   d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    };
  });
}

// Convert a slot label like "9:30 AM" + a date → Date object
function slotToDate(date: Date, slotLabel: string): Date {
  const [timePart, period] = slotLabel.split(' ');
  const [h, m] = timePart.split(':').map(Number);
  const hour24 = period === 'PM' && h !== 12 ? h + 12 : period === 'AM' && h === 12 ? 0 : h;
  const d = new Date(date);
  d.setHours(hour24, m, 0, 0);
  return d;
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)',
  color: C.txt, fontSize: 14, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const SPECIALTIES = ['Cardiology','Neurology','Orthopedics','Dermatology','Pediatrics','Gynecology','Endocrinology','Psychiatry','General Medicine','ENT','Ophthalmology','Urology','Gastroenterology','Pulmonology','Nephrology'];

export default function BookAppointmentModal({ onClose, onSuccess, preselectedDoctorId }: Props) {
  const [step,         setStep]         = useState<1|2|3|4>(1);
  const [doctors,      setDoctors]      = useState<any[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [specialty,    setSpecialty]    = useState('');
  const [selectedDoc,  setSelectedDoc]  = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [apptType,     setApptType]     = useState<'IN_PERSON'|'TELECONSULT'|'HOME_VISIT'>('IN_PERSON');
  const [reason,       setReason]       = useState('');
  const [symptoms,     setSymptoms]     = useState('');
  const [booking,      setBooking]      = useState(false);
  const [error,        setError]        = useState('');
  const [bookedAppt,   setBookedAppt]   = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookedSlots,  setBookedSlots]  = useState<any[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const days = getNext14Days();

  // ── Load initial doctor list or preselected doctor ──────────────────────
  useEffect(() => {
    if (preselectedDoctorId) {
      api.get(`/public/doctors/${preselectedDoctorId}`)
        .then((r: any) => {
          const doc = r?.data?.data;
          if (doc) { setSelectedDoc(doc); setStep(2); }
          else searchDoctors();
        })
        .catch(() => searchDoctors());
    } else {
      searchDoctors();
    }
  }, []);

  const searchDoctors = useCallback(async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (search)    params.set('search', search);
      if (specialty) params.set('specialty', specialty);
      const r: any = await api.get(`/public/doctors?${params}`);
      setDoctors(r?.data?.data ?? []);
    } catch {
      setDoctors([]);
    } finally {
      setSearching(false);
    }
  }, [search, specialty]);

  useEffect(() => {
    const t = setTimeout(searchDoctors, 400);
    return () => clearTimeout(t);
  }, [search, specialty]);

  // ── Load doctor availability when entering step 2 ───────────────────────
  // Uses PUBLIC endpoint — no auth needed
  useEffect(() => {
    if (step !== 2 || !selectedDoc) return;
    setLoadingAvail(true);
    api.get(`/public/doctors/${selectedDoc.id}/availability`)
      .then((r: any) => {
        setAvailability(r?.data?.data?.availability ?? []);
        setBookedSlots(r?.data?.data?.bookedSlots ?? []);
      })
      .catch(() => {
        setAvailability([]);
        setBookedSlots([]);
      })
      .finally(() => setLoadingAvail(false));
  }, [step, selectedDoc]);

  // ── Get available slots for a given date ────────────────────────────────
  const getSlotsForDate = (date: Date): { label: string; booked: boolean }[] => {
    const dayOfWeek = date.getDay();
    const avail = availability.find(a => a.dayOfWeek === dayOfWeek && a.isActive);
    const rawSlots = avail
      ? generateSlots(avail.startTime, avail.endTime, avail.slotDuration ?? 30)
      : generateSlots(); // fallback: 9am–5pm every 30min

    return rawSlots.map(label => {
      const slotDate = slotToDate(date, label);
      const isBooked = bookedSlots.some(b => {
        const bStart = new Date(b.scheduledAt);
        const bEnd   = new Date(bStart.getTime() + (b.durationMinutes ?? 30) * 60_000);
        return slotDate >= bStart && slotDate < bEnd;
      });
      return { label, booked: isBooked };
    });
  };

  // ── Submit booking ───────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!selectedDoc || !selectedDate || !selectedTime) {
      setError('Please select a doctor, date, and time slot.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason for your visit.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      const scheduledAt = slotToDate(selectedDate.date, selectedTime);

      const payload = {
        doctorId:        selectedDoc.id,
        scheduledAt:     scheduledAt.toISOString(),
        durationMinutes: 30,
        type:            apptType,
        reasonForVisit:  reason.trim(),
        symptoms:        symptoms.trim() ? symptoms.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      };

      const r: any = await api.post('/appointments', payload);
      const appt = r?.data?.data ?? payload;
      const confirmed = {
        ...appt,
        doctorName:  `Dr. ${selectedDoc.firstName} ${selectedDoc.lastName}`,
        scheduledAt: scheduledAt.toISOString(),
        time:        selectedTime,
        date:        selectedDate.label,
        type:        apptType,
      };
      setBookedAppt(confirmed);
      setStep(4);
      onSuccess?.(confirmed);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? 'Booking failed. Please try again.';
      setError(msg);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,8,20,0.85)', backdropFilter:'blur(14px)', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:C.bg, borderRadius:20, width:'100%', maxWidth:step===1?700:560, border:`1px solid ${C.border}`, boxShadow:'0 32px 80px rgba(0,0,0,0.6)', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'24px 28px 20px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h2 style={{ color:C.txt, fontSize:20, fontWeight:800, margin:'0 0 4px' }}>
                {step===1?'🔍 Find a Doctor':step===2?'📅 Select Date & Time':step===3?'✏️ Confirm Booking':'🎉 Booking Confirmed!'}
              </h2>
              <p style={{ color:C.txt2, fontSize:13, margin:0 }}>
                {step===1?'Search from verified specialists':step===2?`Booking with Dr. ${selectedDoc?.firstName} ${selectedDoc?.lastName}`:step===3?'Review and confirm your appointment':'Your appointment has been booked'}
              </p>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, color:C.txt2, cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
          {step!==4&&(
            <div style={{ display:'flex', gap:6, marginTop:16 }}>
              {[1,2,3].map(s=>(
                <div key={s} style={{ flex:1, height:3, borderRadius:100, background:s<=step?C.teal:'rgba(255,255,255,0.08)', transition:'background 0.3s' }} />
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>

          {/* ── STEP 1: Doctor search ── */}
          {step===1&&(
            <>
              <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                <div style={{ flex:1, position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.txt2, fontSize:14 }}>🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, specialty, city…" style={{ ...inp, paddingLeft:36 }} autoFocus />
                </div>
                <select value={specialty} onChange={e=>setSpecialty(e.target.value)} style={{ ...inp, width:'auto', minWidth:160, cursor:'pointer' }}>
                  <option value="">All Specialties</option>
                  {SPECIALTIES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {searching?(
                <div style={{ textAlign:'center', padding:40, color:C.txt2 }}>
                  <div style={{ width:28, height:28, border:`2px solid ${C.tealGlow}`, borderTop:`2px solid ${C.teal}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
                  Searching doctors…
                </div>
              ):doctors.length===0?(
                <div style={{ textAlign:'center', padding:40, color:C.txt2 }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                  <p style={{ margin:'0 0 8px', fontWeight:600, color:C.txt }}>No verified doctors found</p>
                  <p style={{ margin:0, fontSize:12 }}>Try a different search term or specialty</p>
                </div>
              ):(
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {doctors.map((doc:any)=>(
                    <div
                      key={doc.id}
                      onClick={()=>{ setSelectedDoc(doc); setStep(2); }}
                      style={{ padding:'16px 18px', borderRadius:14, border:`1px solid ${C.border}`, background:C.card, cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'all 0.15s' }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor=C.teal)}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor=C.border)}
                    >
                      <div style={{ width:48, height:48, borderRadius:'50%', background:`linear-gradient(135deg,${C.tealDk},${C.teal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>👨‍⚕️</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:C.txt, marginBottom:4 }}>
                          Dr. {doc.firstName} {doc.lastName}
                          {doc.isVerified&&<span style={{ marginLeft:8, fontSize:10, background:'rgba(34,197,94,0.15)', color:C.green, border:'1px solid rgba(34,197,94,0.2)', padding:'2px 8px', borderRadius:100 }}>✓ Verified</span>}
                        </div>
                        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                          <span style={{ fontSize:12, color:C.txt2 }}>🩺 {doc.specialization??'General Medicine'}</span>
                          {doc.city&&<span style={{ fontSize:12, color:C.txt2 }}>📍 {doc.city}{doc.state?`, ${doc.state}`:''}</span>}
                          {doc.experienceYears&&<span style={{ fontSize:12, color:C.txt2 }}>⏱ {doc.experienceYears} yrs exp</span>}
                          {doc.languagesSpoken?.length>0&&<span style={{ fontSize:12, color:C.txt2 }}>🗣 {doc.languagesSpoken.slice(0,2).join(', ')}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        {doc.averageRating>0&&<div style={{ fontSize:13, fontWeight:700, color:C.amber, marginBottom:4 }}>★ {doc.averageRating.toFixed(1)}</div>}
                        {doc.consultationFee&&<div style={{ fontSize:13, color:C.teal, fontWeight:700 }}>₹{doc.consultationFee}</div>}
                        {doc.isAvailableOnline&&<div style={{ fontSize:10, color:C.green, marginTop:3 }}>● Online</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Date & Time ── */}
          {step===2&&selectedDoc&&(
            <>
              {/* Doctor summary bar */}
              <div style={{ padding:'14px 16px', borderRadius:12, border:`1px solid ${C.borderHi}`, background:C.tealGlow, display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg,${C.tealDk},${C.teal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👨‍⚕️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.txt }}>Dr. {selectedDoc.firstName} {selectedDoc.lastName}</div>
                  <div style={{ fontSize:12, color:C.txt2 }}>{selectedDoc.specialization??'General Medicine'}{selectedDoc.city?` · ${selectedDoc.city}`:''}</div>
                </div>
                <button onClick={()=>{ setSelectedDoc(null); setStep(1); }} style={{ background:'none', border:`1px solid ${C.border}`, color:C.txt2, cursor:'pointer', fontSize:12, padding:'4px 10px', borderRadius:6 }}>Change →</button>
              </div>

              {/* Consultation type */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:C.txt2, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Consultation Type</div>
                <div style={{ display:'flex', gap:8 }}>
                  {[
                    { v:'IN_PERSON',  l:'👤 In Person',  show:true },
                    { v:'TELECONSULT',l:'📹 Video Call',  show:selectedDoc.isAvailableOnline??true },
                  ].filter(t=>t.show).map(t=>(
                    <button key={t.v} onClick={()=>setApptType(t.v as any)} style={{ padding:'10px 18px', borderRadius:10, border:`1px solid ${apptType===t.v?C.teal:C.border}`, background:apptType===t.v?C.tealGlow:'transparent', color:apptType===t.v?C.teal:C.txt2, fontSize:13, fontWeight:apptType===t.v?700:400, cursor:'pointer', transition:'all 0.15s' }}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date picker */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:C.txt2, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Select Date</div>
                <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
                  {days.map((day,i)=>{
                    const isSunday = day.date.getDay()===0;
                    const sel = selectedDate?.label===day.label;
                    // Check if doctor has availability for this day
                    const hasAvail = availability.length===0 || availability.some(a=>a.dayOfWeek===day.date.getDay()&&a.isActive);
                    const disabled = isSunday||!hasAvail;
                    return (
                      <button key={i} onClick={()=>{ if(!disabled){ setSelectedDate(day); setSelectedTime(''); } }} disabled={disabled}
                        style={{ flexShrink:0, width:60, padding:'10px 6px', borderRadius:12, border:`1px solid ${sel?C.teal:C.border}`, background:sel?C.tealGlow:disabled?'transparent':C.card, color:sel?C.teal:disabled?C.txt3:C.txt, cursor:disabled?'not-allowed':'pointer', textAlign:'center', opacity:disabled?0.35:1, transition:'all 0.15s' }}>
                        <div style={{ fontSize:10, marginBottom:4 }}>{day.dayName}</div>
                        <div style={{ fontSize:14, fontWeight:700 }}>{day.date.getDate()}</div>
                        <div style={{ fontSize:10 }}>{day.date.toLocaleDateString('en-IN',{month:'short'})}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate&&(
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:C.txt2, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
                    Available Slots — {selectedDate.label}
                  </div>
                  {loadingAvail?(
                    <div style={{ color:C.txt2, fontSize:13, padding:16, textAlign:'center' }}>Loading availability…</div>
                  ):(
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                      {getSlotsForDate(selectedDate.date).map(({ label, booked })=>(
                        <button key={label} onClick={()=>!booked&&setSelectedTime(label)} disabled={booked}
                          style={{ padding:'9px 6px', borderRadius:10, border:`1px solid ${selectedTime===label?C.teal:booked?'rgba(255,255,255,0.05)':C.border}`, background:selectedTime===label?C.tealGlow:booked?'rgba(255,255,255,0.02)':'transparent', color:selectedTime===label?C.teal:booked?C.txt3:C.txt2, fontSize:12, fontWeight:selectedTime===label?700:400, cursor:booked?'not-allowed':'pointer', textAlign:'center', transition:'all 0.15s', position:'relative' }}>
                          {label}
                          {booked&&<div style={{ fontSize:8, color:C.txt3, marginTop:2 }}>Booked</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step===3&&selectedDoc&&selectedDate&&selectedTime&&(
            <>
              <div style={{ background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
                <div style={{ fontSize:11, color:C.txt2, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:14 }}>Appointment Summary</div>
                {[
                  { l:'Doctor',     v:`Dr. ${selectedDoc.firstName} ${selectedDoc.lastName}` },
                  { l:'Specialty',  v:selectedDoc.specialization??'General Medicine' },
                  { l:'Date',       v:selectedDate.label },
                  { l:'Time',       v:selectedTime },
                  { l:'Type',       v:apptType==='IN_PERSON'?'👤 In Person':apptType==='TELECONSULT'?'📹 Video Call':'🏠 Home Visit' },
                  { l:'Fee',        v:selectedDoc.consultationFee?`₹${selectedDoc.consultationFee}`:'To be confirmed' },
                  { l:'Location',   v:selectedDoc.clinicName??selectedDoc.city??'To be confirmed' },
                ].map(row=>(
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:13, color:C.txt2 }}>{row.l}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.txt }}>{row.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:C.txt2, fontWeight:700, letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:8 }}>Reason for Visit *</label>
                <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Chest pain, routine check-up, follow-up…" style={inp} autoFocus />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:11, color:C.txt2, fontWeight:700, letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:8 }}>Symptoms <span style={{ color:C.txt3, fontWeight:400, textTransform:'none' }}>(optional, comma-separated)</span></label>
                <input value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="e.g. Headache, fever, fatigue" style={inp} />
              </div>

              {error&&(
                <div style={{ padding:'10px 14px', borderRadius:9, marginBottom:16, background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:C.rose, fontSize:13 }}>
                  ⚠️ {error}
                </div>
              )}
            </>
          )}

          {/* ── STEP 4: Success ── */}
          {step===4&&bookedAppt&&(
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(34,197,94,0.1)', border:'2px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 20px', animation:'popIn 0.4s ease' }}>✅</div>
              <h3 style={{ color:C.txt, fontSize:20, fontWeight:800, margin:'0 0 8px' }}>Booking Confirmed!</h3>
              <p style={{ color:C.txt2, fontSize:14, margin:'0 0 24px' }}>Your appointment has been booked. The doctor will confirm it shortly.</p>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 20px', textAlign:'left', marginBottom:24 }}>
                {[
                  { l:'Doctor', v:bookedAppt.doctorName },
                  { l:'Date',   v:bookedAppt.date },
                  { l:'Time',   v:bookedAppt.time },
                  { l:'Type',   v:bookedAppt.type },
                  { l:'Status', v:'⏳ Pending Confirmation' },
                ].map(row=>(
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:13, color:C.txt2 }}>{row.l}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.txt }}>{row.v}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.tealDk},${C.teal})`, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Done →</button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step!==4&&(
          <div style={{ padding:'16px 28px', borderTop:`1px solid ${C.border}`, display:'flex', gap:10, justifyContent:'space-between', flexShrink:0 }}>
            <button onClick={()=>step>1?setStep(s=>(s-1) as any):onClose()} style={{ padding:'11px 24px', borderRadius:10, border:`1px solid ${C.border}`, background:'transparent', color:C.txt2, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {step===1?'Cancel':'← Back'}
            </button>

            {step===1&&(
              <button onClick={()=>selectedDoc&&setStep(2)} disabled={!selectedDoc}
                style={{ padding:'11px 32px', borderRadius:10, border:'none', background:selectedDoc?`linear-gradient(135deg,${C.tealDk},${C.teal})`:'rgba(255,255,255,0.06)', color:selectedDoc?'#fff':C.txt3, fontSize:14, fontWeight:700, cursor:selectedDoc?'pointer':'not-allowed', fontFamily:'inherit' }}>
                Next: Select Time →
              </button>
            )}
            {step===2&&(
              <button onClick={()=>selectedDate&&selectedTime&&setStep(3)} disabled={!selectedDate||!selectedTime}
                style={{ padding:'11px 32px', borderRadius:10, border:'none', background:(selectedDate&&selectedTime)?`linear-gradient(135deg,${C.tealDk},${C.teal})`:'rgba(255,255,255,0.06)', color:(selectedDate&&selectedTime)?'#fff':C.txt3, fontSize:14, fontWeight:700, cursor:(selectedDate&&selectedTime)?'pointer':'not-allowed', fontFamily:'inherit' }}>
                Next: Confirm →
              </button>
            )}
            {step===3&&(
              <button onClick={handleBook} disabled={booking||!reason.trim()}
                style={{ padding:'11px 32px', borderRadius:10, border:'none', background:(booking||!reason.trim())?'rgba(255,255,255,0.06)':`linear-gradient(135deg,${C.tealDk},${C.teal})`, color:(booking||!reason.trim())?C.txt3:'#fff', fontSize:14, fontWeight:700, cursor:(booking||!reason.trim())?'not-allowed':'pointer', fontFamily:'inherit' }}>
                {booking?'⟳ Booking…':'✓ Confirm Appointment'}
              </button>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
