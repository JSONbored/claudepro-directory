/**
 * App-level schemas for common patterns
 * Provides type-safe validation for Next.js app components
 */

import { z } from 'zod';

/**
 * Next.js 15 compatible page props - EXACTLY matches Next.js generated types
 * Both params and searchParams are optional as per Next.js 15 type generation
 */
export type PageProps = {
  params?: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Page props specifically for pages that use searchParams
 */
export type PagePropsWithSearchParams = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Slug-specific params validation schema
 */
export const slugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
});

export type SlugParams = z.infer<typeof slugParamsSchema>;

/**
 * Form state schema for server actions
 */
export const formStateSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
  issueUrl: z.string().url().optional(),
  fallback: z.boolean().optional(),
});

export type FormState = z.infer<typeof formStateSchema>;

/**
 * Lazy loader schemas for optimized data loading
 */
export const lazyLoadedDataSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    isLoaded: z.boolean(),
    data: z.union([dataSchema, z.null()]),
    loadPromise: z.union([z.promise(dataSchema), z.null()]),
  });

export type LazyLoadedData<T> = {
  isLoaded: boolean;
  data: T | null;
  loadPromise: Promise<T> | null;
};

export const lazyLoaderOptionsSchema = z.object({
  preload: z.boolean().optional(),
  cacheTimeout: z.number().positive().optional(),
  onLoad: z.function().optional(),
  onError: z.function().optional(),
});

export type LazyLoaderOptions<T> = {
  preload?: boolean;
  cacheTimeout?: number;
  onLoad?: (data: T) => void;
  onError?: (error: Error) => void;
};

/**
 * SEO page data schema
 */
export const seoPageDataSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  keywords: z.array(z.string().min(1).max(50)).max(20),
  dateUpdated: z.string().max(100),
  content: z.string().min(1),
  author: z.string().max(100).optional(),
  readingTime: z.string().max(50).optional(),
  difficulty: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
});

export type SEOPageData = z.infer<typeof seoPageDataSchema>;

/**
 * Related guide schema
 */
export const relatedGuideSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
});

export type RelatedGuide = z.infer<typeof relatedGuideSchema>;

/**
 * Comparison data schema for SEO comparison pages
 */
export const comparisonDataSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  content: z.string().min(1),
  item1Id: z.string().min(1).max(100),
  item2Id: z.string().min(1).max(100),
  category1: z.string().min(1).max(100),
  category2: z.string().min(1).max(100),
  lastUpdated: z.string().max(100),
});

export type ComparisonData = z.infer<typeof comparisonDataSchema>;

/**
 * Export all app schemas for centralized access
 */
export const appSchemas = {
  slugParams: slugParamsSchema,
  formState: formStateSchema,
  seoPageData: seoPageDataSchema,
  relatedGuide: relatedGuideSchema,
  comparisonData: comparisonDataSchema,
} as const;
