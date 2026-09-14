import { randomUUID } from 'crypto';
import { ArticleType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const DEFAULT_KNOWLEDGE_TOPICS = [
  'diabetes India',
  'cardiovascular disease India',
  'PCOS women India',
  'pregnancy maternal health India',
  'mental health India',
  'dengue India',
  'hypertension India',
  'nutrition India',
];

const SOURCE_IDS = {
  crossref: 'source-crossref',
  europePmc: 'source-europe-pmc',
  youtube: 'source-youtube-curated',
};

export type KnowledgeCandidate = {
  id: string;
  source_id: string | null;
  source_name?: string | null;
  external_id: string | null;
  content_type: string;
  title: string;
  summary: string | null;
  source_url: string;
  thumbnail_url: string | null;
  youtube_video_id: string | null;
  doi: string | null;
  category: string | null;
  tags: string[];
  published_at: Date | null;
  country_relevance: string;
  priority_score: number;
  clinical_significance: string | null;
  risk_level: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

const trim = (value: unknown, max = 4000) => String(value ?? '').trim().slice(0, max);

const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 82) || `knowledge-${Date.now()}`;

const asDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeDoi = (value: unknown) => trim(value, 300).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');

const titleToCategory = (title: string, fallback = 'Health Update') => {
  const text = title.toLowerCase();
  if (/diabet|glucose|hba1c|insulin/.test(text)) return 'Diabetes';
  if (/heart|cardio|hypertension|blood pressure|stroke/.test(text)) return 'Heart Health';
  if (/pcos|pcod|women|pregnan|maternal|menstrual|menopause/.test(text)) return 'Women Health';
  if (/mental|depress|anxiety|wellbeing|well-being|stress/.test(text)) return 'Mental Health';
  if (/dengue|malaria|infection|virus|outbreak|vaccine/.test(text)) return 'Public Health';
  if (/nutrition|diet|obesity|protein|vitamin/.test(text)) return 'Nutrition';
  if (/dental|oral|tooth|teeth|periodont/.test(text)) return 'Dental';
  return fallback;
};

const scoreCandidate = (title: string, publishedAt: Date | null, query: string) => {
  const text = `${title} ${query}`.toLowerCase();
  let score = 52;
  if (/india|indian|south asia/.test(text)) score += 16;
  if (/guideline|systematic review|meta-analysis|randomized|randomised|outbreak|advisory/.test(text)) score += 9;
  if (/diabet|heart|cardio|pcos|pregnan|mental|dengue|hypertension|nutrition/.test(text)) score += 7;
  if (publishedAt) {
    const ageDays = Math.max(0, (Date.now() - publishedAt.getTime()) / 86400000);
    if (ageDays <= 7) score += 15;
    else if (ageDays <= 30) score += 10;
    else if (ageDays <= 90) score += 5;
  }
  return Math.min(100, score);
};

const extractYouTubeId = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.replace(/^\//, '').split('/')[0] || null;
    if (parsed.hostname.endsWith('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
      return parsed.searchParams.get('v');
    }
  } catch { /* invalid URL */ }
  return null;
};

const candidateUpsert = async (input: {
  sourceId: string;
  externalId?: string | null;
  contentType: string;
  title: string;
  summary?: string | null;
  sourceUrl: string;
  thumbnailUrl?: string | null;
  youtubeVideoId?: string | null;
  doi?: string | null;
  category?: string | null;
  tags?: string[];
  publishedAt?: Date | null;
  countryRelevance?: string;
  priorityScore?: number;
  clinicalSignificance?: string | null;
  riskLevel?: string;
  rawPayload?: unknown;
}) => {
  const id = randomUUID();
  const tags = (input.tags || []).map(v => trim(v, 80)).filter(Boolean).slice(0, 12);
  const rows = await prisma.$queryRawUnsafe<KnowledgeCandidate[]>(
    `INSERT INTO "knowledge_candidates" (
      "id","source_id","external_id","content_type","title","summary","source_url",
      "thumbnail_url","youtube_video_id","doi","category","tags","published_at",
      "country_relevance","priority_score","clinical_significance","risk_level","raw_payload",
      "created_at","updated_at"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::text[],$13,$14,$15,$16,$17,$18::jsonb,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT ("source_url") DO UPDATE SET
      "title"=EXCLUDED."title",
      "summary"=COALESCE(EXCLUDED."summary", "knowledge_candidates"."summary"),
      "thumbnail_url"=COALESCE(EXCLUDED."thumbnail_url", "knowledge_candidates"."thumbnail_url"),
      "published_at"=COALESCE(EXCLUDED."published_at", "knowledge_candidates"."published_at"),
      "priority_score"=GREATEST(EXCLUDED."priority_score", "knowledge_candidates"."priority_score"),
      "raw_payload"=EXCLUDED."raw_payload",
      "updated_at"=CURRENT_TIMESTAMP
    RETURNING *`,
    id,
    input.sourceId,
    input.externalId || null,
    input.contentType,
    trim(input.title, 500),
    input.summary ? trim(input.summary, 3000) : null,
    trim(input.sourceUrl, 1500),
    input.thumbnailUrl ? trim(input.thumbnailUrl, 1500) : null,
    input.youtubeVideoId || null,
    input.doi || null,
    input.category || titleToCategory(input.title),
    tags,
    input.publishedAt || null,
    input.countryRelevance || (/india|indian/i.test(`${input.title} ${input.summary || ''}`) ? 'INDIA' : 'GLOBAL'),
    input.priorityScore || 50,
    input.clinicalSignificance || null,
    input.riskLevel || 'MEDIUM',
    JSON.stringify(input.rawPayload ?? {}),
  );
  return rows[0];
};

export const discoverCrossref = async (topics = DEFAULT_KNOWLEDGE_TOPICS, perTopic = 4) => {
  const since = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
  const added: KnowledgeCandidate[] = [];

  for (const topic of topics.slice(0, 12)) {
    const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(topic)}&filter=from-pub-date:${since},type:journal-article&rows=${Math.min(8, Math.max(1, perTopic))}&select=DOI,title,URL,published-online,published-print,container-title,author,license,type`;
    const response = await fetch(url, { headers: { 'User-Agent': 'HealthConnectIndia/1.0 (mailto:support@healthconnect.sbs)' } });
    if (!response.ok) continue;
    const payload: any = await response.json();
    const items = Array.isArray(payload?.message?.items) ? payload.message.items : [];

    for (const item of items) {
      const title = trim(Array.isArray(item?.title) ? item.title[0] : item?.title, 500);
      const doi = normalizeDoi(item?.DOI);
      if (!title || !doi) continue;
      const dateParts = item?.['published-online']?.['date-parts']?.[0] || item?.['published-print']?.['date-parts']?.[0];
      const publishedAt = Array.isArray(dateParts) && dateParts.length
        ? asDate(`${dateParts[0]}-${String(dateParts[1] || 1).padStart(2, '0')}-${String(dateParts[2] || 1).padStart(2, '0')}`)
        : null;
      const journal = trim(Array.isArray(item?.['container-title']) ? item['container-title'][0] : '', 220);
      const authors = Array.isArray(item?.author)
        ? item.author.slice(0, 3).map((a: any) => [a?.given, a?.family].filter(Boolean).join(' ')).filter(Boolean).join(', ')
        : '';
      const summary = [journal && `Published in ${journal}.`, authors && `Authors: ${authors}.`, 'Queued for HealthConnect editorial review; publisher abstract is not copied automatically.'].filter(Boolean).join(' ');
      added.push(await candidateUpsert({
        sourceId: SOURCE_IDS.crossref,
        externalId: doi,
        contentType: 'RESEARCH_UPDATE',
        title,
        summary,
        sourceUrl: `https://doi.org/${doi}`,
        doi,
        category: titleToCategory(`${title} ${topic}`),
        tags: [topic, 'Research'],
        publishedAt,
        priorityScore: scoreCandidate(title, publishedAt, topic),
        clinicalSignificance: 'Research metadata candidate. Editorial review required before patient-facing publication.',
        riskLevel: 'HIGH',
        rawPayload: item,
      }));
    }
  }
  return added;
};

