'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

type KnowledgeMeta={sourceName?:string|null;sourceUrl?:string|null;youtubeVideoId?:string|null;evidenceLevel?:string|null;countryRelevance?:string|null;reviewedAt?:string|null;keyTakeaways?:string[]};
type Item={id:string;slug:string;title:string;excerpt?:string|null;coverImage?:string|null;type:string;category?:string|null;authorName?:string|null;readTimeMin?:number;isFeatured?:boolean;isTrending?:boolean;publishedAt?:string|null;viewCount?:number;tags?:string[];knowledge?:KnowledgeMeta};
type Category={name:string;count:number};

const C={navy:'#102F49',navy2:'#214E63',text:'#385469',muted:'#657B89',teal:'#2F7D75',blue:'#315FEA',sand:'#EDE3D4',sage:'#DCE8E1',mist:'#D7E3EA',lav:'#E6E1ED',white:'#FFFFFF',border:'#B8C9D2'};
const FALLBACK:Item[]=[
  {id:'fallback-1',slug:'hba1c-what-your-diabetes-numbers-really-mean',title:'HbA1c — What Your Diabetes Numbers Really Mean for Indians',excerpt:'Understand what this long-term glucose number represents and prepare better questions for your next consultation.',type:'ARTICLE',category:'Diabetes',authorName:'HealthConnect Editorial',readTimeMin:7,isFeatured:true,isTrending:true},
  {id:'fallback-2',slug:'heart-attacks-young-indians',title:'Why Heart Attacks in Young Indians Are Rising',excerpt:'Understand common risk factors, warning signs and the care conversations worth having early.',type:'ARTICLE',category:'Heart Health',authorName:'HealthConnect Editorial',readTimeMin:8,isFeatured:true,isTrending:true},
  {id:'fallback-3',slug:'pcos-complete-guide-indian-women',title:'PCOS: A Practical Guide for Indian Women',excerpt:'A plain-language guide to symptoms, diagnosis, metabolic health and when professional care matters.',type:'ARTICLE',category:'Women Health',authorName:'HealthConnect Editorial',readTimeMin:10,isFeatured:true},
];

const unwrap=(r:any)=>r?.data??r;
const fmtDate=(v?:string|null)=>v?new Date(v).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'';

