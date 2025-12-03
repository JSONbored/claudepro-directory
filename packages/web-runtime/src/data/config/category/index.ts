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

export { VALID_CATEGORIES, isValidCategory } from '../../../utils/category-validation.ts';

export const getCategoryStatsConfig = (): readonly CategoryStatsConfig[] => {
  return Object.keys(CATEGORY_CONFIGS).map((id, index) => ({
    categoryId: id as Database['public']['Enums']['content_category'],
    icon: CATEGORY_CONFIGS[id as Database['public']['Enums']['content_category']].icon,
    displayText:
      CATEGORY_CONFIGS[id as Database['public']['Enums']['content_category']].pluralTitle,
    delay: index * 100,
  }));
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
  ALL_CATEGORY_IDS as getAllCategoryIds,
  HOMEPAGE_CATEGORY_IDS,
  HOMEPAGE_CATEGORY_IDS as getHomepageCategoryIds,
  CACHEABLE_CATEGORY_IDS,
  CACHEABLE_CATEGORY_IDS as getCacheableCategoryIds,
} from './category-config.ts';
