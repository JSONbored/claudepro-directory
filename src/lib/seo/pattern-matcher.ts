/**
 * Pattern Matcher - Database-First Context Extraction
 * All category configs from PostgreSQL via optimized RPC calls.
 */

import {
  type CategoryId,
  getCategoryConfig,
  isValidCategory,
} from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import type { RouteClassification } from '@/src/lib/seo/route-classifier';
import { validateContext } from '@/src/lib/seo/validation-schemas';

/**
 * Extract metadata context - database-first
 * @throws Error if validation fails
 */
export async function extractContext(
  classification: RouteClassification,
  params: Record<string, string | string[]> = {},
  item?: unknown
): Promise<MetadataContext> {
  const { pattern, route } = classification;

  // Base context (all patterns)
  const rawContext: MetadataContext = {
    route,
    params,
  };

  // Validate route classification (defensive programming)
  if (!classification.route || classification.route.trim() === '') {
    logger.error('Invalid route classification: empty route', undefined, {
      operation: 'extractContext',
      pattern,
    });
    throw new Error('extractContext: Invalid classification - route is required');
  }

  if (classification.confidence < 0 || classification.confidence > 1) {
    logger.error(
      'Invalid route classification: confidence out of range',
      undefined,
      {
        operation: 'extractContext',
        pattern,
      },
      {
        confidence: classification.confidence,
      }
    );
    throw new Error(
      `extractContext: Invalid classification - confidence must be 0-1, got ${classification.confidence}`
    );
  }

  // Pattern-specific context extraction
  switch (pattern) {
    case 'HOMEPAGE':
      // No additional context needed (static)
      break;

    case 'CATEGORY': {
      const categoryId =
        (typeof params.category === 'string' ? params.category : params.category?.[0]) ||
        route.split('/').filter(Boolean)[0];

      if (categoryId && isValidCategory(categoryId)) {
        const categoryConfig = await getCategoryConfig(categoryId as CategoryId);
        if (!categoryConfig) {
          logger.error('Category config not found in database', undefined, {
            operation: 'extractContext',
            pattern: 'CATEGORY',
            categoryId,
          });
          throw new Error(`extractContext: Category '${categoryId}' config not found`);
        }
        rawContext.categoryConfig = categoryConfig;
        rawContext.category = categoryId;
      }
      break;
    }

    case 'CONTENT_DETAIL': {
      const categoryId =
        (typeof params.category === 'string' ? params.category : params.category?.[0]) ||
        route.split('/').filter(Boolean)[0];

      const slug =
        (typeof params.slug === 'string' ? params.slug : params.slug?.[0]) ||
        route.split('/').filter(Boolean)[1];

      if (categoryId && isValidCategory(categoryId)) {
        const categoryConfig = await getCategoryConfig(categoryId as CategoryId);
        if (!categoryConfig) {
          logger.error('Category config not found in database', undefined, {
            operation: 'extractContext',
            pattern: 'CONTENT_DETAIL',
            categoryId,
          });
          throw new Error(`extractContext: Category '${categoryId}' config not found`);
        }
        rawContext.categoryConfig = categoryConfig;
        rawContext.category = categoryId;
      }

      if (slug) {
        rawContext.slug = slug;
      }

      if (item && typeof item === 'object') {
        rawContext.item = item as MetadataContext['item'];
      }
      break;
    }

    case 'USER_PROFILE': {
      // Extract user slug
      const userSlug =
        (typeof params.slug === 'string' ? params.slug : params.slug?.[0]) ||
        route.split('/').filter(Boolean)[1];

      if (userSlug) {
        rawContext.slug = userSlug;
      }

      // Note: Profile data loading is handled by page component
      // Templates should gracefully handle missing profile data
      break;
    }

    case 'ACCOUNT':
    case 'TOOL':
    case 'STATIC':
    case 'AUTH':
      // These patterns use route-based lookups (no additional context)
      break;
  }

  // Final validation of constructed context (LAYER 1 VALIDATION)
  const validatedContext = validateContext(rawContext, 'extractContext');

  // Production: Return empty context if validation failed (graceful degradation)
  if (!validatedContext) {
    logger.warn('Context validation failed, returning minimal context', {
      operation: 'extractContext',
      pattern,
      route,
    });
    // Return minimal valid context
    return {
      route,
      params,
    };
  }

  return validatedContext;
}
