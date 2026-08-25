'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const COMMUNITY_SLIDES = [
  {
    eyebrow: 'HEALTH COMMUNITIES',
    title: 'You do not have to navigate it alone.',
    body: 'Join condition-focused spaces where people exchange lived experience, ask practical questions and support one another between appointments.',
    mode: 'people' as const,
  },
  {
    eyebrow: 'INSIDE A HEALTH COMMUNITY',
    title: 'Shared experience can make the next step feel clearer.',
    body: 'Follow condition-focused discussions, ask practical questions, learn from other members and use reporting and moderation controls when you need them.',
    mode: 'feed' as const,
  },
] as const;

const DOCTOR_SLIDES = [
  {
    eyebrow: 'FOR DOCTORS · PRACTICE & PATIENTS',
    title: 'Your patients and practice, in one connected view.',
    body: 'Bring patient relationships, availability, appointments and professional presence into one workspace built around the day-to-day practice journey.',
    mode: 'practice' as const,
  },
  {
    eyebrow: 'CONSULTATION & CONTINUITY',
    title: 'From booking to follow-up, without losing context.',
    body: 'Move from the appointment into patient-shared context, consultation and follow-up while keeping the next step visible inside the same professional workflow.',
    mode: 'continuity' as const,
  },
] as const;

function useCarousel(length: number, delay: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % length), delay);
    return () => window.clearInterval(timer);
  }, [delay, length, paused]);

  const previous = () => setIndex((current) => (current - 1 + length) % length);
  const next = () => setIndex((current) => (current + 1) % length);
  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStart.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStart.current == null) return;
    const end = event.changedTouches[0]?.clientX ?? touchStart.current;
    const diff = end - touchStart.current;
    if (Math.abs(diff) > 48) diff > 0 ? previous() : next();
    touchStart.current = null;
  };

  return { index, setIndex, setPaused, previous, next, onTouchStart, onTouchEnd };
}

type ControlsProps = {
  count: number;
  index: number;
  accent: string;
  label: string;
  previous: () => void;
  next: () => void;
  setIndex: (index: number) => void;
};

function CarouselControls({ count, index, accent, label, previous, next, setIndex }: ControlsProps) {
  return (
    <div className="story-controls">
      <button type="button" className="story-arrow" aria-label={`Previous ${label} story`} onClick={previous}>‹</button>
      <div className="story-dots">
        {Array.from({ length: count }).map((_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            aria-label={`Show ${label} story ${dotIndex + 1}`}
            className={`story-dot ${index === dotIndex ? 'active' : ''}`}
            style={index === dotIndex ? { background: accent, width: 24 } : undefined}
            onClick={() => setIndex(dotIndex)}
          />
        ))}
      </div>
      <button type="button" className="story-arrow" aria-label={`Next ${label} story`} onClick={next}>›</button>
    </div>
  );
}

function CommunityPeopleVisual() {
  return <div className="community-people-art" aria-hidden="true" />;
}

function CommunityFeedVisual() {
  return (
    <div className="community-feed-art" aria-hidden="true">
      <div className="community-feed-bg" />
      <div className="community-member member-one">
        <b>Anjali · Diabetes</b><span>Member experience</span><p>“What helped you stay consistent with evening walks?”</p>
      </div>
      <div className="community-member member-two">
        <b>Ramesh · Heart Health</b><span>Preparing for follow-up</span><p>“Which questions should I take to my next visit?”</p>
      </div>
      <div className="community-member member-three">
        <b>Meera · Thyroid Support</b><span>Shared routine</span><p>“It helps to hear what others track day to day.”</p>
      </div>
      <div className="community-phone">
        <div className="community-phone-top"><b>Living with Diabetes</b><span>Condition-focused community</span></div>
        <div className="community-post">
          <div className="community-post-head"><span className="community-avatar">AS</span><div><b>Anjali</b><span>2h ago · Shared experience</span></div></div>
          <p>Small routine changes have been easier when I can compare notes with people dealing with the same everyday challenges.</p>
          <div className="community-replies"><span>8 replies</span><span>Helpful</span></div>
        </div>
        <div className="community-post">
          <div className="community-post-head"><span className="community-avatar">RM</span><div><b>Ramesh</b><span>45m ago · Question</span></div></div>
          <p>I have a follow-up next week. What practical questions helped you make the most of yours?</p>
          <div className="community-replies"><span>5 replies</span><span>Follow</span></div>
        </div>
        <div className="community-moderation">Moderation, reporting and privacy controls are available throughout participation.</div>
      </div>
    </div>
  );
}

