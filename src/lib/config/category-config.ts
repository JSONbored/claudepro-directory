/** Category configuration loader - database-first architecture */

import { cache } from 'react';
import {
  ALL_CATEGORY_IDS,
  CACHEABLE_CATEGORY_IDS,
  CATEGORY_CONFIGS,
  HOMEPAGE_CATEGORY_IDS,
} from './category-config.generated';
import type {
  CategoryId,
  CategoryStatsConfig,
  ContentType,
  UnifiedCategoryConfig,
} from './category-config.types';

/**
 * Get all category configs (static, no database query)
 * Cached with React cache() for request-level deduplication
 */
export const getCategoryConfigs = cache(
  (): Record<CategoryId, UnifiedCategoryConfig<CategoryId>> => {
    return CATEGORY_CONFIGS;
  }
);

export type { CategoryId, CategoryStatsConfig, ContentType, UnifiedCategoryConfig };
export type UnifiedCategoryConfigValue = UnifiedCategoryConfig;

// Re-export from generated file (single source of truth)
export const VALID_CATEGORIES = ALL_CATEGORY_IDS;

/**
 * Get category config by ID (static, no database query)
 * Cached with React cache() for request-level deduplication
 */
export const getCategoryConfig = cache((slug: CategoryId): UnifiedCategoryConfigValue | null => {
  return CATEGORY_CONFIGS[slug] || null;
});

/**
 * Check if category ID is valid (static)
 */
export function isValidCategory(category: string): category is CategoryId {
  return VALID_CATEGORIES.includes(category as CategoryId);
}

// Direct exports (already immutable from generated file)
export { ALL_CATEGORY_IDS as getAllCategoryIds };
export { HOMEPAGE_CATEGORY_IDS as getHomepageCategoryIds };
export { CACHEABLE_CATEGORY_IDS as getCacheableCategoryIds };

export const HOMEPAGE_FEATURED_CATEGORIES = [
  'agents',
  'mcp',
  'commands',
  'rules',
  'skills',
  'collections',
  'hooks',
  'statuslines',
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

/**
 * Get category stats config (static, no database query)
 * Cached with React cache() for request-level deduplication
 */
export const getCategoryStatsConfig = cache((): readonly CategoryStatsConfig[] => {
  return Object.keys(CATEGORY_CONFIGS).map((id, index) => ({
    categoryId: id as CategoryId,
    icon: CATEGORY_CONFIGS[id as CategoryId].icon,
    displayText: CATEGORY_CONFIGS[id as CategoryId].pluralTitle,
    delay: index * 100,
  }));
});

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
