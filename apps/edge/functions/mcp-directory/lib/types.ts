/**
 * MCP Tool Type Definitions
 *
 * Centralized types for all MCP tools exposed by the HeyClaude server.
 * Leverages existing database types from @heyclaude/database-types
 */

import { z } from 'zod';

/**
 * MCP Server Metadata
 */
export const MCP_SERVER_VERSION = '1.0.0';
export const MCP_PROTOCOL_VERSION = '2025-06-18';

/**
 * Category enum - matches database enum
 */
export const CategorySchema = z.enum([
  'agents',
  'rules',
  'commands',
  'skills',
  'collections',
  'mcp',
]);

export type Category = z.infer<typeof CategorySchema>;

/**
 * Input schemas for each tool
 */
export const ListCategoriesInputSchema = z.object({});

export const SearchContentInputSchema = z.object({
  query: z.string().optional().describe('Search query string'),
  category: CategorySchema.optional().describe('Filter by category'),
  tags: z.array(z.string()).optional().describe('Filter by tags'),
  page: z.number().min(1).default(1).describe('Page number for pagination'),
  limit: z.number().min(1).max(50).default(20).describe('Items per page (max 50)'),
});

export const GetContentDetailInputSchema = z.object({
  slug: z.string().describe('Content slug identifier'),
  category: CategorySchema.describe('Content category'),
});

export const GetTrendingInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)'),
  limit: z.number().min(1).max(50).default(20).describe('Number of items to return (max 50)'),
});

export const GetFeaturedInputSchema = z.object({});

export const GetTemplatesInputSchema = z.object({
  category: CategorySchema.optional().describe('Get templates for specific category (optional)'),
});

// Advanced tool schemas (Phase 3)
export const GetMcpServersInputSchema = z.object({
  limit: z.number().min(1).max(50).default(20).describe('Number of servers to return (max 50)'),
});

export const GetRelatedContentInputSchema = z.object({
  slug: z.string().describe('Reference content slug'),
  category: CategorySchema.describe('Reference content category'),
  limit: z.number().min(1).max(20).default(10).describe('Number of related items (max 20)'),
});

export const GetContentByTagInputSchema = z.object({
  tags: z.array(z.string()).min(1).describe('Tags to filter by'),
  logic: z.enum(['AND', 'OR']).default('OR').describe('Logical operator for multiple tags'),
  category: CategorySchema.optional().describe('Filter by category (optional)'),
  limit: z.number().min(1).max(50).default(20).describe('Number of items (max 50)'),
});

export const GetPopularInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)'),
  limit: z.number().min(1).max(50).default(20).describe('Number of items (max 50)'),
});

export const GetRecentInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)'),
  limit: z.number().min(1).max(50).default(20).describe('Number of items (max 50)'),
});

/**
 * Infer TypeScript types from Zod schemas
 */
export type ListCategoriesInput = z.infer<typeof ListCategoriesInputSchema>;
export type SearchContentInput = z.infer<typeof SearchContentInputSchema>;
export type GetContentDetailInput = z.infer<typeof GetContentDetailInputSchema>;
export type GetTrendingInput = z.infer<typeof GetTrendingInputSchema>;
export type GetFeaturedInput = z.infer<typeof GetFeaturedInputSchema>;
export type GetTemplatesInput = z.infer<typeof GetTemplatesInputSchema>;
export type GetMcpServersInput = z.infer<typeof GetMcpServersInputSchema>;
export type GetRelatedContentInput = z.infer<typeof GetRelatedContentInputSchema>;
export type GetContentByTagInput = z.infer<typeof GetContentByTagInputSchema>;
export type GetPopularInput = z.infer<typeof GetPopularInputSchema>;
export type GetRecentInput = z.infer<typeof GetRecentInputSchema>;
