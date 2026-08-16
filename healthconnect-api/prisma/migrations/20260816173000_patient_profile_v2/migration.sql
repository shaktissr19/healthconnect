-- Patient Profile v2
-- Adds India-focused location data and optional patient preference/coverage fields.
-- Clinical health information remains in its existing domain tables and is not moved here.

ALTER TABLE "patient_profiles"
  ADD COLUMN "middleName" TEXT,
  ADD COLUMN "preferredName" TEXT,
  ADD COLUMN "alternatePhone" TEXT,
  ADD COLUMN "preferredPronouns" TEXT,
  ADD COLUMN "maritalStatus" TEXT,
  ADD COLUMN "district" TEXT,
  ADD COLUMN "secondaryLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "preferredContactMethod" TEXT,
  ADD COLUMN "accessibilityNeeds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "insuranceExpiry" TIMESTAMP(3),
  ADD COLUMN "governmentScheme" TEXT,
  ADD COLUMN "governmentSchemeId" TEXT;

ALTER TABLE "emergency_contacts"
  ADD COLUMN "alternatePhone" TEXT;

CREATE INDEX "patient_profiles_city_idx" ON "patient_profiles"("city");
CREATE INDEX "patient_profiles_district_idx" ON "patient_profiles"("district");
CREATE INDEX "patient_profiles_state_idx" ON "patient_profiles"("state");
