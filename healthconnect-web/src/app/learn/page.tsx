'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Article {
  id?: string; _id?: string;
  title?: string; heading?: string;
  summary?: string; excerpt?: string; description?: string;
  category?: string; topic?: string;
  author?: string; author_name?: string; doctor_name?: string;
  author_specialization?: string;
  read_time?: number;
  views?: number; view_count?: number;
  is_featured?: boolean; featured?: boolean;
  tags?: string[];
  published_at?: string; created_at?: string;
  image?: string; thumbnail?: string;
}

const TOPICS = ['All','Diabetes','Cardiology','Mental Health','Nutrition','Women Health','Pediatrics','Orthopedics','Cancer','Thyroid','Hypertension','Skin & Hair','Eye Health','Dental','Gut Health'];
const CONTENT_TYPES = ['All Content','Articles','Doctor Q&A','Condition Guides','Drug Information','Research Summaries','Health Tips'];

const MOCK_ARTICLES: Article[] = [
  { id: 'a1', title: 'The Truth About HbA1c: What Your Diabetes Numbers Really Mean', summary: 'Beyond just the number — how to interpret glycemic trends, what "time in range" means, and why your HbA1c alone doesn\'t tell the full story of your diabetes control.', category: 'Diabetes', author: 'Dr. Priya Menon', author_specialization: 'Endocrinologist', read_time: 7, views: 24500, is_featured: true, tags: ['Diabetes','Blood Sugar','HbA1c','Type 2'] },
  { id: 'a2', title: 'Heart Attacks in Young Indians: Why 35-Year-Olds Are at Risk', summary: 'India has the highest rate of early-onset heart disease globally. Cardiologists explain the lifestyle, genetic, and dietary factors unique to Indian populations — and what you can do.', category: 'Cardiology', author: 'Dr. Rajesh Kumar', author_specialization: 'Interventional Cardiologist', read_time: 9, views: 41200, is_featured: true, tags: ['Heart Health','Prevention','Young Adults'] },
  { id: 'a3', title: 'PCOS: The Complete Guide for Indian Women', summary: 'Polycystic ovary syndrome affects 1 in 5 Indian women. This comprehensive guide covers diagnosis criteria, insulin resistance, fertility implications, and evidence-based lifestyle interventions.', category: 'Women Health', author: 'Dr. Sunita Verma', author_specialization: 'Gynecologist', read_time: 12, views: 67800, is_featured: true, tags: ['PCOS','Hormones','Fertility','Women'] },
  { id: 'a4', title: 'Metformin: India\'s Most Prescribed Drug — What You Need to Know', summary: 'From mechanism of action to side effects, the right dose for your kidney function, interactions with other medications, and new evidence on longevity beyond diabetes.', category: 'Diabetes', author: 'Dr. Arun Joshi', author_specialization: 'Diabetologist', read_time: 6, views: 18300, tags: ['Metformin','Medication','Diabetes'] },
  { id: 'a5', title: 'Understanding Thyroid Reports: TSH, T3, T4 — A Plain-Language Guide', summary: 'Your thyroid report has numbers. This guide explains exactly what each one means, when to worry, and why your TSH being "normal" doesn\'t always mean you feel normal.', category: 'Thyroid', author: 'Dr. Kavita Reddy', author_specialization: 'Endocrinologist', read_time: 8, views: 32100, tags: ['Thyroid','TSH','Lab Reports'] },
  { id: 'a6', title: 'Mental Health in India: Breaking the Stigma, Finding Help', summary: 'India has 150 million people with mental health conditions and a treatment gap of 83%. This guide walks through recognizing symptoms, available treatments, and finding a psychiatrist.', category: 'Mental Health', author: 'Dr. Meena Nair', author_specialization: 'Psychiatrist', read_time: 10, views: 55400, tags: ['Mental Health','Depression','Anxiety','Stigma'] },
  { id: 'a7', title: 'The Indian Gut: Probiotics, Fiber, and Why Your Microbiome Matters', summary: 'Our gut bacteria influence everything from immunity to mood. Indian diets have traditionally been probiotic-rich — but modern changes are disrupting this. Here\'s the science and what to eat.', category: 'Gut Health', author: 'Dr. Dinesh Rao', author_specialization: 'Gastroenterologist', read_time: 8, views: 28700, tags: ['Gut Health','Probiotics','Diet'] },
  { id: 'a8', title: 'Blood Pressure: The Silent Killer That 70% of Indians Don\'t Know They Have', summary: 'Hypertension causes no symptoms until it causes a stroke. A practical guide on accurate home measurement, lifestyle changes that work, and when to start medication.', category: 'Hypertension', author: 'Dr. Vikram Singh', author_specialization: 'Cardiologist', read_time: 7, views: 43900, tags: ['Blood Pressure','Hypertension','Prevention'] },
];

const TopicChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{ fontSize: 11, fontWeight: 700, background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#38BDF8' : 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{label}</button>
);

const ArticleCard = ({ a, featured }: { a: Article; featured?: boolean }) => {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const title = a.title || a.heading || '';
  const summary = a.summary || a.excerpt || a.description || '';
  const author = a.author || a.author_name || a.doctor_name || 'HealthConnect';
  const views = (a.views || a.view_count || 0).toLocaleString('en-IN');

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/learn/${a.id}`)}
      style={{ background: hovered ? 'rgba(56,189,248,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hovered ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: featured ? 16 : 12, padding: featured ? '24px' : '18px', transition: 'all 0.25s', cursor: 'pointer', transform: hovered ? 'translateY(-2px)' : 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        {a.category && <span style={{ fontSize: 9, fontWeight: 800, color: '#38BDF8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>{a.category}</span>}
        {a.is_featured && <span style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>★ FEATURED</span>}
      </div>
      <h3 style={{ fontSize: featured ? 16 : 14, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.4, fontFamily: 'Poppins, sans-serif' }}>{title}</h3>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0, ...(featured ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }) }}>{summary}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ color: '#38BDF8', fontWeight: 700 }}>Dr. {author.replace('Dr. ', '')}</span>
          {a.author_specialization && <span style={{ opacity: 0.6 }}> · {a.author_specialization}</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>
          {a.read_time && <span>⏱ {a.read_time} min</span>}
          <span>👁 {views}</span>
        </div>
      </div>
    </div>
  );
};

export default function LearnPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All');
  const [contentType, setContentType] = useState('All Content');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20', ...(search && { search }), ...(topic !== 'All' && { category: topic }) });
      const r = await fetch(`/api/public/articles?${params}`);
      const data = await r.json();
      const list = data?.data?.articles || data?.articles || data?.data || (Array.isArray(data) ? data : []);
      setArticles(Array.isArray(list) && list.length ? list : MOCK_ARTICLES);
    } catch { setArticles(MOCK_ARTICLES); }
    finally { setLoading(false); }
  }, [search, topic]);

  useEffect(() => { const t = setTimeout(fetchArticles, 400); return () => clearTimeout(t); }, [search, topic]);

  const filtered = articles.filter(a => {
    if (search) { const q = search.toLowerCase(); return (a.title || '').toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q) || (a.author || '').toLowerCase().includes(q); }
    if (topic !== 'All' && a.category !== topic) return false;
    return true;
  });

  const featured = filtered.filter(a => a.is_featured || a.featured).slice(0, 3);
  const rest = filtered.filter(a => !a.is_featured && !a.featured);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050C14 0%,#071525 100%)', fontFamily: 'Nunito, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,12,20,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(56,189,248,0.12)', padding: '12px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#38BDF8,#0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>H</div>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'Poppins, sans-serif' }}>HealthConnect</span>
        </button>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'linear-gradient(135deg,#38BDF8,#0891B2)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>My Dashboard</button>
      </nav>

      <div style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.07),rgba(8,145,178,0.04))', borderBottom: '1px solid rgba(56,189,248,0.1)', padding: '40px 5% 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 30, padding: '4px 12px', marginBottom: 14 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#38BDF8', letterSpacing: '0.1em' }}>📚 KNOWLEDGE HUB</span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3.5vw,40px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', fontFamily: 'Poppins, sans-serif' }}>Health Knowledge, Verified by Doctors</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px', lineHeight: 1.6 }}>Articles, condition guides, drug information, and Q&As — all written or reviewed by verified HealthConnect doctors.</p>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(56,189,248,0.3)', borderRadius: 12, padding: '6px 8px', maxWidth: 600 }}>
            <span style={{ fontSize: 16, padding: '4px 4px 4px 8px', opacity: 0.5 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles, conditions, medications, doctors..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#fff', padding: '4px 0' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 5%' }}>
        {/* Topic chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', overflowX: 'auto', marginBottom: 28, paddingBottom: 4 }}>
          {TOPICS.map(t => <TopicChip key={t} label={t} active={topic === t} onClick={() => setTopic(t)} />)}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {Array(8).fill(0).map((_, i) => <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, height: 200 }} />)}
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#38BDF8', letterSpacing: '0.1em', marginBottom: 14 }}>★ FEATURED ARTICLES</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
                  {featured.map((a, i) => <ArticleCard key={a.id || i} a={a} featured />)}
                </div>
              </div>
            )}
            {/* All articles */}
            {rest.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 14 }}>ALL ARTICLES</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
                  {rest.map((a, i) => <ArticleCard key={a.id || i} a={a} />)}
                </div>
              </div>
            )}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>No articles found</div>
                <button onClick={() => { setSearch(''); setTopic('All'); }} style={{ background: '#38BDF8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Show All Articles</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
