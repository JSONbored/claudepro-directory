/**
 * MCP Tool Type Definitions
 *
 * Centralized types for all MCP tools exposed by the HeyClaude server.
 * Leverages existing database types from @heyclaude/database-types
 *
 * **OpenAPI Support:**
 * - Uses `.meta()` for OpenAPI metadata (description, example, format)
 * - Compatible with `zod-openapi` v5
 * - All schemas include descriptions and examples for OpenAPI docs
 */

// Import zod-openapi for TypeScript type augmentation (enables .meta() OpenAPI support)
import 'zod-openapi';
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
  query: z.string().optional().describe('Search query string').meta({
    description: 'Search query string',
    example: 'ai agents',
  }),
  category: CategorySchema.optional().describe('Filter by category').meta({
    description: 'Filter by category',
    example: 'agents',
  }),
  tags: z
    .array(z.string())
    .optional()
    .describe('Filter by tags')
    .meta({
      description: 'Filter by tags',
      example: ['ai', 'automation'],
    }),
  page: z.number().int().min(1).default(1).describe('Page number for pagination').meta({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  }),
  limit: z.number().int().min(1).max(50).default(20).describe('Items per page (max 50)').meta({
    description: 'Items per page (max 50)',
    example: 20,
    minimum: 1,
    maximum: 50,
  }),
});

// 3. getContentDetail
export const GetContentDetailInputSchema = z.object({
  slug: z.string().min(1).describe('Content slug identifier').meta({
    description: 'Content slug identifier',
    example: 'ai-agent-framework',
  }),
  category: CategorySchema.describe('Content category').meta({
    description: 'Content category',
    example: 'agents',
  }),
});

// 4. getTrending
export const GetTrendingInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)').meta({
    description: 'Filter by category (optional)',
    example: 'agents',
  }),
  limit: z
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
    }),
});

// 5. getFeatured
export const GetFeaturedInputSchema = z.object({});

// 6. getTemplates
export const GetTemplatesInputSchema = z.object({
  category: CategorySchema.optional()
    .describe('Get templates for specific category (optional)')
    .meta({
      description: 'Get templates for specific category (optional)',
      example: 'agents',
    }),
});

// 7. getMcpServers
export const GetMcpServersInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Number of servers to return (max 50)')
    .meta({
      description: 'Number of servers to return (max 50)',
      example: 20,
      minimum: 1,
      maximum: 50,
    }),
});

// 8. getRelatedContent
export const GetRelatedContentInputSchema = z.object({
  slug: z.string().min(1).describe('Reference content slug').meta({
    description: 'Reference content slug',
    example: 'ai-agent-framework',
  }),
  category: CategorySchema.describe('Reference content category').meta({
    description: 'Reference content category',
    example: 'agents',
  }),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe('Number of related items (max 20)')
    .meta({
      description: 'Number of related items (max 20)',
      example: 10,
      minimum: 1,
      maximum: 20,
    }),
});

// 9. getContentByTag
export const GetContentByTagInputSchema = z.object({
  tags: z
    .array(z.string())
    .min(1)
    .describe('Tags to filter by')
    .meta({
      description: 'Tags to filter by',
      example: ['ai', 'automation'],
    }),
  logic: z.enum(['AND', 'OR']).default('OR').describe('Logical operator for multiple tags').meta({
    description: 'Logical operator for multiple tags',
    example: 'OR',
  }),
  category: CategorySchema.optional().describe('Filter by category (optional)').meta({
    description: 'Filter by category (optional)',
    example: 'agents',
  }),
  limit: z.number().int().min(1).max(50).default(20).describe('Number of items (max 50)').meta({
    description: 'Number of items (max 50)',
    example: 20,
    minimum: 1,
    maximum: 50,
  }),
});

// 10. getPopular
export const GetPopularInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)').meta({
    description: 'Filter by category (optional)',
    example: 'agents',
  }),
  limit: z.number().int().min(1).max(50).default(20).describe('Number of items (max 50)').meta({
    description: 'Number of items (max 50)',
    example: 20,
    minimum: 1,
    maximum: 50,
  }),
});

// 11. getRecent
export const GetRecentInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by category (optional)').meta({
    description: 'Filter by category (optional)',
    example: 'agents',
  }),
  limit: z.number().int().min(1).max(50).default(20).describe('Number of items (max 50)').meta({
    description: 'Number of items (max 50)',
    example: 20,
    minimum: 1,
    maximum: 50,
  }),
});

// 12. downloadContentForPlatform
export const DownloadContentForPlatformInputSchema = z.object({
  category: CategorySchema.describe('Content category').meta({
    description: 'Content category',
    example: 'agents',
  }),
  slug: z.string().min(1).describe('Content slug identifier').meta({
    description: 'Content slug identifier',
    example: 'ai-agent-framework',
  }),
  platform: z
    .enum(['claude-code', 'cursor', 'chatgpt-codex', 'generic'])
    .default('claude-code')
    .describe('Target platform for formatting (default: claude-code)')
    .meta({
      description: 'Target platform for formatting (default: claude-code)',
      example: 'claude-code',
    }),
  targetDirectory: z
    .string()
    .optional()
    .describe('Optional: Target directory path (e.g., "/Users/username/project/.claude")')
    .meta({
      description: 'Optional: Target directory path (e.g., "/Users/username/project/.claude")',
      example: '/Users/username/project/.claude',
      format: 'path',
    }),
});

// 13. getCategoryConfigs
export const GetCategoryConfigsInputSchema = z.object({
  category: CategorySchema.optional().describe('Filter by specific category (optional)').meta({
    description: 'Filter by specific category (optional)',
    example: 'agents',
  }),
});

// 14. getChangelog
export const GetChangelogInputSchema = z.object({
  format: z
    .enum(['llms-txt', 'json'])
    .default('llms-txt')
    .describe('Output format (default: llms-txt)')
    .meta({
      description: 'Output format (default: llms-txt)',
      example: 'llms-txt',
    }),
});

