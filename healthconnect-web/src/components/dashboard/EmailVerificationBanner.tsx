'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { verificationAPI, PhoneVerificationStatus } from '@/lib/verificationApi';

type EmailState = 'idle' | 'sending' | 'sent' | 'error';
type PhoneState = 'loading' | 'idle' | 'sending' | 'code' | 'verifying' | 'verified' | 'error';

const extract = (response: any) => response?.data?.data ?? response?.data ?? response;

export default function EmailVerificationBanner() {
  const user = useAuthStore(s => (s as any).user);
  const store = useAuthStore.getState() as any;

  const [emailState, setEmailState] = useState<EmailState>('idle');
  const [phoneState, setPhoneState] = useState<PhoneState>('loading');
  const [phoneStatus, setPhoneStatus] = useState<PhoneVerificationStatus | null>(null);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  const autoFired = useRef(false);

  const emailVerified = Boolean(user?.isEmailVerified);
  const phoneVerified = Boolean(phoneStatus?.isPhoneVerified);
  const fullyVerified = emailVerified && phoneVerified;

  const refreshPhoneStatus = async () => {
    if (!user) return;
    try {
      const res = await verificationAPI.getPhoneStatus();
      const status = extract(res) as PhoneVerificationStatus;
      setPhoneStatus(status);
      setPhoneState(status.isPhoneVerified ? 'verified' : 'idle');
    } catch (error: any) {
      const code = error?.response?.data?.error_code;
      if (code === 'PHONE_REQUIRED') {
        setPhoneStatus({ hasPhone: false, phoneMasked: null, isPhoneVerified: false });
        setPhoneState('idle');
      } else {
        setMessage(error?.response?.data?.message ?? 'Unable to check account verification status.');
        setPhoneState('error');
      }
    }
  };

  useEffect(() => {
    refreshPhoneStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Keep the existing one-per-browser-session email resend for newly registered users.
  useEffect(() => {
    if (!user || emailVerified || autoFired.current) return;
    const key = `hc_vsent_${user.id ?? user.email}`;
    if (sessionStorage.getItem(key)) return;
    autoFired.current = true;
    sessionStorage.setItem(key, '1');
    authAPI.resendVerification().catch(() => {});
  }, [user, emailVerified]);

  useEffect(() => {
    if (resendAfter <= 0) return;
    const timer = window.setInterval(() => {
      setResendAfter(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendAfter]);

  const roleLabel = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return role ? `${role.charAt(0).toUpperCase()}${role.slice(1)} account` : 'Account';
  }, [user?.role]);

  if (!user || fullyVerified || dismissed) return null;

  const handleEmailResend = async () => {
    if (emailState === 'sending') return;
    setEmailState('sending');
    setMessage('');
    try {
      await authAPI.resendVerification();
      setEmailState('sent');
    } catch (error: any) {
      const code = error?.response?.data?.error_code;
      const msg = error?.response?.data?.message ?? '';
      if (code === 'ALREADY_VERIFIED' || /already verified/i.test(msg)) {
        if (store.setAuth && store.token) store.setAuth({ ...user, isEmailVerified: true }, store.token);
        setEmailState('sent');
        return;
      }
      setMessage(msg || 'Could not send the verification email. Please try again.');
      setEmailState('error');
    }
  };

  const handleSendOtp = async (resend = false) => {
    if (phoneState === 'sending' || resendAfter > 0) return;
    setPhoneState('sending');
    setMessage('');
    try {
      const res = resend ? await verificationAPI.resendPhoneOtp() : await verificationAPI.sendPhoneOtp();
      const data = extract(res) as any;
      if (data?.isPhoneVerified || data?.alreadyVerified) {
        await refreshPhoneStatus();
        return;
      }
      setResendAfter(Number(data?.resendAfterSeconds ?? 60));
      setPhoneStatus(current => ({
        hasPhone: true,
        phoneMasked: data?.phoneMasked ?? current?.phoneMasked ?? null,
        isPhoneVerified: false,
      }));
      setPhoneState('code');
      setMessage(`OTP sent to ${data?.phoneMasked ?? 'your mobile number'}.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message ?? 'Unable to send OTP. Please try again.');
      setPhoneState('error');
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{4,9}$/.test(otp) || phoneState === 'verifying') {
      setMessage('Enter the OTP sent to your mobile number.');
      return;
    }
    setPhoneState('verifying');
    setMessage('');
    try {
      await verificationAPI.verifyPhoneOtp(otp);
      setOtp('');
      setPhoneState('verified');
      setMessage('Mobile number verified successfully.');
      await refreshPhoneStatus();
    } catch (error: any) {
      setMessage(error?.response?.data?.message ?? 'OTP verification failed.');
      setPhoneState('code');
    }
  };

  return (
    <section
      aria-label="Account verification"
      style={{
        background: '#FFFBEB',
        borderBottom: '1px solid #FDE68A',
        padding: '11px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap',
        fontSize: 13,
      }}
    >
      <div style={{ minWidth: 240, flex: '1 1 360px' }}>
        <div style={{ color: '#78350F', fontWeight: 800, marginBottom: 3 }}>Secure your {roleLabel}</div>
        <div style={{ color: '#92400E', lineHeight: 1.5 }}>
          {!emailVerified && <>Verify <strong>{user.email}</strong>. </>}
          {!phoneVerified && phoneStatus?.hasPhone && <>Verify <strong>{phoneStatus.phoneMasked}</strong>. </>}
          {!phoneVerified && phoneStatus && !phoneStatus.hasPhone && <>Add a mobile number in your profile, then verify it here. </>}
          Verified email and mobile are required for sensitive actions such as booking, payment and medical-record sharing.
        </div>
        {message && (
          <div role="status" style={{ marginTop: 5, color: /verified successfully|OTP sent/i.test(message) ? '#15803D' : '#B45309', fontSize: 12, fontWeight: 650 }}>
            {message}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {!emailVerified && (
          <button
            type="button"
            onClick={handleEmailResend}
            disabled={emailState === 'sending'}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #F59E0B', background: '#fff', color: '#92400E', fontSize: 12, fontWeight: 750, cursor: emailState === 'sending' ? 'wait' : 'pointer' }}
          >
            {emailState === 'sending' ? 'Sending…' : emailState === 'sent' ? 'Email sent ✓' : 'Resend email'}
          </button>
        )}

        {!phoneVerified && phoneStatus?.hasPhone && phoneState !== 'code' && phoneState !== 'verifying' && (
          <button
            type="button"
            onClick={() => handleSendOtp(false)}
            disabled={phoneState === 'sending' || resendAfter > 0}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#0D9488', color: '#fff', fontSize: 12, fontWeight: 750, cursor: phoneState === 'sending' ? 'wait' : 'pointer' }}
          >
            {phoneState === 'sending' ? 'Sending OTP…' : 'Verify mobile'}
          </button>
        )}

        {!phoneVerified && phoneStatus?.hasPhone && (phoneState === 'code' || phoneState === 'verifying') && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="sr-only">Mobile OTP</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Mobile OTP"
                value={otp}
                onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 9))}
                onKeyDown={event => { if (event.key === 'Enter') handleVerifyOtp(); }}
                placeholder="Enter OTP"
                style={{ width: 108, padding: '7px 9px', borderRadius: 8, border: '1px solid #D6D3D1', background: '#fff', fontSize: 12, letterSpacing: '.08em' }}
              />
            </label>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={phoneState === 'verifying'}
              style={{ padding: '7px 11px', borderRadius: 8, border: 'none', background: '#0D9488', color: '#fff', fontSize: 12, fontWeight: 750, cursor: phoneState === 'verifying' ? 'wait' : 'pointer' }}
            >
              {phoneState === 'verifying' ? 'Checking…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => handleSendOtp(true)}
              disabled={resendAfter > 0}
              style={{ padding: '7px 9px', borderRadius: 8, border: 'none', background: 'transparent', color: '#0F766E', fontSize: 11.5, fontWeight: 700, cursor: resendAfter > 0 ? 'default' : 'pointer' }}
            >
              {resendAfter > 0 ? `Resend in ${resendAfter}s` : 'Resend OTP'}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss verification notice"
          title="Dismiss"
          style={{ background: 'none', border: 'none', color: '#B45309', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '4px 6px' }}
        >
          ×
        </button>
      </div>
    </section>
  );
}
