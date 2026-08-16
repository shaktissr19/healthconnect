'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, patientAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';

type Domain = {
  key: string;
  label: string;
  weight: number;
  score: number | null;
  status: string;
  confidence: number;
  latestValue?: string | null;
  explanation: string;
  source: string;
  components?: Array<{
    key?: string;
    label: string;
    score: number | null;
    confidence: number;
    status: string;
    value?: string | null;
    explanation: string;
  }>;
};

type Alert = {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  code: string;
  title: string;
  message: string;
  observedAt?: string | null;
};

type ReadinessItem = { key: string; label: string; complete: boolean; reason: string };

type HealthScore = {
  score: number | null;
  status: string;
  scoreType?: 'COMPLETE' | 'PROVISIONAL' | 'INSUFFICIENT_DATA';
  provisional?: boolean;
  assessmentMessage?: string;
  confidence: number;
  dataCoverage: number;
  algorithmVersion: string;
  assessmentLevel: string;
  assessmentReadiness: {
    complete: boolean;
    completed: number;
    total: number;
    percent: number;
    items: ReadinessItem[];
  };
  riskContext: {
    ageYears: number | null;
    screeningRecommendations: Array<{ code: string; priority: string; message: string }>;
  };
  domains: Domain[];
  alerts: Alert[];
  limitations?: Array<{ code: string; title: string; message: string; severity: string }>;
};

type Lifestyle = {
  heightCm: number | null;
  waistCm: number | null;
  moderateActivityMinWeek: number | null;
  vigorousActivityMinWeek: number | null;
  sleepHoursAvg: number | null;
  tobaccoStatus: string | null;
  fruitVegServingsDay: number | null;
  medicationStatus: string | null;
  conditionStatus: string | null;
  familyHistoryStatus: string | null;
  alcoholStatus: string | null;
};

type DomainAction = { label: string; onClick: () => void };
type Focus = { title: string; text: string };
type AssessmentSection = 'vitals' | 'details' | 'records';

const C = {
  blue: '#1A6BB5',
  cyan: '#16A6B6',
  green: '#15803D',
  amber: '#B45309',
  red: '#BE123C',
  muted: '#6B8194',
  border: '#DDE8F1',
  ink: '#142B40',
};

const unwrap = <T,>(r: any): T => (r?.data?.data ?? r?.data ?? {}) as T;
const scoreColor = (n: number | null) => n == null ? C.muted : n >= 85 ? C.green : n >= 70 ? C.blue : n >= 55 ? C.amber : C.red;
const statusLabel = (s: string) => ({
  STRONG: 'Strong',
  GOOD: 'Good',
  NEEDS_ATTENTION: 'Needs attention',
  NEEDS_REVIEW: 'Needs review',
  NOT_APPLICABLE: 'Not applicable',
  ESTABLISHING: 'Establishing',
  NO_DATA: 'Needs data',
} as Record<string, string>)[s] ?? s.replace(/_/g, ' ');

const iconFor = (k: string) => ({
  cardiovascular: '❤',
  metabolic_body: '◈',
  lifestyle: '◉',
  sleep_recovery: '☾',
  condition_control: '✚',
  treatment_care: '◆',
  symptoms_function: '≈',
} as Record<string, string>)[k] ?? '•';

function Gauge({ score }: { score: number | null }) {
  const value = score ?? 0;
  const r = 58;
  const c = 2 * Math.PI * r;
  const o = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="hc-gauge">
      <svg width="154" height="154">
        <circle cx="77" cy="77" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="12" />
        <circle cx="77" cy="77" r={r} fill="none" stroke={score == null ? 'rgba(255,255,255,.24)' : '#fff'} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o} transform="rotate(-90 77 77)" />
      </svg>
      <div className="hc-gauge-center"><strong>{score ?? '—'}</strong><span>HEALTH SCORE</span></div>
    </div>
  );
}

