'use client';
// src/app/doctors/[id]/page.tsx — Public doctor profile page
// Shows full career, qualifications, reviews, availability, booking CTA
import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import BookAppointmentModal from '@/components/dashboard/BookAppointmentModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

interface Doctor {
  id: string; firstName: string; lastName: string;
  hcDoctorId?: string; verificationStatus?: string; isVerified?: boolean;
  specialization?: string; subSpecializations?: string[];
  qualification?: string[]; experienceYears?: number;
  bio?: string; careerJourney?: string;
  trainingHospitals?: string[]; hospitalAffiliations?: string[];
  awards?: string[]; publications?: number; medicalCouncil?: string; registrationYear?: number;
  clinicName?: string; clinicAddress?: string; city?: string; state?: string;
  profilePhotoUrl?: string; languagesSpoken?: string[];
  consultationFee?: number; teleconsultFee?: number;
  videoConsultFee?: number; audioConsultFee?: number;
  offersInPerson?: boolean; offersVideoConsult?: boolean; offersAudioConsult?: boolean;
  isAvailableOnline?: boolean; isAcceptingNewPatients?: boolean;
  averageRating?: number; totalReviews?: number; totalPatients?: number;
  profileViews?: number; featuredReview?: string; featuredPatientName?: string;
  recentReviews?: Review[];
}

interface Review {
  id: string; rating: number; title?: string; body?: string;
  authorName?: string; isVerified?: boolean; helpfulCount?: number; createdAt?: string;
}

const C = {
  pageBg: '#F0F4FF', white: '#FFFFFF', teal: '#0D9488', tealLight: '#14B8A6',
  navy: '#0A1628', navyMid: '#1E3A6E', muted: '#4A5E7A', light: '#7A8FA8',
  border: '#C7D7F5', shadow: '0 2px 14px rgba(12,26,58,0.08)',
  green: '#15803D', amber: '#B45309', blue: '#2563EB',
};

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#F59E0B' : '#E2EAF4' }}>★</span>
      ))}
    </span>
  );
}

export default function DoctorProfilePageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #C7D7F5', borderTop: '4px solid #0D9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <DoctorProfilePage />
    </Suspense>
  );
}

