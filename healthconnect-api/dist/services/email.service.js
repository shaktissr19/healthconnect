"use strict";
// src/services/email.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// SendGrid email service for HealthConnect India.
// Handles: password reset, email verification, post-appointment review prompt,
//          appointment confirmation, doctor verification approved/rejected.
//
// Setup:
//   npm install @sendgrid/mail
//   Add to .env: SENDGRID_API_KEY=SG.xxxx
//               FROM_EMAIL=noreply@healthconnect.sbs
//               FROM_NAME=HealthConnect India
//               FRONTEND_URL=https://healthconnect.sbs
// ─────────────────────────────────────────────────────────────────────────────
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendReviewPromptEmail = sendReviewPromptEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendAppointmentConfirmationEmail = sendAppointmentConfirmationEmail;
exports.sendDoctorVerificationEmail = sendDoctorVerificationEmail;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const logger_1 = require("../utils/logger");
const API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@healthconnect.sbs';
const FROM_NAME = process.env.FROM_NAME || 'HealthConnect India';
const FE_URL = process.env.FRONTEND_URL || 'https://healthconnect.sbs';
if (API_KEY) {
    mail_1.default.setApiKey(API_KEY);
}
else {
    logger_1.logger.warn('SENDGRID_API_KEY not set — emails will be logged only');
}
// ── Shared email template wrapper ─────────────────────────────────────────
function wrapHtml(title, body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(12,26,58,0.10);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#0D9488 100%);padding:28px 36px;">
          <table width="100%"><tr>
            <td><span style="display:inline-block;width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,0.2);text-align:center;line-height:36px;font-size:18px;font-weight:900;color:#fff;">H</span>
            <span style="margin-left:10px;font-size:16px;font-weight:700;color:#fff;vertical-align:middle;">HealthConnect India</span></td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">${body}</td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8FAFC;padding:20px 36px;border-top:1px solid #E2EAF4;">
          <p style="margin:0;font-size:12px;color:#7A8FA8;line-height:1.6;">
            This email was sent by HealthConnect India · <a href="${FE_URL}" style="color:#0D9488;text-decoration:none;">healthconnect.sbs</a><br/>
            If you did not request this, you can safely ignore this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
async function send(to, subject, html) {
    if (!API_KEY) {
        // Dev mode — just log
        logger_1.logger.info(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
        return;
    }
    try {
        await mail_1.default.send({ to, from: { email: FROM_EMAIL, name: FROM_NAME }, subject, html });
        logger_1.logger.info(`Email sent: ${subject} → ${to.split('@')[0]}@***`);
    }
    catch (err) {
        logger_1.logger.error(`Email failed: ${subject} → ${err?.message}`);
        // Don't throw — email failure should never break the main flow
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// 1. PASSWORD RESET EMAIL
// ─────────────────────────────────────────────────────────────────────────────
async function sendPasswordResetEmail(email, firstName, resetToken) {
    const resetUrl = `${FE_URL}/reset-password?token=${resetToken}`;
    const body = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0A1628;">Reset your password</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#4A5E7A;line-height:1.6;">
      Hi ${firstName}, we received a request to reset your HealthConnect password.
      Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#0D9488,#14B8A6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.01em;">
        Reset Password →
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#7A8FA8;">If the button doesn't work, copy and paste this link:</p>
    <p style="margin:0 0 24px;font-size:12px;color:#0D9488;word-break:break-all;">${resetUrl}</p>
    <div style="background:#FFF8F0;border:1px solid #FED7AA;border-radius:8px;padding:14px 16px;">
      <p style="margin:0;font-size:13px;color:#92400E;">
        🔒 <strong>Security tip:</strong> HealthConnect will never ask for your password over phone or email.
        If you didn't request this reset, your account is safe — just ignore this email.
      </p>
    </div>`;
    await send(email, 'Reset your HealthConnect password', wrapHtml('Reset Password', body));
}
// ─────────────────────────────────────────────────────────────────────────────
// 2. EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
async function sendVerificationEmail(email, firstName, verifyToken) {
    const verifyUrl = `${FE_URL}/verify-email?token=${verifyToken}`;
    const body = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0A1628;">Verify your email</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#4A5E7A;line-height:1.6;">
      Welcome to HealthConnect India, ${firstName}! 🎉<br/>
      Please verify your email address to activate your account and access all features.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#0A1628,#1A6BB5);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        Verify My Email →
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#7A8FA8;">This link expires in 24 hours. If it expires, you can request a new one from your profile settings.</p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 16px;margin-top:20px;">
      <p style="margin:0;font-size:13px;color:#166534;">
        ✅ Once verified, you can: book appointments, track your health score, upload medical reports, and join health communities.
      </p>
    </div>`;
    await send(email, 'Verify your HealthConnect email', wrapHtml('Verify Email', body));
}
// ─────────────────────────────────────────────────────────────────────────────
// 3. POST-APPOINTMENT REVIEW PROMPT
// ─────────────────────────────────────────────────────────────────────────────
async function sendReviewPromptEmail(patientEmail, patientFirstName, doctorName, doctorId, appointmentDate) {
    const reviewUrl = `${FE_URL}/doctors/${doctorId}?review=1`;
    const body = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0A1628;">How was your consultation?</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#4A5E7A;line-height:1.6;">
      Hi ${patientFirstName}, your appointment with <strong style="color:#0A1628;">${doctorName}</strong>
      on ${appointmentDate} is now complete. We'd love to hear about your experience.
    </p>
    <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:14px;color:#0C4A6E;font-weight:600;">Your review helps other patients find the right doctor.</p>
      <div style="display:flex;gap:4px;font-size:28px;margin-bottom:4px;">⭐⭐⭐⭐⭐</div>
      <p style="margin:0;font-size:13px;color:#0369A1;">Takes less than 60 seconds</p>
    </div>
    <div style="text-align:center;margin:20px 0 28px;">
      <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#0D9488,#14B8A6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        Write a Review →
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#7A8FA8;text-align:center;">
      Your feedback is anonymous by default and helps the HealthConnect community.
    </p>`;
    await send(patientEmail, `How was your appointment with ${doctorName}?`, wrapHtml('Rate Your Doctor', body));
}
// ─────────────────────────────────────────────────────────────────────────────
// 4. WELCOME EMAIL (bonus — sent on registration)
// ─────────────────────────────────────────────────────────────────────────────
async function sendWelcomeEmail(email, firstName, role) {
    const dashUrl = role === 'DOCTOR'
        ? `${FE_URL}/doctor-dashboard`
        : `${FE_URL}/dashboard`;
    const body = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0A1628;">Welcome to HealthConnect India 🎉</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#4A5E7A;line-height:1.6;">
      Hi ${firstName}, your account has been created successfully.
      ${role === 'DOCTOR'
        ? 'Complete your profile to get verified and start receiving patients.'
        : 'Your health journey starts here — track vitals, book doctors, and join communities.'}
    </p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${dashUrl}" style="display:inline-block;background:linear-gradient(135deg,#0A1628,#1A6BB5);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        Go to Dashboard →
      </a>
    </div>`;
    await send(email, 'Welcome to HealthConnect India', wrapHtml('Welcome', body));
}
// ─────────────────────────────────────────────────────────────────────────────
// 5. APPOINTMENT CONFIRMATION EMAIL
// Sent to patient when doctor changes status → CONFIRMED
// ─────────────────────────────────────────────────────────────────────────────
async function sendAppointmentConfirmationEmail(patientEmail, patientFirstName, doctorName, appointmentDate, // e.g. "25 March 2026"
appointmentTime, // e.g. "10:30 AM"
appointmentType, // IN_PERSON | TELECONSULT | HOME_VISIT
meetingLink, // only for TELECONSULT
clinicName, // for IN_PERSON
clinicCity) {
    const dashUrl = `${FE_URL}/dashboard`;
    const typeLabel = {
        IN_PERSON: '🏥 In-Person Visit',
        TELECONSULT: '💻 Video Consultation',
        HOME_VISIT: '🏠 Home Visit',
    };
    const locationBlock = appointmentType === 'TELECONSULT' && meetingLink
        ? `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 20px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;color:#1D4ED8;margin-bottom:8px;">📹 Join Video Consultation</div>
        <a href="${meetingLink}" style="display:inline-block;background:#1D4ED8;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;">
          Join Meeting →
        </a>
        <p style="margin:10px 0 0;font-size:12px;color:#3B82F6;">Save this link — you'll need it at appointment time.</p>
       </div>`
        : clinicName
            ? `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:14px 20px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;color:#15803D;margin-bottom:4px;">📍 Location</div>
        <div style="font-size:14px;color:#166534;">${clinicName}${clinicCity ? ', ' + clinicCity : ''}</div>
       </div>`
            : '';
    const body = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0A1628;">Appointment Confirmed ✅</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#4A5E7A;line-height:1.6;">
      Hi ${patientFirstName}, your appointment with <strong style="color:#0A1628;">${doctorName}</strong> has been confirmed.
    </p>

    <!-- Appointment details card -->
    <div style="background:#F8FAFF;border:1.5px solid #C7D7F5;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div style="font-size:11px;font-weight:700;color:#7A8FA8;letter-spacing:0.08em;margin-bottom:4px;">DATE</div>
          <div style="font-size:15px;font-weight:700;color:#0A1628;">${appointmentDate}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#7A8FA8;letter-spacing:0.08em;margin-bottom:4px;">TIME</div>
          <div style="font-size:15px;font-weight:700;color:#0A1628;">${appointmentTime}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#7A8FA8;letter-spacing:0.08em;margin-bottom:4px;">DOCTOR</div>
          <div style="font-size:14px;font-weight:600;color:#0D9488;">${doctorName}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#7A8FA8;letter-spacing:0.08em;margin-bottom:4px;">TYPE</div>
          <div style="font-size:14px;font-weight:600;color:#0A1628;">${typeLabel[appointmentType] || appointmentType}</div>
        </div>
      </div>
    </div>

    ${locationBlock}

    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
        <strong>Before your appointment:</strong> Keep your health records and recent reports ready.
        You can upload them in your dashboard for the doctor to review in advance.
      </p>
    </div>

    <div style="text-align:center;margin:20px 0 8px;">
      <a href="${dashUrl}" style="display:inline-block;background:linear-gradient(135deg,#0D9488,#14B8A6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        View in Dashboard →
      </a>
    </div>`;
    await send(patientEmail, `Appointment Confirmed — ${doctorName} on ${appointmentDate}`, wrapHtml('Appointment Confirmed', body));
}
// ─────────────────────────────────────────────────────────────────────────────
// 6. DOCTOR VERIFICATION EMAIL (approve OR reject)
// Sent to doctor when admin takes action on their verification request
// ─────────────────────────────────────────────────────────────────────────────
async function sendDoctorVerificationEmail(doctorEmail, doctorFirstName, action, reason) {
    const dashUrl = `${FE_URL}/doctor-dashboard`;
    const approvedBody = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;background:#F0FDF4;border:2px solid #BBF7D0;font-size:36px;">✅</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0A1628;text-align:center;">You're Verified!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#4A5E7A;line-height:1.6;text-align:center;">
      Congratulations Dr. ${doctorFirstName}! Your HealthConnect profile has been verified by our medical team.
    </p>
    <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#15803D;margin-bottom:12px;">✦ What this means for you</div>
      ${[
        'Your profile now shows a verified badge to patients',
        'You appear in HealthConnect doctor search results',
        'Patients can book appointments with you directly',
        'You can join doctor communities and answer Q&As',
    ].map(item => `<div style="display:flex;gap:10px;margin-bottom:8px;"><span style="color:#16A34A;flex-shrink:0;">•</span><span style="font-size:13px;color:#166534;line-height:1.5;">${item}</span></div>`).join('')}
    </div>
    <div style="text-align:center;margin:20px 0 8px;">
      <a href="${dashUrl}" style="display:inline-block;background:linear-gradient(135deg,#0D9488,#14B8A6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        Go to My Dashboard →
      </a>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#7A8FA8;text-align:center;">
      Complete your availability slots so patients can book appointments right away.
    </p>`;
    const rejectedBody = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;background:#FFF5F5;border:2px solid #FECACA;font-size:36px;">📋</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0A1628;text-align:center;">Additional Information Required</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#4A5E7A;line-height:1.6;text-align:center;">
      Hi Dr. ${doctorFirstName}, our verification team needs a few more details before approving your profile.
    </p>
    ${reason ? `
    <div style="background:#FFF5F5;border:1.5px solid #FECACA;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:#BE123C;letter-spacing:0.06em;margin-bottom:8px;">FEEDBACK FROM REVIEW TEAM</div>
      <p style="margin:0;font-size:14px;color:#9F1239;line-height:1.6;">${reason}</p>
    </div>` : ''}
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#92400E;margin-bottom:8px;">Next steps</div>
      ${[
        'Update your profile with the requested information',
        'Ensure your medical registration certificate is clearly uploaded',
        'Double-check your specialization and degree details',
        'Resubmit for review from your dashboard',
    ].map(item => `<div style="display:flex;gap:10px;margin-bottom:6px;"><span style="color:#B45309;flex-shrink:0;">•</span><span style="font-size:13px;color:#78350F;">${item}</span></div>`).join('')}
    </div>
    <div style="text-align:center;margin:20px 0 8px;">
      <a href="${dashUrl}?tab=profile" style="display:inline-block;background:linear-gradient(135deg,#0A1628,#1A6BB5);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        Update My Profile →
      </a>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#7A8FA8;text-align:center;">
      Once updated, our team will re-review your profile within 48 hours.
    </p>`;
    const subject = action === 'approve'
        ? '🎉 Your HealthConnect Profile is Verified!'
        : 'Action Required — HealthConnect Profile Verification';
    await send(doctorEmail, subject, wrapHtml(action === 'approve' ? 'Profile Verified' : 'Verification Update', action === 'approve' ? approvedBody : rejectedBody));
}
//# sourceMappingURL=email.service.js.map