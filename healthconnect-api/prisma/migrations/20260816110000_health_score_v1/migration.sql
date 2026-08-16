-- HealthConnect India — Health Status Index v1
-- Existing health_scores remains the backward-compatible current row.
-- This migration adds append-only versioned snapshots plus structured lifestyle inputs.

CREATE TABLE IF NOT EXISTS "health_score_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patientId" TEXT NOT NULL,
  "score" INTEGER,
  "status" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL DEFAULT 0,
  "algorithmVersion" TEXT NOT NULL,
  "domains" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "alerts" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "missingData" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_score_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "health_score_snapshots_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "health_score_snapshots_patientId_calculatedAt_idx"
  ON "health_score_snapshots"("patientId", "calculatedAt" DESC);

CREATE TABLE IF NOT EXISTS "patient_lifestyle_health" (
  "patientId" TEXT NOT NULL,
  "heightCm" DOUBLE PRECISION,
  "waistCm" DOUBLE PRECISION,
  "moderateActivityMinWeek" INTEGER,
  "vigorousActivityMinWeek" INTEGER,
  "sleepHoursAvg" DOUBLE PRECISION,
  "tobaccoStatus" TEXT,
  "fruitVegServingsDay" DOUBLE PRECISION,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "patient_lifestyle_health_pkey" PRIMARY KEY ("patientId"),
  CONSTRAINT "patient_lifestyle_health_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "patient_lifestyle_health_tobacco_check"
    CHECK ("tobaccoStatus" IS NULL OR "tobaccoStatus" IN ('NEVER','FORMER','CURRENT','SECONDHAND')),
  CONSTRAINT "patient_lifestyle_health_height_check"
    CHECK ("heightCm" IS NULL OR ("heightCm" >= 80 AND "heightCm" <= 250)),
  CONSTRAINT "patient_lifestyle_health_waist_check"
    CHECK ("waistCm" IS NULL OR ("waistCm" >= 30 AND "waistCm" <= 250)),
  CONSTRAINT "patient_lifestyle_health_activity_check"
    CHECK (("moderateActivityMinWeek" IS NULL OR "moderateActivityMinWeek" >= 0) AND
           ("vigorousActivityMinWeek" IS NULL OR "vigorousActivityMinWeek" >= 0)),
  CONSTRAINT "patient_lifestyle_health_sleep_check"
    CHECK ("sleepHoursAvg" IS NULL OR ("sleepHoursAvg" >= 0 AND "sleepHoursAvg" <= 24)),
  CONSTRAINT "patient_lifestyle_health_diet_check"
    CHECK ("fruitVegServingsDay" IS NULL OR ("fruitVegServingsDay" >= 0 AND "fruitVegServingsDay" <= 30))
);