export const discoverEuropePmc = async (topics = DEFAULT_KNOWLEDGE_TOPICS, perTopic = 4) => {
  const added: KnowledgeCandidate[] = [];
  for (const topic of topics.slice(0, 12)) {
    const query = `${topic} FIRST_PDATE:[NOW-45DAY TO NOW]`;
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=${Math.min(8, Math.max(1, perTopic))}&resultType=core`;
    const response = await fetch(url, { headers: { 'User-Agent': 'HealthConnectIndia/1.0' } });
    if (!response.ok) continue;
    const payload: any = await response.json();
    const items = Array.isArray(payload?.resultList?.result) ? payload.resultList.result : [];

    for (const item of items) {
      const title = trim(item?.title, 500);
      if (!title) continue;
      const doi = normalizeDoi(item?.doi);
      const externalId = trim(item?.pmid || item?.pmcid || doi, 200);
      const sourceUrl = doi ? `https://doi.org/${doi}` : item?.pmcid
        ? `https://europepmc.org/articles/${encodeURIComponent(item.pmcid)}`
        : `https://europepmc.org/article/MED/${encodeURIComponent(item?.pmid || '')}`;
      const publishedAt = asDate(item?.firstPublicationDate || item?.journalInfo?.printPublicationDate || item?.dateOfPublication);
      const journal = trim(item?.journalTitle || item?.journalInfo?.journal?.title, 220);
      const summary = [journal && `Published in ${journal}.`, item?.authorString && `Authors: ${trim(item.authorString, 420)}.`, item?.isOpenAccess === 'Y' ? 'Open-access record available; licence still requires review before reuse.' : 'Source-linked research record.'].filter(Boolean).join(' ');
      added.push(await candidateUpsert({
        sourceId: SOURCE_IDS.europePmc,
        externalId,
        contentType: 'RESEARCH_UPDATE',
        title,
        summary,
        sourceUrl,
        doi: doi || null,
        category: titleToCategory(`${title} ${topic}`),
        tags: [topic, 'Research'],
        publishedAt,
        priorityScore: scoreCandidate(title, publishedAt, topic) + (item?.isOpenAccess === 'Y' ? 2 : 0),
        clinicalSignificance: 'Research candidate discovered from Europe PMC. HealthConnect summary must be independently written and reviewed.',
        riskLevel: 'HIGH',
        rawPayload: item,
      }));
    }
  }
  return added;
};

