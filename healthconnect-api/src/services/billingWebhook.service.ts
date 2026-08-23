import crypto, { randomUUID } from 'crypto';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import {
  BillingError,
  getSubscriptionState,
  normalizeSubscriptionStatus,
  recordSubscriptionCharge,
  toDateFromUnix,
  upsertSubscriptionState,
  verifyHmac,
} from './razorpayBilling.service';
import { createSubscriptionInvoiceRecord } from './subscriptionBilling.service';
import { syncAppointmentPaymentFromProvider } from './appointmentBilling.service';

const getEventId = (rawBody: Buffer, headerEventId?: string | null) =>
  headerEventId?.trim() || `sha256:${crypto.createHash('sha256').update(rawBody).digest('hex')}`;

const claimEvent = async (args: {
  providerEventId: string;
  eventType: string;
  signature: string;
  payload: any;
}) => {
  const existing = await prisma.$queryRaw<Array<{ id: string; status: string }>>`
    SELECT id, status
    FROM billing.webhook_events
    WHERE provider_event_id = ${args.providerEventId}
    LIMIT 1
  `;
  if (existing[0]?.status === 'PROCESSED') return { id: existing[0].id, duplicate: true };

  if (existing[0]) {
    await prisma.$executeRaw`
      UPDATE billing.webhook_events
      SET event_type = ${args.eventType},
          signature = ${args.signature},
          payload = CAST(${JSON.stringify(args.payload)} AS jsonb),
          status = 'RECEIVED',
          error_message = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${existing[0].id}
    `;
    return { id: existing[0].id, duplicate: false };
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO billing.webhook_events (
      id, provider_event_id, event_type, signature, payload, status, updated_at
    ) VALUES (
      ${id}, ${args.providerEventId}, ${args.eventType}, ${args.signature},
      CAST(${JSON.stringify(args.payload)} AS jsonb), 'RECEIVED', CURRENT_TIMESTAMP
    )
    ON CONFLICT (provider_event_id) DO NOTHING
  `;

  const claimed = await prisma.$queryRaw<Array<{ id: string; status: string }>>`
    SELECT id, status
    FROM billing.webhook_events
    WHERE provider_event_id = ${args.providerEventId}
    LIMIT 1
  `;
  if (claimed[0]?.status === 'PROCESSED') return { id: claimed[0].id, duplicate: true };
  return { id: claimed[0]?.id || id, duplicate: false };
};

const markEvent = async (id: string, status: 'PROCESSED' | 'ERROR', error?: string) => {
  await prisma.$executeRaw`
    UPDATE billing.webhook_events
    SET status = ${status},
        error_message = ${error || null},
        processed_at = CASE WHEN ${status} = 'PROCESSED' THEN CURRENT_TIMESTAMP ELSE processed_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
};

const findLocalSubscription = async (providerSubscriptionId: string) => {
  if (!providerSubscriptionId) return null;
  return prisma.userSubscription.findFirst({
    where: { razorpaySubId: providerSubscriptionId },
    include: { plan: true },
  });
};

const syncSubscriptionEntity = async (subscriptionEntity: any, eventCreatedAt?: number) => {
  if (!subscriptionEntity?.id) return null;
  const local = await findLocalSubscription(subscriptionEntity.id);
  if (!local) return null;

  const status = normalizeSubscriptionStatus(subscriptionEntity.status);
  const startDate = toDateFromUnix(subscriptionEntity.current_start) || toDateFromUnix(subscriptionEntity.start_at) || local.startDate;
  const endDate = toDateFromUnix(subscriptionEntity.current_end) || local.endDate;
  const cancelledAt = status === 'CANCELLED'
    ? toDateFromUnix(subscriptionEntity.ended_at) || new Date()
    : local.cancelledAt;

  await prisma.userSubscription.update({
    where: { id: local.id },
    data: {
      status,
      startDate,
      endDate,
      autoRenew: status !== 'CANCELLED' && status !== 'EXPIRED' && !subscriptionEntity.has_scheduled_changes,
      ...(status === 'CANCELLED' ? { cancelledAt } : {}),
    },
  });

  const state = await getSubscriptionState(local.id);
  await upsertSubscriptionState({
    userSubscriptionId: local.id,
    planVersionId: state?.planVersionId || null,
    providerSubscriptionId: subscriptionEntity.id,
    providerStatus: subscriptionEntity.status || null,
    promotionCode: state?.promotionCode || null,
    baseAmountPaise: Number(state?.baseAmountPaise || 0),
    introductoryAmountPaise: state?.introductoryAmountPaise || null,
    introductoryCycles: Number(state?.introductoryCycles || 0),
    paidCount: Number(subscriptionEntity.paid_count || 0),
    totalCount: Number(subscriptionEntity.total_count || 0) || null,
    cancelAtCycleEnd: Boolean(subscriptionEntity.has_scheduled_changes || state?.cancelAtCycleEnd),
    cancelRequestedAt: state?.cancelRequestedAt || null,
    nextChargeAt: toDateFromUnix(subscriptionEntity.charge_at),
    lastEventAt: toDateFromUnix(eventCreatedAt) || new Date(),
  });

  return local;
};

const syncSubscriptionCharge = async (local: any, paymentEntity: any) => {
  if (!local || !paymentEntity?.id) return;
  const status = String(paymentEntity.status || 'AUTHORIZED').toUpperCase();
  await recordSubscriptionCharge({
    userSubscriptionId: local.id,
    payerUserId: local.userId,
    amountPaise: Number(paymentEntity.amount || 0),
    currency: paymentEntity.currency || 'INR',
    status,
    providerPaymentId: paymentEntity.id,
    providerOrderId: paymentEntity.order_id || null,
    providerInvoiceId: paymentEntity.invoice_id || null,
    method: paymentEntity.method || null,
    failureReason: paymentEntity.error_description || null,
    paidAt: status === 'CAPTURED' ? toDateFromUnix(paymentEntity.created_at) || new Date() : null,
  });
};

const syncInvoice = async (invoiceEntity: any, paymentEntity?: any) => {
  if (!invoiceEntity?.id) return;
  const providerSubscriptionId = invoiceEntity.subscription_id || null;
  const local = providerSubscriptionId ? await findLocalSubscription(providerSubscriptionId) : null;
  await createSubscriptionInvoiceRecord({
    userSubscriptionId: local?.id || null,
    providerInvoiceId: invoiceEntity.id,
    providerSubscriptionId,
    providerPaymentId: paymentEntity?.id || invoiceEntity.payment_id || null,
    amountPaise: Number(invoiceEntity.amount || invoiceEntity.amount_paid || paymentEntity?.amount || 0),
    currency: invoiceEntity.currency || paymentEntity?.currency || 'INR',
    status: String(invoiceEntity.status || 'ISSUED').toUpperCase(),
    invoiceNumber: invoiceEntity.invoice_number || invoiceEntity.receipt || null,
    shortUrl: invoiceEntity.short_url || null,
    issuedAt: toDateFromUnix(invoiceEntity.issued_at || invoiceEntity.date || invoiceEntity.created_at),
    paidAt: String(invoiceEntity.status || '').toLowerCase() === 'paid'
      ? toDateFromUnix(invoiceEntity.paid_at || paymentEntity?.created_at) || new Date()
      : null,
  });
};

const syncRefund = async (refundEntity: any) => {
  if (!refundEntity?.id || !refundEntity.payment_id) return;
  const providerPaymentId = refundEntity.payment_id;
  const amountPaise = Number(refundEntity.amount || 0);
  const status = String(refundEntity.status || 'PENDING').toUpperCase();
  const processedAt = status === 'PROCESSED' ? toDateFromUnix(refundEntity.processed_at || refundEntity.created_at) || new Date() : null;

  const appointment = await prisma.$queryRaw<Array<{ id: string; amountPaise: number; refundedPaise: number }>>`
    SELECT id, amount_paise AS "amountPaise", amount_refunded_paise AS "refundedPaise"
    FROM billing.appointment_payments
    WHERE provider_payment_id = ${providerPaymentId}
    LIMIT 1
  `;

  let sourceKind: 'APPOINTMENT' | 'SUBSCRIPTION' | null = null;
  let sourceId: string | null = null;
  if (appointment[0]) {
    sourceKind = 'APPOINTMENT';
    sourceId = appointment[0].id;
  } else {
    const charge = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM billing.subscription_charges
      WHERE provider_payment_id = ${providerPaymentId}
      LIMIT 1
    `;
    if (charge[0]) {
      sourceKind = 'SUBSCRIPTION';
      sourceId = charge[0].id;
    }
  }
  if (!sourceKind || !sourceId) return;

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM billing.refunds
    WHERE provider_refund_id = ${refundEntity.id}
    LIMIT 1
  `;
  const refundId = existing[0]?.id || randomUUID();
  await prisma.$executeRaw`
    INSERT INTO billing.refunds (
      id, source_kind, source_id, provider_payment_id, provider_refund_id,
      amount_paise, currency, status, reason, processed_at, updated_at
    ) VALUES (
      ${refundId}, ${sourceKind}, ${sourceId}, ${providerPaymentId}, ${refundEntity.id},
      ${Math.max(0, amountPaise)}, ${refundEntity.currency || 'INR'}, ${status},
      ${refundEntity.notes?.reason || null}, ${processedAt}, CURRENT_TIMESTAMP
    )
    ON CONFLICT (provider_refund_id) DO UPDATE SET
      amount_paise = EXCLUDED.amount_paise,
      status = EXCLUDED.status,
      reason = COALESCE(EXCLUDED.reason, billing.refunds.reason),
      processed_at = COALESCE(EXCLUDED.processed_at, billing.refunds.processed_at),
      updated_at = CURRENT_TIMESTAMP
  `;

  if (sourceKind === 'APPOINTMENT' && status === 'PROCESSED') {
    const sums = await prisma.$queryRaw<Array<{ refundedPaise: bigint }>>`
      SELECT COALESCE(SUM(amount_paise), 0)::bigint AS "refundedPaise"
      FROM billing.refunds
      WHERE source_kind = 'APPOINTMENT'
        AND source_id = ${sourceId}
        AND status = 'PROCESSED'
    `;
    const totalRefunded = Number(sums[0]?.refundedPaise || 0);
    const amount = Number(appointment[0].amountPaise || 0);
    const paymentStatus = totalRefunded >= amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await prisma.$executeRaw`
      UPDATE billing.appointment_payments
      SET amount_refunded_paise = ${Math.min(totalRefunded, amount)},
          status = ${paymentStatus},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sourceId}
    `;
  }
};

export const processRazorpayWebhook = async (args: {
  rawBody: Buffer;
  signature?: string | null;
  providerEventId?: string | null;
}) => {
  const secret = config.razorpay.webhookSecret?.trim();
  if (!secret) {
    throw new BillingError('WEBHOOK_SECRET_NOT_CONFIGURED', 'Razorpay webhook secret is not configured.', 503);
  }
  const signature = args.signature?.trim() || '';
  if (!verifyHmac(args.rawBody, signature, secret)) {
    throw new BillingError('INVALID_WEBHOOK_SIGNATURE', 'Webhook signature verification failed.', 400);
  }

  let event: any;
  try {
    event = JSON.parse(args.rawBody.toString('utf8'));
  } catch {
    throw new BillingError('INVALID_WEBHOOK_BODY', 'Webhook body is not valid JSON.', 400);
  }

  const eventType = String(event?.event || 'unknown');
  const providerEventId = getEventId(args.rawBody, args.providerEventId);
  const claim = await claimEvent({ providerEventId, eventType, signature, payload: event });
  if (claim.duplicate) return { duplicate: true, eventType };

  try {
    const subscriptionEntity = event?.payload?.subscription?.entity;
    const paymentEntity = event?.payload?.payment?.entity;
    const invoiceEntity = event?.payload?.invoice?.entity;
    const refundEntity = event?.payload?.refund?.entity;

    let localSubscription: any = null;
    if (subscriptionEntity?.id) {
      localSubscription = await syncSubscriptionEntity(subscriptionEntity, event?.created_at);
    }

    if (eventType === 'subscription.charged' && localSubscription && paymentEntity) {
      await syncSubscriptionCharge(localSubscription, paymentEntity);
    }

    if (['payment.authorized', 'payment.captured', 'payment.failed', 'order.paid'].includes(eventType) && paymentEntity) {
      await syncAppointmentPaymentFromProvider(paymentEntity);
    }

    if (eventType.startsWith('invoice.') && invoiceEntity) {
      await syncInvoice(invoiceEntity, paymentEntity);
    }

    if (eventType.startsWith('refund.') && refundEntity) {
      await syncRefund(refundEntity);
    }

    await markEvent(claim.id, 'PROCESSED');
    return { duplicate: false, eventType };
  } catch (error: any) {
    await markEvent(claim.id, 'ERROR', String(error?.message || error).slice(0, 2000));
    throw error;
  }
};
