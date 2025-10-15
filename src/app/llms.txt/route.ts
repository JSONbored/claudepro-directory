/**
 * Site-Wide LLMs.txt Route Handler
 * Generates AI-optimized plain text index for the entire site
 *
 * @route GET /llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import type { NextRequest } from 'next/server';
import { agents, collections, commands, hooks, mcp, rules, statuslines, skills } from '@/generated/content';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { generateSiteLLMsTxt } from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';
import { batchLoadContent } from '@/src/lib/utils/batch.utils';

/**
 * Runtime configuration
 * Use Node.js runtime for better performance with text generation
 */
export const runtime = 'nodejs';

/**
 * ISR revalidation
 * Revalidate every hour (3600 seconds) - site structure changes infrequently
 */
export const revalidate = 3600;

/**
 * Handle GET request for site-wide llms.txt
 *
 * @param request - Next.js request object
 * @returns Plain text response with site index
 *
 * @remarks
 * This route generates a complete site index listing all content categories
 * and their statistics. It follows the llms.txt specification for providing
 * AI-friendly navigation and discovery.
 *
 * Response format:
 * - Plain text (text/plain charset=utf-8)
 * - Cached for 1 hour via ISR
 * - Public cache headers for CDN distribution
 */
export async function GET(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);

  try {
    requestLogger.info('Site llms.txt generation started');

    // Gather category statistics - await all promises in parallel
    const {
      mcp: mcpItems,
      commands: commandsItems,
      hooks: hooksItems,
      rules: rulesItems,
      agents: agentsItems,
      statuslines: statuslinesItems,
      collections: collectionsItems,
    } = await batchLoadContent({ mcp, commands, hooks, rules, agents, statuslines, collections, skills });

    const categoryStats = [
      {
        name: 'MCP Servers',
        count: mcpItems.length,
        url: '/mcp',
        description:
          'Model Context Protocol servers for extending Claude with external tools and data sources',
      },
      {
        name: 'Commands',
        count: commandsItems.length,
        url: '/commands',
        description: 'Custom slash commands for Claude Code to streamline development workflows',
      },
      {
        name: 'Hooks',
        count: hooksItems.length,
        url: '/hooks',
        description: 'Automation hooks that trigger on events in Claude Code sessions',
      },
      {
        name: 'Rules',
        count: rulesItems.length,
        url: '/rules',
        description:
          'Custom instructions and system prompts to modify Claude behavior for specific tasks',
      },
      {
        name: 'Agents',
        count: agentsItems.length,
        url: '/agents',
        description: 'Specialized AI agents with predefined roles and expertise areas',
      },
      {
        name: 'Statuslines',
        count: statuslinesItems.length,
        url: '/statuslines',
        description: 'Custom status line configurations for Claude Code workspace displays',
      },
      {
        name: 'Collections',
        count: collectionsItems.length,
        url: '/collections',
        description: 'Curated bundles of related configurations for specific use cases',
      },
      {
        name: 'Skills',
        count: (await skills).length,
        url: '/skills',
        description:
          'Task-focused capability guides with dependencies, examples, and troubleshooting for document/data workflows',
      },
    ];

    // Generate llms.txt content
    const llmsTxt = await generateSiteLLMsTxt(categoryStats);

    requestLogger.info('Site llms.txt generated successfully', {
      categoriesCount: categoryStats.length,
      totalItems: categoryStats.reduce((sum, cat) => sum + cat.count, 0),
      contentLength: llmsTxt.length,
    });

    // Return plain text response via unified builder
    return apiResponse.raw(llmsTxt, {
      contentType: 'text/plain; charset=utf-8',
      headers: { 'X-Robots-Tag': 'index, follow' },
      cache: { sMaxAge: 3600, staleWhileRevalidate: 86400 },
    });
  } catch (error: unknown) {
    requestLogger.error(
      'Failed to generate site llms.txt',
      error instanceof Error ? error : new Error(String(error))
    );

    // Use centralized error handling
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Failed to generate llms.txt' },
      {
        route: '/llms.txt',
        operation: 'generate_site_llmstxt',
        method: 'GET',
      }
    );
  }
}
