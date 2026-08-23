import crypto, { randomUUID } from 'crypto';
import Razorpay from 'razorpay';
import { BillingCycle, Role, SubscriptionPlan } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../lib/prisma';

export const BILLING_PRICES = {
  patientPremiumMonthlyPaise: 14_900,
  doctorProfessionalMonthlyPaise: 79_900,
  launch99MonthlyPaise: 9_900,
  launch99Cycles: 3,
} as const;

export type BillingCycleName = 'MONTHLY' | 'ANNUAL';

export class BillingError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

export type PlanVersionRow = {
  id: string;
  internalPlanId: string;
  code: string;
  targetRole: string;
  billingCycle: BillingCycleName;
  amountPaise: number;
  currency: string;
  providerPlanId: string | null;
  priceVersion: number;
  isActive: boolean;
};

let razorpayClient: any | null = null;

export const getRazorpayClient = (): any => {
  const keyId = config.razorpay.keyId?.trim();
  const keySecret = config.razorpay.keySecret?.trim();
  if (!keyId || !keySecret) {
    throw new BillingError(
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      'Online payments are temporarily unavailable. Razorpay production credentials are not configured.',
      503,
    );
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpayClient;
};

export const getCheckoutKeyId = (): string => {
  const keyId = config.razorpay.keyId?.trim();
  if (!keyId) {
    throw new BillingError('PAYMENT_PROVIDER_NOT_CONFIGURED', 'Razorpay key is not configured.', 503);
  }
  return keyId;
};

export const verifyHmac = (message: string | Buffer, signature: string, secret: string): boolean => {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const verifySubscriptionCheckoutSignature = (
  paymentId: string,
  subscriptionId: string,
  signature: string,
): boolean => {
  const secret = config.razorpay.keySecret?.trim() || '';
  return verifyHmac(`${paymentId}|${subscriptionId}`, signature, secret);
};

export const verifyOrderCheckoutSignature = (
  orderId: string,
  paymentId: string,
  signature: string,
): boolean => {
  const secret = config.razorpay.keySecret?.trim() || '';
  return verifyHmac(`${orderId}|${paymentId}`, signature, secret);
};

export const canonicalAmountPaise = (
  plan: Pick<SubscriptionPlan, 'name' | 'targetRole' | 'monthlyPrice' | 'annualPrice'>,
  billingCycle: BillingCycleName,
): number => {
  if (billingCycle === 'MONTHLY' && plan.targetRole === 'PATIENT' && plan.name === 'premium') {
    return BILLING_PRICES.patientPremiumMonthlyPaise;
  }
  if (billingCycle === 'MONTHLY' && plan.targetRole === 'DOCTOR' && plan.name === 'professional') {
    return BILLING_PRICES.doctorProfessionalMonthlyPaise;
  }
  const rupees = billingCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
  return Math.max(0, Math.round(Number(rupees || 0) * 100));
};

export const syncCanonicalCatalog = async (): Promise<void> => {
  const patient = await prisma.subscriptionPlan.findFirst({
    where: { name: 'premium', targetRole: 'PATIENT' },
  });
  if (patient && (patient.monthlyPrice !== 149 || patient.annualPrice !== 0)) {
    await prisma.subscriptionPlan.update({
      where: { id: patient.id },
      data: {
        monthlyPrice: 149,
        annualPrice: 0,
        description: 'HealthConnect Premium patient membership',
      },
    });
  }

  const doctor = await prisma.subscriptionPlan.findFirst({
    where: { name: 'professional', targetRole: 'DOCTOR' },
  });
  if (doctor && (doctor.monthlyPrice !== 799 || doctor.annualPrice !== 0)) {
    await prisma.subscriptionPlan.update({
      where: { id: doctor.id },
      data: {
        monthlyPrice: 799,
        annualPrice: 0,
        description: 'HealthConnect Professional doctor membership',
      },
    });
  }
};

const getExistingPlanVersion = async (
  internalPlanId: string,
  billingCycle: BillingCycleName,
  amountPaise: number,
): Promise<PlanVersionRow | null> => {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      internal_plan_id AS "internalPlanId",
      code,
      target_role AS "targetRole",
      billing_cycle AS "billingCycle",
      amount_paise AS "amountPaise",
      currency,
      provider_plan_id AS "providerPlanId",
      price_version AS "priceVersion",
      is_active AS "isActive"
    FROM billing.plan_versions
    WHERE internal_plan_id = ${internalPlanId}
      AND billing_cycle = ${billingCycle}
      AND amount_paise = ${amountPaise}
    ORDER BY price_version DESC
    LIMIT 1
  `;
  return rows[0] || null;
};

const nextPriceVersion = async (internalPlanId: string, billingCycle: BillingCycleName): Promise<number> => {
  const rows = await prisma.$queryRaw<Array<{ maxVersion: number | null }>>`
    SELECT MAX(price_version)::int AS "maxVersion"
    FROM billing.plan_versions
    WHERE internal_plan_id = ${internalPlanId}
      AND billing_cycle = ${billingCycle}
  `;
  return Number(rows[0]?.maxVersion || 0) + 1;
};

const createProviderPlan = async (
  plan: SubscriptionPlan,
  billingCycle: BillingCycleName,
  amountPaise: number,
): Promise<string> => {
  const razorpay = getRazorpayClient();
  const providerPlan = await razorpay.plans.create({
    period: billingCycle === 'ANNUAL' ? 'yearly' : 'monthly',
    interval: 1,
    item: {
      name: `HealthConnect ${plan.displayName}`.slice(0, 80),
      amount: amountPaise,
      currency: 'INR',
      description: (plan.description || `${plan.displayName} membership`).slice(0, 200),
    },
  } as any);
  if (!providerPlan?.id) {
    throw new BillingError('PROVIDER_PLAN_CREATE_FAILED', 'Unable to create the payment plan.', 502);
  }
  return providerPlan.id as string;
};

export const ensureProviderPlanVersion = async (
  plan: SubscriptionPlan,
  billingCycle: BillingCycleName,
): Promise<PlanVersionRow> => {
  const amountPaise = canonicalAmountPaise(plan, billingCycle);
  if (amountPaise <= 0) {
    throw new BillingError('FREE_PLAN_NO_CHECKOUT', 'This plan does not require payment.', 400);
  }

  const existing = await getExistingPlanVersion(plan.id, billingCycle, amountPaise);
  if (existing?.providerPlanId) {
    if (!existing.isActive) {
      await prisma.$transaction(async tx => {
        await tx.$executeRaw`
          UPDATE billing.plan_versions
          SET is_active = false, updated_at = CURRENT_TIMESTAMP
          WHERE internal_plan_id = ${plan.id}
            AND billing_cycle = ${billingCycle}
            AND is_active = true
        `;
        await tx.$executeRaw`
          UPDATE billing.plan_versions
          SET is_active = true, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing.id}
        `;
      });
      existing.isActive = true;
    }
    return existing;
  }

  const providerPlanId = await createProviderPlan(plan, billingCycle, amountPaise);

  if (existing) {
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`
        UPDATE billing.plan_versions
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE internal_plan_id = ${plan.id}
          AND billing_cycle = ${billingCycle}
          AND is_active = true
      `;
      await tx.$executeRaw`
        UPDATE billing.plan_versions
        SET provider_plan_id = ${providerPlanId}, is_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing.id}
      `;
    });
    return { ...existing, providerPlanId, isActive: true };
  }

  const priceVersion = await nextPriceVersion(plan.id, billingCycle);
  const id = randomUUID();
  const code = `${plan.name}-v${priceVersion}-${billingCycle.toLowerCase()}`;

  await prisma.$transaction(async tx => {
    await tx.$executeRaw`
      UPDATE billing.plan_versions
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE internal_plan_id = ${plan.id}
        AND billing_cycle = ${billingCycle}
        AND is_active = true
    `;
    await tx.$executeRaw`
      INSERT INTO billing.plan_versions (
        id, internal_plan_id, code, target_role, billing_cycle,
        amount_paise, currency, provider_plan_id, price_version, is_active
      ) VALUES (
        ${id}, ${plan.id}, ${code}, ${plan.targetRole}, ${billingCycle},
        ${amountPaise}, 'INR', ${providerPlanId}, ${priceVersion}, true
      )
    `;
  });

  return {
    id,
    internalPlanId: plan.id,
    code,
    targetRole: plan.targetRole,
    billingCycle,
    amountPaise,
    currency: 'INR',
    providerPlanId,
    priceVersion,
    isActive: true,
  };
};

export const resolvePromotion = (
  plan: SubscriptionPlan,
  billingCycle: BillingCycleName,
  promotionCode?: string | null,
): null | {
  code: 'LAUNCH99';
  offerId: string;
  introductoryAmountPaise: number;
  introductoryCycles: number;
} => {
  if (!promotionCode?.trim()) return null;
  const normalized = promotionCode.trim().toUpperCase();
  if (normalized !== 'LAUNCH99') {
    throw new BillingError('INVALID_PROMOTION', 'The promotion code is invalid or expired.', 400);
  }
  if (plan.targetRole !== 'PATIENT' || plan.name !== 'premium' || billingCycle !== 'MONTHLY') {
    throw new BillingError('PROMOTION_NOT_APPLICABLE', 'LAUNCH99 applies only to the monthly Patient Premium membership.', 400);
  }
  const offerId = config.razorpay.launch99OfferId?.trim();
  if (!offerId) {
    throw new BillingError(
      'PROMOTION_NOT_CONFIGURED',
      'The launch offer is not active on the payment gateway yet. No charge has been created.',
      503,
    );
  }
  return {
    code: 'LAUNCH99',
    offerId,
    introductoryAmountPaise: BILLING_PRICES.launch99MonthlyPaise,
    introductoryCycles: BILLING_PRICES.launch99Cycles,
  };
};

export const toDateFromUnix = (value: unknown): Date | null => {
  const n = Number(value || 0);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000) : null;
};

export const addBillingPeriod = (date: Date, cycle: BillingCycleName): Date => {
  const next = new Date(date);
  if (cycle === 'ANNUAL') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

export const normalizeSubscriptionStatus = (providerStatus?: string | null) => {
  switch ((providerStatus || '').toLowerCase()) {
    case 'active':
    case 'authenticated':
      return 'ACTIVE' as const;
    case 'pending':
    case 'halted':
    case 'paused':
      return 'PAST_DUE' as const;
    case 'cancelled':
      return 'CANCELLED' as const;
    case 'completed':
    case 'expired':
      return 'EXPIRED' as const;
    default:
      return 'TRIALING' as const;
  }
};

export const upsertSubscriptionState = async (args: {
  userSubscriptionId: string;
  planVersionId?: string | null;
  providerSubscriptionId?: string | null;
  providerStatus?: string | null;
  promotionCode?: string | null;
  providerOfferId?: string | null;
  baseAmountPaise?: number;
  introductoryAmountPaise?: number | null;
  introductoryCycles?: number;
  paidCount?: number;
  totalCount?: number | null;
  cancelAtCycleEnd?: boolean;
  cancelRequestedAt?: Date | null;
  nextChargeAt?: Date | null;
  lastEventAt?: Date | null;
}) => {
  await prisma.$executeRaw`
    INSERT INTO billing.subscription_states (
      user_subscription_id, plan_version_id, provider_subscription_id, provider_status,
      promotion_code, provider_offer_id, base_amount_paise, introductory_amount_paise,
      introductory_cycles, paid_count, total_count, cancel_at_cycle_end,
      cancel_requested_at, next_charge_at, last_event_at, updated_at
    ) VALUES (
      ${args.userSubscriptionId}, ${args.planVersionId || null}, ${args.providerSubscriptionId || null}, ${args.providerStatus || null},
      ${args.promotionCode || null}, ${args.providerOfferId || null}, ${args.baseAmountPaise || 0}, ${args.introductoryAmountPaise ?? null},
      ${args.introductoryCycles || 0}, ${args.paidCount || 0}, ${args.totalCount ?? null}, ${args.cancelAtCycleEnd || false},
      ${args.cancelRequestedAt ?? null}, ${args.nextChargeAt ?? null}, ${args.lastEventAt ?? null}, CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_subscription_id) DO UPDATE SET
      plan_version_id = COALESCE(EXCLUDED.plan_version_id, billing.subscription_states.plan_version_id),
      provider_subscription_id = COALESCE(EXCLUDED.provider_subscription_id, billing.subscription_states.provider_subscription_id),
      provider_status = COALESCE(EXCLUDED.provider_status, billing.subscription_states.provider_status),
      promotion_code = COALESCE(EXCLUDED.promotion_code, billing.subscription_states.promotion_code),
      provider_offer_id = COALESCE(EXCLUDED.provider_offer_id, billing.subscription_states.provider_offer_id),
      base_amount_paise = CASE WHEN EXCLUDED.base_amount_paise > 0 THEN EXCLUDED.base_amount_paise ELSE billing.subscription_states.base_amount_paise END,
      introductory_amount_paise = COALESCE(EXCLUDED.introductory_amount_paise, billing.subscription_states.introductory_amount_paise),
      introductory_cycles = GREATEST(EXCLUDED.introductory_cycles, billing.subscription_states.introductory_cycles),
      paid_count = GREATEST(EXCLUDED.paid_count, billing.subscription_states.paid_count),
      total_count = COALESCE(EXCLUDED.total_count, billing.subscription_states.total_count),
      cancel_at_cycle_end = EXCLUDED.cancel_at_cycle_end,
      cancel_requested_at = COALESCE(EXCLUDED.cancel_requested_at, billing.subscription_states.cancel_requested_at),
      next_charge_at = COALESCE(EXCLUDED.next_charge_at, billing.subscription_states.next_charge_at),
      last_event_at = COALESCE(EXCLUDED.last_event_at, billing.subscription_states.last_event_at),
      updated_at = CURRENT_TIMESTAMP
  `;
};

export const recordSubscriptionCharge = async (args: {
  userSubscriptionId: string;
  payerUserId: string;
  amountPaise: number;
  currency?: string;
  status: string;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  providerInvoiceId?: string | null;
  signature?: string | null;
  method?: string | null;
  failureReason?: string | null;
  paidAt?: Date | null;
}) => {
  const providerPaymentId = args.providerPaymentId || null;
  let rowId: string | null = null;

  if (providerPaymentId) {
    const found = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM billing.subscription_charges
      WHERE provider_payment_id = ${providerPaymentId}
      LIMIT 1
    `;
    rowId = found[0]?.id || null;
  }

  if (!rowId) rowId = randomUUID();

  await prisma.$executeRaw`
    INSERT INTO billing.subscription_charges (
      id, user_subscription_id, payer_user_id, amount_paise, currency, status,
      provider_payment_id, provider_order_id, provider_invoice_id, signature,
      method, failure_reason, paid_at, updated_at
    ) VALUES (
      ${rowId}, ${args.userSubscriptionId}, ${args.payerUserId}, ${Math.max(0, args.amountPaise)}, ${args.currency || 'INR'}, ${args.status},
      ${providerPaymentId}, ${args.providerOrderId || null}, ${args.providerInvoiceId || null}, ${args.signature || null},
      ${args.method || null}, ${args.failureReason || null}, ${args.paidAt || null}, CURRENT_TIMESTAMP
    )
    ON CONFLICT (provider_payment_id) DO UPDATE SET
      status = EXCLUDED.status,
      provider_order_id = COALESCE(EXCLUDED.provider_order_id, billing.subscription_charges.provider_order_id),
      provider_invoice_id = COALESCE(EXCLUDED.provider_invoice_id, billing.subscription_charges.provider_invoice_id),
      signature = COALESCE(EXCLUDED.signature, billing.subscription_charges.signature),
      method = COALESCE(EXCLUDED.method, billing.subscription_charges.method),
      failure_reason = EXCLUDED.failure_reason,
      paid_at = COALESCE(EXCLUDED.paid_at, billing.subscription_charges.paid_at),
      amount_paise = EXCLUDED.amount_paise,
      currency = EXCLUDED.currency,
      updated_at = CURRENT_TIMESTAMP
  `;

  // Keep the original public payments relation populated for backward-compatible
  // screens, while the billing schema remains the financial source of truth.
  if (providerPaymentId) {
    const legacy = await prisma.payment.findFirst({ where: { razorpayPaymentId: providerPaymentId } });
    const legacyData = {
      amount: Math.max(0, args.amountPaise) / 100,
      currency: args.currency || 'INR',
      status: args.status,
      razorpayPaymentId: providerPaymentId,
      razorpayOrderId: args.providerOrderId || null,
      razorpaySignature: args.signature || null,
      paidAt: args.paidAt || null,
    };
    if (legacy) {
      await prisma.payment.update({ where: { id: legacy.id }, data: legacyData });
    } else {
      await prisma.payment.create({
        data: {
          subscriptionId: args.userSubscriptionId,
          ...legacyData,
        },
      });
    }
  }

  return rowId;
};

