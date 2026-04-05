"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyBookmarks = exports.removeBookmark = exports.bookmarkArticle = exports.getArticle = exports.getCategories = exports.getFeaturedArticles = exports.getTrendingArticles = exports.getArticles = void 0;
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const prisma = new client_1.PrismaClient();
const getArticles = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma.article.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' } }));
    }
    catch (e) {
        next(e);
    }
};
exports.getArticles = getArticles;
const getTrendingArticles = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma.article.findMany({ where: { isPublished: true }, orderBy: { viewCount: 'desc' }, take: 10 }));
    }
    catch (e) {
        next(e);
    }
};
exports.getTrendingArticles = getTrendingArticles;
const getFeaturedArticles = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, await prisma.article.findMany({ where: { isPublished: true, isFeatured: true } }));
    }
    catch (e) {
        next(e);
    }
};
exports.getFeaturedArticles = getFeaturedArticles;
const getCategories = async (_req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, []);
    }
    catch (e) {
        next(e);
    }
};
exports.getCategories = getCategories;
const getArticle = async (req, res, next) => {
    try {
        const article = await prisma.article.findFirst({ where: { slug: req.params.slug, isPublished: true } });
        if (!article)
            return apiResponse_1.ApiResponse.notFound(res);
        return apiResponse_1.ApiResponse.success(res, article);
    }
    catch (e) {
        next(e);
    }
};
exports.getArticle = getArticle;
const bookmarkArticle = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, null, 'Bookmarked');
    }
    catch (e) {
        next(e);
    }
};
exports.bookmarkArticle = bookmarkArticle;
const removeBookmark = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, null, 'Bookmark removed');
    }
    catch (e) {
        next(e);
    }
};
exports.removeBookmark = removeBookmark;
const getMyBookmarks = async (req, res, next) => {
    try {
        return apiResponse_1.ApiResponse.success(res, []);
    }
    catch (e) {
        next(e);
    }
};
exports.getMyBookmarks = getMyBookmarks;
//# sourceMappingURL=article.controller.js.map