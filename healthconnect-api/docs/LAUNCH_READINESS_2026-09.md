# HealthConnect India — Launch Readiness Preflight

Target: production launch after end-to-end UAT. This document contains no credentials.

## 1. Required production configuration

The API intentionally fails fast in production when customer-facing integrations are missing.

Required core configuration:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL=https://healthconnect.sbs`
- `COOKIE_DOMAIN=.healthconnect.sbs` when shared cookies are required across approved subdomains
- `REPORT_ENCRYPTION_KEY`

Transactional email:
- `EMAIL_STRICT_MODE=true`
- `SENDGRID_API_KEY`
- `FROM_EMAIL=noreply@healthconnect.sbs`
- `FROM_NAME=HealthConnect India`

Phone OTP / sensitive-action verification:
- `REQUIRE_VERIFIED_SENSITIVE_ACTIONS=true`
- `MSG91_AUTH_KEY`
- `MSG91_SENDER_ID`
- `MSG91_TEMPLATE_ID`
- Complete the required India DLT sender/template setup before relying on production SMS OTP.

Razorpay:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_LAUNCH99_OFFER_ID` only when the launch offer is intentionally active

Public landing metrics:
- Leave `NEXT_PUBLIC_SHOW_PUBLIC_STATS` unset/false until the displayed counts are verified production metrics.
- Set `NEXT_PUBLIC_SHOW_PUBLIC_STATS=true` only when the public counts have an agreed business definition and are production-safe.

## 2. Database deployment

Before restarting production API:

```bash
cd /var/www/healthconnect/healthconnect-api
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

The launch-readiness branch adds `email_verification_otps`, which stores only a SHA-256 hash of each one-time code, expiry, cooldown timestamp, and failed-attempt count. Plain OTPs are never stored in the database.

Take a PostgreSQL backup before `prisma migrate deploy`.

## 3. Identity UAT

Test with new accounts, not only seeded demo users:

1. Patient registration.
2. Doctor registration.
3. Welcome email delivery.
4. Verification-link flow.
5. Six-digit email OTP fallback:
   - request code;
   - confirm 60-second resend cooldown;
   - confirm 10-minute expiry;
   - confirm repeated invalid attempts invalidate the code;
   - confirm successful verification marks `isEmailVerified=true`.
6. Password reset email and expiry.
7. Show/Hide password control.
8. Patient sign-in lands on My Home.
9. Logout and refresh-token/session-expiry behavior.
10. Phone OTP send/resend/verify using the approved production MSG91/DLT template.

## 4. Membership UAT

Canonical monthly prices currently enforced by the backend:
- Patient Premium: ₹149/month.
- Doctor Professional: ₹799/month.
- Patient Basic/Free: no online checkout.

Test:
1. Public plan catalogue.
2. Free Patient account remains valid base access and never appears as an expired paid membership.
3. Unverified identity is blocked from protected checkout when production verification gates are enabled.
4. Patient Premium checkout.
5. Doctor Professional checkout.
6. Razorpay checkout close/dismiss without activation.
7. Successful server-side signature verification.
8. Provider subscription fetch matches the local user and subscription.
9. Membership becomes active only after verified provider state.
10. Billing history contains the provider payment reference.
11. Invoice appears when Razorpay emits the invoice webhook.
12. Auto-renew cancellation at cycle end.
13. PAST_DUE, CANCELLED and EXPIRED states render correctly.
14. Duplicate webhook delivery does not duplicate charges or state transitions.
15. Refund webhook updates the internal billing ledger correctly.

## 5. Razorpay webhook UAT

Production webhook endpoint:

`POST https://api.healthconnect.sbs/api/v1/subscription/webhook`

The route must receive the raw request body before `express.json()` and verify `RAZORPAY_WEBHOOK_SECRET`.

Verify at least:
- `subscription.charged`
- subscription lifecycle events used by the account
- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `invoice.*`
- `refund.*`

Replay the same provider event ID and confirm idempotent handling.

## 6. Appointment payment UAT

Membership charges and doctor consultation charges are separate.

Test:
- appointment checkout only for the owning Patient;
- server-side payment signature verification;
- payment status synchronization;
- receipt endpoint;
- Doctor billing summary;
- full and partial refund handling where supported.

## 7. Email deliverability

Before launch:
- authenticate `healthconnect.sbs` with the selected transactional email provider;
- publish and verify SPF;
- enable DKIM;
- publish DMARC (start with a monitored policy if necessary, then strengthen it);
- verify `noreply@healthconnect.sbs` or the configured sender;
- test Gmail, Outlook and at least one mobile mail client;
- ensure payment/security emails are not routed to spam.

Do not log verification codes, reset tokens, passwords, UPI PINs or payment secrets.

## 8. Public/legal UAT

Verify all footer links return HTTP 200 and render correctly:
- Privacy Policy
- Terms of Use
- Refund & Cancellation
- Community Guidelines
- Data & Privacy
- Data Deletion
- Contact & Support

Check that public copy does not claim certification, clinical outcomes, user scale, or provider verification beyond what HealthConnect can substantiate.

## 9. Landing/mobile UAT

Test at minimum:
- 360 × 800
- 390 × 844
- 768 × 1024
- 1366 × 768
- 1440 × 900

Verify sticky navbar anchors, landing section CTAs, auth modals, My Health detail popups, directories, plan cards, legal pages and footer.

## 10. Production smoke test

After deployment:

```bash
curl -fsS https://api.healthconnect.sbs/health
curl -fsS https://api.healthconnect.sbs/ready
curl -fsSI https://healthconnect.sbs/
```

Then complete one real low-value/normal production payment through the exact customer UI and verify the resulting subscription, charge, webhook event, invoice/receipt, and transactional email before public launch.