function DoctorProfilePage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const id           = params?.id as string;
  const openReview   = searchParams.get('review') === '1';

  const [doctor, setDoctor]   = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking]   = useState(false);
  const [showReview, setShowReview]     = useState(openReview);
  const [activeTab, setActiveTab]       = useState<'about'|'reviews'|'availability'>('about');

  // Review form
  const [rating, setRating]   = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [isAnon, setIsAnon]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API}/public/doctors/${id}`).then(r => r.json()),
      fetch(`${API}/public/doctors/${id}/reviews?limit=10`).then(r => r.json()),
    ]).then(([docData, revData]) => {
      setDoctor(docData?.data ?? null);
      const rl = revData?.data?.reviews ?? revData?.data ?? [];
      setReviews(Array.isArray(rl) ? rl : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const submitReview = async () => {
    if (rating === 0)           { alert('Please select a star rating.'); return; }
    if (reviewBody.length < 10) { alert('Please write at least 10 characters.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/patient/doctors/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',   // sends httpOnly cookie automatically
        body: JSON.stringify({ rating, title: reviewTitle, body: reviewBody, isAnonymous: isAnon }),
      });
      if (res.ok) { setReviewDone(true); }
      else { const d = await res.json(); alert(d?.message || 'Failed to submit review.'); }
    } catch { alert('Failed to submit review. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #C7D7F5', borderTop: `4px solid ${C.teal}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🩺</div>
        <h2 style={{ color: C.navy, fontFamily: 'Poppins, sans-serif', margin: 0 }}>Doctor not found</h2>
        <button onClick={() => router.push('/doctors')} style={{ background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back to Doctor Directory</button>
      </div>
    );
  }

  const verified   = doctor.verificationStatus === 'VERIFIED' || doctor.isVerified;
  const fullName   = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const initials   = (doctor.firstName[0] + doctor.lastName[0]).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, fontFamily: 'Nunito, sans-serif' }}>
      <PublicNavbar />

      {/* Back breadcrumb */}
      <div style={{ background: C.navy, padding: '8px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/doctors')} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>← All Doctors</button>
        <button onClick={() => setShowBooking(true)} style={{ background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Book Appointment</button>
      </div>

      {/* Hero card */}
      <div style={{ background: `linear-gradient(135deg,${C.navy} 0%,#0C3460 50%,#0D9488 100%)`, padding: '40px 5% 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', flexWrap: 'wrap', paddingBottom: 32 }}>

            {/* Avatar */}
            <div style={{ width: 100, height: 100, borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
              {doctor.profilePhotoUrl
                ? <img src={doctor.profilePhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : initials}
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'Poppins, sans-serif' }}>{fullName}</h1>
                {verified && <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(20,184,166,0.25)', color: '#5EEAD4', border: '1px solid rgba(20,184,166,0.4)', borderRadius: 20, padding: '3px 10px' }}>✓ HC Verified</span>}
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 8px' }}>{doctor.specialization}{doctor.experienceYears ? ` · ${doctor.experienceYears} years` : ''}</p>
              {doctor.clinicName && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>📍 {doctor.clinicName}{doctor.city ? `, ${doctor.city}` : ''}</p>}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {(doctor.averageRating ?? 0) > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <Stars rating={doctor.averageRating!} size={16} />
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{doctor.averageRating?.toFixed(1)} ({doctor.totalReviews} reviews)</div>
                  </div>
                )}
                {(doctor.totalPatients ?? 0) > 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>👥 {doctor.totalPatients?.toLocaleString('en-IN')} patients</div>}
                {doctor.hcDoctorId && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{doctor.hcDoctorId}</div>}
              </div>
            </div>

            {/* Book CTA */}
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '20px 24px', minWidth: 200, backdropFilter: 'blur(8px)' }}>
              {doctor.consultationFee && <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>₹{doctor.consultationFee}</div>}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>In-person consultation</div>
              <button onClick={() => setShowBooking(true)} style={{ width: '100%', background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Book Appointment →
              </button>
              {doctor.isAcceptingNewPatients !== false && <div style={{ fontSize: 11, color: '#5EEAD4', textAlign: 'center', marginTop: 8 }}>✓ Accepting new patients</div>}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {(['about','reviews','availability'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '14px 24px', background: 'none', border: 'none', borderBottom: activeTab === tab ? `3px solid ${C.tealLight}` : '3px solid transparent', color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 5% 60px' }}>

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            <div>
              {/* Bio */}
              {doctor.bio && (
                <div style={{ background: C.white, borderRadius: 14, padding: '24px', border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: C.navy, margin: '0 0 12px', fontFamily: 'Poppins, sans-serif' }}>About</h3>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, margin: 0 }}>{doctor.bio}</p>
                </div>
              )}

              {/* Career journey */}
              {doctor.careerJourney && (
                <div style={{ background: C.white, borderRadius: 14, padding: '24px', border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: C.navy, margin: '0 0 12px', fontFamily: 'Poppins, sans-serif' }}>Career Journey</h3>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, margin: 0 }}>{doctor.careerJourney}</p>
                </div>
              )}

              {/* Featured review */}
              {doctor.featuredReview && (
                <div style={{ background: 'linear-gradient(135deg,rgba(13,148,136,0.04),rgba(20,184,166,0.02))', border: `1px solid rgba(13,148,136,0.2)`, borderRadius: 14, padding: '24px', marginBottom: 20 }}>
                  <div style={{ fontSize: 32, color: `${C.teal}20`, lineHeight: 1, marginBottom: 4 }}>"</div>
                  <p style={{ fontSize: 15, color: C.navyMid, lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 12px' }}>{doctor.featuredReview}</p>
                  {doctor.featuredPatientName && <p style={{ fontSize: 12, color: C.teal, fontWeight: 700, margin: 0 }}>— {doctor.featuredPatientName}</p>}
                </div>
              )}

              {/* Qualifications */}
              {doctor.qualification && doctor.qualification.length > 0 && (
                <div style={{ background: C.white, borderRadius: 14, padding: '24px', border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: C.navy, margin: '0 0 14px', fontFamily: 'Poppins, sans-serif' }}>Qualifications</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {doctor.qualification.map(q => <span key={q} style={{ fontSize: 12, fontWeight: 700, color: C.blue, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 20, padding: '5px 12px' }}>{q}</span>)}
                  </div>
                </div>
              )}

              {/* Awards */}
              {doctor.awards && doctor.awards.length > 0 && (
                <div style={{ background: C.white, borderRadius: 14, padding: '24px', border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: C.navy, margin: '0 0 14px', fontFamily: 'Poppins, sans-serif' }}>Awards & Recognition</h3>
                  {doctor.awards.map(a => <div key={a} style={{ fontSize: 13, color: C.muted, padding: '6px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 10 }}><span style={{ color: '#F59E0B' }}>🏆</span>{a}</div>)}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Consult options */}
              <div style={{ background: C.white, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: C.navy, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Consultation Options</h3>
                {doctor.offersInPerson !== false && doctor.consultationFee && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.muted }}>🏥 In-person</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>₹{doctor.consultationFee}</span>
                  </div>
                )}
                {doctor.offersVideoConsult && doctor.videoConsultFee && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.muted }}>📹 Video consult</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>₹{doctor.videoConsultFee}</span>
                  </div>
                )}
                {doctor.offersAudioConsult && doctor.audioConsultFee && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ fontSize: 13, color: C.muted }}>📞 Audio consult</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>₹{doctor.audioConsultFee}</span>
                  </div>
                )}
                <button onClick={() => setShowBooking(true)} style={{ width: '100%', marginTop: 14, padding: '11px', background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  Book Now →
                </button>
              </div>

              {/* Training */}
              {doctor.trainingHospitals && doctor.trainingHospitals.length > 0 && (
                <div style={{ background: C.white, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: C.navy, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Training</h3>
                  {doctor.trainingHospitals.map(h => <div key={h} style={{ fontSize: 12, color: C.muted, padding: '4px 0', display: 'flex', gap: 8 }}><span>🎓</span>{h}</div>)}
                </div>
              )}

              {/* Languages */}
              {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 && (
                <div style={{ background: C.white, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: C.navy, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Languages</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {doctor.languagesSpoken.map(l => <span key={l} style={{ fontSize: 12, color: C.navyMid, background: '#EBF0FF', borderRadius: 20, padding: '4px 10px' }}>🌐 {l}</span>)}
                  </div>
                </div>
              )}

              {/* Stats */}
              {doctor.publications && doctor.publications > 0 && (
                <div style={{ background: C.white, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: C.navy, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Research</h3>
                  <div style={{ fontSize: 13, color: C.muted }}>📄 {doctor.publications} published papers</div>
                  {doctor.medicalCouncil && <div style={{ fontSize: 12, color: C.light, marginTop: 8 }}>Registered: {doctor.medicalCouncil}</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, margin: '0 0 4px', fontFamily: 'Poppins, sans-serif' }}>Patient Reviews</h2>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{doctor.totalReviews || 0} reviews · {doctor.averageRating?.toFixed(1) || '—'} average rating</p>
              </div>
              <button onClick={() => setShowReview(true)} style={{ background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Write a Review
              </button>
            </div>

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: C.white, borderRadius: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
                <p style={{ color: C.muted, fontSize: 14 }}>No reviews yet. Be the first to review {fullName}.</p>
                <button onClick={() => setShowReview(true)} style={{ marginTop: 16, background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Write a Review
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: C.white, borderRadius: 14, padding: '20px 24px', border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <Stars rating={r.rating} />
                        {r.title && <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 4 }}>{r.title}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        {r.isVerified && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)', borderRadius: 20, padding: '2px 8px' }}>✓ Verified visit</span>}
                        <span style={{ fontSize: 11, color: C.light }}>{r.authorName || 'Anonymous Patient'}</span>
                      </div>
                    </div>
                    {r.body && <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0 }}>{r.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {activeTab === 'availability' && (
          <div style={{ background: C.white, borderRadius: 14, padding: '24px', border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: '0 0 20px', fontFamily: 'Poppins, sans-serif' }}>Availability & Booking</h2>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              {doctor.isAvailableOnline && <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Available online</div>}
              {doctor.isAcceptingNewPatients !== false && <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Accepting new patients</div>}
            </div>
            <button onClick={() => setShowBooking(true)} style={{ background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              Book an Appointment →
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(10,22,40,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setShowReview(false); }}>
          <div style={{ background: C.white, borderRadius: 16, padding: '32px', width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(10,22,40,0.25)' }}>
            {reviewDone ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🙏</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: C.navy, margin: '0 0 8px', fontFamily: 'Poppins, sans-serif' }}>Thank you!</h3>
                <p style={{ fontSize: 14, color: C.muted, margin: '0 0 20px' }}>Your review has been submitted. It helps other patients find the right doctor.</p>
                <button onClick={() => setShowReview(false)} style={{ background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: 0, fontFamily: 'Poppins, sans-serif' }}>Review {fullName}</h3>
                  <button onClick={() => setShowReview(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: C.light, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: C.navyMid, display: 'block', marginBottom: 8 }}>Your rating *</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, color: s <= (hoverStar || rating) ? '#F59E0B' : '#E2EAF4', transition: 'color 0.1s' }}>★</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: C.navyMid, display: 'block', marginBottom: 6 }}>Title (optional)</label>
                  <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="e.g. Excellent diagnosis, very thorough" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.navy, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: C.navyMid, display: 'block', marginBottom: 6 }}>Your review * (min. 10 characters)</label>
                  <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} rows={4} placeholder="Share your experience with this doctor..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.navy, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted, marginBottom: 20, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} />
                  Post anonymously
                </label>

                <button onClick={submitReview} disabled={submitting} style={{ width: '100%', padding: '13px', background: submitting ? '#E2EAF4' : `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: submitting ? C.light : '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Booking Modal */}
      {showBooking && (
        <BookAppointmentModal
          preselectedDoctorId={id}
          onClose={() => setShowBooking(false)}
          onSuccess={() => {
            setShowBooking(false);
            router.push('/dashboard');
          }}
        />
      )}
    </div>
  );
}