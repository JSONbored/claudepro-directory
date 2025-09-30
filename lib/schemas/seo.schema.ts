/**
 * SEO Metadata Validation Schemas
 * Production-grade validation for Next.js metadata and SEO content
 * Ensures content quality and prevents XSS/injection attacks
 */

import { z } from 'zod';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { authorsArray, smallUrlArray } from '@/lib/schemas/primitives/base-arrays';
import { imageDimension } from '@/lib/schemas/primitives/base-numbers';
import { shortString } from '@/lib/schemas/primitives/base-strings';
import {
  ogDescriptionSchema,
  ogTitleSchema,
  SEO_LIMITS,
  seoAltTextSchema,
  seoAuthorNameSchema,
  seoDescriptionSchema,
  seoKeywordsArraySchema,
  seoKeywordsSchema,
  seoSiteNameSchema,
  type seoTextSchema,
  seoTitleSchema,
  seoUrlSchema,
  TWITTER_HANDLE_REGEX,
  twitterDescriptionSchema,
  twitterTitleSchema,
} from '@/lib/schemas/primitives/seo-primitives';

/**
 * Content type validation for OpenGraph
 */
export const openGraphTypeSchema = z.enum([
  'website',
  'article',
  'book',
  'profile',
  'music.song',
  'music.album',
  'music.playlist',
  'music.radio_station',
  'video.movie',
  'video.episode',
  'video.tv_show',
  'video.other',
]);

/**
 * OpenGraph image validation
 */
export const openGraphImageSchema = z.object({
  url: seoUrlSchema,
  alt: seoAltTextSchema.optional(),
  width: imageDimension.optional(),
  height: imageDimension.optional(),
  type: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Invalid image type')
    .optional(),
});

/**
 * OpenGraph metadata validation
 */
export const openGraphSchema = z.object({
  title: ogTitleSchema.optional(),
  description: ogDescriptionSchema.optional(),
  type: openGraphTypeSchema.optional(),
  url: seoUrlSchema.optional(),
  siteName: seoSiteNameSchema.optional(),
  images: z.array(openGraphImageSchema).max(4, 'Maximum 4 OpenGraph images').optional(),
  locale: z
    .string()
    .regex(/^[a-z]{2}(_[A-Z]{2})?$/, 'Invalid locale format (e.g., en_US)')
    .optional(),
  publishedTime: z.string().datetime().optional(),
  modifiedTime: z.string().datetime().optional(),
  authors: authorsArray.optional(),
  tags: seoKeywordsArraySchema,
});

/**
 * Twitter Card metadata validation
 */
export const twitterCardSchema = z.object({
  card: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
  site: z
    .string()
    .regex(TWITTER_HANDLE_REGEX, 'Invalid Twitter handle format')
    .max(SEO_LIMITS.MAX_TWITTER_HANDLE_LENGTH + 1, 'Twitter handle too long')
    .optional(),
  creator: z
    .string()
    .regex(TWITTER_HANDLE_REGEX, 'Invalid Twitter handle format')
    .max(SEO_LIMITS.MAX_TWITTER_HANDLE_LENGTH + 1, 'Twitter handle too long')
    .optional(),
  title: twitterTitleSchema.optional(),
  description: twitterDescriptionSchema.optional(),
  images: smallUrlArray.max(1, 'Maximum 1 Twitter image').optional(),
});

/**
 * Robots meta tag validation
 */
export const robotsSchema = z.object({
  index: z.boolean().optional(),
  follow: z.boolean().optional(),
  noarchive: z.boolean().optional(),
  nosnippet: z.boolean().optional(),
  noimageindex: z.boolean().optional(),
  nocache: z.boolean().optional(),
  notranslate: z.boolean().optional(),
  indexifembedded: z.boolean().optional(),
  nositelinkssearchbox: z.boolean().optional(),
  unavailable_after: z.string().datetime().optional(),
  'max-video-preview': z.number().int().min(-1).max(600).optional(),
  'max-image-preview': z.enum(['none', 'standard', 'large']).optional(),
  'max-snippet': z.number().int().min(-1).max(300).optional(),
});

/**
 * Canonical URL validation
 */
export const canonicalSchema = seoUrlSchema.optional();

/**
 * Alternate language links validation
 */
export const alternatesSchema = z.object({
  canonical: canonicalSchema,
  languages: z
    .record(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code'), seoUrlSchema)
    .optional(),
  media: z
    .record(z.string().regex(/^\([^)]+\)$/, 'Invalid media query format'), seoUrlSchema)
    .optional(),
});

/**
 * Complete SEO metadata validation schema
 */
