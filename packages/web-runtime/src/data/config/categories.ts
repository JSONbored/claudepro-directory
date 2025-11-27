import 'server-only';

import type { Database } from '@heyclaude/database-types';

import { isBuildTime } from '../../build-time.ts';
import { getHomepageConfigBundle } from '../../config/static-configs.ts';

function isValidCategoryValue(
  value: unknown
): value is Database['public']['Enums']['content_category'] {
  return typeof value === 'string' && value.length > 0;
}

export function getHomepageFeaturedCategories(): readonly Database['public']['Enums']['content_category'][] {
  if (isBuildTime()) {
    return [];
  }

  // Get static config bundle (synchronous)
  const bundle = getHomepageConfigBundle();
  const config = bundle.homepageConfig;

  const categories = Array.isArray(config['homepage.featured_categories'])
    ? config['homepage.featured_categories'].filter((value) => isValidCategoryValue(value))
    : [];

  return categories as readonly Database['public']['Enums']['content_category'][];
}

export function getHomepageTabCategories(): readonly string[] {
  if (isBuildTime()) {
    return [];
  }

  // Get static config bundle (synchronous)
  const bundle = getHomepageConfigBundle();
  const config = bundle.homepageConfig;

  const categories = config['homepage.tab_categories'];
  return Array.isArray(categories) ? categories.map(String) : [];
}
