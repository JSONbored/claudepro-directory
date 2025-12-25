/**
 * Resource Registration Implementation
 *
 * Registers all 3 MCP resource templates with the server.
 * Uses factory pattern to reduce code duplication.
 * Includes completion handlers for context-aware autocomplete.
 */

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext } from '../../types/runtime.js';
import { createKvCache } from '../../cache/kv-cache.js';
import { handleContentResource } from './content.js';
import { handleCategoryResource } from './category.js';
import { handleSitewideResource } from './sitewide.js';
import { getCategoryCompletions, getSlugCompletions, getFormatCompletions } from './completions.js';

/**
 * Register all resources on the MCP server
 *
 * @param mcpServer - MCP server instance
 * @param context - Tool handler context
 */
export function registerAllResources(mcpServer: McpServer, context: ToolContext): void {
  const { prisma, logger, kvCache } = context;

  // Create KV cache instance if KV binding is available
  const resourceCache = kvCache ? createKvCache(kvCache, { ttl: 3600 }) : null;

  // 1. Content resource: claudepro://content/{category}/{slug}/{format}
  mcpServer.registerResource(
    'content',
    new ResourceTemplate('claudepro://content/{category}/{slug}/{format}', {
      list: undefined,
      complete: {
        category: async (value: string) => {
          return await getCategoryCompletions(value, prisma, logger);
        },
        slug: async (value: string, context?: { arguments?: Record<string, unknown> }) => {
          const category = context?.arguments?.['category'] as string | undefined;
          return await getSlugCompletions(value, category, prisma, logger);
        },
        format: async (value: string) => {
          return getFormatCompletions(value);
        },
      },
    }),
    {
      title: 'Content Export',
      description:
        'Export content in various formats (llms.txt, markdown, json, rss, atom). Supports all content categories.',
      mimeType: 'text/plain',
    },
    async (uri: URL, _context?: { category?: string; slug?: string; format?: string }) => {
      // Note: MCP SDK doesn't provide request headers in resource handler
      // Cache headers will be added at HTTP response level in worker handler
      const result = await handleContentResource(uri.href, logger, resourceCache);
      return {
        contents: [
          {
            uri: result.uri,
            mimeType: result.mimeType,
            text: result.text,
          },
        ],
      };
    }
  );

  // 2. Category resource: claudepro://category/{category}/{format}
  mcpServer.registerResource(
    'category',
    new ResourceTemplate('claudepro://category/{category}/{format}', {
      list: undefined,
      complete: {
        category: async (value: string) => {
          return await getCategoryCompletions(value, prisma, logger);
        },
        format: async (value: string) => {
          return getFormatCompletions(value);
        },
      },
    }),
    {
      title: 'Category Export',
      description:
        'Export all content in a category in various formats (llms.txt, markdown, json, rss, atom).',
      mimeType: 'text/plain',
    },
    async (uri: URL, _context?: { category?: string; format?: string }) => {
      // Note: MCP SDK doesn't provide request headers in resource handler
      // Cache headers will be added at HTTP response level in worker handler
      const result = await handleCategoryResource(uri.href, logger, resourceCache);
      return {
        contents: [
          {
            uri: result.uri,
            mimeType: result.mimeType,
            text: result.text,
          },
        ],
      };
    }
  );

  // 3. Sitewide resource: claudepro://sitewide/{format}
  mcpServer.registerResource(
    'sitewide',
    new ResourceTemplate('claudepro://sitewide/{format}', {
      list: undefined,
      complete: {
        format: async (value: string) => {
          return getFormatCompletions(value);
        },
      },
    }),
    {
      title: 'Sitewide Export',
      description:
        'Export all content across all categories in various formats (llms.txt, markdown, json, rss, atom).',
      mimeType: 'text/plain',
    },
    async (uri: URL, _context?: { format?: string }) => {
      // Note: MCP SDK doesn't provide request headers in resource handler
      // Cache headers will be added at HTTP response level in worker handler
      const result = await handleSitewideResource(uri.href, logger, resourceCache);
      return {
        contents: [
          {
            uri: result.uri,
            mimeType: result.mimeType,
            text: result.text,
          },
        ],
      };
    }
  );
}
