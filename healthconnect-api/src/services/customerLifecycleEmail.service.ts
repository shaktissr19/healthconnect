import sgMail from '@sendgrid/mail';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { logger } from '../utils/logger';

const apiKey = config.email.sendgridApiKey?.trim() || '';
if (apiKey) sgMail.setApiKey(apiKey);

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const money = (paise: unknown) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const shell = (title: string, body: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f3f8f8;font-family:Arial,Helvetica,sans-serif;color:#123246">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px;background:#f3f8f8"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #dceaea">
<tr><td style="padding:22px 28px;background:#0d655f;color:#fff;font-weight:800;font-size:18px">HealthConnect India</td></tr>
<tr><td style="padding:30px 28px">${body}</td></tr>
<tr><td style="padding:18px 28px;background:#f8fbfb;color:#6c8190;font-size:12px;line-height:1.6">HealthConnect India · <a href="${escapeHtml(config.frontendUrl)}" style="color:#0d7b72">${escapeHtml(config.frontendUrl)}</a><br>Never share your password, payment PIN or OTP with anyone.</td></tr>
</table></td></tr></table></body></html>`;

const send = async (to: string, subject: string, html: string) => {
  if (!apiKey) {
    logger.info(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await sgMail.send({
      to,
      from: { email: config.email.fromEmail, name: config.email.fromName },
      subject,
      html,
    });
    logger.info(`Lifecycle email sent: ${subject} -> ${to.split('@')[0]}@***`);
  } catch (error: any) {
    logger.error(`Lifecycle email failed: ${subject} -> ${error?.message || 'unknown error'}`);
    if (config.email.strictMode) throw error;
  }
};

const userEmail = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      patientProfile: { select: { firstName: true } },
      doctorProfile: { select: { firstName: true } },
      hospitalProfile: { select: { name: true } },
    },
  });
  if (!user?.email) return null;
  return {
    email: user.email,
    name: user.patientProfile?.firstName || user.doctorProfile?.firstName || user.hospitalProfile?.name || 'there',
  };
};

export const sendAppointmentPaymentReceiptEmail = async (userId: string, receipt: any) => {
  const user = await userEmail(userId);
  if (!user) return;
  const payment = receipt?.payment || {};
  const appointment = receipt?.appointment || {};
  const body = `
    <h1 style="margin:0 0 10px;font-size:25px;color:#102f43">Payment received</h1>
    <p style="margin:0 0 22px;color:#526c7d;line-height:1.65">Hi ${escapeHtml(user.name)}, your consultation payment has been securely verified.</p>
    <table role="presentation" width="100%" style="border-collapse:collapse;background:#f7fbfb;border:1px solid #dbe9e8;border-radius:12px">
      <tr><td style="padding:12px 16px;color:#6b7f8d">Amount</td><td style="padding:12px 16px;text-align:right;font-weight:800">${money(payment.amountPaise)}</td></tr>
      <tr><td style="padding:12px 16px;color:#6b7f8d">Doctor</td><td style="padding:12px 16px;text-align:right;font-weight:700">${escapeHtml(appointment.doctorName)}</td></tr>
      <tr><td style="padding:12px 16px;color:#6b7f8d">Receipt</td><td style="padding:12px 16px;text-align:right">${escapeHtml(receipt?.receiptNumber)}</td></tr>
      <tr><td style="padding:12px 16px;color:#6b7f8d">Payment ID</td><td style="padding:12px 16px;text-align:right">${escapeHtml(payment.providerPaymentId)}</td></tr>
    </table>
    <p style="margin:22px 0 0;color:#526c7d;font-size:13px;line-height:1.6">You can view the payment and receipt from your HealthConnect dashboard.</p>`;
  await send(user.email, `HealthConnect payment receipt ${receipt?.receiptNumber || ''}`.trim(), shell('Payment received', body));
};

export const sendSubscriptionVerifiedEmail = async (userId: string, result: any) => {
  const user = await userEmail(userId);
  if (!user) return;
  const planName = result?.plan?.displayName || result?.plan?.name || result?.subscription?.plan?.displayName || 'HealthConnect membership';
  const amountPaise = result?.amountPaise || result?.charge?.amountPaise || result?.plan?.amountPaise;
  const body = `
    <h1 style="margin:0 0 10px;font-size:25px;color:#102f43">Membership activated</h1>
    <p style="margin:0 0 20px;color:#526c7d;line-height:1.65">Hi ${escapeHtml(user.name)}, your ${escapeHtml(planName)} payment has been verified and your membership state is being kept in sync with Razorpay.</p>
    ${amountPaise ? `<div style="padding:16px;border-radius:12px;background:#eef9f6;border:1px solid #caebe3"><strong>Verified amount:</strong> ${money(amountPaise)}</div>` : ''}
    <p style="margin:20px 0 0;color:#526c7d;font-size:13px;line-height:1.6">Billing history and current membership status are available in your dashboard.</p>`;
  await send(user.email, 'Your HealthConnect membership is active', shell('Membership activated', body));
};

export const sendSubscriptionCancellationEmail = async (userId: string, result: any) => {
  const user = await userEmail(userId);
  if (!user) return;
  const body = `
    <h1 style="margin:0 0 10px;font-size:25px;color:#102f43">Membership cancellation updated</h1>
    <p style="margin:0 0 20px;color:#526c7d;line-height:1.65">Hi ${escapeHtml(user.name)}, we processed your membership cancellation request.</p>
    <div style="padding:16px;border-radius:12px;background:#fff8eb;border:1px solid #f4dfad;color:#705017">${escapeHtml(result?.message || 'Your subscription status has been updated.')}</div>
    <p style="margin:20px 0 0;color:#526c7d;font-size:13px;line-height:1.6">You can review the effective end date and billing history in HealthConnect.</p>`;
  await send(user.email, 'HealthConnect membership cancellation update', shell('Cancellation update', body));
};

export const sendHospitalVerificationEmail = async (args: {
  email: string;
  hospitalName: string;
  action: 'review' | 'approve' | 'reject' | 'suspend' | 'restore';
  reason?: string | null;
}) => {
  const labels: Record<string, { subject: string; heading: string; tone: string }> = {
    review: { subject: 'HealthConnect hospital verification is under review', heading: 'Verification under review', tone: '#eef6ff' },
    approve: { subject: 'Your hospital is verified on HealthConnect', heading: 'Hospital verified', tone: '#eef9f6' },
    restore: { subject: 'Your HealthConnect hospital verification is restored', heading: 'Hospital verification restored', tone: '#eef9f6' },
    reject: { subject: 'Action required for hospital verification', heading: 'Verification needs attention', tone: '#fff8eb' },
    suspend: { subject: 'HealthConnect hospital verification suspended', heading: 'Verification suspended', tone: '#fff2f2' },
  };
  const meta = labels[args.action];
  const body = `
    <h1 style="margin:0 0 10px;font-size:25px;color:#102f43">${escapeHtml(meta.heading)}</h1>
    <p style="margin:0 0 18px;color:#526c7d;line-height:1.65">Verification update for <strong>${escapeHtml(args.hospitalName)}</strong>.</p>
    <div style="padding:16px;border-radius:12px;background:${meta.tone};border:1px solid #dfe8e8;line-height:1.6;color:#355262">${escapeHtml(args.reason || (args.action === 'approve' || args.action === 'restore' ? 'Your hospital can appear in HealthConnect public discovery while the verification remains active.' : args.action === 'review' ? 'Our team has started reviewing your submitted hospital details.' : 'Please sign in to review the verification status and next steps.'))}</div>`;
  await send(args.email, meta.subject, shell(meta.heading, body));
};
