import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';
import * as knowledge from '../services/knowledge.service';

const prisma = new PrismaClient();

const fail = (next: NextFunction, error: unknown) => next(error);

export const getFeatured = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(12, Math.max(1, Number(req.query.limit || 6)));
    const rows = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [{ isFeatured: 'desc' }, { isTrending: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
    });
    return ApiResponse.success(res, await knowledge.enrichArticles(rows));
  } catch (error) { return fail(next, error); }
};

export const getItems = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await knowledge.listPublishedKnowledge(req.query)); }
  catch (error) { return fail(next, error); }
};

export const getItemBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await prisma.article.findFirst({ where: { slug: req.params.slug, isPublished: true } });
    if (!article) return ApiResponse.notFound(res, 'Knowledge item not found');
    await prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
    return ApiResponse.success(res, await knowledge.enrichArticle(article));
  } catch (error) { return fail(next, error); }
};

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.article.groupBy({
      by: ['category'],
      where: { isPublished: true, category: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
    });
    return ApiResponse.success(res, rows.filter(row => row.category).map(row => ({ name: row.category, count: row._count._all })));
  } catch (error) { return fail(next, error); }
};

export const getAdminSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await knowledge.getKnowledgeAdminSummary()); }
  catch (error) { return fail(next, error); }
};

export const getInbox = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await knowledge.listCandidates(req.query)); }
  catch (error) { return fail(next, error); }
};

export const discover = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topics = Array.isArray(req.body?.topics)
      ? req.body.topics.map((v: unknown) => String(v).trim()).filter(Boolean).slice(0, 12)
      : knowledge.DEFAULT_KNOWLEDGE_TOPICS;
    const result = await knowledge.discoverTrustedResearch(topics);
    return ApiResponse.success(res, result, 'Trusted research discovery completed');
  } catch (error) { return fail(next, error); }
};

export const importCandidate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidate = await knowledge.createManualCandidate(req.body || {});
    return ApiResponse.success(res, candidate, 'Content added to Knowledge Hub inbox', 201);
  } catch (error) { return fail(next, error); }
};

export const triage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidate = await knowledge.triageCandidate(req.params.id, req.user!.userId);
    return ApiResponse.success(res, candidate, 'Candidate moved to editorial review');
  } catch (error) { return fail(next, error); }
};

export const reject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidate = await knowledge.rejectCandidate(req.params.id, req.user!.userId);
    return ApiResponse.success(res, candidate, 'Candidate rejected');
  } catch (error) { return fail(next, error); }
};

export const publish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await knowledge.publishCandidate(req.params.id, req.user!.userId, req.body || {});
    return ApiResponse.success(res, article, req.body?.publishNow === false ? 'Knowledge draft created' : 'Knowledge item published', 201);
  } catch (error) { return fail(next, error); }
};

export const getSources = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await knowledge.listSources()); }
  catch (error) { return fail(next, error); }
};

export const addSource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!String(req.body?.name || '').trim()) return ApiResponse.validationError(res, 'Source name is required');
    return ApiResponse.success(res, await knowledge.createSource(req.body || {}), 'Knowledge source created', 201);
  } catch (error) { return fail(next, error); }
};

export const editSource = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await knowledge.updateSource(req.params.id, req.body || {}), 'Knowledge source updated'); }
  catch (error) { return fail(next, error); }
};

export const getAdminArticles = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await knowledge.listAdminArticles(Number(req.query.limit || 60))); }
  catch (error) { return fail(next, error); }
};
