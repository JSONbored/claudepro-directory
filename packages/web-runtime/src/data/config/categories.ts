import 'server-only';
import { type content_category } from '@heyclaude/data-layer/prisma';
import { ContentCategory } from '@heyclaude/data-layer/prisma';

import { isBuildTime } from '../../build-time.ts';
import { getHomepageConfigBundle } from '../../config/static-configs.ts';
import { logger } from '../../logger.ts';

// Use Prisma-generated enum values directly - no manual arrays!
const CONTENT_CATEGORY_VALUES = Object.values(ContentCategory) as readonly content_category[];

function isValidCategoryValue(value: unknown): value is content_category {
  return typeof value === 'string' && CONTENT_CATEGORY_VALUES.includes(value as content_category);
}

export function getHomepageFeaturedCategories(): readonly content_category[] {
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'data/config/categories',
    operation: 'getHomepageFeaturedCategories',
  });

  if (isBuildTime()) {
    reqLogger.debug({}, 'getHomepageFeaturedCategories: build time, returning empty array');
    return [];
  }

  // Get static config bundle (synchronous)
  // Note: getHomepageConfigBundle() always returns a valid bundle with homepageConfig
  const bundle = getHomepageConfigBundle();
  const config = bundle.homepageConfig;

  const categories = Array.isArray(config['homepage.featured_categories'])
    ? config['homepage.featured_categories'].filter((value) => isValidCategoryValue(value))
    : [];

  reqLogger.debug(
    { categoryCount: categories.length },
    'getHomepageFeaturedCategories: loaded categories'
  );

  return categories as readonly content_category[];
}

export function getHomepageTabCategories(): readonly string[] {
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'data/config/categories',
    operation: 'getHomepageTabCategories',
  });

  if (isBuildTime()) {
    reqLogger.debug({}, 'getHomepageTabCategories: build time, returning empty array');
    return [];
  }

  // Get static config bundle (synchronous)
  // Note: getHomepageConfigBundle() always returns a valid bundle with homepageConfig
  const bundle = getHomepageConfigBundle();
  const config = bundle.homepageConfig;

  const categories = config['homepage.tab_categories'];
  const result = Array.isArray(categories) ? categories.map(String) : [];

  reqLogger.debug({ categoryCount: result.length }, 'getHomepageTabCategories: loaded categories');

  return result;
}
