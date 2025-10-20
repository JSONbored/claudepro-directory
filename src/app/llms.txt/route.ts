/**
 * Site-Wide LLMs.txt Route Handler (Restored)
 * 
 * @route GET /llms.txt
 */

import type { NextRequest } from 'next/server';
import {
  agents,
  collections,
  commands,
  hooks,
  mcp,
  rules,
  skills,
  statuslines,
} from '@/generated/content';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { generateSiteLLMsTxt } from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';
import { batchLoadContent } from '@/src/lib/utils/batch.utils';
import { APP_CONFIG } from '@/src/lib/constants';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);

  try {
    requestLogger.info('Site llms.txt generation started');

    const {
      mcp: mcpItems,
      commands: commandsItems,
      hooks: hooksItems,
      rules: rulesItems,
      agents: agentsItems,
      statuslines: statuslinesItems,
      collections: collectionsItems,
    } = await batchLoadContent({
      mcp,
      commands,
      hooks,
      rules,
      agents,
      statuslines,
      collections,
      skills,
    });

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

    const llmsTxt = await generateSiteLLMsTxt(categoryStats);

    requestLogger.info('Site llms.txt generated successfully', {
      categoriesCount: categoryStats.length,
      totalItems: categoryStats.reduce((sum, cat) => sum + cat.count, 0),
      contentLength: llmsTxt.length,
    });

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