// 15. getSearchFacets
export const GetSearchFacetsInputSchema = z.object({});

// 16. getSearchSuggestions
export const GetSearchSuggestionsInputSchema = z.object({
  query: z.string().min(2).describe('Search query string (minimum 2 characters)').meta({
    description: 'Search query string (minimum 2 characters)',
    example: 'ai',
    minLength: 2,
  }),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe('Number of suggestions to return (1-20, default: 10)')
    .meta({
      description: 'Number of suggestions to return (1-20, default: 10)',
      example: 10,
      minimum: 1,
      maximum: 20,
    }),
});

// 17. getSocialProofStats
export const GetSocialProofStatsInputSchema = z.object({});

// 18. submitContent
export const SubmitContentInputSchema = z.object({
  submission_type: z
    .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills'])
    .optional()
    .describe('Type of content to submit (required for complete submission)')
    .meta({
      description: 'Type of content to submit (required for complete submission)',
      example: 'agents',
    }),
  category: CategorySchema.optional()
    .describe('Content category (usually matches submission_type)')
    .meta({
      description: 'Content category (usually matches submission_type)',
      example: 'agents',
    }),
  name: z.string().optional().describe('Title/name of the content (required)').meta({
    description: 'Title/name of the content (required)',
    example: 'AI Agent Framework',
  }),
  description: z.string().optional().describe('Brief description of the content (required)').meta({
    description: 'Brief description of the content (required)',
    example: 'A comprehensive framework for building AI agents',
  }),
  author: z.string().optional().describe('Author name or handle (required)').meta({
    description: 'Author name or handle (required)',
    example: 'johndoe',
  }),
  content_data: z
    .any()
    .optional()
    .describe('Content data object (structure varies by type)')
    .meta({
      description: 'Content data object (structure varies by type)',
      example: { version: '1.0.0', features: ['feature1', 'feature2'] },
    }),
  author_profile_url: z.string().url().optional().describe('Optional: Author profile URL').meta({
    description: 'Optional: Author profile URL',
    example: 'https://github.com/johndoe',
    format: 'uri',
  }),
  github_url: z.string().url().optional().describe('Optional: GitHub repository URL').meta({
    description: 'Optional: GitHub repository URL',
    example: 'https://github.com/johndoe/ai-agent-framework',
    format: 'uri',
  }),
  tags: z
    .array(z.string())
    .optional()
    .describe('Optional: Array of relevant tags')
    .meta({
      description: 'Optional: Array of relevant tags',
      example: ['ai', 'automation', 'agents'],
    }),
});

// 19. createAccount
export const CreateAccountInputSchema = z.object({
  provider: z
    .enum(['github', 'google', 'discord'])
    .default('github')
    .describe('OAuth provider to use for account creation (default: "github")')
    .meta({
      description: 'OAuth provider to use for account creation (default: "github")',
      example: 'github',
    }),
  newsletterOptIn: z
    .boolean()
    .default(false)
    .describe('Whether to automatically subscribe to newsletter (default: false)')
    .meta({
      description: 'Whether to automatically subscribe to newsletter (default: false)',
      example: false,
    }),
  redirectTo: z
    .string()
    .optional()
    .describe('Optional: Path to redirect to after account creation (e.g., "/account")')
    .meta({
      description: 'Optional: Path to redirect to after account creation (e.g., "/account")',
      example: '/account',
      format: 'path',
    }),
});

// 20. subscribeNewsletter
export const SubscribeNewsletterInputSchema = z.object({
  email: z.string().email().describe('Email address to subscribe').meta({
    description: 'Email address to subscribe',
    example: 'user@example.com',
    format: 'email',
  }),
  source: z
    .string()
    .default('mcp')
    .describe('Newsletter subscription source (default: "mcp")')
    .meta({
      description: 'Newsletter subscription source (default: "mcp")',
      example: 'mcp',
    }),
  referrer: z.string().optional().describe('Optional: Referrer URL or source identifier').meta({
    description: 'Optional: Referrer URL or source identifier',
    example: 'https://claudepro.directory',
    format: 'uri',
  }),
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Optional: Additional metadata for tracking')
    .meta({
      description: 'Optional: Additional metadata for tracking',
      example: { campaign: 'mcp-launch', source: 'website' },
    }),
});

// 21. downloadSkillPackage - Download Skills ZIP file from Supabase Storage
export const DownloadSkillPackageInputSchema = z.object({
  slug: z.string().min(1).describe('Slug identifier of the skill to download').meta({
    description: 'Slug identifier of the skill to download',
    example: 'my-awesome-skill',
  }),
  rootUri: z
    .string()
    .optional()
    .describe(
      'Optional: Root URI for file download (e.g., file:///Users/username/.claude/packages). If not provided, returns download URL.'
    )
    .meta({
      description: 'Optional: Root URI for file download. If not provided, returns download URL.',
      example: 'file:///Users/username/.claude/packages',
      format: 'uri',
    }),
});

// 22. downloadMcpServerPackage - Download MCP server .mcpb file from Supabase Storage
export const DownloadMcpServerPackageInputSchema = z.object({
  slug: z.string().min(1).describe('Slug identifier of the MCP server to download').meta({
    description: 'Slug identifier of the MCP server to download',
    example: 'example-mcp-server',
  }),
  rootUri: z
    .string()
    .optional()
    .describe(
      'Optional: Root URI for file download (e.g., file:///Users/username/.claude/mcp). If not provided, returns download URL.'
    )
    .meta({
      description: 'Optional: Root URI for file download. If not provided, returns download URL.',
      example: 'file:///Users/username/.claude/mcp',
      format: 'uri',
    }),
});

