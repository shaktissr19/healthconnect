'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpayCheckout';
import { useAuthStore } from '@/store/authStore';

const C = {
  card: '#FDFCFB', border: '#D8D6CF', text: '#1E293B', muted: '#64748B',
  blue: '#2563EB', teal: '#0D9488', green: '#16A34A', amber: '#D97706', red: '#DC2626',
};

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? null;
const money = (paise: number) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function ConsultationPaymentsPage() {
  const router = useRouter();
  const user = useAuthStore(s => (s as any).user);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const notify = (text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast(null), 4200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/payments/appointments');
      const rows = unwrap(response);
      setAppointments(Array.isArray(rows) ? rows : []);
    } catch (error: any) {
      setAppointments([]);
      notify(error?.response?.data?.message || 'Unable to load consultation payments.', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => {
    const paid = appointments.filter(a => a.paid);
    const payable = appointments.filter(a => a.canPay);
    return {
      paidCount: paid.length,
      paidPaise: paid.reduce((sum, a) => sum + Number(a.latestPayment?.amountPaise || a.amountPaise || 0) - Number(a.latestPayment?.amountRefundedPaise || 0), 0),
      payableCount: payable.length,
    };
  }, [appointments]);

  const pay = async (appointment: any) => {
    setBusy(appointment.id);
    try {
      const checkoutResponse = await api.post(`/payments/appointments/${appointment.id}/checkout`);
      const checkout = unwrap(checkoutResponse);
      if (!checkout?.paymentRequired) {
        notify(checkout?.message || 'No online fee is configured for this appointment.');
        return;
      }
      if (!checkout?.keyId || !checkout?.orderId) throw new Error('Secure checkout could not be initialized.');

      const result = await openRazorpayCheckout({
        key: checkout.keyId,
        amount: checkout.amountPaise,
        currency: checkout.currency || 'INR',
        order_id: checkout.orderId,
        name: 'HealthConnect India',
        description: `Consultation with ${checkout.appointment?.doctorName || appointment.doctor?.name || 'Doctor'}`,
        prefill: {
          email: user?.email || undefined,
          name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined,
        },
        notes: {
          hc_appointment_id: appointment.id,
          hc_local_payment_id: checkout.localPaymentId || '',
        },
      });

      if (!result) {
        notify('Checkout closed. No payment was recorded.');
        return;
      }

      const verification = await api.post(`/payments/appointments/${appointment.id}/verify`, {
        razorpay_order_id: result.razorpay_order_id || checkout.orderId,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      });
      setReceipt(unwrap(verification));
      notify('✓ Consultation payment verified successfully.');
      await load();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || 'Payment could not be completed.', true);
    } finally {
      setBusy('');
    }
  };

  const viewReceipt = async (appointmentId: string) => {
    setBusy(`receipt-${appointmentId}`);
    try {
      const response = await api.get(`/payments/appointments/${appointmentId}/receipt`);
      setReceipt(unwrap(response));
    } catch (error: any) {
      notify(error?.response?.data?.message || 'Receipt is not available.', true);
    } finally {
      setBusy('');
    }
  };

  if (loading) return <div style={{ minHeight: 360, display: 'grid', placeItems: 'center' }}><div style={{ width: 38, height: 38, border: '3px solid #D8D6CF', borderTopColor: C.teal, borderRadius: '50%', animation: 'hcpSpin .8s linear infinite' }} /><style>{`@keyframes hcpSpin{to{transform:rotate(360deg)}}`}</style></div>;

  return <div style={{ maxWidth: 1100, margin: '0 auto', color: C.text }}>
    {toast && <div style={{ position: 'fixed', right: 26, bottom: 26, zIndex: 9999, maxWidth: 390, padding: '12px 18px', borderRadius: 12, color: '#fff', background: toast.error ? '#991B1B' : '#0F766E', boxShadow: '0 12px 30px rgba(0,0,0,.22)', fontSize: 13, fontWeight: 650 }}>{toast.text}</div>}

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
      <div><button onClick={() => router.push('/dashboard?tab=subscription')} style={{ border: 0, background: 'transparent', padding: 0, color: C.teal, fontSize: 12, fontWeight: 750, cursor: 'pointer', marginBottom: 8 }}>← Membership & Billing</button><h1 style={{ margin: 0, fontSize: 27, fontWeight: 850 }}>Consultation Payments</h1><p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14, lineHeight: 1.5 }}>Consultation charges are set by each doctor and are separate from your HealthConnect membership.</p></div>
      <button onClick={() => void load()} style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 10, padding: '9px 13px', cursor: 'pointer', color: C.muted, fontSize: 12, fontWeight: 700 }}>Refresh</button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
      <Metric label="Appointments ready to pay" value={String(totals.payableCount)} color={C.amber} />
      <Metric label="Paid consultations" value={String(totals.paidCount)} color={C.green} />
      <Metric label="Paid through HealthConnect" value={money(totals.paidPaise)} color={C.teal} />
    </div>

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 9px rgba(15,23,42,.04)' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}><div style={{ fontSize: 15, fontWeight: 800 }}>Your consultations</div><div style={{ color: C.muted, fontSize: 11.5, marginTop: 3 }}>The amount shown below is calculated on the server from the doctor&apos;s configured consultation fee.</div></div>
      {appointments.length === 0 ? <div style={{ padding: 44, textAlign: 'center', color: C.muted, fontSize: 13 }}>No appointments are available for payment yet.</div> : <div style={{ display: 'flex', flexDirection: 'column' }}>{appointments.map(a => {
        const latest = a.latestPayment;
        const status = a.paid ? 'PAID' : latest?.status || (a.paymentRequired ? 'UNPAID' : 'NO ONLINE FEE');
        return <div key={a.id} style={{ padding: '18px 20px', borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'minmax(250px,1.5fr) minmax(150px,.8fr) minmax(110px,.55fr) auto', gap: 18, alignItems: 'center' }}>
          <div><div style={{ fontSize: 14, fontWeight: 800 }}>{a.doctor?.name || 'Doctor'}</div><div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{a.doctor?.specialization || 'Consultation'}{a.hospital?.name ? ` · ${a.hospital.name}` : ''}</div><div style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{new Date(a.scheduledAt).toLocaleString('en-IN')} · {String(a.type || '').replaceAll('_', ' ')}</div></div>
          <div><div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.muted, fontWeight: 750 }}>Doctor fee</div><div style={{ fontSize: 20, fontWeight: 850, marginTop: 3 }}>{a.paymentRequired ? money(a.amountPaise) : '—'}</div></div>
          <Status value={status} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{a.paid ? <button disabled={busy === `receipt-${a.id}`} onClick={() => void viewReceipt(a.id)} style={secondaryButton}>{busy === `receipt-${a.id}` ? 'Loading…' : 'Receipt'}</button> : a.canPay ? <button disabled={busy === a.id} onClick={() => void pay(a)} style={primaryButton}>{busy === a.id ? 'Opening…' : `Pay ${money(a.amountPaise)}`}</button> : <span style={{ color: C.muted, fontSize: 11.5 }}>Not payable now</span>}</div>
        </div>;
      })}</div>}
    </section>

    {receipt && <div onClick={() => setReceipt(null)} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,.55)', display: 'grid', placeItems: 'center', padding: 20 }}><div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}><div><div style={{ color: C.teal, fontSize: 11, fontWeight: 850, letterSpacing: '.07em' }}>HEALTHCONNECT INDIA</div><h2 style={{ margin: '5px 0 0', fontSize: 21 }}>Payment receipt</h2></div><button onClick={() => setReceipt(null)} style={{ border: 0, background: '#F1F5F9', borderRadius: 999, width: 30, height: 30, cursor: 'pointer' }}>×</button></div><div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}><ReceiptLine label="Receipt" value={receipt.receiptNumber || '—'} /><ReceiptLine label="Doctor" value={receipt.appointment?.doctorName || '—'} /><ReceiptLine label="Appointment" value={receipt.appointment?.scheduledAt ? new Date(receipt.appointment.scheduledAt).toLocaleString('en-IN') : '—'} /><ReceiptLine label="Amount" value={money(receipt.payment?.amountPaise || 0)} /><ReceiptLine label="Payment ID" value={receipt.payment?.providerPaymentId || '—'} /><ReceiptLine label="Status" value={receipt.payment?.status || '—'} /></div><p style={{ color: C.muted, fontSize: 11.5, lineHeight: 1.5, margin: '14px 0 0' }}>This receipt records payment through HealthConnect. The consultation fee is determined by the healthcare professional.</p></div></div>}

    <style>{`@media(max-width:760px){section>div>div[style*="grid-template-columns"]{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

const primaryButton: React.CSSProperties = { border: 0, background: 'linear-gradient(135deg,#0F766E,#0D9488)', color: '#fff', borderRadius: 9, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' };
const secondaryButton: React.CSSProperties = { border: `1px solid ${C.border}`, background: '#fff', color: C.teal, borderRadius: 9, padding: '8px 13px', fontSize: 12, fontWeight: 750, cursor: 'pointer' };

function Metric({ label, value, color }: { label: string; value: string; color: string }) { return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: '17px 19px' }}><div style={{ color: C.muted, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 750 }}>{label}</div><div style={{ color, fontSize: 26, fontWeight: 850, marginTop: 5 }}>{value}</div></div>; }
function Status({ value }: { value: string }) { const paid = ['PAID','CAPTURED'].includes(String(value).toUpperCase()); const bad = ['FAILED','REFUNDED'].includes(String(value).toUpperCase()); const color = paid ? C.green : bad ? C.red : C.amber; return <span style={{ width: 'max-content', padding: '4px 9px', borderRadius: 999, background: `${color}12`, border: `1px solid ${color}30`, color, fontSize: 10, fontWeight: 850 }}>{String(value).replaceAll('_',' ')}</span>; }
function ReceiptLine({ label, value }: { label: string; value: string }) { return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '7px 0', borderBottom: '1px solid #E2E8F0' }}><span style={{ color: C.muted, fontSize: 12 }}>{label}</span><span style={{ color: C.text, fontSize: 12, fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span></div>; }