export const seoMetadataSchema = z
  .object({
    title: seoTitleSchema,
    description: seoDescriptionSchema,
    keywords: seoKeywordsSchema,
    openGraph: openGraphSchema.optional(),
    twitter: twitterCardSchema.optional(),
    robots: robotsSchema.optional(),
    alternates: alternatesSchema.optional(),
    generator: shortString.optional(),
    applicationName: shortString
      .max(50, 'Application name must be 50 characters or less')
      .regex(/^[^<>]*$/, 'HTML tags not allowed')
      .transform((text) => text.trim())
      .optional(),
    referrer: z
      .enum([
        'no-referrer',
        'no-referrer-when-downgrade',
        'origin',
        'origin-when-cross-origin',
        'same-origin',
        'strict-origin',
        'strict-origin-when-cross-origin',
        'unsafe-url',
      ])
      .optional(),
    authors: z
      .array(
        z.object({
          name: seoAuthorNameSchema,
          url: seoUrlSchema.optional(),
        })
      )
      .max(10, 'Maximum 10 authors')
      .optional(),
    creator: seoAuthorNameSchema.optional(),
    publisher: seoAuthorNameSchema.optional(),
    category: shortString
      .max(50, 'Category must be 50 characters or less')
      .regex(/^[^<>]*$/, 'HTML tags not allowed')
      .transform((text) => text.trim())
      .optional(),
    classification: seoAuthorNameSchema.optional(),
  })
  .strict();

/**
 * Page-specific SEO metadata schemas
 */
export const agentSeoMetadataSchema = seoMetadataSchema.extend({
  openGraph: openGraphSchema
    .extend({
      type: z.literal('article'),
    })
    .optional(),
});

export const mcpServerSeoMetadataSchema = seoMetadataSchema.extend({
  openGraph: openGraphSchema
    .extend({
      type: z.literal('article'),
    })
    .optional(),
});

export const jobSeoMetadataSchema = seoMetadataSchema.extend({
  openGraph: openGraphSchema
    .extend({
      type: z.literal('article'),
    })
    .optional(),
});

export const homepageSeoMetadataSchema = seoMetadataSchema.extend({
  openGraph: openGraphSchema
    .extend({
      type: z.literal('website'),
    })
    .optional(),
});

// Auto-generated type exports
export type OpenGraph = z.infer<typeof openGraphSchema>;
export type TwitterCard = z.infer<typeof twitterCardSchema>;
export type Robots = z.infer<typeof robotsSchema>;
export type Alternates = z.infer<typeof alternatesSchema>;

/**
 * Utility functions for SEO validation
 */
export function validateSeoMetadata(
  metadata: z.input<typeof seoMetadataSchema>
): { success: true; data: z.infer<typeof seoMetadataSchema> } | { success: false; error: string } {
  try {
    const data = seoMetadataSchema.parse(metadata);
    return { success: true, data };
  } catch (error) {
    logger.error(
      'SEO metadata validation failed',
      error instanceof Error
        ? error
        : new Error(error instanceof z.ZodError ? error.issues.join(', ') : String(error)),
      {
        metadataKeys: String(typeof metadata === 'object' ? Object.keys(metadata || {}).length : 0),
        metadataType: String(typeof metadata),
      }
    );
    return { success: false, error: 'SEO metadata validation failed' };
  }
}

/**
 * Safe metadata builder with validation
 */
export function buildSeoMetadata(
  baseMetadata: Partial<z.infer<typeof seoMetadataSchema>>
): z.infer<typeof seoMetadataSchema> | null {
  try {
    // Ensure required fields have defaults
    const metadata = {
      title: APP_CONFIG.name,
      description: APP_CONFIG.description,
      ...baseMetadata,
    };

    return seoMetadataSchema.parse(metadata);
  } catch (error) {
    logger.error(
      'Failed to build SEO metadata',
      error instanceof Error
        ? error
        : new Error(error instanceof z.ZodError ? error.issues.join(', ') : String(error)),
      {
        baseMetadataKeys: String(Object.keys(baseMetadata).length),
      }
    );
    return null;
  }
}

/**
 * Extract keywords from text content safely
 */
export function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  if (!text || typeof text !== 'string') return [];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && word.length < 20)
    .filter((word) => !/^\d+$/.test(word)); // Remove pure numbers

  // Remove common stop words
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'this',
    'that',
    'these',
    'those',
  ]);

  const filteredWords = words.filter((word) => !stopWords.has(word));

  // Count frequency and return top keywords
  const frequency: Record<string, number> = {};
  filteredWords.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Type exports
 */
export type SEOMetadata = z.infer<typeof seoMetadataSchema>;
export type OpenGraphMetadata = z.infer<typeof openGraphSchema>;
export type TwitterCardMetadata = z.infer<typeof twitterCardSchema>;
export type RobotsMetadata = z.infer<typeof robotsSchema>;
export type OpenGraphType = z.infer<typeof openGraphTypeSchema>;
export type OpenGraphImage = z.infer<typeof openGraphImageSchema>;
export type SEOTitle = z.infer<typeof seoTitleSchema>;
export type SEODescription = z.infer<typeof seoDescriptionSchema>;
export type SEOKeywords = z.infer<typeof seoKeywordsSchema>;
export type SEOKeywordsArray = z.infer<typeof seoKeywordsArraySchema>;
export type SEOUrl = z.infer<typeof seoUrlSchema>;
export type SEOText = z.infer<typeof seoTextSchema>;
export type AgentSEOMetadata = z.infer<typeof agentSeoMetadataSchema>;
export type MCPServerSEOMetadata = z.infer<typeof mcpServerSeoMetadataSchema>;
export type JobSEOMetadata = z.infer<typeof jobSeoMetadataSchema>;
export type HomepageSEOMetadata = z.infer<typeof homepageSeoMetadataSchema>;
export type AlternatesMetadata = z.infer<typeof alternatesSchema>;
export type CanonicalMetadata = z.infer<typeof canonicalSchema>;
