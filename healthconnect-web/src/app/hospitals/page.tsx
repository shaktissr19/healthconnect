'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Hospital {
  id?: string; _id?: string;
  name?: string; hospital_name?: string;
  city?: string; area?: string; pincode?: string;
  type?: string; hospital_type?: string;
  rating?: number; review_count?: number;
  beds?: number; total_beds?: number;
  specialties?: string[]; departments?: string[];
  has_opd?: boolean; has_icu?: boolean; has_emergency?: boolean;
  has_teleconsult?: boolean;
  is_ayushman?: boolean; ayushman_bharat?: boolean;
  is_verified?: boolean;
  phone?: string; image?: string;
}

const CITIES = ['All Cities','Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow','Chandigarh','Kochi'];
const TYPES = ['All Types','Government','Private','Trust/NGO','Speciality','Multi-Speciality','Teaching Hospital'];

const MOCK_HOSPITALS: Hospital[] = Array.from({ length: 9 }, (_, i) => ({
  id: `h${i}`, name: ['AIIMS New Delhi','Apollo Hospitals','Fortis Bangalore','Narayana Health','Manipal Hospitals','Max Healthcare Delhi','Kokilaben Mumbai','Medanta Gurgaon','Wockhardt Mumbai'][i],
  city: ['Delhi','Chennai','Bangalore','Bangalore','Manipal','Delhi','Mumbai','Gurgaon','Mumbai'][i],
  area: ['Ansari Nagar','Greams Road','Bannerghatta','Bommasandra','Tiger Circle','Saket','Andheri','Sector 38','Nagpada'][i],
  type: ['Government','Private','Private','Private','Private','Private','Private','Private','Private'][i],
  rating: [4.8,4.7,4.6,4.9,4.6,4.7,4.8,4.7,4.5][i],
  review_count: [8900,5400,3200,6700,2800,4100,5900,4800,2300][i],
  beds: [2478,500,350,1000,620,500,700,1250,350][i],
  specialties: [['Cardiology','Neurology','Oncology','Orthopedics'],['Cardiology','Transplant','Oncology'],['Ortho','Neurology','Gastro'],['Cardiac Surgery','Pediatrics','Trauma'],['Neurology','Orthopedics','Transplant'],['Oncology','Cardiology','Spine'],['Neurosurgery','Cardiac','Liver'],['Cardiology','Orthopedics','Cancer'],['Ortho','Cardio','Gynec']][i],
  has_opd: true, has_icu: true, has_emergency: i < 7,
  is_ayushman: [true,false,false,true,false,false,false,false,false][i],
  is_verified: true,
}));

