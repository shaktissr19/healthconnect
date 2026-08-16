-- CreateEnum
CREATE TYPE "AllergyCategory" AS ENUM ('FOOD', 'DRUG', 'ENVIRONMENTAL', 'INSECT', 'LATEX', 'OTHER');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('IN_PERSON', 'TELECONSULT', 'HOME_VISIT');

-- CreateEnum
CREATE TYPE "ArticleDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('ARTICLE', 'VIDEO', 'RESEARCH', 'PATIENT_STORY', 'DOCTOR_INSIGHT');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL', 'LIFETIME');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CommunityRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CommunityVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ConditionStatus" AS ENUM ('ACTIVE', 'CHRONIC', 'RESOLVED', 'IN_REMISSION');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MedicationFrequency" AS ENUM ('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MedicationLogStatus" AS ENUM ('taken', 'missed', 'skipped');

-- CreateEnum
CREATE TYPE "MedicationStatus" AS ENUM ('ACTIVE', 'DISCONTINUED', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('DISMISS', 'DELETE_CONTENT', 'WARN_USER', 'BAN_USER', 'PIN_POST', 'UNPIN_POST', 'APPROVE_POST', 'ROLE_CHANGE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'MEDICATION_REMINDER', 'COMMUNITY_ACTIVITY', 'COMMUNITY_REQUEST', 'COMMUNITY_REQUEST_UPDATE', 'HEALTH_ALERT', 'REPORT_SHARED', 'SYSTEM', 'REFILL_ALERT');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'SUPPORT', 'HELPFUL');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('MISINFORMATION', 'HARASSMENT', 'SPAM', 'INAPPROPRIATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('LAB', 'SCAN', 'PRESCRIPTION', 'DISCHARGE', 'VACCINATION', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'FLAGGED', 'PENDING_MODERATION');

-- CreateEnum
CREATE TYPE "RhFactor" AS ENUM ('POSITIVE', 'NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'DOCTOR', 'HOSPITAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('GOING', 'NOT_GOING', 'MAYBE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE', 'TRIALING');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VitalType" AS ENUM ('bp', 'heart_rate', 'blood_sugar', 'hba1c', 'weight', 'temperature', 'spo2', 'cholesterol');

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "condition" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '👤',
    "quote" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 5,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergies" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "category" "AllergyCategory" NOT NULL DEFAULT 'OTHER',
    "severity" "AllergySeverity" NOT NULL DEFAULT 'MILD',
    "reaction" TEXT,
    "diagnosedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "type" "AppointmentType" NOT NULL DEFAULT 'IN_PERSON',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "reasonForVisit" TEXT,
    "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "doctorNotes" TEXT,
    "prescription" TEXT,
    "followUpDate" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "meetingLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_bookmarks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "type" "ArticleType" NOT NULL DEFAULT 'ARTICLE',
    "difficulty" "ArticleDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "readTimeMin" INTEGER NOT NULL DEFAULT 5,
    "authorId" TEXT,
    "authorName" TEXT,
    "isVerifiedAuthor" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isTrending" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "category" TEXT,
    "visibility" "CommunityVisibility" NOT NULL DEFAULT 'PUBLIC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "rules" TEXT,
    "coverImageUrl" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_event_rsvps" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'GOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_events" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "format" "EventFormat" NOT NULL DEFAULT 'ONLINE',
    "location" TEXT,
    "meetLink" TEXT,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_moderation_logs" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_reports" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL DEFAULT 'OTHER',
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_requests" (
    "id" TEXT NOT NULL,
    "communityName" TEXT NOT NULL,
    "category" TEXT,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT,
    "status" "CommunityRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icdCode" TEXT,
    "status" "ConditionStatus" NOT NULL DEFAULT 'ACTIVE',
    "diagnosedDate" TIMESTAMP(3),
    "resolvedDate" TIMESTAMP(3),
    "diagnosedBy" TEXT,
    "managingDoctor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headName" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_hospitals" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "department" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "profilePhotoUrl" TEXT,
    "specialization" TEXT,
    "subSpecializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualification" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceYears" INTEGER,
    "medicalLicenseNumber" TEXT,
    "licenseState" TEXT,
    "consultationFee" DOUBLE PRECISION,
    "teleconsultFee" DOUBLE PRECISION,
    "languagesSpoken" TEXT[] DEFAULT ARRAY['Hindi', 'English']::TEXT[],
    "clinicName" TEXT,
    "clinicAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isAvailableOnline" BOOLEAN NOT NULL DEFAULT true,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalPatients" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hcDoctorId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationNotes" TEXT,
    "verifiedByAdminId" TEXT,
    "medicalCouncil" TEXT,
    "registrationYear" INTEGER,
    "careerJourney" TEXT,
    "trainingHospitals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hospitalAffiliations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "awards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publications" INTEGER,
    "videoConsultFee" DOUBLE PRECISION,
    "audioConsultFee" DOUBLE PRECISION,
    "offersInPerson" BOOLEAN NOT NULL DEFAULT true,
    "offersVideoConsult" BOOLEAN NOT NULL DEFAULT false,
    "offersAudioConsult" BOOLEAN NOT NULL DEFAULT false,
    "offersChatConsult" BOOLEAN NOT NULL DEFAULT false,
    "videoPlatform" TEXT,
    "videoRoomBaseUrl" TEXT,
    "isAcceptingNewPatients" BOOLEAN NOT NULL DEFAULT true,
    "availabilitySchedule" JSONB,
    "nextAvailableSlot" TIMESTAMP(3),
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTimeMin" INTEGER,
    "featuredReview" TEXT,
    "featuredPatientName" TEXT,
    "profileScore" INTEGER NOT NULL DEFAULT 0,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_reviews" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "userId" TEXT,
    "appointmentId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "body" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_history" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    "ageOfOnset" INTEGER,
    "status" TEXT,
    "causeOfDeath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_scores" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "medicationAdherence" INTEGER NOT NULL DEFAULT 0,
    "symptomFrequency" INTEGER NOT NULL DEFAULT 0,
    "appointmentRegularity" INTEGER NOT NULL DEFAULT 0,
    "lifestyleFactors" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "totalBeds" INTEGER,
    "icuBeds" INTEGER,
    "emergencyAvailable" BOOLEAN NOT NULL DEFAULT false,
    "opdTimings" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accreditations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "registrationNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalization_history" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "dischargeDate" TIMESTAMP(3),
    "reason" TEXT,
    "diagnosis" TEXT,
    "treatingDoctor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospitalization_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_reports" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL DEFAULT 'OTHER',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT,
    "uploadedBy" TEXT,
    "description" TEXT,
    "reportDate" TIMESTAMP(3),
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_logs" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "takenAt" TIMESTAMP(3),
    "status" "MedicationLogStatus" NOT NULL DEFAULT 'missed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "dosage" TEXT NOT NULL,
    "dosageUnit" TEXT,
    "frequency" "MedicationFrequency" NOT NULL DEFAULT 'ONCE_DAILY',
    "customFrequency" TEXT,
    "timesOfDay" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prescribedBy" TEXT,
    "prescribedFor" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "MedicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStock" INTEGER,
    "refillThreshold" INTEGER DEFAULT 7,
    "instructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_consents" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "accessScope" TEXT[],
    "status" "ConsentStatus" NOT NULL DEFAULT 'ACTIVE',
    "grantReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "bloodGroup" "BloodGroup" NOT NULL DEFAULT 'UNKNOWN',
    "rhFactor" "RhFactor" NOT NULL DEFAULT 'UNKNOWN',
    "profilePhotoUrl" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "languagePreference" TEXT NOT NULL DEFAULT 'en',
    "insuranceProvider" TEXT,
    "insurancePolicyNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpayOrderId" TEXT,
    "razorpaySignature" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_reactions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "anonymousAlias" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_shares" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "targetRole" "Role" NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL,
    "maxReports" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surgeries" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "surgeryDate" TIMESTAMP(3) NOT NULL,
    "hospital" TEXT,
    "surgeon" TEXT,
    "outcome" TEXT,
    "complications" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_logs" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "triggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapies" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "targetValue" TEXT,
    "currentValue" TEXT,
    "adherence" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allowDoctorAccess" BOOLEAN NOT NULL DEFAULT true,
    "allowAnonymousPosting" BOOLEAN NOT NULL DEFAULT true,
    "contributeToResearch" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "medicationReminders" BOOLEAN NOT NULL DEFAULT true,
    "communityActivity" BOOLEAN NOT NULL DEFAULT true,
    "weeklyHealthSummary" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "razorpaySubId" TEXT,
    "razorpayOrderId" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "registrationId" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "emailVerifyToken" TEXT,
    "emailVerifyExpiry" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "dateAdministered" TIMESTAMP(3) NOT NULL,
    "doseNumber" INTEGER,
    "totalDoses" INTEGER,
    "nextDueDate" TIMESTAMP(3),
    "administrator" TEXT,
    "batchNumber" TEXT,
    "sideEffects" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vitals" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "VitalType" NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "context" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_name_key" ON "Testimonial"("name" ASC);

-- CreateIndex
CREATE INDEX "allergies_patientId_idx" ON "allergies"("patientId" ASC);

-- CreateIndex
CREATE INDEX "appointments_doctorId_idx" ON "appointments"("doctorId" ASC);

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId" ASC);

-- CreateIndex
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt" ASC);

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "article_bookmarks_articleId_userId_key" ON "article_bookmarks"("articleId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "articles_isFeatured_idx" ON "articles"("isFeatured" ASC);

-- CreateIndex
CREATE INDEX "articles_isTrending_idx" ON "articles"("isTrending" ASC);

-- CreateIndex
CREATE INDEX "articles_slug_idx" ON "articles"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId" ASC);

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId" ASC);

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId" ASC);

-- CreateIndex
CREATE INDEX "communities_category_idx" ON "communities"("category" ASC);

-- CreateIndex
CREATE INDEX "communities_slug_idx" ON "communities"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug" ASC);

-- CreateIndex
CREATE INDEX "community_event_rsvps_eventId_idx" ON "community_event_rsvps"("eventId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "community_event_rsvps_eventId_userId_key" ON "community_event_rsvps"("eventId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "community_event_rsvps_userId_idx" ON "community_event_rsvps"("userId" ASC);

-- CreateIndex
CREATE INDEX "community_events_communityId_idx" ON "community_events"("communityId" ASC);

-- CreateIndex
CREATE INDEX "community_events_eventDate_idx" ON "community_events"("eventDate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "community_members_communityId_userId_key" ON "community_members"("communityId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "community_members_userId_idx" ON "community_members"("userId" ASC);

-- CreateIndex
CREATE INDEX "community_moderation_logs_communityId_idx" ON "community_moderation_logs"("communityId" ASC);

-- CreateIndex
CREATE INDEX "community_moderation_logs_createdAt_idx" ON "community_moderation_logs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "community_moderation_logs_moderatorId_idx" ON "community_moderation_logs"("moderatorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "community_reports_communityId_reporterId_targetId_key" ON "community_reports"("communityId" ASC, "reporterId" ASC, "targetId" ASC);

-- CreateIndex
CREATE INDEX "community_reports_communityId_status_idx" ON "community_reports"("communityId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "community_reports_reporterId_idx" ON "community_reports"("reporterId" ASC);

-- CreateIndex
CREATE INDEX "community_requests_createdAt_idx" ON "community_requests"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "community_requests_requestedBy_idx" ON "community_requests"("requestedBy" ASC);

-- CreateIndex
CREATE INDEX "community_requests_status_idx" ON "community_requests"("status" ASC);

-- CreateIndex
CREATE INDEX "conditions_patientId_idx" ON "conditions"("patientId" ASC);

-- CreateIndex
CREATE INDEX "doctor_availability_doctorId_idx" ON "doctor_availability"("doctorId" ASC);

-- CreateIndex
CREATE INDEX "doctor_bookmarks_doctorId_idx" ON "doctor_bookmarks"("doctorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_bookmarks_userId_doctorId_key" ON "doctor_bookmarks"("userId" ASC, "doctorId" ASC);

-- CreateIndex
CREATE INDEX "doctor_bookmarks_userId_idx" ON "doctor_bookmarks"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_hospitals_doctorId_hospitalId_key" ON "doctor_hospitals"("doctorId" ASC, "hospitalId" ASC);

-- CreateIndex
CREATE INDEX "doctor_profiles_city_idx" ON "doctor_profiles"("city" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_hcDoctorId_key" ON "doctor_profiles"("hcDoctorId" ASC);

-- CreateIndex
CREATE INDEX "doctor_profiles_specialization_idx" ON "doctor_profiles"("specialization" ASC);

-- CreateIndex
CREATE INDEX "doctor_profiles_userId_idx" ON "doctor_profiles"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_userId_key" ON "doctor_profiles"("userId" ASC);

-- CreateIndex
CREATE INDEX "doctor_reviews_doctorId_idx" ON "doctor_reviews"("doctorId" ASC);

-- CreateIndex
CREATE INDEX "doctor_reviews_patientId_idx" ON "doctor_reviews"("patientId" ASC);

-- CreateIndex
CREATE INDEX "emergency_contacts_patientId_idx" ON "emergency_contacts"("patientId" ASC);

-- CreateIndex
CREATE INDEX "family_history_patientId_idx" ON "family_history"("patientId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "health_scores_patientId_key" ON "health_scores"("patientId" ASC);

-- CreateIndex
CREATE INDEX "hospital_profiles_city_idx" ON "hospital_profiles"("city" ASC);

-- CreateIndex
CREATE INDEX "hospital_profiles_userId_idx" ON "hospital_profiles"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "hospital_profiles_userId_key" ON "hospital_profiles"("userId" ASC);

-- CreateIndex
CREATE INDEX "hospitalization_history_patientId_idx" ON "hospitalization_history"("patientId" ASC);

-- CreateIndex
CREATE INDEX "medical_reports_patientId_idx" ON "medical_reports"("patientId" ASC);

-- CreateIndex
CREATE INDEX "medication_logs_medicationId_idx" ON "medication_logs"("medicationId" ASC);

-- CreateIndex
CREATE INDEX "medication_logs_scheduledTime_idx" ON "medication_logs"("scheduledTime" ASC);

-- CreateIndex
CREATE INDEX "medications_patientId_idx" ON "medications"("patientId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email" ASC);

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId" ASC, "isRead" ASC);

-- CreateIndex
CREATE INDEX "patient_consents_doctorId_idx" ON "patient_consents"("doctorId" ASC);

-- CreateIndex
CREATE INDEX "patient_consents_patientId_idx" ON "patient_consents"("patientId" ASC);

-- CreateIndex
CREATE INDEX "patient_consents_status_idx" ON "patient_consents"("status" ASC);

-- CreateIndex
CREATE INDEX "patient_profiles_userId_idx" ON "patient_profiles"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_userId_key" ON "patient_profiles"("userId" ASC);

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId" ASC);

-- CreateIndex
CREATE INDEX "post_reactions_postId_idx" ON "post_reactions"("postId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "post_reactions_postId_userId_reactionType_key" ON "post_reactions"("postId" ASC, "userId" ASC, "reactionType" ASC);

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId" ASC);

-- CreateIndex
CREATE INDEX "posts_communityId_idx" ON "posts"("communityId" ASC);

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "posts"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "report_shares_doctorId_idx" ON "report_shares"("doctorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "report_shares_reportId_doctorId_key" ON "report_shares"("reportId" ASC, "doctorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name" ASC);

-- CreateIndex
CREATE INDEX "surgeries_patientId_idx" ON "surgeries"("patientId" ASC);

-- CreateIndex
CREATE INDEX "symptom_logs_loggedAt_idx" ON "symptom_logs"("loggedAt" ASC);

-- CreateIndex
CREATE INDEX "symptom_logs_patientId_idx" ON "symptom_logs"("patientId" ASC);

-- CreateIndex
CREATE INDEX "therapies_patientId_idx" ON "therapies"("patientId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId" ASC);

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status" ASC);

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_idx" ON "user_subscriptions"("userId" ASC);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- CreateIndex
CREATE INDEX "users_registrationId_idx" ON "users"("registrationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_registrationId_key" ON "users"("registrationId" ASC);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role" ASC);

-- CreateIndex
CREATE INDEX "vaccinations_patientId_idx" ON "vaccinations"("patientId" ASC);

-- CreateIndex
CREATE INDEX "vitals_measuredAt_idx" ON "vitals"("measuredAt" ASC);

-- CreateIndex
CREATE INDEX "vitals_patientId_type_idx" ON "vitals"("patientId" ASC, "type" ASC);

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospital_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_bookmarks" ADD CONSTRAINT "article_bookmarks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_bookmarks" ADD CONSTRAINT "article_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_event_rsvps" ADD CONSTRAINT "community_event_rsvps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "community_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_event_rsvps" ADD CONSTRAINT "community_event_rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_moderation_logs" ADD CONSTRAINT "community_moderation_logs_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_moderation_logs" ADD CONSTRAINT "community_moderation_logs_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_requests" ADD CONSTRAINT "community_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_requests" ADD CONSTRAINT "community_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospital_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_bookmarks" ADD CONSTRAINT "doctor_bookmarks_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_hospitals" ADD CONSTRAINT "doctor_hospitals_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_hospitals" ADD CONSTRAINT "doctor_hospitals_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospital_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_history" ADD CONSTRAINT "family_history_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_scores" ADD CONSTRAINT "health_scores_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_profiles" ADD CONSTRAINT "hospital_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalization_history" ADD CONSTRAINT "hospitalization_history_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "medical_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
