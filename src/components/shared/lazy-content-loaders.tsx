/**
 * Lazy Content Data Loaders - Configuration-Driven
 *
 * Provides chunked imports of content metadata by category.
 * Each loader is a separate dynamic import for optimal code-splitting.
 *
 * Modern 2025 Architecture:
 * - Auto-generates loaders from UNIFIED_CATEGORY_REGISTRY
 * - Zero manual updates when adding new categories
 * - Type-safe with proper inference
 * - Tree-shakeable (only imported categories included in bundle)
 *
 * @see lib/config/category-config.ts - Single source of truth for categories
 */

import type { CategoryId } from '@/src/lib/config/category-config';
import { getAllCategoryIds } from '@/src/lib/config/category-config';

/**
 * Dynamically build lazy content loaders from category registry
 * Modern approach: Configuration-driven, zero hardcoded category lists
 */
function buildLazyContentLoaders(): Record<
  CategoryId,
  () => Promise<readonly Record<string, unknown>[]>
> {
  const loaders = {} as Record<CategoryId, () => Promise<readonly Record<string, unknown>[]>>;

  for (const categoryId of getAllCategoryIds()) {
    // Convert category ID to metadata variable name: agents → agentsMetadata
    const metadataVar = `${categoryId}Metadata`;

    // Create dynamic import for this category
    loaders[categoryId] = () =>
      import(`@/generated/${categoryId}-metadata`).then((m) => m[metadataVar]);
  }

  return loaders;
}

/**
 * Lazy-loaded content metadata by category
 *
 * @description Each category loader is a separate chunk that's only loaded when needed.
 * This prevents loading all content metadata upfront.
 *
 * IMPORTANT: Auto-generated from registry - adding new category requires zero changes here
 */
export const lazyContentLoaders = buildLazyContentLoaders();
