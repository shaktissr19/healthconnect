-- Hospital Module completion — additive, data-preserving migration

-- Extend appointment operational states used by hospital OPD workflows.
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CHECKED_IN';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

-- Hospital verification, affiliation and type lifecycles.
CREATE TYPE "HospitalVerificationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "HospitalAffiliationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'REVOKED');
CREATE TYPE "HospitalType" AS ENUM ('GOVERNMENT', 'PRIVATE', 'TRUST_NGO', 'TEACHING', 'CHARITABLE', 'OTHER');

ALTER TABLE "hospital_profiles"
  ADD COLUMN "galleryUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "about" TEXT,
  ADD COLUMN "hospitalType" "HospitalType",
  ADD COLUMN "teleconsultAvailable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "facilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "insuranceProviders" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "governmentSchemes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "registrationAuthority" TEXT,
  ADD COLUMN "authorizedContactName" TEXT,
  ADD COLUMN "authorizedContactPhone" TEXT,
  ADD COLUMN "verificationStatus" "HospitalVerificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "verificationNotes" TEXT,
  ADD COLUMN "verifiedByAdminId" TEXT,
  ADD COLUMN "verificationSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "verificationDocuments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "profileScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- Existing verified hospitals remain verified after lifecycle introduction.
UPDATE "hospital_profiles"
SET "verificationStatus" = 'VERIFIED'
WHERE "isVerified" = true;

-- Give the canonical integrated demo hospitals a truthful institution type.
UPDATE "hospital_profiles" SET "hospitalType" = 'GOVERNMENT' WHERE "name" = 'AIIMS New Delhi' AND "hospitalType" IS NULL;
UPDATE "hospital_profiles" SET "hospitalType" = 'PRIVATE' WHERE "name" IN ('Fortis Hospital Mumbai', 'Narayana Health Bengaluru', 'Apollo Hospitals Chennai') AND "hospitalType" IS NULL;

ALTER TABLE "doctor_hospitals"
  ADD COLUMN "status" "HospitalAffiliationStatus" NOT NULL DEFAULT 'ACCEPTED',
  ADD COLUMN "invitedByUserId" TEXT,
  ADD COLUMN "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "respondedAt" TIMESTAMP(3),
  ADD COLUMN "revokedAt" TIMESTAMP(3);

-- Existing relationships predate invitations and are trusted as accepted.
UPDATE "doctor_hospitals"
SET "status" = 'ACCEPTED',
    "respondedAt" = COALESCE("respondedAt", "joinedAt");

CREATE TABLE "hospital_doctor_availability" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "slotDuration" INTEGER NOT NULL DEFAULT 30,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hospital_doctor_availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hospital_reviews" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "userId" TEXT,
  "appointmentId" TEXT,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "comment" TEXT,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hospital_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hospital_reviews_appointmentId_key" ON "hospital_reviews"("appointmentId");
CREATE INDEX "hospital_reviews_hospitalId_idx" ON "hospital_reviews"("hospitalId");
CREATE INDEX "hospital_reviews_patientId_idx" ON "hospital_reviews"("patientId");

CREATE INDEX "hospital_doctor_availability_doctorId_hospitalId_idx"
  ON "hospital_doctor_availability"("doctorId", "hospitalId");
CREATE INDEX "hospital_doctor_availability_hospitalId_dayOfWeek_idx"
  ON "hospital_doctor_availability"("hospitalId", "dayOfWeek");

CREATE INDEX "hospital_profiles_state_idx" ON "hospital_profiles"("state");
CREATE INDEX "hospital_profiles_verificationStatus_idx" ON "hospital_profiles"("verificationStatus");
CREATE INDEX "doctor_hospitals_hospitalId_status_idx" ON "doctor_hospitals"("hospitalId", "status");
CREATE INDEX "doctor_hospitals_doctorId_status_idx" ON "doctor_hospitals"("doctorId", "status");
CREATE INDEX IF NOT EXISTS "appointments_hospitalId_idx" ON "appointments"("hospitalId");

ALTER TABLE "hospital_doctor_availability"
  ADD CONSTRAINT "hospital_doctor_availability_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hospital_doctor_availability"
  ADD CONSTRAINT "hospital_doctor_availability_hospitalId_fkey"
  FOREIGN KEY ("hospitalId") REFERENCES "hospital_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hospital_reviews"
  ADD CONSTRAINT "hospital_reviews_hospitalId_fkey"
  FOREIGN KEY ("hospitalId") REFERENCES "hospital_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hospital_reviews"
  ADD CONSTRAINT "hospital_reviews_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hospital_reviews"
  ADD CONSTRAINT "hospital_reviews_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