function DoctorPracticeVisual() {
  return <div className="doctor-photo-art" aria-hidden="true" />;
}

function DoctorContinuityVisual() {
  return (
    <div className="doctor-workflow-art" aria-hidden="true">
      <div className="doctor-desk">
        <div className="doctor-desk-top"><b>Today&apos;s Practice</b><span>Doctor workspace</span></div>
        <div className="doctor-desk-kpis">
          <div className="doctor-desk-kpi">Appointments<strong>12</strong></div>
          <div className="doctor-desk-kpi">Patients<strong>8</strong></div>
          <div className="doctor-desk-kpi">Follow-ups<strong>4</strong></div>
        </div>
        <div className="doctor-flow">
          <div className="doctor-step"><i>▣</i><b>Booking</b></div>
          <div className="doctor-step"><i>◉</i><b>Patient context</b></div>
          <div className="doctor-step"><i>✚</i><b>Consultation</b></div>
          <div className="doctor-step"><i>↻</i><b>Follow-up</b></div>
        </div>
        <div className="doctor-patient-row"><div><b>10:30 · Meena Iyer</b><span>Patient-shared context available</span></div><strong>Ready for consultation</strong></div>
        <div className="doctor-patient-row"><div><b>11:15 · Follow-up</b><span>Next-step reminder visible</span></div><strong>Continuity connected</strong></div>
      </div>
    </div>
  );
}

