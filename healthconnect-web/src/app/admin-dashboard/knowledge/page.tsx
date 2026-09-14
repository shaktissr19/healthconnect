'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Candidate = {
  id:string; source_name?:string|null; content_type:string; title:string; summary?:string|null;
  source_url:string; thumbnail_url?:string|null; youtube_video_id?:string|null; doi?:string|null;
  category?:string|null; tags?:string[]; published_at?:string|null; country_relevance?:string;
  priority_score:number; clinical_significance?:string|null; risk_level:string; status:string;
};
type Source = {id:string;name:string;source_type:string;base_url?:string|null;youtube_channel_id?:string|null;trust_level:string;reuse_policy?:string|null;is_active:boolean;auto_discover:boolean};
type Article = {id:string;slug:string;title:string;excerpt?:string|null;category?:string|null;type:string;isPublished:boolean;isFeatured:boolean;isTrending:boolean;publishedAt?:string|null;knowledge?:any};

type Summary = {status:Record<string,number>;reviewDue:number;published:number};

const C={navy:'#17384A',navy2:'#214E63',teal:'#2F7D75',blue:'#315FEA',bg:'#EEF4F4',card:'#FFFFFF',border:'#D7E1E4',text:'#18384B',muted:'#667D8B',sand:'#F1E6D6',rose:'#F3E1E6',lav:'#E9E4F2',sage:'#E1ECE5'};
const unwrap=(r:any)=>r?.data?.data??r?.data??r;

