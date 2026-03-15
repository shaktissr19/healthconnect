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
  { id: 'overview',   label: 'Overview',        icon: '📊' },
  { id: 'history',    label: 'Medical History',  icon: '📋' },
  { id: 'symptoms',   label: 'Symptoms Tracker', icon: '🩺' },
  { id: 'treatments', label: 'Treatments',       icon: '💊' },
  { id: 'vault',      label: 'Reports Vault',    icon: '📁' },
  { id: 'insights',   label: 'Insights',         icon: '📈' },
] as const;
type TabId = typeof TABS[number]['id'];

function greeting(name?: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${g}, ${name.split(' ')[0]}.` : `${g}.`;
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            ❤️ My Health
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>
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
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            📤 Upload Report
          </button>
          <button onClick={() => switchTab('symptoms')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.35)', transition: 'all 0.2s' }}>
            + Log Symptom
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            padding: '11px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            color: tab === t.id ? '#14B8A6' : 'rgba(255,255,255,0.45)',
            borderBottom: tab === t.id ? '2px solid #14B8A6' : '2px solid transparent',
            transition: 'all 0.15s', marginBottom: -1,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview'    && <OverviewTab      data={dashData}    loading={dashLoading} />}
        {tab === 'history'     && <MedicalHistoryTab />}
        {tab === 'symptoms'    && <SymptomsTab />}
        {tab === 'treatments'  && <TreatmentsTab />}
        {tab === 'vault'       && <ReportsVaultTab />}
        {tab === 'insights'    && <InsightsTab      data={dashData}    loading={dashLoading} />}
      </div>

      <style>{`@keyframes hcFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
