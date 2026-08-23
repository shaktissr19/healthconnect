import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import {
  BILLING_PRICES,
  BillingError,
  BillingCycleName,
  addBillingPeriod,
  canonicalAmountPaise,
  coerceBillingCycle,
  ensureProviderPlanVersion,
  getCheckoutKeyId,
  getRazorpayClient,
  getSubscriptionState,
  isRoleEligibleForPlan,
  normalizeSubscriptionStatus,
  prismaBillingCycle,
  recordSubscriptionCharge,
  resolvePromotion,
  syncCanonicalCatalog,
  toDateFromUnix,
  upsertSubscriptionState,
  verifySubscriptionCheckoutSignature,
} from './razorpayBilling.service';

const getPlan = async (planIdOrName: string) => {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      isActive: true,
      OR: [{ id: planIdOrName }, { name: planIdOrName }],
    },
  });
  if (!plan) throw new BillingError('PLAN_NOT_FOUND', 'Subscription plan not found.', 404);
  return plan;
};

export const getPublishedPlans = async () => {
  await syncCanonicalCatalog();
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: [{ targetRole: 'asc' }, { sortOrder: 'asc' }],
  });

  return plans.map(plan => {
    const monthlyPaise = canonicalAmountPaise(plan, 'MONTHLY');
    const annualPaise = canonicalAmountPaise(plan, 'ANNUAL');
    const isLaunchPlan = plan.targetRole === 'PATIENT' && plan.name === 'premium';
    return {
      ...plan,
      monthlyPrice: monthlyPaise / 100,
      annualPrice: annualPaise / 100,
      pricing: {
        monthlyPaise,
        annualPaise,
        currency: 'INR',
      },
      introOffer: isLaunchPlan
        ? {
            code: 'LAUNCH99',
            amountPaise: BILLING_PRICES.launch99MonthlyPaise,
            cycles: BILLING_PRICES.launch99Cycles,
            available: Boolean(config.razorpay.launch99OfferId?.trim()),
            description: '₹99/month for the first 3 billing cycles, then ₹149/month.',
          }
        : null,
    };
  });
};

export const getCurrentSubscriptionForUser = async (userId: string) => {
  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) return null;
  const state = await getSubscriptionState(subscription.id);
  return {
    ...subscription,
    state,
    amountPaise:
      Number(state?.planAmountPaise || state?.baseAmountPaise || 0) ||
      canonicalAmountPaise(subscription.plan, subscription.billingCycle as BillingCycleName),
  };
};