function suggestedFocus(d?: Domain): Focus | null {
  if (!d || d.score == null || d.score >= 85) return null;
  const scored = (d.components ?? []).filter(c => c.score != null).sort((a, b) => (a.score ?? 999) - (b.score ?? 999));
  const low = scored[0];
  const value = low?.value ? ` Current: ${low.value}.` : '';

  if (d.key === 'lifestyle') {
    if (low?.key === 'activity') return {
      title: 'Suggested focus — Physical activity',
      text: `Physical activity is the biggest opportunity within Lifestyle Health.${value} Build up gradually toward at least 150 moderate-equivalent minutes per week, as appropriate for your health and ability.`,
    };
    if (low?.key === 'tobacco') return {
      title: 'Suggested focus — Tobacco exposure',
      text: `Tobacco exposure is the main modifiable Lifestyle Health concern.${value} Reducing and stopping smoked or smokeless tobacco can substantially improve long-term health risk.`,
    };
    return { title: 'Suggested focus — Lifestyle Health', text: `Lifestyle Health is currently your lowest measured domain at ${d.score}/100. Review physical activity and tobacco exposure for the biggest scoreable opportunities.` };
  }

  if (d.key === 'cardiovascular') {
    if (low?.key === 'blood_pressure') return { title: 'Suggested focus — Blood pressure', text: `Blood pressure is the main opportunity within Cardiovascular Health.${value} Repeat readings on different days improve certainty and help show whether the pattern is persistent.` };
    if (low?.key === 'lipids') return { title: 'Suggested focus — Blood lipids', text: `Blood lipids are the main opportunity within Cardiovascular Health.${value} Review the structured result and clinical context with your clinician when appropriate.` };
  }

  if (d.key === 'metabolic_body') {
    if (low?.key === 'glucose') return { title: 'Suggested focus — Glucose / HbA1c', text: `Glucose control is the main opportunity within Metabolic & Body Health.${value} Interpretation depends on whether the value is HbA1c, fasting, post-meal or random.` };
    if (low?.key === 'bmi') return { title: 'Suggested focus — Body composition', text: `Body composition is the main opportunity within Metabolic & Body Health.${value} BMI is a screening measure; waist and metabolic results add useful context.` };
    if (low?.key === 'waist') return { title: 'Suggested focus — Waist circumference', text: `Central adiposity is the main opportunity within Metabolic & Body Health.${value} Use it together with BMI and metabolic results rather than as a diagnosis by itself.` };
  }

  if (d.key === 'sleep_recovery') return { title: 'Suggested focus — Sleep', text: `Sleep & Recovery is currently ${d.score}/100.${value} Review your usual nightly sleep duration and consistency.` };
  if (d.key === 'treatment_care') return { title: 'Suggested focus — Treatment & Care', text: `Treatment & Care is currently ${d.score}/100.${value} Review prescribed medicines and adherence logs; this domain applies only when regular treatment is actually prescribed.` };
  if (d.key === 'condition_control') return { title: 'Suggested focus — Condition control', text: `Known Condition Control is currently ${d.score}/100.${value} HealthConnect scores only supported, measurable control indicators and does not invent scores for unsupported conditions.` };
  if (d.key === 'symptoms_function') return { title: 'Suggested focus — Symptoms & function', text: `Recent symptom burden is currently the lowest measured area.${value} Update unresolved or significant symptoms so the assessment reflects your current state.` };
  return { title: `Suggested focus — ${d.label}`, text: `${d.label} is currently your lowest measurable domain at ${d.score}/100. Open the domain details to see the measurements contributing to it.` };
}

