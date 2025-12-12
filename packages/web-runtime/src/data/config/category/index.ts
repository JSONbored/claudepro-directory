import { type Database } from '@heyclaude/database-types';

import { type CategoryStatsConfig, type UnifiedCategoryConfig } from '../../../types/category.ts';

import { CATEGORY_CONFIGS } from './category-config.ts';
import { getTabConfigForCategory } from './default-tab-configs.ts';

export const getCategoryConfigs = (): Record<
  Database['public']['Enums']['content_category'],
  UnifiedCategoryConfig<Database['public']['Enums']['content_category']>
> => CATEGORY_CONFIGS;

export const getCategoryConfig = (
  slug: Database['public']['Enums']['content_category']
): null | UnifiedCategoryConfig<Database['public']['Enums']['content_category']> => {
  const baseConfig = CATEGORY_CONFIGS[slug];

  const tabs = getTabConfigForCategory(slug);
  if (!tabs) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    detailPage: {
      ...baseConfig.detailPage,
      tabs,
    },
  };
};

export { isValidCategory, VALID_CATEGORIES } from '../../../utils/category-validation.ts';

export const getCategoryStatsConfig = (): readonly CategoryStatsConfig[] => {
  // Iterate over CATEGORY_CONFIGS entries directly to satisfy TypeScript's type system.
  // This ensures TypeScript knows config exists and is properly typed.
  const entries = Object.entries(CATEGORY_CONFIGS) as Array<
    [
      Database['public']['Enums']['content_category'],
      UnifiedCategoryConfig<Database['public']['Enums']['content_category']>,
    ]
  >;

  return entries.map(([categoryId, config], index): CategoryStatsConfig => {
    // Explicitly type the return to ensure type safety
    const statsConfig: CategoryStatsConfig = {
      categoryId,
      delay: index * 100,
      displayText: config.pluralTitle,
      icon: config.icon,
    };
    return statsConfig;
  });
};

/**
 * Compute the total sum of numeric resource counts in the provided stats map.
 *
 * @param {Record<string, number>} stats - Mapping of resource identifiers to their numeric counts.
 * @returns {number} The sum of all counts in `stats`; returns 0 when `stats` is empty.
 * ⚠️ Client-Compatible
 */
export function getTotalResourceCount(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, count) => sum + count, 0);
}

export {
  ALL_CATEGORY_IDS,
  CACHEABLE_CATEGORY_IDS,
  ALL_CATEGORY_IDS as getAllCategoryIds,
  CACHEABLE_CATEGORY_IDS as getCacheableCategoryIds,
  HOMEPAGE_CATEGORY_IDS as getHomepageCategoryIds,
  HOMEPAGE_CATEGORY_IDS,
} from './category-config.ts';
