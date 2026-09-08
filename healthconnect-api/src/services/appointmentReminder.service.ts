import sgMail from '@sendgrid/mail';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { logger } from '../utils/logger';

const apiKey = config.email.sendgridApiKey?.trim() || '';
if (apiKey) sgMail.setApiKey(apiKey);

const WINDOWS = [
  { key: '24H', minMinutes: 23 * 60, maxMinutes: 25 * 60, label: 'tomorrow' },
  { key: '2H', minMinutes: 90, maxMinutes: 150, label: 'in about 2 hours' },
] as const;

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const claim = async (appointmentId: string, reminderKey: string, channel: string) => {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "appointment_reminder_deliveries" (
      "appointmentId", "reminderKey", "channel", "status", "attempts", "updatedAt"
    ) VALUES (
      ${appointmentId}::uuid, ${reminderKey}, ${channel}, 'PENDING', 1, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("appointmentId", "reminderKey", "channel") DO NOTHING
    RETURNING id
  `;
  return rows[0]?.id || null;
};

const mark = async (id: string, status: 'SENT' | 'FAILED', error?: string) => {
  await prisma.$executeRaw`
    UPDATE "appointment_reminder_deliveries"
    SET "status" = ${status},
        "lastError" = ${error || null},
        "deliveredAt" = CASE WHEN ${status} = 'SENT' THEN CURRENT_TIMESTAMP ELSE "deliveredAt" END,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${id}::uuid
  `;
};

const sendEmail = async (args: {
  to: string;
  patientName: string;
  doctorName: string;
  scheduledAt: Date;
  label: string;
  type: string;
}) => {
  if (!apiKey) {
    if (config.email.strictMode) throw new Error('SENDGRID_API_KEY is not configured');
    logger.info(`[EMAIL DEV] Appointment reminder to ${args.to}`);
    return;
  }

  const when = args.scheduledAt.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f3f8f8;font-family:Arial,sans-serif;color:#183a4d">
  <table width="100%" role="presentation" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center">
  <table width="100%" role="presentation" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #dceaea;border-radius:18px;overflow:hidden">
  <tr><td style="padding:22px 28px;background:#0d655f;color:#fff;font-weight:800;font-size:18px">HealthConnect India</td></tr>
  <tr><td style="padding:30px 28px"><h1 style="font-size:24px;margin:0 0 12px">Appointment reminder</h1>
  <p style="line-height:1.65;color:#587181">Hi ${escapeHtml(args.patientName)}, your appointment with <strong>${escapeHtml(args.doctorName)}</strong> is ${escapeHtml(args.label)}.</p>
  <div style="padding:16px;border-radius:12px;background:#eef9f6;border:1px solid #caebe3;line-height:1.7"><strong>${escapeHtml(when)}</strong><br>${escapeHtml(args.type.replace(/_/g, ' '))}</div>
  <p style="line-height:1.65;color:#587181;font-size:13px">Open HealthConnect to review appointment details, reports and any preparation instructions.</p></td></tr>
  <tr><td style="padding:18px 28px;background:#f8fbfb;color:#718693;font-size:12px">Never share your password, payment PIN or OTP with anyone.</td></tr>
  </table></td></tr></table></body></html>`;

  await sgMail.send({
    to: args.to,
    from: { email: config.email.fromEmail, name: config.email.fromName },
    subject: `Appointment reminder — ${args.doctorName}`,
    html,
  });
};

const deliverOne = async (appointment: any, reminder: typeof WINDOWS[number]) => {
  const doctorName = `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
  const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
  const body = `Your appointment with ${doctorName} is ${reminder.label}.`;

  const notificationClaim = await claim(appointment.id, reminder.key, 'IN_APP');
  if (notificationClaim) {
    try {
      await prisma.notification.create({
        data: {
          userId: appointment.patient.userId,
          type: 'APPOINTMENT_REMINDER',
          title: 'Appointment reminder',
          body,
          data: { appointmentId: appointment.id, reminderKey: reminder.key },
        },
      });
      await mark(notificationClaim, 'SENT');
    } catch (error: any) {
      await mark(notificationClaim, 'FAILED', String(error?.message || error).slice(0, 1000));
      throw error;
    }
  }

  if (appointment.patient.user?.email) {
    const emailClaim = await claim(appointment.id, reminder.key, 'EMAIL');
    if (emailClaim) {
      try {
        await sendEmail({
          to: appointment.patient.user.email,
          patientName,
          doctorName,
          scheduledAt: appointment.scheduledAt,
          label: reminder.label,
          type: appointment.type,
        });
        await mark(emailClaim, 'SENT');
      } catch (error: any) {
        await mark(emailClaim, 'FAILED', String(error?.message || error).slice(0, 1000));
        throw error;
      }
    }
  }
};

export const runAppointmentReminders = async (now = new Date()) => {
  let examined = 0;
  let delivered = 0;
  let failures = 0;

  for (const reminder of WINDOWS) {
    const from = new Date(now.getTime() + reminder.minMinutes * 60_000);
    const to = new Date(now.getTime() + reminder.maxMinutes * 60_000);
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledAt: { gte: from, lte: to },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            userId: true,
            user: { select: { email: true } },
          },
        },
        doctor: { select: { firstName: true, lastName: true } },
      },
    });

    for (const appointment of appointments) {
      examined += 1;
      try {
        await deliverOne(appointment, reminder);
        delivered += 1;
      } catch (error: any) {
        failures += 1;
        logger.error(`Appointment reminder failed ${appointment.id}/${reminder.key}: ${error?.message || error}`);
      }
    }
  }

  return { examined, delivered, failures, ranAt: now.toISOString() };
};
