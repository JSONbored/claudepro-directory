/**
 * Shared Zod Schemas for MCP Server
 *
 * Reusable schema patterns for consistent validation and OpenAPI documentation.
 * These schemas are used across all MCP tools, resources, and prompts.
 *
 * **OpenAPI Support:**
 * - Uses `.meta()` for OpenAPI metadata (description, example, format)
 * - Compatible with `zod-openapi` v5
 * - All schemas include descriptions and examples for OpenAPI docs
 *
 * @module mcp-server/lib/schemas
 */

// Import zod-openapi for TypeScript type augmentation (enables .meta() OpenAPI support)
import 'zod-openapi';
import { z } from 'zod';
import { CategorySchema } from './types.js';

// =============================================================================
// Common Patterns
// =============================================================================

/**
 * MCP pagination schema (page-based)
 *
 * @example
 * ```ts
 * const schema = mcpPaginationSchema.extend({ category: CategorySchema.optional() });
 * ```
 */
export const mcpPaginationSchema = z.object({
  page: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('Page number for pagination')
    .meta({
      description: 'Page number for pagination',
      example: 1,
      minimum: 1,
    }),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Items per page (max 50)')
    .meta({
      description: 'Items per page (max 50)',
      example: 20,
      minimum: 1,
      maximum: 50,
    }),
});

/**
 * MCP category filter schema
 *
 * @example
 * ```ts
 * const schema = z.object({ category: mcpCategoryFilterSchema });
 * ```
 */
export const mcpCategoryFilterSchema = CategorySchema.optional()
  .describe('Filter by category')
  .meta({
    description: 'Filter by category',
    example: 'agents',
  });

/**
 * MCP tags filter schema
 *
 * @example
 * ```ts
 * const schema = z.object({ tags: mcpTagsFilterSchema });
 * ```
 */
export const mcpTagsFilterSchema = z
  .array(z.string())
  .optional()
  .describe('Filter by tags')
  .meta({
    description: 'Filter by tags',
    example: ['ai', 'automation'],
  });

/**
 * MCP slug schema
 *
 * @example
 * ```ts
 * const schema = z.object({ slug: mcpSlugSchema });
 * ```
 */
export const mcpSlugSchema = z
  .string()
  .min(1)
  .describe('Content slug identifier')
  .meta({
    description: 'Content slug identifier',
    example: 'ai-agent-framework',
  });

/**
 * MCP search query schema
 *
 * @example
 * ```ts
 * const schema = z.object({ query: mcpSearchQuerySchema });
 * ```
 */
export const mcpSearchQuerySchema = z
  .string()
  .optional()
  .describe('Search query string')
  .meta({
    description: 'Search query string',
    example: 'ai agents',
  });

/**
 * MCP limit schema (for tools that only need limit, not page)
 *
 * @example
 * ```ts
 * const schema = z.object({ limit: mcpLimitSchema });
 * ```
 */
export const mcpLimitSchema = z
  .number()
  .int()
  .min(1)
  .max(50)
  .default(20)
  .describe('Number of items to return (max 50)')
  .meta({
    description: 'Number of items to return (max 50)',
    example: 20,
    minimum: 1,
    maximum: 50,
  });

/**
 * MCP platform enum schema
 *
 * @example
 * ```ts
 * const schema = z.object({ platform: mcpPlatformSchema });
 * ```
 */
export const mcpPlatformSchema = z
  .enum(['claude-code', 'cursor', 'chatgpt-codex', 'generic'])
  .default('claude-code')
  .describe('Target platform for formatting (default: claude-code)')
  .meta({
    description: 'Target platform for formatting (default: claude-code)',
    example: 'claude-code',
  });

/**
 * MCP URL schema (for optional URLs)
 *
 * @example
 * ```ts
 * const schema = z.object({ github_url: mcpUrlSchema });
 * ```
 */
export const mcpUrlSchema = z
  .string()
  .url()
  .optional()
  .describe('Optional URL field')
  .meta({
    description: 'Optional URL field',
    example: 'https://github.com/johndoe/example',
    format: 'uri',
  });

/**
 * MCP email schema
 *
 * @example
 * ```ts
 * const schema = z.object({ email: mcpEmailSchema });
 * ```
 */
export const mcpEmailSchema = z
  .string()
  .email()
  .describe('Email address')
  .meta({
    description: 'Email address',
    example: 'user@example.com',
    format: 'email',
  });

/**
 * MCP date-time schema (ISO 8601)
 *
 * @example
 * ```ts
 * const schema = z.object({ dateAdded: mcpDateTimeSchema });
 * ```
 */
