import { Request } from 'express';
import { CONSTANTS } from '../config/constants';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationParams = (query: any): PaginationParams => {
  const page  = Math.max(1, parseInt(query.page  || '1',  10));
  const limit = Math.min(
    CONSTANTS.PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit || String(CONSTANTS.PAGINATION.DEFAULT_LIMIT), 10))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams
) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  },
});
