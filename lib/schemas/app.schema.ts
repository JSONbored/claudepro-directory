/**
 * App-level schemas for common patterns
 * Provides type-safe validation for Next.js app components
 */

import { z } from 'zod';
import {
  nonEmptyString,
  optionalUrlString,
  shortString,
  slugString,
} from '@/lib/schemas/primitives/base-strings';

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
 * Canonical location for slug params - used across all [slug] pages
 */
export const slugParamsSchema = z.object({
  slug: slugString, // Uses canonical slugString from primitives (max 100, strict validation)
});

export type SlugParams = z.infer<typeof slugParamsSchema>;

/**
 * Form state schema for server actions
 */
const formStateSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
  issueUrl: optionalUrlString,
  fallback: z.boolean().optional(),
});

export type FormState = z.infer<typeof formStateSchema>;

/**
 * SHA-2100: Removed lazyLoadedDataSchema and lazyLoaderOptionsSchema
 * These Zod schemas were never used for runtime validation in lazy-loader.ts
 * Only the TypeScript types LazyLoadedData<T> and LazyLoaderOptions<T> were used
 * Keeping types below for backward compatibility
 */

/**
 * Type for lazy-loaded data wrapper
 */
export type LazyLoadedData<T> = {
  isLoaded: boolean;
  data: T | null;
  loadPromise: Promise<T> | null;
};

/**
 * Type for lazy loader configuration options
 */
export type LazyLoaderOptions<T> = {
  preload?: boolean;
  cacheTimeout?: number;
  onLoad?: (data: T) => void;
  onError?: (error: Error) => void;
};

/**
 * SEO page data schema
 */
const seoPageDataSchema = z.object({
  title: nonEmptyString.max(200),
  description: nonEmptyString.max(500),
  keywords: z.array(shortString.max(50)).max(20),
  dateUpdated: shortString,
  content: nonEmptyString,
  author: shortString.optional(),
  readingTime: shortString.optional(),
  difficulty: shortString.optional(),
  category: shortString.optional(),
});

export type SEOPageData = z.infer<typeof seoPageDataSchema>;

/**
 * Related guide schema
 */
const relatedGuideSchema = z.object({
  title: nonEmptyString.max(200),
  slug: nonEmptyString.max(200),
  category: nonEmptyString.max(100),
});

export type RelatedGuide = z.infer<typeof relatedGuideSchema>;

/**
 * Comparison data schema for SEO comparison pages
 */
const comparisonDataSchema = z.object({
  title: nonEmptyString.max(200),
  description: nonEmptyString.max(500),
  content: nonEmptyString,
  item1Id: nonEmptyString.max(100),
  item2Id: nonEmptyString.max(100),
  category1: nonEmptyString.max(100),
  category2: nonEmptyString.max(100),
  lastUpdated: shortString,
});

export type ComparisonData = z.infer<typeof comparisonDataSchema>;
