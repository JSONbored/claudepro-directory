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
  agents: () => import('@/generated/agents-metadata').then((m) => m.agentsMetadata),
  mcp: () => import('@/generated/mcp-metadata').then((m) => m.mcpMetadata),
  rules: () => import('@/generated/rules-metadata').then((m) => m.rulesMetadata),
  commands: () => import('@/generated/commands-metadata').then((m) => m.commandsMetadata),
  hooks: () => import('@/generated/hooks-metadata').then((m) => m.hooksMetadata),
  statuslines: () => import('@/generated/statuslines-metadata').then((m) => m.statuslinesMetadata),
  collections: () => import('@/generated/collections-metadata').then((m) => m.collectionsMetadata),
};
