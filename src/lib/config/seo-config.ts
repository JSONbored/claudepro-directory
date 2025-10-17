/**
 * SEO Configuration
 * Centralized SEO constants for title optimization, metadata validation, and structured data
 *
 * October 2025 Standards:
 * - Title: 55-60 chars (Google optimal)
 * - Description: 150-160 chars (AI engines prefer concise)
 * - Keywords: 3-10 keywords, max 30 chars each
 * - Canonical: HTTPS, no trailing slash (except homepage)
 * - AI Optimization: Year mentions, freshness signals
 *
 * Title Generation Architecture:
 * All page titles generated via metadata-registry.ts helpers:
 * - buildPageTitle(): Static pages (homepage, trending, etc.)
 * - buildContentTitle(): Content pages with smart truncation
 * - smartTruncate(): Word-boundary-aware title truncation
 *
 * Consolidation: Moved from src/lib/constants.ts
 * - SEO_CONFIG (core SEO settings)
 * - SCHEMA_ORG (structured data)
 * - OG_IMAGE_SIZE (social media images)
 *
 * @see src/lib/seo/metadata-registry.ts
 */

import { z } from 'zod';
/**
 * Suffix lengths for each category
 * Format: " - {Category} - Claude Pro Directory"
 *
 * Fully derived from UNIFIED_CATEGORY_REGISTRY (single source of truth).
 * All categories are calculated dynamically from registry.pluralTitle.
 */
import { UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';

const SITE_NAME = 'Claude Pro Directory'; // 20 chars
const SEPARATOR = ' - '; // 3 chars

// Calculate suffix length: " - {CategoryName} - Claude Pro Directory"
function calculateSuffixLength(categoryDisplayName: string): number {
  return SEPARATOR.length + categoryDisplayName.length + SEPARATOR.length + SITE_NAME.length;
}

// Derive suffix lengths from registry - fully registry-driven
export const SUFFIX_LENGTHS = {
  // Core content types (derived from registry)
  agents: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.agents.pluralTitle),
  mcp: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.mcp.pluralTitle),
  rules: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.rules.pluralTitle),
  commands: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.commands.pluralTitle),
  hooks: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.hooks.pluralTitle),
  statuslines: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.statuslines.pluralTitle),
  collections: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.collections.pluralTitle),
  skills: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.skills.pluralTitle),
  guides: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.guides.pluralTitle),
  jobs: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.jobs.pluralTitle),
  changelog: calculateSuffixLength(UNIFIED_CATEGORY_REGISTRY.changelog.pluralTitle),
} as const satisfies Record<ContentCategory, number>;

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
 * Fully derived from UNIFIED_CATEGORY_REGISTRY
 */
export const MAX_BASE_TITLE_LENGTH = {
  // Core content types
  agents: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.agents,
  mcp: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.mcp,
  rules: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.rules,
  commands: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.commands,
  hooks: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.hooks,
  statuslines: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.statuslines,
  collections: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.collections,
  skills: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.skills,
  guides: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.guides,
  jobs: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.jobs,
  changelog: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.changelog,
} as const satisfies Record<ContentCategory, number>;

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

// ============================================
// CONSOLIDATED SEO CONFIGURATION
// ============================================

/**
 * SEO Configuration Schema
 * Core SEO settings for title, description, and keywords
 * Moved from src/lib/constants.ts for better organization
 */
const seoConfigSchema = z.object({
  defaultTitle: z.string().min(1).max(60),
  titleTemplate: z.string().includes('%s'),
  defaultDescription: z.string().min(10).max(160),
  keywords: z.array(z.string().min(1)).min(1),
});

export const SEO_CONFIG = seoConfigSchema.parse({
  defaultTitle: 'Claude Pro Directory',
  titleTemplate: '%s - Claude Pro Directory',
  defaultDescription:
    'Open-source directory of 150+ Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.',
  keywords: [
    'claude ai',
    'claude pro',
    'mcp servers',
    'claude agents',
    'claude hooks',
    'claude rules',
    'claude commands',
    'ai development',
    'claude directory',
  ],
});

/**
 * Schema.org Structured Data
 * JSON-LD structured data for SEO and search engines
 * Moved from src/lib/constants.ts for better organization
 */
export const SCHEMA_ORG = {
  organization: {
    '@type': 'Organization',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    description: APP_CONFIG.description,
  },
  website: {
    '@type': 'WebSite',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    description: SEO_CONFIG.defaultDescription,
  },
} as const;

/**
 * OpenGraph Image Configuration
 * Standard image dimensions for social media sharing
 * Moved from src/lib/constants.ts for better organization
 */
export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;