export default function KnowledgeHubPage(){
  const [items,setItems]=useState<Item[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [active,setActive]=useState('All');
  const [query,setQuery]=useState('');
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    Promise.all([
      fetch(`${API}/knowledge/items?limit=60`).then(r=>r.ok?r.json():Promise.reject()),
      fetch(`${API}/knowledge/categories`).then(r=>r.ok?r.json():Promise.reject()),
    ]).then(([itemPayload,categoryPayload])=>{
      if(!alive)return;
      const list=unwrap(itemPayload);
      const cats=unwrap(categoryPayload);
      setItems(Array.isArray(list)&&list.length?list:FALLBACK);
      setCategories(Array.isArray(cats)?cats:[]);
    }).catch(()=>{if(alive)setItems(FALLBACK);}).finally(()=>{if(alive)setLoading(false);});
    return()=>{alive=false};
  },[]);

  const filtered=useMemo(()=>items.filter(item=>{
    if(active!=='All'&&item.category!==active)return false;
    const q=query.trim().toLowerCase();
    return !q||`${item.title} ${item.excerpt||''} ${item.category||''} ${(item.tags||[]).join(' ')}`.toLowerCase().includes(q);
  }),[items,active,query]);
  const matters=useMemo(()=>filtered.filter(x=>x.isTrending||x.isFeatured).slice(0,3),[filtered]);
  const videos=useMemo(()=>filtered.filter(x=>x.type==='VIDEO').slice(0,4),[filtered]);
  const research=useMemo(()=>filtered.filter(x=>x.type==='RESEARCH').slice(0,4),[filtered]);
  const explainers=useMemo(()=>filtered.filter(x=>x.type!=='VIDEO'&&x.type!=='RESEARCH').slice(0,9),[filtered]);
  const catNames=['All',...Array.from(new Set([...categories.map(c=>c.name),...items.map(i=>i.category).filter(Boolean) as string[]]))].slice(0,14);

  return <div style={{minHeight:'100vh',background:'#D6E2E7',color:C.navy,fontFamily:"'DM Sans',Arial,sans-serif"}}>
    <PublicNavbar/>
    <section style={{background:'linear-gradient(135deg,#D9E7EC 0%,#E7E4DD 100%)',borderBottom:`1px solid ${C.border}`,padding:'46px 5% 36px'}}>
      <div style={{maxWidth:1320,margin:'0 auto',display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:40,alignItems:'end'}} className="kh-hero-grid">
        <div><div style={{fontSize:12,fontWeight:900,letterSpacing:'2px',color:C.blue}}>KNOWLEDGE HUB</div><h1 style={{fontFamily:"'Sora','DM Sans',sans-serif",fontSize:'clamp(2.2rem,4vw,4rem)',letterSpacing:'-.055em',lineHeight:1.02,margin:'8px 0 14px',maxWidth:760}}>Understand your health. <span style={{color:C.teal}}>Know what matters now.</span></h1><p style={{fontSize:16,lineHeight:1.65,color:C.text,maxWidth:760,margin:0}}>HealthConnect combines medically reviewed explainers with selected research, public-health updates and original videos embedded from trusted publishers. External material is curated — never auto-published.</p></div>
        <div style={{background:'rgba(255,255,255,.72)',border:`1px solid ${C.border}`,borderRadius:18,padding:18}}><b style={{fontSize:13}}>How content is handled</b><div style={{display:'grid',gap:8,marginTop:10,fontSize:12,color:C.text}}><span>✓ Trusted-source discovery</span><span>✓ HealthConnect-written context</span><span>✓ Editorial / medical review before publication</span><span>✓ Original YouTube video stays with its publisher</span></div></div>
      </div>
    </section>

    <main style={{maxWidth:1320,margin:'0 auto',padding:'28px 22px 60px'}}>
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:22}}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search diabetes, heart health, pregnancy, mental health…" style={{flex:'1 1 330px',border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',fontSize:13,background:'#F8FBFC',color:C.navy,outline:'none'}}/><div style={{display:'flex',gap:7,overflowX:'auto',maxWidth:'100%',paddingBottom:2}}>{catNames.map(cat=><button key={cat} onClick={()=>setActive(cat)} style={{border:`1px solid ${active===cat?C.teal:C.border}`,background:active===cat?C.teal:'#EDF3F3',color:active===cat?'#fff':C.navy,borderRadius:999,padding:'8px 11px',fontSize:11,fontWeight:850,whiteSpace:'nowrap',cursor:'pointer'}}>{cat}</button>)}</div></div>

      {loading?<div style={{padding:60,textAlign:'center',color:C.muted}}>Loading curated health knowledge…</div>:<>
        <SectionTitle eyebrow="CURRENT" title="What matters now" copy="Recent or editor-selected health topics with relevance beyond simple popularity."/>
        <div className="kh-grid-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:15,marginBottom:34}}>{(matters.length?matters:filtered.slice(0,3)).map((item,index)=><FeatureCard item={item} key={item.id} tone={[C.mist,C.sand,C.lav][index%3]}/>)}</div>

        {videos.length>0&&<><SectionTitle eyebrow="WATCH & LEARN" title="Trusted videos, with HealthConnect context" copy="Original videos remain on the publisher's YouTube channel and are embedded without re-hosting."/><div className="kh-grid-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:13,marginBottom:34}}>{videos.map(item=><VideoCard item={item} key={item.id}/>)}</div></>}

        {research.length>0&&<><SectionTitle eyebrow="LATEST EVIDENCE" title="Research worth understanding" copy="Research discovery is separated from patient advice. HealthConnect explains context, limitations and why a finding may matter."/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:34}} className="kh-grid-2">{research.map(item=><ResearchCard item={item} key={item.id}/>)}</div></>}

        <SectionTitle eyebrow="EXPLAINERS" title="Understand everyday health decisions" copy="Clear, India-aware education designed to support better conversations with healthcare professionals."/>
        <div className="kh-grid-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:13}}>{explainers.length?explainers.map((item,index)=><CompactCard item={item} key={item.id} tone={[C.sage,C.mist,C.sand][index%3]}/>):<div style={{gridColumn:'1/-1',padding:28,textAlign:'center',border:`1px dashed ${C.border}`,borderRadius:14,color:C.muted}}>No items match this search yet.</div>}</div>
      </>}

      <div style={{marginTop:32,padding:'15px 17px',borderRadius:13,background:'#C6D7DF',border:'1px solid #AFC3CE',fontSize:12.5,lineHeight:1.55,color:C.text}}><strong style={{color:C.navy}}>Knowledge Hub is educational.</strong> It does not diagnose conditions or replace personal medical advice, emergency services or professional clinical judgement.</div>
    </main>
    <style>{`@media(max-width:900px){.kh-hero-grid,.kh-grid-3,.kh-grid-4,.kh-grid-2{grid-template-columns:1fr 1fr!important}}@media(max-width:640px){.kh-hero-grid,.kh-grid-3,.kh-grid-4,.kh-grid-2{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

function SectionTitle({eyebrow,title,copy}:{eyebrow:string;title:string;copy:string}){return <div style={{display:'grid',gridTemplateColumns:'1fr minmax(280px,.7fr)',gap:24,alignItems:'end',margin:'8px 3px 14px'}} className="kh-hero-grid"><div><div style={{fontSize:10.5,fontWeight:900,letterSpacing:'1.6px',color:C.teal}}>{eyebrow}</div><h2 style={{fontFamily:"'Sora','DM Sans',sans-serif",fontSize:'clamp(1.45rem,2.4vw,2.15rem)',letterSpacing:'-.04em',margin:'5px 0 0'}}>{title}</h2></div><p style={{margin:0,fontSize:12.5,lineHeight:1.55,color:C.text}}>{copy}</p></div>}

function FeatureCard({item,tone}:{item:Item;tone:string}){return <Link href={`/learn/${item.slug}`} style={{textDecoration:'none',color:'inherit'}}><article style={{height:'100%',border:`1px solid ${C.border}`,borderRadius:18,overflow:'hidden',background:tone,boxShadow:'0 9px 24px rgba(26,55,72,.08)'}}>{item.coverImage?<div style={{height:170,background:`#D4E0E5 url(${item.coverImage}) center/cover no-repeat`}}/>:<div style={{height:9,background:item.type==='RESEARCH'?'#7A62AA':item.type==='VIDEO'?C.teal:C.blue}}/>}<div style={{padding:17}}><Meta item={item}/><h3 style={{fontFamily:"'Sora',sans-serif",fontSize:17,lineHeight:1.35,margin:'9px 0 7px'}}>{item.title}</h3><p style={{fontSize:12.5,lineHeight:1.55,color:C.text,margin:'0 0 13px'}}>{item.excerpt}</p><b style={{fontSize:11.5,color:C.navy2}}>{item.type==='VIDEO'?'Watch video':'Read more'}</b></div></article></Link>}
function VideoCard({item}:{item:Item}){const vid=item.knowledge?.youtubeVideoId;return <Link href={`/learn/${item.slug}`} style={{textDecoration:'none',color:'inherit'}}><article style={{border:`1px solid ${C.border}`,borderRadius:16,overflow:'hidden',background:'#F7FAFA',height:'100%'}}><div style={{height:145,position:'relative',background:item.coverImage?`#CCD9DF url(${item.coverImage}) center/cover no-repeat`:vid?`#CCD9DF url(https://i.ytimg.com/vi/${vid}/hqdefault.jpg) center/cover no-repeat`:'#CCD9DF'}}><span style={{position:'absolute',left:12,bottom:12,width:39,height:39,borderRadius:'50%',display:'grid',placeItems:'center',background:'rgba(16,47,73,.88)',color:'#fff',fontSize:17}}>▶</span></div><div style={{padding:14}}><Meta item={item}/><h3 style={{fontSize:14,lineHeight:1.35,margin:'8px 0 7px'}}>{item.title}</h3><p style={{fontSize:11.5,lineHeight:1.5,color:C.text,margin:0}}>{item.excerpt}</p></div></article></Link>}
function ResearchCard({item}:{item:Item}){return <Link href={`/learn/${item.slug}`} style={{textDecoration:'none',color:'inherit'}}><article style={{padding:17,border:`1px solid ${C.border}`,borderRadius:15,background:'#ECE8F2',display:'grid',gridTemplateColumns:'1fr auto',gap:16}}><div><Meta item={item}/><h3 style={{fontSize:15,lineHeight:1.4,margin:'8px 0 6px'}}>{item.title}</h3><p style={{fontSize:11.8,lineHeight:1.5,color:C.text,margin:0}}>{item.excerpt}</p></div><span style={{alignSelf:'center',fontSize:20,color:'#70589D'}}>↗</span></article></Link>}
function CompactCard({item,tone}:{item:Item;tone:string}){return <Link href={`/learn/${item.slug}`} style={{textDecoration:'none',color:'inherit'}}><article style={{border:`1px solid ${C.border}`,borderRadius:15,padding:16,background:tone,height:'100%',boxSizing:'border-box'}}><Meta item={item}/><h3 style={{fontSize:14.5,lineHeight:1.4,margin:'8px 0 7px'}}>{item.title}</h3><p style={{fontSize:11.8,lineHeight:1.52,color:C.text,margin:'0 0 12px'}}>{item.excerpt}</p><span style={{fontSize:10.8,fontWeight:850,color:C.navy2}}>Open explainer</span></article></Link>}
function Meta({item}:{item:Item}){return <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:9.5,fontWeight:900,letterSpacing:'.6px',textTransform:'uppercase',padding:'4px 7px',borderRadius:999,background:'rgba(255,255,255,.68)',color:C.navy}}>{item.category||'Health'}</span><span style={{fontSize:9.5,color:C.muted}}>{item.knowledge?.sourceName||item.authorName||'HealthConnect'}</span>{item.publishedAt&&<span style={{fontSize:9.5,color:C.muted}}>· {fmtDate(item.publishedAt)}</span>}</div>}