function AssessmentForm({
  afterSave,
  open,
  setOpen,
  formRef,
  readiness,
  onOpenVitals,
  onOpenHistory,
  onOpenMedications,
}: {
  afterSave: () => Promise<void>;
  open: boolean;
  setOpen: (v: boolean) => void;
  formRef: any;
  readiness: HealthScore['assessmentReadiness'] | undefined;
  onOpenVitals: () => void;
  onOpenHistory: () => void;
  onOpenMedications: () => void;
}) {
  const empty: Lifestyle = {
    heightCm: null,
    waistCm: null,
    moderateActivityMinWeek: null,
    vigorousActivityMinWeek: null,
    sleepHoursAvg: null,
    tobaccoStatus: null,
    fruitVegServingsDay: null,
    medicationStatus: null,
    conditionStatus: null,
    familyHistoryStatus: null,
    alcoholStatus: null,
  };

  const [f, setF] = useState<Lifestyle>(empty);
  const [active, setActive] = useState<AssessmentSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/patient/health-score/lifestyle')
      .then(r => setF({ ...empty, ...unwrap<Lifestyle>(r) }))
      .catch(() => setMsg('Unable to load assessment inputs.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setActive(prev => prev ?? 'details');
  }, [open]);

  const set = (k: keyof Lifestyle, v: any) => setF(p => ({ ...p, [k]: v === '' ? null : v }));

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.put('/patient/health-score/lifestyle', f);
      await afterSave();
      setMsg('✓ Saved and Health Score recalculated.');
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? 'Unable to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  const number = (label: string, key: keyof Lifestyle, ph: string, opts: { optional?: boolean; unit?: string; help?: string; min?: number; max?: number; step?: number } = {}) => (
    <label className="hc-field">
      <span>{label}{opts.optional && <em> optional</em>}</span>
      <div className="hc-input-unit">
        <input type="number" min={opts.min} max={opts.max} step={opts.step} value={(f[key] as number | null) ?? ''} placeholder={ph} onChange={e => set(key, e.target.value === '' ? null : Number(e.target.value))} />
        {opts.unit && <b>{opts.unit}</b>}
      </div>
      {opts.help && <small className="hc-help">{opts.help}</small>}
    </label>
  );

  const select = (label: string, key: keyof Lifestyle, opts: Array<[string, string]>, help?: string) => (
    <label className="hc-field">
      <span>{label}</span>
      <select value={(f[key] as string | null) ?? ''} onChange={e => set(key, e.target.value)}>
        <option value="">Select</option>
        {opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
      {help && <small className="hc-help">{help}</small>}
    </label>
  );

  const remaining = Math.max(0, (readiness?.total ?? 10) - (readiness?.completed ?? 0));
  const item = (key: string) => readiness?.items?.find(i => i.key === key);
  const issue = (key: string) => {
    const x = item(key);
    return x && !x.complete ? x.reason : '';
  };
  const doneCount = (keys: string[]) => keys.filter(k => item(k)?.complete).length;
  const detailKeys = ['body_composition', 'tobacco', 'activity', 'sleep'];
  const recordKeys = ['conditions', 'medications', 'family_history'];
  const declarationIssues = recordKeys.map(k => item(k)).filter((x): x is ReadinessItem => !!x && !x.complete);

  const moderate = f.moderateActivityMinWeek ?? 0;
  const vigorous = f.vigorousActivityMinWeek ?? 0;
  const equivalent = moderate + 2 * vigorous;
  const activityText = equivalent >= 300
    ? 'At or above the upper end of the adult aerobic reference'
    : equivalent >= 150
      ? 'Meets the adult aerobic reference'
      : equivalent > 0
        ? 'Below the adult aerobic reference'
        : 'No weekly aerobic activity entered';

  const toggle = (section: AssessmentSection) => {
    setActive(prev => {
      const next = prev === section ? null : section;
      setOpen(next != null);
      return next;
    });
    setMsg('');
  };

  const row = (key: AssessmentSection, icon: string, title: string, subtitle: string, status: string, complete: boolean) => (
    <button className="hc-assess-row" onClick={() => toggle(key)}>
      <span className="hc-assess-icon">{icon}</span>
      <span className="hc-assess-copy"><strong>{title}</strong><small>{subtitle}</small></span>
      <span className={`hc-assess-status${complete ? ' done' : ''}`}>{status}</span>
      <span className="hc-assess-chevron">{active === key ? '−' : '+'}</span>
    </button>
  );

  return (
    <section ref={formRef} className="hc-assessment">
      <div className="hc-card hc-assess-summary">
        <div>
          <small>HEALTH ASSESSMENT</small>
          <strong>{readiness?.percent ?? 0}% complete <span>· {remaining} remaining</span></strong>
          <p>Complete missing information to make your Health Score more comprehensive.</p>
        </div>
      </div>

      {loading ? <div className="hc-card hc-muted">Loading assessment…</div> : <div className="hc-assess-list">
        <div className={`hc-assess-card${active === 'vitals' ? ' active' : ''}`}>
          {row('vitals', '📊', 'Vitals', 'Blood pressure, weight, glucose/HbA1c and measured readings', item('blood_pressure')?.complete ? 'BP available' : 'Needs BP', !!item('blood_pressure')?.complete)}
          {active === 'vitals' && <div className="hc-assess-panel">
            <div className="hc-source-line">
              <div><b>Measured health data is managed in Vitals</b><span>HealthConnect automatically uses your latest supported measurements.</span></div>
              <button onClick={onOpenVitals}>Open Vitals →</button>
            </div>
            <div className="hc-mini-statuses">
              <span className={item('blood_pressure')?.complete ? 'done' : ''}>Blood pressure {item('blood_pressure')?.complete ? '✓' : 'missing'}</span>
              <span>Weight + height → BMI</span>
              <span>Glucose/HbA1c → metabolic health</span>
            </div>
          </div>}
        </div>

        <div className={`hc-assess-card${active === 'details' ? ' active' : ''}`}>
          {row('details', '✍', 'Health Details', 'Body measurements, sleep, activity and tobacco', `${doneCount(detailKeys)}/${detailKeys.length} core ready`, doneCount(detailKeys) === detailKeys.length)}
          {active === 'details' && <div className="hc-assess-panel">
            <div className="hc-form-grid two">
              {number('Height', 'heightCm', '165', { unit: 'cm', min: 80, max: 250, step: 1, help: 'Used with your latest weight from Vitals for BMI.' })}
              {number('Waist circumference', 'waistCm', '85', { optional: true, unit: 'cm', min: 30, max: 250, step: 1, help: 'Optional body-composition context.' })}
              {number('Usual sleep', 'sleepHoursAvg', '7.5', { unit: 'hours/night', min: 0, max: 24, step: .5, help: 'Average nightly sleep over a typical week.' })}
              {select('Tobacco exposure', 'tobaccoStatus', [['NEVER', 'Never used tobacco'], ['FORMER', 'Former user'], ['CURRENT', 'Current — smoked or smokeless tobacco'], ['SECONDHAND', 'Second-hand exposure']], 'Includes cigarette, bidi, gutkha and khaini.')}
            </div>

            <div className="hc-subhead"><b>Weekly physical activity</b><span>Enter total minutes for the whole week.</span></div>
            <div className="hc-form-grid two">
              {number('Moderate activity', 'moderateActivityMinWeek', '150', { unit: 'min/week', min: 0, max: 10000, step: 5, help: 'Example: brisk walking 30 min × 5 days = 150.' })}
              {number('Vigorous activity', 'vigorousActivityMinWeek', '75', { unit: 'min/week', min: 0, max: 10000, step: 5, help: 'Example: running 25 min × 3 days = 75.' })}
            </div>
            <div className="hc-activity-summary"><b>{equivalent} moderate-equivalent min/week</b><span>{activityText}. Vigorous minutes count approximately double.</span></div>

            <details className="hc-optional">
              <summary>Optional health context</summary>
              <div className="hc-form-grid two">
                {number('Fruit & vegetable intake', 'fruitVegServingsDay', '5', { optional: true, unit: 'servings/day', min: 0, max: 30, step: 1, help: 'Context only; does not change the current numeric score.' })}
                {select('Alcohol use', 'alcoholStatus', [['NONE', 'None'], ['OCCASIONAL', 'Occasional'], ['REGULAR', 'Regular'], ['UNKNOWN', 'Prefer not to say / unknown']], 'Context only; not part of the current numeric score.')}
              </div>
            </details>

            <div className="hc-save-row">
              <button className="hc-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save health details & recalculate'}</button>
              {msg && <span className={msg.startsWith('✓') ? 'ok' : 'err'}>{msg}</span>}
            </div>
          </div>}
        </div>

        <div className={`hc-assess-card${active === 'records' ? ' active' : ''}`}>
          {row('records', '📋', 'Medical Records', 'Conditions, medicines and family history', `${doneCount(recordKeys)}/${recordKeys.length} declarations ready`, doneCount(recordKeys) === recordKeys.length)}
          {active === 'records' && <div className="hc-assess-panel">
            <div className="hc-record-note">Confirm what applies to you. The actual records remain in Medical History and Medications.</div>
            <div className="hc-form-grid three">
              {select('Known chronic condition', 'conditionStatus', [['NONE', 'No known chronic condition'], ['KNOWN', 'Yes — recorded in Medical History'], ['UNKNOWN', 'Not sure / needs review']], issue('conditions') ? `Check: ${issue('conditions')}` : 'A diagnosis does not automatically lower the score.')}
              {select('Regular prescribed medication', 'medicationStatus', [['NONE', 'No regular medication prescribed'], ['TAKING_PRESCRIBED', 'Yes — currently taking prescribed medication'], ['UNKNOWN', 'Not sure / needs review']], issue('medications') ? `Check: ${issue('medications')}` : 'No prescribed medicine means Treatment & Care is N/A.')}
              {select('Family medical history', 'familyHistoryStatus', [['NONE', 'No known relevant family history'], ['RECORDED', 'Yes — recorded in Medical History'], ['UNKNOWN', 'Not sure']], issue('family_history') ? `Check: ${issue('family_history')}` : 'Used for risk context, not direct score deduction.')}
            </div>

            {declarationIssues.length > 0 && <div className="hc-declaration-warning">
              <b>Check your declarations</b>
              {declarationIssues.map(i => <span key={i.key}>{i.reason}</span>)}
            </div>}

            <div className="hc-record-actions">
              <button onClick={onOpenHistory}>Open Medical History</button>
              <button onClick={onOpenMedications}>Open Medications</button>
            </div>
            <div className="hc-save-row">
              <button className="hc-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save declarations & recalculate'}</button>
              {msg && <span className={msg.startsWith('✓') ? 'ok' : 'err'}>{msg}</span>}
            </div>
          </div>}
        </div>
      </div>}
    </section>
  );
}

