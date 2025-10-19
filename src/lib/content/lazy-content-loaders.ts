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
 * @see lib/config/category-config.ts - Unified category configuration
 */

import type { CategoryId } from '@/src/lib/config/category-config';
import { UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import { BatchLazyLoader } from '@/src/lib/utils/integration.utils';

/**
 * Factory function to create metadata loaders dynamically
 * Vite-compatible approach: Explicit import mapping for static analysis
 *
 * @param categoryId - Category identifier
 * @returns Loader function for metadata
 */
function createMetadataLoaderFactory(categoryId: CategoryId) {
  const varName = categoryId.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

  // Explicit imports for Vite static analysis
  // Vite requires the static part of dynamic imports to be analyzable
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic imports return varying module structures per category
  const loaderMap: Record<CategoryId, () => Promise<any>> = {
    agents: () => import('@/generated/agents-metadata'),
    mcp: () => import('@/generated/mcp-metadata'),
    commands: () => import('@/generated/commands-metadata'),
    rules: () => import('@/generated/rules-metadata'),
    hooks: () => import('@/generated/hooks-metadata'),
    statuslines: () => import('@/generated/statuslines-metadata'),
    skills: () => import('@/generated/skills-metadata'),
    collections: () => import('@/generated/collections-metadata'),
    guides: () => import('@/generated/guides-metadata'),
    jobs: () => import('@/generated/jobs-metadata'),
    changelog: () => import('@/generated/changelog-metadata'),
  };

  return () =>
    loaderMap[categoryId]().then((m) => {
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
    Object.values(UNIFIED_CATEGORY_REGISTRY).map((config) => {
      const varName = config.id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      return [`${varName}Metadata`, createMetadataLoaderFactory(config.id)];
    })
  ),
  {
    preloadKeys: [],
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
  }
);
