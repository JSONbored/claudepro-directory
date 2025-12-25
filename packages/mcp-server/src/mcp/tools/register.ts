/**
 * Tool Registration Implementation
 *
 * Registers all 20 MCP tools with the server.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext } from '../../types/runtime.js';
import {
  ListCategoriesInputSchema,
  SearchContentInputSchema,
  GetContentDetailInputSchema,
  GetTrendingInputSchema,
  GetFeaturedInputSchema,
  GetTemplatesInputSchema,
  GetMcpServersInputSchema,
  GetRelatedContentInputSchema,
  GetContentByTagInputSchema,
  GetPopularInputSchema,
  GetRecentInputSchema,
  DownloadContentForPlatformInputSchema,
  GetCategoryConfigsInputSchema,
  GetChangelogInputSchema,
  GetSearchFacetsInputSchema,
  GetSearchSuggestionsInputSchema,
  GetSocialProofStatsInputSchema,
  SubmitContentInputSchema,
  CreateAccountInputSchema,
  SubscribeNewsletterInputSchema,
  DownloadSkillPackageInputSchema,
  DownloadMcpServerPackageInputSchema,
  DownloadStorageFileInputSchema,
  ListCategoriesOutputSchema,
  SearchContentOutputSchema,
  GetContentDetailOutputSchema,
  GetTrendingOutputSchema,
  GetFeaturedOutputSchema,
  GetPopularOutputSchema,
  GetRecentOutputSchema,
  GetTemplatesOutputSchema,
  GetCategoryConfigsOutputSchema,
  GetChangelogOutputSchema,
  GetSearchFacetsOutputSchema,
  GetSearchSuggestionsOutputSchema,
  GetMcpServersOutputSchema,
  GetRelatedContentOutputSchema,
  GetContentByTagOutputSchema,
  DownloadContentForPlatformOutputSchema,
  GetSocialProofStatsOutputSchema,
  SubmitContentOutputSchema,
  CreateAccountOutputSchema,
  SubscribeNewsletterOutputSchema,
  DownloadSkillPackageOutputSchema,
  DownloadMcpServerPackageOutputSchema,
  DownloadStorageFileOutputSchema,
} from '../../lib/types.js';

// Import tool handlers (migrating incrementally)
import { handleListCategories } from './categories';
import { handleSearchContent } from './search.js';
import { handleGetContentDetail } from './detail.js';
import { handleGetTrending } from './trending.js';
import { handleGetFeatured } from './featured.js';
import { handleGetPopular } from './popular.js';
import { handleGetRecent } from './recent.js';
import { handleGetTemplates } from './templates.js';
import { handleGetCategoryConfigs } from './category-configs.js';
import { handleGetChangelog } from './changelog.js';
import { handleGetSearchFacets } from './search-facets.js';
import { handleGetSearchSuggestions } from './search-suggestions.js';
import { handleGetMcpServers } from './mcp-servers.js';
import { handleGetRelatedContent } from './related.js';
import { handleGetContentByTag } from './tags.js';
import { handleDownloadContentForPlatform } from './download-platform.js';
import { handleGetSocialProofStats } from './social-proof.js';
import { handleSubmitContent } from './submit-content.js';
import { handleCreateAccount } from './account.js';
import { handleSubscribeNewsletter } from './newsletter.js';
import { handleDownloadSkillPackage } from './download-skill-package.js';
import { handleDownloadMcpServerPackage } from './download-mcp-server-package.js';
import { handleDownloadStorageFile } from './download-storage-file.js';

/**
 * Helper to wrap tool handlers with timeout protection, request deduplication, and metrics
 *
 * MCP SDK's registerTool expects: (args: TInput) => Promise<TOutput>
 * Our handlers have signature: (input: TInput, context: ToolContext) => Promise<TOutput>
 * This wrapper captures context in closure and applies optimizations
 *
 * @param handler - Tool handler function (input, context) => Promise<output>
 * @param toolName - Name of the tool (for error messages and metrics)
 * @param timeoutMs - Timeout in milliseconds (default: 60s)
 * @param context - Tool context (captured in closure)
 * @returns Wrapped handler that matches MCP SDK signature: (args) => Promise<output>
 */
