'use client';
// src/app/learn/[slug]/page.tsx — Light theme article detail
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

const C = {
  pageBg: '#F0F4FF', white: '#FFFFFF',
  navy: '#0A1628', navyMid: '#1E3A6E', muted: '#4A5E7A', light: '#7A8FA8',
  teal: '#0D9488', tealDark: '#0F766E', border: '#C7D7F5', borderMid: '#A8C0E8',
  shadow: '0 2px 12px rgba(12,26,58,0.07)',
};

const CAT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  'Diabetes':     { text:'#1D4ED8', bg:'#EFF6FF', border:'#BFDBFE' },
  'Cardiology':   { text:'#9F1239', bg:'#FFF1F2', border:'#FECDD3' },
  'Women Health': { text:'#6D28D9', bg:'#F5F3FF', border:'#DDD6FE' },
  'Mental Health':{ text:'#065F46', bg:'#ECFDF5', border:'#A7F3D0' },
  'Thyroid':      { text:'#92400E', bg:'#FFFBEB', border:'#FDE68A' },
  'Hypertension': { text:'#991B1B', bg:'#FEF2F2', border:'#FECACA' },
  'Gut Health':   { text:'#78350F', bg:'#FFF7ED', border:'#FED7AA' },
  'Skin & Hair':  { text:'#831843', bg:'#FDF2F8', border:'#FBCFE8' },
  'Cancer':       { text:'#581C87', bg:'#FAF5FF', border:'#E9D5FF' },
  'Nutrition':    { text:'#14532D', bg:'#F0FDF4', border:'#BBF7D0' },
  'Pediatrics':   { text:'#1E40AF', bg:'#EFF6FF', border:'#BFDBFE' },
  'Orthopedics':  { text:'#374151', bg:'#F9FAFB', border:'#E5E7EB' },
  'Eye Health':   { text:'#134E4A', bg:'#F0FDFA', border:'#99F6E4' },
  'Dental':       { text:'#1E3A8A', bg:'#EFF6FF', border:'#BFDBFE' },
};

interface Article {
  id?: string; slug?: string; title?: string; excerpt?: string; body?: string;
  category?: string; authorName?: string; readTimeMin?: number; viewCount?: number;
  isFeatured?: boolean; tags?: string[]; publishedAt?: string; difficulty?: string;
}

// Full fallback articles
const FALLBACK: Record<string, Article> = {
  'hba1c-what-your-diabetes-numbers-really-mean': {
    slug:'hba1c-what-your-diabetes-numbers-really-mean',
    title:'HbA1c — What Your Diabetes Numbers Really Mean for Indians',
    excerpt:'Beyond just the number — how to interpret glycemic trends and why HbA1c alone doesn\'t tell the full story.',
    body:`## What Is HbA1c?

HbA1c (glycated haemoglobin) measures the percentage of haemoglobin coated with sugar over the past 2–3 months. It is the gold standard for assessing long-term diabetes control.

For most Indian adults with Type 2 diabetes, the target is **below 7%**.

## Why Indian Targets Differ

Indian patients tend to develop diabetes a decade earlier than Western counterparts. ICMR guidelines recommend:

- **Below 7.0%** — Ideal for most patients
- **7.0–7.5%** — Acceptable for moderate hypoglycaemia risk
- **7.5–8.0%** — Appropriate for elderly patients

## Time in Range: The Better Metric

HbA1c is an average — it misses glucose variability. A CGM measures "time in range" (TIR): what percentage of the day your glucose stays between 70–180 mg/dL. Target TIR is above 70%.

## Factors That Falsely Alter HbA1c

- **Iron deficiency anaemia** → falsely HIGH (very common in Indian women)
- **Haemoglobin variants** (HbS, HbC) → falsely LOW
- **Kidney disease** → unreliable — use fructosamine instead

## How Often Should You Test?

- Controlled diabetes: every 6 months
- Uncontrolled or newly diagnosed: every 3 months
- During pregnancy: monthly`,
    category:'Diabetes', authorName:'Dr. Priya Menon', readTimeMin:7, viewCount:24500, isFeatured:true, tags:['Diabetes','HbA1c','ICMR'], difficulty:'BEGINNER',
  },
  'heart-attacks-young-indians': {
    slug:'heart-attacks-young-indians',
    title:'Heart Attacks in Young Indians: Why 35-Year-Olds Are at Risk',
    excerpt:'India has the highest rate of early-onset heart disease globally. Lifestyle, genetic, and dietary factors unique to Indian populations.',
    body:`## The Scale of the Problem

India accounts for 60% of the world's heart disease burden despite having 17% of the world's population. Indians develop heart disease 10–15 years earlier than Western populations.

## Why Indians Are at Higher Risk

**Genetic factors:**
- Higher lipoprotein(a) levels
- Smaller coronary artery diameter relative to body size
- Higher tendency for central obesity at lower BMI
- Greater insulin resistance vs. Western populations

## Warning Signs Young Indians Miss

- Chest discomfort (pressure, squeezing) lasting more than 5 minutes
- Pain radiating to jaw, left arm, or back
- Unexplained shortness of breath

**Women often present atypically** — nausea, jaw pain, and extreme fatigue without chest pain.

## Prevention From Age 25

Get a lipid profile, fasting glucose, and blood pressure check from age 25 if you have family history. Target: LDL below 100 mg/dL, BP below 130/80, fasting glucose below 100 mg/dL.`,
    category:'Cardiology', authorName:'Dr. Rajesh Kumar', readTimeMin:9, viewCount:41200, isFeatured:true, tags:['Heart Health','Prevention','India'], difficulty:'BEGINNER',
  },
  'pcos-complete-guide-indian-women': {
    slug:'pcos-complete-guide-indian-women',
    title:'PCOS: The Complete Guide for Indian Women',
    excerpt:'Polycystic ovary syndrome affects 1 in 5 Indian women. Diagnosis, insulin resistance, fertility, and lifestyle interventions.',
    body:`## What Is PCOS?

PCOS is the most common endocrine disorder in women of reproductive age, affecting 20–22% of Indian women (FOGSI data).

Diagnosed with at least 2 of 3 Rotterdam Criteria:
1. Irregular or absent periods
2. Clinical signs of excess androgens (acne, hirsutism, hair loss)
3. Polycystic ovaries on ultrasound

## The Insulin Resistance Connection

Approximately 70% of women with PCOS have insulin resistance — even those who are not overweight. This is why Metformin helps many women with PCOS.

## PCOS and Fertility

70–80% of women with PCOS can conceive with appropriate treatment. Weight loss of just 5–10% in overweight patients often restores spontaneous ovulation.

## Long-term Health Risks

Women with PCOS have higher lifetime risk of: Type 2 diabetes (4–8x), metabolic syndrome, and endometrial cancer. Annual monitoring is essential.`,
    category:'Women Health', authorName:'Dr. Sunita Verma', readTimeMin:12, viewCount:67800, isFeatured:true, tags:['PCOS','Hormones','Fertility','FOGSI'], difficulty:'BEGINNER',
  },
};

