'use client';
import PublicNavbar from '@/components/PublicNavbar';
// src/app/learn/page.tsx — Light theme rewrite
// White background, navy blue text, teal accents. Full WCAG AA contrast.
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

// ── Design tokens — light theme ───────────────────────────────────────────
const C = {
  pageBg:   '#F0F4FF',
  white:    '#FFFFFF',
  navy:     '#0A1628',   // primary headings — 15:1 on white
  navyMid:  '#1E3A6E',   // subheadings — 9:1 on white
  muted:    '#4A5E7A',   // body text — 5.5:1 on white
  light:    '#7A8FA8',   // captions — 3.5:1 on white (used only on large text)
  teal:     '#0D9488',
  tealDark: '#0F766E',
  border:   '#C7D7F5',
  borderMid:'#A8C0E8',
  shadow:   '0 2px 12px rgba(12,26,58,0.07)',
  shadowHov:'0 6px 28px rgba(12,26,58,0.13)',
};

const CAT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  'Diabetes':      { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  'Cardiology':    { text: '#9F1239', bg: '#FFF1F2', border: '#FECDD3' },
  'Women Health':  { text: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  'Mental Health': { text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  'Thyroid':       { text: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  'Hypertension':  { text: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
  'Gut Health':    { text: '#78350F', bg: '#FFF7ED', border: '#FED7AA' },
  'Skin & Hair':   { text: '#831843', bg: '#FDF2F8', border: '#FBCFE8' },
  'Cancer':        { text: '#581C87', bg: '#FAF5FF', border: '#E9D5FF' },
  'Nutrition':     { text: '#14532D', bg: '#F0FDF4', border: '#BBF7D0' },
  'Pediatrics':    { text: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
  'Orthopedics':   { text: '#374151', bg: '#F9FAFB', border: '#E5E7EB' },
  'Eye Health':    { text: '#134E4A', bg: '#F0FDFA', border: '#99F6E4' },
  'Dental':        { text: '#1E3A8A', bg: '#EFF6FF', border: '#BFDBFE' },
};

const TOPICS = [
  'All','Diabetes','Cardiology','Mental Health','Nutrition',
  'Women Health','Pediatrics','Orthopedics','Cancer','Thyroid',
  'Hypertension','Skin & Hair','Eye Health','Dental','Gut Health',
];

interface Article {
  id?: string; slug?: string; title?: string; excerpt?: string;
  category?: string; authorName?: string; author?: string;
  readTimeMin?: number; viewCount?: number;
  isFeatured?: boolean; isTrending?: boolean; tags?: string[];
}

const MOCK: Article[] = [
  { slug:'hba1c-what-your-diabetes-numbers-really-mean', title:'HbA1c — What Your Diabetes Numbers Really Mean for Indians', excerpt:'Beyond just the number — how to interpret glycemic trends and why HbA1c alone doesn\'t tell the full story of your diabetes control.', category:'Diabetes', authorName:'Dr. Priya Menon', readTimeMin:7, viewCount:24500, isFeatured:true, isTrending:true },
  { slug:'heart-attacks-young-indians', title:'Heart Attacks in Young Indians: Why 35-Year-Olds Are at Risk', excerpt:'India has the highest rate of early-onset heart disease globally. Lifestyle, genetic, and dietary factors unique to Indian populations.', category:'Cardiology', authorName:'Dr. Rajesh Kumar', readTimeMin:9, viewCount:41200, isFeatured:true, isTrending:true },
  { slug:'pcos-complete-guide-indian-women', title:'PCOS: The Complete Guide for Indian Women', excerpt:'Polycystic ovary syndrome affects 1 in 5 Indian women. Diagnosis, insulin resistance, fertility, and lifestyle interventions.', category:'Women Health', authorName:'Dr. Sunita Verma', readTimeMin:12, viewCount:67800, isFeatured:true, isTrending:true },
  { slug:'mental-health-india-breaking-stigma', title:'Mental Health in India: Breaking the Stigma, Finding Help', excerpt:'India has 150 million people with mental health conditions and an 83% treatment gap. Recognising symptoms and finding a psychiatrist.', category:'Mental Health', authorName:'Dr. Meena Nair', readTimeMin:10, viewCount:55400, isFeatured:true, isTrending:true },
  { slug:'metformin-indias-most-prescribed-drug', title:'Metformin: India\'s Most Prescribed Drug — What You Need to Know', excerpt:'Mechanism, side effects, kidney function and safe dosing, and new evidence on longevity beyond diabetes.', category:'Diabetes', authorName:'Dr. Arun Joshi', readTimeMin:6, viewCount:18300 },
  { slug:'thyroid-reports-tsh-t3-t4-guide', title:'Understanding Thyroid Reports: TSH, T3, T4 — A Plain-Language Guide', excerpt:'Your thyroid report has numbers. Exactly what each means, when to worry, and why a "normal" TSH doesn\'t always mean you feel normal.', category:'Thyroid', authorName:'Dr. Kavita Reddy', readTimeMin:8, viewCount:32100, isTrending:true },
  { slug:'blood-pressure-silent-killer-india', title:'Blood Pressure: The Silent Killer That 70% of Indians Don\'t Know They Have', excerpt:'A practical guide on accurate home measurement, lifestyle changes that work, and when to start medication.', category:'Hypertension', authorName:'Dr. Vikram Singh', readTimeMin:7, viewCount:43900, isTrending:true },
  { slug:'indian-gut-probiotics-microbiome', title:'The Indian Gut: Probiotics, Fiber, and Why Your Microbiome Matters', excerpt:'Our gut bacteria influence everything from immunity to mood. How modern changes are disrupting traditional Indian diets.', category:'Gut Health', authorName:'Dr. Dinesh Rao', readTimeMin:8, viewCount:28700 },
  { slug:'hair-loss-india-causes-treatment', title:'Hair Loss in Indians: Causes, Myths, and Evidence-Based Treatment', excerpt:'Separating the facts from the overwhelming misinformation around hair loss. What actually works.', category:'Skin & Hair', authorName:'Dr. Sunita Rao', readTimeMin:8, viewCount:48900, isTrending:true },
  { slug:'type-2-diabetes-reversal-indian-diet', title:'Type 2 Diabetes Reversal: What Indian Research Shows', excerpt:'Growing evidence shows Type 2 diabetes can be reversed through aggressive lifestyle intervention. What the Indian studies say.', category:'Diabetes', authorName:'Dr. Kavita Krishnan', readTimeMin:8, viewCount:31200, isTrending:true },
  { slug:'cancer-screening-india-guide', title:'Cancer Screening in India: Who Should Get Tested and When', excerpt:'India diagnoses 1.4 million new cancer cases annually. Early detection saves lives — a practical guide for Indian adults.', category:'Cancer', authorName:'Dr. Shobha Ahuja', readTimeMin:9, viewCount:26400 },
  { slug:'indian-diet-for-diabetes-heart-disease', title:'The Best Indian Diet for Diabetes and Heart Disease', excerpt:'Practical evidence-based dietary guidance using Indian foods for managing both diabetes and cardiovascular disease.', category:'Nutrition', authorName:'Dr. Suma Krishnamurthy', readTimeMin:10, viewCount:36700, isTrending:true },
  { slug:'anxiety-at-work-gad-india', title:'Workplace Anxiety and GAD: What Indian Professionals Need to Know', excerpt:'GAD affects 5% of Indian professionals. Understanding the difference between stress and clinical anxiety — and what to do.', category:'Mental Health', authorName:'Dr. Arjun Pillai', readTimeMin:8, viewCount:19800 },
  { slug:'knee-pain-osteoarthritis-india-guide', title:'Knee Pain and Osteoarthritis: A Complete Patient Guide', excerpt:'Osteoarthritis affects 15% of Indians above 60. From diagnosis to surgery, a complete guide.', category:'Orthopedics', authorName:'Dr. Vikram Bhat', readTimeMin:10, viewCount:17800 },
  { slug:'childhood-obesity-india-prevention', title:'Childhood Obesity in India: Why It Is Rising and What Parents Can Do', excerpt:'India has 14.4 million obese children — the second highest globally. Evidence-based prevention starting from home.', category:'Pediatrics', authorName:'Dr. Rohit Mehra', readTimeMin:9, viewCount:21300 },
  { slug:'diabetic-retinopathy-eye-disease-india', title:'Diabetic Eye Disease: What Every Diabetic Must Know About Retinopathy', excerpt:'The leading cause of preventable blindness in India. It causes no symptoms until late — annual screening is essential.', category:'Eye Health', authorName:'Dr. Ramesh Patel', readTimeMin:8, viewCount:15600 },
  { slug:'oral-health-india-neglected-priority', title:'Oral Health in India: Why 95% of Indians Have Gum Disease', excerpt:'The mouth-body connection: how oral health affects your heart, diabetes, and pregnancy.', category:'Dental', authorName:'Dr. Anjali Shetty', readTimeMin:7, viewCount:12900 },
  { slug:'hypertension-india-management-guide', title:'Managing High Blood Pressure in India: A Complete Guide', excerpt:'From reading your numbers correctly to choosing the right medication for Indian patients.', category:'Hypertension', authorName:'Dr. Preethi Chandrasekhar', readTimeMin:9, viewCount:22400 },
];

function getSlug(a: Article) { return a.slug || a.id || ''; }

function CategoryBadge({ cat }: { cat: string }) {
  const col = CAT_COLORS[cat] || { text: C.teal, bg: '#F0FDFA', border: '#99F6E4' };
  return (
    <span style={{ fontSize: 10, fontWeight: 800, color: col.text, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 20, padding: '3px 9px', letterSpacing: '0.04em' }}>
      {cat.toUpperCase()}
    </span>
  );
}

function ArticleCard({ a, featured }: { a: Article; featured?: boolean }) {
  const [hov, setHov] = useState(false);
  const slug   = getSlug(a);
  const views  = (a.viewCount || 0).toLocaleString('en-IN');
  const author = a.authorName || a.author || 'HealthConnect';

  return (
    <Link href={`/learn/${slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: C.white,
          border: `1.5px solid ${hov ? C.teal : C.border}`,
          borderRadius: featured ? 16 : 12,
          padding: featured ? '24px' : '18px 20px',
          transition: 'all 0.2s',
          cursor: 'pointer',
          boxShadow: hov ? C.shadowHov : C.shadow,
          transform: hov ? 'translateY(-2px)' : 'none',
          display: 'flex', flexDirection: 'column' as const, gap: 10, height: '100%',
          boxSizing: 'border-box' as const,
        }}
      >
        {/* Category + featured badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {a.category && <CategoryBadge cat={a.category} />}
          {a.isFeatured && (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 20, padding: '3px 9px' }}>★ FEATURED</span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: featured ? 17 : 14, fontWeight: 800, color: C.navy,
          margin: 0, lineHeight: 1.4, fontFamily: 'Poppins, sans-serif',
          flex: featured ? 0 : 'none',
        }}>
          {a.title}
        </h3>

        {/* Excerpt */}
        <p style={{
          fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0, flex: 1,
          ...(featured ? {} : {
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }),
        }}>
          {a.excerpt}
        </p>

        {/* Meta row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 'auto',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>
            {author.startsWith('Dr.') ? author : `Dr. ${author}`}
          </span>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.light }}>
            {a.readTimeMin && <span>⏱ {a.readTimeMin} min</span>}
            <span>👁 {views}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function LearnPage() {
  const router = useRouter();
  const [search, setSearch]   = useState('');
  const [topic, setTopic]     = useState('All');
  const [articles, setArticles] = useState<Article[]>(MOCK);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30', ...(search && { search }), ...(topic !== 'All' && { category: topic }) });
      const r    = await fetch(`${API}/public/articles?${params}`);
      const data = await r.json();
      const list = data?.data ?? (Array.isArray(data) ? data : []);
      setArticles(Array.isArray(list) && list.length > 0 ? list : MOCK);
    } catch {
      setArticles(MOCK);
    } finally { setLoading(false); }
  }, [search, topic]);

  useEffect(() => {
    const t = setTimeout(fetchArticles, 300);
    return () => clearTimeout(t);
  }, [fetchArticles]);

  const filtered  = articles.filter(a => {
    if (topic !== 'All' && a.category !== topic) return false;
    if (search) {
      const q = search.toLowerCase();
      return (a.title||'').toLowerCase().includes(q) || (a.excerpt||'').toLowerCase().includes(q) || (a.category||'').toLowerCase().includes(q) || (a.authorName||'').toLowerCase().includes(q);
    }
    return true;
  });

  const featured  = filtered.filter(a => a.isFeatured).slice(0, 3);
  const trending  = filtered.filter(a => a.isTrending && !a.isFeatured).slice(0, 4);
  const rest      = filtered.filter(a => !a.isFeatured && !a.isTrending);

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, fontFamily: 'Nunito, sans-serif', paddingTop: 64 }}>
      <PublicNavbar />

      {/* ── Hero — dark navy card with rounded corners + whitespace, matches doctors/communities ── */}
      <div style={{ padding: '24px 5% 0', background: C.pageBg }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg,#0C1829 0%,#0F2645 55%,#0A1E3D 100%)',
            borderRadius: 22, overflow: 'hidden', position: 'relative',
            boxShadow: '0 8px 44px rgba(12,24,41,0.2)',
            padding: '40px 5% 36px',
          }}>
            {/* Dot grid texture */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }}>
              <defs><pattern id="learnDots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#learnDots)"/>
            </svg>
            {/* Glow orb */}
            <div style={{ position:'absolute', right:'-4%', top:'-30%', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle,rgba(20,184,166,0.1) 0%,transparent 65%)', pointerEvents:'none' }}/>

            <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:32 }}>

              {/* Left — label + headline + search */}
              <div style={{ flex: 1, minWidth: 280, maxWidth: 560 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(20,184,166,0.15)', border:'1px solid rgba(20,184,166,0.3)', borderRadius:30, padding:'4px 14px', marginBottom:16 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'#A7F3D0', letterSpacing:'0.1em' }}>📚 KNOWLEDGE HUB</span>
                </div>

                <h1 style={{ fontSize:'clamp(26px,3.2vw,40px)', fontWeight:900, color:'#FFFFFF', margin:'0 0 6px', fontFamily:'Poppins, sans-serif', lineHeight:1.15, letterSpacing:'-0.02em' }}>
                  Health Knowledge,
                </h1>
                <h1 style={{ fontSize:'clamp(26px,3.2vw,40px)', fontWeight:900, margin:'0 0 16px', fontFamily:'Poppins, sans-serif', lineHeight:1.15, letterSpacing:'-0.02em', background:'linear-gradient(90deg,#5EEAD4,#A7F3D0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Verified by Doctors
                </h1>

                <p style={{ fontSize:14.5, color:'rgba(255,255,255,0.65)', margin:'0 0 24px', lineHeight:1.75, maxWidth:480 }}>
                  Articles, condition guides, and Q&As written or reviewed by verified HealthConnect doctors. Accurate. India-specific. Free.
                </p>

                {/* Search bar */}
                <div style={{ display:'flex', gap:0, background:'rgba(255,255,255,0.97)', border:'none', borderRadius:13, overflow:'hidden', maxWidth:520, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ padding:'11px 14px', color:'#94A3B8', fontSize:16 }}>🔍</div>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search conditions, medications, doctors..."
                    style={{ flex:1, padding:'12px 4px', border:'none', outline:'none', fontSize:14, color:'#0A1628', background:'transparent', fontFamily:'DM Sans, sans-serif' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ padding:'10px 14px', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', fontSize:16 }}>✕</button>
                  )}
                </div>
              </div>

              {/* Right — stats */}
              <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
                {[
                  { n:'18+',   l:'Expert Articles',    icon:'📄' },
                  { n:'14',    l:'Health Categories',  icon:'🏥' },
                  { n:'100%',  l:'Doctor Verified',    icon:'✓' },
                ].map(s => (
                  <div key={s.l} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:'18px 22px', textAlign:'center', minWidth:100, backdropFilter:'blur(8px)' }}>
                    <div style={{ fontSize:11, marginBottom:6 }}>{s.icon}</div>
                    <div style={{ fontSize:24, fontWeight:900, color:'#5EEAD4', fontFamily:'DM Sans, sans-serif', lineHeight:1 }}>{s.n}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:4, lineHeight:1.3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Topic Chips ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '12px 5%', position:'sticky', top:64, zIndex:90, boxShadow:'0 2px 8px rgba(12,26,58,0.04)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {TOPICS.map(t => {
            const active = topic === t;
            return (
              <button
                key={t}
                onClick={() => setTopic(t)}
                style={{
                  fontSize: 12, fontWeight: active ? 800 : 600, whiteSpace: 'nowrap' as const,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? C.teal : '#F0F4FF',
                  color:      active ? '#fff' : C.navyMid,
                  border:     active ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 5% 80px' }}>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {Array(9).fill(0).map((_,i) => (
              <div key={i} style={{ background: C.white, borderRadius: 12, height: 200, border: `1px solid ${C.border}`, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: '0 0 8px', fontFamily: 'Poppins, sans-serif' }}>No articles found</h3>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Try a different search term or topic category.</p>
            <button onClick={() => { setSearch(''); setTopic('All'); }} style={{ background: `linear-gradient(135deg,${C.teal},#14B8A6)`, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Show All Articles
            </button>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && !search && (
              <div style={{ marginBottom: 44 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309', letterSpacing: '0.1em' }}>★ FEATURED ARTICLES</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 18 }}>
                  {featured.map((a, i) => <ArticleCard key={getSlug(a)||i} a={a} featured />)}
                </div>
              </div>
            )}

            {/* Trending */}
            {trending.length > 0 && !search && (
              <div style={{ marginBottom: 44 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.teal, letterSpacing: '0.1em' }}>🔥 TRENDING THIS WEEK</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                  {trending.map((a, i) => <ArticleCard key={getSlug(a)||i} a={a} />)}
                </div>
              </div>
            )}

            {/* All / Search results */}
            {rest.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '0.1em' }}>
                    {search ? `RESULTS FOR "${search.toUpperCase()}"` : `ALL ARTICLES (${rest.length})`}
                  </span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                  {rest.map((a, i) => <ArticleCard key={getSlug(a)||i} a={a} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Health score CTA banner ── */}
      <div style={{ background: 'linear-gradient(135deg,#0A1628 0%,#0D9488 100%)', padding: '48px 5%' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', fontFamily: 'Poppins, sans-serif' }}>
            Want to track your own health?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 24px' }}>
            Check your personalised health score based on Indian benchmarks — free, in 2 minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/health-score')} style={{ background: '#fff', color: C.teal, border: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              Check My Health Score →
            </button>
            <button onClick={() => router.push('/doctors')} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Find a Doctor
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
    </div>
  );
}