export const discoverTrustedResearch = async (topics = DEFAULT_KNOWLEDGE_TOPICS) => {
  const [crossref, europePmc] = await Promise.allSettled([
    discoverCrossref(topics),
    discoverEuropePmc(topics),
  ]);
  return {
    crossref: crossref.status === 'fulfilled' ? crossref.value.length : 0,
    europePmc: europePmc.status === 'fulfilled' ? europePmc.value.length : 0,
    errors: [crossref, europePmc].filter(r => r.status === 'rejected').length,
  };
};

export const importYouTubeCandidate = async (url: string, overrides: Record<string, any> = {}) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('A valid YouTube watch, short, youtu.be or embed URL is required.');
  const canonical = `https://www.youtube.com/watch?v=${videoId}`;
  let metadata: any = {};
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`);
    if (response.ok) metadata = await response.json();
  } catch { /* Admin may still save manually when oEmbed is temporarily unavailable. */ }

  const title = trim(overrides.title || metadata?.title || 'YouTube health video', 500);
  const author = trim(metadata?.author_name, 220);
  return candidateUpsert({
    sourceId: SOURCE_IDS.youtube,
    externalId: videoId,
    contentType: 'VIDEO',
    title,
    summary: trim(overrides.summary || (author ? `Original video by ${author}. Embed only; HealthConnect does not re-host the video.` : 'Curated original YouTube video. Embed only; HealthConnect does not re-host the video.'), 3000),
    sourceUrl: canonical,
    thumbnailUrl: trim(overrides.thumbnailUrl || metadata?.thumbnail_url, 1500) || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    youtubeVideoId: videoId,
    category: trim(overrides.category || titleToCategory(title), 120),
    tags: Array.isArray(overrides.tags) ? overrides.tags : ['Video'],
    countryRelevance: trim(overrides.countryRelevance || (/india|indian/i.test(title) ? 'INDIA' : 'GLOBAL'), 50),
    priorityScore: Number(overrides.priorityScore || 62),
    clinicalSignificance: trim(overrides.clinicalSignificance || 'Curated educational video. Admin should confirm channel credibility, claims and relevance before publishing.', 1000),
    riskLevel: trim(overrides.riskLevel || 'MEDIUM', 30),
    rawPayload: metadata,
  });
};

export const createManualCandidate = async (input: Record<string, any>) => {
  if (String(input.sourceUrl || '').includes('youtu')) return importYouTubeCandidate(input.sourceUrl, input);
  if (!input.sourceUrl || !input.title) throw new Error('title and sourceUrl are required.');
  return candidateUpsert({
    sourceId: trim(input.sourceId || 'source-who', 120),
    externalId: trim(input.externalId, 250) || null,
    contentType: trim(input.contentType || 'PUBLIC_HEALTH_ALERT', 60),
    title: trim(input.title, 500),
    summary: trim(input.summary, 3000) || null,
    sourceUrl: trim(input.sourceUrl, 1500),
    thumbnailUrl: trim(input.thumbnailUrl, 1500) || null,
    doi: normalizeDoi(input.doi) || null,
    category: trim(input.category || titleToCategory(input.title), 120),
    tags: Array.isArray(input.tags) ? input.tags : [],
    publishedAt: asDate(input.publishedAt),
    countryRelevance: trim(input.countryRelevance || 'INDIA', 50),
    priorityScore: Math.max(0, Math.min(100, Number(input.priorityScore || 60))),
    clinicalSignificance: trim(input.clinicalSignificance, 1000) || null,
    riskLevel: trim(input.riskLevel || 'MEDIUM', 30),
    rawPayload: input.rawPayload || {},
  });
};

export const listCandidates = async (filters: Record<string, any> = {}) => {
  const status = trim(filters.status || '', 40);
  const type = trim(filters.type || '', 60);
  const q = trim(filters.q || '', 200);
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 40)));
  const rows = await prisma.$queryRawUnsafe<KnowledgeCandidate[]>(
    `SELECT c.*, s."name" AS source_name
       FROM "knowledge_candidates" c
       LEFT JOIN "knowledge_sources" s ON s."id" = c."source_id"
      WHERE ($1 = '' OR c."status" = $1)
        AND ($2 = '' OR c."content_type" = $2)
        AND ($3 = '' OR c."title" ILIKE '%' || $3 || '%' OR COALESCE(c."summary", '') ILIKE '%' || $3 || '%')
      ORDER BY CASE c."status" WHEN 'DISCOVERED' THEN 0 WHEN 'TRIAGED' THEN 1 WHEN 'DRAFTED' THEN 2 ELSE 3 END,
               c."priority_score" DESC, COALESCE(c."published_at", c."created_at") DESC
      LIMIT $4`,
    status,
    type,
    q,
    limit,
  );
  return rows;
};

export const getKnowledgeAdminSummary = async () => {
  const rows = await prisma.$queryRawUnsafe<Array<{status: string; count: bigint}>>(
    `SELECT "status", COUNT(*)::bigint AS count FROM "knowledge_candidates" GROUP BY "status"`
  );
  const reviewDue = await prisma.$queryRawUnsafe<Array<{count: bigint}>>(
    `SELECT COUNT(*)::bigint AS count FROM "knowledge_article_metadata" WHERE "next_review_at" IS NOT NULL AND "next_review_at" <= CURRENT_TIMESTAMP`
  );
  const published = await prisma.article.count({ where: { isPublished: true } });
  const status: Record<string, number> = {};
  rows.forEach(row => { status[row.status] = Number(row.count); });
  return { status, reviewDue: Number(reviewDue[0]?.count || 0), published };
};

export const triageCandidate = async (id: string, reviewerId: string) => {
  const rows = await prisma.$queryRawUnsafe<KnowledgeCandidate[]>(
    `UPDATE "knowledge_candidates" SET "status"='TRIAGED', "reviewed_by"=$2, "reviewed_at"=CURRENT_TIMESTAMP, "updated_at"=CURRENT_TIMESTAMP WHERE "id"=$1 RETURNING *`,
    id,
    reviewerId,
  );
  if (!rows[0]) throw new Error('Knowledge candidate not found.');
  return rows[0];
};

export const rejectCandidate = async (id: string, reviewerId: string) => {
  const rows = await prisma.$queryRawUnsafe<KnowledgeCandidate[]>(
    `UPDATE "knowledge_candidates" SET "status"='REJECTED', "reviewed_by"=$2, "reviewed_at"=CURRENT_TIMESTAMP, "updated_at"=CURRENT_TIMESTAMP WHERE "id"=$1 RETURNING *`,
    id,
    reviewerId,
  );
  if (!rows[0]) throw new Error('Knowledge candidate not found.');
  return rows[0];
};

const uniqueSlug = async (title: string) => {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  while (await prisma.article.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix++}`.slice(0, 96);
  }
  return candidate;
};

