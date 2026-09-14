-- Knowledge Hub content operations: trusted source registry, editorial inbox and
-- supplemental metadata for published Article records. IDs remain TEXT to match
-- the existing Prisma schema / production database conventions.

CREATE TABLE IF NOT EXISTS "knowledge_sources" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "base_url" TEXT,
  "youtube_channel_id" TEXT,
  "trust_level" TEXT NOT NULL DEFAULT 'HIGH',
  "reuse_policy" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "auto_discover" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_sources_name_key"
  ON "knowledge_sources"("name");
CREATE INDEX IF NOT EXISTS "knowledge_sources_active_idx"
  ON "knowledge_sources"("is_active", "auto_discover");

CREATE TABLE IF NOT EXISTS "knowledge_candidates" (
  "id" TEXT PRIMARY KEY,
  "source_id" TEXT,
  "external_id" TEXT,
  "content_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "source_url" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "youtube_video_id" TEXT,
  "doi" TEXT,
  "category" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "published_at" TIMESTAMP(3),
  "country_relevance" TEXT NOT NULL DEFAULT 'GLOBAL',
  "priority_score" INTEGER NOT NULL DEFAULT 0,
  "clinical_significance" TEXT,
  "risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'DISCOVERED',
  "raw_payload" JSONB,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_candidates_source_id_fkey"
    FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_candidates_source_url_key"
  ON "knowledge_candidates"("source_url");
CREATE INDEX IF NOT EXISTS "knowledge_candidates_status_idx"
  ON "knowledge_candidates"("status", "priority_score" DESC, "created_at" DESC);
CREATE INDEX IF NOT EXISTS "knowledge_candidates_type_idx"
  ON "knowledge_candidates"("content_type", "published_at" DESC);

CREATE TABLE IF NOT EXISTS "knowledge_article_metadata" (
  "article_id" TEXT PRIMARY KEY,
  "source_id" TEXT,
  "candidate_id" TEXT,
  "source_name" TEXT,
  "source_url" TEXT,
  "external_id" TEXT,
  "doi" TEXT,
  "youtube_video_id" TEXT,
  "license" TEXT,
  "evidence_level" TEXT,
  "medical_risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
  "country_relevance" TEXT NOT NULL DEFAULT 'INDIA',
  "key_takeaways" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "next_review_at" TIMESTAMP(3),
  "is_healthconnect_original" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_article_metadata_article_id_fkey"
    FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE,
  CONSTRAINT "knowledge_article_metadata_source_id_fkey"
    FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL,
  CONSTRAINT "knowledge_article_metadata_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "knowledge_candidates"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "knowledge_article_metadata_review_idx"
  ON "knowledge_article_metadata"("next_review_at");
CREATE INDEX IF NOT EXISTS "knowledge_article_metadata_video_idx"
  ON "knowledge_article_metadata"("youtube_video_id");

INSERT INTO "knowledge_sources" (
  "id", "name", "source_type", "base_url", "trust_level", "reuse_policy", "is_active", "auto_discover"
) VALUES
  ('source-crossref', 'Crossref', 'RESEARCH', 'https://api.crossref.org', 'HIGH', 'Metadata discovery; do not copy publisher abstracts unless licence permits.', TRUE, TRUE),
  ('source-europe-pmc', 'Europe PMC', 'RESEARCH', 'https://www.ebi.ac.uk/europepmc', 'HIGH', 'Research discovery; full-text reuse only when item licence permits.', TRUE, TRUE),
  ('source-who', 'World Health Organization', 'PUBLIC_HEALTH', 'https://www.who.int', 'HIGH', 'Reference/link by default; reuse only under the individual item licence.', TRUE, FALSE),
  ('source-ncdc-india', 'NCDC India', 'PUBLIC_HEALTH', 'https://ncdc.mohfw.gov.in', 'HIGH', 'Use with source acknowledgement where permitted; exclude third-party material.', TRUE, FALSE),
  ('source-mohfw-india', 'MoHFW India', 'PUBLIC_HEALTH', 'https://mohfw.gov.in', 'HIGH', 'Reference/link by default; verify reuse policy per resource.', TRUE, FALSE),
  ('source-icmr', 'ICMR', 'RESEARCH', 'https://www.icmr.gov.in', 'HIGH', 'Reference/link by default; verify reuse policy per resource.', TRUE, FALSE),
  ('source-youtube-curated', 'YouTube — Curated Health Sources', 'VIDEO', 'https://www.youtube.com', 'CURATED', 'Embed original videos only; never download/re-host.', TRUE, FALSE)
ON CONFLICT ("name") DO NOTHING;
