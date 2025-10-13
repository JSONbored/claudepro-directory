/**
 * Modern Lazy Content Loaders (2025)
 *
 * Factory-based lazy loading system with dynamic loader generation.
 * Consolidates repetitive loader definitions using config-driven architecture.
 *
 * Performance improvements:
 * - Dynamic loader generation from category config
 * - Type-safe generic helpers
 * - Automatic cache management
 *
 * Reduction: ~50 lines through factory pattern consolidation
 *
 * @see lib/config/build-category-config.ts - Category configuration
 */

import type { BuildCategoryId } from '@/src/lib/config/build-category-config';
import { getAllBuildCategoryConfigs } from '@/src/lib/config/build-category-config';
import { BatchLazyLoader } from '@/src/lib/utils/integration.utils';

/**
 * Factory function to create metadata loaders dynamically
 * Modern approach: Dynamic import path generation
 *
 * @param categoryId - Category identifier
 * @returns Loader function for metadata
 */
function createMetadataLoaderFactory(categoryId: BuildCategoryId) {
  const varName = categoryId.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return () =>
    import(`@/generated/${categoryId}-metadata`).then((m) => {
      const metadataKey = `${varName}Metadata`;
      return m[metadataKey];
    });
}

/**
 * Batch loader for all metadata files
 * Modern approach: Dynamic generation from config
 */
export const metadataLoader = new BatchLazyLoader(
  Object.fromEntries(
    getAllBuildCategoryConfigs().map((config) => {
      const varName = config.id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      return [`${varName}Metadata`, createMetadataLoaderFactory(config.id as BuildCategoryId)];
    })
  ),
  {
    preloadKeys: [],
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
  }
);