// 23. downloadStorageFile - Generic tool for downloading any storage file
export const DownloadStorageFileInputSchema = z.object({
  category: CategorySchema.describe('Content category').meta({
    description: 'Content category',
    example: 'skills',
  }),
  slug: z.string().min(1).describe('Slug identifier of the content to download').meta({
    description: 'Slug identifier of the content to download',
    example: 'my-content',
  }),
  rootUri: z
    .string()
    .optional()
    .describe('Optional: Root URI for file download. If not provided, returns download URL.')
    .meta({
      description: 'Optional: Root URI for file download. If not provided, returns download URL.',
      example: 'file:///Users/username/.claude/packages',
      format: 'uri',
    }),
  fileType: z
    .enum(['zip', 'mcpb', 'json', 'other'])
    .optional()
    .describe('Optional: File type hint for better handling')
    .meta({
      description: 'Optional: File type hint for better handling',
      example: 'zip',
    }),
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
export type DownloadSkillPackageInput = z.infer<typeof DownloadSkillPackageInputSchema>;
export type DownloadMcpServerPackageInput = z.infer<typeof DownloadMcpServerPackageInputSchema>;
export type DownloadStorageFileInput = z.infer<typeof DownloadStorageFileInputSchema>;

/**
 * Output schemas for each tool
 * These define the structured output format returned by tools
 */

// 1. listCategories output
export const ListCategoriesOutputSchema = z
  .object({
    categories: z
      .array(
        z.object({
          name: z.string().meta({ example: 'AI Agents' }),
          slug: z.string().meta({ example: 'agents' }),
          description: z.string().meta({ example: 'AI agents and assistants' }),
          count: z.number().meta({ example: 150 }),
          icon: z.string().meta({ example: '🤖' }),
        })
      )
      .meta({ description: 'Array of available categories' }),
    total: z.number().meta({ example: 10, description: 'Total number of categories' }),
    usageHints: z.array(z.string()).meta({
      example: [
        'Use category slug in searchContent to filter',
        'Use getCategoryConfigs for category details',
      ],
    }),
    relatedTools: z.array(z.string()).meta({ example: ['searchContent', 'getCategoryConfigs'] }),
  })
  .meta({
    description: 'Output schema for listCategories tool - returns all available content categories',
    example: {
      categories: [
        {
          name: 'AI Agents',
          slug: 'agents',
          description: 'AI agents and assistants',
          count: 150,
          icon: '🤖',
        },
        {
          name: 'MCP Servers',
          slug: 'mcp',
          description: 'Model Context Protocol servers',
          count: 25,
          icon: '🔌',
        },
      ],
      total: 10,
      usageHints: [
        'Use category slug in searchContent to filter',
        'Use getCategoryConfigs for category details',
      ],
      relatedTools: ['searchContent', 'getCategoryConfigs'],
    },
  });

// 2. searchContent output
export const SearchContentOutputSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().meta({ example: 'ai-agent-framework' }),
          title: z.string().meta({ example: 'AI Agent Framework' }),
          category: z.string().meta({ example: 'agents' }),
          description: z
            .string()
            .meta({ example: 'A comprehensive framework for building AI agents' }),
          wasTruncated: z.boolean().meta({ example: false }),
          tags: z.array(z.string()).meta({ example: ['ai', 'automation'] }),
          author: z.string().meta({ example: 'johndoe' }),
          dateAdded: z
            .string()
            .datetime()
            .meta({ example: '2024-01-15T10:30:00Z', format: 'date-time' }),
        })
      )
      .meta({ description: 'Array of search result items' }),
    pagination: z
      .object({
        total: z.number().meta({ example: 150 }),
        page: z.number().meta({ example: 1 }),
        limit: z.number().meta({ example: 20 }),
        totalPages: z.number().meta({ example: 8 }),
        hasNext: z.boolean().meta({ example: true }),
        hasPrev: z.boolean().meta({ example: false }),
        hasMore: z.boolean().meta({ example: true }),
      })
      .meta({ description: 'Pagination information' }),
    usageHints: z.array(z.string()).meta({
      example: [
        'Use getContentDetail to get full content',
        'Filter by category for better results',
      ],
    }),
    relatedTools: z.array(z.string()).meta({ example: ['getContentDetail', 'getRelatedContent'] }),
  })
  .meta({
    description:
      'Output schema for searchContent tool - returns paginated search results with metadata',
    example: {
      items: [
        {
          slug: 'ai-agent-framework',
          title: 'AI Agent Framework',
          category: 'agents',
          description: 'A comprehensive framework for building AI agents',
          wasTruncated: false,
          tags: ['ai', 'automation'],
          author: 'johndoe',
          dateAdded: '2024-01-15T10:30:00Z',
        },
      ],
      pagination: {
        total: 150,
        page: 1,
        limit: 20,
        totalPages: 8,
        hasNext: true,
        hasPrev: false,
        hasMore: true,
      },
      usageHints: [
        'Use getContentDetail to get full content',
        'Filter by category for better results',
      ],
      relatedTools: ['getContentDetail', 'getRelatedContent'],
    },
  });

// 3. getContentDetail output
export const GetContentDetailOutputSchema = z
  .object({
    slug: z.string().meta({ example: 'ai-agent-framework' }),
    title: z.string().meta({ example: 'AI Agent Framework' }),
    category: z.string().meta({ example: 'agents' }),
    description: z.string().meta({ example: 'A comprehensive framework for building AI agents' }),
    fullDescription: z
      .string()
      .optional()
      .meta({ example: 'Full detailed description of the content...' }),
    author: z.string().meta({ example: 'johndoe' }),
    dateAdded: z.string().datetime().meta({ example: '2024-01-15T10:30:00Z', format: 'date-time' }),
    tags: z.array(z.string()).meta({ example: ['ai', 'automation', 'agents'] }),
    stats: z
      .object({
        views: z.number().meta({ example: 1250 }),
        bookmarks: z.number().meta({ example: 45 }),
      })
      .meta({ description: 'Content statistics' }),
    usageHints: z.array(z.string()).meta({
      example: [
        'Use downloadContentForPlatform to download',
        'Use getRelatedContent for similar items',
      ],
    }),
    relatedTools: z
      .array(z.string())
      .meta({ example: ['downloadContentForPlatform', 'getRelatedContent'] }),
  })
  .meta({
    description:
      'Output schema for getContentDetail tool - returns complete content details with metadata',
    example: {
      slug: 'ai-agent-framework',
      title: 'AI Agent Framework',
      category: 'agents',
      description: 'A comprehensive framework for building AI agents',
      fullDescription: 'Full detailed description of the content...',
      author: 'johndoe',
      dateAdded: '2024-01-15T10:30:00Z',
      tags: ['ai', 'automation', 'agents'],
      stats: { views: 1250, bookmarks: 45 },
      usageHints: [
        'Use downloadContentForPlatform to download',
        'Use getRelatedContent for similar items',
      ],
      relatedTools: ['downloadContentForPlatform', 'getRelatedContent'],
    },
  });