export const getSubscriptionState = async (userSubscriptionId: string) => {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      ss.user_subscription_id AS "userSubscriptionId",
      ss.plan_version_id AS "planVersionId",
      ss.provider_subscription_id AS "providerSubscriptionId",
      ss.provider_status AS "providerStatus",
      ss.promotion_code AS "promotionCode",
      ss.base_amount_paise AS "baseAmountPaise",
      ss.introductory_amount_paise AS "introductoryAmountPaise",
      ss.introductory_cycles AS "introductoryCycles",
      ss.paid_count AS "paidCount",
      ss.total_count AS "totalCount",
      ss.cancel_at_cycle_end AS "cancelAtCycleEnd",
      ss.cancel_requested_at AS "cancelRequestedAt",
      ss.next_charge_at AS "nextChargeAt",
      pv.code AS "planVersionCode",
      pv.amount_paise AS "planAmountPaise",
      pv.provider_plan_id AS "providerPlanId"
    FROM billing.subscription_states ss
    LEFT JOIN billing.plan_versions pv ON pv.id = ss.plan_version_id
    WHERE ss.user_subscription_id = ${userSubscriptionId}
    LIMIT 1
  `;
  return rows[0] || null;
};

export const isRoleEligibleForPlan = (role: string, plan: SubscriptionPlan): boolean => {
  return role === plan.targetRole || role === 'ADMIN';
};

export const coerceBillingCycle = (value: unknown): BillingCycleName => {
  const cycle = String(value || 'MONTHLY').toUpperCase();
  if (cycle !== 'MONTHLY' && cycle !== 'ANNUAL') {
    throw new BillingError('INVALID_BILLING_CYCLE', 'Billing cycle must be MONTHLY or ANNUAL.', 422);
  }
  return cycle;
};

export const prismaBillingCycle = (cycle: BillingCycleName): BillingCycle => cycle as BillingCycle;
export const prismaRole = (role: string): Role => role as Role;
