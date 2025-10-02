/**
 * Lazy Content Data Loaders
 *
 * Provides chunked imports of content metadata by category.
 * Each loader is a separate dynamic import for optimal code-splitting.
 */

/**
 * Lazy-loaded content metadata by category
 *
 * @description Each category loader is a separate chunk that's only loaded when needed.
 * This prevents loading all content metadata upfront.
 */
export const lazyContentLoaders = {
  agents: () => import('../../generated/agents-metadata').then((m) => m.agentsMetadata),
  mcp: () => import('../../generated/mcp-metadata').then((m) => m.mcpMetadata),
  rules: () => import('../../generated/rules-metadata').then((m) => m.rulesMetadata),
  commands: () => import('../../generated/commands-metadata').then((m) => m.commandsMetadata),
  hooks: () => import('../../generated/hooks-metadata').then((m) => m.hooksMetadata),
  statuslines: () =>
    import('../../generated/statuslines-metadata').then((m) => m.statuslinesMetadata),
};

/**
 * Creates a memoized lazy loader with caching and error handling
 *
 * @description Wraps a dynamic import with:
 * - In-memory caching to prevent duplicate loads
 * - Promise deduplication to prevent concurrent loads
 * - Graceful error handling with fallback value
 *
 * @template T - Type of data being loaded
 * @param loader - Async function that loads the data
 * @param fallback - Fallback value if load fails
 * @returns Memoized loader function
 */
export function createLazyContentLoader<T>(
  loader: () => Promise<T>,
  fallback: T
): () => Promise<T> {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;

  return async () => {
    if (cached) return cached;
    if (loading) return loading;

    loading = loader()
      .then((result) => {
        cached = result;
        loading = null;
        return result;
      })
      .catch(() => {
        loading = null;
        return fallback;
      });

    return loading;
  };
}