export const mcpDateTimeSchema = z
  .string()
  .datetime()
  .describe('ISO 8601 date-time string')
  .meta({
    description: 'ISO 8601 date-time string',
    example: '2024-01-15T10:30:00Z',
    format: 'date-time',
  });

/**
 * MCP content item schema (base schema for content items in lists)
 *
 * @example
 * ```ts
 * const schema = z.array(mcpContentItemSchema);
 * ```
 */
export const mcpContentItemSchema = z.object({
  slug: z.string().meta({ example: 'ai-agent-framework' }),
  title: z.string().meta({ example: 'AI Agent Framework' }),
  category: z.string().meta({ example: 'agents' }),
  description: z.string().meta({ example: 'A comprehensive framework for building AI agents' }),
  tags: z.array(z.string()).meta({ example: ['ai', 'automation'] }),
  author: z.string().meta({ example: 'johndoe' }),
  dateAdded: z.string().datetime().meta({ example: '2024-01-15T10:30:00Z', format: 'date-time' }),
});

/**
 * MCP pagination response schema
 *
 * @example
 * ```ts
 * const schema = z.object({ pagination: mcpPaginationResponseSchema });
 * ```
 */
export const mcpPaginationResponseSchema = z.object({
  total: z.number().meta({ example: 150, description: 'Total number of items' }),
  page: z.number().meta({ example: 1, description: 'Current page number' }),
  limit: z.number().meta({ example: 20, description: 'Items per page' }),
  totalPages: z.number().meta({ example: 8, description: 'Total number of pages' }),
  hasNext: z.boolean().meta({ example: true, description: 'Whether there is a next page' }),
  hasPrev: z.boolean().meta({ example: false, description: 'Whether there is a previous page' }),
  hasMore: z.boolean().meta({ example: true, description: 'Whether there are more items' }),
});

/**
 * MCP usage hints schema
 *
 * @example
 * ```ts
 * const schema = z.object({ usageHints: mcpUsageHintsSchema });
 * ```
 */
export const mcpUsageHintsSchema = z
  .array(z.string())
  .meta({
    description: 'Usage hints for the AI agent',
    example: ['Use getContentDetail to get full content', 'Filter by category for better results'],
  });

/**
 * MCP related tools schema
 *
 * @example
 * ```ts
 * const schema = z.object({ relatedTools: mcpRelatedToolsSchema });
 * ```
 */
export const mcpRelatedToolsSchema = z
  .array(z.string())
  .meta({
    description: 'Related tools that might be useful',
    example: ['getContentDetail', 'getRelatedContent'],
  });

// =============================================================================
// Schema Composition Utilities
// =============================================================================

/**
 * Create a content filter schema with common filters
 *
 * @param additionalFields - Additional fields to add to the schema
 * @returns Composed schema with category, tags, and optional additional fields
 *
 * @example
 * ```ts
 * const schema = createContentFilterSchema({
 *   query: mcpSearchQuerySchema,
 * });
 * ```
 */
export function createContentFilterSchema(additionalFields?: z.ZodRawShape) {
  const baseSchema = z.object({
    category: mcpCategoryFilterSchema,
    tags: mcpTagsFilterSchema,
  });

  if (additionalFields) {
    return baseSchema.extend(additionalFields);
  }

  return baseSchema;
}

/**
 * Create a paginated content query schema
 *
 * @param additionalFields - Additional fields to add to the schema
 * @returns Composed schema with pagination and optional additional fields
 *
 * @example
 * ```ts
 * const schema = createPaginatedContentSchema({
 *   query: mcpSearchQuerySchema,
 * });
 * ```
 */
export function createPaginatedContentSchema(additionalFields?: z.ZodRawShape) {
  const baseSchema = mcpPaginationSchema;

  if (additionalFields) {
    return baseSchema.extend(additionalFields);
  }

  return baseSchema;
}

/**
 * Create a content list response schema
 *
 * @param itemSchema - Schema for individual items in the list
 * @param includePagination - Whether to include pagination fields
 * @returns Composed response schema
 *
 * @example
 * ```ts
 * const schema = createContentListResponseSchema(mcpContentItemSchema, true);
 * ```
 */
export function createContentListResponseSchema(
  itemSchema: z.ZodTypeAny,
  includePagination: boolean = false
) {
  const baseSchema = z.object({
    items: z.array(itemSchema).meta({ description: 'Array of content items' }),
    count: z.number().meta({ example: 20, description: 'Total number of items returned' }),
  });

  if (includePagination) {
    return baseSchema.extend({
      pagination: mcpPaginationResponseSchema,
    });
  }

  return baseSchema;
}

