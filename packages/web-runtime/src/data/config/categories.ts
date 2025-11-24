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
    // Lazy import feature flags to avoid module-level server-only code execution
    const { getHomepageConfig } = await import('../../actions/feature-flags.ts');
    const result = await getHomepageConfig({});
    const config = result?.data;
    if (!config) {
      return [];
    }

    const categories = Array.isArray(config['homepage.featured_categories'])
      ? config['homepage.featured_categories'].filter(isValidCategoryValue)
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
    // Lazy import feature flags to avoid module-level server-only code execution
    const { getHomepageConfig } = await import('../../actions/feature-flags.ts');
    const result = await getHomepageConfig({});
    const config = result?.data;
    if (!config) {
      return [];
    }

    const categories = config['homepage.tab_categories'];
    return Array.isArray(categories) ? categories.map((value) => String(value)) : [];
  } catch {
    return [];
  }
}
