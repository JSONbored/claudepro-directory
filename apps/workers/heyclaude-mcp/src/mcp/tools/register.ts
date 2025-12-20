/**
 * Tool Registration Implementation
 *
 * Registers all 20 MCP tools with the server.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext } from './categories.js';
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
} from '../../lib/types';

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

/**
 * Helper to wrap tool handlers with timeout protection
 *
 * @param handler - Tool handler function
 * @param toolName - Name of the tool (for error messages)
 * @param timeoutMs - Timeout in milliseconds (default: 60s)
 * @returns Wrapped handler with timeout protection
 */
function wrapWithTimeout<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>,
  toolName: string,
  timeoutMs: number = 60000
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool ${toolName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([handler(...args), timeoutPromise]);
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
    wrapWithTimeout(
      async (args) => await handleListCategories(args, context),
      'listCategories',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleSearchContent(args, context),
      'searchContent',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetContentDetail(args, context),
      'getContentDetail',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetTrending(args, context),
      'getTrending',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetFeatured(args, context),
      'getFeatured',
      45000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetPopular(args, context),
      'getPopular',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetRecent(args, context),
      'getRecent',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetTemplates(args, context),
      'getTemplates',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetCategoryConfigs(args, context),
      'getCategoryConfigs',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetChangelog(args, context),
      'getChangelog',
      30000
    )
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
    wrapWithTimeout(
      async () => await handleGetSearchFacets(context),
      'getSearchFacets',
      30000
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
    wrapWithTimeout(
      async (args) => await handleGetSearchSuggestions(args, context),
      'getSearchSuggestions',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetMcpServers(args, context),
      'getMcpServers',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetRelatedContent(args, context),
      'getRelatedContent',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetContentByTag(args, context),
      'getContentByTag',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleDownloadContentForPlatform(args, context),
      'downloadContentForPlatform',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleGetSocialProofStats(args, context),
      'getSocialProofStats',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleSubmitContent(args, context),
      'submitContent',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleCreateAccount(args, context),
      'createAccount',
      30000
    )
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
    wrapWithTimeout(
      async (args) => await handleSubscribeNewsletter(args, context),
      'subscribeNewsletter',
      30000
    )
  );
}
