'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { patientAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';

type DomainStatus = 'STRONG' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEEDS_REVIEW' | 'NO_DATA';
type ScoreStatus = 'STRONG' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEEDS_REVIEW' | 'INSUFFICIENT_DATA';

type Domain = {
  key: string;
  label: string;
  weight: number;
  score: number | null;
  status: DomainStatus;
  confidence: number;
  latestValue?: string | null;
  measuredAt?: string | null;
  explanation: string;
  source: string;
};

type Alert = {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  code: string;
  title: string;
  message: string;
  domain: string;
  observedAt?: string | null;
};

type HealthScore = {
  score: number | null;
  status: ScoreStatus;
  confidence: number;
  dataCoverage: number;
  algorithmVersion: string;
  calculatedAt: string;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'UNKNOWN';
  delta: number | null;
  hasCriticalAlert: boolean;
  domains: Domain[];
  alerts: Alert[];
  missingData: Array<{ key: string; label: string; reason: string }>;
  recommendations: string[];
  history: Array<{ score: number | null; status: string; confidence: number; algorithmVersion: string; date: string }>;
};

const C = {
  card: '#FFFFFF', border: '#DCE8F2', text: '#0F2742', text2: '#385672', text3: '#6D859B',
  blue: '#1A6BB5', blueBg: '#EDF6FD', green: '#15803D', amber: '#B45309', red: '#BE123C', purple: '#6D28D9',
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  STRONG: { label: 'Strong', color: '#15803D', bg: '#ECFDF3' },
  GOOD: { label: 'Good / Monitor', color: '#1A6BB5', bg: '#EDF6FD' },
  NEEDS_ATTENTION: { label: 'Needs Attention', color: '#B45309', bg: '#FFF7ED' },
  NEEDS_REVIEW: { label: 'Needs Review', color: '#BE123C', bg: '#FFF1F2' },
  INSUFFICIENT_DATA: { label: 'Insufficient Data', color: '#64748B', bg: '#F1F5F9' },
  NO_DATA: { label: 'No Data', color: '#64748B', bg: '#F1F5F9' },
};

function unwrap<T>(res: any): T {
  return (res?.data?.data ?? res?.data ?? {}) as T;
}

function scoreColor(score: number | null) {
  if (score == null) return '#64748B';
  if (score >= 85) return C.green;
  if (score >= 70) return C.blue;
  if (score >= 55) return C.amber;
  return C.red;
}

function ScoreRing({ score }: { score: number | null }) {
  const value = score ?? 0;
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: 132, height: 132, flexShrink: 0 }}>
      <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="66" cy="66" r="52" fill="none" stroke="#E8EEF4" strokeWidth="12" />
        <circle cx="66" cy="66" r="52" fill="none" stroke={scoreColor(score)} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset .7s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 900, color: scoreColor(score), lineHeight: 1 }}>{score ?? '—'}</div>
        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>/ 100</div>
      </div>
    </div>
  );
}

function ConfidenceBar({ value, coverage }: { value: number; coverage: number }) {
  const label = value >= 80 ? 'High confidence' : value >= 55 ? 'Moderate confidence' : value >= 30 ? 'Limited confidence' : 'Very limited data';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: C.text2, fontWeight: 700 }}>Data confidence</span>
        <span style={{ color: C.text3 }}>{value}% · {label}</span>
      </div>
      <div style={{ height: 8, background: '#E8EEF4', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', borderRadius: 100, background: value >= 70 ? C.green : value >= 40 ? C.blue : C.amber, transition: 'width .5s ease' }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: C.text3 }}>Measured domains currently cover {coverage}% of the Health Status Index weighting.</div>
    </div>
  );
}

function DomainCard({ domain }: { domain: Domain }) {
  const meta = STATUS[domain.status] ?? STATUS.NO_DATA;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{domain.label}</div>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, color: meta.color, background: meta.bg, fontWeight: 800 }}>{meta.label}</span>
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>Weight {domain.weight}% · Confidence {domain.confidence}% · {domain.source}</div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor(domain.score) }}>{domain.score ?? '—'}</div>
      </div>
      <div style={{ height: 6, background: '#EDF2F7', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ width: `${domain.score ?? 0}%`, height: '100%', borderRadius: 100, background: scoreColor(domain.score) }} />
      </div>
      {domain.latestValue && <div style={{ fontSize: 12, fontWeight: 700, color: C.text2 }}>Latest: {domain.latestValue}</div>}
      <div style={{ fontSize: 12, lineHeight: 1.55, color: C.text3 }}>{domain.explanation}</div>
    </div>
  );
}

