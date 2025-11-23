import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cache } from 'react';
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

export const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isContentCategory(
  value: unknown
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
}

export type UnifiedCategoryConfigValue = UnifiedCategoryConfig;

export const getCategoryConfigs = cache(
  (): Record<
    Database['public']['Enums']['content_category'],
    UnifiedCategoryConfig<Database['public']['Enums']['content_category']>
  > => CATEGORY_CONFIGS
);

export const getCategoryConfig = cache(
  (
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
  }
);

export function isValidCategory(
  category: string | Database['public']['Enums']['content_category'] | null | undefined
): category is Database['public']['Enums']['content_category'] {
  return (
    category !== null &&
    category !== undefined &&
    typeof category === 'string' &&
    isContentCategory(category)
  );
}

export { ALL_CATEGORY_IDS as getAllCategoryIds };
export { HOMEPAGE_CATEGORY_IDS as getHomepageCategoryIds };
export { CACHEABLE_CATEGORY_IDS as getCacheableCategoryIds };

export const VALID_CATEGORIES = ALL_CATEGORY_IDS;

export const getCategoryStatsConfig = cache(
  (): readonly CategoryStatsConfig[] => {
    return Object.keys(CATEGORY_CONFIGS).map((id, index) => ({
      categoryId: id as Database['public']['Enums']['content_category'],
      icon: CATEGORY_CONFIGS[id as Database['public']['Enums']['content_category']].icon,
      displayText:
        CATEGORY_CONFIGS[id as Database['public']['Enums']['content_category']].pluralTitle,
      delay: index * 100,
    }));
  }
);

export function getTotalResourceCount(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, count) => sum + count, 0);
}
