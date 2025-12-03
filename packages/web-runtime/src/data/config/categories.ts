import 'server-only';

import  { type Database } from '@heyclaude/database-types';

import { isBuildTime } from '../../build-time.ts';
import { HOMEPAGE_CONFIG } from '../../config/unified-config.ts';
import { logger } from '../../logger.ts';
import { generateRequestId } from '../../utils/request-id.ts';

function isValidCategoryValue(
  value: unknown
): value is Database['public']['Enums']['content_category'] {
  return typeof value === 'string' && value.length > 0;
}

export function getHomepageFeaturedCategories(): readonly Database['public']['Enums']['content_category'][] {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getHomepageFeaturedCategories',
    module: 'data/config/categories',
  });

  if (isBuildTime()) {
    reqLogger.debug('getHomepageFeaturedCategories: build time, returning empty array');
    return [];
  }

  // Get static config (synchronous)
  const categories = Array.isArray(HOMEPAGE_CONFIG.featured_categories)
    ? HOMEPAGE_CONFIG.featured_categories.filter((value) => isValidCategoryValue(value))
    : [];

  reqLogger.debug('getHomepageFeaturedCategories: loaded categories', {
    categoryCount: categories.length,
  });

  return categories as readonly Database['public']['Enums']['content_category'][];
}

export function getHomepageTabCategories(): readonly string[] {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getHomepageTabCategories',
    module: 'data/config/categories',
  });

  if (isBuildTime()) {
    reqLogger.debug('getHomepageTabCategories: build time, returning empty array');
    return [];
  }

  // Get static config (synchronous)
  const result = Array.isArray(HOMEPAGE_CONFIG.tab_categories) ? HOMEPAGE_CONFIG.tab_categories.map(String) : [];
  
  reqLogger.debug('getHomepageTabCategories: loaded categories', {
    categoryCount: result.length,
  });

  return result;
}
