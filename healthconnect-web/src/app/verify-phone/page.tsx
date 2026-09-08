'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const messageFrom = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);

  const returnTo = useMemo(() => {
    const raw = searchParams.get('returnTo') || '';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    api.get('/auth/phone/status')
      .then((response) => {
        if (cancelled) return;
        const data = response?.data?.data || {};
        setVerified(Boolean(data.isVerified));
        setMaskedPhone(data.verifiedPhone || data.pendingPhone || null);
        setSent(Boolean(data.pendingPhone && !data.isVerified));
        if (data.isVerified) setMessage('Your mobile number is already verified.');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 401) router.replace('/');
        else setError(messageFrom(err, 'Unable to load phone verification status.'));
      });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/phone/send-otp', { phone });
      const data = response?.data?.data || {};
      setMaskedPhone(data.phone || null);
      setSent(true);
      setSeconds(Number(data.resendAfterSeconds || 60));
      setMessage('OTP sent. Enter the code received on your mobile.');
    } catch (err) {
      setError(messageFrom(err, 'Unable to send OTP. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/phone/verify-otp', { otp });
      const data = response?.data?.data || {};
      setMaskedPhone(data.phone || maskedPhone);
      setVerified(true);
      setMessage('Mobile number verified successfully.');
      window.setTimeout(() => router.replace(returnTo), 700);
    } catch (err) {
      setError(messageFrom(err, 'The OTP could not be verified.'));
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/phone/resend-otp');
      const data = response?.data?.data || {};
      setMaskedPhone(data.phone || maskedPhone);
      setSeconds(Number(data.resendAfterSeconds || 60));
      setMessage('A new OTP has been sent.');
    } catch (err) {
      setError(messageFrom(err, 'Unable to resend OTP.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="verify-phone-shell">
      <section className="verify-phone-card" aria-labelledby="verify-phone-title">
        <div className="verify-phone-mark" aria-hidden="true">HC</div>
        <p className="verify-phone-kicker">SECURE ACCOUNT</p>
        <h1 id="verify-phone-title">Verify your mobile number</h1>
        <p className="verify-phone-copy">
          HealthConnect uses a verified mobile number for sensitive actions such as appointments and payments.
          Your OTP is handled by our messaging provider and is not stored as plaintext by HealthConnect.
        </p>

        {error && <div className="verify-phone-alert error" role="alert">{error}</div>}
        {message && <div className="verify-phone-alert success" role="status">{message}</div>}

        {verified ? (
          <div className="verified-state">
            <div className="verified-icon" aria-hidden="true">✓</div>
            <strong>Mobile verified</strong>
            {maskedPhone && <span>{maskedPhone}</span>}
            <button type="button" onClick={() => router.replace(returnTo)}>Continue</button>
          </div>
        ) : !sent ? (
          <form onSubmit={sendOtp}>
            <label htmlFor="phone">Indian mobile number</label>
            <div className="phone-row">
              <span className="country-code">+91</span>
              <input
                id="phone"
                name="phone"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                required
              />
            </div>
            <button className="primary" disabled={busy || phone.length !== 10} type="submit">
              {busy ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <label htmlFor="otp">Enter OTP sent to {maskedPhone || 'your mobile'}</label>
            <input
              id="otp"
              name="otp"
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="••••••"
              required
              autoFocus
            />
            <button className="primary" disabled={busy || otp.length < 4} type="submit">
              {busy ? 'Verifying…' : 'Verify mobile'}
            </button>
            <div className="verify-phone-actions">
              <button type="button" className="link" disabled={busy || seconds > 0} onClick={resendOtp}>
                {seconds > 0 ? `Resend in ${seconds}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                className="link"
                disabled={busy}
                onClick={() => { setSent(false); setOtp(''); setMessage(''); setError(''); }}
              >
                Change number
              </button>
            </div>
          </form>
        )}

        <p className="verify-phone-note">
          We will never ask you to share an OTP with a doctor, hospital, support agent, or another person.
        </p>
      </section>

      <style jsx>{`
        .verify-phone-shell{min-height:100vh;display:grid;place-items:center;padding:32px 18px;background:linear-gradient(145deg,#edf8f7 0%,#f8fbff 52%,#eef3ff 100%);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0b2940}
        .verify-phone-card{width:min(100%,520px);background:#fff;border:1px solid rgba(15,98,91,.13);border-radius:28px;padding:36px;box-shadow:0 24px 80px rgba(17,73,83,.13)}
        .verify-phone-mark{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:#0d655f;color:#fff;font-weight:900;letter-spacing:-.04em;margin-bottom:24px}
        .verify-phone-kicker{margin:0 0 8px;color:#078d81;font-size:12px;font-weight:800;letter-spacing:.13em}
        h1{font-size:clamp(30px,5vw,42px);line-height:1.05;letter-spacing:-.045em;margin:0 0 14px}
        .verify-phone-copy{color:#577083;line-height:1.65;margin:0 0 26px;font-size:15px}
        form{display:grid;gap:12px}
        label{font-size:13px;font-weight:800;color:#193d52}
        .phone-row{display:grid;grid-template-columns:auto 1fr;border:1px solid #cbd9e2;border-radius:13px;overflow:hidden;background:#fff;transition:.18s ease}
        .phone-row:focus-within{border-color:#0b8e82;box-shadow:0 0 0 4px rgba(11,142,130,.11)}
        .country-code{padding:14px 12px 14px 15px;background:#f4f8fa;border-right:1px solid #dbe5eb;font-weight:800;color:#31566a}
        input{font:inherit;border:1px solid #cbd9e2;border-radius:13px;padding:14px 15px;outline:none;color:#102f43;background:#fff}
        .phone-row input{border:0;border-radius:0;min-width:0}
        .otp-input{font-size:24px;letter-spacing:.2em;text-align:center;font-weight:800}
        input:focus{border-color:#0b8e82;box-shadow:0 0 0 4px rgba(11,142,130,.11)}
        button{font:inherit;cursor:pointer}
        button:disabled{cursor:not-allowed;opacity:.55}
        .primary,.verified-state button{border:0;border-radius:13px;background:#0c6961;color:#fff;font-weight:800;padding:14px 18px;margin-top:3px;box-shadow:0 8px 24px rgba(12,105,97,.18)}
        .primary:hover:not(:disabled),.verified-state button:hover{background:#095b55}
        .verify-phone-actions{display:flex;justify-content:space-between;gap:16px;margin-top:6px}
        .link{border:0;background:transparent;color:#087e74;font-size:13px;font-weight:800;padding:8px 0}
        .verify-phone-alert{border-radius:12px;padding:11px 13px;margin:0 0 18px;font-size:13px;line-height:1.5}
        .verify-phone-alert.error{background:#fff3f3;border:1px solid #fecaca;color:#a12626}
        .verify-phone-alert.success{background:#effaf7;border:1px solid #b9e9df;color:#176358}
        .verified-state{display:grid;justify-items:center;text-align:center;gap:8px;padding:18px 0 8px}
        .verified-icon{width:52px;height:52px;display:grid;place-items:center;border-radius:50%;background:#e9f8f4;color:#087a70;font-size:28px;font-weight:900}
        .verified-state strong{font-size:20px}
        .verified-state span{color:#61788a;font-size:14px;margin-bottom:6px}
        .verified-state button{min-width:160px}
        .verify-phone-note{font-size:12px;color:#728696;line-height:1.6;border-top:1px solid #e7eef2;padding-top:18px;margin:24px 0 0}
        @media(max-width:560px){.verify-phone-card{padding:26px 20px;border-radius:22px}.verify-phone-actions{align-items:flex-start;flex-direction:column;gap:0}}
      `}</style>
    </main>
  );
}
