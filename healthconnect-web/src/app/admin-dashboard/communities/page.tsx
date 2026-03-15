'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

// ─── Colour tokens matching admin theme ──────────────────────────────────────
const C = {
  card:'#FFFFFF', border:'rgba(45,139,122,0.14)', teal:'#2D8B7A', teal2:'#1F6B5C',
  text:'#1C3A35', muted:'#5A7184', green:'#16A34A', amber:'#D97706', red:'#DC2626',
  blue:'#2563EB', purple:'#7C3AED', bg:'#F0F9F8',
};

const CATEGORIES = ['Diabetes','Heart Health','Mental Wellness','PCOS/PCOD','Cancer Support',
  'Thyroid','Arthritis','Hypertension','Kidney Health','Respiratory','Nutrition & Diet','Senior Care','General'];
const VISIBILITIES = ['PUBLIC','PRIVATE','RESTRICTED'];
const EMOJIS = ['🩸','❤️','🧠','🌸','🎗️','🦋','🦴','💊','🫘','🫁','🥗','👴','🏥','💙','🤱','🍛','🫀','💓'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const Badge = ({ label, color, bg }: { label:string; color:string; bg:string }) => (
  <span style={{ fontSize:10, fontWeight:700, color, background:bg, borderRadius:5, padding:'2px 7px', whiteSpace:'nowrap' as const }}>{label}</span>
);

const fmtDate = (d:string) => new Date(d).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' });

// ─── Community Form Modal ─────────────────────────────────────────────────────
function CommunityFormModal({ community, onClose, onSave }: {
  community: any|null; onClose:()=>void; onSave:(c:any)=>void;
}) {
  const isEdit = !!community?.id;
  const [form, setForm] = useState({
    name:           community?.name        || '',
    slug:           community?.slug        || '',
    description:    community?.description || '',
    emoji:          community?.emoji       || '🏥',
    category:       community?.category    || 'General',
    visibility:     community?.visibility  || 'PUBLIC',
    language:       community?.language    || 'en',
    allowAnonymous: community?.allowAnonymous !== false,
    requireApproval:community?.requireApproval || false,
    isFeatured:     community?.isFeatured  || false,
    isActive:       community?.isActive !== false,
    rules:          community?.rules       || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,60);

  const save = async () => {
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.slug.trim()) { setError('Slug is required'); return; }
    setSaving(true);
    try {
      const res = isEdit
        ? await api.put(`/admin/communities/${community.id}`, form)
        : await api.post('/admin/communities', form);
      onSave(res.data.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save community');
    } finally { setSaving(false); }
  };

  const inp: React.CSSProperties = {
    width:'100%', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px',
    fontSize:13, color:C.text, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const,
    background:'#fff',
  };
  const label: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:700, color:C.muted,
    letterSpacing:'0.06em', marginBottom:5, textTransform:'uppercase' as const,
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'#fff',borderRadius:16,padding:28,width:'100%',maxWidth:620,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:800,color:C.text }}>{isEdit ? `Edit: ${community.name}` : 'Create New Community'}</h2>
          <button onClick={onClose} style={{ background:'#F1F5F9',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',fontSize:14,color:C.muted }}>✕</button>
        </div>

        {error && <div style={{ background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'10px 14px',marginBottom:16,color:C.red,fontSize:13 }}>{error}</div>}

        {/* Row 1: Emoji + Name */}
        <div style={{ display:'grid',gridTemplateColumns:'80px 1fr',gap:12,marginBottom:14 }}>
          <div>
            <span style={label}>Emoji</span>
            <select value={form.emoji} onChange={e=>setF('emoji',e.target.value)}
              style={{ ...inp, fontSize:20, padding:'6px 8px', textAlign:'center' as const }}>
              {EMOJIS.map(e=><option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <span style={label}>Community Name *</span>
            <input value={form.name} onChange={e=>{ setF('name',e.target.value); if (!isEdit) setF('slug',autoSlug(e.target.value)); }}
              placeholder="e.g. Diabetes Warriors" style={inp}/>
          </div>
        </div>

        {/* Slug */}
        <div style={{ marginBottom:14 }}>
          <span style={label}>URL Slug *</span>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:12,color:C.muted,flexShrink:0 }}>healthconnect.sbs/communities/</span>
            <input value={form.slug} onChange={e=>setF('slug',autoSlug(e.target.value))}
              placeholder="diabetes-warriors" style={{ ...inp, flex:1 }}/>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom:14 }}>
          <span style={label}>Description</span>
          <textarea value={form.description} onChange={e=>setF('description',e.target.value)} rows={3}
            placeholder="What is this community about?" style={{ ...inp, resize:'vertical' as const }}/>
        </div>

        {/* Row 2: Category + Visibility + Language */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14 }}>
          <div>
            <span style={label}>Category</span>
            <select value={form.category} onChange={e=>setF('category',e.target.value)} style={inp}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <span style={label}>Visibility</span>
            <select value={form.visibility} onChange={e=>setF('visibility',e.target.value)} style={inp}>
              {VISIBILITIES.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <span style={label}>Language</span>
            <select value={form.language} onChange={e=>setF('language',e.target.value)} style={inp}>
              {[['en','English'],['hi','Hindi'],['ta','Tamil'],['te','Telugu'],['ml','Malayalam'],['kn','Kannada'],['bn','Bengali'],['gu','Gujarati'],['mr','Marathi']].map(([v,l])=>(
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rules */}
        <div style={{ marginBottom:14 }}>
          <span style={label}>Community Rules</span>
          <textarea value={form.rules} onChange={e=>setF('rules',e.target.value)} rows={3}
            placeholder="Be respectful. Share experiences, not prescriptions. Use anonymous posting for sensitive topics."
            style={{ ...inp, resize:'vertical' as const }}/>
        </div>

        {/* Toggle switches */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20,background:'#F8FAFC',borderRadius:10,padding:14,border:`1px solid ${C.border}` }}>
          {[
            { key:'allowAnonymous',  label:'Anonymous Posts' },
            { key:'requireApproval', label:'Require Approval' },
            { key:'isFeatured',      label:'Featured' },
            { key:'isActive',        label:'Active' },
          ].map(t=>(
            <div key={t.key} style={{ textAlign:'center' as const }}>
              <button onClick={()=>setF(t.key, !(form as any)[t.key])}
                style={{ width:44,height:24,borderRadius:12,background:(form as any)[t.key]?C.teal:'#CBD5E1',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',marginBottom:5 }}>
                <div style={{ position:'absolute',top:3,left:(form as any)[t.key]?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s' }}/>
              </button>
              <div style={{ fontSize:10,color:C.muted,fontWeight:600 }}>{t.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,background:'#F8FAFC',color:C.muted,border:`1px solid ${C.border}`,borderRadius:9,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ flex:2,background:C.teal,color:'#fff',border:'none',borderRadius:9,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Community'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Q&A Session Modal ────────────────────────────────────────────────────────
function QAModal({ communityId, communityName, onClose }: {
  communityId: string; communityName: string; onClose:()=>void;
}) {
  const [form, setForm] = useState({ doctorName:'', topic:'', scheduledAt:'', durationMin:60, meetLink:'' });
  const [sessions, setSessions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    api.get(`/admin/communities/${communityId}/qa-sessions`)
      .then(r => setSessions(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [communityId]);

  const save = async () => {
    if (!form.doctorName||!form.topic||!form.scheduledAt) return;
    setSaving(true);
    try {
      const res = await api.post(`/admin/communities/${communityId}/qa-sessions`, form);
      setSessions(prev => [res.data.data, ...prev]);
      setForm({ doctorName:'', topic:'', scheduledAt:'', durationMin:60, meetLink:'' });
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const inp: React.CSSProperties = {
    width:'100%', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px',
    fontSize:13, color:C.text, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const,
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'#fff',borderRadius:16,padding:28,width:'100%',maxWidth:580,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:C.text }}>📅 Weekly Q&A — {communityName}</h2>
          <button onClick={onClose} style={{ background:'#F1F5F9',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',fontSize:14,color:C.muted }}>✕</button>
        </div>

        <div style={{ background:'#F8FAFC',borderRadius:10,padding:16,marginBottom:20,border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:12,fontWeight:700,color:C.muted,marginBottom:12,letterSpacing:'0.06em' }}>SCHEDULE NEW SESSION</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10 }}>
            <input value={form.doctorName} onChange={e=>setForm(f=>({...f,doctorName:e.target.value}))}
              placeholder="Doctor name" style={inp}/>
            <input value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))}
              placeholder="Topic / session title" style={inp}/>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10 }}>
            <input type="datetime-local" value={form.scheduledAt} onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))} style={inp}/>
            <input type="number" value={form.durationMin} onChange={e=>setForm(f=>({...f,durationMin:parseInt(e.target.value)||60}))}
              placeholder="Duration (min)" style={inp}/>
            <input value={form.meetLink} onChange={e=>setForm(f=>({...f,meetLink:e.target.value}))}
              placeholder="Meet link (optional)" style={inp}/>
          </div>
          <button onClick={save} disabled={saving||!form.doctorName||!form.topic||!form.scheduledAt}
            style={{ background:C.teal,color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:700,cursor:'pointer' }}>
            {saving?'Scheduling…':'Schedule & Notify Members'}
          </button>
        </div>

        <div style={{ fontSize:12,fontWeight:700,color:C.muted,marginBottom:10,letterSpacing:'0.06em' }}>UPCOMING SESSIONS</div>
        {loadingSessions ? <div style={{ textAlign:'center',padding:20,color:C.muted }}>Loading…</div> :
         sessions.length===0 ? <div style={{ textAlign:'center',padding:20,color:C.muted }}>No sessions yet</div> :
         sessions.map((s:any)=>(
          <div key={s.id} style={{ background:'#fff',border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,fontSize:13,color:C.text }}>{s.topic}</div>
              <div style={{ fontSize:11,color:C.muted }}>{s.doctorName} · {fmtDate(s.scheduledAt)} · {s.durationMin}min</div>
            </div>
            {s.meetLink && <a href={s.meetLink} target="_blank" style={{ fontSize:11,color:C.teal,fontWeight:700,textDecoration:'none' }}>Join →</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ community, onClose, onDelete }: { community:any; onClose:()=>void; onDelete:(hard:boolean)=>void }) {
  const [hard, setHard] = useState(false);
  const [confirm, setConfirm] = useState('');
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'#fff',borderRadius:16,padding:28,maxWidth:440,width:'100%',boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize:32,textAlign:'center',marginBottom:12 }}>⚠️</div>
        <h3 style={{ margin:'0 0 8px',fontSize:17,fontWeight:800,color:C.text,textAlign:'center' }}>Delete "{community.name}"?</h3>
        <p style={{ color:C.muted,fontSize:13,textAlign:'center',marginBottom:18 }}>
          {hard ? '⛔ PERMANENT DELETE — all posts, members, and data will be gone forever.' : 'Archive (deactivate) — data preserved, community hidden from public.'}
        </p>
        <div style={{ display:'flex',gap:10,marginBottom:16 }}>
          <button onClick={()=>setHard(false)} style={{ flex:1,background:hard?'#F8FAFC':C.amber,color:hard?C.muted:'#fff',border:`1px solid ${hard?C.border:'transparent'}`,borderRadius:8,padding:'8px',fontSize:12,fontWeight:700,cursor:'pointer' }}>Archive</button>
          <button onClick={()=>setHard(true)} style={{ flex:1,background:hard?C.red:'#F8FAFC',color:hard?'#fff':C.muted,border:`1px solid ${hard?'transparent':C.border}`,borderRadius:8,padding:'8px',fontSize:12,fontWeight:700,cursor:'pointer' }}>Permanent Delete</button>
        </div>
        {hard && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12,color:C.red,marginBottom:6 }}>Type the community name to confirm:</div>
            <input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder={community.name}
              style={{ width:'100%',border:'1px solid #FECACA',borderRadius:8,padding:'8px 12px',fontSize:13,outline:'none',boxSizing:'border-box' as const }}/>
          </div>
        )}
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,background:'#F8FAFC',border:`1px solid ${C.border}`,borderRadius:9,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer',color:C.muted }}>Cancel</button>
          <button onClick={()=>onDelete(hard)} disabled={hard&&confirm!==community.name}
            style={{ flex:2,background:hard?C.red:C.amber,color:'#fff',border:'none',borderRadius:9,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',opacity:hard&&confirm!==community.name?0.4:1 }}>
            {hard?'Permanently Delete':'Archive Community'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ request, onApprove, onReject }: { request:any; onApprove:(r:any)=>void; onReject:(r:any)=>void }) {
  const statusColor = { PENDING:C.amber, APPROVED:C.green, REJECTED:C.red }[request.status as string] || C.muted;
  const statusBg    = { PENDING:'#FFFBEB', APPROVED:'#DCFCE7', REJECTED:'#FEF2F2' }[request.status as string] || '#F8FAFC';
  return (
    <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
        <div>
          <div style={{ fontWeight:800,fontSize:14,color:C.text,marginBottom:2 }}>{request.name}</div>
          <div style={{ fontSize:11,color:C.muted }}>{request.category||'General'} · {request.requester_email||request.requesterEmail||'Guest'}</div>
        </div>
        <Badge label={request.status} color={statusColor} bg={statusBg}/>
      </div>
      <p style={{ margin:'0 0 12px',color:C.muted,fontSize:12,lineHeight:1.6 }}>{request.reason}</p>
      <div style={{ fontSize:10,color:C.muted,marginBottom:request.status==='PENDING'?12:0 }}>{fmtDate(request.createdAt)}</div>
      {request.status==='PENDING' && (
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={()=>onReject(request)}
            style={{ flex:1,background:'#FEF2F2',color:C.red,border:'1px solid #FECACA',borderRadius:8,padding:'7px',fontSize:12,fontWeight:700,cursor:'pointer' }}>
            Reject
          </button>
          <button onClick={()=>onApprove(request)}
            style={{ flex:2,background:C.teal,color:'#fff',border:'none',borderRadius:8,padding:'7px',fontSize:12,fontWeight:700,cursor:'pointer' }}>
            ✅ Approve & Create
          </button>
        </div>
      )}
      {request.adminNote && (
        <div style={{ background:'#F8FAFC',borderRadius:7,padding:'8px 12px',fontSize:11,color:C.muted,marginTop:8 }}>
          Admin note: {request.adminNote}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCommunitiesPage() {
  const [tab,          setTab]          = useState<'communities'|'requests'|'analytics'>('communities');
  const [communities,  setCommunities]  = useState<any[]>([]);
  const [requests,     setRequests]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [reqLoading,   setReqLoading]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<'all'|'active'|'inactive'>('all');
  const [editModal,    setEditModal]    = useState<any|null>(null); // null=closed, false=new, object=edit
  const [deleteModal,  setDeleteModal]  = useState<any|null>(null);
  const [qaModal,      setQAModal]      = useState<any|null>(null);
  const [reqTab,       setReqTab]       = useState<'PENDING'|'APPROVED'|'REJECTED'>('PENDING');
  const [approving,    setApproving]    = useState<string|null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/communities');
      const list = r.data.data?.communities || r.data.data || [];
      setCommunities(list);
    } catch { setCommunities([]); }
    finally { setLoading(false); }
  }, []);

  const loadRequests = useCallback(async (status = reqTab) => {
    setReqLoading(true);
    try {
      const r = await api.get(`/admin/communities/requests?status=${status}`);
      setRequests(r.data.data?.requests || []);
      if (status === 'PENDING') setPendingCount(r.data.data?.total || 0);
    } catch { setRequests([]); }
    finally { setReqLoading(false); }
  }, [reqTab]);

  useEffect(() => { loadCommunities(); }, [loadCommunities]);
  useEffect(() => { loadRequests('PENDING'); }, []);
  useEffect(() => { if (tab==='requests') loadRequests(reqTab); }, [tab, reqTab]);

  const handleSave = (community: any) => {
    setCommunities(prev => {
      const idx = prev.findIndex(c => c.id === community.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = community; return next; }
      return [community, ...prev];
    });
    setEditModal(null);
  };

  const handleToggle = async (community: any) => {
    try {
      await api.patch(`/admin/communities/${community.id}/toggle`);
      setCommunities(prev => prev.map(c => c.id===community.id ? {...c, isActive:!c.isActive} : c));
    } catch { alert('Failed to update'); }
  };

  const handleToggleFeatured = async (community: any) => {
    try {
      await api.patch(`/admin/communities/${community.id}/feature`);
      setCommunities(prev => prev.map(c => c.id===community.id ? {...c, isFeatured:!c.isFeatured} : c));
    } catch { alert('Failed to update'); }
  };

  const handleDelete = async (hard: boolean) => {
    if (!deleteModal) return;
    try {
      await api.delete(`/admin/communities/${deleteModal.id}`, { data:{ hard } });
      if (hard) {
        setCommunities(prev => prev.filter(c => c.id !== deleteModal.id));
      } else {
        setCommunities(prev => prev.map(c => c.id===deleteModal.id ? {...c, isActive:false} : c));
      }
      setDeleteModal(null);
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to delete'); }
  };

  const handleApproveRequest = async (req: any) => {
    const note = prompt('Admin note (optional):') ?? '';
    setApproving(req.id);
    try {
      await api.post(`/admin/communities/requests/${req.id}/approve`, { adminNote: note });
      setRequests(prev => prev.filter(r => r.id !== req.id));
      setPendingCount(p => Math.max(0, p-1));
      loadCommunities(); // refresh community list
      alert('✅ Community created and requester notified!');
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    finally { setApproving(null); }
  };

  const handleRejectRequest = async (req: any) => {
    const reason = prompt('Reason for rejection (will be sent to requester):');
    if (reason === null) return;
    try {
      await api.post(`/admin/communities/requests/${req.id}/reject`, { reason });
      setRequests(prev => prev.map(r => r.id===req.id ? {...r, status:'REJECTED', adminNote:reason} : r));
      setPendingCount(p => Math.max(0, p-1));
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
  };

  const filtered = communities.filter(c => {
    if (filterStatus==='active'   && !c.isActive) return false;
    if (filterStatus==='inactive' &&  c.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name?.toLowerCase().includes(q)||c.category?.toLowerCase().includes(q)||c.slug?.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount   = communities.filter(c=>c.isActive).length;
  const featuredCount = communities.filter(c=>c.isFeatured).length;

  return (
    <div style={{ color:C.text, fontFamily:"'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22 }}>
        <div>
          <h1 style={{ margin:0,fontSize:24,fontWeight:700,letterSpacing:'-0.4px' }}>Community Management</h1>
          <p style={{ margin:'4px 0 0',color:C.muted,fontSize:13 }}>
            {communities.length} total · {activeCount} active · {featuredCount} featured
            {pendingCount > 0 && <span style={{ color:C.amber,fontWeight:700 }}> · {pendingCount} requests pending</span>}
          </p>
        </div>
        <button onClick={()=>setEditModal(false)}
          style={{ background:C.teal,color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:7,boxShadow:'0 2px 10px rgba(45,139,122,0.35)' }}>
          + Create Community
        </button>
      </div>

      {/* Pending requests alert */}
      {pendingCount > 0 && (
        <div onClick={()=>setTab('requests')} style={{ background:'#FFFBEB',border:'1px solid #FCD34D',borderRadius:10,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10,cursor:'pointer' }}>
          <span style={{ fontSize:16 }}>📬</span>
          <span style={{ color:C.amber,fontSize:13,fontWeight:600 }}>
            {pendingCount} community request{pendingCount!==1?'s':''} awaiting your review → <strong>Review now</strong>
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex',gap:2,marginBottom:20,background:'#E8EEF5',borderRadius:10,padding:3,width:'fit-content' }}>
        {([['communities','🏘️ Communities'],['requests','📬 Requests'],['analytics','📊 Analytics']] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t as any)}
            style={{ background:tab===t?'#fff':'transparent',border:'none',borderRadius:8,padding:'7px 18px',fontSize:13,fontWeight:tab===t?700:500,color:tab===t?C.text:C.muted,cursor:'pointer',boxShadow:tab===t?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all 0.15s',whiteSpace:'nowrap' as const }}>
            {l}{t==='requests'&&pendingCount>0&&<span style={{ marginLeft:6,background:C.amber,color:'#fff',borderRadius:'50%',width:18,height:18,fontSize:10,fontWeight:800,display:'inline-flex',alignItems:'center',justifyContent:'center' }}>{pendingCount}</span>}
          </button>
        ))}
      </div>

      {/* ── COMMUNITIES TAB ── */}
      {tab==='communities' && (
        <>
          {/* Filters */}
          <div style={{ display:'flex',gap:10,marginBottom:18,alignItems:'center',flexWrap:'wrap' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search communities…"
              style={{ flex:1,minWidth:200,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 14px',fontSize:13,color:C.text,outline:'none' }}/>
            {(['all','active','inactive'] as const).map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)}
                style={{ padding:'7px 14px',borderRadius:8,border:`1px solid ${filterStatus===s?C.teal:C.border}`,background:filterStatus===s?`${C.teal}15`:'#fff',color:filterStatus===s?C.teal:C.muted,fontSize:12,fontWeight:filterStatus===s?700:500,cursor:'pointer',textTransform:'capitalize' as const }}>
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:200 }}>
              <div style={{ width:32,height:32,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.teal}`,borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14 }}>
              {filtered.map(c=>(
                <div key={c.id} style={{ background:C.card,border:`1px solid ${c.isActive?C.border:'#FECACA'}`,borderRadius:12,padding:18,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',opacity:c.isActive?1:0.8 }}>

                  {/* Card header */}
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <span style={{ fontSize:28 }}>{c.emoji||'🏥'}</span>
                      <div>
                        <div style={{ fontWeight:800,fontSize:14,color:C.text }}>{c.name}</div>
                        <div style={{ color:C.muted,fontSize:10 }}>/{c.slug}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex',gap:5,flexWrap:'wrap',justifyContent:'flex-end' }}>
                      <Badge label={c.isActive?'Active':'Inactive'} color={c.isActive?C.green:C.red} bg={c.isActive?'#DCFCE7':'#FEF2F2'}/>
                      {c.isFeatured && <Badge label="⭐ Featured" color={C.amber} bg="#FFFBEB"/>}
                    </div>
                  </div>

                  {/* Description */}
                  {c.description && <p style={{ margin:'0 0 12px',color:C.muted,fontSize:12,lineHeight:1.5 }}>{c.description.slice(0,90)}{c.description.length>90?'…':''}</p>}

                  {/* Stats */}
                  <div style={{ display:'flex',gap:16,padding:'9px 0',borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,marginBottom:12 }}>
                    {[['👥',c._count?.members??0,'members'],['📝',c._count?.posts??0,'posts'],['🏷️',c.category||'—','']].map(([icon,val,lbl],i)=>(
                      <div key={i}>
                        <div style={{ fontSize:12 }}>{icon} <span style={{ fontWeight:700,color:C.text }}>{val}</span></div>
                        {lbl&&<div style={{ color:C.muted,fontSize:10 }}>{lbl as string}</div>}
                      </div>
                    ))}
                    <div style={{ marginLeft:'auto' }}>
                      <div style={{ fontSize:10,color:C.muted }}>{c.allowAnonymous?'🎭 Anon OK':'🔒 No anon'}</div>
                      <div style={{ fontSize:10,color:C.muted }}>{c.visibility}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                    <button onClick={()=>setEditModal(c)}
                      style={{ flex:1,minWidth:60,padding:'6px 0',borderRadius:7,border:`1px solid ${C.border}`,background:'#F8FAFC',color:C.text,cursor:'pointer',fontSize:11,fontWeight:600 }}>
                      ✏️ Edit
                    </button>
                    <button onClick={()=>handleToggleFeatured(c)}
                      style={{ flex:1,minWidth:60,padding:'6px 0',borderRadius:7,border:`1px solid ${C.border}`,background:c.isFeatured?'#FFFBEB':'#F8FAFC',color:c.isFeatured?C.amber:C.muted,cursor:'pointer',fontSize:11,fontWeight:600 }}>
                      {c.isFeatured?'★ Unfeature':'☆ Feature'}
                    </button>
                    <button onClick={()=>setQAModal(c)}
                      style={{ flex:1,minWidth:60,padding:'6px 0',borderRadius:7,border:`1px solid ${C.border}`,background:'#EFF6FF',color:C.blue,cursor:'pointer',fontSize:11,fontWeight:600 }}>
                      📅 Q&A
                    </button>
                    <button onClick={()=>handleToggle(c)}
                      style={{ flex:1,minWidth:60,padding:'6px 0',borderRadius:7,border:'none',background:c.isActive?'#FEE2E2':'#DCFCE7',color:c.isActive?C.red:C.green,cursor:'pointer',fontSize:11,fontWeight:600 }}>
                      {c.isActive?'Deactivate':'Activate'}
                    </button>
                    <button onClick={()=>setDeleteModal(c)}
                      style={{ padding:'6px 10px',borderRadius:7,border:'none',background:'#FEE2E2',color:C.red,cursor:'pointer',fontSize:11,fontWeight:600 }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length===0 && (
                <div style={{ gridColumn:'1/-1',padding:60,textAlign:'center' as const,color:C.muted }}>
                  {search ? `No communities matching "${search}"` : 'No communities yet'}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab==='requests' && (
        <>
          <div style={{ display:'flex',gap:8,marginBottom:18 }}>
            {(['PENDING','APPROVED','REJECTED'] as const).map(s=>(
              <button key={s} onClick={()=>setReqTab(s)}
                style={{ padding:'7px 16px',borderRadius:8,border:`1px solid ${reqTab===s?C.teal:C.border}`,background:reqTab===s?`${C.teal}15`:'#fff',color:reqTab===s?C.teal:C.muted,fontSize:12,fontWeight:reqTab===s?700:500,cursor:'pointer' }}>
                {s} {s==='PENDING'&&pendingCount>0&&`(${pendingCount})`}
              </button>
            ))}
          </div>

          {reqLoading ? (
            <div style={{ display:'flex',justifyContent:'center',padding:40 }}>
              <div style={{ width:32,height:32,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.teal}`,borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>
            </div>
          ) : requests.length===0 ? (
            <div style={{ textAlign:'center' as const,padding:'60px 20px',color:C.muted,background:C.card,borderRadius:12,border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:36,marginBottom:12 }}>📬</div>
              No {reqTab.toLowerCase()} requests
            </div>
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
              {requests.map(r=>(
                <RequestCard key={r.id} request={r}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab==='analytics' && (
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:24 }}>
            {[
              { label:'Total Communities', value:communities.length,           icon:'🏘️', color:C.teal },
              { label:'Active',            value:activeCount,                   icon:'✅', color:C.green },
              { label:'Featured',          value:featuredCount,                 icon:'⭐', color:C.amber },
              { label:'Total Members',     value:communities.reduce((a,c)=>a+(c._count?.members||0),0).toLocaleString(), icon:'👥', color:C.blue },
              { label:'Total Posts',       value:communities.reduce((a,c)=>a+(c._count?.posts||0),0).toLocaleString(),   icon:'📝', color:C.purple },
              { label:'Pending Requests',  value:pendingCount,                  icon:'📬', color:C.amber },
            ].map(s=>(
              <div key={s.label} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
                  <span style={{ color:C.muted,fontSize:11,fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'0.5px' }}>{s.label}</span>
                  <span style={{ fontSize:20 }}>{s.icon}</span>
                </div>
                <div style={{ color:s.color,fontSize:28,fontWeight:700,lineHeight:1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Top communities by members */}
          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin:'0 0 16px',fontSize:15,fontWeight:700,color:C.text }}>Communities by Members</h3>
            {[...communities]
              .sort((a,b)=>(b._count?.members||0)-(a._count?.members||0))
              .slice(0,10)
              .map((c,i)=>{
                const maxM = communities.reduce((a,x)=>Math.max(a,x._count?.members||0),1);
                const pct  = ((c._count?.members||0)/maxM)*100;
                return (
                  <div key={c.id} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                      <span style={{ fontSize:12,fontWeight:600,color:C.text }}>{i+1}. {c.emoji} {c.name}</span>
                      <span style={{ fontSize:12,color:C.muted }}>{(c._count?.members||0).toLocaleString()} members</span>
                    </div>
                    <div style={{ height:6,background:'#F1F5F9',borderRadius:3,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${pct}%`,background:C.teal,borderRadius:3,transition:'width 0.5s ease' }}/>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modals */}
      {editModal !== null && (
        <CommunityFormModal
          community={editModal || null}
          onClose={()=>setEditModal(null)}
          onSave={handleSave}/>
      )}
      {deleteModal && (
        <DeleteModal
          community={deleteModal}
          onClose={()=>setDeleteModal(null)}
          onDelete={handleDelete}/>
      )}
      {qaModal && (
        <QAModal
          communityId={qaModal.id}
          communityName={qaModal.name}
          onClose={()=>setQAModal(null)}/>
      )}
    </div>
  );
}
