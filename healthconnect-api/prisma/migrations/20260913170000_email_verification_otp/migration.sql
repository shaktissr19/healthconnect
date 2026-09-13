CREATE TABLE IF NOT EXISTS public.email_verification_otps (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  otp_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS email_verification_otps_expires_at_idx
  ON public.email_verification_otps(expires_at);
