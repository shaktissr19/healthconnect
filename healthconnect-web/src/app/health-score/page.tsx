'use client';
// src/app/health-score/page.tsx
// Shareable standalone health score quiz page.
// Light theme — white background, navy text.
// Result is shareable via WhatsApp/Twitter for organic acquisition.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUESTIONS = [
  { q: 'What is your age group?',              opts: ['Under 18','18–30','31–45','46–60','60+'] },
  { q: 'Do you have any chronic condition?',   opts: ['None','Diabetes','High BP','Heart condition','Other'] },
  { q: 'How often do you exercise?',           opts: ['Daily','3–5x/week','1–2x/week','Rarely','Never'] },
  { q: 'How many hours do you sleep?',         opts: ['8+ hours','7–8 hours','6–7 hours','5–6 hours','Under 5'] },
  { q: 'Do you take medications regularly?',   opts: ['No medications','Yes, always on time','Sometimes miss doses','Often miss doses'] },
  { q: 'How would you rate your stress level?',opts: ['Very low','Low','Moderate','High','Very high'] },
  { q: 'When was your last health checkup?',   opts: ['Last 3 months','3–6 months ago','6–12 months ago','Over a year ago','Never'] },
];

const WEIGHTS = [
  [85,82,78,72,65],
  [90,65,60,55,70],
  [95,88,75,55,40],
  [92,88,78,60,40],
  [88,92,72,50,50],
  [92,85,75,55,40],
  [90,82,70,55,40],
];

function calcScore(ans: number[]): number {
  let total = 0;
  ans.forEach((a, i) => { total += (WEIGHTS[i]?.[a] ?? 70); });
  return Math.round(Math.min(98, Math.max(30, total / QUESTIONS.length)));
}

const TIPS: Record<string, string[]> = {
  Diabetes:       ['Monitor HbA1c every 3 months','Track blood sugar daily','Eat low-glycaemic Indian foods like ragi and bajra'],
  'High BP':      ['Measure BP at the same time daily','Reduce salt to under 5g/day','Walk 30 minutes every day'],
  'Heart condition':['Never miss cardiology follow-ups','Know your lipid panel numbers','Avoid smoking and passive smoke'],
  None:           ['Get a full health checkup annually','Track your weight and waist circumference','Stay hydrated — 8 glasses daily'],
  Other:          ['Follow your specialist\'s advice','Track symptoms in your HealthConnect dashboard','Don\'t skip medications'],
};

const PARAMETER_LABELS = ['Age','Chronic Condition','Exercise','Sleep','Medication','Stress','Check-ups'];