export default function KnowledgeAdminPage(){
  const [tab,setTab]=useState<'inbox'|'published'|'sources'>('inbox');
  const [summary,setSummary]=useState<Summary>({status:{},reviewDue:0,published:0});
  const [inbox,setInbox]=useState<Candidate[]>([]);
  const [sources,setSources]=useState<Source[]>([]);
  const [articles,setArticles]=useState<Article[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [statusFilter,setStatusFilter]=useState('');
  const [search,setSearch]=useState('');
  const [showImport,setShowImport]=useState(false);
  const [importUrl,setImportUrl]=useState('');
  const [importTitle,setImportTitle]=useState('');
  const [importCategory,setImportCategory]=useState('');
  const [publishItem,setPublishItem]=useState<Candidate|null>(null);
  const [publishForm,setPublishForm]=useState({title:'',excerpt:'',body:'',category:'',keyTakeaways:'',isFeatured:false,isTrending:false,publishNow:true,reviewMonths:6});
  const [notice,setNotice]=useState('');

  const load=async()=>{
    setLoading(true);
    try{
      const [s,i,src,a]=await Promise.all([
        api.get('/admin/knowledge/summary'),
        api.get('/admin/knowledge/inbox',{params:{limit:80}}),
        api.get('/admin/knowledge/sources'),
        api.get('/admin/knowledge/articles',{params:{limit:80}}),
      ]);
      setSummary(unwrap(s)||{status:{},reviewDue:0,published:0});
      setInbox(Array.isArray(unwrap(i))?unwrap(i):[]);
      setSources(Array.isArray(unwrap(src))?unwrap(src):[]);
      setArticles(Array.isArray(unwrap(a))?unwrap(a):[]);
    }catch(e:any){setNotice(e?.response?.data?.message||'Could not load Knowledge Hub data. Has the new migration been deployed?');}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[]);

  const filtered=useMemo(()=>inbox.filter(item=>{
    const statusOk=!statusFilter||item.status===statusFilter;
    const q=search.trim().toLowerCase();
    const searchOk=!q||`${item.title} ${item.summary||''} ${item.source_name||''} ${item.category||''}`.toLowerCase().includes(q);
    return statusOk&&searchOk;
  }),[inbox,statusFilter,search]);

  const discover=async()=>{
    setBusy('discover');setNotice('');
    try{
      const r=await api.post('/admin/knowledge/discover',{});
      const d=unwrap(r)||{};
      setNotice(`Discovery complete: ${d.crossref||0} Crossref and ${d.europePmc||0} Europe PMC candidates processed.`);
      await load();
    }catch(e:any){setNotice(e?.response?.data?.message||'Research discovery failed.');}
    finally{setBusy('');}
  };

  const importContent=async()=>{
    if(!importUrl.trim())return;
    setBusy('import');setNotice('');
    try{
      await api.post('/admin/knowledge/import',{sourceUrl:importUrl,title:importTitle||undefined,category:importCategory||undefined});
      setImportUrl('');setImportTitle('');setImportCategory('');setShowImport(false);
      setNotice('Content added to the editorial inbox.');
      await load();
    }catch(e:any){setNotice(e?.response?.data?.message||'Could not import this source.');}
    finally{setBusy('');}
  };

  const triage=async(id:string)=>{setBusy(id);try{await api.post(`/admin/knowledge/inbox/${id}/triage`);await load();}finally{setBusy('');}};
  const reject=async(id:string)=>{if(!confirm('Reject this candidate from the editorial inbox?'))return;setBusy(id);try{await api.post(`/admin/knowledge/inbox/${id}/reject`);await load();}finally{setBusy('');}};

  const openPublish=(item:Candidate)=>{
    setPublishItem(item);
    setPublishForm({
      title:item.title,
      excerpt:item.summary||'',
      body:item.content_type==='VIDEO'
        ? `## Why this matters\n\nWrite a short HealthConnect explanation of why this video is useful.\n\n## Key points to watch for\n\n- Add reviewed takeaways here.\n\n## HealthConnect note\n\nThis embedded video remains on the original publisher's YouTube channel. HealthConnect provides editorial context and does not re-host the video.`
        : `## What this update is about\n\nWrite an original HealthConnect summary based on the source. Do not copy the publisher abstract.\n\n## Why it matters\n\nExplain the relevance for patients or the Indian health context.\n\n## What it does not mean\n\nAdd limitations, uncertainty and when professional advice is appropriate.`,
      category:item.category||'Health Update',keyTakeaways:'',isFeatured:false,isTrending:item.priority_score>=80,publishNow:true,reviewMonths:item.risk_level==='HIGH'?6:12,
    });
  };

  const publish=async()=>{
    if(!publishItem)return;
    if(publishForm.body.replace(/\s/g,'').length<80){setNotice('Write a meaningful HealthConnect summary before publishing.');return;}
    setBusy('publish');setNotice('');
    try{
      await api.post(`/admin/knowledge/inbox/${publishItem.id}/publish`,{
        ...publishForm,
        keyTakeaways:publishForm.keyTakeaways.split('\n').map(v=>v.replace(/^[-•]\s*/, '').trim()).filter(Boolean),
        authorName:'HealthConnect Editorial',
      });
      setPublishItem(null);setNotice(publishForm.publishNow?'Published to Knowledge Hub.':'Draft created for further review.');await load();
    }catch(e:any){setNotice(e?.response?.data?.message||'Publishing failed.');}
    finally{setBusy('');}
  };

  const metric=(label:string,value:number|string,tone:string)=> <div style={{background:C.card,border:`1px solid ${C.border}`,borderTop:`4px solid ${tone}`,borderRadius:14,padding:'15px 17px',minWidth:145}}><div style={{fontSize:25,fontWeight:900,color:C.navy}}>{value}</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{label}</div></div>;

  return <div style={{maxWidth:1400,margin:'0 auto',color:C.text}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-start',marginBottom:20,flexWrap:'wrap'}}>
      <div><div style={{fontSize:11,fontWeight:900,letterSpacing:'1.7px',color:C.teal,textTransform:'uppercase'}}>Knowledge Hub</div><h1 style={{margin:'6px 0 7px',fontSize:30,lineHeight:1.1,color:C.navy}}>Editorial Content Inbox</h1><p style={{margin:0,color:C.muted,maxWidth:720,fontSize:13.5,lineHeight:1.55}}>Discover trusted research, review public-health material and embed original YouTube videos. External content never auto-publishes: HealthConnect editorial context and review remain mandatory.</p></div>
      <div style={{display:'flex',gap:9,flexWrap:'wrap'}}><button onClick={()=>setShowImport(v=>!v)} style={btn('#fff',C.navy2,true)}>+ Add source/video</button><button onClick={discover} disabled={busy==='discover'} style={btn(C.navy2,'#fff')}>{busy==='discover'?'Discovering…':'Discover trusted research'}</button></div>
    </div>

    {notice&&<div style={{padding:'11px 14px',borderRadius:10,background:'#E7F4F0',border:'1px solid #B8D9D0',color:'#24594F',fontSize:12.5,marginBottom:16}}>{notice}</div>}

    {showImport&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:17,boxShadow:'0 8px 22px rgba(23,56,74,.06)'}}><b style={{color:C.navy,fontSize:14}}>Add a curated item to the inbox</b><p style={{fontSize:11.5,color:C.muted,margin:'4px 0 12px'}}>Paste a YouTube URL to embed the original video, or add a trusted source URL. YouTube metadata is read through oEmbed; the video is never downloaded.</p><div style={{display:'grid',gridTemplateColumns:'2fr 1.3fr 1fr auto',gap:8}}><input value={importUrl} onChange={e=>setImportUrl(e.target.value)} placeholder="YouTube or source URL" style={input}/><input value={importTitle} onChange={e=>setImportTitle(e.target.value)} placeholder="Optional title override" style={input}/><input value={importCategory} onChange={e=>setImportCategory(e.target.value)} placeholder="Category" style={input}/><button onClick={importContent} disabled={busy==='import'||!importUrl.trim()} style={btn(C.teal,'#fff')}>{busy==='import'?'Adding…':'Add to inbox'}</button></div></div>}

    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:18}}>
      {metric('New candidates',summary.status?.DISCOVERED||0,C.blue)}
      {metric('In editorial review',summary.status?.TRIAGED||0,C.teal)}
      {metric('Published',summary.published||0,'#7C5CC4')}
      {metric('Review due',summary.reviewDue||0,'#B26A43')}
    </div>

    <div style={{display:'flex',gap:5,borderBottom:`1px solid ${C.border}`,marginBottom:16}}>{(['inbox','published','sources'] as const).map(t=><button key={t} onClick={()=>setTab(t)} style={{border:0,borderBottom:tab===t?`3px solid ${C.teal}`:'3px solid transparent',background:'transparent',padding:'10px 14px',fontWeight:850,color:tab===t?C.navy:C.muted,cursor:'pointer',textTransform:'capitalize'}}>{t==='inbox'?'Content inbox':t}</button>)}</div>

    {loading?<div style={{padding:40,textAlign:'center',color:C.muted}}>Loading Knowledge Hub…</div>:tab==='inbox'?<>
      <div style={{display:'flex',gap:8,marginBottom:13,flexWrap:'wrap'}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search candidate, source or category" style={{...input,minWidth:300,flex:1}}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={input}><option value="">All statuses</option><option>DISCOVERED</option><option>TRIAGED</option><option>DRAFTED</option><option>PUBLISHED</option><option>REJECTED</option></select></div>
      <div style={{display:'grid',gap:10}}>{filtered.length?filtered.map(item=><div key={item.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:15,display:'grid',gridTemplateColumns:item.thumbnail_url?'110px 1fr':'1fr',gap:14,boxShadow:'0 7px 20px rgba(23,56,74,.045)'}}>{item.thumbnail_url&&<div style={{height:78,borderRadius:10,background:`#DDE7EB url(${item.thumbnail_url}) center/cover no-repeat`}}/>}<div><div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:6}}><span style={pill(item.content_type==='VIDEO'?C.rose:item.content_type==='RESEARCH_UPDATE'?C.lav:C.sage)}>{item.content_type.replaceAll('_',' ')}</span><span style={pill('#EDF2F4')}>{item.source_name||'Trusted source'}</span><span style={pill(item.country_relevance==='INDIA'?'#E7F3ED':'#EEF2F6')}>{item.country_relevance||'GLOBAL'}</span><span style={{marginLeft:'auto',fontSize:11,fontWeight:850,color:item.priority_score>=80?'#A34828':C.muted}}>Priority {item.priority_score}</span></div><div style={{fontSize:15,fontWeight:900,color:C.navy,lineHeight:1.35}}>{item.title}</div>{item.summary&&<p style={{fontSize:12.2,color:C.muted,lineHeight:1.5,margin:'6px 0 9px'}}>{item.summary}</p>}<div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}><a href={item.source_url} target="_blank" rel="noreferrer" style={linkBtn}>Open source</a>{item.status==='DISCOVERED'&&<button disabled={busy===item.id} onClick={()=>triage(item.id)} style={smallBtn('#E7F4F0','#24594F')}>Move to review</button>}{item.status!=='REJECTED'&&item.status!=='PUBLISHED'&&<button onClick={()=>openPublish(item)} style={smallBtn(C.navy2,'#fff')}>Prepare & publish</button>}{item.status!=='REJECTED'&&item.status!=='PUBLISHED'&&<button onClick={()=>reject(item.id)} style={smallBtn('#FCE8E8','#9B2C2C')}>Reject</button>}<span style={{fontSize:10.5,color:C.muted,marginLeft:'auto'}}>{item.status}</span></div></div></div>):<div style={empty}>No candidates match this view.</div>}</div>
    </>:tab==='published'?<div style={{display:'grid',gap:9}}>{articles.length?articles.map(a=><div key={a.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 15px',display:'flex',gap:14,alignItems:'center'}}><div style={{flex:1}}><div style={{fontWeight:900,color:C.navy,fontSize:14}}>{a.title}</div><div style={{fontSize:11.5,color:C.muted,marginTop:3}}>{a.category||'Health'} · {a.type} · {a.isPublished?'Published':'Draft'}{a.knowledge?.sourceName?` · ${a.knowledge.sourceName}`:''}</div></div><a href={`/learn/${a.slug}`} target="_blank" style={linkBtn}>Preview</a></div>):<div style={empty}>No Knowledge Hub articles yet.</div>}</div>:<div style={{display:'grid',gap:9}}>{sources.map(s=><div key={s.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 15px',display:'grid',gridTemplateColumns:'1.3fr .7fr 2fr auto',gap:14,alignItems:'center'}}><div><b style={{color:C.navy,fontSize:13}}>{s.name}</b><div style={{fontSize:10.5,color:C.muted,marginTop:2}}>{s.base_url||'No base URL'}</div></div><div><span style={pill('#EEF2F6')}>{s.source_type}</span></div><div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{s.reuse_policy||'Review licence/reuse terms per item.'}</div><span style={{fontSize:10.5,fontWeight:850,color:s.is_active?'#2E7D60':'#9B2C2C'}}>{s.is_active?'ACTIVE':'PAUSED'}</span></div>)}</div>}

    {publishItem&&<div onMouseDown={e=>{if(e.target===e.currentTarget)setPublishItem(null)}} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(8,26,38,.58)',display:'grid',placeItems:'center',padding:20}}><div style={{width:'min(880px,96vw)',maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:18,boxShadow:'0 24px 70px rgba(0,0,0,.28)',padding:22}}><div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start'}}><div><div style={{fontSize:10.5,fontWeight:900,color:C.teal,letterSpacing:'1.2px'}}>EDITORIAL REVIEW</div><h2 style={{fontSize:21,margin:'5px 0 4px',color:C.navy}}>Prepare Knowledge Hub item</h2><p style={{fontSize:11.5,color:C.muted,margin:0}}>Write HealthConnect's own explanation. The original source remains cited and videos remain embedded from YouTube.</p></div><button onClick={()=>setPublishItem(null)} style={{border:0,background:'#EEF2F4',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:18}}>×</button></div>
      <div style={{display:'grid',gap:10,marginTop:16}}><label style={label}>Title<input value={publishForm.title} onChange={e=>setPublishForm(f=>({...f,title:e.target.value}))} style={input}/></label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><label style={label}>Category<input value={publishForm.category} onChange={e=>setPublishForm(f=>({...f,category:e.target.value}))} style={input}/></label><label style={label}>Review again after<select value={publishForm.reviewMonths} onChange={e=>setPublishForm(f=>({...f,reviewMonths:Number(e.target.value)}))} style={input}><option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option></select></label></div><label style={label}>Short summary<textarea value={publishForm.excerpt} onChange={e=>setPublishForm(f=>({...f,excerpt:e.target.value}))} rows={3} style={{...input,resize:'vertical'}}/></label><label style={label}>HealthConnect article / video context<textarea value={publishForm.body} onChange={e=>setPublishForm(f=>({...f,body:e.target.value}))} rows={12} style={{...input,resize:'vertical',lineHeight:1.55}}/></label><label style={label}>Key takeaways — one per line<textarea value={publishForm.keyTakeaways} onChange={e=>setPublishForm(f=>({...f,keyTakeaways:e.target.value}))} rows={4} style={{...input,resize:'vertical'}}/></label><div style={{display:'flex',gap:18,flexWrap:'wrap'}}><label style={check}><input type="checkbox" checked={publishForm.isFeatured} onChange={e=>setPublishForm(f=>({...f,isFeatured:e.target.checked}))}/> Featured</label><label style={check}><input type="checkbox" checked={publishForm.isTrending} onChange={e=>setPublishForm(f=>({...f,isTrending:e.target.checked}))}/> What matters now</label><label style={check}><input type="checkbox" checked={publishForm.publishNow} onChange={e=>setPublishForm(f=>({...f,publishNow:e.target.checked}))}/> Publish now</label></div><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',paddingTop:5}}><a href={publishItem.source_url} target="_blank" rel="noreferrer" style={linkBtn}>Review original source</a><button onClick={publish} disabled={busy==='publish'} style={btn(C.navy2,'#fff')}>{busy==='publish'?'Saving…':publishForm.publishNow?'Publish Knowledge item':'Save draft'}</button></div></div></div></div>}
  </div>;
}