function renderBody(body: string) {
  if (!body) return null;
  const elements: React.ReactNode[] = [];
  const lines = body.split('\n');
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: '36px 0 12px', fontFamily: 'Poppins, sans-serif', lineHeight: 1.3, borderBottom: `2px solid ${C.border}`, paddingBottom: 8 }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} style={{ fontSize: 17, fontWeight: 700, color: C.navyMid, margin: '24px 0 8px', fontFamily: 'Poppins, sans-serif' }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const item = line.slice(2);
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <span style={{ color: C.teal, fontWeight: 900, flexShrink: 0, marginTop: 2 }}>•</span>
          <span style={{ fontSize: 15, color: C.muted, lineHeight: 1.75 }}
            dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.navyMid};font-weight:700">$1</strong>`) }} />
        </div>
      );
    } else if (line.match(/^\d+\. /)) {
      const num  = line.match(/^(\d+)\./)?.[1];
      const text = line.replace(/^\d+\. /, '');
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <span style={{ color: '#fff', background: C.teal, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{num}</span>
          <span style={{ fontSize: 15, color: C.muted, lineHeight: 1.75 }}
            dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.navyMid};font-weight:700">$1</strong>`) }} />
        </div>
      );
    } else if (line.startsWith('| ') && line.includes(' | ')) {
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith('|')) {
        if (!lines[j].match(/^\|[\s:-]+\|/)) {
          rows.push(lines[j].split('|').filter(c => c.trim()).map(c => c.trim()));
        }
        j++;
      }
      i = j - 1;
      elements.push(
        <div key={key++} style={{ overflowX: 'auto', margin: '16px 0', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri === 0 ? C.pageBg : ri % 2 === 0 ? '#FAFBFF' : C.white }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '11px 16px', fontSize: 13, color: ri === 0 ? C.navyMid : C.muted, fontWeight: ri === 0 ? 700 : 400, borderBottom: `1px solid ${C.border}` }}
                    dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.navyMid};font-weight:700">$1</strong>`) }} />
                ))}
              </tr>
            ))}
          </table>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 6 }} />);
    } else {
      elements.push(
        <p key={key++} style={{ fontSize: 15, color: C.muted, lineHeight: 1.85, margin: '0 0 14px' }}
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.navyMid};font-weight:700">$1</strong>`) }} />
      );
    }
  }
  return elements;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug   = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API}/articles/${slug}`)
      .then(r => r.json())
      .then(data => {
        const a = data?.data ?? data;
        setArticle(a?.title ? a : (FALLBACK[slug] || null));
      })
      .catch(() => setArticle(FALLBACK[slug] || null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!article?.category) return;
    fetch(`${API}/public/articles?category=${encodeURIComponent(article.category)}&limit=4`)
      .then(r => r.json())
      .then(data => {
        const list = data?.data ?? (Array.isArray(data) ? data : []);
        setRelated((list as Article[]).filter((a: Article) => a.slug !== slug).slice(0, 3));
      })
      .catch(() => {});
  }, [article, slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: `4px solid ${C.border}`, borderTop: `4px solid ${C.teal}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>📄</div>
        <h2 style={{ color: C.navy, fontFamily: 'Poppins, sans-serif', margin: 0 }}>Article not found</h2>
        <button onClick={() => router.push('/learn')} style={{ background: `linear-gradient(135deg,${C.teal},#14B8A6)`, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ← Back to Knowledge Hub
        </button>
      </div>
    );
  }

  const catCol = CAT_COLORS[article.category || ''] || { text: C.teal, bg: '#F0FDFA', border: '#99F6E4' };

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, fontFamily: 'Nunito, sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#0A1628', padding: '13px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>H</div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'Poppins, sans-serif' }}>HealthConnect India</span>
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/learn')} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
            ← Knowledge Hub
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>My Dashboard</button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 5% 80px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 12, color: C.light, flexWrap: 'wrap' }}>
          <Link href="/learn" style={{ color: C.teal, textDecoration: 'none', fontWeight: 600 }}>Knowledge Hub</Link>
          <span>›</span>
          {article.category && (
            <>
              <span style={{ color: C.muted }}>{article.category}</span>
              <span>›</span>
            </>
          )}
          <span style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</span>
        </div>

        {/* Article card */}
        <article style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>

          {/* Category bar */}
          <div style={{ padding: '24px 32px 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {article.category && (
                <span style={{ fontSize: 11, fontWeight: 800, color: catCol.text, background: catCol.bg, border: `1px solid ${catCol.border}`, borderRadius: 20, padding: '4px 12px' }}>
                  {article.category.toUpperCase()}
                </span>
              )}
              {article.difficulty && (
                <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px' }}>
                  {article.difficulty}
                </span>
              )}
              {article.isFeatured && (
                <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 20, padding: '4px 12px' }}>★ FEATURED</span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 900, color: C.navy, margin: '0 0 14px', fontFamily: 'Poppins, sans-serif', lineHeight: 1.25 }}>
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p style={{ fontSize: 16, color: C.navyMid, lineHeight: 1.7, margin: '0 0 22px', fontStyle: 'italic', borderLeft: `3px solid ${C.teal}`, paddingLeft: 14 }}>
                {article.excerpt}
              </p>
            )}

            {/* Author meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${C.teal},#14B8A6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {(article.authorName || '?')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.teal }}>{article.authorName || 'HealthConnect Editorial'}</div>
                <div style={{ fontSize: 12, color: C.light }}>Verified HealthConnect Doctor</div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.light }}>
                {article.readTimeMin && <span>⏱ {article.readTimeMin} min</span>}
                {article.viewCount   && <span>👁 {article.viewCount.toLocaleString('en-IN')}</span>}
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {article.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: C.navyMid, background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 20, padding: '3px 10px' }}>#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '0 32px 32px' }}>
            {article.body ? renderBody(article.body) : (
              <p style={{ color: C.muted, fontStyle: 'italic', fontSize: 14 }}>Full article content loading from database…</p>
            )}
          </div>

          {/* Disclaimer */}
          <div style={{ margin: '0 32px 28px', padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6, margin: 0 }}>
              <strong>Medical Disclaimer:</strong> This article is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider about your health condition.
            </p>
          </div>

          {/* Book a doctor CTA */}
          <div style={{ margin: '0 32px 32px', background: `linear-gradient(135deg,rgba(13,148,136,0.06),rgba(20,184,166,0.03))`, border: `1px solid rgba(13,148,136,0.2)`, borderRadius: 14, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.navy, marginBottom: 4 }}>Have questions about your health?</div>
              <div style={{ fontSize: 13, color: C.muted }}>Book a consultation with a verified {article.category || 'specialist'} doctor on HealthConnect.</div>
            </div>
            <button onClick={() => router.push('/doctors')} style={{ background: `linear-gradient(135deg,${C.teal},#14B8A6)`, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Find a Doctor →
            </button>
          </div>
        </article>

        {/* Related articles */}
        {related.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '0.1em', marginBottom: 16 }}>
              MORE IN {(article.category || '').toUpperCase()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/learn/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px', cursor: 'pointer', boxShadow: C.shadow, transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 8 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: C.light }}>{r.readTimeMin} min · {r.authorName}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
