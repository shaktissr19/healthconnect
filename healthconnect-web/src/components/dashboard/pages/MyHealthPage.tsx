'use client';
import { useEffect, useState, useCallback } from 'react';
import { patientAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import OverviewTab       from '@/components/dashboard/my-health/OverviewTab';
import MedicalHistoryTab from '@/components/dashboard/my-health/MedicalHistoryTab';
import SymptomsTab       from '@/components/dashboard/my-health/SymptomsTab';
import TreatmentsTab     from '@/components/dashboard/my-health/TreatmentsTab';
import ReportsVaultTab   from '@/components/dashboard/my-health/ReportsVaultTab';
import InsightsTab       from '@/components/dashboard/my-health/InsightsTab';

const TABS = [
  { id: 'overview',    label: 'Overview',        icon: '📊' },
  { id: 'history',     label: 'Medical History', icon: '📋' },
  { id: 'conditions',  label: 'My Conditions',   icon: '🩺' },
  { id: 'symptoms',    label: 'Symptoms Tracker',icon: '🤒' },
  { id: 'treatments',  label: 'Treatments',      icon: '💊' },
  { id: 'vault',       label: 'Reports Vault',   icon: '📁' },
  { id: 'insights',    label: 'Insights',        icon: '📈' },
] as const;
type TabId = typeof TABS[number]['id'];

function greeting(name?: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${g}, ${name.split(' ')[0]}.` : `${g}.`;
}

// ── Condition-Centric View ────────────────────────────────────────────────────
function ConditionCentricView({ dashData }: { dashData: any }) {
  const [conditions, setConditions] = useState<any[]>([]);
  const [allData,    setAllData]    = useState<any>({});
  const [selected,   setSelected]   = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.allSettled([
      patientAPI.getMedicalHistory(),
      patientAPI.getMedications(),
      patientAPI.getSymptoms({ limit: 50 }),
    ]).then(([histRes, medRes, symRes]) => {
      const hist = (histRes as any).value?.data?.data ?? (histRes as any).value?.data ?? {};
      const meds = (medRes  as any).value?.data?.data ?? (medRes  as any).value?.data ?? [];
      const syms = (symRes  as any).value?.data?.data ?? (symRes  as any).value?.data ?? {};
      const conds = hist.conditions ?? [];
      setConditions(conds);
      setAllData({ hist, meds: Array.isArray(meds) ? meds : meds.medications ?? [], syms: syms.symptoms ?? [] });
      if (conds.length > 0) setSelected(conds[0].id);
      setLoading(false);
    });
  }, []);

  const C2 = { teal:'#0D9488', tealBg:'#F0FDF9', border:'#E2EEF0', text:'#0F2D2A', text2:'#4B6E6A', text3:'#64748B', white:'#FFFFFF', red:'#EF4444', green:'#22C55E', amber:'#F59E0B' };
  const STATUS_COLORS: Record<string,string> = { ACTIVE:'#F43F5E', MANAGED:'#F59E0B', RESOLVED:'#22C55E', CHRONIC:'#8B5CF6' };

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {[1,2,3].map(i => <div key={i} style={{ height:80, borderRadius:14, background:'linear-gradient(90deg,#e8f5f2 25%,#f0faf8 50%,#e8f5f2 75%)', backgroundSize:'200% 100%', animation:'mh-sh 1.5s infinite' }}/>)}
    </div>
  );

  if (conditions.length === 0) return (
    <div style={{ textAlign:'center', padding:'60px 20px', background:C2.white, borderRadius:16, border:`1px solid ${C2.border}` }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🩺</div>
      <div style={{ fontWeight:700, fontSize:16, color:C2.text, marginBottom:8 }}>No conditions recorded</div>
      <div style={{ fontSize:13, color:C2.text3 }}>Add conditions in Medical History to see a condition-centric view</div>
    </div>
  );

  const cond = conditions.find((c:any) => c.id === selected) ?? conditions[0];

  // Filter medications and symptoms linked to this condition
  const relatedMeds = allData.meds.filter((m:any) =>
    m.prescribedFor?.toLowerCase().includes(cond.name?.toLowerCase()) ||
    m.conditionId === cond.id ||
    (cond.notes ?? '').toLowerCase().includes(m.name?.toLowerCase())
  );
  const relatedSyms = allData.syms.filter((s:any) =>
    s.conditionId === cond.id ||
    s.relatedCondition?.toLowerCase().includes(cond.name?.toLowerCase())
  );
  const statusColor = STATUS_COLORS[cond.status] ?? '#64748B';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:20 }}>
      {/* Condition selector sidebar */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C2.text2, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Your Conditions</div>
        {conditions.map((c:any) => (
          <button key={c.id} onClick={() => setSelected(c.id)}
            style={{ padding:'12px 14px', borderRadius:12, border:`1.5px solid ${selected===c.id?C2.teal:C2.border}`, background: selected===c.id?C2.tealBg:C2.white, textAlign:'left', cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color: selected===c.id?C2.teal:C2.text }}>{c.name}</span>
              <span style={{ fontSize:9, padding:'1px 6px', borderRadius:100, color:STATUS_COLORS[c.status]??'#64748B', background:`${STATUS_COLORS[c.status]??'#64748B'}15`, border:`1px solid ${STATUS_COLORS[c.status]??'#64748B'}30`, fontWeight:700, marginLeft:'auto' }}>{c.status}</span>
            </div>
            {c.diagnosedDate && <div style={{ fontSize:11, color:C2.text3 }}>Dx: {new Date(c.diagnosedDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>}
          </button>
        ))}
      </div>

      {/* Condition detail */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Header card */}
        <div style={{ background:C2.white, border:`1px solid ${C2.border}`, borderRadius:16, padding:'20px 22px', borderLeft:`4px solid ${statusColor}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <h2 style={{ fontSize:20, fontWeight:800, color:C2.text, margin:'0 0 4px' }}>{cond.name}</h2>
              {cond.icdCode && <span style={{ fontSize:12, color:C2.text3, fontFamily:'JetBrains Mono,monospace' }}>ICD: {cond.icdCode}</span>}
            </div>
            <span style={{ padding:'4px 12px', borderRadius:100, fontSize:12, fontWeight:700, color:statusColor, background:`${statusColor}15`, border:`1px solid ${statusColor}30` }}>{cond.status}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {cond.diagnosedDate && <div style={{ background:'#F8FFFE', borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:10, color:C2.text3, textTransform:'uppercase', letterSpacing:'0.05em' }}>Diagnosed</div><div style={{ fontWeight:700, fontSize:13, color:C2.text, marginTop:3 }}>{new Date(cond.diagnosedDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div>}
            {cond.treatingDoctor && <div style={{ background:'#F8FFFE', borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:10, color:C2.text3, textTransform:'uppercase', letterSpacing:'0.05em' }}>Treating Doctor</div><div style={{ fontWeight:700, fontSize:13, color:C2.text, marginTop:3 }}>{cond.treatingDoctor}</div></div>}
            {cond.lastReviewed && <div style={{ background:'#F8FFFE', borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:10, color:C2.text3, textTransform:'uppercase', letterSpacing:'0.05em' }}>Last Reviewed</div><div style={{ fontWeight:700, fontSize:13, color:C2.text, marginTop:3 }}>{new Date(cond.lastReviewed).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div>}
          </div>
          {cond.notes && <div style={{ marginTop:12, padding:'10px 14px', background:'#F8FFFE', borderRadius:10, fontSize:13, color:C2.text2, lineHeight:1.6, fontStyle:'italic' }}>{cond.notes}</div>}
        </div>

        {/* Related medications */}
        <div style={{ background:C2.white, border:`1px solid ${C2.border}`, borderRadius:16, padding:'18px 20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C2.text, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            💊 Medications for {cond.name}
            <span style={{ fontSize:11, color:C2.text3, fontWeight:400 }}>({relatedMeds.length} found)</span>
          </div>
          {relatedMeds.length === 0 ? (
            <div style={{ fontSize:12, color:C2.text3, padding:'12px 0' }}>No medications directly linked to this condition. Add prescriptions in Treatments.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {relatedMeds.map((m:any, i:number) => (
                <div key={m.id??i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#F8FFFE', borderRadius:10, border:`1px solid ${C2.border}` }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:C2.teal, flexShrink:0 }}/>
                  <span style={{ flex:1, fontWeight:600, fontSize:13, color:C2.text }}>{m.name}</span>
                  <span style={{ fontSize:12, color:C2.text2 }}>{m.dosage}</span>
                  {m.status && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background: m.status==='ACTIVE'?'rgba(34,197,94,0.1)':'#F1F5F9', color: m.status==='ACTIVE'?'#16A34A':'#64748B', fontWeight:700 }}>{m.status}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related symptoms */}
        <div style={{ background:C2.white, border:`1px solid ${C2.border}`, borderRadius:16, padding:'18px 20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C2.text, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            🤒 Recent Symptoms
            <span style={{ fontSize:11, color:C2.text3, fontWeight:400 }}>({relatedSyms.length} logged)</span>
          </div>
          {relatedSyms.length === 0 ? (
            <div style={{ fontSize:12, color:C2.text3, padding:'12px 0' }}>No symptoms logged for this condition yet.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {relatedSyms.slice(0,5).map((s:any, i:number) => {
                const sevCol = s.severity>=7?C2.red:s.severity>=4?C2.amber:C2.green;
                return (
                  <div key={s.id??i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#F8FFFE', borderRadius:10, border:`1px solid ${C2.border}` }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:sevCol, flexShrink:0 }}/>
                    <span style={{ flex:1, fontWeight:600, fontSize:13, color:C2.text }}>{s.name}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:sevCol }}>{s.severity}/10</span>
                    <span style={{ fontSize:11, color:C2.text3 }}>{s.loggedAt?new Date(s.loggedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyHealthPage() {
  const uiStore = useUIStore() as any;
  const { activeTab, setActiveTab } = uiStore;

  const resolveTab = (): TabId => {
    const valid = TABS.map(t => t.id) as string[];
    return valid.includes(activeTab) ? (activeTab as TabId) : 'overview';
  };
  const [tab, setTab] = useState<TabId>(resolveTab);

  useEffect(() => {
    const valid = TABS.map(t => t.id) as string[];
    if (valid.includes(activeTab) && activeTab !== tab) setTab(activeTab as TabId);
  }, [activeTab]); // eslint-disable-line

  const switchTab = (id: TabId) => { setTab(id); setActiveTab(id); };

  // Dashboard data shared between Overview + Insights
  const [dashData,    setDashData]    = useState<any>(null);
  const [dashLoading, setDashLoading] = useState(true);

  const loadDash = useCallback(async () => {
    setDashLoading(true);
    try {
      const res = await patientAPI.dashboard();
      setDashData(res?.data?.data ?? res?.data ?? {});
    } catch { setDashData({}); }
    setDashLoading(false);
  }, []);

  useEffect(() => { loadDash(); }, [loadDash]);

  const firstName = dashData?.profile?.firstName ?? '';
  const lastName  = dashData?.profile?.lastName  ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ');

  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: '#0F2D2A', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', border: '1px solid rgba(20,184,166,0.35)', maxWidth: 340, animation: 'hcFadeIn 0.25s ease' }}>
          {toast}
        </div>
      )}

      {/* Header — light theme */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0D1F3C', margin: '0 0 5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            ❤️ My Health
          </h1>
          <p style={{ color: '#2C4A6E', fontSize: 13, margin: 0 }}>
            {dashLoading ? 'Loading your health summary…' : (
              <>
                {greeting(fullName)}{' '}
                {(dashData?.kpis?.activeConditionsCount ?? 0) > 0
                  ? `Managing ${dashData.kpis.activeConditionsCount} active condition${dashData.kpis.activeConditionsCount > 1 ? 's' : ''}.`
                  : 'Your complete health profile — shared with your doctors.'}
                {(dashData?.recentVitals?.length ?? 0) > 0 && (
                  <span style={{ color: '#22C55E', marginLeft: 8 }}>● Vitals logged</span>
                )}
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => switchTab('vault')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#FFFFFF', border: '1.5px solid #C8DFF0', borderRadius: 10, color: '#2C4A6E', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            📤 Upload Report
          </button>
          <button onClick={() => switchTab('symptoms')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.25)', transition: 'all 0.2s' }}>
            + Log Symptom
          </button>
        </div>
      </div>

      {/* Tabs — blue theme */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #C8DFF0', overflowX: 'auto', background: '#FFFFFF', borderRadius: '14px 14px 0 0', padding: '0 6px', boxShadow: '0 2px 8px rgba(27,59,111,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            color: tab === t.id ? '#1A6BB5' : '#5A7A9B',
            borderBottom: tab === t.id ? '2px solid #1A6BB5' : '2px solid transparent',
            marginBottom: -2,
            transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: '#F0F7FD', borderRadius: '0 0 14px 14px', padding: '20px', minHeight: 400 }}>
        {tab === 'overview'    && <OverviewTab      data={dashData}    loading={dashLoading} />}
        {tab === 'history'     && <MedicalHistoryTab />}
        {tab === 'conditions'  && <ConditionCentricView dashData={dashData} />}
        {tab === 'symptoms'    && <SymptomsTab />}
        {tab === 'treatments'  && <TreatmentsTab />}
        {tab === 'vault'       && <ReportsVaultTab />}
        {tab === 'insights'    && <InsightsTab      data={dashData}    loading={dashLoading} />}
      </div>

      <style>{`@keyframes hcFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