// 4. getTrending output
export const GetTrendingOutputSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().meta({ example: 'ai-agent-framework' }),
          title: z.string().meta({ example: 'AI Agent Framework' }),
          category: z.string().meta({ example: 'agents' }),
          description: z
            .string()
            .meta({ example: 'A comprehensive framework for building AI agents' }),
          tags: z.array(z.string()).meta({ example: ['ai', 'automation'] }),
          author: z.string().meta({ example: 'johndoe' }),
          dateAdded: z
            .string()
            .datetime()
            .meta({ example: '2024-01-15T10:30:00Z', format: 'date-time' }),
          trendingScore: z.number().optional().meta({ example: 95.5 }),
        })
      )
      .meta({ description: 'Array of trending content items' }),
    count: z.number().meta({ example: 20, description: 'Total number of trending items returned' }),
  })
  .meta({
    description:
      'Output schema for getTrending tool - returns trending content items sorted by popularity',
    example: {
      items: [
        {
          slug: 'ai-agent-framework',
          title: 'AI Agent Framework',
          category: 'agents',
          description: 'A comprehensive framework for building AI agents',
          tags: ['ai', 'automation'],
          author: 'johndoe',
          dateAdded: '2024-01-15T10:30:00Z',
          trendingScore: 95.5,
        },
      ],
      count: 20,
    },
  });

// 5. getFeatured output
export const GetFeaturedOutputSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().meta({ example: 'ai-agent-framework' }),
          title: z.string().meta({ example: 'AI Agent Framework' }),
          category: z.string().meta({ example: 'agents' }),
          description: z
            .string()
            .meta({ example: 'A comprehensive framework for building AI agents' }),
          tags: z.array(z.string()).meta({ example: ['ai', 'automation'] }),
          author: z.string().meta({ example: 'johndoe' }),
          dateAdded: z
            .string()
            .datetime()
            .meta({ example: '2024-01-15T10:30:00Z', format: 'date-time' }),
        })
      )
      .meta({ description: 'Array of featured content items' }),
    count: z.number().meta({ example: 10, description: 'Total number of featured items returned' }),
  })
  .meta({
    description: 'Output schema for getFeatured tool - returns featured/curated content items',
    example: {
      items: [
        {
          slug: 'ai-agent-framework',
          title: 'AI Agent Framework',
          category: 'agents',
          description: 'A comprehensive framework for building AI agents',
          tags: ['ai', 'automation'],
          author: 'johndoe',
          dateAdded: '2024-01-15T10:30:00Z',
        },
      ],
      count: 10,
    },
  });

// 6. getTemplates output
export const GetTemplatesOutputSchema = z
  .object({
    templates: z
      .array(
        z.object({
          id: z.string().meta({ example: 'template-123' }),
          type: z.string().meta({ example: 'agent' }),
          name: z.string().meta({ example: 'Basic Agent Template' }),
          description: z
            .string()
            .nullable()
            .meta({ example: 'A basic template for creating AI agents' }),
          category: z.string().nullable().meta({ example: 'agents' }),
          tags: z.string().nullable().meta({ example: 'ai,automation' }),
        })
      )
      .meta({ description: 'Array of available templates' }),
    count: z.number().meta({ example: 25, description: 'Total number of templates returned' }),
  })
  .meta({
    description: 'Output schema for getTemplates tool - returns available content templates',
    example: {
      templates: [
        {
          id: 'template-123',
          type: 'agent',
          name: 'Basic Agent Template',
          description: 'A basic template for creating AI agents',
          category: 'agents',
          tags: 'ai,automation',
        },
      ],
      count: 25,
    },
  });

// 7. getMcpServers output
export const GetMcpServersOutputSchema = z
  .object({
    servers: z
      .array(
        z.object({
          slug: z.string().meta({ example: 'example-mcp-server' }),
          title: z.string().meta({ example: 'Example MCP Server' }),
          description: z.string().meta({ example: 'An example MCP server implementation' }),
          author: z.string().meta({ example: 'johndoe' }),
          dateAdded: z
            .string()
            .datetime()
            .meta({ example: '2024-01-15T10:30:00Z', format: 'date-time' }),
          tags: z.array(z.string()).meta({ example: ['mcp', 'server', 'example'] }),
          mcpbUrl: z
            .string()
            .url()
            .nullable()
            .meta({ example: 'https://mcpb.io/example', format: 'uri' }),
          requiresAuth: z.boolean().meta({ example: false }),
          tools: z
            .array(
              z.object({
                name: z.string().meta({ example: 'getData' }),
                description: z.string().meta({ example: 'Get data from server' }),
              })
            )
            .meta({ description: 'Available tools on this MCP server' }),
          stats: z
            .object({
              views: z.number().meta({ example: 500 }),
              bookmarks: z.number().meta({ example: 20 }),
            })
            .meta({ description: 'Server statistics' }),
        })
      )
      .meta({ description: 'Array of MCP servers' }),
    count: z.number().meta({ example: 15, description: 'Total number of MCP servers returned' }),
  })
  .meta({
    description:
      'Output schema for getMcpServers tool - returns available MCP servers with metadata',
    example: {
      servers: [
        {
          slug: 'example-mcp-server',
          title: 'Example MCP Server',
          description: 'An example MCP server implementation',
          author: 'johndoe',
          dateAdded: '2024-01-15T10:30:00Z',
          tags: ['mcp', 'server', 'example'],
          mcpbUrl: 'https://mcpb.io/example',
          requiresAuth: false,
          tools: [{ name: 'getData', description: 'Get data from server' }],
          stats: { views: 500, bookmarks: 20 },
        },
      ],
      count: 15,
    },
  });

