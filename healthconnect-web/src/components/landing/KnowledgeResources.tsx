'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';

type Article={
  cat:string;
  title:string;
  summary:string;
  href:string;
  photo?:string;
  visual?:'cardio';
  color:string;
  tint:string;
  border:string;
};

const ARTICLES:Article[]=[
  {cat:'Diabetes',title:'HbA1c — What Your Diabetes Numbers Really Mean for Indians',summary:'Understand what the number represents and prepare better questions for your next consultation.',href:'/learn/hba1c-what-your-diabetes-numbers-really-mean',photo:'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=86',color:'#2459C4',tint:'#D7E4F2',border:'#AFC6E0'},
  {cat:'Cardiology',title:'Why Heart Attacks in Young Indians Are Rising',summary:'Learn common risk factors, warning signs and what to discuss with a healthcare professional.',href:'/learn/heart-attacks-young-indians',visual:'cardio',color:'#B4234D',tint:'#EBD5DB',border:'#D7ABB8'},
  {cat:'Women Health',title:'PCOD & PCOS: A Guide for Indian Women',summary:'Understand common patterns and the care conversations that can make the condition easier to navigate.',href:'/learn/pcos-complete-guide-indian-women',photo:'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=86',color:'#6D45C6',tint:'#E1D8EF',border:'#C7B7E0'},
  {cat:'Mental Health',title:'Managing Anxiety and Depression: Breaking the Stigma in India',summary:'Recognise common signs, know when to seek help and prepare for a more informed conversation.',href:'/learn/mental-health-india-breaking-stigma',photo:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=86',color:'#087D5A',tint:'#D7E7DF',border:'#AFCFBE'},
];

function CardioVisual(){
  return <div className="knowledge-cardio" role="img" aria-label="Cardiology and ECG illustration">
    <svg viewBox="0 0 680 320" aria-hidden="true">
      <defs>
        <linearGradient id="heartBg" x1="0" x2="1"><stop offset="0" stopColor="#6F1737"/><stop offset="1" stopColor="#B4234D"/></linearGradient>
      </defs>
      <rect width="680" height="320" rx="18" fill="url(#heartBg)"/>
      <path d="M0 168h112l25-38 38 84 42-120 43 136 34-62h77l28-41 39 73 28-32H680" fill="none" stroke="#FFDDE7" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity=".92"/>
      <path d="M341 242c-18-16-98-71-98-134 0-39 28-63 63-63 24 0 42 12 55 31 13-19 31-31 55-31 35 0 63 24 63 63 0 63-80 118-98 134l-20 17-20-17Z" fill="#F4A2B8" opacity=".28"/>
      <circle cx="566" cy="79" r="42" fill="#fff" opacity=".11"/>
      <circle cx="112" cy="248" r="68" fill="#fff" opacity=".07"/>
    </svg>
    <div className="knowledge-cardio-label"><span>HEART HEALTH</span><b>ECG · risk factors · prevention</b></div>
  </div>;
}

export default function KnowledgeResources(){
  const [start,setStart]=useState(0);
  const visible=useMemo(()=>[0,1,2].map(offset=>ARTICLES[(start+offset)%ARTICLES.length]),[start]);
  const previous=()=>setStart(current=>(current-1+ARTICLES.length)%ARTICLES.length);
  const next=()=>setStart(current=>(current+1)%ARTICLES.length);

  return <section className="knowledge-section" id="knowledge-hub" aria-labelledby="knowledge-title"><style>{`
    .knowledge-section{background:#C7D6E1;padding:50px 22px 54px;font-family:'DM Sans',Arial,sans-serif;border-top:1px solid #AFC2CF;color:#10243C}.knowledge-inner{max-width:1340px;margin:0 auto}.knowledge-head{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(320px,.72fr);gap:46px;align-items:end;margin:0 6px 22px}.knowledge-kicker{font-size:12.5px;font-weight:900;letter-spacing:.17em;color:#2459C4;margin-bottom:7px}.knowledge-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.9rem);line-height:1.04;letter-spacing:-.045em;color:#0B2236;margin:0;max-width:720px}.knowledge-head-right{max-width:500px}.knowledge-head-right p{font-size:15.5px;line-height:1.52;color:#294A60;margin:0 0 13px}.knowledge-head-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.knowledge-all{display:inline-flex;border:1px solid #244F70;background:#173F5B;border-radius:10px;padding:10px 14px;color:#fff;text-decoration:none;font-size:12.5px;font-weight:900;box-shadow:0 8px 18px rgba(20,54,78,.14)}.knowledge-all:hover{background:#1D4B69}.knowledge-all:focus-visible,.knowledge-arrow:focus-visible,.knowledge-card:focus-visible{outline:3px solid rgba(37,99,235,.26);outline-offset:3px}.knowledge-arrow{width:38px;height:38px;border-radius:50%;border:1px solid #93AABA;background:#E8EFF4;color:#17384A;font-size:19px;cursor:pointer}.knowledge-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.knowledge-card{text-decoration:none;color:inherit;border:1px solid var(--card-border);border-radius:20px;overflow:hidden;background:var(--card-tint);transition:.18s;box-shadow:0 12px 28px rgba(15,23,42,.09);position:relative}.knowledge-card:before{content:'';position:absolute;left:0;right:0;top:0;height:5px;background:var(--card-accent);z-index:3}.knowledge-card:hover{transform:translateY(-3px);box-shadow:0 18px 35px rgba(15,23,42,.14)}.knowledge-photo{aspect-ratio:16/8.4;background-size:cover;background-position:center;position:relative;background-color:#D8E1E7}.knowledge-photo:after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(15,23,42,.20),transparent 58%)}.knowledge-cardio{aspect-ratio:16/8.4;position:relative;overflow:hidden;background:#7C193A}.knowledge-cardio svg{width:100%;height:100%;display:block}.knowledge-cardio-label{position:absolute;left:18px;bottom:15px;color:#fff;display:grid;gap:2px}.knowledge-cardio-label span{font-size:9px;letter-spacing:.13em;font-weight:900}.knowledge-cardio-label b{font-size:12px}.knowledge-body{padding:18px 18px 20px;min-height:188px;display:flex;flex-direction:column}.knowledge-cat{display:inline-flex;align-self:flex-start;font-size:11.5px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;padding:5px 8px;border-radius:999px;margin-bottom:9px;background:rgba(255,255,255,.70)}.knowledge-card h3{font-family:'Sora',sans-serif;font-size:17px;line-height:1.34;color:#10283C;margin:0 0 8px}.knowledge-summary{font-size:13.5px;line-height:1.5;color:#2F4D61;margin:0 0 14px}.knowledge-read{font-size:12.5px;font-weight:900;color:var(--card-accent);margin-top:auto}.knowledge-disclaimer{margin-top:16px;padding:12px 14px;background:#B8C9D5;border:1px solid #9EB4C2;border-radius:12px;color:#29465A;font-size:12.5px;line-height:1.45}.knowledge-disclaimer strong{color:#173247}
    @media(max-width:980px){.knowledge-head{grid-template-columns:1fr;gap:11px}.knowledge-grid{grid-template-columns:1fr 1fr}.knowledge-card:last-child{display:none}}
    @media(max-width:650px){.knowledge-section{padding:42px 12px 46px}.knowledge-head{margin:0 4px 18px}.knowledge-title{font-size:2.15rem}.knowledge-grid{grid-template-columns:1fr}.knowledge-card:nth-child(n+2){display:none}.knowledge-head-right p{font-size:14.5px}.knowledge-card h3{font-size:17px}.knowledge-body{min-height:0}}
  `}</style><div className="knowledge-inner"><div className="knowledge-head"><div><div className="knowledge-kicker">KNOWLEDGE HUB</div><h2 className="knowledge-title" id="knowledge-title">Health information for better everyday decisions.</h2></div><div className="knowledge-head-right"><p>India-focused explainers help people understand common health topics and prepare better questions for a healthcare professional.</p><div className="knowledge-head-actions"><Link href="/learn" className="knowledge-all">Visit Knowledge Hub</Link><button className="knowledge-arrow" type="button" aria-label="Previous knowledge articles" onClick={previous}>‹</button><button className="knowledge-arrow" type="button" aria-label="Next knowledge articles" onClick={next}>›</button></div></div></div><div className="knowledge-grid" aria-live="polite">{visible.map(article=><Link href={article.href} className="knowledge-card" key={`${start}-${article.href}`} style={{'--card-tint':article.tint,'--card-border':article.border,'--card-accent':article.color} as CSSProperties}>{article.visual==='cardio'?<CardioVisual/>:<div className="knowledge-photo" style={{backgroundImage:`url(${article.photo})`}} role="img" aria-label={`${article.cat} health article`}/>}<div className="knowledge-body"><span className="knowledge-cat" style={{color:article.color}}>{article.cat}</span><h3>{article.title}</h3><p className="knowledge-summary">{article.summary}</p><span className="knowledge-read">Read article</span></div></Link>)}</div><div className="knowledge-disclaimer"><strong>Educational content supports informed conversations; it is not a diagnosis or personal treatment advice.</strong></div></div></section>;
}
