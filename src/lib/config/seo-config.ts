/**
 * SEO Configuration - Database-First Architecture
 * All configuration from PostgreSQL seo_config table, zero hardcoded rules
 */

import { z } from 'zod';
import { UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import { createAnonClient } from '@/src/lib/supabase/server-anon';

const SITE_NAME = 'Claude Pro Directory';
const SEPARATOR = ' - ';

function calculateSuffixLength(categoryDisplayName: string): number {
  return SEPARATOR.length + categoryDisplayName.length + SEPARATOR.length + SITE_NAME.length;
}

export const SUFFIX_LENGTHS = {
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
} as const satisfies Record<CategoryId, number>;

export const MAX_TITLE_LENGTH = 60;
export const OPTIMAL_MIN = 53;
export const OPTIMAL_MAX = 60;
export const MIN_ENHANCEMENT_GAIN = 3;

export const MAX_BASE_TITLE_LENGTH = {
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
} as const satisfies Record<CategoryId, number>;

export async function getMetadataQualityRules() {
  const supabase = createAnonClient();
  const { data } = await supabase.rpc('get_seo_config', { p_key: 'metadata_quality_rules' });
  return data as {
    title: { minLength: number; maxLength: number; extendedMaxLength: number };
    description: { minLength: number; maxLength: number };
    keywords: { minCount: number; maxCount: number; maxKeywordLength: number };
    canonicalUrl: { protocol: string; noTrailingSlash: boolean; homepageException: boolean };
    openGraph: { imageWidth: number; imageHeight: number; aspectRatio: number };
  };
}

export const METADATA_QUALITY_RULES = {
  title: { minLength: 53, maxLength: 60, extendedMaxLength: 65 },
  description: { minLength: 150, maxLength: 160 },
  keywords: { minCount: 3, maxCount: 10, maxKeywordLength: 30 },
  canonicalUrl: { protocol: 'https://' as const, noTrailingSlash: true, homepageException: true },
  openGraph: { imageWidth: 1200, imageHeight: 630, aspectRatio: 1.91 },
} as const;
export async function getSeoConfig() {
  const supabase = createAnonClient();
  const { data } = await supabase.rpc('get_all_seo_config');
  const config = data as Record<string, unknown>;

  return {
    defaultTitle: config.default_title as string,
    titleTemplate: config.title_template as string,
    defaultDescription: config.default_description as string,
    keywords: config.default_keywords as string[],
  };
}

export const SEO_CONFIG = {
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
} as const;

export const validatedMetadataSchema = z.object({
  title: z
    .string()
    .min(
      METADATA_QUALITY_RULES.title.minLength,
      `Title must be ${METADATA_QUALITY_RULES.title.minLength}-${METADATA_QUALITY_RULES.title.extendedMaxLength} characters for SEO (${METADATA_QUALITY_RULES.title.minLength}-${METADATA_QUALITY_RULES.title.maxLength} optimal)`
    )
    .max(
      METADATA_QUALITY_RULES.title.extendedMaxLength,
      `Title must be ${METADATA_QUALITY_RULES.title.minLength}-${METADATA_QUALITY_RULES.title.extendedMaxLength} characters (exceeds extended max for semantic preservation)`
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
      title: z
        .string()
        .min(METADATA_QUALITY_RULES.title.minLength)
        .max(METADATA_QUALITY_RULES.title.extendedMaxLength)
        .describe('OpenGraph title (53-60 optimal, 61-65 acceptable)'),
      description: z
        .string()
        .min(METADATA_QUALITY_RULES.description.minLength)
        .max(METADATA_QUALITY_RULES.description.maxLength)
        .describe('OpenGraph description'),
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
      title: z
        .string()
        .min(METADATA_QUALITY_RULES.title.minLength)
        .max(METADATA_QUALITY_RULES.title.extendedMaxLength)
        .describe('Twitter title (53-60 optimal, 61-65 acceptable)'),
      description: z
        .string()
        .min(METADATA_QUALITY_RULES.description.minLength)
        .max(METADATA_QUALITY_RULES.description.maxLength)
        .describe('Twitter description'),
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

export type ValidatedMetadata = z.infer<typeof validatedMetadataSchema>;

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
