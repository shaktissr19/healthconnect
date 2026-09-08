-- HealthConnect India — customer production readiness: phone verification foundation
-- Provider owns the OTP secret/code lifecycle; this table stores only verification state,
-- throttling metadata and the verified phone value. No plaintext OTP is persisted.

CREATE TABLE IF NOT EXISTS "phone_verification_states" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "pendingPhone" VARCHAR(20),
  "verifiedPhone" VARCHAR(20),
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "verifiedAt" TIMESTAMPTZ,
  "lastSendAt" TIMESTAMPTZ,
  "sendWindowStartedAt" TIMESTAMPTZ,
  "sendCount" INTEGER NOT NULL DEFAULT 0,
  "lastVerifyAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "phone_verification_states_verifiedPhone_idx"
  ON "phone_verification_states" ("verifiedPhone");

CREATE INDEX IF NOT EXISTS "phone_verification_states_isVerified_idx"
  ON "phone_verification_states" ("isVerified");
