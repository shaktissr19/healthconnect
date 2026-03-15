'use client';

import { useState, useEffect, useRef } from 'react';
import { patientAPI, doctorAPI } from '@/lib/api';

const TYPE_ICONS: Record<string, string> = {
  LAB:'🧪', SCAN:'🩻', PRESCRIPTION:'💊', DISCHARGE:'🏥',
  VACCINATION:'💉', IMAGING:'🫁', CARDIOLOGY:'❤️', OTHER:'📄',
};
const TYPE_LABELS: Record<string, string> = {
  LAB:'Lab Report', SCAN:'Scan', PRESCRIPTION:'Prescription',
  DISCHARGE:'Discharge Summary', VACCINATION:'Vaccination',
  IMAGING:'Imaging', CARDIOLOGY:'Cardiology', OTHER:'Other',
};

function fmtSize(bytes?: number) {
  if (!bytes) return '—';
  return bytes > 1024*1024 ? `${(bytes/1024/1024).toFixed(1)} MB` : `${Math.round(bytes/1024)} KB`;
}
function fmtDate(d?: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
  catch { return '—'; }
}
function guessType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('lab') || n.includes('blood') || n.includes('urine')) return 'LAB';
  if (n.includes('scan') || n.includes('mri')  || n.includes('ct'))    return 'SCAN';
  if (n.includes('xray') || n.includes('x-ray')|| n.includes('chest')) return 'IMAGING';
  if (n.includes('ecg')  || n.includes('echo') || n.includes('cardiac'))return 'CARDIOLOGY';
  if (n.includes('prescription') || n.includes('rx'))                   return 'PRESCRIPTION';
  if (n.includes('discharge'))                                           return 'DISCHARGE';
  return 'OTHER';
}

// ── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ report, onClose, onShared }: { report: any; onClose: () => void; onShared: () => void }) {
  const [doctors,   setDoctors]   = useState<any[]>([]);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<string>('');
  const [expiresIn, setExpiresIn] = useState('7'); // days
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    doctorAPI.getFeatured().then(res => {
      const d = res?.data?.data ?? res?.data ?? {};
      setDoctors(Array.isArray(d) ? d : d.doctors ?? []);
    }).catch(() => {});
  }, []);

  const handleShare = async () => {
    if (!selected) { setError('Please select a doctor.'); return; }
    setSaving(true);
    try {
      const expiresAt = new Date(Date.now() + Number(expiresIn) * 86400000).toISOString();
      await patientAPI.shareReport(report.id, { doctorId: selected, expiresAt });
      onShared();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to share. Please try again.');
    }
    setSaving(false);
  };

  const filtered = doctors.filter(d =>
    !search || `${d.firstName} ${d.lastName} ${d.specialization}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#0C1525', border:'1px solid rgba(20,184,166,0.2)', borderRadius:16, padding:28, width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, color:'#E2E8F0' }}>↗ Share Report</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>

        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#94A3B8' }}>
          {TYPE_ICONS[report.type] ?? '📄'} {report.name ?? 'Report'} · {TYPE_LABELS[report.type] ?? report.type}
        </div>

        <input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'9px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'#E2E8F0', fontSize:13, marginBottom:12, boxSizing:'border-box', outline:'none' }} />

        <div style={{ maxHeight:200, overflowY:'auto', marginBottom:14, border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 }}>
          {filtered.length === 0 ? (
            <div style={{ color:'#64748B', fontSize:13, padding:'16px', textAlign:'center' }}>No doctors found</div>
          ) : (
            filtered.map((doc: any) => (
              <div key={doc.id} onClick={() => setSelected(doc.id)}
                style={{ display:'flex', gap:12, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', background: selected===doc.id ? 'rgba(20,184,166,0.1)' : 'transparent', transition:'background 0.15s' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#0D9488,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>👨‍⚕️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color: selected===doc.id ? '#14B8A6' : '#E2E8F0' }}>
                    Dr. {doc.firstName} {doc.lastName}
                    {selected===doc.id && <span style={{ marginLeft:8, color:'#14B8A6', fontSize:12 }}>✓</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#64748B' }}>{doc.specialization}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em', fontFamily:'JetBrains Mono,monospace' }}>Access expires in</label>
          <div style={{ display:'flex', gap:8 }}>
            {[['1','1 day'],['7','7 days'],['30','30 days'],['90','90 days']].map(([val, lbl]) => (
              <button key={val} onClick={() => setExpiresIn(val)}
                style={{ flex:1, padding:'7px 4px', borderRadius:8, border:`1px solid ${expiresIn===val ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.08)'}`, background: expiresIn===val ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)', color: expiresIn===val ? '#14B8A6' : '#64748B', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ color:'#F43F5E', fontSize:12, marginBottom:12 }}>{error}</div>}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleShare} disabled={saving || !selected}
            style={{ flex:1, padding:'10px', background: !selected ? 'rgba(20,184,166,0.3)' : 'linear-gradient(135deg,#0D9488,#14B8A6)', color:'#fff', border:'none', borderRadius:9, fontWeight:700, cursor: !selected ? 'not-allowed' : 'pointer', fontSize:13 }}>
            {saving ? 'Sharing...' : '↗ Share with Doctor'}
          </button>
          <button onClick={onClose} style={{ padding:'10px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#94A3B8', cursor:'pointer', fontSize:13 }}>Cancel</button>
        </div>

        <div style={{ marginTop:12, fontSize:11, color:'#475569', lineHeight:1.5 }}>
          🔒 DPDP compliant — shared access is logged and auto-expires. You can revoke access anytime.
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportsVaultTab() {
  const [reports,    setReports]    = useState<any[]>([]);
  const [summary,    setSummary]    = useState<Record<string, number>>({});
  const [activeView, setActiveView] = useState<'vault'|'access-log'>('vault');
  const [filter,     setFilter]     = useState('All');
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [shareReport, setShareReport] = useState<any>(null);
  const fileRef                     = useRef<HTMLInputElement>(null);

  const load = (p = 1, type = filter) => {
    if (p === 1) setLoading(true);
    const params: Record<string, any> = { page: p, limit: 12 };
    if (type !== 'All') params.type = type;

    patientAPI.getReports(params)
      .then((res: any) => {
        const inner = res?.data?.data ?? res?.data ?? {};
        const newReports = Array.isArray(inner.reports) ? inner.reports : Array.isArray(inner) ? inner : [];
        if (p === 1) { setReports(newReports); } else { setReports(prev => [...prev, ...newReports]); }
        const rawSummary = inner.summary ?? {};
        setSummary(rawSummary && typeof rawSummary === 'object' && !Array.isArray(rawSummary) ? rawSummary : {});
        setTotal(inner.total ?? newReports.length);
      })
      .catch(() => { setReports([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); load(1, filter); }, [filter]); // eslint-disable-line

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name.replace(/\.[^.]+$/, ''));
    fd.append('type', guessType(file.name));
    try {
      await patientAPI.uploadReport(fd);
      load(1, filter);
    } catch {}
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const typeKeys = Object.keys(TYPE_LABELS);
  const types    = ['All', ...typeKeys];

  const accessLog = reports.flatMap((r: any) =>
    Array.isArray(r.shares) ? r.shares.map((s: any) => ({ report: r, share: s })) : []
  );

  return (
    <>
      <style>{`
        .rv-topbar  { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px; }
        .rv-views   { display:flex; gap:8px; }
        .rv-vbtn    { padding:7px 16px; border-radius:9px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .rv-filters { display:flex; gap:6px; flex-wrap:wrap; }
        .rv-fbtn    { padding:4px 12px; border-radius:100px; cursor:pointer; font-size:11px; font-weight:600; transition:all 0.2s; font-family:'JetBrains Mono',monospace; border:1px solid transparent; }
        .rv-zone    { border:2px dashed; border-radius:14px; padding:28px; text-align:center; cursor:pointer; transition:all 0.2s; margin-bottom:20px; }
        .rv-grid    { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
        .rv-card    { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:18px; transition:box-shadow 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .rv-card:hover { box-shadow:0 4px 16px rgba(13,148,136,0.1); border-color:#b2ddd8; }
        .rv-icon    { width:44px; height:44px; border-radius:12px; background:rgba(13,148,136,0.08); border:1px solid rgba(13,148,136,0.2); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
        .rv-name    { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#0F2D2A; }
        .rv-meta    { font-size:11px; color:#4B6E6A; margin-top:3px; font-family:'JetBrains Mono',monospace; }
        .rv-btns    { display:flex; gap:8px; margin-top:14px; }
        .rv-btn     { flex:1; padding:7px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .rv-shares  { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
        .rv-stag    { background:rgba(139,92,246,0.1); color:#7C3AED; font-size:10px; padding:2px 8px; border-radius:100px; border:1px solid rgba(139,92,246,0.2); font-family:'JetBrains Mono',monospace; }
        .rv-empty   { color:#4B6E6A; font-size:13px; padding:50px 0; text-align:center; }
        .rv-skel    { height:160px; border-radius:14px; background:linear-gradient(90deg,#e8f5f2 25%,#f0faf8 50%,#e8f5f2 75%); background-size:200% 100%; animation:rv-sh 1.5s infinite; }
        @keyframes rv-sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Summary badges */}
      {Object.keys(summary).length > 0 && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
          {Object.entries(summary).map(([type, count]: any) => (
            <div key={type} style={{ background:'#FFFFFF', border:'1px solid #E2EEF0', borderRadius:10, padding:'6px 12px', fontSize:12, color:'#4B6E6A', display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <span>{TYPE_ICONS[type] ?? '📄'}</span>
              <span style={{ color:'#0F2D2A', fontWeight:700 }}>{count}</span>
              <span>{TYPE_LABELS[type] ?? type}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rv-topbar">
        <div className="rv-views">
          {(['vault','access-log'] as const).map(v => (
            <button key={v} className="rv-vbtn" onClick={() => setActiveView(v)}
              style={{ background:activeView===v ? 'rgba(13,148,136,0.1)' : '#fff', color:activeView===v ? '#0D9488' : '#4B6E6A', border:`1px solid ${activeView===v ? 'rgba(13,148,136,0.3)' : '#E2EEF0'}` }}>
              {v === 'vault' ? '📁 Vault' : '🔒 Access Log'}
            </button>
          ))}
        </div>
        {activeView === 'vault' && (
          <div className="rv-filters">
            {types.map(t => (
              <button key={t} className="rv-fbtn" onClick={() => setFilter(t)}
                style={{ background:filter===t ? 'rgba(13,148,136,0.1)' : '#fff', color:filter===t ? '#0D9488' : '#4B6E6A', borderColor:filter===t ? 'rgba(13,148,136,0.3)' : '#E2EEF0' }}>
                {t === 'All' ? 'All' : `${TYPE_ICONS[t] ?? ''} ${TYPE_LABELS[t] ?? t}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeView === 'vault' ? (
        <>
          {/* Upload zone */}
          <div className="rv-zone"
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ borderColor:dragOver ? '#0D9488' : '#b2ddd8', background:dragOver ? 'rgba(13,148,136,0.05)' : '#FAFFFE' }}>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }}
              onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
            <div style={{ fontSize:32, marginBottom:8 }}>{uploading ? '⏳' : '📤'}</div>
            <div style={{ fontWeight:600, color:'#0F2D2A', fontSize:13, marginBottom:4 }}>
              {uploading ? 'Uploading...' : 'Drop report here or click to upload'}
            </div>
            <div style={{ color:'#4B6E6A', fontSize:12 }}>PDF, JPG, PNG — Max 20MB</div>
          </div>

          {/* Reports */}
          {loading ? (
            <div className="rv-grid">{[1,2,3].map(i => <div key={i} className="rv-skel" />)}</div>
          ) : reports.length === 0 ? (
            <div className="rv-empty">
              <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
              <div style={{ color:'#94A3B8', fontWeight:600, marginBottom:6 }}>No reports found</div>
              <div>Upload your first medical report above</div>
            </div>
          ) : (
            <>
              <div className="rv-grid">
                {reports.map((r: any, i: number) => (
                  <div key={r.id ?? i} className="rv-card">
                    <div style={{ display:'flex', gap:12, marginBottom:10 }}>
                      <div className="rv-icon">{TYPE_ICONS[r.type] ?? '📄'}</div>
                      <div style={{ flex:1 }}>
                        <div className="rv-name">{r.name ?? r.fileName ?? 'Unnamed Report'}</div>
                        <div className="rv-meta">
                          {TYPE_LABELS[r.type] ?? r.type ?? 'Report'} · {fmtSize(r.fileSize)} · {fmtDate(r.uploadedAt ?? r.createdAt)}
                        </div>
                      </div>
                      {r.status && (
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, height:'fit-content', flexShrink:0, fontFamily:'JetBrains Mono,monospace',
                          background: r.status==='NORMAL' ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)',
                          color:      r.status==='NORMAL' ? '#22C55E' : '#F43F5E',
                          border:`1px solid ${r.status==='NORMAL' ? 'rgba(34,197,94,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
                          {r.status}
                        </span>
                      )}
                    </div>
                    {r.notes && <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>{r.notes}</div>}
                    {Array.isArray(r.shares) && r.shares.length > 0 && (
                      <div className="rv-shares">
                        {r.shares.map((s: any, j: number) => (
                          <span key={j} className="rv-stag">
                            {s.doctor?.firstName ? `Dr. ${s.doctor.firstName} ${s.doctor.lastName ?? ''}` : 'Shared'}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="rv-btns">
                      <button className="rv-btn"
                        style={{ background:'rgba(20,184,166,0.1)', border:'1px solid rgba(20,184,166,0.2)', color:'#14B8A6' }}
                        onClick={() => r.fileUrl && window.open(r.fileUrl, '_blank')}>
                        ⬇ Download
                      </button>
                      <button className="rv-btn"
                        style={{ background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', color:'#8B5CF6' }}
                        onClick={() => setShareReport(r)}>
                        ↗ Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {reports.length < total && (
                <div style={{ textAlign:'center', marginTop:16 }}>
                  <button onClick={() => { const next = page+1; setPage(next); load(next, filter); }}
                    style={{ padding:'9px 24px', borderRadius:9, border:'1px solid #E2EEF0', background:'#fff', color:'#4B6E6A', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                    Load more ({total - reports.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Access Log */
        <div style={{ background:'#FFFFFF', border:'1px solid #E2EEF0', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2EEF0', fontSize:12, fontWeight:700, color:'#0F2D2A', fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:'.08em' }}>
            DPDP-Compliant Access Log
          </div>
          {accessLog.length === 0 ? (
            <div className="rv-empty">No sharing activity yet.</div>
          ) : (
            accessLog.map((entry: any, i: number) => (
              <div key={i} style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', gap:14, alignItems:'center' }}>
                <span style={{ fontSize:16 }}>🔒</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:'#0F2D2A' }}>
                    <span style={{ color:'#0D9488', fontWeight:600 }}>
                      {entry.share?.doctor?.firstName ? `Dr. ${entry.share.doctor.firstName} ${entry.share.doctor.lastName ?? ''}` : 'Doctor'}
                    </span>{' '}shared access to{' '}
                    <span style={{ fontWeight:600 }}>{entry.report?.name ?? 'Report'}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#4B6E6A', marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>
                    Shared {fmtDate(entry.share?.sharedAt)} · Expires {fmtDate(entry.share?.expiresAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {shareReport && (
        <ShareModal
          report={shareReport}
          onClose={() => setShareReport(null)}
          onShared={() => { setShareReport(null); load(1, filter); }}
        />
      )}
    </>
  );
}
