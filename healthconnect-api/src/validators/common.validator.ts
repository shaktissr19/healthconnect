import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
});
