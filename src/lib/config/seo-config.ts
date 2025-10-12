/**
 * SEO Configuration
 * Centralized SEO constants for title optimization and metadata validation
 *
 * October 2025 Standards:
 * - Title: 10-60 chars (Google), ≤65 chars (Bing)
 * - Description: 50-160 chars (AI engines prefer concise)
 * - Keywords: 3-10 keywords, max 30 chars each
 * - Canonical: HTTPS, no trailing slash (except homepage)
 * - AI Optimization: Year mentions, freshness signals
 */

import { z } from 'zod';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';

/**
 * Suffix lengths for each category
 * Format: " - {Category} - Claude Pro Directory"
 */
export const SUFFIX_LENGTHS: Record<ContentCategory, number> = {
  // Core content types
  agents: 32, // " - Agents - Claude Pro Directory"
  mcp: 29, // " - Mcp - Claude Pro Directory"
  rules: 31, // " - Rules - Claude Pro Directory"
  commands: 34, // " - Commands - Claude Pro Directory"
  hooks: 31, // " - Hooks - Claude Pro Directory"
  statuslines: 37, // " - Statuslines - Claude Pro Directory"
  collections: 37, // " - Collections - Claude Pro Directory"

  // SEO content types
  guides: 32, // " - Guides - Claude Pro Directory"
  tutorials: 35, // " - Tutorials - Claude Pro Directory"
  comparisons: 37, // " - Comparisons - Claude Pro Directory"
  workflows: 35, // " - Workflows - Claude Pro Directory"
  'use-cases': 36, // " - Use Cases - Claude Pro Directory"
  troubleshooting: 41, // " - Troubleshooting - Claude Pro Directory"
  categories: 36, // " - Categories - Claude Pro Directory"

  // Special types
  jobs: 30, // " - Jobs - Claude Pro Directory"
  changelog: 35, // " - Changelog - Claude Pro Directory"
} as const;

/**
 * Maximum total title length (SEO best practice)
 */
export const MAX_TITLE_LENGTH = 60;

/**
 * Optimal title range for SEO
 */
export const OPTIMAL_MIN = 55;
export const OPTIMAL_MAX = 60;

/**
 * Minimum character gain for enhancement to be applied
 */
export const MIN_ENHANCEMENT_GAIN = 3;

/**
 * Maximum available characters for base title (before suffix) per category
 */
export const MAX_BASE_TITLE_LENGTH: Record<ContentCategory, number> = {
  // Core content types
  agents: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.agents, // 28 chars
  mcp: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.mcp, // 31 chars (most room)
  rules: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.rules, // 29 chars
  commands: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.commands, // 26 chars
  hooks: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.hooks, // 29 chars
  statuslines: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.statuslines, // 23 chars
  collections: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.collections, // 23 chars

  // SEO content types
  guides: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.guides, // 28 chars
  tutorials: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.tutorials, // 25 chars
  comparisons: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.comparisons, // 23 chars
  workflows: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.workflows, // 25 chars
  'use-cases': MAX_TITLE_LENGTH - SUFFIX_LENGTHS['use-cases'], // 24 chars
  troubleshooting: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.troubleshooting, // 19 chars
  categories: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.categories, // 24 chars

  // Special types
  jobs: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.jobs, // 30 chars
  changelog: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.changelog, // 25 chars
} as const;

// ============================================
// METADATA QUALITY RULES & VALIDATION
// ============================================

/**
 * Metadata Quality Rules (2025 SEO Standards)
 * Used for compile-time and runtime validation
 */
export const METADATA_QUALITY_RULES = {
  title: {
    minLength: 55, // Required: 55-60 chars (Google optimal)
    maxLength: 60, // Required: 55-60 chars (Google optimal)
  },
  description: {
    minLength: 150, // Required: 150-160 chars (SEO and AI optimal)
    maxLength: 160, // Required: 150-160 chars (SEO and AI optimal)
  },
  keywords: {
    minCount: 3,
    maxCount: 10,
    maxKeywordLength: 30,
  },
  canonicalUrl: {
    protocol: 'https://' as const,
    noTrailingSlash: true,
    homepageException: true, // Homepage can have trailing slash
  },
  openGraph: {
    imageWidth: 1200,
    imageHeight: 630,
    aspectRatio: 1.91,
  },
} as const;

/**
 * Validated Metadata Schema
 * Enforces ALL SEO rules at type level with Zod
 *
 * Usage:
 * ```typescript
 * const metadata = validatedMetadataSchema.parse(rawMetadata);
 * ```
 */
