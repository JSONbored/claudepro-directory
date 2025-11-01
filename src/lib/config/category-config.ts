/**
 * Category Configuration - Database-First Architecture
 * Single source of truth: category_configs table in PostgreSQL
 * Config generated at build time by scripts/build/generate-category-config.ts
 */

import type { z } from 'zod';
import type { LucideIcon } from '@/src/lib/icons';
import type { Tables } from '@/src/types/database.types';
import {
  ALL_CATEGORY_IDS,
  CACHEABLE_CATEGORY_IDS,
  CATEGORY_CONFIGS,
  HOMEPAGE_CATEGORY_IDS,
} from './category-config.generated';

export type ContentType = Tables<'content'> | Tables<'jobs'>;

type DatabaseCategoryConfig = Tables<'category_configs'>;

export type CategoryId = DatabaseCategoryConfig['category'];

export interface UnifiedCategoryConfig<
  T extends ContentType = ContentType,
  TId extends string = string,
> {
  readonly id: TId;
  title: string;
  pluralTitle: string;
  description: string;
  icon: LucideIcon;
  colorScheme: string;
  showOnHomepage: boolean;
  keywords: string;
  metaDescription: string;
  readonly schema: z.ZodType<T>;
  readonly typeName: string;
  readonly generateFullContent: boolean;
  readonly metadataFields: ReadonlyArray<string>;
  readonly buildConfig: {
    readonly batchSize: number;
    readonly enableCache: boolean;
    readonly cacheTTL: number;
  };
  readonly apiConfig: {
    readonly generateStaticAPI: boolean;
    readonly includeTrending: boolean;
    readonly maxItemsPerResponse: number;
  };
  listPage: {
    searchPlaceholder: string;
    badges: Array<{ icon?: string; text: string | ((count: number) => string) }>;
    emptyStateMessage?: string;
  };
  detailPage: {
    displayConfig: boolean;
    configFormat: 'json' | 'multi' | 'hook';
  };
  sections: {
    features: boolean;
    installation: boolean;
    use_cases: boolean;
    configuration: boolean;
    security: boolean;
    troubleshooting: boolean;
    examples: boolean;
  };
  metadata?: {
    categoryLabel?: string;
    showGitHubLink?: boolean;
    githubPathPrefix?: string;
  };
  primaryAction: {
    label: string;
    type: string;
  };
  secondaryActions?: Array<{
    label: string;
    type: string;
  }>;
  urlSlug: string;
  contentLoader: string;
  [key: string]: unknown;
}

/**
 * Get all category configs (static, no database query)
 */
export function getCategoryConfigs(): Record<
  CategoryId,
  UnifiedCategoryConfig<ContentType, CategoryId>
> {
  return CATEGORY_CONFIGS;
}

export type UnifiedCategoryConfigValue = UnifiedCategoryConfig;

export const VALID_CATEGORIES: readonly CategoryId[] = [
  'agents',
  'mcp',
  'commands',
  'rules',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const;

/**
 * Get category config by ID (static, no database query)
 */
export function getCategoryConfig(slug: CategoryId): UnifiedCategoryConfigValue | null {
  return CATEGORY_CONFIGS[slug] || null;
}

/**
 * Check if category ID is valid (static)
 */
export function isValidCategory(category: string): category is CategoryId {
  return VALID_CATEGORIES.includes(category as CategoryId);
}

/**
 * Get all category IDs (static, no database query)
 */
export function getAllCategoryIds(): CategoryId[] {
  return [...ALL_CATEGORY_IDS];
}

/**
 * Get homepage category IDs (static, no database query)
 */
export function getHomepageCategoryIds(): CategoryId[] {
  return [...HOMEPAGE_CATEGORY_IDS];
}

/**
 * Get cacheable category IDs (static, no database query)
 */
export function getCacheableCategoryIds(): CategoryId[] {
  return [...CACHEABLE_CATEGORY_IDS];
}

export const HOMEPAGE_FEATURED_CATEGORIES = [
  'agents',
  'mcp',
  'commands',
  'rules',
] as const satisfies readonly CategoryId[];
export const HOMEPAGE_TAB_CATEGORIES = [
  'all',
  'agents',
  'mcp',
  'commands',
  'rules',
  'hooks',
  'statuslines',
  'collections',
  'guides',
  'community',
] as const;

export type HomepageFeaturedCategory = (typeof HOMEPAGE_FEATURED_CATEGORIES)[number];
export type HomepageTabCategory = (typeof HOMEPAGE_TAB_CATEGORIES)[number];

export interface CategoryStatsConfig {
  categoryId: CategoryId;
  icon: LucideIcon;
  displayText: string;
  delay: number;
}

/**
 * Get category stats config (static, no database query)
 */
export function getCategoryStatsConfig(): readonly CategoryStatsConfig[] {
  return Object.keys(CATEGORY_CONFIGS).map((id, index) => ({
    categoryId: id as CategoryId,
    icon: CATEGORY_CONFIGS[id as CategoryId].icon,
    displayText: CATEGORY_CONFIGS[id as CategoryId].pluralTitle,
    delay: index * 100,
  }));
}

export function getTotalResourceCount(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, count) => sum + count, 0);
}

export const NEWSLETTER_CTA_CONFIG = {
  title: 'Get the latest Claude resources',
  headline: 'Get the latest Claude resources',
  description: 'Weekly roundup of the best Claude agents, tools, and guides.',
  ctaText: 'Subscribe',
  buttonText: 'Subscribe',
  footerText: 'No spam. Unsubscribe anytime.',
} as const;
