-- HealthConnect India — HC-HSI 2.0 assessment context
-- Adds explicit declarations needed to distinguish true N/A states from missing data.

ALTER TABLE "patient_lifestyle_health"
  ADD COLUMN IF NOT EXISTS "medicationStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "conditionStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "familyHistoryStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "medicationTrackingStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "alcoholStatus" TEXT;

ALTER TABLE "patient_lifestyle_health"
  DROP CONSTRAINT IF EXISTS "patient_lifestyle_health_medication_status_check";
ALTER TABLE "patient_lifestyle_health"
  ADD CONSTRAINT "patient_lifestyle_health_medication_status_check"
  CHECK ("medicationStatus" IS NULL OR "medicationStatus" IN ('NONE','TAKING_PRESCRIBED','UNKNOWN'));

ALTER TABLE "patient_lifestyle_health"
  DROP CONSTRAINT IF EXISTS "patient_lifestyle_health_condition_status_check";
ALTER TABLE "patient_lifestyle_health"
  ADD CONSTRAINT "patient_lifestyle_health_condition_status_check"
  CHECK ("conditionStatus" IS NULL OR "conditionStatus" IN ('NONE','KNOWN','UNKNOWN'));

ALTER TABLE "patient_lifestyle_health"
  DROP CONSTRAINT IF EXISTS "patient_lifestyle_health_family_history_status_check";
ALTER TABLE "patient_lifestyle_health"
  ADD CONSTRAINT "patient_lifestyle_health_family_history_status_check"
  CHECK ("familyHistoryStatus" IS NULL OR "familyHistoryStatus" IN ('NONE','RECORDED','UNKNOWN'));

ALTER TABLE "patient_lifestyle_health"
  DROP CONSTRAINT IF EXISTS "patient_lifestyle_health_alcohol_status_check";
ALTER TABLE "patient_lifestyle_health"
  ADD CONSTRAINT "patient_lifestyle_health_alcohol_status_check"
  CHECK ("alcoholStatus" IS NULL OR "alcoholStatus" IN ('NONE','OCCASIONAL','REGULAR','UNKNOWN'));
