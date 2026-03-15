import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

export const getArticles = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.article.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' } })); } catch(e) { next(e); }
};
export const getTrendingArticles = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.article.findMany({ where: { isPublished: true }, orderBy: { viewCount: 'desc' }, take: 10 })); } catch(e) { next(e); }
};
export const getFeaturedArticles = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, await prisma.article.findMany({ where: { isPublished: true, isFeatured: true } })); } catch(e) { next(e); }
};
export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch(e) { next(e); }
};
export const getArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await prisma.article.findFirst({ where: { slug: req.params.slug, isPublished: true } });
    if (!article) return ApiResponse.notFound(res);
    return ApiResponse.success(res, article);
  } catch(e) { next(e); }
};
export const bookmarkArticle = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, null, 'Bookmarked'); } catch(e) { next(e); }
};
export const removeBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, null, 'Bookmark removed'); } catch(e) { next(e); }
};
export const getMyBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try { return ApiResponse.success(res, []); } catch(e) { next(e); }
};
