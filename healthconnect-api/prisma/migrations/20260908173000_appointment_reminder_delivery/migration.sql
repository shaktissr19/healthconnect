-- HealthConnect India — idempotent appointment reminder delivery ledger
-- Existing Prisma String identifiers are stored as PostgreSQL TEXT. Keep the
-- appointment foreign-key column TEXT so it matches appointments.id exactly.
CREATE TABLE IF NOT EXISTS "appointment_reminder_deliveries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "appointmentId" TEXT NOT NULL REFERENCES "appointments"("id") ON DELETE CASCADE,
  "reminderKey" VARCHAR(32) NOT NULL,
  "channel" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "deliveredAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_reminder_delivery_unique"
    UNIQUE ("appointmentId", "reminderKey", "channel")
);

CREATE INDEX IF NOT EXISTS "appointment_reminder_deliveries_status_idx"
  ON "appointment_reminder_deliveries" ("status", "updatedAt");
