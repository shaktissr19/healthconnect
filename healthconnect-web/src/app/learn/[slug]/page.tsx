'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';
const C={navy:'#102F49',navy2:'#214E63',text:'#385469',muted:'#667D8B',teal:'#2F7D75',blue:'#315FEA',bg:'#D7E3E8',paper:'#F8FBFB',border:'#B9CAD2',sand:'#EDE3D4',sage:'#DFEAE3',lav:'#E8E3F0'};

type KnowledgeMeta={sourceName?:string|null;sourceUrl?:string|null;doi?:string|null;youtubeVideoId?:string|null;license?:string|null;evidenceLevel?:string|null;medicalRiskLevel?:string|null;countryRelevance?:string|null;keyTakeaways?:string[];reviewedBy?:string|null;reviewedAt?:string|null;nextReviewAt?:string|null;isHealthConnectOriginal?:boolean};
type Article={id:string;slug:string;title:string;body:string;excerpt?:string|null;coverImage?:string|null;type:string;category?:string|null;authorName?:string|null;readTimeMin?:number;publishedAt?:string|null;tags?:string[];knowledge?:KnowledgeMeta};
const unwrap=(r:any)=>r?.data??r;
const fmt=(v?:string|null)=>v?new Date(v).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'';

export default function KnowledgeDetailPage(){
  const params=useParams();
  const slug=String(params?.slug||'');
  const [article,setArticle]=useState<Article|null>(null);
  const [related,setRelated]=useState<Article[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!slug)return;
    let alive=true;
    fetch(`${API}/knowledge/items/${encodeURIComponent(slug)}`).then(r=>r.ok?r.json():Promise.reject()).then(payload=>{if(alive)setArticle(unwrap(payload));}).catch(()=>{if(alive)setArticle(null);}).finally(()=>{if(alive)setLoading(false);});
    return()=>{alive=false};
  },[slug]);

  useEffect(()=>{
    if(!article?.category)return;
    let alive=true;
    fetch(`${API}/knowledge/items?limit=5&category=${encodeURIComponent(article.category)}`).then(r=>r.ok?r.json():Promise.reject()).then(payload=>{const list=unwrap(payload);if(alive&&Array.isArray(list))setRelated(list.filter((x:Article)=>x.slug!==article.slug).slice(0,3));}).catch(()=>{});
    return()=>{alive=false};
  },[article?.category,article?.slug]);

  const youtubeId=article?.knowledge?.youtubeVideoId||null;
  const takeaways=article?.knowledge?.keyTakeaways||[];

  if(loading)return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:C.bg,color:C.muted}}>Loading Knowledge Hub…</div>;
  if(!article)return <div style={{minHeight:'100vh',background:C.bg}}><PublicNavbar/><div style={{maxWidth:780,margin:'80px auto',padding:30,textAlign:'center',background:'#fff',borderRadius:18,border:`1px solid ${C.border}`}}><h1 style={{color:C.navy}}>Knowledge item not found</h1><Link href="/learn" style={{color:C.teal,fontWeight:850}}>Back to Knowledge Hub</Link></div></div>;

  return <div style={{minHeight:'100vh',background:C.bg,color:C.navy,fontFamily:"'DM Sans',Arial,sans-serif"}}>
    <PublicNavbar/>
    <header style={{background:'linear-gradient(135deg,#DDE9ED 0%,#ECE6DC 100%)',borderBottom:`1px solid ${C.border}`}}><div style={{maxWidth:1120,margin:'0 auto',padding:'38px 22px 34px'}}><Link href="/learn" style={{textDecoration:'none',color:C.teal,fontSize:12,fontWeight:850}}>← Knowledge Hub</Link><div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap',marginTop:18}}><Badge>{article.category||'Health'}</Badge><Badge>{article.type==='VIDEO'?'VIDEO':article.type==='RESEARCH'?'LATEST EVIDENCE':'EXPLAINER'}</Badge>{article.knowledge?.countryRelevance&&<Badge>{article.knowledge.countryRelevance}</Badge>}</div><h1 style={{fontFamily:"'Sora','DM Sans',sans-serif",fontSize:'clamp(2rem,4vw,3.7rem)',lineHeight:1.06,letterSpacing:'-.052em',margin:'12px 0 12px',maxWidth:940}}>{article.title}</h1>{article.excerpt&&<p style={{fontSize:16,lineHeight:1.65,color:C.text,maxWidth:870,margin:'0 0 15px'}}>{article.excerpt}</p>}<div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:11.5,color:C.muted}}><span>{article.authorName||'HealthConnect Editorial'}</span>{article.readTimeMin&&<span>· {article.readTimeMin} min</span>}{article.publishedAt&&<span>· Published {fmt(article.publishedAt)}</span>}</div></div></header>

    <main style={{maxWidth:1120,margin:'0 auto',padding:'28px 22px 60px',display:'grid',gridTemplateColumns:'minmax(0,1fr) 310px',gap:24}} className="kd-layout">
      <article style={{background:C.paper,border:`1px solid ${C.border}`,borderRadius:20,overflow:'hidden',boxShadow:'0 12px 30px rgba(23,56,74,.07)'}}>
        {youtubeId?<div style={{background:'#0D1F2D',padding:12}}><div style={{position:'relative',paddingTop:'56.25%',borderRadius:13,overflow:'hidden',background:'#0B1B27'}}><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0`} title={article.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{position:'absolute',inset:0,width:'100%',height:'100%',border:0}}/></div><div style={{fontSize:10.5,color:'#BFD0DA',padding:'9px 4px 2px'}}>Embedded from the original YouTube publisher. HealthConnect does not download or re-host this video.</div></div>:article.coverImage?<div style={{height:330,background:`#CAD8DF url(${article.coverImage}) center/cover no-repeat`}}/>:null}
        <div style={{padding:'26px clamp(20px,4vw,42px) 36px'}}>
          {takeaways.length>0&&<section style={{background:C.sage,border:'1px solid #B9D0C2',borderRadius:14,padding:16,marginBottom:24}}><div style={{fontSize:11,fontWeight:900,letterSpacing:'1px',color:C.teal}}>KEY TAKEAWAYS</div><ul style={{margin:'10px 0 0',paddingLeft:20,color:C.text,fontSize:13,lineHeight:1.65}}>{takeaways.map((item,i)=><li key={i} style={{marginBottom:5}}>{item}</li>)}</ul></section>}
          <Body content={article.body}/>
        </div>
      </article>

      <aside style={{display:'grid',alignContent:'start',gap:13}}>
        <div style={{background:'#F3EEE6',border:'1px solid #D4C8B8',borderRadius:16,padding:16}}><div style={{fontSize:10.5,fontWeight:900,letterSpacing:'1px',color:'#8B5A43'}}>SOURCE & REVIEW</div><InfoRow label="Source" value={article.knowledge?.sourceName||'HealthConnect'}/>{article.knowledge?.evidenceLevel&&<InfoRow label="Evidence" value={article.knowledge.evidenceLevel}/>}<InfoRow label="Reviewed" value={article.knowledge?.reviewedAt?fmt(article.knowledge.reviewedAt):'Editorially curated'}/>{article.knowledge?.nextReviewAt&&<InfoRow label="Next review" value={fmt(article.knowledge.nextReviewAt)}/>} {article.knowledge?.sourceUrl&&<a href={article.knowledge.sourceUrl} target="_blank" rel="noreferrer" style={{display:'inline-flex',marginTop:12,textDecoration:'none',fontSize:11,fontWeight:850,color:C.navy2,border:'1px solid #CDBFAC',borderRadius:8,padding:'7px 9px',background:'#fff'}}>Open original source ↗</a>}</div>
        <div style={{background:'#D4E3E8',border:`1px solid ${C.border}`,borderRadius:16,padding:16}}><b style={{fontSize:12.5}}>Use Knowledge Hub to prepare, not self-diagnose.</b><p style={{fontSize:11.2,lineHeight:1.55,color:C.text,margin:'7px 0 0'}}>Health information can help you ask better questions. Personal diagnosis and treatment decisions belong with qualified healthcare professionals.</p></div>
        {related.length>0&&<div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:16,padding:15}}><div style={{fontSize:11,fontWeight:900,color:C.navy,marginBottom:10}}>RELATED</div>{related.map(item=><Link key={item.id} href={`/learn/${item.slug}`} style={{display:'block',textDecoration:'none',color:C.navy,borderTop:`1px solid ${C.border}`,padding:'10px 0',fontSize:11.8,fontWeight:800,lineHeight:1.4}}>{item.title}</Link>)}</div>}
      </aside>
    </main>
    <style>{`@media(max-width:860px){.kd-layout{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

function Badge({children}:{children:React.ReactNode}){return <span style={{padding:'5px 8px',borderRadius:999,background:'rgba(255,255,255,.68)',border:`1px solid ${C.border}`,fontSize:9.5,fontWeight:900,letterSpacing:'.6px'}}>{children}</span>}
function InfoRow({label,value}:{label:string;value:string}){return <div style={{borderTop:'1px solid rgba(16,47,73,.12)',paddingTop:9,marginTop:9}}><div style={{fontSize:9.5,color:C.muted}}>{label}</div><div style={{fontSize:11.5,fontWeight:800,color:C.navy,marginTop:2}}>{value}</div></div>}
function Body({content}:{content:string}){const blocks=useMemo(()=>content.split('\n'),[content]);return <div>{blocks.map((raw,i)=>{const line=raw.trimEnd();if(!line.trim())return <div key={i} style={{height:7}}/>;if(line.startsWith('## '))return <h2 key={i} style={{fontFamily:"'Sora',sans-serif",fontSize:21,letterSpacing:'-.03em',margin:'28px 0 10px',color:C.navy}}>{line.slice(3)}</h2>;if(line.startsWith('### '))return <h3 key={i} style={{fontSize:16,margin:'22px 0 8px',color:C.navy2}}>{line.slice(4)}</h3>;if(/^[-*] /.test(line))return <div key={i} style={{display:'flex',gap:9,fontSize:14,lineHeight:1.7,color:C.text,margin:'4px 0'}}><span style={{color:C.teal,fontWeight:900}}>•</span><span>{formatInline(line.slice(2))}</span></div>;if(/^\d+\. /.test(line)){const m=line.match(/^(\d+)\.\s+(.*)$/);return <div key={i} style={{display:'flex',gap:9,fontSize:14,lineHeight:1.7,color:C.text,margin:'5px 0'}}><span style={{width:23,height:23,borderRadius:'50%',background:C.teal,color:'#fff',display:'grid',placeItems:'center',fontSize:10,fontWeight:900,flex:'0 0 auto',marginTop:1}}>{m?.[1]}</span><span>{formatInline(m?.[2]||line)}</span></div>}return <p key={i} style={{fontSize:14.2,lineHeight:1.82,color:C.text,margin:'0 0 13px'}}>{formatInline(line)}</p>})}</div>}
function formatInline(text:string){const parts=text.split(/(\*\*[^*]+\*\*)/g);return <>{parts.map((part,i)=>part.startsWith('**')&&part.endsWith('**')?<strong key={i} style={{color:C.navy}}>{part.slice(2,-2)}</strong>:<span key={i}>{part}</span>)}</>}
