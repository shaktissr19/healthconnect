import { prisma } from '../lib/prisma';
import {
  BillingError,
  addBillingPeriod,
  canonicalAmountPaise,
  coerceBillingCycle,
  getCheckoutKeyId,
  getRazorpayClient,
  getSubscriptionState,
  normalizeSubscriptionStatus,
  toDateFromUnix,
  upsertSubscriptionState,
} from './razorpayBilling.service';
import {
  createSubscriptionCheckout,
  getPublishedPlans,
  verifySubscriptionCheckout,
} from './subscriptionBilling.service';

type CheckoutArgs = {
  userId: string;
  role: string;
  planIdOrName: string;
  billingCycle?: unknown;
  promotionCode?: string | null;
};

const normalizedPromotion = (value?: string | null) => value?.trim().toUpperCase() || null;

export const hasRedeemedLaunch99 = async (userId: string): Promise<boolean> => {
  const rows = await prisma.$queryRaw<Array<{ redeemed: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM billing.subscription_states ss
      JOIN public.user_subscriptions us ON us.id = ss.user_subscription_id
      JOIN billing.subscription_charges sc ON sc.user_subscription_id = us.id
      WHERE us."userId" = ${userId}
        AND ss.promotion_code = 'LAUNCH99'
        AND sc.status = 'CAPTURED'
    ) AS redeemed
  `;
  return Boolean(rows[0]?.redeemed);
};

export const getPublishedPlansForUser = async (userId?: string | null) => {
  const plans = await getPublishedPlans();
  if (!userId) return plans;

  const launch99Redeemed = await hasRedeemedLaunch99(userId);
  if (!launch99Redeemed) return plans;

  return plans.map((plan: any) => {
    if (!plan?.introOffer || String(plan.introOffer.code).toUpperCase() !== 'LAUNCH99') return plan;
    return {
      ...plan,
      introOffer: {
        ...plan.introOffer,
        available: false,
        reason: 'Launch offer already used on this account.',
      },
    };
  });
};

const getRequestedPlan = async (planIdOrName: string) => {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      isActive: true,
      OR: [{ id: planIdOrName }, { name: planIdOrName }],
    },
  });
  if (!plan) throw new BillingError('PLAN_NOT_FOUND', 'Subscription plan not found.', 404);
  return plan;
};

const cancelUnfinishedProviderSubscription = async (subscriptionId: string) => {
  const razorpay = getRazorpayClient();
  try {
    await razorpay.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 0 } as any);
  } catch (error: any) {
    const statusCode = Number(error?.statusCode || error?.status || 0);
    // A provider-side 400/404 commonly means the subscription is already in a
    // terminal state. In that case local cleanup can safely proceed.
    if (![400, 404].includes(statusCode)) throw error;
  }
};

const resolveExistingProviderSubscription = async (args: CheckoutArgs) => {
  const requestedPlan = await getRequestedPlan(args.planIdOrName);
  const billingCycle = coerceBillingCycle(args.billingCycle);
  const requestedPromotion = normalizedPromotion(args.promotionCode);

  const existing = await prisma.userSubscription.findFirst({
    where: {
      userId: args.userId,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      razorpaySubId: { not: null },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!existing) return null;

  if (existing.status === 'ACTIVE' || existing.status === 'PAST_DUE') {
    throw new BillingError(
      'ACTIVE_SUBSCRIPTION_EXISTS',
      `You already have an active ${existing.plan.displayName} membership.`,
      409,
    );
  }

  if (!existing.razorpaySubId) {
    await prisma.userSubscription.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED', autoRenew: false, cancelledAt: new Date(), endDate: new Date() },
    });
    return null;
  }

  const razorpay = getRazorpayClient();
  const provider = await razorpay.subscriptions.fetch(existing.razorpaySubId);
  const providerStatus = String(provider?.status || 'created').toLowerCase();
  const normalizedStatus = normalizeSubscriptionStatus(providerStatus);

  if (providerStatus === 'created' && Number(provider?.paid_count || 0) === 0) {
    const state = await getSubscriptionState(existing.id);
    const statePromotion = normalizedPromotion(state?.promotionCode);
    const sameCheckout =
      existing.planId === requestedPlan.id &&
      String(existing.billingCycle) === billingCycle &&
      statePromotion === requestedPromotion;

    if (sameCheckout) {
      return {
        keyId: getCheckoutKeyId(),
        subscriptionId: existing.razorpaySubId,
        localSubscriptionId: existing.id,
        plan: {
          id: requestedPlan.id,
          name: requestedPlan.name,
          displayName: requestedPlan.displayName,
          billingCycle,
          amountPaise: Number(state?.baseAmountPaise || canonicalAmountPaise(requestedPlan, billingCycle)),
          currency: 'INR',
        },
        promotion: statePromotion === 'LAUNCH99'
          ? {
              code: 'LAUNCH99',
              introductoryAmountPaise: Number(state?.introductoryAmountPaise || 9_900),
              introductoryCycles: Number(state?.introductoryCycles || 3),
            }
          : null,
        shortUrl: provider?.short_url || null,
        reused: true,
      };
    }

    await cancelUnfinishedProviderSubscription(existing.razorpaySubId);
    await prisma.userSubscription.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED', autoRenew: false, cancelledAt: new Date(), endDate: new Date() },
    });
    await upsertSubscriptionState({
      userSubscriptionId: existing.id,
      providerSubscriptionId: existing.razorpaySubId,
      providerStatus: 'cancelled',
      baseAmountPaise: Number(state?.baseAmountPaise || canonicalAmountPaise(existing.plan, existing.billingCycle as any)),
      cancelAtCycleEnd: false,
      cancelRequestedAt: new Date(),
      lastEventAt: new Date(),
    });
    return null;
  }

  if (providerStatus === 'authenticated' || providerStatus === 'active') {
    const startDate = toDateFromUnix(provider?.current_start) || toDateFromUnix(provider?.start_at) || existing.startDate;
    const endDate = toDateFromUnix(provider?.current_end) || addBillingPeriod(startDate, existing.billingCycle as any);
    await prisma.userSubscription.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE', startDate, endDate, autoRenew: true },
    });
    throw new BillingError(
      'ACTIVE_SUBSCRIPTION_EXISTS',
      `You already have an active ${existing.plan.displayName} membership.`,
      409,
    );
  }

  if (['pending', 'halted', 'paused'].includes(providerStatus)) {
    await prisma.userSubscription.update({ where: { id: existing.id }, data: { status: 'PAST_DUE' } });
    throw new BillingError(
      'SUBSCRIPTION_PAYMENT_PENDING',
      'Your existing membership payment requires attention before another subscription can be created.',
      409,
    );
  }

  if (['cancelled', 'completed', 'expired'].includes(providerStatus) || ['CANCELLED', 'EXPIRED'].includes(normalizedStatus)) {
    await prisma.userSubscription.update({
      where: { id: existing.id },
      data: {
        status: normalizedStatus === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED',
        autoRenew: false,
        cancelledAt: normalizedStatus === 'CANCELLED' ? new Date() : existing.cancelledAt,
      },
    });
    return null;
  }

  throw new BillingError(
    'SUBSCRIPTION_STATE_UNAVAILABLE',
    'Your current membership is still being synchronized with Razorpay. Please retry shortly.',
    409,
  );
};

export const prepareSubscriptionCheckout = async (args: CheckoutArgs) => {
  const requestedPromotion = normalizedPromotion(args.promotionCode);
  if (requestedPromotion === 'LAUNCH99' && await hasRedeemedLaunch99(args.userId)) {
    throw new BillingError('PROMOTION_ALREADY_USED', 'The LAUNCH99 introductory offer has already been used on this account.', 409);
  }

  const reusable = await resolveExistingProviderSubscription(args);
  if (reusable) return reusable;

  return createSubscriptionCheckout(args);
};

export const verifySubscriptionCheckoutGuarded = async (args: {
  userId: string;
  paymentId: string;
  subscriptionId: string;
  signature: string;
}) => {
  const razorpay = getRazorpayClient();
  const providerPayment = await razorpay.payments.fetch(args.paymentId);
  const providerSubscriptionId = String((providerPayment as any)?.subscription_id || '');
  if (providerSubscriptionId && providerSubscriptionId !== args.subscriptionId) {
    throw new BillingError('PROVIDER_PAYMENT_MISMATCH', 'Razorpay payment does not belong to this subscription.', 400);
  }
  return verifySubscriptionCheckout(args);
};