export default function CommunityBenefits() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const community = useCarousel(COMMUNITY_SLIDES.length, 7000);
  const doctor = useCarousel(DOCTOR_SLIDES.length, 7200);

  const openDoctor = () => {
    if (isAuthenticated && user) {
      const role = String(user.role || '').toUpperCase();
      router.push(role === 'DOCTOR' ? '/doctor-dashboard' : role === 'PATIENT' ? '/dashboard' : role === 'HOSPITAL' ? '/hospital-dashboard' : '/admin-dashboard');
      return;
    }
    try { sessionStorage.setItem('hc_signup_role', 'DOCTOR'); } catch {}
    openAuthModal('register');
  };

  const communitySlide = COMMUNITY_SLIDES[community.index];
  const doctorSlide = DOCTOR_SLIDES[doctor.index];

  return (
    <section className="product-stories">
      <style>{`
        .product-stories{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff}.product-story{padding:0 28px 82px}.product-story-shell{max-width:1380px;margin:0 auto}.product-story-head{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-bottom:22px}.product-story-head-copy{max-width:820px}.product-story-label{font-size:13px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px}.product-story-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.45rem,3.4vw,3.75rem);line-height:1.04;letter-spacing:-.05em;color:#0B2B45;margin:0}.product-story-head p{font-size:15.5px;line-height:1.62;color:#435B6C;max-width:470px;margin:0 0 4px}
        .story-carousel{position:relative;overflow:hidden;border-radius:28px;box-shadow:0 20px 50px rgba(25,61,80,.075)}.story-slide{position:relative;aspect-ratio:16/9;min-height:520px;overflow:hidden}.story-slide-inner{position:relative;z-index:3;height:100%;padding:46px 52px;display:flex;align-items:center}.story-copy{width:min(610px,48%);position:relative;z-index:5}.story-eyebrow{font-size:12.5px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px}.story-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.25rem,3vw,3.35rem);line-height:1.04;letter-spacing:-.045em;margin:0;color:#0B2B45}.story-copy>p{font-size:16px;line-height:1.64;color:#3F5668;margin:16px 0 20px;max-width:610px}.story-benefits{display:grid;grid-template-columns:1fr 1fr;gap:10px 22px}.story-benefit{padding-top:11px;border-top:1px solid currentColor}.story-benefit b{display:block;font-size:14px;color:#172F43;margin-bottom:3px}.story-benefit span{font-size:13.2px;line-height:1.46;color:#40586A}.story-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.story-primary{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;padding:12px 17px;font:900 13px 'DM Sans',Arial,sans-serif;text-decoration:none;cursor:pointer;color:#fff}.story-note{font-size:12.5px;line-height:1.45;margin-top:12px;color:#4D4158}.story-note strong{color:#33233F}
        .community-carousel{border:1px solid #DED1F2;background:#F6F1FF}.community-slide{background:linear-gradient(118deg,#F5EFFF 0%,#FBF9FF 47%,#F0E8FF 100%)}.community-slide:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 77% 47%,rgba(139,92,246,.18),transparent 35%)}.community-slide .story-copy{width:min(600px,46%)}.community-slide .story-eyebrow{color:#7C3AED}.community-slide .story-benefit{border-color:#D9C8EF}.community-slide .story-primary{background:#7C3AED}.community-people-art{position:absolute;right:2.5%;top:7%;bottom:7%;width:54%;background:url('/images/hc-community-approved.svg') center/contain no-repeat;z-index:2}.community-people-art:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(247,242,255,.74),rgba(247,242,255,.08) 30%,transparent 56%)}
        .community-feed-art{position:absolute;right:3%;top:8%;bottom:8%;width:55%;z-index:2}.community-feed-bg{position:absolute;inset:0;border-radius:26px;background:linear-gradient(145deg,#E8DDFF,#FBF9FF 54%,#EAE2FF);border:1px solid #DCCEF2}.community-phone{position:absolute;right:8%;top:8%;width:42%;bottom:8%;border:7px solid #251A35;border-radius:30px;background:#fff;overflow:hidden;box-shadow:0 20px 40px rgba(62,39,87,.18);z-index:4}.community-phone-top{padding:16px 15px 12px;border-bottom:1px solid #EEE7F7;background:#FAF7FF}.community-phone-top b{display:block;font-size:13px;color:#33213F}.community-phone-top span{font-size:11.5px;color:#7B6990}.community-post{padding:13px 14px;border-bottom:1px solid #EEE7F7}.community-post-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}.community-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#EEE4FF;color:#6D28D9;font-size:10.5px;font-weight:900}.community-post-head b{font-size:12px;color:#31213E}.community-post-head span{display:block;font-size:10.5px;color:#867593}.community-post p{font-size:11.5px;line-height:1.45;color:#4C4056;margin:0}.community-replies{display:flex;gap:10px;margin-top:9px;font-size:10.5px;color:#7352A6;font-weight:800}.community-moderation{padding:12px 14px;background:#F8F4FF;font-size:10.8px;line-height:1.42;color:#63536E}.community-member{position:absolute;width:190px;padding:13px 14px;border-radius:15px;background:rgba(255,255,255,.93);border:1px solid #E0D3F3;box-shadow:0 10px 24px rgba(75,45,104,.08);z-index:3}.member-one{left:5%;top:13%}.member-two{left:2%;top:43%}.member-three{left:8%;bottom:12%}.community-member b{display:block;font-size:12px;color:#352442}.community-member span{display:block;font-size:11px;color:#7C3AED;margin-top:2px}.community-member p{font-size:11px;line-height:1.4;color:#55475E;margin:7px 0 0}
        .doctor-carousel{border:1px solid #CFE0ED;background:#EFF6FC}.doctor-slide{background:linear-gradient(115deg,#EEF6FF 0%,#F8FBFE 49%,#EAF5FA 100%)}.doctor-slide:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 79% 50%,rgba(37,99,235,.12),transparent 37%)}.doctor-slide .story-copy{width:min(620px,47%)}.doctor-slide .story-eyebrow{color:#2563EB}.doctor-slide .story-benefit{border-color:#C8DAEA}.doctor-slide .story-primary{background:#2563EB}.doctor-photo-art{position:absolute;right:2.5%;top:5%;bottom:5%;width:57%;background:url('/images/hero-photo.png') right center/contain no-repeat;z-index:2}.doctor-photo-art:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(241,247,252,.88) 0%,rgba(241,247,252,.20) 28%,transparent 58%)}
        .doctor-workflow-art{position:absolute;right:3.5%;top:8%;bottom:8%;width:55%;z-index:2;border-radius:26px;background:linear-gradient(145deg,#E5F0FF,#F8FBFF 55%,#E2F2FA);border:1px solid #CADCEA;overflow:hidden;box-shadow:0 16px 38px rgba(38,83,126,.08)}.doctor-desk{position:absolute;left:6%;right:6%;top:8%;bottom:8%;border-radius:20px;background:rgba(255,255,255,.94);border:1px solid #D9E5EE;padding:18px}.doctor-desk-top{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #E6EEF4}.doctor-desk-top b{font-size:13px;color:#18374D}.doctor-desk-top span{font-size:11px;color:#718392}.doctor-desk-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:13px 0}.doctor-desk-kpi{border-radius:11px;background:#F1F6FB;padding:11px;color:#718493;font-size:10.8px}.doctor-desk-kpi strong{display:block;color:#2563EB;font-size:20px;margin-top:3px}.doctor-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;position:relative;margin-top:14px}.doctor-flow:before{content:'';position:absolute;left:11%;right:11%;top:25px;height:2px;background:#C3D8EC}.doctor-step{position:relative;z-index:2;text-align:center}.doctor-step i{width:50px;height:50px;border-radius:15px;background:#fff;border:1px solid #C9DCEB;display:grid;place-items:center;margin:0 auto 7px;font-style:normal;color:#2563EB;font-size:18px;box-shadow:0 7px 18px rgba(34,89,139,.07)}.doctor-step b{display:block;font-size:10.8px;color:#294559}.doctor-patient-row{margin-top:15px;border-radius:12px;background:#F7FAFD;border:1px solid #E1EAF1;padding:11px 12px;display:flex;justify-content:space-between;gap:12px;align-items:center}.doctor-patient-row b{font-size:11.5px;color:#294559}.doctor-patient-row span{display:block;font-size:10.5px;color:#718392}.doctor-patient-row strong{font-size:10.5px;color:#0B8F7C}
        .story-controls{position:absolute;left:50%;bottom:15px;transform:translateX(-50%);display:flex;align-items:center;gap:9px;z-index:8}.story-arrow{width:34px;height:34px;border-radius:50%;border:1px solid rgba(44,63,88,.18);background:rgba(255,255,255,.94);color:#17384A;font-size:17px;cursor:pointer;box-shadow:0 6px 16px rgba(24,69,77,.08)}.story-dots{display:flex;gap:6px}.story-dot{width:8px;height:8px;border:0;border-radius:999px;background:#C2CDD8;padding:0;cursor:pointer}.story-fade{animation:storyFade .38s ease both}@keyframes storyFade{from{opacity:.28;transform:translateY(4px)}to{opacity:1;transform:none}}
        @media(max-width:1080px){.product-story-head{align-items:flex-start;flex-direction:column}.product-story-head p{max-width:720px}.story-slide{aspect-ratio:auto;min-height:0}.story-slide-inner{min-height:700px;align-items:flex-start;padding-top:38px}.story-copy,.community-slide .story-copy,.doctor-slide .story-copy{width:100%;max-width:690px}.community-people-art,.community-feed-art,.doctor-photo-art,.doctor-workflow-art{top:auto;left:4%;right:4%;width:auto;bottom:68px;height:320px}.community-slide .story-slide-inner,.doctor-slide .story-slide-inner{padding-bottom:420px}}
        @media(max-width:720px){.product-story{padding:0 14px 66px}.product-story-head h2{font-size:2.55rem}.story-slide-inner{padding:30px 20px 400px}.story-benefits{grid-template-columns:1fr}.community-people-art,.community-feed-art,.doctor-photo-art,.doctor-workflow-art{height:300px;left:18px;right:18px;bottom:66px}.community-phone{width:48%}.community-member{width:155px;padding:10px}.member-three{display:none}.doctor-flow{grid-template-columns:repeat(2,1fr)}.doctor-flow:before{display:none}.doctor-desk{padding:13px}.doctor-desk-kpis{grid-template-columns:1fr 1fr}.doctor-desk-kpi:last-child{grid-column:1/-1}}
        @media(max-width:480px){.story-slide-inner{padding-bottom:380px}.community-people-art,.community-feed-art,.doctor-photo-art,.doctor-workflow-art{height:280px}.community-phone{right:4%;width:56%}.community-member{width:132px}.member-two{top:49%}.doctor-patient-row{display:none}.story-copy h3{font-size:2.2rem}}
      `}</style>

      <section className="product-story" id="health-communities-story">
        <div className="product-story-shell">
          <div className="product-story-head">
            <div className="product-story-head-copy"><div className="product-story-label" style={{ color: '#7C3AED' }}>Health Communities</div><h2>Support, shared experience and connection between visits.</h2></div>
            <p>Health Communities add human support around the care journey without pretending peer discussion replaces professional medical care.</p>
          </div>
          <div className="story-carousel community-carousel" onMouseEnter={() => community.setPaused(true)} onMouseLeave={() => community.setPaused(false)} onFocusCapture={() => community.setPaused(true)} onBlurCapture={() => community.setPaused(false)} onTouchStart={community.onTouchStart} onTouchEnd={community.onTouchEnd}>
            <div className="story-slide community-slide story-fade" key={community.index}>
              <div className="story-slide-inner">
                <div className="story-copy">
                  <div className="story-eyebrow">{communitySlide.eyebrow}</div><h3>{communitySlide.title}</h3><p>{communitySlide.body}</p>
                  <div className="story-benefits">
                    <div className="story-benefit"><b>People who understand</b><span>Learn from others living through similar everyday health challenges.</span></div>
                    <div className="story-benefit"><b>Support between visits</b><span>Stay connected while the next professional consultation may still be days away.</span></div>
                    <div className="story-benefit"><b>Condition-focused spaces</b><span>Join conversations relevant to diabetes, heart health, thyroid care, caregiving and more.</span></div>
                    <div className="story-benefit"><b>Safer participation</b><span>Moderation, reporting and privacy-aware controls support constructive discussion.</span></div>
                  </div>
                  <div className="story-actions"><Link href="/communities" className="story-primary">Explore Health Communities →</Link></div>
                  <div className="story-note"><strong>Peer support complements professional care.</strong> It does not replace diagnosis or treatment.</div>
                </div>
              </div>
              {communitySlide.mode === 'people' ? <CommunityPeopleVisual /> : <CommunityFeedVisual />}
              <CarouselControls count={COMMUNITY_SLIDES.length} index={community.index} accent="#7C3AED" label="community" previous={community.previous} next={community.next} setIndex={community.setIndex} />
            </div>
          </div>
        </div>
      </section>

      <section className="product-story" id="doctor-platform-story">
        <div className="product-story-shell">
          <div className="product-story-head">
            <div className="product-story-head-copy"><div className="product-story-label" style={{ color: '#2563EB' }}>Doctor Platform</div><h2>A connected professional workspace for the full practice journey.</h2></div>
            <p>Give doctors a clear view of patients, schedules and consultations while keeping the workflow connected from discovery through follow-up.</p>
          </div>
          <div className="story-carousel doctor-carousel" onMouseEnter={() => doctor.setPaused(true)} onMouseLeave={() => doctor.setPaused(false)} onFocusCapture={() => doctor.setPaused(true)} onBlurCapture={() => doctor.setPaused(false)} onTouchStart={doctor.onTouchStart} onTouchEnd={doctor.onTouchEnd}>
            <div className="story-slide doctor-slide story-fade" key={doctor.index}>
              <div className="story-slide-inner">
                <div className="story-copy">
                  <div className="story-eyebrow">{doctorSlide.eyebrow}</div><h3>{doctorSlide.title}</h3><p>{doctorSlide.body}</p>
                  <div className="story-benefits">
                    <div className="story-benefit"><b>My Patients</b><span>Keep patient relationships and patient-shared health context accessible in one workspace.</span></div>
                    <div className="story-benefit"><b>Practice & Schedule</b><span>Manage availability, appointment activity and follow-up without treating each as a separate tool.</span></div>
                    <div className="story-benefit"><b>Professional presence</b><span>Keep profile, specialty, consultation fee and availability aligned with public discovery.</span></div>
                    <div className="story-benefit"><b>Consultation continuity</b><span>Move from booking through consultation and keep the next step visible afterwards.</span></div>
                  </div>
                  <div className="story-actions"><button type="button" className="story-primary" onClick={openDoctor}>Explore Doctor Platform →</button></div>
                </div>
              </div>
              {doctorSlide.mode === 'practice' ? <DoctorPracticeVisual /> : <DoctorContinuityVisual />}
              <CarouselControls count={DOCTOR_SLIDES.length} index={doctor.index} accent="#2563EB" label="doctor" previous={doctor.previous} next={doctor.next} setIndex={doctor.setIndex} />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