function wrapToolHandler<TInput, TOutput>(
  handler: (input: TInput, context: ToolContext) => Promise<TOutput>,
  toolName: string,
  timeoutMs: number,
  context: ToolContext
): (args: TInput) => Promise<TOutput> {
  // Create handler that captures context
  return async (input: TInput): Promise<TOutput> => {
    // Apply optimizations (dynamic imports to avoid circular dependencies)
    let wrappedHandler = handler;
    let sanitizedInput = input;

    // 1. Input sanitization (XSS prevention)
    // Note: MCP SDK already validates input with Zod schemas, but we sanitize strings for XSS
    try {
      const { sanitizeObject } = await import('../../middleware/input-sanitization.js');
      if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
        sanitizedInput = sanitizeObject(input as Record<string, unknown>) as TInput;
      }
    } catch {
      // Sanitization not available, skip
    }

    // 2. Request deduplication
    try {
      const { withRequestDeduplication } =
        await import('../../middleware/request-deduplication.js');
      const deduplicatedHandler = withRequestDeduplication<TInput, TOutput, ToolContext>(
        toolName,
        wrappedHandler,
        { enabled: true, ttl: 5000 }
      );
      // Wrap to capture context
      wrappedHandler = (input: TInput, ctx: ToolContext) => deduplicatedHandler(input, ctx);
    } catch {
      // Deduplication not available, skip
    }

    // 3. Metrics tracking
    try {
      const { withMetrics } = await import('../../observability/metrics.js');
      const meteredHandler = withMetrics<TInput, TOutput, ToolContext>(
        toolName,
        wrappedHandler,
        context.logger
      );
      // Wrap to capture context
      wrappedHandler = (input: TInput, ctx: ToolContext) => meteredHandler(input, ctx);
    } catch {
      // Metrics not available, skip
    }

    // 4. Timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool ${toolName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Execute with timeout and sanitized input
    return Promise.race([wrappedHandler(sanitizedInput, context), timeoutPromise]);
  };
}

/**
 * Register all tools on the MCP server
 *
 * @param mcpServer - MCP server instance
 * @param context - Tool handler context
 */
