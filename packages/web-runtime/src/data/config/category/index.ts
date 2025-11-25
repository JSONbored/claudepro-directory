import type { Database } from '@heyclaude/database-types';
import type {
  CategoryStatsConfig,
  UnifiedCategoryConfig,
} from '../../../types/category.ts';
import {
  ALL_CATEGORY_IDS,
  CACHEABLE_CATEGORY_IDS,
  CATEGORY_CONFIGS,
  HOMEPAGE_CATEGORY_IDS,
} from './category-config.generated.ts';
import { getTabConfigForCategory } from './default-tab-configs.ts';
import { isValidCategory } from '../../../utils/category-validation.ts';

export const getCategoryConfigs = (): Record<
  Database['public']['Enums']['content_category'],
  UnifiedCategoryConfig<Database['public']['Enums']['content_category']>
> => CATEGORY_CONFIGS;

export const getCategoryConfig = (
  slug: Database['public']['Enums']['content_category']
): UnifiedCategoryConfig<Database['public']['Enums']['content_category']> | null => {
  const baseConfig = CATEGORY_CONFIGS[slug];
  if (!baseConfig) {
    return null;
  }

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

export { ALL_CATEGORY_IDS, HOMEPAGE_CATEGORY_IDS, CACHEABLE_CATEGORY_IDS };
export { ALL_CATEGORY_IDS as getAllCategoryIds };
export { HOMEPAGE_CATEGORY_IDS as getHomepageCategoryIds };
export { CACHEABLE_CATEGORY_IDS as getCacheableCategoryIds };
export { isValidCategory };

export { VALID_CATEGORIES } from '../../../utils/category-validation.ts';

export const getCategoryStatsConfig = (): readonly CategoryStatsConfig[] => {
  return Object.keys(CATEGORY_CONFIGS).map((id, index) => ({
    categoryId: id as Database['public']['Enums']['content_category'],
    icon: CATEGORY_CONFIGS[id as Database['public']['Enums']['content_category']].icon,
    displayText:
      CATEGORY_CONFIGS[id as Database['public']['Enums']['content_category']].pluralTitle,
    delay: index * 100,
  }));
};


export function getTotalResourceCount(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, count) => sum + count, 0);
}
