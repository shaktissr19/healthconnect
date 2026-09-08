-- HealthConnect India — phone verification / OTP production foundation
-- Additive only. Existing users remain valid and unverified by phone until they complete OTP.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.phone_otp_challenges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  resend_count INTEGER NOT NULL DEFAULT 0,
  provider_request_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT phone_otp_status_check CHECK (status IN ('PENDING','VERIFIED','EXPIRED','LOCKED')),
  CONSTRAINT phone_otp_attempts_check CHECK (attempts >= 0),
  CONSTRAINT phone_otp_resend_check CHECK (resend_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_user_created
  ON public.phone_otp_challenges(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phone_otp_phone_created
  ON public.phone_otp_challenges(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phone_otp_pending_expiry
  ON public.phone_otp_challenges(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_users_phone_verified
  ON public.users(is_phone_verified);
