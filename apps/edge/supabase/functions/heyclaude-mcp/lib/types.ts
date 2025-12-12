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

// Phase 2: Platform Formatting
export const DownloadContentForPlatformInputSchema = z.object({
  category: CategorySchema.describe('Content category'),
  slug: z.string().describe('Content slug identifier'),
  platform: z
    .enum(['claude-code', 'cursor', 'chatgpt-codex', 'generic'])
    .default('claude-code')
    .describe('Target platform for formatting (default: claude-code)'),
  targetDirectory: z
    .string()
    .optional()
    .describe('Optional: Target directory path (e.g., "/Users/username/project/.claude")'),
});

// Phase 3: Growth Tools
export const SubscribeNewsletterInputSchema = z.object({
  email: z.string().email().describe('Email address to subscribe'),
  source: z
    .string()
    .default('mcp')
    .describe('Newsletter subscription source (default: "mcp")'),
  referrer: z
    .string()
    .optional()
    .describe('Optional: Referrer URL or source identifier'),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe('Optional: Additional metadata for tracking'),
});

export const CreateAccountInputSchema = z.object({
  provider: z
    .enum(['github', 'google', 'discord'])
    .default('github')
    .describe('OAuth provider to use for account creation (default: "github")'),
  newsletterOptIn: z
    .boolean()
    .default(false)
    .describe('Whether to automatically subscribe to newsletter (default: false)'),
  redirectTo: z
    .string()
    .optional()
    .describe('Optional: Path to redirect to after account creation (e.g., "/account")'),
});

export const SubmitContentInputSchema = z.object({
  submission_type: z
    .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills'])
    .optional()
    .describe('Type of content to submit (required for complete submission)'),
  category: CategorySchema.optional().describe('Content category (usually matches submission_type)'),
  name: z.string().optional().describe('Title/name of the content (required)'),
  description: z.string().optional().describe('Brief description of the content (required)'),
  author: z.string().optional().describe('Author name or handle (required)'),
  content_data: z.any().optional().describe('Content data object (structure varies by type)'),
  author_profile_url: z.string().url().optional().describe('Optional: Author profile URL'),
  github_url: z.string().url().optional().describe('Optional: GitHub repository URL'),
  tags: z.array(z.string()).optional().describe('Optional: Array of relevant tags'),
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
export type DownloadContentForPlatformInput = z.infer<typeof DownloadContentForPlatformInputSchema>;
export type SubscribeNewsletterInput = z.infer<typeof SubscribeNewsletterInputSchema>;
export type CreateAccountInput = z.infer<typeof CreateAccountInputSchema>;
export type SubmitContentInput = z.infer<typeof SubmitContentInputSchema>;

// Phase 1.5: Feature Enhancements
export const GetSearchSuggestionsInputSchema = z.object({
  query: z.string().min(2).describe('Search query string (minimum 2 characters)'),
  limit: z.number().min(1).max(20).default(10).describe('Number of suggestions to return (1-20, default: 10)'),
});

export const GetSearchFacetsInputSchema = z.object({});

export const GetChangelogInputSchema = z.object({
  format: z.enum(['llms-txt', 'json']).default('llms-txt').describe('Output format (default: llms-txt)'),
});

export const GetSocialProofStatsInputSchema = z.object({});

export const GetCategoryConfigsInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by specific category (optional)'),
});

export type GetSearchSuggestionsInput = z.infer<typeof GetSearchSuggestionsInputSchema>;
export type GetSearchFacetsInput = z.infer<typeof GetSearchFacetsInputSchema>;
export type GetChangelogInput = z.infer<typeof GetChangelogInputSchema>;
export type GetSocialProofStatsInput = z.infer<typeof GetSocialProofStatsInputSchema>;
export type GetCategoryConfigsInput = z.infer<typeof GetCategoryConfigsInputSchema>;