const HospitalCard = ({ h }: { h: Hospital }) => {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const name = h.name || h.hospital_name || 'Hospital';
  const rating = h.rating || 4.0;
  const beds = h.beds || h.total_beds || 0;
  const specs = h.specialties || h.departments || [];

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hovered ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '20px', transition: 'all 0.25s', transform: hovered ? 'translateY(-2px)' : 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.2))', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'Poppins, sans-serif', marginBottom: 3 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>📍 {h.area}, {h.city} {h.pincode && `· ${h.pincode}`}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
            {h.type && <span style={{ fontSize: 9, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '2px 7px', fontWeight: 700 }}>{h.type}</span>}
            {h.is_ayushman && <span style={{ fontSize: 9, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '2px 7px', fontWeight: 700 }}>🏛 Ayushman</span>}
            {h.is_verified && <span style={{ fontSize: 9, color: '#14B8A6', background: 'rgba(20,184,166,0.1)', borderRadius: 10, padding: '2px 7px', fontWeight: 700 }}>✓ Verified</span>}
          </div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '5px 9px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#F59E0B' }}>★ {rating.toFixed(1)}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{(h.review_count || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12 }}>
        {beds > 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>🛏 {beds.toLocaleString('en-IN')} beds</span>}
        {h.has_emergency && <span style={{ fontSize: 11, color: '#F87171' }}>🚨 24/7 Emergency</span>}
        {h.has_icu && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>🫀 ICU</span>}
      </div>
      {/* Specialties */}
      {specs.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {specs.slice(0,4).map((s: string, i: number) => <span key={i} style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '2px 8px' }}>{s}</span>)}
          {specs.length > 4 && <span style={{ fontSize: 9.5, color: 'rgba(245,158,11,0.6)' }}>+{specs.length - 4} more</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button style={{ flex: 1, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>View Details</button>
        <button onClick={() => router.push('/register')} style={{ flex: 1, background: 'linear-gradient(135deg,#F59E0B,#F97316)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Book OPD</button>
      </div>
    </div>
  );
};

export default function HospitalsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All Cities');
  const [type, setType] = useState('All Types');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [ayushmanOnly, setAyushmanOnly] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', ...(search && { search }), ...(city !== 'All Cities' && { city }), ...(type !== 'All Types' && { type }), ...(ayushmanOnly && { ayushman: 'true' }) });
      const r = await fetch(`/api/public/hospitals?${params}`);
      const data = await r.json();
      const list = data?.data?.hospitals || data?.hospitals || data?.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length) setHospitals(list);
      else setHospitals(MOCK_HOSPITALS);
    } catch { setHospitals(MOCK_HOSPITALS); }
    finally { setLoading(false); }
  }, [search, city, type, ayushmanOnly]);

  useEffect(() => { const t = setTimeout(fetch_, 400); return () => clearTimeout(t); }, [search, city, type, ayushmanOnly]);

  const filtered = hospitals.filter(h => {
    if (search) { const q = search.toLowerCase(); if (!(h.name || '').toLowerCase().includes(q) && !(h.city || '').toLowerCase().includes(q) && !(h.area || '').toLowerCase().includes(q) && !(h.pincode || '').includes(q)) return false; }
    if (emergencyOnly && !h.has_emergency) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0C0A00 0%,#120F02 100%)', fontFamily: 'Nunito, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(12,10,0,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(245,158,11,0.15)', padding: '12px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#F59E0B,#F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>H</div>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'Poppins, sans-serif' }}>HealthConnect</span>
        </button>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'linear-gradient(135deg,#F59E0B,#F97316)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Dashboard</button>
      </nav>

      <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(249,115,22,0.04))', borderBottom: '1px solid rgba(245,158,11,0.12)', padding: '40px 5% 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 30, padding: '4px 12px', marginBottom: 14 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B', letterSpacing: '0.1em' }}>🏥 HOSPITAL NETWORK</span>
        </div>
        <h1 style={{ fontSize: 'clamp(22px,3.5vw,40px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', fontFamily: 'Poppins, sans-serif' }}>Find Hospitals Near You</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px' }}>340+ partner hospitals across India. Search by city, area, pincode, specialty, or facility type.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 900 }}>
          <div style={{ flex: '1 1 300px', display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '6px 8px' }}>
            <span style={{ fontSize: 16, padding: '4px 4px 4px 8px', opacity: 0.5 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hospital name, city, pincode, specialty..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#fff' }} />
          </div>
          <select value={city} onChange={e => setCity(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#fff', outline: 'none' }}>
            {CITIES.map(c => <option key={c} value={c} style={{ background: '#0C0A00' }}>{c}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#fff', outline: 'none' }}>
            {TYPES.map(t => <option key={t} value={t} style={{ background: '#0C0A00' }}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          {[{ label: '🏛 Ayushman Only', val: ayushmanOnly, set: setAyushmanOnly }, { label: '🚨 24/7 Emergency', val: emergencyOnly, set: setEmergencyOnly }].map(({ label, val, set }) => (
            <button key={label} onClick={() => set(!val)} style={{ fontSize: 11, fontWeight: 700, background: val ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${val ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`, color: val ? '#F59E0B' : 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '5px 12px', cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 5%' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>{loading ? 'Loading...' : `${filtered.length} hospitals found`}</div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {Array(9).fill(0).map((_, i) => <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, height: 240 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {filtered.map((h, i) => <HospitalCard key={h.id || i} h={h} />)}
          </div>
        )}
      </div>

      <div style={{ margin: '40px 5%', background: 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(249,115,22,0.05))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>List Your Hospital</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>Connect your hospital to 120,000+ patients. List departments, manage OPD, and accept Ayushman Bharat patients.</div>
        </div>
        <button onClick={() => router.push('/register?role=hospital')} style={{ background: 'linear-gradient(135deg,#F59E0B,#F97316)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>Register Your Hospital →</button>
      </div>
    </div>
  );
}
