'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id: string; body: string; title?: string; tags: string[];
  isAnonymous: boolean; anonymousAlias?: string;
  author_name: string; is_doctor: boolean;
  createdAt: string; isPinned: boolean; viewCount: number;
  comment_count: number;
  reactions: { like:number; support:number; helpful:number };
  user_reaction: string|null;
  isVerifiedJourney?: boolean;
}
interface Comment {
  id:string; body:string; isAnonymous:boolean; author_name:string;
  createdAt:string; parentId:string|null; replies:Comment[];
}
interface Community {
  id:string; slug:string; name:string; description?:string;
  emoji?:string; category?:string; visibility:string;
  allowAnonymous:boolean; allows_anonymous?:boolean;
  isFeatured:boolean; member_count:number; post_count:number;
  is_joined:boolean; rules?:string;
}
interface AuthUser { id:string; name:string; role:string; token:string; }

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs';

const CAT_COLOR: Record<string,string> = {
  'Diabetes':'#E53E3E','Heart Health':'#C53030','Mental Wellness':'#6B46C1',
  'Cancer Support':'#B7791F','Thyroid':'#805AD5','PCOS/PCOD':'#D53F8C',
  'Arthritis':'#2B6CB0','Hypertension':'#276749','Kidney Health':'#285E61',
  'Respiratory':'#2C5282','Nutrition & Diet':'#276749','Senior Care':'#C05621',
};
const CAT_BG: Record<string,string> = {
  'Diabetes':'#FFF5F5','Heart Health':'#FFF5F5','Mental Wellness':'#FAF5FF',
  'Cancer Support':'#FFFAF0','Thyroid':'#F5F0FF','PCOS/PCOD':'#FFF0F5',
  'Arthritis':'#EBF8FF','Hypertension':'#F0FFF4','Kidney Health':'#E6FFFA',
  'Respiratory':'#EBF8FF','Nutrition & Diet':'#F0FFF4','Senior Care':'#FFFAF0',
};

const POST_TYPES = ['General','Question','Tip / Advice','Success Story','Need Support','News & Research'];
const TYPE_META: Record<string,{color:string;bg:string;icon:string}> = {
  'Success Story':  { color:'#276749', bg:'#F0FFF4', icon:'🏆' },
  'Question':       { color:'#2B6CB0', bg:'#EBF8FF', icon:'❓' },
  'Tip / Advice':   { color:'#B7791F', bg:'#FFFAF0', icon:'💡' },
  'Need Support':   { color:'#C53030', bg:'#FFF5F5', icon:'🤝' },
  'News & Research':{ color:'#6B46C1', bg:'#FAF5FF', icon:'📰' },
  'General':        { color:'#475569', bg:'#F8FAFC', icon:'💬' },
};

