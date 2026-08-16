-- HealthConnect India — Health Status Index v1
-- Append-only history; existing health_scores remains the backward-compatible current row.
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
