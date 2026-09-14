import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';
import { enrichArticle, enrichArticles } from '../services/knowledge.service';

const prisma = new PrismaClient();

export const getArticles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.article.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' } });
    return ApiResponse.success(res, await enrichArticles(rows));
  } catch(e) { next(e); }
};
export const getTrendingArticles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.article.findMany({ where: { isPublished: true }, orderBy: [{ isTrending: 'desc' }, { viewCount: 'desc' }], take: 10 });
    return ApiResponse.success(res, await enrichArticles(rows));
  } catch(e) { next(e); }
};
export const getFeaturedArticles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.article.findMany({ where: { isPublished: true, isFeatured: true }, orderBy: { publishedAt: 'desc' } });
    return ApiResponse.success(res, await enrichArticles(rows));
  } catch(e) { next(e); }
};
export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.article.groupBy({ by: ['category'], where: { isPublished: true, category: { not: null } }, _count: { _all: true } });
    return ApiResponse.success(res, rows.filter(row => row.category).map(row => ({ name: row.category, count: row._count._all })));
  } catch(e) { next(e); }
};
export const getArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await prisma.article.findFirst({ where: { slug: req.params.slug, isPublished: true } });
    if (!article) return ApiResponse.notFound(res);
    await prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
    return ApiResponse.success(res, await enrichArticle(article));
  } catch(e) { next(e); }
};
export const bookmarkArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return ApiResponse.unauthorized(res);
    const bookmark = await prisma.articleBookmark.upsert({
      where: { articleId_userId: { articleId: req.params.id, userId: req.user.userId } },
      create: { articleId: req.params.id, userId: req.user.userId },
      update: {},
    });
    return ApiResponse.success(res, bookmark, 'Bookmarked');
  } catch(e) { next(e); }
};
export const removeBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return ApiResponse.unauthorized(res);
    await prisma.articleBookmark.deleteMany({ where: { articleId: req.params.id, userId: req.user.userId } });
    return ApiResponse.success(res, null, 'Bookmark removed');
  } catch(e) { next(e); }
};
export const getMyBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return ApiResponse.unauthorized(res);
    const bookmarks = await prisma.articleBookmark.findMany({ where: { userId: req.user.userId }, include: { article: true }, orderBy: { createdAt: 'desc' } });
    const articles = await enrichArticles(bookmarks.map(item => item.article));
    return ApiResponse.success(res, articles);
  } catch(e) { next(e); }
};