function History({ rows }: { rows: HealthScore['history'] }) {
  const valid = rows.filter(r => r.score != null).slice(0, 8).reverse();
  if (!valid.length) return <div style={{ fontSize: 12, color: C.text3 }}>No historical snapshots yet. Use “Recalculate & save” to create the first versioned snapshot.</div>;
  const max = 100;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120, paddingTop: 12 }}>
      {valid.map((r, i) => {
        const score = r.score ?? 0;
        return (
          <div key={`${r.date}-${i}`} style={{ flex: 1, minWidth: 26, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 5, height: '100%' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: scoreColor(score) }}>{score}</span>
            <div style={{ width: '100%', maxWidth: 30, height: `${Math.max(6, (score / max) * 78)}px`, background: scoreColor(score), borderRadius: '6px 6px 2px 2px', opacity: .88 }} />
            <span style={{ fontSize: 9, color: C.text3, whiteSpace: 'nowrap' }}>{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OverviewTab({ data, loading: parentLoading }: { data?: any; loading?: boolean }) {
  const uiStore = useUIStore() as any;
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await patientAPI.getHealthScore();
      setHealth(unwrap<HealthScore>(res));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Unable to load your health score.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true); setError('');
    try {
      const res = await patientAPI.refreshHealthScore();
      setHealth(unwrap<HealthScore>(res));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Unable to recalculate your health score.');
    } finally { setRefreshing(false); }
  };

  const critical = useMemo(() => health?.alerts?.filter(a => a.severity === 'CRITICAL') ?? [], [health]);
  const warnings = useMemo(() => health?.alerts?.filter(a => a.severity === 'WARNING') ?? [], [health]);
  const statusMeta = STATUS[health?.status ?? 'INSUFFICIENT_DATA'];
  const dashboardScore = data?.healthScore?.score;

  if (loading || parentLoading) {
    return <div style={{ display: 'grid', gap: 14 }}><div style={{ height: 210, borderRadius: 16, background: '#E9F1F7' }} /><div style={{ height: 300, borderRadius: 16, background: '#EEF4F8' }} /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FFF1F2', border: '1px solid #FECDD3', color: C.red, fontSize: 13 }}>{error}</div>}

      {critical.map(a => (
        <div key={a.code} style={{ padding: '15px 18px', borderRadius: 14, background: '#FFF1F2', border: '1.5px solid #FDA4AF' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.red }}>⚠ Critical health alert · {a.title}</div>
          <div style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 1.6, marginTop: 5 }}>{a.message}</div>
          <div style={{ fontSize: 11, color: '#9F1239', marginTop: 6 }}>The overall score must not be used to dismiss this alert.</div>
        </div>
      ))}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22, boxShadow: '0 3px 14px rgba(15,39,66,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: C.text3, fontWeight: 800 }}>HealthConnect Health Status Index</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>Your Health Score</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>Algorithm {health?.algorithmVersion ?? 'HC-HSI-1.0'} · measured health status, not a diagnosis</div>
          </div>
          <button onClick={refresh} disabled={refreshing} style={{ padding: '9px 15px', borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', color: C.blue, fontSize: 12, fontWeight: 800, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? .65 : 1 }}>
            {refreshing ? 'Recalculating…' : '↻ Recalculate & save'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 24, alignItems: 'center' }}>
          <ScoreRing score={health?.score ?? null} />
          <div>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ padding: '5px 11px', borderRadius: 100, color: statusMeta.color, background: statusMeta.bg, fontWeight: 900, fontSize: 12 }}>{statusMeta.label}</span>
              {health?.trend && health.trend !== 'UNKNOWN' && <span style={{ fontSize: 12, color: C.text2 }}>{health.trend === 'IMPROVING' ? '↗ Improving' : health.trend === 'WORSENING' ? '↘ Worsening' : '→ Stable'}{health.delta != null ? ` (${health.delta > 0 ? '+' : ''}${health.delta})` : ''}</span>}
            </div>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.65, margin: '0 0 16px' }}>
              {health?.score == null
                ? 'There is not enough reliable structured health data to calculate a responsible overall score yet. Missing data is never assumed to be healthy.'
                : 'The score is calculated only from domains with usable data. Missing domains do not add or subtract points; confidence tells you how complete and current the assessment is.'}
            </p>
            <ConfidenceBar value={health?.confidence ?? 0} coverage={health?.dataCoverage ?? 0} />
          </div>
        </div>

        {dashboardScore != null && health?.score != null && dashboardScore !== health.score && (
          <div style={{ marginTop: 14, fontSize: 11, color: C.text3 }}>Dashboard summary will synchronize to the current Health Status Index on its next refresh.</div>
        )}
      </div>

      {warnings.length > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.amber, marginBottom: 8 }}>Health alerts</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {warnings.map(a => <div key={`${a.code}-${a.observedAt}`} style={{ fontSize: 12, color: '#7C2D12', lineHeight: 1.55 }}><strong>{a.title}:</strong> {a.message}</div>)}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 10 }}>
          <div><div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>Health domains</div><div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>10-domain model; unavailable data stays explicitly unscored.</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(285px,1fr))', gap: 12 }}>
          {(health?.domains ?? []).map(d => <DomainCard key={d.key} domain={d} />)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 14 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 17 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 10 }}>What to focus on</div>
          {(health?.recommendations?.length ?? 0) === 0 ? <div style={{ fontSize: 12, color: C.text3 }}>No recommendations available yet.</div> : (
            <div style={{ display: 'grid', gap: 9 }}>{health?.recommendations.map((r, i) => <div key={i} style={{ fontSize: 12, lineHeight: 1.55, color: C.text2, display: 'flex', gap: 8 }}><span style={{ color: C.blue, fontWeight: 900 }}>{i + 1}.</span><span>{r}</span></div>)}</div>
          )}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 17 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 8 }}>Missing data</div>
          {(health?.missingData?.length ?? 0) === 0 ? <div style={{ fontSize: 12, color: C.green }}>All current v1 domains have usable data.</div> : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{health?.missingData.map(m => <span key={m.key} title={m.reason} style={{ padding: '5px 9px', borderRadius: 100, background: '#F1F5F9', color: C.text3, fontSize: 10, fontWeight: 700 }}>{m.label}</span>)}</div>
          )}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 17 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div><div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Versioned score history</div><div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>Snapshots are comparable only within the same algorithm version.</div></div>
          <span style={{ fontSize: 10, color: C.purple, fontWeight: 800 }}>{health?.algorithmVersion}</span>
        </div>
        <History rows={health?.history ?? []} />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => uiStore.setActivePage('vitals')} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', color: C.blue, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Log vitals</button>
        <button onClick={() => uiStore.setActivePage('medications')} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', color: C.blue, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Medication adherence</button>
        <button onClick={() => uiStore.setActivePage('symptoms')} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', color: C.blue, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Track symptoms</button>
      </div>
    </div>
  );
}
