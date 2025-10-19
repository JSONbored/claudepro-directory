/**
 * Cache Server - Storybook Mock
 *
 * Browser-compatible mock that doesn't import Node.js modules.
 * Provides no-op implementations of cache functions.
 *
 * **Architecture**: This file is ONLY used in Storybook via Webpack/Vite alias.
 * Production uses the real cache.server.ts with Redis/Node.js modules.
 */

// Export all cache functions as no-ops for Storybook
export const getCachedData = async () => null;
export const setCachedData = async () => {
  // No-op for Storybook
};
export const invalidateCache = async () => {
  // No-op for Storybook
};
export const warmCache = async () => {
  // No-op for Storybook
};

// Export any other cache utilities as no-ops
export default {
  getCachedData,
  setCachedData,
  invalidateCache,
  warmCache,
};
