/** Category configuration loader - database-first architecture */

import { cache } from 'react';
// NOTE: getHomepageConfig is NOT imported at module level to avoid server action evaluation
// during static generation. It's lazy-loaded inside functions that need it.
import type { CategoryStatsConfig, UnifiedCategoryConfig } from '@/src/lib/types/component.types';
import type { ContentCategory, ContentType } from '@/src/types/database-overrides';
import { isContentCategory } from '@/src/types/database-overrides';
import {
  ALL_CATEGORY_IDS,
  CACHEABLE_CATEGORY_IDS,
  CATEGORY_CONFIGS,
  HOMEPAGE_CATEGORY_IDS,
} from './category-config.generated';
import { getTabConfigForCategory } from './default-tab-configs';

/**
 * Get all category configs (static, no database query)
 * Cached with React cache() for request-level deduplication
 */
export const getCategoryConfigs = cache(
  (): Record<ContentCategory, UnifiedCategoryConfig<ContentCategory>> => {
    return CATEGORY_CONFIGS;
  }
);

export type { CategoryStatsConfig, ContentType, UnifiedCategoryConfig };
export type { ContentCategory };
export type UnifiedCategoryConfigValue = UnifiedCategoryConfig;

// Re-export from generated file (single source of truth)
export const VALID_CATEGORIES = ALL_CATEGORY_IDS;

/**
 * Get category config by ID (static, no database query)
 * Cached with React cache() for request-level deduplication
 * Merges default tab configurations with generated configs
 */
export const getCategoryConfig = cache(
  (slug: ContentCategory): UnifiedCategoryConfig<ContentCategory> | null => {
    const baseConfig = CATEGORY_CONFIGS[slug];
    if (!baseConfig) return null;

    const tabs = getTabConfigForCategory(slug);
    if (!tabs) return baseConfig;

    return {
      ...baseConfig,
      detailPage: {
        ...baseConfig.detailPage,
        tabs,
      },
    };
  }
);

/**
 * Check if category ID is valid (static)
 * Uses isContentCategory from database-overrides.ts as single source of truth
 */
export function isValidCategory(category: string): category is ContentCategory {
  return isContentCategory(category);
}

// Direct exports (already immutable from generated file)
export { ALL_CATEGORY_IDS as getAllCategoryIds };
export { HOMEPAGE_CATEGORY_IDS as getHomepageCategoryIds };
export { CACHEABLE_CATEGORY_IDS as getCacheableCategoryIds };

/**
 * Get category stats config (static, no database query)
 * Cached with React cache() for request-level deduplication
 */
export const getCategoryStatsConfig = cache((): readonly CategoryStatsConfig[] => {
  return Object.keys(CATEGORY_CONFIGS).map((id, index) => ({
    categoryId: id as ContentCategory,
    icon: CATEGORY_CONFIGS[id as ContentCategory].icon,
    displayText: CATEGORY_CONFIGS[id as ContentCategory].pluralTitle,
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

/** Get homepage featured categories from Statsig homepageConfigs */
export async function getHomepageFeaturedCategories(): Promise<readonly ContentCategory[]> {
  try {
    // CRITICAL: Lazy-load getHomepageConfig to prevent server action evaluation during build
    const { isBuildTime } = await import('@/src/lib/utils/build-time');
    if (isBuildTime()) {
      return [];
    }
    const { getHomepageConfig } = await import('@/src/lib/actions/feature-flags.actions');
    const result = await getHomepageConfig({});
    if (!result?.data) {
      return [];
    }
    const config = result.data;
    const categories = config['homepage.featured_categories'].filter(
      (slug: string): slug is ContentCategory => isValidCategory(slug)
    );
    return categories;
  } catch {
    return [];
  }
}

/** Get homepage tab categories from Statsig homepageConfigs */
export async function getHomepageTabCategories(): Promise<readonly string[]> {
  try {
    // CRITICAL: Lazy-load getHomepageConfig to prevent server action evaluation during build
    const { isBuildTime } = await import('@/src/lib/utils/build-time');
    if (isBuildTime()) {
      return [];
    }
    const { getHomepageConfig } = await import('@/src/lib/actions/feature-flags.actions');
    const result = await getHomepageConfig({});
    if (!result?.data) {
      return [];
    }
    const config = result.data;
    return config['homepage.tab_categories'];
  } catch {
    return [];
  }
}
