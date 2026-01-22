import { z } from 'zod';

/**
 * Validation schema for package parameter
 */
export const packageParamSchema = z.object({
  package: z.string().min(1, 'Package name is required').trim(),
});

/**
 * Validation schema for pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Validation schema for product filters
 */
export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().trim().optional(),
});

/**
 * Type exports for use in handlers
 */
export type PackageParam = z.infer<typeof packageParamSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
