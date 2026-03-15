-- ============================================================
-- HealthConnect India — Community Features Migration
-- Run: PGPASSWORD=hc_password_123 psql -U hc_user -d healthconnect -h 127.0.0.1 -f migration.sql
-- ============================================================

BEGIN;

-- ── 1. community_requests ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_requests (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT        NOT NULL,
  category      TEXT,
  reason        TEXT        NOT NULL,
  "requestedBy" TEXT        REFERENCES users(id) ON DELETE SET NULL,
  "requesterEmail" TEXT,
  status        TEXT        NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
  "adminNote"   TEXT,
  "reviewedBy"  TEXT        REFERENCES users(id) ON DELETE SET NULL,
  "reviewedAt"  TIMESTAMP(3),
  "communityId" TEXT        REFERENCES communities(id) ON DELETE SET NULL, -- set when approved
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_requests_status_idx ON community_requests(status);
CREATE INDEX IF NOT EXISTS community_requests_requestedBy_idx ON community_requests("requestedBy");

-- ── 2. Add journeyStage to posts ──────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='posts' AND column_name='journeyStage'
  ) THEN
    ALTER TABLE posts ADD COLUMN "journeyStage" TEXT DEFAULT NULL;
  END IF;
END $$;

-- ── 3. community_polls ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_polls (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "communityId" TEXT        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  "createdBy"   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question      TEXT        NOT NULL,
  options       TEXT[]      NOT NULL DEFAULT ARRAY[]::text[],
  "endsAt"      TIMESTAMP(3),
  "isActive"    BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_polls_communityId_idx ON community_polls("communityId");

-- ── 4. poll_votes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_votes (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pollId"      TEXT        NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  "userId"      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "optionIndex" INTEGER     NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE ("pollId", "userId")
);
CREATE INDEX IF NOT EXISTS poll_votes_pollId_idx ON poll_votes("pollId");

-- ── 5. post_bookmarks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "postId"    TEXT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userId"    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE ("postId", "userId")
);
CREATE INDEX IF NOT EXISTS post_bookmarks_userId_idx ON post_bookmarks("userId");
CREATE INDEX IF NOT EXISTS post_bookmarks_postId_idx ON post_bookmarks("postId");

-- ── 6. weekly_qa_sessions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_qa_sessions (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "communityId" TEXT        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  "doctorId"    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  "doctorName"  TEXT        NOT NULL,
  topic         TEXT        NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "durationMin" INTEGER     NOT NULL DEFAULT 60,
  "isCompleted" BOOLEAN     NOT NULL DEFAULT false,
  "meetLink"    TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS weekly_qa_communityId_idx ON weekly_qa_sessions("communityId");

-- ── 7. Verify all tables created ─────────────────────────────────────────────
SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name=t.table_name) as col_count
FROM information_schema.tables t
WHERE table_schema='public'
AND table_name IN (
  'community_requests','community_polls','poll_votes',
  'post_bookmarks','weekly_qa_sessions'
)
ORDER BY table_name;

COMMIT;
