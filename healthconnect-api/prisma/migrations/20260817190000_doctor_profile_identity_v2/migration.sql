-- Doctor Profile v2: persist identity fields already collected by doctor onboarding
-- and used by the public doctor directory gender filter.
ALTER TABLE "doctor_profiles"
  ADD COLUMN "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN "gender" "Gender";

CREATE INDEX "doctor_profiles_gender_idx" ON "doctor_profiles"("gender");