// 8. getRelatedContent output
export const GetRelatedContentOutputSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().meta({ example: 'related-agent-framework' }),
          title: z.string().meta({ example: 'Related Agent Framework' }),
          category: z.string().meta({ example: 'agents' }),
          description: z.string().meta({ example: 'Another framework related to the source' }),
          tags: z.array(z.string()).meta({ example: ['ai', 'automation'] }),
        })
      )
      .meta({ description: 'Array of related content items' }),
    source: z
      .object({
        slug: z.string().meta({ example: 'ai-agent-framework' }),
        category: z.string().meta({ example: 'agents' }),
      })
      .meta({ description: 'Source content reference' }),
    count: z.number().meta({ example: 5, description: 'Total number of related items returned' }),
  })
  .meta({
    description:
      'Output schema for getRelatedContent tool - returns content items related to a source item',
    example: {
      items: [
        {
          slug: 'related-agent-framework',
          title: 'Related Agent Framework',
          category: 'agents',
          description: 'Another framework related to the source',
          tags: ['ai', 'automation'],
        },
      ],
      source: { slug: 'ai-agent-framework', category: 'agents' },
      count: 5,
    },
  });

// 9. getContentByTag output
export const GetContentByTagOutputSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().meta({ example: 'ai-agent-framework' }),
          title: z.string().meta({ example: 'AI Agent Framework' }),
          category: z.string().meta({ example: 'agents' }),
          description: z
            .string()
            .meta({ example: 'A comprehensive framework for building AI agents' }),
          tags: z.array(z.string()).meta({ example: ['ai', 'automation'] }),
          author: z.string().meta({ example: 'johndoe' }),
          dateAdded: z
            .string()
            .datetime()
            .meta({ example: '2024-01-15T10:30:00Z', format: 'date-time' }),
        })
      )
      .meta({ description: 'Array of content items matching tags' }),
    tags: z
      .array(z.string())
      .meta({ example: ['ai', 'automation'], description: 'Tags used for filtering' }),
    logic: z
      .enum(['AND', 'OR'])
      .meta({ example: 'OR', description: 'Logical operator used for tag matching' }),
    category: z
      .string()
      .optional()
      .meta({ example: 'agents', description: 'Category filter applied (if any)' }),
    count: z.number().meta({ example: 25, description: 'Total number of items matching tags' }),
  })
  .meta({
    description: 'Output schema for getContentByTag tool - returns content items filtered by tags',
    example: {
      items: [
        {
          slug: 'ai-agent-framework',
          title: 'AI Agent Framework',
          category: 'agents',
          description: 'A comprehensive framework for building AI agents',
          tags: ['ai', 'automation'],
          author: 'johndoe',
          dateAdded: '2024-01-15T10:30:00Z',
        },
      ],
      tags: ['ai', 'automation'],
      logic: 'OR',
      category: 'agents',
      count: 25,
    },
  });

// 10. getPopular output
export const GetPopularOutputSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().meta({ example: 'ai-agent-framework' }),
          title: z.string().meta({ example: 'AI Agent Framework' }),
          category: z.string().meta({ example: 'agents' }),
          description: z
            .string()
            .meta({ example: 'A comprehensive framework for building AI agents' }),
          tags: z.array(z.string()).meta({ example: ['ai', 'automation'] }),
          author: z.string().meta({ example: 'johndoe' }),
          dateAdded: z
            .string()
            .datetime()
            .meta({ example: '2024-01-15T10:30:00Z', format: 'date-time' }),
          popularityScore: z
            .number()
            .optional()
            .meta({ example: 95.5, description: 'Popularity score (0-100)' }),
        })
      )
      .meta({ description: 'Array of popular content items' }),
    count: z.number().meta({ example: 20, description: 'Total number of popular items returned' }),
  })
  .meta({
    description:
      'Output schema for getPopular tool - returns popular content items sorted by engagement',
    example: {
      items: [
        {
          slug: 'ai-agent-framework',
          title: 'AI Agent Framework',
          category: 'agents',
          description: 'A comprehensive framework for building AI agents',
          tags: ['ai', 'automation'],
          author: 'johndoe',
          dateAdded: '2024-01-15T10:30:00Z',
          popularityScore: 95.5,
        },
      ],
      count: 20,
    },
  });

// 11. getRecent output
export const GetRecentOutputSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().meta({ example: 'new-agent-framework' }),
          title: z.string().meta({ example: 'New Agent Framework' }),
          category: z.string().meta({ example: 'agents' }),
          description: z
            .string()
            .meta({ example: 'A newly added framework for building AI agents' }),
          tags: z.array(z.string()).meta({ example: ['ai', 'automation', 'new'] }),
          author: z.string().meta({ example: 'johndoe' }),
          dateAdded: z
            .string()
            .datetime()
            .meta({ example: '2024-12-21T10:30:00Z', format: 'date-time' }),
        })
      )
      .meta({ description: 'Array of recently added content items' }),
    count: z.number().meta({ example: 20, description: 'Total number of recent items returned' }),
  })
  .meta({
    description:
      'Output schema for getRecent tool - returns recently added content items sorted by date',
    example: {
      items: [
        {
          slug: 'new-agent-framework',
          title: 'New Agent Framework',
          category: 'agents',
          description: 'A newly added framework for building AI agents',
          tags: ['ai', 'automation', 'new'],
          author: 'johndoe',
          dateAdded: '2024-12-21T10:30:00Z',
        },
      ],
      count: 20,
    },
  });

