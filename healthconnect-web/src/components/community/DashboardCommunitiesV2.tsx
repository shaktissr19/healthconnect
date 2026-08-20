'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import communityApiV2 from '@/lib/communityApiV2';

const C={card:'#FFFFFF',border:'#DCE5EF',navy:'#10213B',text:'#33465F',muted:'#6B7D91',teal:'#0D9488',tealDark:'#0F766E',tealSoft:'#ECFDF9',blue:'#2563EB',amber:'#B45309',green:'#15803D',red:'#B42318'};
const stateOf=(c:any)=>c.membershipStatus||(c.isJoined||c.is_joined?'JOINED':'NOT_JOINED');
const ago=(value:string)=>{const s=Math.max(0,(Date.now()-new Date(value).getTime())/1000);if(s<60)return'Just now';if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`;};

export default function DashboardCommunitiesV2(){
  const router=useRouter();
  const user=useAuthStore(s=>(s as any).user);
  const [rows,setRows]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [tab,setTab]=useState<'mine'|'discover'|'my-posts'>('mine');
  const [selected,setSelected]=useState<any>(null),[feed,setFeed]=useState<any[]>([]),[events,setEvents]=useState<any[]>([]),[feedLoading,setFeedLoading]=useState(false),[joining,setJoining]=useState<string|null>(null),[myPosts,setMyPosts]=useState<any[]>([]),[search,setSearch]=useState('');

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const result:any=await communityApiV2.list({limit:100});
      const list:any[]=Array.isArray(result?.communities)?result.communities:[];
      setRows(list);
      setSelected((current:any)=>current?list.find((c:any)=>c.id===current.id)||null:list.find((c:any)=>stateOf(c)==='JOINED')||null);
    }catch(e:any){setRows([]);setError(e?.response?.data?.message||'Unable to load communities.');}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(!selected?.id||stateOf(selected)!=='JOINED'){setFeed([]);setEvents([]);return;}
    let cancelled=false;setFeedLoading(true);
    Promise.allSettled([communityApiV2.posts(selected.id,{limit:8,sort:'newest'}),communityApiV2.events(selected.id)]).then(([p,e])=>{
      if(cancelled)return;
      setFeed(p.status==='fulfilled'&&Array.isArray((p.value as any)?.posts)?(p.value as any).posts:[]);
      setEvents(e.status==='fulfilled'&&Array.isArray(e.value)?e.value:[]);
      setFeedLoading(false);
    });
    return()=>{cancelled=true};
  },[selected?.id]);

  const mine=useMemo(()=>rows.filter(c=>stateOf(c)==='JOINED'),[rows]);
  const discover=useMemo(()=>rows.filter(c=>stateOf(c)!=='JOINED').filter(c=>!search.trim()||`${c.name} ${c.category} ${c.description}`.toLowerCase().includes(search.toLowerCase())),[rows,search]);
  const mineIds=useMemo(()=>mine.map(c=>c.id).join('|'),[mine]);

  useEffect(()=>{
    if(tab!=='my-posts'||!user?.id)return;
    let cancelled=false;
    (async()=>{
      const results=await Promise.all(mine.map(async c=>{
        try{const r:any=await communityApiV2.posts(c.id,{authorId:user.id,limit:30,sort:'newest'});return (r?.posts||[]).map((p:any)=>({...p,communityName:c.name,communitySlug:c.slug}));}
        catch{return[];}
      }));
      if(!cancelled)setMyPosts(results.flat().sort((a:any,b:any)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
    })();
    return()=>{cancelled=true};
  },[tab,user?.id,mineIds]);

  const join=async(c:any)=>{setJoining(c.id);setError('');try{const result:any=await communityApiV2.join(c.id);setNotice(result?.membershipStatus==='PENDING_APPROVAL'?`Your request to join ${c.name} is pending approval.`:`You joined ${c.name}.`);await load();}catch(e:any){setError(e?.response?.data?.message||`Unable to join ${c.name}.`);}finally{setJoining(null);}};

  return <div style={{fontFamily:"'Inter','Poppins',system-ui,sans-serif",color:C.navy}}>
    <div style={{background:'linear-gradient(135deg,#0E3B54,#0F5A68 55%,#0D9488)',borderRadius:20,padding:'26px 30px',color:'#fff',marginBottom:18,boxShadow:'0 12px 32px rgba(15,71,83,.16)'}}><div style={{fontSize:10,fontWeight:850,letterSpacing:'.13em',textTransform:'uppercase',color:'#C9F7F0'}}>My HealthConnect · Communities</div><h1 style={{fontSize:26,margin:'8px 0 7px',color:'#fff'}}>Support that continues between appointments</h1><p style={{fontSize:12.5,lineHeight:1.6,color:'rgba(255,255,255,.86)',margin:0,maxWidth:760}}>Join condition-focused communities, learn from verified professionals and people with lived experience, and keep every interaction connected to the real HealthConnect community service.</p></div>
    {notice&&<Message tone="notice" text={notice} onClose={()=>setNotice('')}/>} {error&&<Message tone="error" text={error} onClose={()=>setError('')}/>} 
    <div style={{display:'flex',gap:5,background:'#EDF1F5',borderRadius:11,padding:4,width:'fit-content',marginBottom:17}}>{([['mine','My Communities'],['discover','Discover'],['my-posts','My Posts']] as const).map(([key,label])=><button key={key} onClick={()=>setTab(key)} style={{border:0,borderRadius:8,padding:'8px 15px',background:tab===key?'#fff':'transparent',fontSize:12,fontWeight:tab===key?800:650,color:tab===key?C.navy:C.muted,cursor:'pointer',boxShadow:tab===key?'0 1px 4px rgba(15,31,56,.08)':'none'}}>{label}{key==='mine'&&mine.length?` (${mine.length})`:''}</button>)}</div>

    {loading?<Empty text="Loading communities…"/>:tab==='mine'?<div className="hc-dash-community-grid" style={{display:'grid',gridTemplateColumns:'310px minmax(0,1fr)',gap:16,alignItems:'start'}}>
      <section style={panel}><div style={sectionTitle}>My communities</div>{mine.length===0?<div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>You have not joined a community yet. Use Discover to find the right support network.</div>:<div style={{display:'grid',gap:7}}>{mine.map(c=><button key={c.id} onClick={()=>setSelected(c)} style={{display:'flex',alignItems:'center',gap:10,textAlign:'left',border:`1px solid ${selected?.id===c.id?'#9FDCD4':C.border}`,background:selected?.id===c.id?C.tealSoft:'#fff',borderRadius:11,padding:10,cursor:'pointer'}}><span style={{fontSize:22}}>{c.emoji||'🏥'}</span><span style={{minWidth:0,flex:1}}><b style={{display:'block',fontSize:12.5,color:C.navy,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</b><span style={{fontSize:10.5,color:C.muted}}>{(c.member_count||0).toLocaleString('en-IN')} members · {c.category||'General'}</span></span><span style={{color:C.teal}}>›</span></button>)}</div>}<button onClick={()=>setTab('discover')} style={{...secondary,width:'100%',marginTop:12}}>Discover more communities</button></section>
      <section>{!selected?<Empty text="Select a joined community to view its live feed."/>:<><div style={{...panel,marginBottom:12,display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:18,fontWeight:850,color:C.navy}}>{selected.emoji} {selected.name}</div><div style={{fontSize:11.5,color:C.muted,marginTop:4}}>{selected.description}</div></div><button onClick={()=>router.push(`/communities/${selected.slug||selected.id}`)} style={primary}>Open full community →</button></div>{events.length>0&&<div style={{...panel,marginBottom:12}}><div style={sectionTitle}>Upcoming</div><div style={{display:'flex',gap:8,overflowX:'auto'}}>{events.slice(0,4).map(e=><div key={e.id} style={{minWidth:200,border:`1px solid ${C.border}`,borderRadius:10,padding:10}}><b style={{fontSize:11.5,color:C.navy}}>{e.title}</b><div style={{fontSize:10,color:C.muted,marginTop:4}}>{new Date(e.eventDate).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div></div>)}</div></div>}{feedLoading?<Empty text="Loading feed…"/>:feed.length===0?<Empty text="No published posts yet. Open the community to start a discussion."/>:<div style={{display:'grid',gap:10}}>{feed.map(p=><article key={p.id} style={panel}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><b style={{fontSize:12,color:C.navy}}>{p.author_name}</b>{p.is_doctor&&<span style={{marginLeft:6,fontSize:9,color:C.blue,fontWeight:800}}>✓ VERIFIED DOCTOR</span>}</div><span style={{fontSize:10,color:C.muted}}>{ago(p.createdAt)}</span></div>{p.title&&<h3 style={{fontSize:14.5,margin:'8px 0 4px'}}>{p.title}</h3>}<p style={{fontSize:12.2,color:C.text,lineHeight:1.55,margin:'6px 0 10px'}}>{p.body.length>340?`${p.body.slice(0,340)}…`:p.body}</p><div style={{fontSize:10.5,color:C.muted}}>👍 {p.reactions?.like||0} · 💚 {p.reactions?.support||0} · 💡 {p.reactions?.helpful||0} · 💬 {p.comment_count||0}</div></article>)}</div>}</>}</section>
    </div>:tab==='discover'?<><div style={{display:'flex',gap:10,marginBottom:12}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search communities" style={{...input,flex:1}}/><button onClick={()=>router.push('/communities')} style={secondary}>Open public directory</button></div>{discover.length===0?<Empty text="No additional communities match this search."/>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:11}}>{discover.map(c=>{const pending=stateOf(c)==='PENDING_APPROVAL';return <div key={c.id} style={panel}><div style={{display:'flex',justifyContent:'space-between',gap:8}}><span style={{fontSize:26}}>{c.emoji||'🏥'}</span><span style={{fontSize:9.5,fontWeight:800,color:c.visibility==='PUBLIC'?C.blue:C.amber}}>{c.visibility==='RESTRICTED'?'APPROVAL REQUIRED':c.visibility}</span></div><h3 style={{fontSize:15.5,margin:'10px 0 5px'}}>{c.name}</h3><p style={{fontSize:11.5,color:C.text,lineHeight:1.5,minHeight:52}}>{c.description}</p><div style={{fontSize:10.5,color:C.muted,margin:'9px 0'}}>{(c.member_count||0).toLocaleString('en-IN')} members · {(c.post_count||0).toLocaleString('en-IN')} posts</div><div style={{display:'flex',gap:7}}><button onClick={()=>router.push(`/communities/${c.slug||c.id}`)} style={{...secondary,flex:1}}>View</button>{c.visibility!=='PRIVATE'&&<button disabled={pending||joining===c.id} onClick={()=>join(c)} style={{...primary,flex:1,opacity:(pending||joining===c.id)?0.6:1}}>{joining===c.id?'Working…':pending?'Pending':'Join'}</button>}</div></div>})}</div>}</>:<section><div style={{...panel,marginBottom:12}}><div style={sectionTitle}>My published posts</div><div style={{fontSize:11.5,color:C.muted}}>Filtered by your authenticated user ID on the server.</div></div>{myPosts.length===0?<Empty text="You have not published posts in your joined communities yet."/>:<div style={{display:'grid',gap:10}}>{myPosts.map(p=><article key={p.id} style={panel}><div style={{display:'flex',justifyContent:'space-between'}}><b style={{fontSize:11,color:C.tealDark}}>{p.communityName}</b><span style={{fontSize:10,color:C.muted}}>{ago(p.createdAt)}</span></div>{p.title&&<h3 style={{fontSize:14.5,margin:'8px 0 4px'}}>{p.title}</h3>}<p style={{fontSize:12.2,lineHeight:1.55,color:C.text}}>{p.body}</p><button onClick={()=>router.push(`/communities/${p.communitySlug}`)} style={secondary}>Open discussion →</button></article>)}</div>}</section>}
    <style>{`@media(max-width:850px){.hc-dash-community-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

function Message({tone,text,onClose}:{tone:'notice'|'error';text:string;onClose:()=>void}){return <div style={tone==='notice'?noticeBox:errorBox}>{text}<button onClick={onClose} style={plain}>×</button></div>}
function Empty({text}:{text:string}){return <div style={empty}>{text}</div>}
const panel:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:15,boxShadow:'0 2px 9px rgba(15,31,56,.04)'};
const empty:React.CSSProperties={background:'#fff',border:`1px dashed ${C.border}`,borderRadius:14,padding:'34px 18px',textAlign:'center',fontSize:12.5,color:C.muted};
const sectionTitle:React.CSSProperties={fontSize:10.5,fontWeight:850,letterSpacing:'.08em',textTransform:'uppercase',color:C.muted,marginBottom:10};
const primary:React.CSSProperties={border:0,borderRadius:9,padding:'8px 11px',background:`linear-gradient(135deg,${C.tealDark},${C.teal})`,color:'#fff',fontSize:11.5,fontWeight:800,cursor:'pointer'};
const secondary:React.CSSProperties={border:`1px solid ${C.border}`,borderRadius:9,padding:'7px 10px',background:'#fff',color:C.text,fontSize:11.5,fontWeight:750,cursor:'pointer'};
const input:React.CSSProperties={border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 11px',fontSize:12,color:C.navy,background:'#fff',outline:'none'};
const noticeBox:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:10,background:C.tealSoft,border:'1px solid #B8EEE6',color:C.tealDark,borderRadius:11,padding:'10px 13px',fontSize:12,marginBottom:12};
const errorBox:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:10,background:'#FFF5F5',border:'1px solid #FECACA',color:C.red,borderRadius:11,padding:'10px 13px',fontSize:12,marginBottom:12};
const plain:React.CSSProperties={border:0,background:'none',color:'currentColor',fontWeight:900,cursor:'pointer'};
