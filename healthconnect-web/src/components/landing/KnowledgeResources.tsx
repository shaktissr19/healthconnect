'use client';

import Link from 'next/link';

const ARTICLES = [
  {
    cat:'Diabetes',
    title:'HbA1c — What Your Diabetes Numbers Really Mean for Indians',
    href:'/learn/hba1c-what-your-diabetes-numbers-really-mean',
    photo:'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=700&q=80',
    color:'#2563EB',
  },
  {
    cat:'Cardiology',
    title:'Why Heart Attacks in Young Indians Are Rising: What You Need to Know',
    href:'/learn/heart-attacks-young-indians',
    photo:'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=700&q=80',
    color:'#E11D48',
  },
  {
    cat:'Women Health',
    title:'PCOD & PCOS: The Complete Guide for Indian Women',
    href:'/learn/pcos-complete-guide-indian-women',
    photo:'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&q=80',
    color:'#7C3AED',
  },
  {
    cat:'Mental Health',
    title:'Managing Anxiety and Depression: Breaking the Stigma in India',
    href:'/learn/mental-health-india-breaking-stigma',
    photo:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80',
    color:'#059669',
  },
] as const;

export default function KnowledgeResources(){
  return <section className="knowledge-section">
    <style>{`
      .knowledge-section{background:#fff;padding:76px 28px;font-family:'DM Sans',Arial,sans-serif}.knowledge-inner{max-width:1280px;margin:0 auto}.knowledge-head{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:30px}.knowledge-kicker{font-size:11px;font-weight:850;letter-spacing:.17em;color:#2563EB;margin-bottom:10px}.knowledge-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3.2vw,3.6rem);line-height:1.05;letter-spacing:-.045em;color:#0F172A;margin:0}.knowledge-head-right{max-width:420px}.knowledge-head-right p{font-size:13px;line-height:1.7;color:#64748B;margin:0 0 13px}.knowledge-all{display:inline-flex;border:1px solid #2563EB;border-radius:9px;padding:9px 13px;color:#1D4ED8;text-decoration:none;font-size:10px;font-weight:900;letter-spacing:.04em}.knowledge-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.knowledge-card{text-decoration:none;color:inherit;border:1px solid #E1E8EF;border-radius:16px;overflow:hidden;background:#fff;transition:.18s;box-shadow:0 5px 18px rgba(15,23,42,.035)}.knowledge-card:hover{transform:translateY(-3px);box-shadow:0 14px 34px rgba(15,23,42,.08)}.knowledge-photo{height:148px;background-size:cover;background-position:center;position:relative}.knowledge-photo:after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(15,23,42,.18),transparent 56%)}.knowledge-body{padding:16px}.knowledge-cat{display:inline-flex;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px;margin-bottom:9px}.knowledge-card h3{font-family:'Sora',sans-serif;font-size:13px;line-height:1.45;color:#0F172A;margin:0 0 14px;min-height:57px}.knowledge-read{font-size:10px;font-weight:850;color:#2563EB}.knowledge-disclaimer{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-top:22px;padding:13px 15px;background:#F8FAFC;border:1px solid #E5EAF0;border-radius:11px;color:#64748B;font-size:10.5px;line-height:1.55}.knowledge-disclaimer strong{color:#334155}
      @media(max-width:980px){.knowledge-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:650px){.knowledge-section{padding:58px 16px}.knowledge-head{align-items:start;flex-direction:column}.knowledge-grid{grid-template-columns:1fr}.knowledge-card h3{min-height:0}.knowledge-disclaimer{align-items:start;flex-direction:column}}
    `}</style>
    <div className="knowledge-inner">
      <div className="knowledge-head"><div><div className="knowledge-kicker">KNOWLEDGE HUB</div><h2 className="knowledge-title">Health information that helps you ask better questions.</h2></div><div className="knowledge-head-right"><p>Explore health explainers and condition guides built for the Indian healthcare context. Knowledge content should support informed conversations with a clinician — not replace them.</p><Link href="/learn" className="knowledge-all">Visit Knowledge Hub →</Link></div></div>
      <div className="knowledge-grid">{ARTICLES.map(article=><Link href={article.href} className="knowledge-card" key={article.href}><div className="knowledge-photo" style={{backgroundImage:`url(${article.photo})`}}/><div className="knowledge-body"><span className="knowledge-cat" style={{color:article.color,background:`${article.color}12`}}>{article.cat}</span><h3>{article.title}</h3><span className="knowledge-read">Read article →</span></div></Link>)}</div>
      <div className="knowledge-disclaimer"><span><strong>Use knowledge as a starting point.</strong> Bring questions, symptoms and concerns to a qualified healthcare professional when you need personal medical guidance.</span><span>Educational content is not a diagnosis.</span></div>
    </div>
  </section>;
}
