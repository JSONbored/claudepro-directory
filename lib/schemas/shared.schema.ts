/**
 * Shared Schema Definitions
 *
 * Centralized location for schemas used across multiple domain schemas.
 * This eliminates duplication and ensures consistency across the codebase.
 *
 * Production Standards:
 * - All shared schemas must be properly typed with z.infer
 * - No circular dependencies allowed
 * - Maintain backwards compatibility when modifying
 */

import { z } from 'zod';

/**
 * Content Categories
 * Used across: analytics, content, content-generation, related-content, static-api
 */
export const contentCategorySchema = z.enum([
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'guides',
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
  'jobs',
]);

export type ContentCategory = z.infer<typeof contentCategorySchema>;

/**
 * Content Types
 * Used across: middleware, static-api
 */
export const contentTypeSchema = z.enum(['agent', 'mcp', 'hook', 'command', 'rule', 'job']);

export type ContentType = z.infer<typeof contentTypeSchema>;

/**
 * Pagination Parameters
 * Used across: api, search schemas
 */
export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).optional(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

/**
 * Rate Limit Configuration
 * Used across: api, middleware
 */
export const rateLimitConfigSchema = z.object({
  maxRequests: z.number().int().positive(),
  windowMs: z.number().int().positive(),
  message: z.string().optional(),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

/**
 * Popular Item
 * Used across: cache-warmer, related-content
 */
export const popularItemSchema = z.object({
  slug: z.string(),
  score: z.number(),
  category: contentCategorySchema,
  lastUpdated: z.string().datetime(),
});

export type PopularItem = z.infer<typeof popularItemSchema>;

/**
 * Trending Item
 * Used across: cache, related-content
 */
export const trendingItemSchema = z.object({
  slug: z.string(),
  category: contentCategorySchema,
  score: z.number(),
  viewCount: z.number(),
  lastViewed: z.string().datetime(),
  trend: z.enum(['rising', 'stable', 'falling']).optional(),
});

export type TrendingItem = z.infer<typeof trendingItemSchema>;

/**
 * Performance Metrics
 * Used across: analytics, related-content
 */
export const performanceMetricsSchema = z.object({
  loadTime: z.number().min(0),
  renderTime: z.number().min(0),
  interactionTime: z.number().min(0).optional(),
  totalTime: z.number().min(0),
  resourceCount: z.number().int().min(0).optional(),
  errorCount: z.number().int().min(0).default(0),
});

export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;

/**
 * Base Content Metadata
 * Shared structure for content metadata across the application
 */
export const baseContentMetadataSchema = z.object({
  slug: z.string().min(1),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  category: contentCategorySchema.optional(),
  author: z.string().optional(),
  popularity: z.number().min(0).max(100).optional(),
  dateAdded: z.string().optional(),
  lastModified: z.string().optional(),
});

export type BaseContentMetadata = z.infer<typeof baseContentMetadataSchema>;

/**
 * Export all shared schemas for easy access
 */
export const sharedSchemas = {
  contentCategory: contentCategorySchema,
  contentType: contentTypeSchema,
  paginationParams: paginationParamsSchema,
  rateLimitConfig: rateLimitConfigSchema,
  popularItem: popularItemSchema,
  trendingItem: trendingItemSchema,
  performanceMetrics: performanceMetricsSchema,
  baseContentMetadata: baseContentMetadataSchema,
} as const;