function DomainRow({ d, actions }: { d: Domain; actions: DomainAction[] }) {
  const [open, setOpen] = useState(false);
  const primary = actions[0];
  return (
    <div className={`hc-domain-card${open ? ' active' : ''}`}>
      <div className="hc-domain-head">
        <button className="hc-domain-toggle" onClick={() => setOpen(v => !v)}>
          <span className="hc-domain-icon">{iconFor(d.key)}</span>
          <span className="hc-domain-main"><strong>{d.label}</strong><small>{d.latestValue ?? d.explanation}</small></span>
          <span className="hc-domain-score" style={{ color: scoreColor(d.score) }}>{d.score ?? '—'}<small>{d.score == null ? statusLabel(d.status) : '/100'}</small></span>
        </button>
        {primary && <button className="hc-domain-update" onClick={primary.onClick}>{d.score == null ? 'Add data' : 'Update'}</button>}
        <button className="hc-chevron" onClick={() => setOpen(v => !v)}>{open ? '−' : '+'}</button>
      </div>
      <div className="hc-domain-bar"><i style={{ width: `${d.score ?? 0}%`, background: scoreColor(d.score) }} /></div>
      {open && <div className="hc-domain-detail">
        <div className="hc-domain-meta"><b>{statusLabel(d.status)}</b><span>Reliability {d.confidence}%</span><span>Weight {d.weight}%</span></div>
        <p>{d.explanation}</p>
        <small>Source: {d.source}</small>
        {actions.length > 1 && <div className="hc-domain-actions">{actions.map(a => <button key={a.label} onClick={a.onClick}>{a.label}</button>)}</div>}
        {d.components?.length ? <div className="hc-components">{d.components.map((c, i) => <div key={i}><span>{c.label}</span><b style={{ color: scoreColor(c.score) }}>{c.score ?? statusLabel(c.status)}</b><small>{c.value ?? c.explanation}</small></div>)}</div> : null}
      </div>}
    </div>
  );
}