const timeAgo = (d:string) => {
  const diff = Date.now()-new Date(d).getTime();
  if (diff<60000) return 'Just now';
  if (diff<3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff<86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
};

const getAuthUser = (): AuthUser|null => {
  if (typeof window==='undefined') return null;
  try {
    const raw   = localStorage.getItem('hc_user')  || sessionStorage.getItem('hc_user');
    const token = localStorage.getItem('hc_token') || sessionStorage.getItem('hc_token');
    if (!raw||!token) return null;
    const u = JSON.parse(raw);
    return { id:u.id||u.userId, name:u.name||`${u.firstName||''} ${u.lastName||''}`.trim(), role:u.role, token };
  } catch { return null; }
};
const getDashboardRoute = (r:string) => r==='DOCTOR'?'/doctor-dashboard':r==='HOSPITAL'?'/hospital-dashboard':'/dashboard';

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, accent, user, onReact, onCommentClick, onSignIn }: {
  post:Post; accent:string; user:AuthUser|null;
  onReact:(id:string,type:string)=>void;
  onCommentClick:(p:Post)=>void;
  onSignIn:()=>void;
}) => {
  const [expanded,setExpanded] = useState(false);
  const displayType = POST_TYPES.find(t=>(post.tags||[]).includes(t.toLowerCase().replace(/\s*\/\s*/g,'-').replace(/ /g,'-'))) || 'General';
  const tm = TYPE_META[displayType]||TYPE_META['General'];

  return (
    <div style={{ background:'#fff',border:'1px solid #E8EEF5',borderRadius:14,padding:'18px 20px',marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',transition:'box-shadow 0.2s' }}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'}>

      {/* Pinned */}
      {post.isPinned && (
        <div style={{ marginBottom:10 }}>
          <span style={{ fontSize:10,background:'#FFFBEB',color:'#B7791F',border:'1px solid #F6E05E',borderRadius:6,padding:'2px 8px',fontWeight:800 }}>📌 PINNED</span>
        </div>
      )}

      {/* Verified Journey badge */}
      {post.isVerifiedJourney && (
        <div style={{ marginBottom:10 }}>
          <span style={{ fontSize:10,background:'#F0FFF4',color:'#276749',border:'1px solid #9AE6B4',borderRadius:6,padding:'2px 8px',fontWeight:800 }}>✅ VERIFIED PATIENT JOURNEY</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex',gap:10,alignItems:'flex-start',marginBottom:12 }}>
        <div style={{ width:38,height:38,borderRadius:'50%',background:post.isAnonymous?'#F1F5F9':`linear-gradient(135deg,${accent}CC,${accent}88)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:post.isAnonymous?16:13,fontWeight:800,color:post.isAnonymous?'#64748B':'#fff',flexShrink:0 }}>
          {post.isAnonymous?'🎭':post.author_name.split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:3 }}>
            <span style={{ fontSize:13,fontWeight:700,color:post.isAnonymous?'#94A3B8':'#1E293B',fontStyle:post.isAnonymous?'italic':'normal' }}>
              {post.author_name}
            </span>
            {post.is_doctor && !post.isAnonymous && (
              <span style={{ fontSize:9,background:'#F0FFF4',color:'#276749',border:'1px solid #9AE6B4',borderRadius:6,padding:'1px 6px',fontWeight:700 }}>✓ Verified Doctor</span>
            )}
            <span style={{ fontSize:10,color:tm.color,background:tm.bg,borderRadius:8,padding:'2px 8px',fontWeight:700 }}>{tm.icon} {displayType}</span>
          </div>
          <div style={{ fontSize:10.5,color:'#94A3B8' }}>{timeAgo(post.createdAt)}</div>
        </div>
      </div>

      {/* Title */}
      {post.title && <div style={{ fontSize:15,fontWeight:800,color:'#1E293B',marginBottom:8,lineHeight:1.4 }}>{post.title}</div>}

      {/* Body */}
      <div style={{ fontSize:13.5,color:'#334155',lineHeight:1.72,marginBottom:14 }}>
        {post.body.length>300&&!expanded?(
          <>{post.body.slice(0,300)}... <button onClick={()=>setExpanded(true)} style={{ color:accent,background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:700 }}>Read more</button></>
        ):post.body}
      </div>

      {/* Tags */}
      {post.tags&&post.tags.length>0&&(
        <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:12 }}>
          {post.tags.map((t,i)=><span key={i} style={{ fontSize:10,color:'#64748B',background:'#F1F5F9',borderRadius:5,padding:'2px 7px' }}>#{t}</span>)}
        </div>
      )}

      {/* Reactions + Comments */}
      <div style={{ display:'flex',gap:6,paddingTop:10,borderTop:'1px solid #F1F5F9',flexWrap:'wrap' }}>
        {[{emoji:'❤️',key:'like',count:post.reactions.like},{emoji:'🤝',key:'support',count:post.reactions.support},{emoji:'💡',key:'helpful',count:post.reactions.helpful}].map(r=>(
          <button key={r.key}
            onClick={()=>user?onReact(post.id,r.key):onSignIn()}
            style={{ display:'flex',alignItems:'center',gap:4,background:post.user_reaction===r.key?`${accent}18`:'#F8FAFC',border:`1px solid ${post.user_reaction===r.key?accent+'44':'#E2E8F0'}`,borderRadius:20,padding:'4px 10px',cursor:'pointer',fontSize:11.5,color:post.user_reaction===r.key?accent:'#475569',fontWeight:600,transition:'all 0.15s' }}>
            <span style={{ fontSize:13 }}>{r.emoji}</span>
            {r.count>0&&<span style={{ fontWeight:700 }}>{r.count}</span>}
          </button>
        ))}
        <button onClick={()=>user?onCommentClick(post):onSignIn()}
          style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:5,background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:20,padding:'4px 12px',cursor:'pointer',fontSize:11.5,color:'#475569',fontWeight:600 }}>
          💬 {post.comment_count} {post.comment_count===1?'reply':'replies'}
        </button>
      </div>
    </div>
  );
};

// ── Comment Item ──────────────────────────────────────────────────────────────
const CommentItem = ({ comment, depth=0 }: { comment:Comment; depth?:number }) => (
  <div style={{ marginLeft:depth>0?28:0,marginBottom:10 }}>
    <div style={{ background:depth===0?'#F8FAFC':'#fff',border:'1px solid #E8EEF5',borderRadius:10,padding:'12px 14px' }}>
      <div style={{ display:'flex',gap:8,alignItems:'center',marginBottom:7 }}>
        <div style={{ width:28,height:28,borderRadius:'50%',background:comment.isAnonymous?'#F1F5F9':'linear-gradient(135deg,#6366F1,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:comment.isAnonymous?'#94A3B8':'#fff',flexShrink:0 }}>
          {comment.isAnonymous?'🎭':comment.author_name.split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <span style={{ fontSize:12,fontWeight:700,color:comment.isAnonymous?'#94A3B8':'#1E293B',fontStyle:comment.isAnonymous?'italic':undefined }}>{comment.author_name}</span>
        <span style={{ fontSize:10,color:'#94A3B8',marginLeft:'auto' }}>{timeAgo(comment.createdAt)}</span>
      </div>
      <div style={{ fontSize:13,color:'#334155',lineHeight:1.65 }}>{comment.body}</div>
    </div>
    {comment.replies&&comment.replies.map(r=><CommentItem key={r.id} comment={r} depth={depth+1}/>)}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CommunityDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const slugOrId = (params?.slug||params?.id||'') as string;
  const { openAuthModal } = useUIStore() as any;

  const [user,       setUser]       = useState<AuthUser|null>(null);
  const [community,  setCommunity]  = useState<Community|null>(null);
  const [posts,      setPosts]      = useState<Post[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [postsLoad,  setPostsLoad]  = useState(true);
  const [tab,        setTab]        = useState<'feed'|'about'>('feed');
  const [isJoined,   setIsJoined]   = useState(false);
  const [joining,    setJoining]    = useState(false);
  const [sort,       setSort]       = useState<'latest'|'popular'>('latest');
  const [postContent,setPostContent]= useState('');
  const [postType,   setPostType]   = useState('General');
  const [postAnon,   setPostAnon]   = useState(false);
  const [posting,    setPosting]    = useState(false);
  const [commentPost,setCommentPost]= useState<Post|null>(null);
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [commentsLoad,setCommentsLoad]=useState(false);
  const [commentBody,setCommentBody]= useState('');
  const [commentAnon,setCommentAnon]= useState(false);
  const [submittingCmt,setSubmittingCmt]=useState(false);

  const accent = community?.category?(CAT_COLOR[community.category]||'#6366F1'):'#6366F1';
  const bg     = community?.category?(CAT_BG[community.category]||'#F8FAFC'):'#F8FAFC';

  const handleSignIn = useCallback(() => {
    openAuthModal?.('login');
    if (typeof window!=='undefined'&&window.location.pathname!=='/') router.push('/');
  }, [openAuthModal, router]);

  useEffect(() => { setUser(getAuthUser()); }, []);

  const fetchCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string,string> = {};
      const u = getAuthUser();
      if (u) headers['Authorization'] = `Bearer ${u.token}`;
      const res = await fetch(`${API}/api/communities/${slugOrId}`,{headers});
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      const c = data.data||data;
      setCommunity(c);
      setIsJoined(c.is_joined||false);
    } catch {
      setCommunity({ id:slugOrId,slug:slugOrId,name:slugOrId.replace(/-/g,' ').replace(/\b\w/g,(l:string)=>l.toUpperCase()),
        description:'A health support community.',emoji:'🏥',category:'General',
        visibility:'PUBLIC',allowAnonymous:true,isFeatured:false,member_count:0,post_count:0,is_joined:false });
    } finally { setLoading(false); }
  }, [slugOrId]);

  const fetchPosts = useCallback(async (communityId:string) => {
    setPostsLoad(true);
    try {
      const headers: Record<string,string> = {};
      const u = getAuthUser();
      if (u) headers['Authorization'] = `Bearer ${u.token}`;
      const res = await fetch(`${API}/api/communities/${communityId}/posts?sort=${sort}&limit=30`,{headers});
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const raw = data.data?.posts||data.data||data.posts||data||[];
      setPosts(Array.isArray(raw)?raw:[]);
    } catch { setPosts([]); }
    finally { setPostsLoad(false); }
  }, [sort]);

  useEffect(() => { fetchCommunity(); }, [fetchCommunity]);
  useEffect(() => { if (community?.id) fetchPosts(community.id); }, [community?.id, fetchPosts]);

  const handleJoin = async () => {
    if (!user) { sessionStorage.setItem('hc_pending_join',community?.id||slugOrId); handleSignIn(); return; }
    setJoining(true);
    try {
      const res = await fetch(`${API}/api/communities/${community!.id}/join`,{ method:'POST', headers:{ Authorization:`Bearer ${user.token}`,'Content-Type':'application/json' } });
      if (res.ok) {
        setIsJoined(true);
        setCommunity(c=>c?{...c,member_count:(c.member_count||0)+1}:c);
        const ids:string[] = JSON.parse(localStorage.getItem('hc_joined_communities')||'[]');
        if (!ids.includes(community!.id)) localStorage.setItem('hc_joined_communities',JSON.stringify([...ids,community!.id]));
      }
    } catch { setIsJoined(true); }
    finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!user||!community) return;
    try {
      await fetch(`${API}/api/communities/${community.id}/leave`,{ method:'DELETE', headers:{ Authorization:`Bearer ${user.token}` } });
      setIsJoined(false);
      setCommunity(c=>c?{...c,member_count:Math.max(0,(c.member_count||1)-1)}:c);
      const ids:string[] = JSON.parse(localStorage.getItem('hc_joined_communities')||'[]');
      localStorage.setItem('hc_joined_communities',JSON.stringify(ids.filter((id:string)=>id!==community.id)));
    } catch { setIsJoined(false); }
  };

  const handleReact = async (postId:string, type:string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/communities/posts/${postId}/react`,{
        method:'POST', headers:{ Authorization:`Bearer ${user.token}`,'Content-Type':'application/json' },
        body:JSON.stringify({ reactionType:type.toUpperCase() })
      });
      if (res.ok) {
        const data = await res.json();
        const reactions = data.data?.reactions;
        setPosts(prev=>prev.map(p=>{
          if (p.id!==postId) return p;
          if (reactions) return {...p,reactions:{like:reactions.LIKE,support:reactions.SUPPORT,helpful:reactions.HELPFUL},user_reaction:data.data.toggled?type:null};
          const was = p.user_reaction===type;
          return {...p,user_reaction:was?null:type,reactions:{...p.reactions,[type]:was?Math.max(0,p.reactions[type as keyof typeof p.reactions]-1):p.reactions[type as keyof typeof p.reactions]+1}};
        }));
      }
    } catch {
      setPosts(prev=>prev.map(p=>{
        if (p.id!==postId) return p;
        const was=p.user_reaction===type;
        return {...p,user_reaction:was?null:type,reactions:{...p.reactions,[type]:was?Math.max(0,p.reactions[type as keyof typeof p.reactions]-1):p.reactions[type as keyof typeof p.reactions]+1}};
      }));
    }
  };

  const handlePost = async () => {
    if (!user||!community||!postContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/communities/${community.id}/posts`,{
        method:'POST', headers:{ Authorization:`Bearer ${user.token}`,'Content-Type':'application/json' },
        body:JSON.stringify({ body:postContent.trim(), tags:[postType.toLowerCase().replace(/\s*\/\s*/g,'-')], isAnonymous:postAnon, anonymousAlias:postAnon?'Anonymous Member':undefined })
      });
      if (res.ok) {
        const data = await res.json();
        const newPost:Post = { ...(data.data||data), post_type:postType, reactions:{like:0,support:0,helpful:0}, comment_count:0, user_reaction:null, author_name:postAnon?'Anonymous Member':user.name };
        setPosts(prev=>[newPost,...prev]);
        setPostContent(''); setPostType('General'); setPostAnon(false);
      }
    } catch {} finally { setPosting(false); }
  };

  const openComments = async (post:Post) => {
    setCommentPost(post); setCommentsLoad(true);
    try {
      const headers: Record<string,string> = {};
      if (user) headers['Authorization']=`Bearer ${user.token}`;
      const res = await fetch(`${API}/api/communities/posts/${post.id}/comments`,{headers});
      if (res.ok) { const data=await res.json(); setComments(data.data||data||[]); }
    } catch { setComments([]); }
    finally { setCommentsLoad(false); }
  };

  const submitComment = async () => {
    if (!user||!commentPost||!commentBody.trim()) return;
    setSubmittingCmt(true);
    try {
      const res = await fetch(`${API}/api/communities/posts/${commentPost.id}/comments`,{
        method:'POST', headers:{ Authorization:`Bearer ${user.token}`,'Content-Type':'application/json' },
        body:JSON.stringify({ body:commentBody.trim(), isAnonymous:commentAnon })
      });
      if (res.ok) {
        const data=await res.json();
        setComments(prev=>[...prev,{...(data.data||data),author_name:commentAnon?'Anonymous Member':user.name,replies:[]}]);
        setCommentBody('');
        setPosts(prev=>prev.map(p=>p.id===commentPost.id?{...p,comment_count:p.comment_count+1}:p));
        setCommentPost(p=>p?{...p,comment_count:p.comment_count+1}:p);
      }
    } catch {} finally { setSubmittingCmt(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh',background:'#F0F5FB',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44,height:44,border:`3px solid ${accent}33`,borderTop:`3px solid ${accent}`,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px' }}/>
        <div style={{ fontSize:14,color:'#64748B' }}>Loading community...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!community) return (
    <div style={{ minHeight:'100vh',background:'#F0F5FB',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:12 }}>🔍</div>
        <div style={{ fontSize:16,fontWeight:700,color:'#1E293B',marginBottom:8 }}>Community not found</div>
        <button onClick={()=>router.push('/communities')} style={{ background:'#6366F1',color:'#fff',border:'none',borderRadius:9,padding:'10px 24px',fontSize:13,fontWeight:700,cursor:'pointer' }}>Back to Communities</button>
      </div>
    </div>
  );

  const allowAnon = community.allowAnonymous||community.allows_anonymous;

  return (
    <div style={{ minHeight:'100vh',background:'#F0F5FB',fontFamily:'system-ui,-apple-system,sans-serif' }}>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{ background:'#0A1628',borderBottom:'1px solid rgba(255,255,255,0.08)',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',gap:16,height:58 }}>
          <button onClick={()=>router.push('/communities')} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.65)',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:6 }}>
            ← Communities
          </button>
          <div style={{ width:1,height:18,background:'rgba(255,255,255,0.15)' }}/>
          <div style={{ fontSize:14,fontWeight:800,color:'#fff',display:'flex',alignItems:'center',gap:8 }}>
            <span>{community.emoji||'🏥'}</span>{community.name}
          </div>
          <div style={{ marginLeft:'auto',display:'flex',gap:8 }}>
            {user && (
              <button onClick={()=>router.push(getDashboardRoute(user.role))} style={{ background:'rgba(99,102,241,0.15)',color:'#A5B4FC',border:'1px solid rgba(99,102,241,0.3)',borderRadius:9,padding:'6px 14px',fontSize:11,fontWeight:700,cursor:'pointer' }}>
                My Dashboard
              </button>
            )}
            {isJoined ? (
              <button onClick={handleLeave} style={{ background:'rgba(239,68,68,0.08)',color:'#E53E3E',border:'1px solid rgba(229,62,62,0.2)',borderRadius:9,padding:'6px 14px',fontSize:11,fontWeight:700,cursor:'pointer' }}>
                Leave
              </button>
            ) : (
              <button onClick={handleJoin} disabled={joining} style={{ background:`linear-gradient(135deg,${accent},${accent}CC)`,color:'#fff',border:'none',borderRadius:9,padding:'6px 16px',fontSize:11,fontWeight:800,cursor:'pointer' }}>
                {joining?'Joining...':user?'Join Community':'Sign in to Join'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Community header — light bg with accent ───────────────────────── */}
      <div style={{ background:`linear-gradient(135deg,${bg} 0%,#fff 100%)`,borderBottom:`1px solid ${accent}22`,padding:'24px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',gap:18,alignItems:'flex-start',flexWrap:'wrap' }}>
          <div style={{ width:66,height:66,borderRadius:16,background:bg,border:`2px solid ${accent}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,flexShrink:0,boxShadow:`0 4px 16px ${accent}22` }}>
            {community.emoji||'🏥'}
          </div>
          <div style={{ flex:1,minWidth:200 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:6 }}>
              <h1 style={{ fontSize:'clamp(18px,2.8vw,26px)',fontWeight:900,color:'#1E293B',margin:0 }}>{community.name}</h1>
              {community.isFeatured && <span style={{ fontSize:10,background:`${accent}15`,color:accent,border:`1px solid ${accent}33`,borderRadius:8,padding:'2px 8px',fontWeight:800 }}>★ Featured</span>}
            </div>
            <p style={{ fontSize:13.5,color:'#475569',margin:'0 0 14px',lineHeight:1.6,maxWidth:600 }}>{community.description}</p>
            <div style={{ display:'inline-flex',gap:0,background:'#fff',borderRadius:10,border:'1px solid #E8EEF5',overflow:'hidden' }}>
              {[
                { val:(community.member_count||0).toLocaleString('en-IN'), label:'Members' },
                { val:(community.post_count||0).toLocaleString('en-IN'),   label:'Posts' },
                { val:community.visibility,                                 label:'Visibility' },
                { val:allowAnon?'Allowed':'No',                            label:'Anonymous' },
              ].map((s,i)=>(
                <div key={i} style={{ padding:'10px 18px',textAlign:'center',borderRight:i<3?'1px solid #E8EEF5':'none' }}>
                  <div style={{ fontSize:16,fontWeight:900,color:'#1E293B' }}>{s.val}</div>
                  <div style={{ fontSize:9,color:'#64748B',fontWeight:700,letterSpacing:'0.06em' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ background:'#fff',borderBottom:'1px solid #E8EEF5',padding:'0 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',gap:4 }}>
          {(['feed','about'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{ background:'none',border:'none',borderBottom:`2px solid ${tab===t?accent:'transparent'}`,padding:'13px 18px',fontSize:13,fontWeight:tab===t?800:500,color:tab===t?accent:'#64748B',cursor:'pointer',textTransform:'capitalize',transition:'all 0.2s' }}>
              {t==='feed'?'📰 Feed':'ℹ️ About'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'22px 24px',display:'grid',gridTemplateColumns:'1fr 268px',gap:22,alignItems:'start' }}>

        {/* Feed */}
        <div>
          {tab==='feed' && (
            <>
              {/* Sort */}
              <div style={{ display:'flex',gap:8,marginBottom:14,alignItems:'center' }}>
                <span style={{ fontSize:11,color:'#94A3B8',fontWeight:700,letterSpacing:'0.06em' }}>SORT:</span>
                {(['latest','popular'] as const).map(s=>(
                  <button key={s} onClick={()=>setSort(s)}
                    style={{ background:sort===s?`${accent}15`:'#fff',border:`1px solid ${sort===s?accent+'44':'#E2E8F0'}`,color:sort===s?accent:'#64748B',borderRadius:8,padding:'5px 14px',fontSize:11,fontWeight:700,cursor:'pointer' }}>
                    {s==='latest'?'🕐 Latest':'🔥 Popular'}
                  </button>
                ))}
              </div>

              {/* Compose */}
              {user && isJoined ? (
                <div style={{ background:'#fff',border:`1px solid ${accent}33`,borderRadius:14,padding:'16px 18px',marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:11,fontWeight:800,color:'#64748B',marginBottom:10,letterSpacing:'0.06em' }}>SHARE WITH THE COMMUNITY</div>
                  <select value={postType} onChange={e=>setPostType(e.target.value)}
                    style={{ border:'1px solid #E2E8F0',borderRadius:8,padding:'7px 12px',fontSize:12,color:'#1E293B',outline:'none',fontFamily:'inherit',cursor:'pointer',marginBottom:10,background:'#F8FAFC' }}>
                    {POST_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <textarea value={postContent} onChange={e=>setPostContent(e.target.value)}
                    placeholder={`Share a ${postType.toLowerCase()}... Be supportive and kind.`} rows={3}
                    style={{ width:'100%',border:'1px solid #E2E8F0',borderRadius:9,padding:'10px 14px',fontSize:13,color:'#1E293B',outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box',background:'#F8FAFC' }}/>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,flexWrap:'wrap',gap:8 }}>
                    {allowAnon && (
                      <button onClick={()=>setPostAnon(!postAnon)} style={{ display:'flex',alignItems:'center',gap:7,background:'none',border:'none',cursor:'pointer',padding:0 }}>
                        <div style={{ width:32,height:18,borderRadius:9,background:postAnon?accent:'#E2E8F0',position:'relative',transition:'background 0.2s',flexShrink:0 }}>
                          <div style={{ position:'absolute',top:2,left:postAnon?14:2,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left 0.2s' }}/>
                        </div>
                        <span style={{ fontSize:12,color:postAnon?accent:'#64748B',fontWeight:postAnon?700:400 }}>🎭 Post Anonymously</span>
                      </button>
                    )}
                    <span style={{ fontSize:11,color:'#94A3B8' }}>{postContent.length}/2000</span>
                    <button onClick={handlePost} disabled={posting||!postContent.trim()}
                      style={{ background:postContent.trim()?`linear-gradient(135deg,${accent},${accent}CC)`:'#E2E8F0',color:postContent.trim()?'#fff':'#94A3B8',border:'none',borderRadius:9,padding:'9px 22px',fontSize:12,fontWeight:800,cursor:postContent.trim()?'pointer':'not-allowed' }}>
                      {posting?'Posting...':'Post →'}
                    </button>
                  </div>
                </div>
              ) : user && !isJoined ? (
                <div style={{ background:bg,border:`1px solid ${accent}33`,borderRadius:14,padding:'16px 18px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:700,color:'#1E293B',marginBottom:2 }}>Join this community to post</div>
                    <div style={{ fontSize:12,color:'#64748B' }}>You can read all posts as a visitor.</div>
                  </div>
                  <button onClick={handleJoin} disabled={joining} style={{ background:`linear-gradient(135deg,${accent},${accent}CC)`,color:'#fff',border:'none',borderRadius:9,padding:'9px 20px',fontSize:12,fontWeight:800,cursor:'pointer' }}>
                    {joining?'Joining...':'Join Free →'}
                  </button>
                </div>
              ) : !user ? (
                <div style={{ background:bg,border:`1px solid ${accent}33`,borderRadius:14,padding:'16px 18px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:700,color:'#1E293B',marginBottom:2 }}>Sign in to post and join the conversation</div>
                    <div style={{ fontSize:12,color:'#64748B' }}>You can read all posts without an account.</div>
                  </div>
                  <button onClick={handleSignIn} style={{ background:`linear-gradient(135deg,#6366F1,#8B5CF6)`,color:'#fff',border:'none',borderRadius:9,padding:'9px 20px',fontSize:12,fontWeight:800,cursor:'pointer' }}>
                    Sign In / Register
                  </button>
                </div>
              ) : null}

              {/* Posts */}
              {postsLoad ? (
                <div style={{ textAlign:'center',padding:'40px',background:'#fff',borderRadius:14 }}>
                  <div style={{ width:36,height:36,border:`3px solid ${accent}33`,borderTop:`3px solid ${accent}`,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px' }}/>
                  <div style={{ fontSize:13,color:'#64748B' }}>Loading posts...</div>
                </div>
              ) : posts.length===0 ? (
                <div style={{ textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:14,border:'1px solid #E8EEF5' }}>
                  <div style={{ fontSize:44,marginBottom:12 }}>💬</div>
                  <div style={{ fontSize:16,fontWeight:700,color:'#1E293B',marginBottom:6 }}>No posts yet</div>
                  <div style={{ fontSize:13,color:'#64748B' }}>Be the first to share something!</div>
                </div>
              ) : (
                posts.map((p,i)=><PostCard key={p.id||i} post={p} accent={accent} user={user} onReact={handleReact} onCommentClick={openComments} onSignIn={handleSignIn}/>)
              )}
            </>
          )}

          {tab==='about' && (
            <div style={{ background:'#fff',border:'1px solid #E8EEF5',borderRadius:14,padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize:18,fontWeight:800,color:'#1E293B',margin:'0 0 12px' }}>About {community.name}</h3>
              <p style={{ fontSize:13.5,color:'#475569',lineHeight:1.7,marginBottom:24 }}>{community.description}</p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24 }}>
                {[{label:'Members',value:(community.member_count||0).toLocaleString('en-IN')},{label:'Total Posts',value:(community.post_count||0).toLocaleString('en-IN')},{label:'Privacy',value:community.visibility},{label:'Anonymous Posts',value:allowAnon?'Allowed':'Not allowed'}].map((s,i)=>(
                  <div key={i} style={{ background:'#F8FAFC',borderRadius:10,padding:'14px',border:'1px solid #E8EEF5' }}>
                    <div style={{ fontSize:10,color:'#94A3B8',fontWeight:700,letterSpacing:'0.08em',marginBottom:5 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontSize:16,fontWeight:800,color:'#1E293B' }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {community.rules && (
                <div>
                  <div style={{ fontSize:12,fontWeight:800,color:'#64748B',letterSpacing:'0.08em',marginBottom:10 }}>COMMUNITY RULES</div>
                  {community.rules.split('.').filter(Boolean).map((rule,i)=>(
                    <div key={i} style={{ display:'flex',gap:8,marginBottom:8,fontSize:13,color:'#334155',lineHeight:1.6 }}>
                      <span style={{ color:accent,fontWeight:800,flexShrink:0 }}>{i+1}.</span>{rule.trim()}.
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div>
          {/* Ask a Doctor CTA — NEW */}
          <div style={{ background:`linear-gradient(135deg,${accent}15,${accent}08)`,border:`1px solid ${accent}33`,borderRadius:14,padding:'18px',marginBottom:14 }}>
            <div style={{ fontSize:13,fontWeight:800,color:'#1E293B',marginBottom:6 }}>🩺 Ask a Doctor</div>
            <div style={{ fontSize:12,color:'#475569',marginBottom:12,lineHeight:1.5 }}>
              Get a personal consultation with a verified specialist for your condition.
            </div>
            <button onClick={()=>router.push('/doctors')} style={{ width:'100%',background:`linear-gradient(135deg,${accent},${accent}CC)`,color:'#fff',border:'none',borderRadius:9,padding:'9px',fontSize:12,fontWeight:700,cursor:'pointer' }}>
              Find a Specialist →
            </button>
          </div>

          {/* Community Rules */}
          {community.rules && (
            <div style={{ background:'#fff',border:'1px solid #E8EEF5',borderRadius:14,padding:'18px',marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#64748B',letterSpacing:'0.1em',marginBottom:12 }}>COMMUNITY RULES</div>
              {community.rules.split('.').filter(Boolean).slice(0,5).map((r,i)=>(
                <div key={i} style={{ display:'flex',gap:8,marginBottom:8,fontSize:12,color:'#475569',lineHeight:1.5 }}>
                  <span style={{ color:accent,fontWeight:800,flexShrink:0 }}>{i+1}.</span>{r.trim()}.
                </div>
              ))}
            </div>
          )}

          {/* Quick nav */}
          <div style={{ background:'#fff',border:'1px solid #E8EEF5',borderRadius:14,padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11,fontWeight:800,color:'#64748B',letterSpacing:'0.1em',marginBottom:12 }}>EXPLORE MORE</div>
            <button onClick={()=>router.push('/communities')} style={{ width:'100%',background:'#F8FAFC',border:'1px solid #E2E8F0',color:'#334155',borderRadius:9,padding:'9px',fontSize:12,fontWeight:700,cursor:'pointer',marginBottom:8 }}>
              ← All Communities
            </button>
            <button onClick={()=>router.push('/doctors')} style={{ width:'100%',background:'#F0FFF4',border:'1px solid #9AE6B4',color:'#276749',borderRadius:9,padding:'9px',fontSize:12,fontWeight:700,cursor:'pointer' }}>
              Find a Doctor 🩺
            </button>
          </div>
        </div>
      </div>

      {/* ── Comment Drawer ──────────────────────────────────────────────── */}
      {commentPost && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center' }}
          onClick={e=>{if (e.target===e.currentTarget){setCommentPost(null);setComments([]);}}}>
          <div style={{ background:'#fff',borderRadius:'18px 18px 0 0',width:'100%',maxWidth:680,maxHeight:'72vh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ padding:'16px 20px',borderBottom:'1px solid #E8EEF5',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontSize:14,fontWeight:800,color:'#1E293B' }}>💬 Replies ({commentPost.comment_count})</div>
              <button onClick={()=>{setCommentPost(null);setComments([]);}} style={{ background:'#F8FAFC',border:'1px solid #E2E8F0',color:'#64748B',borderRadius:8,width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ flex:1,overflowY:'auto',padding:'16px 20px' }}>
              {commentsLoad?<div style={{ textAlign:'center',padding:30,color:'#64748B',fontSize:13 }}>Loading...</div>:
               comments.length===0?<div style={{ textAlign:'center',padding:30,color:'#94A3B8',fontSize:13 }}>No replies yet. Be the first!</div>:
               comments.map(c=><CommentItem key={c.id} comment={c}/>)}
            </div>
            {user && isJoined ? (
              <div style={{ padding:'14px 20px',borderTop:'1px solid #E8EEF5',display:'flex',gap:10,alignItems:'flex-end' }}>
                <textarea value={commentBody} onChange={e=>setCommentBody(e.target.value)} placeholder="Write a supportive reply..." rows={2}
                  style={{ flex:1,border:'1px solid #E2E8F0',borderRadius:9,padding:'9px 13px',fontSize:13,color:'#1E293B',outline:'none',resize:'none',fontFamily:'inherit',background:'#F8FAFC' }}/>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  {allowAnon && (
                    <button onClick={()=>setCommentAnon(!commentAnon)} style={{ fontSize:11,color:commentAnon?accent:'#94A3B8',background:'none',border:'none',cursor:'pointer',fontWeight:700 }}>
                      {commentAnon?'🎭 Anon':'Anon off'}
                    </button>
                  )}
                  <button onClick={submitComment} disabled={submittingCmt||!commentBody.trim()}
                    style={{ background:commentBody.trim()?`linear-gradient(135deg,${accent},${accent}CC)`:'#E2E8F0',color:commentBody.trim()?'#fff':'#94A3B8',border:'none',borderRadius:9,padding:'9px 16px',fontSize:12,fontWeight:800,cursor:commentBody.trim()?'pointer':'not-allowed' }}>
                    {submittingCmt?'...':'Reply'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding:'14px 20px',borderTop:'1px solid #E8EEF5',textAlign:'center' }}>
                <button onClick={handleSignIn} style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)',color:'#fff',border:'none',borderRadius:9,padding:'9px 24px',fontSize:12,fontWeight:800,cursor:'pointer' }}>
                  Sign in to reply
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
