# HealthConnect India — Production Billing

## Scope

The billing module extends the existing HealthConnect subscription foundation without replacing the clinical appointment workflow. It supports:

- Patient Premium membership: ₹149/month.
- Optional launch promotion `LAUNCH99`: ₹99/month for the first 3 billing cycles, then ₹149/month.
- Doctor Professional membership: ₹799/month.
- Doctor-defined consultation fees linked to existing appointments.
- Razorpay subscription checkout, order checkout, signature verification and capture.
- Signed/idempotent webhook processing.
- Subscription charges, appointment payment ledger, invoices and refunds.
- Patient receipts, Doctor consultation-payment summary, Admin revenue/refund reporting.

All monetary values in the new billing ledger are stored in paise. Existing legacy `public.payments.amount` values remain in rupees only for backward compatibility.

## Environment

Set these on the API server. Never commit the values.

```text
RAZORPAY_KEY_ID=<live-or-test-key-id>
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>
RAZORPAY_LAUNCH99_OFFER_ID=<Razorpay-offer-id-for-first-3-cycles>
```

`RAZORPAY_LAUNCH99_OFFER_ID` is intentionally optional at application startup. If it is missing, the API will refuse a `LAUNCH99` checkout instead of charging the base price unexpectedly.

## Razorpay Dashboard setup

Create the `LAUNCH99` Offer in Razorpay Dashboard as a recurring subscription offer limited to the first 3 payment cycles. The application attaches that Offer while creating the Patient Premium subscription.

Configure the webhook URL:

```text
https://api.healthconnect.sbs/api/v1/subscription/webhook
```

Use the same secret configured in `RAZORPAY_WEBHOOK_SECRET`.

Recommended events:

- `subscription.authenticated`
- `subscription.activated`
- `subscription.charged`
- `subscription.pending`
- `subscription.halted`
- `subscription.cancelled`
- `subscription.completed`
- `subscription.updated`
- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `order.paid`
- invoice payment events enabled by the account
- refund lifecycle events enabled by the account

The webhook endpoint deliberately uses `express.raw()` before global JSON parsing because Razorpay signature validation must use the exact request body.

## Database

Apply the additive migration:

```bash
cd /var/www/healthconnect/healthconnect-api
npx prisma migrate deploy
```

Migration `20260823150000_billing_production_foundation` creates a separate PostgreSQL schema named `billing`. It does not delete or rebuild Patient, Doctor, Hospital or appointment data.

The new tables are:

- `billing.plan_versions`
- `billing.subscription_states`
- `billing.subscription_charges`
- `billing.appointment_payments`
- `billing.refunds`
- `billing.invoices`
- `billing.webhook_events`

`plan_versions` snapshots provider plan IDs by price version, so a future base-price change does not rewrite historical or already-created Razorpay subscriptions.

## API contract

### Memberships

```text
GET  /api/v1/subscription/plans
GET  /api/v1/subscription/current
GET  /api/v1/subscription/billing-history
POST /api/v1/subscription/checkout
POST /api/v1/subscription/verify
POST /api/v1/subscription/cancel
POST /api/v1/subscription/change
POST /api/v1/subscription/webhook  # Razorpay only; HMAC-authenticated
```

Checkout body example:

```json
{
  "planId": "<internal plan UUID or name>",
  "billingCycle": "MONTHLY",
  "promotionCode": "LAUNCH99"
}
```

### Appointment payments

```text
GET  /api/v1/payments/appointments
POST /api/v1/payments/appointments/:appointmentId/checkout
POST /api/v1/payments/appointments/:appointmentId/verify
GET  /api/v1/payments/appointments/:appointmentId/receipt
GET  /api/v1/payments/doctor/summary
```

Appointment fees are calculated server-side from the Doctor profile. Client-supplied amounts are ignored.

### Admin

```text
GET  /api/v1/admin/billing/summary
POST /api/v1/admin/billing/refunds
```

Backward-compatible aliases remain:

```text
GET /api/v1/admin/subscriptions
GET /api/v1/admin/revenue
```

## Safety rules

- Do not treat browser success callbacks as proof of payment. Every payment is server-verified against Razorpay.
- Appointment booking remains independent from payment creation; payment adds a financial link to the existing appointment and does not recreate it.
- Never expose `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` to the web client.
- Use webhook event IDs and provider payment IDs for idempotency.
- Refunds are initiated only from authenticated Admin endpoints and cannot exceed the remaining refundable amount.
