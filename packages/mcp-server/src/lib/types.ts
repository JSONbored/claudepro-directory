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
export const MCP_SERVER_VERSION = '1.1.0';
export const MCP_PROTOCOL_VERSION = '2025-11-25';

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
  'hooks',
  'statuslines',
  'guides',
  'jobs',
  'changelog',
]);

export type Category = z.infer<typeof CategorySchema>;

/**
 * Input schemas for each tool
 * All 20 tools from the original implementation
 */

// 1. listCategories
export const ListCategoriesInputSchema = z.object({});

// 2. searchContent
export const SearchContentInputSchema = z.object({
  query: z.string().optional().describe('Search query string'),
  category: CategorySchema.optional().describe('Filter by category'),
  tags: z.array(z.string()).optional().describe('Filter by tags'),
  page: z.number().min(1).default(1).describe('Page number for pagination'),
  limit: z.number().min(1).max(50).default(20).describe('Items per page (max 50)'),
});

// 3. getContentDetail
export const GetContentDetailInputSchema = z.object({
  slug: z.string().describe('Content slug identifier'),
  category: CategorySchema.describe('Content category'),
});

// 4. getTrending
export const GetTrendingInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)'),
  limit: z.number().min(1).max(50).default(20).describe('Number of items to return (max 50)'),
});

// 5. getFeatured
export const GetFeaturedInputSchema = z.object({});

// 6. getTemplates
export const GetTemplatesInputSchema = z.object({
  category: CategorySchema.optional().describe('Get templates for specific category (optional)'),
});

// 7. getMcpServers
export const GetMcpServersInputSchema = z.object({
  limit: z.number().min(1).max(50).default(20).describe('Number of servers to return (max 50)'),
});

// 8. getRelatedContent
export const GetRelatedContentInputSchema = z.object({
  slug: z.string().describe('Reference content slug'),
  category: CategorySchema.describe('Reference content category'),
  limit: z.number().min(1).max(20).default(10).describe('Number of related items (max 20)'),
});

// 9. getContentByTag
export const GetContentByTagInputSchema = z.object({
  tags: z.array(z.string()).min(1).describe('Tags to filter by'),
  logic: z.enum(['AND', 'OR']).default('OR').describe('Logical operator for multiple tags'),
  category: CategorySchema.optional().describe('Filter by category (optional)'),
  limit: z.number().min(1).max(50).default(20).describe('Number of items (max 50)'),
});

// 10. getPopular
export const GetPopularInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)'),
  limit: z.number().min(1).max(50).default(20).describe('Number of items (max 50)'),
});

// 11. getRecent
export const GetRecentInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)'),
  limit: z.number().min(1).max(50).default(20).describe('Number of items (max 50)'),
});

// 12. downloadContentForPlatform
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

// 13. getCategoryConfigs
export const GetCategoryConfigsInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by specific category (optional)'),
});

// 14. getChangelog
export const GetChangelogInputSchema = z.object({
  format: z
    .enum(['llms-txt', 'json'])
    .default('llms-txt')
    .describe('Output format (default: llms-txt)'),
});

// 15. getSearchFacets
export const GetSearchFacetsInputSchema = z.object({});

// 16. getSearchSuggestions
export const GetSearchSuggestionsInputSchema = z.object({
  query: z.string().min(2).describe('Search query string (minimum 2 characters)'),
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe('Number of suggestions to return (1-20, default: 10)'),
});

// 17. getSocialProofStats
export const GetSocialProofStatsInputSchema = z.object({});

// 18. submitContent
export const SubmitContentInputSchema = z.object({
  submission_type: z
    .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills'])
    .optional()
    .describe('Type of content to submit (required for complete submission)'),
  category: CategorySchema.optional().describe(
    'Content category (usually matches submission_type)'
  ),
  name: z.string().optional().describe('Title/name of the content (required)'),
  description: z.string().optional().describe('Brief description of the content (required)'),
  author: z.string().optional().describe('Author name or handle (required)'),
  content_data: z.any().optional().describe('Content data object (structure varies by type)'),
  author_profile_url: z.string().url().optional().describe('Optional: Author profile URL'),
  github_url: z.string().url().optional().describe('Optional: GitHub repository URL'),
  tags: z.array(z.string()).optional().describe('Optional: Array of relevant tags'),
});

// 19. createAccount
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

// 20. subscribeNewsletter
export const SubscribeNewsletterInputSchema = z.object({
  email: z.string().email().describe('Email address to subscribe'),
  source: z.string().default('mcp').describe('Newsletter subscription source (default: "mcp")'),
  referrer: z.string().optional().describe('Optional: Referrer URL or source identifier'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Optional: Additional metadata for tracking'),
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
export type GetCategoryConfigsInput = z.infer<typeof GetCategoryConfigsInputSchema>;
export type GetChangelogInput = z.infer<typeof GetChangelogInputSchema>;
export type GetSearchFacetsInput = z.infer<typeof GetSearchFacetsInputSchema>;
export type GetSearchSuggestionsInput = z.infer<typeof GetSearchSuggestionsInputSchema>;
export type GetSocialProofStatsInput = z.infer<typeof GetSocialProofStatsInputSchema>;
export type SubmitContentInput = z.infer<typeof SubmitContentInputSchema>;
export type CreateAccountInput = z.infer<typeof CreateAccountInputSchema>;
export type SubscribeNewsletterInput = z.infer<typeof SubscribeNewsletterInputSchema>;

/**
 * Output schemas for each tool
 * These define the structured output format returned by tools
 */

// 1. listCategories output
export const ListCategoriesOutputSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      count: z.number(),
      icon: z.string(),
    })
  ),
  total: z.number(),
  usageHints: z.array(z.string()),
  relatedTools: z.array(z.string()),
});

