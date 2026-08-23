'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { openRazorpayCheckout } from '@/lib/razorpayCheckout';

const C = {
  page: '#F5F4F0', card: '#FDFCFB', border: '#D8D6CF', text: '#1E293B', muted: '#64748B',
  blue: '#2563EB', blueDark: '#1849A9', teal: '#0D9488', green: '#16A34A', amber: '#D97706', red: '#DC2626',
};

const money = (paise: number) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const unwrap = (response: any) => response?.data?.data ?? response?.data ?? null;

export default function SubscriptionPage() {
  const router = useRouter();
  const user = useAuthStore(s => (s as any).user);
  const [plans, setPlans] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [history, setHistory] = useState<any>({ subscriptions: [], charges: [], invoices: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const notify = (text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast(null), 4200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, currentRes, historyRes] = await Promise.all([
        api.get('/subscription/plans'),
        api.get('/subscription/current'),
        api.get('/subscription/billing-history'),
      ]);
      const allPlans = unwrap(plansRes) || [];
      setPlans((Array.isArray(allPlans) ? allPlans : []).filter((p: any) => p.targetRole === 'PATIENT'));
      setCurrent(unwrap(currentRes));
      setHistory(unwrap(historyRes) || { subscriptions: [], charges: [], invoices: [] });
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Unable to load membership information.', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const premium = useMemo(() => plans.find(p => p.name === 'premium'), [plans]);
  const basic = useMemo(() => plans.find(p => p.name === 'basic'), [plans]);
  const hasPaidMembership = Boolean(current && ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(current.status) && Number(current.amountPaise || 0) > 0);
  const currentName = current?.plan?.displayName || (hasPaidMembership ? 'Premium' : 'Free');
  const cancelScheduled = Boolean(current?.state?.cancelAtCycleEnd || (current && current.autoRenew === false && current.status === 'ACTIVE'));

  const startCheckout = async (plan: any) => {
    setBusy(plan.id);
    try {
      const promotionCode = plan?.introOffer?.available ? 'LAUNCH99' : undefined;
      const checkoutRes = await api.post('/subscription/checkout', {
        planId: plan.id,
        billingCycle: 'MONTHLY',
        ...(promotionCode ? { promotionCode } : {}),
      });
      const checkout = unwrap(checkoutRes);
      if (!checkout?.subscriptionId || !checkout?.keyId) throw new Error('Payment checkout could not be initialized.');

      const result = await openRazorpayCheckout({
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        name: 'HealthConnect India',
        description: `${checkout.plan?.displayName || plan.displayName} membership`,
        prefill: { email: user?.email || undefined, name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined },
        notes: { hc_local_subscription_id: checkout.localSubscriptionId || '' },
      });
      if (!result) {
        notify('Checkout closed. No membership was activated.');
        return;
      }

      await api.post('/subscription/verify', result);
      notify('✓ Membership activated successfully.');
      await load();
    } catch (e: any) {
      notify(e?.response?.data?.message || e?.message || 'Membership payment could not be completed.', true);
    } finally {
      setBusy('');
    }
  };

  const cancelAtCycleEnd = async () => {
    if (!confirm('Turn off auto-renewal? Your paid access will remain available until the current billing cycle ends.')) return;
    setBusy('cancel');
    try {
      const r = await api.post('/subscription/cancel', { atCycleEnd: true });
      notify(r?.data?.message || 'Auto-renewal turned off.');
      await load();
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Unable to change auto-renewal.', true);
    } finally {
      setBusy('');
    }
  };

  if (loading) return (
    <div style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid #D8D6CF', borderTopColor: C.blue, animation: 'hcSubSpin .8s linear infinite' }} />
      <style>{`@keyframes hcSubSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const charges = Array.isArray(history?.charges) ? history.charges : [];
  const invoices = Array.isArray(history?.invoices) ? history.invoices : [];

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', color: C.text }}>
      {toast && <div style={{ position: 'fixed', right: 26, bottom: 26, zIndex: 9999, maxWidth: 390, padding: '12px 18px', borderRadius: 12, color: '#fff', background: toast.error ? '#991B1B' : '#0F766E', boxShadow: '0 12px 30px rgba(0,0,0,.22)', fontSize: 13, fontWeight: 650 }}>{toast.text}</div>}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Membership & Billing</h1>
        <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>Manage HealthConnect membership and consultation payments securely.</p>
      </div>

      <div style={{ background: 'linear-gradient(135deg,#0F3D39,#155E75)', color: '#fff', borderRadius: 18, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 22, boxShadow: '0 8px 24px rgba(15,61,57,.16)' }}>
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 10, opacity: .7, fontWeight: 700 }}>Current membership</div>
          <div style={{ fontSize: 23, fontWeight: 850, marginTop: 4 }}>{currentName}</div>
          {current?.endDate && <div style={{ fontSize: 12, opacity: .78, marginTop: 5 }}>Current cycle through {new Date(current.endDate).toLocaleDateString('en-IN')}</div>}
          {cancelScheduled && <div style={{ marginTop: 8, display: 'inline-flex', padding: '4px 9px', borderRadius: 100, background: 'rgba(245,158,11,.18)', color: '#FDE68A', fontSize: 11, fontWeight: 700 }}>Auto-renewal off</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/dashboard/payments')} style={{ border: '1px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.08)', color: '#fff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Consultation Payments →</button>
          {hasPaidMembership && !cancelScheduled && <button disabled={busy === 'cancel'} onClick={cancelAtCycleEnd} style={{ border: '1px solid rgba(255,255,255,.28)', background: '#fff', color: '#0F3D39', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 750, fontSize: 12 }}>{busy === 'cancel' ? 'Updating…' : 'Turn off auto-renew'}</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 750 }}>Essential</div>
          <div style={{ fontSize: 20, fontWeight: 850, marginTop: 5 }}>{basic?.displayName || 'Free'}</div>
          <div style={{ fontSize: 28, fontWeight: 900, margin: '8px 0 16px' }}>₹0</div>
          <FeatureList features={basic?.features || ['Health profile', 'Medical history', 'Public communities', 'Doctor discovery']} />
          <div style={{ marginTop: 18, padding: '10px', textAlign: 'center', borderRadius: 10, background: !hasPaidMembership ? '#ECFDF5' : '#F1F5F9', color: !hasPaidMembership ? C.green : C.muted, fontSize: 12, fontWeight: 750 }}>{!hasPaidMembership ? '✓ Your base access' : 'Included with Premium'}</div>
        </div>

        <div style={{ background: C.card, border: `2px solid ${C.blue}`, borderRadius: 18, padding: 22, boxShadow: '0 8px 24px rgba(37,99,235,.10)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -1, right: 18, padding: '4px 12px', borderRadius: '0 0 9px 9px', background: C.blue, color: '#fff', fontSize: 9, fontWeight: 850, letterSpacing: '.08em' }}>PREMIUM</div>
          <div style={{ fontSize: 11, color: C.blue, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 750 }}>Patient membership</div>
          <div style={{ fontSize: 20, fontWeight: 850, marginTop: 5 }}>{premium?.displayName || 'Premium'}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 8 }}><span style={{ fontSize: 30, fontWeight: 900, color: C.blue }}>{money(premium?.pricing?.monthlyPaise || 14900)}</span><span style={{ fontSize: 12, color: C.muted }}>/month</span></div>
          {premium?.introOffer?.available && <div style={{ margin: '10px 0 14px', padding: '10px 12px', borderRadius: 10, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', fontSize: 12, lineHeight: 1.45 }}><strong>LAUNCH99:</strong> ₹99/month for the first 3 billing cycles, then ₹149/month. Applied automatically for eligible new memberships.</div>}
          {!premium?.introOffer?.available && <div style={{ height: 8 }} />}
          <FeatureList features={premium?.features || ['Everything in Free', 'Health Score', 'Unlimited reports', 'Medication reminders', 'Priority booking']} />
          {hasPaidMembership ? (
            <div style={{ marginTop: 18, padding: '10px', textAlign: 'center', borderRadius: 10, background: '#EFF6FF', color: C.blue, fontSize: 12, fontWeight: 750 }}>✓ Current paid membership</div>
          ) : (
            <button disabled={!premium || Boolean(busy)} onClick={() => premium && startCheckout(premium)} style={{ marginTop: 18, width: '100%', padding: '11px 14px', border: 0, borderRadius: 10, background: busy ? '#CBD5E1' : `linear-gradient(135deg,${C.blueDark},${C.blue})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer' }}>{busy === premium?.id ? 'Opening secure checkout…' : premium?.introOffer?.available ? 'Start with LAUNCH99 →' : 'Upgrade to Premium →'}</button>
          )}
        </div>
      </div>

      <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontWeight: 800, fontSize: 14 }}>Membership payment history</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Server-verified Razorpay charges</div></div><button onClick={() => void load()} style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: C.muted }}>Refresh</button></div>
        {charges.length === 0 ? <Empty text="No membership payments recorded yet." /> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr style={{ background: '#F8FAFC' }}>{['Plan','Amount','Status','Payment ID','Paid'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.muted, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead><tbody>{charges.slice(0, 20).map((p: any) => <tr key={p.id} style={{ borderTop: '1px solid #F1F5F9' }}><td style={{ padding: '11px 14px', fontWeight: 650 }}>{p.planName || 'Membership'}</td><td style={{ padding: '11px 14px' }}>{money(p.amountPaise)}</td><td style={{ padding: '11px 14px' }}><Status value={p.status} /></td><td style={{ padding: '11px 14px', color: C.muted, fontFamily: 'monospace', fontSize: 10 }}>{p.providerPaymentId || (p.legacy ? 'Legacy record' : '—')}</td><td style={{ padding: '11px 14px', color: C.muted }}>{p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN') : '—'}</td></tr>)}</tbody></table></div>}
      </section>

      {invoices.length > 0 && <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}><div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Invoices</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{invoices.slice(0, 10).map((i: any) => <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#F8FAFC' }}><div><div style={{ fontSize: 12, fontWeight: 700 }}>{i.invoiceNumber || i.providerInvoiceId}</div><div style={{ fontSize: 11, color: C.muted }}>{money(i.amountPaise)} · {i.status}</div></div>{i.shortUrl ? <a href={i.shortUrl} target="_blank" rel="noreferrer" style={{ color: C.blue, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>View invoice ↗</a> : null}</div>)}</div></section>}

      <div style={{ marginTop: 16, color: C.muted, fontSize: 11, lineHeight: 1.6 }}>Payments are processed by Razorpay. HealthConnect verifies each payment on the server before activating paid access. Consultation fees are managed separately in Consultation Payments.</div>
    </div>
  );
}

function FeatureList({ features }: { features: unknown }) {
  const list = Array.isArray(features) ? features.map(String) : [];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{list.slice(0, 8).map(feature => <div key={feature} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#475569' }}><span style={{ color: C.green, fontWeight: 900 }}>✓</span><span>{feature}</span></div>)}</div>;
}

function Status({ value }: { value: string }) {
  const upper = String(value || 'UNKNOWN').toUpperCase();
  const color = upper === 'CAPTURED' || upper === 'ACTIVE' ? C.green : upper.includes('FAIL') || upper === 'CANCELLED' ? C.red : C.amber;
  return <span style={{ padding: '3px 8px', borderRadius: 100, color, background: `${color}12`, border: `1px solid ${color}28`, fontSize: 10, fontWeight: 800 }}>{upper}</span>;
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: '28px 18px', textAlign: 'center', color: C.muted, fontSize: 12 }}>{text}</div>;
}
