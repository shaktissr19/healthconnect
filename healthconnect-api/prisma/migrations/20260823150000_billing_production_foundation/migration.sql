-- HealthConnect India — production billing foundation
-- Additive/data-preserving. Supplemental provider-specific billing data is kept
-- in a dedicated PostgreSQL schema so the existing Prisma public schema and
-- frozen clinical modules remain unchanged.

CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE IF NOT EXISTS billing.plan_versions (
  id TEXT PRIMARY KEY,
  internal_plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  target_role TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  provider_plan_id TEXT UNIQUE,
  price_version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (internal_plan_id, billing_cycle, price_version)
);

CREATE UNIQUE INDEX IF NOT EXISTS plan_versions_one_active_idx
  ON billing.plan_versions(internal_plan_id, billing_cycle)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS billing.subscription_states (
  user_subscription_id TEXT PRIMARY KEY REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  plan_version_id TEXT REFERENCES billing.plan_versions(id) ON DELETE SET NULL,
  provider_subscription_id TEXT UNIQUE,
  provider_status TEXT,
  promotion_code TEXT,
  provider_offer_id TEXT,
  base_amount_paise INTEGER NOT NULL DEFAULT 0,
  introductory_amount_paise INTEGER,
  introductory_cycles INTEGER NOT NULL DEFAULT 0,
  paid_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER,
  cancel_at_cycle_end BOOLEAN NOT NULL DEFAULT false,
  cancel_requested_at TIMESTAMP(3),
  next_charge_at TIMESTAMP(3),
  last_event_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS subscription_states_provider_status_idx
  ON billing.subscription_states(provider_status);

CREATE TABLE IF NOT EXISTS billing.subscription_charges (
  id TEXT PRIMARY KEY,
  user_subscription_id TEXT NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  payer_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  provider_payment_id TEXT UNIQUE,
  provider_order_id TEXT,
  provider_invoice_id TEXT,
  signature TEXT,
  method TEXT,
  failure_reason TEXT,
  paid_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS subscription_charges_subscription_idx
  ON billing.subscription_charges(user_subscription_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_charges_payer_idx
  ON billing.subscription_charges(payer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_charges_status_idx
  ON billing.subscription_charges(status);

CREATE TABLE IF NOT EXISTS billing.appointment_payments (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  payer_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'CREATED',
  provider_order_id TEXT NOT NULL UNIQUE,
  provider_payment_id TEXT UNIQUE,
  signature TEXT,
  receipt TEXT NOT NULL UNIQUE,
  method TEXT,
  failure_reason TEXT,
  paid_at TIMESTAMP(3),
  captured_at TIMESTAMP(3),
  amount_refunded_paise INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS appointment_payments_appointment_idx
  ON billing.appointment_payments(appointment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS appointment_payments_payer_idx
  ON billing.appointment_payments(payer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS appointment_payments_status_idx
  ON billing.appointment_payments(status);

CREATE TABLE IF NOT EXISTS billing.refunds (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('SUBSCRIPTION', 'APPOINTMENT')),
  source_id TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  provider_refund_id TEXT UNIQUE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  reason TEXT,
  processed_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS refunds_source_idx
  ON billing.refunds(source_kind, source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS refunds_status_idx
  ON billing.refunds(status);

CREATE TABLE IF NOT EXISTS billing.invoices (
  id TEXT PRIMARY KEY,
  user_subscription_id TEXT REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  provider_invoice_id TEXT NOT NULL UNIQUE,
  provider_subscription_id TEXT,
  provider_payment_id TEXT,
  amount_paise INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  invoice_number TEXT,
  short_url TEXT,
  issued_at TIMESTAMP(3),
  paid_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS invoices_subscription_idx
  ON billing.invoices(user_subscription_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing.webhook_events (
  id TEXT PRIMARY KEY,
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  signature TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  error_message TEXT,
  received_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS webhook_events_type_idx
  ON billing.webhook_events(event_type, received_at DESC);
CREATE INDEX IF NOT EXISTS webhook_events_status_idx
  ON billing.webhook_events(status);

-- Canonical commercial pricing currently approved for launch. These updates are
-- safe for existing subscriptions because actual provider pricing is snapshotted
-- in billing.plan_versions / billing.subscription_states for every new checkout.
UPDATE public.subscription_plans
SET "monthlyPrice" = 149,
    "annualPrice" = 0,
    description = 'HealthConnect Premium patient membership',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE name = 'premium' AND "targetRole" = 'PATIENT';

UPDATE public.subscription_plans
SET "monthlyPrice" = 799,
    "annualPrice" = 0,
    description = 'HealthConnect Professional doctor membership',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE name = 'professional' AND "targetRole" = 'DOCTOR';