export default function OverviewTab({ loading: parentLoading }: { data?: any; loading?: boolean }) {
  const uiStore = useUIStore() as any;
  const [h, setH] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);

  const publishScore = useCallback((x: HealthScore) => {
    if (typeof window !== 'undefined' && x.score != null) {
      window.dispatchEvent(new CustomEvent('hcDashUpdate', { detail: { healthScore: x.score } }));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const x = unwrap<HealthScore>(await patientAPI.getHealthScore());
      setH(x);
      publishScore(x);
      if (x.score == null) setAssessmentOpen(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Unable to load Health Score.');
    } finally {
      setLoading(false);
    }
  }, [publishScore]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      const x = unwrap<HealthScore>(await patientAPI.refreshHealthScore());
      setH(x);
      publishScore(x);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Unable to recalculate Health Score.');
      throw e;
    } finally {
      setRefreshing(false);
    }
  };

  const alerts = useMemo(() => h?.alerts?.filter(a => a.severity !== 'INFO') ?? [], [h]);
  if (loading || parentLoading) return <div style={{ height: 420, borderRadius: 22, background: '#EDF4F8' }} />;

  const ready = h?.assessmentReadiness;
  const incomplete = ready?.items?.filter(i => !i.complete) ?? [];
  const remaining = Math.max(0, (ready?.total ?? 10) - (ready?.completed ?? 0));
  const lowestDomain = h?.domains?.filter(d => d.score != null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
  const focus = suggestedFocus(lowestDomain);
  const scoreType = h?.scoreType ?? (ready?.complete ? 'COMPLETE' : h?.score != null ? 'PROVISIONAL' : 'INSUFFICIENT_DATA');

  const openForm = () => {
    setAssessmentOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  const goPage = (page: string) => uiStore.setActivePage(page);
  const goTab = (tab: string) => uiStore.setActiveTab(tab);

  const actionsFor = (d: Domain): DomainAction[] => {
    switch (d.key) {
      case 'cardiovascular': return [{ label: 'Log / update vitals', onClick: () => goPage('vitals') }];
      case 'metabolic_body': return [{ label: 'Update body details', onClick: openForm }, { label: 'Log weight / glucose', onClick: () => goPage('vitals') }];
      case 'lifestyle': return [{ label: 'Update lifestyle', onClick: openForm }];
      case 'sleep_recovery': return [{ label: 'Update sleep', onClick: openForm }];
      case 'condition_control': return [{ label: 'My Conditions', onClick: () => goTab('conditions') }, { label: 'Medical History', onClick: () => goTab('history') }];
      case 'treatment_care': return [{ label: 'Open medications', onClick: () => goPage('medications') }, { label: 'Treatments', onClick: () => goTab('treatments') }];
      case 'symptoms_function': return [{ label: 'Log symptoms', onClick: () => goPage('symptoms') }, { label: 'Symptoms Tracker', onClick: () => goTab('symptoms') }];
      default: return [];
    }
  };

  const heroTitle = h?.score == null ? 'Add health data to start your score' : scoreType === 'COMPLETE' ? `${statusLabel(h?.status ?? '')} health status` : 'Current Health Score';
  const heroMessage = h?.score == null
    ? 'No measurable scoreable health domain is available yet. Log a supported vital or add health assessment information to start your score.'
    : scoreType === 'COMPLETE'
      ? 'Your core health assessment is complete.'
      : 'Based on the measurable health information currently available. Add remaining details to make the assessment more complete.';

  return <div className="hc-wrap"><style>{`
    .hc-wrap{display:grid;gap:18px;color:${C.ink}}.hc-card{background:#fff;border:1px solid ${C.border};border-radius:18px;box-shadow:0 8px 24px rgba(18,57,91,.055)}.hc-muted{padding:16px;color:${C.muted};font-size:12px}
    .hc-hero{background:linear-gradient(135deg,#103A5D,#176C91 58%,#1596A6);color:#fff;border-radius:23px;padding:24px;display:grid;grid-template-columns:170px 1fr;gap:24px;align-items:center;box-shadow:0 16px 36px rgba(16,58,93,.16)}
    .hc-gauge{position:relative;width:154px;height:154px}.hc-gauge-center{position:absolute;inset:0;display:grid;place-content:center;text-align:center}.hc-gauge-center strong{font-size:43px;line-height:1}.hc-gauge-center span{font-size:9px;letter-spacing:.08em;opacity:.78;margin-top:5px;font-weight:800}
    .hc-eyebrow{font-size:9px;font-weight:850;letter-spacing:.09em;opacity:.7}.hc-hero h2{font-size:25px;margin:5px 0}.hc-hero p{font-size:12.5px;line-height:1.5;max-width:720px;color:rgba(255,255,255,.9);margin:0}.hc-completion{margin-top:14px;max-width:680px}.hc-completion-head{display:flex;justify-content:space-between;font-size:10.5px;color:rgba(255,255,255,.85);margin-bottom:6px}.hc-completion-head b{color:#fff}.hc-completion-bar{height:7px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}.hc-completion-bar i{display:block;height:100%;border-radius:99px;background:#8DE5EE}.hc-meta{font-size:10px;opacity:.78;margin-top:7px}.hc-actions{display:flex;gap:8px;margin-top:13px;flex-wrap:wrap}.hc-btn{border-radius:9px;padding:9px 13px;font-size:11.5px;font-weight:800;cursor:pointer}.hc-btn.white{border:0;background:#fff;color:#15557A}.hc-btn.ghost{border:1px solid rgba(255,255,255,.32);background:rgba(255,255,255,.1);color:#fff}
    .hc-alert{padding:12px 14px;border-radius:13px;font-size:11.5px;line-height:1.45}.hc-alert.CRITICAL{background:#FFF1F2;border:1px solid #FDA4AF;color:#881337}.hc-alert.WARNING{background:#FFF7ED;border:1px solid #FED7AA;color:#7C2D12}.hc-next{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px}.hc-next span{font-size:11px;color:${C.muted}}.hc-next b{color:${C.ink}}.hc-next button{border:0;background:#EEF6FA;color:${C.blue};border-radius:9px;padding:8px 12px;font-size:10.5px;font-weight:800;cursor:pointer}
    .hc-assessment{display:grid;gap:13px;scroll-margin-top:145px}.hc-assess-summary{padding:17px 20px}.hc-assess-summary small{display:block;color:${C.blue};font-size:8.5px;font-weight:900;letter-spacing:.11em}.hc-assess-summary strong{display:block;font-size:17px;margin-top:4px}.hc-assess-summary strong span{color:${C.muted};font-weight:700}.hc-assess-summary p{margin:4px 0 0;font-size:10.5px;color:${C.muted}}
    .hc-assess-list{display:grid;gap:13px}.hc-assess-card{background:#fff;border:1px solid ${C.border};border-radius:18px;box-shadow:0 8px 22px rgba(18,57,91,.055);overflow:hidden;transition:.18s ease}.hc-assess-card:hover{transform:translateY(-1px);box-shadow:0 11px 28px rgba(18,57,91,.075)}.hc-assess-card.active{border-color:#BCD9EA;box-shadow:0 12px 30px rgba(18,57,91,.08)}
    .hc-assess-row{width:100%;border:0;background:#fff;display:grid;grid-template-columns:46px 1fr auto 28px;align-items:center;gap:14px;padding:17px 19px;text-align:left;cursor:pointer}.hc-assess-icon{width:42px;height:42px;border-radius:12px;background:#F0F7FB;display:grid;place-items:center;font-size:18px}.hc-assess-copy strong,.hc-assess-copy small{display:block}.hc-assess-copy strong{font-size:15px;color:${C.ink}}.hc-assess-copy small{font-size:10.5px;color:${C.muted};margin-top:3px}.hc-assess-status{font-size:9.5px;font-weight:850;color:${C.blue};background:#EFF7FC;border-radius:99px;padding:6px 10px;white-space:nowrap}.hc-assess-status.done{color:${C.green};background:#ECFDF3}.hc-assess-chevron{width:25px;height:25px;border-radius:50%;background:#F3F7FA;color:${C.blue};display:grid;place-items:center;font-size:16px;font-weight:800}
    .hc-assess-panel{border-top:1px solid ${C.border};background:#FCFEFF;padding:18px 20px 20px}.hc-source-line{display:flex;align-items:center;justify-content:space-between;gap:18px;background:#F3F8FB;border:1px solid #E3EDF4;border-radius:12px;padding:13px 14px}.hc-source-line b,.hc-source-line span{display:block}.hc-source-line b{font-size:11.5px}.hc-source-line span{font-size:9.7px;color:${C.muted};line-height:1.45;margin-top:3px}.hc-source-line button,.hc-record-actions button{border:1px solid #CFE2F2;background:#fff;color:${C.blue};border-radius:9px;padding:8px 11px;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}.hc-mini-statuses{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.hc-mini-statuses span{font-size:9.3px;color:${C.muted};background:#F1F5F8;border-radius:99px;padding:6px 9px}.hc-mini-statuses span.done{color:${C.green};background:#ECFDF3}
    .hc-form-grid{display:grid;gap:14px 12px}.hc-form-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.hc-form-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.hc-field>span{display:block;font-size:9.5px;font-weight:800;color:${C.muted};margin-bottom:5px}.hc-field em{font-style:normal;font-weight:500}.hc-field select{width:100%;box-sizing:border-box;border:1px solid ${C.border};border-radius:10px;padding:10px;background:#fff;color:${C.ink};font-size:11.5px}.hc-input-unit{display:flex;align-items:center;border:1px solid ${C.border};border-radius:10px;background:#fff;overflow:hidden}.hc-input-unit input{min-width:0;flex:1;border:0;outline:0;background:transparent;padding:10px;color:${C.ink};font-size:11.5px}.hc-input-unit b{font-size:9px;color:${C.muted};padding:0 9px;white-space:nowrap}.hc-help{display:block;font-size:8.8px!important;font-weight:500!important;line-height:1.4;color:${C.muted};margin-top:5px}.hc-subhead{margin:16px 0 9px}.hc-subhead b,.hc-subhead span{display:block}.hc-subhead b{font-size:11.5px}.hc-subhead span{font-size:9.4px;color:${C.muted};margin-top:2px}.hc-activity-summary{margin-top:11px;background:#EEF9FB;border:1px solid #CBEAF0;border-radius:11px;padding:10px 12px}.hc-activity-summary b,.hc-activity-summary span{display:block}.hc-activity-summary b{font-size:10px;color:#116475}.hc-activity-summary span{font-size:9px;color:${C.muted};line-height:1.4;margin-top:2px}.hc-optional{margin-top:14px;border-top:1px solid ${C.border};padding-top:11px}.hc-optional summary{cursor:pointer;color:${C.blue};font-size:10px;font-weight:800;margin-bottom:10px}.hc-record-note{font-size:9.7px;color:${C.muted};line-height:1.45;margin-bottom:12px}.hc-declaration-warning{margin-top:11px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:11px;padding:10px 12px;color:#9A3412}.hc-declaration-warning b,.hc-declaration-warning span{display:block}.hc-declaration-warning b{font-size:10.5px;margin-bottom:4px}.hc-declaration-warning span{font-size:9.3px;line-height:1.45;margin-top:2px}.hc-record-actions{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}.hc-save-row{display:flex;align-items:center;gap:9px;margin-top:13px}.hc-primary{background:linear-gradient(135deg,#176AA8,#1596A6);color:#fff;border:0;border-radius:10px;padding:10px 14px;font-size:11px;font-weight:800;cursor:pointer}.hc-save-row .ok{color:${C.green};font-size:10.5px}.hc-save-row .err{color:${C.red};font-size:10.5px}
    .hc-section-title{margin:2px 0 10px}.hc-section-title h3{font-size:18px;margin:0 0 4px}.hc-section-title span{font-size:10.5px;color:${C.muted}}.hc-domain-list{display:grid;gap:12px}.hc-domain-card{background:#fff;border:1px solid ${C.border};border-radius:17px;box-shadow:0 7px 20px rgba(18,57,91,.05);overflow:hidden;transition:.18s ease}.hc-domain-card:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(18,57,91,.075)}.hc-domain-card.active{border-color:#C2DCEC}.hc-domain-head{display:flex;align-items:center;background:#fff}.hc-domain-toggle{flex:1;min-width:0;border:0;background:#fff;display:flex;gap:13px;align-items:center;padding:15px 10px 15px 17px;text-align:left;cursor:pointer}.hc-domain-icon{width:42px;height:42px;border-radius:12px;background:#EEF6FA;color:${C.blue};display:grid;place-items:center;flex:0 0 auto;font-size:17px}.hc-domain-main{flex:1;min-width:0}.hc-domain-main strong,.hc-domain-main small{display:block}.hc-domain-main strong{font-size:14px}.hc-domain-main small{font-size:10.5px;color:${C.muted};margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hc-domain-score{font-size:23px;font-weight:900;text-align:right;min-width:76px}.hc-domain-score small{font-size:7.5px;text-transform:uppercase;margin-left:2px}.hc-domain-update{border:1px solid #CFE2F2;background:#F7FBFE;color:${C.blue};border-radius:9px;padding:7px 10px;font-size:9.5px;font-weight:800;cursor:pointer;white-space:nowrap}.hc-chevron{border:0;background:#fff;color:${C.blue};width:36px;font-size:18px;font-weight:800;cursor:pointer}.hc-domain-bar{height:4px;background:#EEF3F7;margin:0 17px 14px;border-radius:99px;overflow:hidden}.hc-domain-bar i{display:block;height:100%;border-radius:99px}.hc-domain-detail{border-top:1px solid ${C.border};background:#FCFEFF;padding:14px 18px 17px 72px;font-size:10.5px;line-height:1.5;color:${C.muted}}.hc-domain-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.hc-domain-meta span{background:#F1F5F8;border-radius:99px;padding:4px 7px;font-size:8.8px}.hc-domain-detail p{margin:7px 0 5px}.hc-domain-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.hc-domain-actions button{border:1px solid #CFE2F2;background:#F5FAFE;color:${C.blue};border-radius:8px;padding:6px 8px;font-size:9.5px;font-weight:750;cursor:pointer}.hc-components{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:7px;margin-top:9px}.hc-components>div{background:#F5F9FC;border:1px solid #E7EFF5;border-radius:10px;padding:9px}.hc-components span,.hc-components small,.hc-components b{display:block}.hc-components b{font-size:15px;margin:2px 0}.hc-risk{padding:15px 17px}.hc-risk h4{margin:0 0 5px;font-size:13px}.hc-risk p,.hc-risk li{font-size:10.5px;line-height:1.5;color:${C.muted}}.hc-risk ul{margin:6px 0 0;padding-left:17px}.hc-focus{padding:15px 17px;border-left:4px solid ${C.blue}}.hc-focus h4{margin:0 0 5px;font-size:13px}.hc-focus p{font-size:10.8px;line-height:1.55;color:${C.muted};margin:0}
    @media(max-width:900px){.hc-hero{grid-template-columns:1fr;text-align:center}.hc-gauge{margin:auto}.hc-completion{margin-left:auto;margin-right:auto}.hc-actions{justify-content:center}.hc-form-grid.two,.hc-form-grid.three{grid-template-columns:1fr}.hc-assess-row{grid-template-columns:42px 1fr auto 26px}.hc-assess-copy small{display:none}.hc-domain-update{display:none}.hc-source-line{align-items:flex-start;flex-direction:column}.hc-domain-detail{padding-left:18px}}
  `}</style>

  {error && <div className="hc-alert CRITICAL">{error}</div>}

  <section className="hc-hero">
    <Gauge score={h?.score ?? null} />
    <div>
      <div className="hc-eyebrow">HC-HSI 2.0 · DECISION SUPPORT, NOT A DIAGNOSIS</div>
      <h2>{heroTitle}</h2>
      <p>{heroMessage}</p>
      <div className="hc-completion">
        <div className="hc-completion-head"><span>Health assessment <b>{ready?.percent ?? 0}% complete</b></span><span>{remaining > 0 ? `${remaining} detail${remaining === 1 ? '' : 's'} remaining` : 'Complete'}</span></div>
        <div className="hc-completion-bar"><i style={{ width: `${ready?.percent ?? 0}%` }} /></div>
        <div className="hc-meta">{scoreType === 'PROVISIONAL' ? 'Current score uses the measurable health data available today and will update as more information is added.' : scoreType === 'COMPLETE' ? 'All 10 core assessment areas are complete.' : 'Add a supported health measurement to start the score.'}</div>
      </div>
      <div className="hc-actions">
        {!ready?.complete && <button className="hc-btn white" onClick={openForm}>Update assessment</button>}
        <button className="hc-btn ghost" onClick={refresh} disabled={refreshing}>{refreshing ? 'Recalculating…' : '↻ Recalculate'}</button>
      </div>
    </div>
  </section>

  {alerts.map(a => <div key={`${a.code}-${a.observedAt}`} className={`hc-alert ${a.severity}`}><b>⚠ {a.title}</b> — {a.message}</div>)}

  {incomplete.length > 0 && <div className="hc-card hc-next"><span><b>Next assessment detail:</b> {incomplete[0].label} — {incomplete[0].reason}</span><button onClick={openForm}>Add detail</button></div>}

  <AssessmentForm
    formRef={formRef}
    open={assessmentOpen}
    setOpen={setAssessmentOpen}
    readiness={ready}
    afterSave={refresh}
    onOpenVitals={() => goPage('vitals')}
    onOpenHistory={() => goTab('history')}
    onOpenMedications={() => goPage('medications')}
  />

  <section>
    <div className="hc-section-title"><h3>Your health domains</h3><span>Open a domain to see what contributes to the score or where to add missing data.</span></div>
    <div className="hc-domain-list">{h?.domains?.map(d => <DomainRow key={d.key} d={d} actions={actionsFor(d)} />)}</div>
  </section>

  {(h?.riskContext?.screeningRecommendations?.length || h?.limitations?.length) ? <section className="hc-card hc-risk">
    <h4>Risk & screening context</h4>
    {h?.limitations?.map(l => <p key={l.code}><b>{l.title}:</b> {l.message}</p>)}
    {h?.riskContext?.screeningRecommendations?.length ? <ul>{h.riskContext.screeningRecommendations.map(r => <li key={r.code}>{r.message}</li>)}</ul> : null}
  </section> : null}

  {focus && <section className="hc-card hc-focus"><h4>{focus.title}</h4><p>{focus.text}</p></section>}
  </div>;
}