// 12. downloadContentForPlatform output
export const DownloadContentForPlatformOutputSchema = z
  .object({
    platform: z
      .enum(['claude-code', 'cursor', 'chatgpt-codex', 'generic'])
      .meta({ example: 'claude-code', description: 'Target platform' }),
    category: z.string().meta({ example: 'agents', description: 'Content category' }),
    slug: z.string().meta({ example: 'ai-agent-framework', description: 'Content slug' }),
    targetDirectory: z.string().optional().meta({
      example: '/Users/username/project/.claude',
      format: 'path',
      description: 'Target directory path',
    }),
    filePath: z.string().meta({
      example: '/Users/username/project/.claude/rules.md',
      format: 'path',
      description: 'Full file path where content was saved',
    }),
    content: z.string().meta({
      example: '# AI Agent Framework\n\nContent here...',
      description: 'Downloaded content',
    }),
    format: z.string().meta({ example: 'markdown', description: 'Content format' }),
  })
  .meta({
    description:
      'Output schema for downloadContentForPlatform tool - returns download confirmation with file path and content',
    example: {
      platform: 'claude-code',
      category: 'agents',
      slug: 'ai-agent-framework',
      targetDirectory: '/Users/username/project/.claude',
      filePath: '/Users/username/project/.claude/rules.md',
      content: '# AI Agent Framework\n\nContent here...',
      format: 'markdown',
    },
  });

// 13. getCategoryConfigs output
export const GetCategoryConfigsOutputSchema = z
  .object({
    configs: z
      .array(
        z.object({
          category: z.string().meta({ example: 'agents', description: 'Category identifier' }),
          title: z
            .string()
            .nullable()
            .meta({ example: 'AI Agents', description: 'Category display title' }),
          description: z
            .string()
            .nullable()
            .meta({ example: 'AI agents and assistants', description: 'Category description' }),
          icon: z.string().nullable().meta({ example: '🤖', description: 'Category icon' }),
          features: z
            .record(z.string(), z.unknown())
            .optional()
            .meta({
              example: { searchable: true, filterable: true },
              description: 'Category-specific features',
            }),
        })
      )
      .meta({ description: 'Array of category configurations' }),
    count: z
      .number()
      .meta({ example: 10, description: 'Total number of category configs returned' }),
  })
  .meta({
    description:
      'Output schema for getCategoryConfigs tool - returns category configuration metadata',
    example: {
      configs: [
        {
          category: 'agents',
          title: 'AI Agents',
          description: 'AI agents and assistants',
          icon: '🤖',
          features: { searchable: true, filterable: true },
        },
      ],
      count: 10,
    },
  });

// 14. getChangelog output
export const GetChangelogOutputSchema = z
  .object({
    format: z
      .enum(['llms-txt', 'json'])
      .meta({ example: 'llms-txt', description: 'Output format' }),
    content: z.string().meta({
      example: '# Changelog\n\n## 2024-12-21\n- Added new features...',
      description: 'Changelog content',
    }),
    entries: z
      .array(z.unknown())
      .optional()
      .meta({
        example: [{ version: '1.0.0', date: '2024-12-21', changes: ['Feature 1', 'Feature 2'] }],
        description: 'Parsed changelog entries (JSON format only)',
      }),
  })
  .meta({
    description:
      'Output schema for getChangelog tool - returns changelog content in requested format',
    example: {
      format: 'llms-txt',
      content: '# Changelog\n\n## 2024-12-21\n- Added new features...',
      entries: [{ version: '1.0.0', date: '2024-12-21', changes: ['Feature 1', 'Feature 2'] }],
    },
  });

// 15. getSearchFacets output
export const GetSearchFacetsOutputSchema = z
  .object({
    categories: z
      .array(
        z.object({
          category: z.string().meta({ example: 'agents', description: 'Category identifier' }),
          content_count: z
            .number()
            .meta({ example: 150, description: 'Number of content items in this category' }),
        })
      )
      .meta({ description: 'Available categories with content counts' }),
    tags: z
      .array(
        z.object({
          tag: z.string().meta({ example: 'ai', description: 'Tag name' }),
          content_count: z
            .number()
            .meta({ example: 75, description: 'Number of content items with this tag' }),
        })
      )
      .meta({ description: 'Available tags with content counts' }),
  })
  .meta({
    description:
      'Output schema for getSearchFacets tool - returns search facets (categories and tags) with counts',
    example: {
      categories: [{ category: 'agents', content_count: 150 }],
      tags: [{ tag: 'ai', content_count: 75 }],
    },
  });

// 16. getSearchSuggestions output
export const GetSearchSuggestionsOutputSchema = z
  .object({
    suggestions: z
      .array(
        z.object({
          query: z.string().meta({ example: 'ai agents', description: 'Suggested search query' }),
          count: z
            .number()
            .optional()
            .meta({ example: 25, description: 'Number of results for this query' }),
        })
      )
      .meta({ description: 'Array of search query suggestions' }),
    count: z.number().meta({ example: 10, description: 'Total number of suggestions returned' }),
  })
  .meta({
    description:
      'Output schema for getSearchSuggestions tool - returns autocomplete search suggestions',
    example: {
      suggestions: [{ query: 'ai agents', count: 25 }],
      count: 10,
    },
  });

// 17. getSocialProofStats output
export const GetSocialProofStatsOutputSchema = z
  .object({
    totalViews: z.number().meta({ example: 50000, description: 'Total views across all content' }),
    totalBookmarks: z
      .number()
      .meta({ example: 1500, description: 'Total bookmarks across all content' }),
    totalContent: z.number().meta({ example: 500, description: 'Total number of content items' }),
    statsByCategory: z
      .record(
        z.string(),
        z.object({
          views: z.number().meta({ example: 10000 }),
          bookmarks: z.number().meta({ example: 300 }),
        })
      )
      .meta({
        example: {
          agents: { views: 10000, bookmarks: 300 },
          rules: { views: 5000, bookmarks: 150 },
        },
        description: 'Statistics broken down by category',
      }),
  })
  .meta({
    description:
      'Output schema for getSocialProofStats tool - returns aggregate social proof statistics',
    example: {
      totalViews: 50000,
      totalBookmarks: 1500,
      totalContent: 500,
      statsByCategory: {
        agents: { views: 10000, bookmarks: 300 },
        rules: { views: 5000, bookmarks: 150 },
      },
    },
  });

