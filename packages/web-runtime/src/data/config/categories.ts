import 'server-only';

import type { Database } from '@heyclaude/database-types';

import { isBuildTime } from '../../build-time.ts';
// Lazy import feature flags to avoid module-level server-only code execution
// import { getHomepageConfig } from '../../actions/feature-flags.ts';

function isValidCategoryValue(
  value: unknown
): value is Database['public']['Enums']['content_category'] {
  return typeof value === 'string' && value.length > 0;
}

export async function getHomepageFeaturedCategories(): Promise<
  readonly Database['public']['Enums']['content_category'][]
> {
  if (isBuildTime()) {
    return [];
  }

  try {
    // OPTIMIZATION: Use config bundle instead of separate call
    // Lazy import feature flags to avoid module-level server-only code execution
    const { getHomepageConfigBundle } = await import('../../actions/feature-flags.ts');
    const bundle = await getHomepageConfigBundle();
    const config = bundle.homepageConfig;

    const categories = Array.isArray(config['homepage.featured_categories'])
      ? config['homepage.featured_categories'].filter((value) => isValidCategoryValue(value))
      : [];

    return categories as readonly Database['public']['Enums']['content_category'][];
  } catch {
    return [];
  }
}

export async function getHomepageTabCategories(): Promise<readonly string[]> {
  if (isBuildTime()) {
    return [];
  }

  try {
    // OPTIMIZATION: Use config bundle instead of separate call
    // Lazy import feature flags to avoid module-level server-only code execution
    const { getHomepageConfigBundle } = await import('../../actions/feature-flags.ts');
    const bundle = await getHomepageConfigBundle();
    const config = bundle.homepageConfig;

    const categories = config['homepage.tab_categories'];
    return Array.isArray(categories) ? categories.map(String) : [];
  } catch {
    return [];
  }
}
