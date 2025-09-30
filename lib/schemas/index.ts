/**
 * Schemas Module Index
 * Centralized barrel export for all schema definitions
 *
 * Benefits:
 * - Single import source for all schemas
 * - Better tree-shaking with named exports
 * - Easier to maintain and refactor
 *
 * Usage:
 * import { ContentMetadata, sortOptionSchema, cacheCategorySchema } from '@/lib/schemas';
 */

// Analytics schemas
export * from './analytics.schema';

// App schemas
export * from './app.schema';

// Branded types
export * from './branded-types.schema';
// Cache schemas
export * from './cache.schema';

// Component schemas
export * from './component.schema';
// Content schemas (most commonly used) - modernized to use content/ directory
export type {
  ContentItem,
  ContentMetadata,
  ContentStats,
  ExportableItem,
  JobContent,
  MCPServerContent,
} from './content';
export {
  agentContentSchema,
  commandContentSchema,
  contentItemSchema,
  exportableItemSchema,
  guideContentSchema,
  hookContentSchema,
  mcpContentSchema,
  ruleContentSchema,
} from './content';
// Content filter schemas
export * from './content-filter.schema';
// Content generation schemas
export * from './content-generation.schema';

// Environment schemas
export * from './env.schema';

// Error schemas
export * from './error.schema';

// Form schemas (large - consider lazy loading)
export * from './form.schema';

// Logger schemas
export * from './logger.schema';

// Markdown schemas
export * from './markdown.schema';

// Middleware schemas
export * from './middleware.schema';

// Primitive schemas (foundational)
export * from './primitives';

// Related content schemas
export * from './related-content.schema';

// Search schemas
export * from './search.schema';

// Shared schemas
export * from './shared.schema';