// 18. submitContent output
export const SubmitContentOutputSchema = z
  .object({
    success: z.boolean().meta({ example: true }),
    message: z.string().meta({ example: 'Content submitted successfully' }),
    submissionUrl: z
      .string()
      .url()
      .optional()
      .meta({ example: 'https://claudepro.directory/submit/123', format: 'uri' }),
    instructions: z
      .array(z.string())
      .optional()
      .meta({ example: ['Review your submission', 'Wait for approval'] }),
  })
  .meta({
    description:
      'Output schema for submitContent tool - returns submission confirmation with next steps',
    example: {
      success: true,
      message: 'Content submitted successfully',
      submissionUrl: 'https://claudepro.directory/submit/123',
      instructions: ['Review your submission', 'Wait for approval'],
    },
  });

// 19. createAccount output
export const CreateAccountOutputSchema = z
  .object({
    success: z.boolean().meta({ example: true }),
    message: z.string().meta({ example: 'Account creation initiated' }),
    authUrl: z.string().url().meta({
      example: 'https://claudepro.directory/auth/github?redirect=/account',
      format: 'uri',
    }),
    provider: z.enum(['github', 'google', 'discord']).meta({ example: 'github' }),
  })
  .meta({
    description:
      'Output schema for createAccount tool - returns OAuth authorization URL for account creation',
    example: {
      success: true,
      message: 'Account creation initiated',
      authUrl: 'https://claudepro.directory/auth/github?redirect=/account',
      provider: 'github',
    },
  });

// 20. subscribeNewsletter output
export const SubscribeNewsletterOutputSchema = z
  .object({
    success: z.boolean().meta({ example: true }),
    message: z.string().meta({ example: 'Successfully subscribed to newsletter' }),
    email: z.string().email().meta({ example: 'user@example.com', format: 'email' }),
  })
  .meta({
    description:
      'Output schema for subscribeNewsletter tool - returns newsletter subscription confirmation',
    example: {
      success: true,
      message: 'Successfully subscribed to newsletter',
      email: 'user@example.com',
    },
  });

// 21. downloadSkillPackage output
export const DownloadSkillPackageOutputSchema = z
  .object({
    success: z
      .boolean()
      .meta({ example: true, description: 'Whether the download was successful' }),
    message: z
      .string()
      .meta({ example: 'Skill package downloaded successfully', description: 'Success message' }),
    slug: z.string().meta({ example: 'my-awesome-skill', description: 'Skill slug identifier' }),
    fileName: z
      .string()
      .meta({ example: 'my-awesome-skill.zip', description: 'Downloaded file name' }),
    downloadUrl: z.string().url().meta({
      example: 'https://claudepro.directory/api/v1/content/skills/my-awesome-skill?format=storage',
      format: 'uri',
      description: 'Direct download URL from Supabase Storage',
    }),
    filePath: z.string().optional().meta({
      example: '/Users/username/.claude/packages/my-awesome-skill.zip',
      format: 'path',
      description: 'Local file path if downloaded to filesystem (requires rootUri)',
    }),
    rootUri: z.string().optional().meta({
      example: 'file:///Users/username/.claude/packages',
      format: 'uri',
      description: 'Root URI used for download (if provided)',
    }),
    fileSize: z
      .number()
      .optional()
      .meta({ example: 1024000, description: 'File size in bytes (if available)' }),
    mimeType: z
      .string()
      .optional()
      .meta({ example: 'application/zip', description: 'File MIME type' }),
  })
  .meta({
    description:
      'Output schema for downloadSkillPackage tool - returns download confirmation with file path or URL',
    example: {
      success: true,
      message: 'Skill package downloaded successfully',
      slug: 'my-awesome-skill',
      fileName: 'my-awesome-skill.zip',
      downloadUrl:
        'https://claudepro.directory/api/v1/content/skills/my-awesome-skill?format=storage',
      filePath: '/Users/username/.claude/packages/my-awesome-skill.zip',
      rootUri: 'file:///Users/username/.claude/packages',
      fileSize: 1024000,
      mimeType: 'application/zip',
    },
  });

// 22. downloadMcpServerPackage output
export const DownloadMcpServerPackageOutputSchema = z
  .object({
    success: z
      .boolean()
      .meta({ example: true, description: 'Whether the download was successful' }),
    message: z.string().meta({
      example: 'MCP server package downloaded successfully',
      description: 'Success message',
    }),
    slug: z
      .string()
      .meta({ example: 'example-mcp-server', description: 'MCP server slug identifier' }),
    fileName: z
      .string()
      .meta({ example: 'example-mcp-server.mcpb', description: 'Downloaded file name' }),
    downloadUrl: z.string().url().meta({
      example: 'https://claudepro.directory/api/v1/content/mcp/example-mcp-server?format=storage',
      format: 'uri',
      description: 'Direct download URL from Supabase Storage',
    }),
    filePath: z.string().optional().meta({
      example: '/Users/username/.claude/mcp/example-mcp-server.mcpb',
      format: 'path',
      description: 'Local file path if downloaded to filesystem (requires rootUri)',
    }),
    rootUri: z.string().optional().meta({
      example: 'file:///Users/username/.claude/mcp',
      format: 'uri',
      description: 'Root URI used for download (if provided)',
    }),
    fileSize: z
      .number()
      .optional()
      .meta({ example: 2048000, description: 'File size in bytes (if available)' }),
    mimeType: z
      .string()
      .optional()
      .meta({ example: 'application/zip', description: 'File MIME type (.mcpb is a ZIP file)' }),
  })
  .meta({
    description:
      'Output schema for downloadMcpServerPackage tool - returns download confirmation with file path or URL',
    example: {
      success: true,
      message: 'MCP server package downloaded successfully',
      slug: 'example-mcp-server',
      fileName: 'example-mcp-server.mcpb',
      downloadUrl:
        'https://claudepro.directory/api/v1/content/mcp/example-mcp-server?format=storage',
      filePath: '/Users/username/.claude/mcp/example-mcp-server.mcpb',
      rootUri: 'file:///Users/username/.claude/mcp',
      fileSize: 2048000,
      mimeType: 'application/zip',
    },
  });

