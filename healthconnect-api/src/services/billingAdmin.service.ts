import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { BillingError, canonicalAmountPaise, getRazorpayClient, syncCanonicalCatalog, toDateFromUnix } from './razorpayBilling.service';

export const getAdminBillingSummary = async () => {
  await syncCanonicalCatalog();

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: [{ targetRole: 'asc' }, { sortOrder: 'asc' }],
  });
  const subscriptionCounts = await prisma.userSubscription.groupBy({
    by: ['planId', 'status'],
    _count: true,
  });

  const totals = await prisma.$queryRaw<any[]>`
    SELECT
      COALESCE((SELECT SUM(amount_paise) FROM billing.subscription_charges WHERE status = 'CAPTURED'), 0)::bigint AS "membershipRevenuePaise",
      COALESCE((SELECT SUM(amount_paise) FROM billing.appointment_payments WHERE status IN ('CAPTURED','PARTIALLY_REFUNDED','REFUNDED')), 0)::bigint AS "consultationRevenuePaise",
      COALESCE((SELECT SUM(amount_paise) FROM billing.refunds WHERE status = 'PROCESSED'), 0)::bigint AS "refundsPaise",
      COALESCE((SELECT SUM(amount_paise) FROM billing.subscription_charges WHERE status = 'CAPTURED' AND paid_at >= date_trunc('month', CURRENT_TIMESTAMP)), 0)::bigint AS "membershipMonthPaise",
      COALESCE((SELECT SUM(amount_paise) FROM billing.appointment_payments WHERE status IN ('CAPTURED','PARTIALLY_REFUNDED','REFUNDED') AND captured_at >= date_trunc('month', CURRENT_TIMESTAMP)), 0)::bigint AS "consultationMonthPaise",
      COALESCE((SELECT COUNT(*) FROM billing.subscription_charges WHERE status = 'FAILED'), 0)::int AS "failedMembershipPayments",
      COALESCE((SELECT COUNT(*) FROM billing.appointment_payments WHERE status = 'FAILED'), 0)::int AS "failedAppointmentPayments"
  `;

  const recentSubscriptionRows = await prisma.userSubscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      plan: true,
      user: { select: { email: true, role: true } },
    },
  });
  const recentSubscriptions = recentSubscriptionRows
    .filter(row => canonicalAmountPaise(row.plan, 'MONTHLY') > 0 || canonicalAmountPaise(row.plan, 'ANNUAL') > 0)
    .slice(0, 25);

  const recentPayments = await prisma.$queryRaw<any[]>`
    (
      SELECT
        sc.id,
        'SUBSCRIPTION'::text AS "sourceKind",
        sc.id AS "sourceId",
        sc.amount_paise AS "amountPaise",
        COALESCE((
          SELECT SUM(r.amount_paise)
          FROM billing.refunds r
          WHERE r.source_kind = 'SUBSCRIPTION'
            AND r.source_id = sc.id
            AND r.status = 'PROCESSED'
        ), 0)::int AS "amountRefundedPaise",
        sc.currency,
        sc.status,
        sc.provider_payment_id AS "providerPaymentId",
        sc.method,
        sc.paid_at AS "paidAt",
        sc.created_at AS "createdAt",
        u.email AS "payerEmail",
        sp."displayName" AS "description"
      FROM billing.subscription_charges sc
      JOIN public.user_subscriptions us ON us.id = sc.user_subscription_id
      JOIN public.subscription_plans sp ON sp.id = us."planId"
      JOIN public.users u ON u.id = sc.payer_user_id
    )
    UNION ALL
    (
      SELECT
        ap.id,
        'APPOINTMENT'::text AS "sourceKind",
        ap.id AS "sourceId",
        ap.amount_paise AS "amountPaise",
        ap.amount_refunded_paise AS "amountRefundedPaise",
        ap.currency,
        ap.status,
        ap.provider_payment_id AS "providerPaymentId",
        ap.method,
        ap.paid_at AS "paidAt",
        ap.created_at AS "createdAt",
        u.email AS "payerEmail",
        ('Consultation · Dr. ' || dp."firstName" || ' ' || dp."lastName")::text AS "description"
      FROM billing.appointment_payments ap
      JOIN public.appointments a ON a.id = ap.appointment_id
      JOIN public.doctor_profiles dp ON dp.id = a."doctorId"
      JOIN public.users u ON u.id = ap.payer_user_id
    )
    ORDER BY "createdAt" DESC
    LIMIT 50
  `;

  const recentRefunds = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      source_kind AS "sourceKind",
      source_id AS "sourceId",
      provider_payment_id AS "providerPaymentId",
      provider_refund_id AS "providerRefundId",
      amount_paise AS "amountPaise",
      currency,
      status,
      reason,
      processed_at AS "processedAt",
      created_at AS "createdAt"
    FROM billing.refunds
    ORDER BY created_at DESC
    LIMIT 25
  `;

  const planRows = plans.map(plan => {
    const counts = subscriptionCounts.filter(row => row.planId === plan.id);
    const count = (status: string) => counts.find(row => row.status === status)?._count || 0;
    const totalCount = counts.reduce((sum, row) => sum + Number(row._count || 0), 0);
    return {
      ...plan,
      monthlyPrice: canonicalAmountPaise(plan, 'MONTHLY') / 100,
      annualPrice: canonicalAmountPaise(plan, 'ANNUAL') / 100,
      monthlyPricePaise: canonicalAmountPaise(plan, 'MONTHLY'),
      annualPricePaise: canonicalAmountPaise(plan, 'ANNUAL'),
      activeCount: count('ACTIVE'),
      trialingCount: count('TRIALING'),
      cancelledCount: count('CANCELLED'),
      pastDueCount: count('PAST_DUE'),
      expiredCount: count('EXPIRED'),
      totalCount,
    };
  });

  const paidPlanRows = planRows.filter(plan => Number(plan.monthlyPricePaise || 0) > 0 || Number(plan.annualPricePaise || 0) > 0);
  const sumStatus = (field: 'activeCount' | 'trialingCount' | 'cancelledCount' | 'pastDueCount' | 'expiredCount') =>
    paidPlanRows.reduce((sum, plan) => sum + Number(plan[field] || 0), 0);
  const activePaidSubscribers = sumStatus('activeCount');
  const trialingSubscribers = sumStatus('trialingCount');
  const cancelledSubscribers = sumStatus('cancelledCount');
  const pastDueSubscribers = sumStatus('pastDueCount');
  const expiredSubscribers = sumStatus('expiredCount');
  const membershipsStarted = paidPlanRows.reduce((sum, plan) => sum + Number(plan.totalCount || 0), 0);
  const patientActiveSubscribers = paidPlanRows.filter(plan => plan.targetRole === 'PATIENT').reduce((sum, plan) => sum + Number(plan.activeCount || 0), 0);
  const doctorActiveSubscribers = paidPlanRows.filter(plan => plan.targetRole === 'DOCTOR').reduce((sum, plan) => sum + Number(plan.activeCount || 0), 0);
  const estimatedMrrPaise = paidPlanRows.reduce((sum, plan) => sum + Number(plan.monthlyPricePaise || 0) * Number(plan.activeCount || 0), 0);

  const t = totals[0] || {};
  const membershipRevenuePaise = Number(t.membershipRevenuePaise || 0);
  const consultationRevenuePaise = Number(t.consultationRevenuePaise || 0);
  const refundsPaise = Number(t.refundsPaise || 0);
  const membershipMonthPaise = Number(t.membershipMonthPaise || 0);
  const consultationMonthPaise = Number(t.consultationMonthPaise || 0);

  return {
    totals: {
      membershipRevenuePaise,
      consultationRevenuePaise,
      grossRevenuePaise: membershipRevenuePaise + consultationRevenuePaise,
      refundsPaise,
      netRevenuePaise: membershipRevenuePaise + consultationRevenuePaise - refundsPaise,
      monthRevenuePaise: membershipMonthPaise + consultationMonthPaise,
      membershipMonthPaise,
      consultationMonthPaise,
      membershipsStarted,
      activeSubscribers: activePaidSubscribers,
      activePaidSubscribers,
      patientActiveSubscribers,
      doctorActiveSubscribers,
      trialingSubscribers,
      cancelledSubscribers,
      pastDueSubscribers,
      expiredSubscribers,
      estimatedMrrPaise,
      failedPayments: Number(t.failedMembershipPayments || 0) + Number(t.failedAppointmentPayments || 0),
    },
    plans: planRows,
    subscriptions: recentSubscriptions,
    recentPayments,
    recentRefunds,
  };
};

const getRefundSource = async (sourceKind: string, sourceId: string) => {
  if (sourceKind === 'APPOINTMENT') {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        provider_payment_id AS "providerPaymentId",
        amount_paise AS "amountPaise",
        amount_refunded_paise AS "amountRefundedPaise",
        currency,
        status
      FROM billing.appointment_payments
      WHERE id = ${sourceId}
      LIMIT 1
    `;
    if (!rows[0]) throw new BillingError('PAYMENT_NOT_FOUND', 'Appointment payment not found.', 404);
    return rows[0];
  }
  if (sourceKind === 'SUBSCRIPTION') {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        sc.id,
        sc.provider_payment_id AS "providerPaymentId",
        sc.amount_paise AS "amountPaise",
        sc.currency,
        sc.status,
        COALESCE((SELECT SUM(r.amount_paise) FROM billing.refunds r WHERE r.source_kind = 'SUBSCRIPTION' AND r.source_id = sc.id AND r.status = 'PROCESSED'), 0)::bigint AS "amountRefundedPaise"
      FROM billing.subscription_charges sc
      WHERE sc.id = ${sourceId}
      LIMIT 1
    `;
    if (!rows[0]) throw new BillingError('PAYMENT_NOT_FOUND', 'Subscription payment not found.', 404);
    return rows[0];
  }
  throw new BillingError('INVALID_REFUND_SOURCE', 'sourceKind must be APPOINTMENT or SUBSCRIPTION.', 422);
};

export const refundBillingPayment = async (args: {
  sourceKind: string;
  sourceId: string;
  amountPaise?: number | null;
  reason?: string | null;
}) => {
  const sourceKind = args.sourceKind.toUpperCase();
  const source = await getRefundSource(sourceKind, args.sourceId);
  if (!source.providerPaymentId) {
    throw new BillingError('PROVIDER_PAYMENT_MISSING', 'The payment has no Razorpay payment ID and cannot be refunded online.', 409);
  }
  if (!['CAPTURED', 'PARTIALLY_REFUNDED'].includes(String(source.status))) {
    throw new BillingError('PAYMENT_NOT_REFUNDABLE', `A ${String(source.status).toLowerCase()} payment cannot be refunded.`, 409);
  }

  const amountPaise = Number(source.amountPaise || 0);
  const alreadyRefundedPaise = Number(source.amountRefundedPaise || 0);
  const remainingPaise = Math.max(0, amountPaise - alreadyRefundedPaise);
  const requestedPaise = args.amountPaise == null ? remainingPaise : Math.round(Number(args.amountPaise));
  if (requestedPaise <= 0 || requestedPaise > remainingPaise) {
    throw new BillingError('INVALID_REFUND_AMOUNT', `Refund amount must be between ₹0.01 and ₹${(remainingPaise / 100).toFixed(2)}.`, 422);
  }

  const razorpay = getRazorpayClient();
  const providerRefund = await razorpay.payments.refund(source.providerPaymentId, {
    amount: requestedPaise,
    speed: 'normal',
    notes: {
      reason: (args.reason || 'Admin-approved refund').slice(0, 200),
      hc_source_kind: sourceKind,
      hc_source_id: args.sourceId,
    },
  } as any);
  if (!providerRefund?.id) {
    throw new BillingError('REFUND_CREATE_FAILED', 'Razorpay did not create the refund.', 502);
  }

  const refundStatus = String(providerRefund.status || 'PENDING').toUpperCase();
  const processedAt = refundStatus === 'PROCESSED'
    ? toDateFromUnix(providerRefund.processed_at || providerRefund.created_at) || new Date()
    : null;
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO billing.refunds (
      id, source_kind, source_id, provider_payment_id, provider_refund_id,
      amount_paise, currency, status, reason, processed_at, updated_at
    ) VALUES (
      ${id}, ${sourceKind}, ${args.sourceId}, ${source.providerPaymentId}, ${providerRefund.id},
      ${requestedPaise}, ${providerRefund.currency || source.currency || 'INR'}, ${refundStatus},
      ${args.reason || 'Admin-approved refund'}, ${processedAt}, CURRENT_TIMESTAMP
    )
  `;

  if (sourceKind === 'APPOINTMENT' && refundStatus === 'PROCESSED') {
    const newRefunded = alreadyRefundedPaise + requestedPaise;
    const newStatus = newRefunded >= amountPaise ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await prisma.$executeRaw`
      UPDATE billing.appointment_payments
      SET amount_refunded_paise = ${Math.min(newRefunded, amountPaise)},
          status = ${newStatus},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${args.sourceId}
    `;
  }

  if (sourceKind === 'SUBSCRIPTION' && refundStatus === 'PROCESSED') {
    const legacy = await prisma.payment.findFirst({ where: { razorpayPaymentId: source.providerPaymentId } });
    if (legacy) {
      const full = alreadyRefundedPaise + requestedPaise >= amountPaise;
      await prisma.payment.update({ where: { id: legacy.id }, data: { status: full ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } });
    }
  }

  return {
    id,
    providerRefundId: providerRefund.id,
    status: refundStatus,
    amountPaise: requestedPaise,
    currency: providerRefund.currency || source.currency || 'INR',
    processedAt,
  };
};