// 2. searchContent output
export const SearchContentOutputSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      category: z.string(),
      description: z.string(),
      wasTruncated: z.boolean(),
      tags: z.array(z.string()),
      author: z.string(),
      dateAdded: z.string(),
    })
  ),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
    hasMore: z.boolean(),
  }),
  usageHints: z.array(z.string()),
  relatedTools: z.array(z.string()),
});

// 3. getContentDetail output
export const GetContentDetailOutputSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  fullDescription: z.string().optional(),
  author: z.string(),
  dateAdded: z.string(),
  tags: z.array(z.string()),
  stats: z.object({
    views: z.number(),
    bookmarks: z.number(),
  }),
  usageHints: z.array(z.string()),
  relatedTools: z.array(z.string()),
});

// 4. getTrending output
export const GetTrendingOutputSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      category: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      author: z.string(),
      dateAdded: z.string(),
      trendingScore: z.number().optional(),
    })
  ),
  count: z.number(),
});

// 5. getFeatured output
export const GetFeaturedOutputSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      category: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      author: z.string(),
      dateAdded: z.string(),
    })
  ),
  count: z.number(),
});

// 6. getTemplates output
export const GetTemplatesOutputSchema = z.object({
  templates: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      category: z.string().nullable(),
      tags: z.string().nullable(),
    })
  ),
  count: z.number(),
});

// 7. getMcpServers output
export const GetMcpServersOutputSchema = z.object({
  servers: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string(),
      author: z.string(),
      dateAdded: z.string(),
      tags: z.array(z.string()),
      mcpbUrl: z.string().nullable(),
      requiresAuth: z.boolean(),
      tools: z.array(z.object({ name: z.string(), description: z.string() })),
      stats: z.object({
        views: z.number(),
        bookmarks: z.number(),
      }),
    })
  ),
  count: z.number(),
});

// 8. getRelatedContent output
export const GetRelatedContentOutputSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      category: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
    })
  ),
  source: z.object({
    slug: z.string(),
    category: z.string(),
  }),
  count: z.number(),
});

// 9. getContentByTag output
export const GetContentByTagOutputSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      category: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      author: z.string(),
      dateAdded: z.string(),
    })
  ),
  tags: z.array(z.string()),
  logic: z.enum(['AND', 'OR']),
  category: z.string().optional(),
  count: z.number(),
});

// 10. getPopular output
export const GetPopularOutputSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      category: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      author: z.string(),
      dateAdded: z.string(),
      popularityScore: z.number().optional(),
    })
  ),
  count: z.number(),
});

// 11. getRecent output
export const GetRecentOutputSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      category: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      author: z.string(),
      dateAdded: z.string(),
    })
  ),
  count: z.number(),
});

// 12. downloadContentForPlatform output
export const DownloadContentForPlatformOutputSchema = z.object({
  platform: z.enum(['claude-code', 'cursor', 'chatgpt-codex', 'generic']),
  category: z.string(),
  slug: z.string(),
  targetDirectory: z.string().optional(),
  filePath: z.string(),
  content: z.string(),
  format: z.string(),
});

// 13. getCategoryConfigs output
export const GetCategoryConfigsOutputSchema = z.object({
  configs: z.array(
    z.object({
      category: z.string(),
      title: z.string().nullable(),
      description: z.string().nullable(),
      icon: z.string().nullable(),
      features: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  count: z.number(),
});

// 14. getChangelog output
export const GetChangelogOutputSchema = z.object({
  format: z.enum(['llms-txt', 'json']),
  content: z.string(),
  entries: z.array(z.unknown()).optional(),
});

// 15. getSearchFacets output
export const GetSearchFacetsOutputSchema = z.object({
  categories: z.array(
    z.object({
      category: z.string(),
      content_count: z.number(),
    })
  ),
  tags: z.array(
    z.object({
      tag: z.string(),
      content_count: z.number(),
    })
  ),
});

// 16. getSearchSuggestions output
export const GetSearchSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      query: z.string(),
      count: z.number().optional(),
    })
  ),
  count: z.number(),
});

// 17. getSocialProofStats output
export const GetSocialProofStatsOutputSchema = z.object({
  totalViews: z.number(),
  totalBookmarks: z.number(),
  totalContent: z.number(),
  statsByCategory: z.record(z.string(), z.object({ views: z.number(), bookmarks: z.number() })),
});

// 18. submitContent output
export const SubmitContentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  submissionUrl: z.string().optional(),
  instructions: z.array(z.string()).optional(),
});

// 19. createAccount output
export const CreateAccountOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  authUrl: z.string(),
  provider: z.enum(['github', 'google', 'discord']),
});

// 20. subscribeNewsletter output
export const SubscribeNewsletterOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  email: z.string(),
});