// 23. downloadStorageFile output
export const DownloadStorageFileOutputSchema = z
  .object({
    success: z
      .boolean()
      .meta({ example: true, description: 'Whether the download was successful' }),
    message: z
      .string()
      .meta({ example: 'Storage file downloaded successfully', description: 'Success message' }),
    category: z.string().meta({ example: 'skills', description: 'Content category' }),
    slug: z.string().meta({ example: 'my-content', description: 'Content slug identifier' }),
    fileName: z.string().meta({ example: 'my-content.zip', description: 'Downloaded file name' }),
    downloadUrl: z.string().url().meta({
      example: 'https://claudepro.directory/api/v1/content/skills/my-content?format=storage',
      format: 'uri',
      description: 'Direct download URL from Supabase Storage',
    }),
    filePath: z.string().optional().meta({
      example: '/Users/username/.claude/packages/my-content.zip',
      format: 'path',
      description: 'Local file path if downloaded to filesystem (requires rootUri)',
    }),
    rootUri: z.string().optional().meta({
      example: 'file:///Users/username/.claude/packages',
      format: 'uri',
      description: 'Root URI used for download (if provided)',
    }),
    fileType: z
      .enum(['zip', 'mcpb', 'json', 'other'])
      .optional()
      .meta({ example: 'zip', description: 'Detected or specified file type' }),
    fileSize: z
      .number()
      .optional()
      .meta({ example: 1536000, description: 'File size in bytes (if available)' }),
    mimeType: z
      .string()
      .optional()
      .meta({ example: 'application/zip', description: 'File MIME type' }),
    bucket: z
      .string()
      .optional()
      .meta({ example: 'skills', description: 'Supabase Storage bucket name' }),
  })
  .meta({
    description:
      'Output schema for downloadStorageFile tool - returns download confirmation with file path or URL for any storage file',
    example: {
      success: true,
      message: 'Storage file downloaded successfully',
      category: 'skills',
      slug: 'my-content',
      fileName: 'my-content.zip',
      downloadUrl: 'https://claudepro.directory/api/v1/content/skills/my-content?format=storage',
      filePath: '/Users/username/.claude/packages/my-content.zip',
      rootUri: 'file:///Users/username/.claude/packages',
      fileType: 'zip',
      fileSize: 1536000,
      mimeType: 'application/zip',
      bucket: 'skills',
    },
  });

/**
 * Prompt argument schemas
 * These define the input structures for MCP prompts
 */

// Category prompt args (for submit-content-guide, etc.)
export const CategoryPromptArgSchema = z
  .object({
    category: CategorySchema.optional().describe('Content category filter').meta({
      description: 'Content category filter',
      example: 'agents',
    }),
    submission_type: z.string().optional().describe('Type of content submission').meta({
      description: 'Type of content submission',
      example: 'agents',
    }),
  })
  .meta({ description: 'Arguments for category-based prompts' });

// Platform prompt args (for platform-specific prompts)
export const PlatformPromptArgSchema = z
  .object({
    platform: z
      .enum(['claude-code', 'cursor', 'chatgpt-codex', 'generic'])
      .describe('Target platform for content')
      .meta({
        description: 'Target platform for content',
        example: 'claude-code',
      }),
    content_type: z.string().optional().describe('Type of content').meta({
      description: 'Type of content',
      example: 'rules',
    }),
  })
  .meta({ description: 'Arguments for platform-specific prompts' });

// Query type prompt args
export const QueryTypePromptArgSchema = z
  .object({
    query_type: z.string().optional().describe('Type of query or search').meta({
      description: 'Type of query or search',
      example: 'search',
    }),
  })
  .meta({ description: 'Arguments for query type prompts' });

// Server slug prompt args
export const ServerSlugPromptArgSchema = z
  .object({
    server_slug: z.string().optional().describe('MCP server slug identifier').meta({
      description: 'MCP server slug identifier',
      example: 'example-mcp-server',
    }),
  })
  .meta({ description: 'Arguments for server slug prompts' });

// Content type prompt args
export const ContentTypePromptArgSchema = z
  .object({
    content_type: z.string().optional().describe('Type of content').meta({
      description: 'Type of content',
      example: 'rules',
    }),
  })
  .meta({ description: 'Arguments for content type prompts' });

// Format prompt args
export const FormatPromptArgSchema = z
  .object({
    format: z
      .enum(['markdown', 'json', 'llms-txt', 'txt'])
      .optional()
      .describe('Output format for content')
      .meta({
        description: 'Output format for content',
        example: 'markdown',
      }),
  })
  .meta({ description: 'Arguments for format prompts' });

/**
 * Infer TypeScript types from prompt schemas
 */
export type CategoryPromptArgs = z.infer<typeof CategoryPromptArgSchema>;
export type PlatformPromptArgs = z.infer<typeof PlatformPromptArgSchema>;
export type QueryTypePromptArgs = z.infer<typeof QueryTypePromptArgSchema>;
export type ServerSlugPromptArgs = z.infer<typeof ServerSlugPromptArgSchema>;
export type ContentTypePromptArgs = z.infer<typeof ContentTypePromptArgSchema>;
export type FormatPromptArgs = z.infer<typeof FormatPromptArgSchema>;
