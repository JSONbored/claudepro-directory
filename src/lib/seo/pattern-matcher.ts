/**
 * Pattern Matcher - Context Extraction for Metadata Templates
 *
 * **Enterprise Pattern-Based Metadata Architecture (October 2025)**
 *
 * Extracts proper context data for each route pattern from various sources:
 * - UNIFIED_CATEGORY_REGISTRY (category data)
 * - Route params (dynamic segments)
 * - Content schemas (via schema adapter)
 * - User profiles (Supabase)
 * - Static route mappings
 *
 * **Architecture:**
 * - Single Responsibility: Context extraction only (no metadata generation)
 * - Type-Safe: Full TypeScript support with proper MetadataContext typing
 * - Zero Duplication: Leverages existing single sources of truth
 * - Synchronous: Fully synchronous for optimal Next.js metadata generation
 *
 * **Usage:**
 * ```typescript
 * const classification = classifyRoute('/agents');
 * const context = await extractContext(classification, { category: 'agents' });
 * // Returns: { route: '/agents', params: {...}, categoryConfig: {...} }
 * ```
 *
 * @module lib/seo/pattern-matcher
 */

import { isValidCategory, UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import type { RouteClassification } from '@/src/lib/seo/route-classifier';

/**
 * Extract metadata context for a classified route
 *
 * Takes a route classification and dynamic params, returns complete context
 * needed for metadata template generation. Handles async data loading for
 * patterns that require database queries (USER_PROFILE).
 *
 * **Context Sources:**
 * - HOMEPAGE: Static (no dynamic data)
 * - CATEGORY: UNIFIED_CATEGORY_REGISTRY
 * - CONTENT_DETAIL: Schema adapter + UNIFIED_CATEGORY_REGISTRY
 * - USER_PROFILE: Supabase users table (async)
 * - ACCOUNT: Route params only
 * - TOOL: Route params only
 * - STATIC: Route params only
 * - AUTH: Static (no dynamic data)
 *
 * @param classification - Route classification from classifyRoute()
 * @param params - Dynamic route params from Next.js (e.g., { category: 'agents', slug: 'code-reviewer' })
 * @param item - Optional content item data (for CONTENT_DETAIL pattern)
 * @returns MetadataContext - Complete context for template rendering
 *
 * @example
 * ```typescript
 * // CATEGORY pattern
 * const classification = classifyRoute('/agents');
 * const context = await extractContext(classification, { category: 'agents' });
 * // context.categoryConfig = { id: 'agents', title: 'Agent', ... }
 *
 * // CONTENT_DETAIL pattern
 * const classification = classifyRoute('/agents/code-reviewer');
 * const context = await extractContext(classification,
 *   { category: 'agents', slug: 'code-reviewer' },
 *   { title: 'Code Reviewer', description: '...' }
 * );
 * // context.categoryConfig + context.item populated
 * ```
 */
export function extractContext(
  classification: RouteClassification,
  params: Record<string, string | string[]> = {},
  item?: unknown
): MetadataContext {
  const { pattern, route } = classification;

  // Base context (all patterns)
  const context: MetadataContext = {
    route,
    params,
  };

  // Pattern-specific context extraction
  switch (pattern) {
    case 'HOMEPAGE':
      // No additional context needed (static)
      break;

    case 'CATEGORY': {
      // Extract category from params or route segments
      const categoryId =
        (typeof params.category === 'string' ? params.category : params.category?.[0]) ||
        route.split('/').filter(Boolean)[0];

      if (categoryId && isValidCategory(categoryId)) {
        context.categoryConfig = UNIFIED_CATEGORY_REGISTRY[categoryId];
        context.category = categoryId;
      }
      break;
    }

    case 'CONTENT_DETAIL': {
      // Extract category and slug
      const categoryId =
        (typeof params.category === 'string' ? params.category : params.category?.[0]) ||
        route.split('/').filter(Boolean)[0];

      const slug =
        (typeof params.slug === 'string' ? params.slug : params.slug?.[0]) ||
        route.split('/').filter(Boolean)[1];

      if (categoryId && isValidCategory(categoryId)) {
        context.categoryConfig = UNIFIED_CATEGORY_REGISTRY[categoryId];
        context.category = categoryId;
      }

      if (slug) {
        context.slug = slug;
      }

      // Add item data if provided (from schema adapter or page data)
      if (item && typeof item === 'object') {
        context.item = item as MetadataContext['item'];
      }
      break;
    }

    case 'USER_PROFILE': {
      // Extract user slug
      const userSlug =
        (typeof params.slug === 'string' ? params.slug : params.slug?.[0]) ||
        route.split('/').filter(Boolean)[1];

      if (userSlug) {
        context.slug = userSlug;
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

  return context;
}