const input:React.CSSProperties={border:`1px solid ${C.border}`,borderRadius:9,padding:'9px 11px',fontSize:12.5,color:C.text,background:'#FBFDFD',outline:'none',width:'100%',boxSizing:'border-box'};
const label:React.CSSProperties={display:'grid',gap:5,fontSize:11,fontWeight:800,color:C.navy};
const check:React.CSSProperties={display:'flex',gap:6,alignItems:'center',fontSize:11.5,fontWeight:750,color:C.text};
const empty:React.CSSProperties={padding:28,textAlign:'center',color:C.muted,background:'#fff',border:`1px dashed ${C.border}`,borderRadius:12};
const btn=(background:string,color:string,bordered=false):React.CSSProperties=>({border:bordered?`1px solid ${C.border}`:'none',background,color,borderRadius:9,padding:'9px 13px',fontSize:11.5,fontWeight:850,cursor:'pointer',whiteSpace:'nowrap'});
const smallBtn=(background:string,color:string):React.CSSProperties=>({border:'none',background,color,borderRadius:7,padding:'6px 9px',fontSize:10.5,fontWeight:800,cursor:'pointer'});
const linkBtn:React.CSSProperties={textDecoration:'none',border:`1px solid ${C.border}`,background:'#F8FBFB',color:C.navy2,borderRadius:7,padding:'6px 9px',fontSize:10.5,fontWeight:800};
const pill=(background:string):React.CSSProperties=>({display:'inline-flex',padding:'4px 7px',borderRadius:999,background,color:C.navy,fontSize:9.5,fontWeight:850,letterSpacing:'.2px'});