export const getSubscriptionHistoryForUser = async (userId: string) => {
  const subscriptions = await prisma.userSubscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  const charges = await prisma.$queryRaw<any[]>`
    SELECT
      sc.id,
      sc.user_subscription_id AS "subscriptionId",
      sc.amount_paise AS "amountPaise",
      sc.currency,
      sc.status,
      sc.provider_payment_id AS "providerPaymentId",
      sc.provider_order_id AS "providerOrderId",
      sc.provider_invoice_id AS "providerInvoiceId",
      sc.method,
      sc.failure_reason AS "failureReason",
      sc.paid_at AS "paidAt",
      sc.created_at AS "createdAt",
      sp."displayName" AS "planName"
    FROM billing.subscription_charges sc
    JOIN public.user_subscriptions us ON us.id = sc.user_subscription_id
    JOIN public.subscription_plans sp ON sp.id = us."planId"
    WHERE sc.payer_user_id = ${userId}
    ORDER BY sc.created_at DESC
    LIMIT 100
  `;

  const invoices = await prisma.$queryRaw<any[]>`
    SELECT
      i.id,
      i.user_subscription_id AS "subscriptionId",
      i.provider_invoice_id AS "providerInvoiceId",
      i.provider_payment_id AS "providerPaymentId",
      i.amount_paise AS "amountPaise",
      i.currency,
      i.status,
      i.invoice_number AS "invoiceNumber",
      i.short_url AS "shortUrl",
      i.issued_at AS "issuedAt",
      i.paid_at AS "paidAt"
    FROM billing.invoices i
    JOIN public.user_subscriptions us ON us.id = i.user_subscription_id
    WHERE us."userId" = ${userId}
    ORDER BY i.created_at DESC
    LIMIT 100
  `;

  // Existing demo/legacy charges predate the billing ledger. Include them only
  // when they are not already represented by a provider payment in the ledger.
  const legacyPayments = await prisma.payment.findMany({
    where: { subscription: { userId } },
    include: { subscription: { include: { plan: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const providerIds = new Set(charges.map(c => c.providerPaymentId).filter(Boolean));
  const legacy = legacyPayments
    .filter(p => !p.razorpayPaymentId || !providerIds.has(p.razorpayPaymentId))
    .map(p => ({
      id: p.id,
      subscriptionId: p.subscriptionId,
      amountPaise: Math.round(Number(p.amount || 0) * 100),
      currency: p.currency,
      status: p.status,
      providerPaymentId: p.razorpayPaymentId,
      providerOrderId: p.razorpayOrderId,
      providerInvoiceId: null,
      method: null,
      failureReason: null,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      planName: p.subscription.plan.displayName,
      legacy: true,
    }));

  return { subscriptions, charges: [...charges, ...legacy], invoices };
};

export const createSubscriptionCheckout = async (args: {
  userId: string;
  role: string;
  planIdOrName: string;
  billingCycle?: unknown;
  promotionCode?: string | null;
}) => {
  await syncCanonicalCatalog();
  const billingCycle = coerceBillingCycle(args.billingCycle);
  const plan = await getPlan(args.planIdOrName);

  if (!isRoleEligibleForPlan(args.role, plan)) {
    throw new BillingError('PLAN_ROLE_MISMATCH', 'This subscription plan is not available for your account type.', 403);
  }

  const amountPaise = canonicalAmountPaise(plan, billingCycle);
  if (amountPaise <= 0) {
    throw new BillingError('FREE_PLAN_NO_CHECKOUT', 'This plan does not require online payment.', 400);
  }

  const existingProviderSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId: args.userId,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      razorpaySubId: { not: null },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  if (existingProviderSubscription) {
    throw new BillingError(
      'ACTIVE_SUBSCRIPTION_EXISTS',
      `You already have an active ${existingProviderSubscription.plan.displayName} membership.`,
      409,
    );
  }

  const planVersion = await ensureProviderPlanVersion(plan, billingCycle);
  if (!planVersion.providerPlanId) {
    throw new BillingError('PROVIDER_PLAN_UNAVAILABLE', 'The payment plan is not ready.', 503);
  }

  const promotion = resolvePromotion(plan, billingCycle, args.promotionCode);
  const razorpay = getRazorpayClient();
  const totalCount = billingCycle === 'ANNUAL' ? 10 : 120;

  const providerSubscription = await razorpay.subscriptions.create({
    plan_id: planVersion.providerPlanId,
    total_count: totalCount,
    quantity: 1,
    customer_notify: true,
    ...(promotion ? { offer_id: promotion.offerId } : {}),
    notes: {
      hc_user_id: args.userId,
      hc_internal_plan_id: plan.id,
      hc_plan_version: planVersion.code,
      hc_promotion: promotion?.code || '',
    },
  } as any);

  if (!providerSubscription?.id) {
    throw new BillingError('SUBSCRIPTION_CREATE_FAILED', 'Unable to create the subscription with Razorpay.', 502);
  }

  const now = new Date();
  const endDate = toDateFromUnix(providerSubscription.current_end) || addBillingPeriod(now, billingCycle);
  const local = await prisma.userSubscription.create({
    data: {
      userId: args.userId,
      planId: plan.id,
      status: 'TRIALING',
      billingCycle: prismaBillingCycle(billingCycle),
      startDate: now,
      endDate,
      razorpaySubId: providerSubscription.id,
      autoRenew: true,
    },
    include: { plan: true },
  });

  await upsertSubscriptionState({
    userSubscriptionId: local.id,
    planVersionId: planVersion.id,
    providerSubscriptionId: providerSubscription.id,
    providerStatus: providerSubscription.status || 'created',
    promotionCode: promotion?.code || null,
    providerOfferId: promotion?.offerId || null,
    baseAmountPaise: planVersion.amountPaise,
    introductoryAmountPaise: promotion?.introductoryAmountPaise || null,
    introductoryCycles: promotion?.introductoryCycles || 0,
    paidCount: Number(providerSubscription.paid_count || 0),
    totalCount,
    nextChargeAt: toDateFromUnix(providerSubscription.charge_at),
  });

  return {
    keyId: getCheckoutKeyId(),
    subscriptionId: providerSubscription.id,
    localSubscriptionId: local.id,
    plan: {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      billingCycle,
      amountPaise: planVersion.amountPaise,
      currency: 'INR',
    },
    promotion: promotion
      ? {
          code: promotion.code,
          introductoryAmountPaise: promotion.introductoryAmountPaise,
          introductoryCycles: promotion.introductoryCycles,
        }
      : null,
    shortUrl: providerSubscription.short_url || null,
  };
};

export const verifySubscriptionCheckout = async (args: {
  userId: string;
  paymentId: string;
  subscriptionId: string;
  signature: string;
}) => {
  if (!args.paymentId || !args.subscriptionId || !args.signature) {
    throw new BillingError('MISSING_PAYMENT_FIELDS', 'Payment verification details are incomplete.', 422);
  }
  if (!verifySubscriptionCheckoutSignature(args.paymentId, args.subscriptionId, args.signature)) {
    throw new BillingError('INVALID_PAYMENT_SIGNATURE', 'Payment signature verification failed.', 400);
  }

  const local = await prisma.userSubscription.findFirst({
    where: { userId: args.userId, razorpaySubId: args.subscriptionId },
    include: { plan: true },
  });
  if (!local) {
    throw new BillingError('SUBSCRIPTION_NOT_FOUND', 'The subscription does not belong to this account.', 404);
  }

  const razorpay = getRazorpayClient();
  const [providerSubscription, providerPayment] = await Promise.all([
    razorpay.subscriptions.fetch(args.subscriptionId),
    razorpay.payments.fetch(args.paymentId),
  ]);

  if (!providerSubscription?.id || providerSubscription.id !== args.subscriptionId) {
    throw new BillingError('PROVIDER_SUBSCRIPTION_MISMATCH', 'Razorpay subscription verification failed.', 400);
  }
  if (!providerPayment?.id || providerPayment.id !== args.paymentId) {
    throw new BillingError('PROVIDER_PAYMENT_MISMATCH', 'Razorpay payment verification failed.', 400);
  }

  const localStatus = normalizeSubscriptionStatus(providerSubscription.status);
  const startDate =
    toDateFromUnix(providerSubscription.current_start) ||
    toDateFromUnix(providerSubscription.start_at) ||
    local.startDate;
  const endDate =
    toDateFromUnix(providerSubscription.current_end) ||
    addBillingPeriod(startDate, local.billingCycle as BillingCycleName);

  await prisma.userSubscription.update({
    where: { id: local.id },
    data: {
      status: localStatus,
      startDate,
      endDate,
      autoRenew: localStatus !== 'CANCELLED' && localStatus !== 'EXPIRED',
    },
  });

  const state = await getSubscriptionState(local.id);
  await upsertSubscriptionState({
    userSubscriptionId: local.id,
    planVersionId: state?.planVersionId || null,
    providerSubscriptionId: providerSubscription.id,
    providerStatus: providerSubscription.status,
    promotionCode: state?.promotionCode || null,
    baseAmountPaise: Number(state?.baseAmountPaise || canonicalAmountPaise(local.plan, local.billingCycle as BillingCycleName)),
    introductoryAmountPaise: state?.introductoryAmountPaise || null,
    introductoryCycles: Number(state?.introductoryCycles || 0),
    paidCount: Number(providerSubscription.paid_count || 0),
    totalCount: Number(providerSubscription.total_count || 0) || null,
    nextChargeAt: toDateFromUnix(providerSubscription.charge_at),
    lastEventAt: new Date(),
  });

  const amountPaise = Number(providerPayment.amount || 0);
  await recordSubscriptionCharge({
    userSubscriptionId: local.id,
    payerUserId: args.userId,
    amountPaise,
    currency: providerPayment.currency || 'INR',
    status: String(providerPayment.status || 'AUTHORIZED').toUpperCase(),
    providerPaymentId: providerPayment.id,
    providerOrderId: providerPayment.order_id || null,
    providerInvoiceId: providerPayment.invoice_id || null,
    signature: args.signature,
    method: providerPayment.method || null,
    failureReason: providerPayment.error_description || null,
    paidAt: providerPayment.status === 'captured'
      ? toDateFromUnix(providerPayment.created_at) || new Date()
      : null,
  });

  if (localStatus === 'ACTIVE') {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: args.userId,
        type: 'SYSTEM',
        title: 'Membership activated',
        data: { path: ['subscriptionId'], equals: local.id },
      },
    }).catch(() => null);
    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: args.userId,
          type: 'SYSTEM',
          title: 'Membership activated',
          body: `${local.plan.displayName} is active. Thank you for subscribing to HealthConnect India.`,
          data: { subscriptionId: local.id, providerSubscriptionId: providerSubscription.id },
        },
      });
    }
  }

  return getCurrentSubscriptionForUser(args.userId);
};