export function registerAllTools(mcpServer: McpServer, context: ToolContext): void {
  // 1. listCategories - List all directory categories
  mcpServer.registerTool(
    'listCategories',
    {
      title: 'List Categories',
      description:
        'List all content categories in the HeyClaude directory with counts and descriptions',
      inputSchema: ListCategoriesInputSchema,
      outputSchema: ListCategoriesOutputSchema,
    },
    wrapToolHandler(handleListCategories, 'listCategories', 30000, context)
  );

  // 2. searchContent - Search with filters and pagination
  mcpServer.registerTool(
    'searchContent',
    {
      title: 'Search Content',
      description:
        'Search content with query, category, tags, and pagination. Returns formatted results with metadata.',
      inputSchema: SearchContentInputSchema,
      outputSchema: SearchContentOutputSchema,
    },
    wrapToolHandler(handleSearchContent, 'searchContent', 30000, context)
  );

  // 3. getContentDetail - Get complete content metadata
  mcpServer.registerTool(
    'getContentDetail',
    {
      title: 'Get Content Detail',
      description:
        'Get complete metadata for a specific content item by slug and category. Includes full description, tags, author info, and stats.',
      inputSchema: GetContentDetailInputSchema,
      outputSchema: GetContentDetailOutputSchema,
    },
    wrapToolHandler(handleGetContentDetail, 'getContentDetail', 30000, context)
  );

  // 4. getTrending - Get trending content
  mcpServer.registerTool(
    'getTrending',
    {
      title: 'Get Trending Content',
      description:
        'Get trending content across categories or within a specific category. Sorted by popularity and engagement.',
      inputSchema: GetTrendingInputSchema,
      outputSchema: GetTrendingOutputSchema,
    },
    wrapToolHandler(handleGetTrending, 'getTrending', 30000, context)
  );

  // 5. getFeatured - Get featured/highlighted content
  mcpServer.registerTool(
    'getFeatured',
    {
      title: 'Get Featured Content',
      description:
        'Get featured and highlighted content from the homepage. Includes hero items, latest additions, and popular content.',
      inputSchema: GetFeaturedInputSchema,
      outputSchema: GetFeaturedOutputSchema,
    },
    wrapToolHandler(handleGetFeatured, 'getFeatured', 45000, context)
  );

  // 6. getPopular - Get popular content
  mcpServer.registerTool(
    'getPopular',
    {
      title: 'Get Popular Content',
      description:
        'Get popular content across categories or within a specific category. Sorted by views and engagement metrics.',
      inputSchema: GetPopularInputSchema,
      outputSchema: GetPopularOutputSchema,
    },
    wrapToolHandler(handleGetPopular, 'getPopular', 30000, context)
  );

  // 7. getRecent - Get recently added content
  mcpServer.registerTool(
    'getRecent',
    {
      title: 'Get Recent Content',
      description:
        'Get recently added content (optionally filtered by category). Shows items added within the last 30 days.',
      inputSchema: GetRecentInputSchema,
      outputSchema: GetRecentOutputSchema,
    },
    wrapToolHandler(handleGetRecent, 'getRecent', 30000, context)
  );

  // 8. getTemplates - Get submission templates
  mcpServer.registerTool(
    'getTemplates',
    {
      title: 'Get Templates',
      description:
        'Get content submission templates for creating new content. Includes field definitions, requirements, and examples.',
      inputSchema: GetTemplatesInputSchema,
      outputSchema: GetTemplatesOutputSchema,
    },
    wrapToolHandler(handleGetTemplates, 'getTemplates', 30000, context)
  );

  // 9. getCategoryConfigs - Get category configurations
  mcpServer.registerTool(
    'getCategoryConfigs',
    {
      title: 'Get Category Configs',
      description:
        'Get category-specific configurations and features. Helps understand category-specific requirements and submission guidelines.',
      inputSchema: GetCategoryConfigsInputSchema,
      outputSchema: GetCategoryConfigsOutputSchema,
    },
    wrapToolHandler(handleGetCategoryConfigs, 'getCategoryConfigs', 30000, context)
  );

  // 10. getChangelog - Get changelog in LLMs.txt format
  mcpServer.registerTool(
    'getChangelog',
    {
      title: 'Get Changelog',
      description:
        'Get changelog of content updates in LLMs.txt format. Helps AI agents understand recent changes and stay current.',
      inputSchema: GetChangelogInputSchema,
      outputSchema: GetChangelogOutputSchema,
    },
    wrapToolHandler(handleGetChangelog, 'getChangelog', 30000, context)
  );

  // 11. getSearchFacets - Get available search facets
  mcpServer.registerTool(
    'getSearchFacets',
    {
      title: 'Get Search Facets',
      description:
        'Get available search facets (categories, tags, authors) for filtering content. Helps AI agents understand what filters are available.',
      inputSchema: GetSearchFacetsInputSchema,
      outputSchema: GetSearchFacetsOutputSchema,
    },
    // Special case: handleGetSearchFacets only takes context, not input
    wrapToolHandler(
      async (_input: unknown, ctx: ToolContext) => await handleGetSearchFacets(ctx),
      'getSearchFacets',
      30000,
      context
    )
  );

  // 12. getSearchSuggestions - Get search suggestions
  mcpServer.registerTool(
    'getSearchSuggestions',
    {
      title: 'Get Search Suggestions',
      description:
        'Get search suggestions based on query history. Helps discover popular searches and provides autocomplete functionality for AI agents.',
      inputSchema: GetSearchSuggestionsInputSchema,
      outputSchema: GetSearchSuggestionsOutputSchema,
    },
    wrapToolHandler(handleGetSearchSuggestions, 'getSearchSuggestions', 30000, context)
  );

  // 13. getMcpServers - Get MCP servers from directory
  mcpServer.registerTool(
    'getMcpServers',
    {
      title: 'Get MCP Servers',
      description:
        'Get MCP servers from the HeyClaude directory with metadata, download URLs, and configuration details.',
      inputSchema: GetMcpServersInputSchema,
      outputSchema: GetMcpServersOutputSchema,
    },
    wrapToolHandler(handleGetMcpServers, 'getMcpServers', 30000, context)
  );

  // 14. getRelatedContent - Get related content
  mcpServer.registerTool(
    'getRelatedContent',
    {
      title: 'Get Related Content',
      description:
        'Get related content for a given slug and category. Uses similarity matching based on tags and content.',
      inputSchema: GetRelatedContentInputSchema,
      outputSchema: GetRelatedContentOutputSchema,
    },
    wrapToolHandler(handleGetRelatedContent, 'getRelatedContent', 30000, context)
  );

  // 15. getContentByTag - Get content by tags
  mcpServer.registerTool(
    'getContentByTag',
    {
      title: 'Get Content By Tag',
      description:
        'Get content filtered by specific tags with AND/OR logic support. Can optionally filter by category.',
      inputSchema: GetContentByTagInputSchema,
      outputSchema: GetContentByTagOutputSchema,
    },
    wrapToolHandler(handleGetContentByTag, 'getContentByTag', 30000, context)
  );

  // 16. downloadContentForPlatform - Download content formatted for platform
  mcpServer.registerTool(
    'downloadContentForPlatform',
    {
      title: 'Download Content For Platform',
      description:
        'Download content formatted for a specific platform (Claude Code, Cursor, ChatGPT Codex, or generic). Returns formatted content with installation instructions.',
      inputSchema: DownloadContentForPlatformInputSchema,
      outputSchema: DownloadContentForPlatformOutputSchema,
    },
    wrapToolHandler(handleDownloadContentForPlatform, 'downloadContentForPlatform', 30000, context)
  );

  // 17. getSocialProofStats - Get community statistics
  mcpServer.registerTool(
    'getSocialProofStats',
    {
      title: 'Get Social Proof Stats',
      description:
        'Get community statistics including top contributors, recent submissions, success rate, and total user count. Provides social proof data for engagement.',
      inputSchema: GetSocialProofStatsInputSchema,
      outputSchema: GetSocialProofStatsOutputSchema,
    },
    wrapToolHandler(handleGetSocialProofStats, 'getSocialProofStats', 30000, context)
  );

  // 18. submitContent - Guide content submission
  mcpServer.registerTool(
    'submitContent',
    {
      title: 'Submit Content',
      description:
        'Guide users through content submission using MCP elicitation. Collects submission data step-by-step and provides submission instructions with pre-filled URLs.',
      inputSchema: SubmitContentInputSchema,
      outputSchema: SubmitContentOutputSchema,
    },
    wrapToolHandler(handleSubmitContent, 'submitContent', 30000, context)
  );

  // 19. createAccount - Create account via OAuth
  mcpServer.registerTool(
    'createAccount',
    {
      title: 'Create Account',
      description:
        'Provides OAuth URLs and instructions for creating an account. Supports newsletter opt-in during account creation.',
      inputSchema: CreateAccountInputSchema,
      outputSchema: CreateAccountOutputSchema,
    },
    wrapToolHandler(handleCreateAccount, 'createAccount', 30000, context)
  );

  // 20. subscribeNewsletter - Subscribe to newsletter
  mcpServer.registerTool(
    'subscribeNewsletter',
    {
      title: 'Subscribe Newsletter',
      description:
        'Subscribes a user to the newsletter via Inngest. Sends event to Inngest which handles email validation, Resend audience sync, database subscription, welcome email, and drip campaign enrollment.',
      inputSchema: SubscribeNewsletterInputSchema,
      outputSchema: SubscribeNewsletterOutputSchema,
    },
    wrapToolHandler(handleSubscribeNewsletter, 'subscribeNewsletter', 30000, context)
  );

  // 21. downloadSkillPackage - Download Skills ZIP file from Supabase Storage
  mcpServer.registerTool(
    'downloadSkillPackage',
    {
      title: 'Download Skill Package',
      description:
        'Downloads a Skills ZIP file from Supabase Storage. If rootUri is provided, writes to client filesystem using Roots. Otherwise, returns download URL for manual download.',
      inputSchema: DownloadSkillPackageInputSchema,
      outputSchema: DownloadSkillPackageOutputSchema,
    },
    wrapToolHandler(handleDownloadSkillPackage, 'downloadSkillPackage', 60000, context)
  );

  // 22. downloadMcpServerPackage - Download MCP server .mcpb file from Supabase Storage
  mcpServer.registerTool(
    'downloadMcpServerPackage',
    {
      title: 'Download MCP Server Package',
      description:
        'Downloads an MCP server .mcpb file from Supabase Storage. If rootUri is provided, writes to client filesystem using Roots. Otherwise, returns download URL for manual download.',
      inputSchema: DownloadMcpServerPackageInputSchema,
      outputSchema: DownloadMcpServerPackageOutputSchema,
    },
    wrapToolHandler(handleDownloadMcpServerPackage, 'downloadMcpServerPackage', 60000, context)
  );

  // 23. downloadStorageFile - Generic tool for downloading any storage file
  mcpServer.registerTool(
    'downloadStorageFile',
    {
      title: 'Download Storage File',
      description:
        'Generic tool for downloading any storage file from Supabase Storage. Supports Skills ZIPs, MCP server .mcpb files, and future storage file types. If rootUri is provided, writes to client filesystem using Roots. Otherwise, returns download URL for manual download.',
      inputSchema: DownloadStorageFileInputSchema,
      outputSchema: DownloadStorageFileOutputSchema,
    },
    wrapToolHandler(handleDownloadStorageFile, 'downloadStorageFile', 60000, context)
  );
}