export const validatedMetadataSchema = z.object({
  title: z
    .string()
    .min(
      METADATA_QUALITY_RULES.title.minLength,
      `Title must be ${METADATA_QUALITY_RULES.title.minLength}-${METADATA_QUALITY_RULES.title.maxLength} characters for SEO`
    )
    .max(
      METADATA_QUALITY_RULES.title.maxLength,
      `Title must be ${METADATA_QUALITY_RULES.title.minLength}-${METADATA_QUALITY_RULES.title.maxLength} characters for SEO`
    )
    .refine((title) => !/[<>{}]/.test(title), {
      message: 'Title contains invalid HTML characters',
    })
    .refine((title) => !(title.includes('undefined') || title.includes('null')), {
      message: 'Title contains placeholder values (undefined/null)',
    })
    .refine((title) => !/\b(lorem ipsum|test|TODO|FIXME|placeholder)\b/i.test(title), {
      message: 'Title contains placeholder text',
    })
    .describe('SEO-optimized page title'),

  description: z
    .string()
    .min(
      METADATA_QUALITY_RULES.description.minLength,
      `Description must be at least ${METADATA_QUALITY_RULES.description.minLength} characters`
    )
    .max(
      METADATA_QUALITY_RULES.description.maxLength,
      `Description should not exceed ${METADATA_QUALITY_RULES.description.maxLength} characters`
    )
    .refine((desc) => !(desc.includes('undefined') || desc.includes('null')), {
      message: 'Description contains placeholder values',
    })
    .refine((desc) => !/\b(lorem ipsum|test data|TODO|FIXME|placeholder)\b/i.test(desc), {
      message: 'Description contains placeholder text',
    })
    .describe('SEO-optimized meta description'),

  keywords: z
    .array(z.string().max(METADATA_QUALITY_RULES.keywords.maxKeywordLength))
    .min(
      METADATA_QUALITY_RULES.keywords.minCount,
      `Must have at least ${METADATA_QUALITY_RULES.keywords.minCount} keywords`
    )
    .max(
      METADATA_QUALITY_RULES.keywords.maxCount,
      `Should not exceed ${METADATA_QUALITY_RULES.keywords.maxCount} keywords`
    )
    .refine((keywords) => keywords.every((k) => k.trim().length > 0), {
      message: 'Keywords cannot be empty strings',
    })
    .optional()
    .describe('SEO keywords'),

  canonicalUrl: z
    .string()
    .url('Canonical URL must be a valid URL')
    .refine((url) => url.startsWith(METADATA_QUALITY_RULES.canonicalUrl.protocol), {
      message: 'Canonical URL must use HTTPS',
    })
    .refine(
      (url) => {
        // Allow trailing slash for homepage only
        if (url === 'https://claudepro.directory/') return true;
        return !url.endsWith('/');
      },
      {
        message: 'Canonical URL should not have trailing slash (except homepage)',
      }
    )
    .describe('Canonical URL for the page'),

  openGraph: z
    .object({
      title: z.string().min(55).max(60).describe('OpenGraph title'),
      description: z.string().min(150).max(160).describe('OpenGraph description'),
      image: z
        .object({
          url: z.string().url().describe('Image URL'),
          width: z
            .literal(METADATA_QUALITY_RULES.openGraph.imageWidth)
            .describe('Image width (1200px for OG)'),
          height: z
            .literal(METADATA_QUALITY_RULES.openGraph.imageHeight)
            .describe('Image height (630px for OG)'),
          alt: z.string().min(20).max(100).describe('Image alt text (descriptive)'),
        })
        .describe('OpenGraph image'),
      type: z.enum(['website', 'article']).describe('OpenGraph type'),
    })
    .describe('OpenGraph metadata'),

  twitter: z
    .object({
      card: z.enum(['summary', 'summary_large_image']).describe('Twitter card type'),
      title: z.string().min(55).max(60).describe('Twitter title'),
      description: z.string().min(150).max(160).describe('Twitter description'),
    })
    .optional()
    .describe('Twitter Card metadata'),

  robots: z
    .object({
      index: z.boolean().describe('Allow indexing'),
      follow: z.boolean().describe('Allow following links'),
    })
    .optional()
    .describe('Robots directives'),

  structuredData: z
    .array(
      z.object({
        '@context': z.literal('https://schema.org').describe('Schema.org context'),
        '@type': z.string().min(1).describe('Schema type'),
        '@id': z.string().url().optional().describe('Schema ID'),
      })
    )
    .min(1, 'Must have at least one structured data schema')
    .optional()
    .describe('Schema.org structured data (JSON-LD)'),
});

/**
 * Type inference from validated metadata schema
 */
export type ValidatedMetadata = z.infer<typeof validatedMetadataSchema>;