const mapArticleType = (contentType: string): ArticleType => {
  if (contentType === 'VIDEO') return ArticleType.VIDEO;
  if (contentType === 'RESEARCH_UPDATE') return ArticleType.RESEARCH;
  return ArticleType.ARTICLE;
};

export const publishCandidate = async (id: string, reviewerId: string, input: Record<string, any>) => {
  const rows = await prisma.$queryRawUnsafe<KnowledgeCandidate[]>(
    `SELECT c.*, s."name" AS source_name FROM "knowledge_candidates" c LEFT JOIN "knowledge_sources" s ON s."id"=c."source_id" WHERE c."id"=$1 LIMIT 1`,
    id,
  );
  const candidate = rows[0];
  if (!candidate) throw new Error('Knowledge candidate not found.');
  if (candidate.status === 'REJECTED') throw new Error('Rejected content must be re-triaged before publication.');

  const title = trim(input.title || candidate.title, 500);
  const body = trim(input.body || input.editorialSummary || candidate.summary || '', 60000);
  if (!body) throw new Error('A HealthConnect-written summary/body is required before publication.');
  const slug = await uniqueSlug(input.slug || title);
  const category = trim(input.category || candidate.category || titleToCategory(title), 120);
  const tags = Array.isArray(input.tags) ? input.tags.map((v: unknown) => trim(v, 80)).filter(Boolean) : candidate.tags || [];
  const isPublished = input.publishNow !== false;
  const article = await prisma.article.create({
    data: {
      slug,
      title,
      body,
      excerpt: trim(input.excerpt || candidate.summary || body.replace(/[#*_`]/g, ' ').slice(0, 280), 600),
      coverImage: trim(input.coverImage || candidate.thumbnail_url, 1500) || null,
      type: mapArticleType(candidate.content_type),
      readTimeMin: candidate.content_type === 'VIDEO' ? Math.max(1, Number(input.readTimeMin || 5)) : Math.max(2, Number(input.readTimeMin || Math.ceil(body.split(/\s+/).length / 210))),
      authorId: reviewerId,
      authorName: trim(input.authorName || 'HealthConnect Editorial', 180),
      isVerifiedAuthor: true,
      tags,
      category,
      isFeatured: Boolean(input.isFeatured),
      isTrending: Boolean(input.isTrending),
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
  });

  const keyTakeaways = Array.isArray(input.keyTakeaways)
    ? input.keyTakeaways.map((v: unknown) => trim(v, 500)).filter(Boolean).slice(0, 8)
    : [];
  const reviewMonths = Math.max(1, Math.min(24, Number(input.reviewMonths || (candidate.risk_level === 'HIGH' ? 6 : 12))));
  const nextReview = new Date();
  nextReview.setMonth(nextReview.getMonth() + reviewMonths);

  await prisma.$executeRawUnsafe(
    `INSERT INTO "knowledge_article_metadata" (
       "article_id","source_id","candidate_id","source_name","source_url","external_id","doi","youtube_video_id","license",
       "evidence_level","medical_risk_level","country_relevance","key_takeaways","reviewed_by","reviewed_at","next_review_at","is_healthconnect_original","created_at","updated_at"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::text[],$14,CURRENT_TIMESTAMP,$15,$16,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    article.id,
    candidate.source_id,
    candidate.id,
    candidate.source_name || null,
    candidate.source_url,
    candidate.external_id,
    candidate.doi,
    candidate.youtube_video_id,
    trim(input.license, 220) || null,
    trim(input.evidenceLevel || (candidate.content_type === 'RESEARCH_UPDATE' ? 'RESEARCH' : 'EDITORIAL'), 80),
    candidate.risk_level,
    candidate.country_relevance,
    keyTakeaways,
    reviewerId,
    nextReview,
    Boolean(input.isHealthConnectOriginal ?? candidate.content_type !== 'VIDEO'),
  );

  await prisma.$executeRawUnsafe(
    `UPDATE "knowledge_candidates" SET "status"=$2, "reviewed_by"=$3, "reviewed_at"=CURRENT_TIMESTAMP, "updated_at"=CURRENT_TIMESTAMP WHERE "id"=$1`,
    id,
    isPublished ? 'PUBLISHED' : 'DRAFTED',
    reviewerId,
  );

  return enrichArticle(article);
};

export const listSources = async () => prisma.$queryRawUnsafe<any[]>(
  `SELECT * FROM "knowledge_sources" ORDER BY "trust_level" DESC, "name" ASC`
);

export const createSource = async (input: Record<string, any>) => {
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "knowledge_sources" ("id","name","source_type","base_url","youtube_channel_id","trust_level","reuse_policy","is_active","auto_discover","created_at","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *`,
    id,
    trim(input.name, 220),
    trim(input.sourceType || 'PUBLIC_HEALTH', 80),
    trim(input.baseUrl, 1500) || null,
    trim(input.youtubeChannelId, 250) || null,
    trim(input.trustLevel || 'HIGH', 40),
    trim(input.reusePolicy, 1500) || null,
    input.isActive !== false,
    Boolean(input.autoDiscover),
  );
  return rows[0];
};

export const updateSource = async (id: string, input: Record<string, any>) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `UPDATE "knowledge_sources" SET
      "name"=COALESCE(NULLIF($2,''),"name"),
      "source_type"=COALESCE(NULLIF($3,''),"source_type"),
      "base_url"=CASE WHEN $4='' THEN "base_url" ELSE $4 END,
      "youtube_channel_id"=CASE WHEN $5='' THEN "youtube_channel_id" ELSE $5 END,
      "trust_level"=COALESCE(NULLIF($6,''),"trust_level"),
      "reuse_policy"=CASE WHEN $7='' THEN "reuse_policy" ELSE $7 END,
      "is_active"=$8,
      "auto_discover"=$9,
      "updated_at"=CURRENT_TIMESTAMP
     WHERE "id"=$1 RETURNING *`,
    id,
    trim(input.name, 220),
    trim(input.sourceType, 80),
    trim(input.baseUrl, 1500),
    trim(input.youtubeChannelId, 250),
    trim(input.trustLevel, 40),
    trim(input.reusePolicy, 1500),
    input.isActive !== false,
    Boolean(input.autoDiscover),
  );
  if (!rows[0]) throw new Error('Knowledge source not found.');
  return rows[0];
};

export const enrichArticle = async <T extends {id: string}>(article: T) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "knowledge_article_metadata" WHERE "article_id"=$1 LIMIT 1`, article.id
  );
  const meta = rows[0] || null;
  return meta ? {
    ...article,
    knowledge: {
      sourceName: meta.source_name,
      sourceUrl: meta.source_url,
      doi: meta.doi,
      youtubeVideoId: meta.youtube_video_id,
      license: meta.license,
      evidenceLevel: meta.evidence_level,
      medicalRiskLevel: meta.medical_risk_level,
      countryRelevance: meta.country_relevance,
      keyTakeaways: meta.key_takeaways || [],
      reviewedBy: meta.reviewed_by,
      reviewedAt: meta.reviewed_at,
      nextReviewAt: meta.next_review_at,
      isHealthConnectOriginal: meta.is_healthconnect_original,
    },
  } : article;
};

export const enrichArticles = async <T extends {id: string}>(articles: T[]) => {
  if (!articles.length) return articles;
  return Promise.all(articles.map(enrichArticle));
};

export const listPublishedKnowledge = async (input: Record<string, any> = {}) => {
  const limit = Math.min(60, Math.max(1, Number(input.limit || 24)));
  const category = trim(input.category || '', 120);
  const type = trim(input.type || '', 40).toUpperCase();
  const q = trim(input.q || '', 200);
  const where: any = { isPublished: true };
  if (category) where.category = category;
  if (type && Object.values(ArticleType).includes(type as ArticleType)) where.type = type as ArticleType;
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { excerpt: { contains: q, mode: 'insensitive' } }, { tags: { has: q } }];
  const articles = await prisma.article.findMany({ where, orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }], take: limit });
  return enrichArticles(articles);
};

export const listAdminArticles = async (limit = 60) => {
  const articles = await prisma.article.findMany({ orderBy: { updatedAt: 'desc' }, take: Math.min(100, Math.max(1, limit)) });
  return enrichArticles(articles);
};