export const cancelUserSubscription = async (args: {
  userId: string;
  atCycleEnd?: boolean;
}) => {
  const current = await prisma.userSubscription.findFirst({
    where: {
      userId: args.userId,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!current) throw new BillingError('NO_ACTIVE_SUBSCRIPTION', 'No active subscription was found.', 404);

  const atCycleEnd = args.atCycleEnd !== false;
  if (current.razorpaySubId) {
    const razorpay = getRazorpayClient();
    await razorpay.subscriptions.cancel(current.razorpaySubId, {
      cancel_at_cycle_end: atCycleEnd ? 1 : 0,
    } as any);
  }

  await prisma.userSubscription.update({
    where: { id: current.id },
    data: atCycleEnd
      ? { autoRenew: false }
      : { autoRenew: false, status: 'CANCELLED', cancelledAt: new Date(), endDate: new Date() },
  });

  const state = await getSubscriptionState(current.id);
  await upsertSubscriptionState({
    userSubscriptionId: current.id,
    planVersionId: state?.planVersionId || null,
    providerSubscriptionId: current.razorpaySubId,
    providerStatus: atCycleEnd ? state?.providerStatus || 'active' : 'cancelled',
    baseAmountPaise: Number(state?.baseAmountPaise || canonicalAmountPaise(current.plan, current.billingCycle as BillingCycleName)),
    cancelAtCycleEnd: atCycleEnd,
    cancelRequestedAt: new Date(),
    nextChargeAt: state?.nextChargeAt || null,
  });

  return {
    subscriptionId: current.id,
    cancelAtCycleEnd: atCycleEnd,
    accessUntil: atCycleEnd ? current.endDate : new Date(),
    message: atCycleEnd
      ? `Auto-renewal is off. Your ${current.plan.displayName} access remains active until the end of the current billing cycle.`
      : 'Subscription cancelled immediately.',
  };
};

export const changeUserPlan = async (args: {
  userId: string;
  role: string;
  planIdOrName: string;
  billingCycle?: unknown;
  promotionCode?: string | null;
}) => {
  const plan = await getPlan(args.planIdOrName);
  const cycle = coerceBillingCycle(args.billingCycle);
  const amount = canonicalAmountPaise(plan, cycle);

  if (amount <= 0) {
    const current = await getCurrentSubscriptionForUser(args.userId);
    if (!current) return { scheduled: false, message: 'Your account is already on the free tier.' };
    return cancelUserSubscription({ userId: args.userId, atCycleEnd: true });
  }

  return createSubscriptionCheckout({
    userId: args.userId,
    role: args.role,
    planIdOrName: args.planIdOrName,
    billingCycle: cycle,
    promotionCode: args.promotionCode,
  });
};

export const createSubscriptionInvoiceRecord = async (args: {
  userSubscriptionId: string | null;
  providerInvoiceId: string;
  providerSubscriptionId?: string | null;
  providerPaymentId?: string | null;
  amountPaise?: number;
  currency?: string;
  status?: string;
  invoiceNumber?: string | null;
  shortUrl?: string | null;
  issuedAt?: Date | null;
  paidAt?: Date | null;
}) => {
  if (!args.providerInvoiceId) return;
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO billing.invoices (
      id, user_subscription_id, provider_invoice_id, provider_subscription_id,
      provider_payment_id, amount_paise, currency, status, invoice_number,
      short_url, issued_at, paid_at, updated_at
    ) VALUES (
      ${id}, ${args.userSubscriptionId}, ${args.providerInvoiceId}, ${args.providerSubscriptionId || null},
      ${args.providerPaymentId || null}, ${Math.max(0, args.amountPaise || 0)}, ${args.currency || 'INR'}, ${args.status || 'ISSUED'}, ${args.invoiceNumber || null},
      ${args.shortUrl || null}, ${args.issuedAt || null}, ${args.paidAt || null}, CURRENT_TIMESTAMP
    )
    ON CONFLICT (provider_invoice_id) DO UPDATE SET
      user_subscription_id = COALESCE(EXCLUDED.user_subscription_id, billing.invoices.user_subscription_id),
      provider_subscription_id = COALESCE(EXCLUDED.provider_subscription_id, billing.invoices.provider_subscription_id),
      provider_payment_id = COALESCE(EXCLUDED.provider_payment_id, billing.invoices.provider_payment_id),
      amount_paise = EXCLUDED.amount_paise,
      currency = EXCLUDED.currency,
      status = EXCLUDED.status,
      invoice_number = COALESCE(EXCLUDED.invoice_number, billing.invoices.invoice_number),
      short_url = COALESCE(EXCLUDED.short_url, billing.invoices.short_url),
      issued_at = COALESCE(EXCLUDED.issued_at, billing.invoices.issued_at),
      paid_at = COALESCE(EXCLUDED.paid_at, billing.invoices.paid_at),
      updated_at = CURRENT_TIMESTAMP
  `;
};