export default function HealthScorePage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore]     = useState<number | null>(null);
  const [copied, setCopied]   = useState(false);

  const condition = answers[1] !== undefined ? QUESTIONS[1].opts[answers[1]] : 'None';
  const tips      = TIPS[condition] || TIPS['None'];

  const scoreColor = !score ? '#0D9488'
    : score >= 80 ? '#15803D'
    : score >= 60 ? '#B45309'
    : '#BE123C';

  const scoreLabel = !score ? ''
    : score >= 80 ? 'Excellent'
    : score >= 60 ? 'Fair'
    : 'Needs Attention';

  const scoreBg = !score ? '#F0FDF4'
    : score >= 80 ? '#F0FDF4'
    : score >= 60 ? '#FFFBEB'
    : '#FFF5F5';

  const choose = (optIdx: number) => {
    const newAns = [...answers, optIdx];
    setAnswers(newAns);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setScore(calcScore(newAns));
    }
  };

  const reset = () => { setStep(0); setAnswers([]); setScore(null); };

  const shareText = score
    ? `My HealthConnect India score is ${score}/100 — ${scoreLabel}! 🏥 Check your health score free at healthconnect.sbs/health-score`
    : '';

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  const shareTwitter  = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  const copyLink      = () => {
    navigator.clipboard.writeText('https://healthconnect.sbs/health-score');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const progress = score !== null ? 100 : ((step) / QUESTIONS.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', fontFamily: 'Nunito, sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#0A1628', padding: '14px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>H</div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'Poppins, sans-serif' }}>HealthConnect India</span>
        </button>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>My Dashboard</button>
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)', borderRadius: 30, padding: '5px 14px', marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#0D9488', letterSpacing: '0.1em' }}>✦ FREE HEALTH CHECK</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#0A1628', margin: '0 0 10px', fontFamily: 'Poppins, sans-serif', lineHeight: 1.2 }}>
            What's Your Health Score?
          </h1>
          <p style={{ fontSize: 14, color: '#4A5E7A', lineHeight: 1.7, margin: 0 }}>
            7 quick questions. Get a personalised score based on Indian health benchmarks.
          </p>
        </div>

        {/* Quiz card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #C7D7F5', boxShadow: '0 4px 24px rgba(12,26,58,0.08)', overflow: 'hidden' }}>

          {/* Progress bar */}
          <div style={{ height: 5, background: '#EFF3FB' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#0D9488,#14B8A6)', width: `${progress}%`, transition: 'width 0.4s ease', borderRadius: '0 3px 3px 0' }} />
          </div>

          <div style={{ padding: '32px' }}>

            {/* Question */}
            {score === null && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0D9488' }}>Question {step + 1} of {QUESTIONS.length}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {QUESTIONS.map((_, i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < step ? '#0D9488' : i === step ? '#14B8A6' : '#E2EAF4', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', margin: '0 0 24px', fontFamily: 'Poppins, sans-serif', lineHeight: 1.35 }}>
                  {QUESTIONS[step].q}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {QUESTIONS[step].opts.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      style={{
                        padding: '14px 18px', borderRadius: 12, border: '1.5px solid #C7D7F5',
                        background: '#F8FAFF', color: '#1E3A6E', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(13,148,136,0.07)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#0D9488';
                        (e.currentTarget as HTMLButtonElement).style.color = '#0A1628';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFF';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#C7D7F5';
                        (e.currentTarget as HTMLButtonElement).style.color = '#1E3A6E';
                      }}
                    >
                      {opt}
                      <span style={{ color: '#C7D7F5', fontSize: 16 }}>›</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Result */}
            {score !== null && (
              <div style={{ textAlign: 'center' }}>
                {/* Score ring */}
                <div style={{ width: 140, height: 140, borderRadius: '50%', border: `8px solid ${scoreColor}`, margin: '0 auto 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: scoreBg }}>
                  <div style={{ fontSize: 44, fontWeight: 900, color: scoreColor, lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>{score}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>/100</div>
                </div>

                <div style={{ fontSize: 22, fontWeight: 900, color: '#0A1628', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>{scoreLabel}</div>
                <p style={{ fontSize: 14, color: '#4A5E7A', margin: '0 0 28px', lineHeight: 1.6 }}>
                  {score >= 80
                    ? 'Great health habits! Keep maintaining your routine and get annual checkups.'
                    : score >= 60
                    ? 'Room for improvement. Small daily changes add up to big health gains.'
                    : 'Your health needs attention. A HealthConnect doctor can help you build a plan.'}
                </p>

                {/* Parameter breakdown */}
                <div style={{ background: '#F8FAFF', borderRadius: 12, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4A5E7A', letterSpacing: '0.08em', marginBottom: 12 }}>YOUR RESPONSES</div>
                  {QUESTIONS.map((q, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < QUESTIONS.length - 1 ? '1px solid #E8EFF8' : 'none' }}>
                      <span style={{ fontSize: 12, color: '#4A5E7A' }}>{PARAMETER_LABELS[i]}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0A1628' }}>{q.opts[answers[i]] ?? '—'}</span>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                <div style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 12, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0D9488', letterSpacing: '0.08em', marginBottom: 10 }}>PERSONALISED TIPS FOR YOU</div>
                  {tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: '#1E3A6E', lineHeight: 1.5 }}>
                      <span style={{ color: '#0D9488', flexShrink: 0 }}>✓</span>{tip}
                    </div>
                  ))}
                </div>

                {/* Share */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#4A5E7A', marginBottom: 10 }}>Share your score:</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={shareWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#25D366', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <span>📱</span> WhatsApp
                    </button>
                    <button onClick={shareTwitter} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#0A1628', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <span>𝕏</span> Twitter
                    </button>
                    <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#E8EFF8', color: '#1E3A6E', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {copied ? '✓ Copied!' : '🔗 Copy link'}
                    </button>
                  </div>
                </div>

                {/* CTAs */}
                <button onClick={() => router.push('/doctors')} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', marginBottom: 10 }}>
                  {score < 70 ? 'Book a Doctor Now →' : 'Find a Verified Doctor →'}
                </button>
                <button onClick={() => router.push('/')} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'none', border: '1.5px solid #C7D7F5', color: '#1E3A6E', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
                  Track Your Real Score on HealthConnect →
                </button>
                <button onClick={reset} style={{ background: 'none', border: 'none', color: '#7A8FA8', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                  Retake quiz
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trust note */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#7A8FA8', marginTop: 24, lineHeight: 1.6 }}>
          This assessment is based on Indian health benchmarks (ICMR, WHO India).<br/>
          It is not a medical diagnosis. Consult a HealthConnect doctor for personalised advice.
        </p>
      </div>
    </div>
  );
}
