/**
 * getMcpServers Tool Handler
 *
 * Fetches MCP servers from the HeyClaude directory with metadata and download URLs.
 */

import type { ContentPaginatedItem } from '@heyclaude/database-types/postgres-types';
import { ContentService } from '@heyclaude/data-layer';

import type { GetMcpServersInput } from '../../lib/types.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Fetches MCP entries from the HeyClaude directory, enriches them with available metadata and download URLs, and returns a formatted text summary plus a metadata payload containing the full server representations.
 *
 * @param input - Input options; `limit` controls the maximum number of MCP items to fetch
 * @param context - Tool handler context
 * @returns An object with:
 *  - `content`: an array containing a single text item with a human-readable list of MCP servers and a total count
 *  - `_meta`: an object with `servers` (the full array of server objects) and `count` (number of servers)
 *
 * Each server object in `_meta.servers` includes: `slug`, `title`, `description` (trimmed to 200 chars), `author`, `dateAdded`, `tags`, `mcpbUrl` (string or `null`), `requiresAuth` (boolean), `tools` (array of `{ name, description }`), `configuration` (object), and `stats` (`views` and `bookmarks`).
 */
export async function handleGetMcpServers(
  input: GetMcpServersInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    servers: Array<{
      slug: string;
      title: string;
      description: string;
      author: string;
      dateAdded: string;
      tags: string[];
      mcpbUrl: string | null;
      requiresAuth: boolean;
      tools: Array<{ name: string; description: string }>;
      configuration: Record<string, unknown>;
      stats: { views: number; bookmarks: number };
    }>;
    count: number;
    limit: number;
    pagination: {
      total: number;
      limit: number;
      hasMore: boolean;
    };
  };
}> {
  const { prisma, logger } = context;
  const { limit } = input;
  const startTime = Date.now();

  try {
    const contentService = new ContentService(prisma);

    const result = await contentService.getContentPaginated({
      p_category: 'mcp',
      p_order_by: 'created_at',
      p_order_direction: 'desc',
      p_limit: limit,
      p_offset: 0,
    });

    if (!(result && result.items) || result.items.length === 0) {
      logger.info('getMcpServers completed with no results', {
        tool: 'getMcpServers',
        duration_ms: Date.now() - startTime,
        limit,
        resultCount: 0,
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No MCP servers found in the directory.',
          },
        ],
        _meta: {
          servers: [],
          count: 0,
          limit,
          pagination: {
            total: 0,
            limit,
            hasMore: false,
          },
        },
      };
    }

    // Fetch metadata separately since content_paginated_item doesn't include it
    const slugs = result.items
      .map((item: ContentPaginatedItem) => item.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug !== null);

    let metadataRows: Array<{ slug: string; metadata: unknown; mcpb_storage_url: string | null }> =
      [];
    try {
      metadataRows = await prisma.content.findMany({
        where: {
          slug: { in: slugs },
          category: 'mcp',
        },
        select: {
          slug: true,
          metadata: true,
          mcpb_storage_url: true,
        },
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to fetch MCP server metadata');
      logger.warn('Failed to fetch metadata (non-critical)', {
        error: normalized,
        tool: 'getMcpServers',
        slugs: slugs.slice(0, 10),
      });
      // Continue without metadata - not critical
    }

    // Create metadata map for quick lookup
    const metadataMap = new Map<
      string,
      { metadata: Record<string, unknown>; mcpb_storage_url: string | null }
    >();
    for (const row of metadataRows) {
      metadataMap.set(row.slug, {
        metadata: (row.metadata as Record<string, unknown>) || {},
        mcpb_storage_url: row.mcpb_storage_url,
      });
    }

    // Format MCP servers with complete metadata
    const servers = result.items.map((item: ContentPaginatedItem) => {
      const itemMetadata = metadataMap.get(item.slug || '') || {
        metadata: {},
        mcpb_storage_url: null,
      };
      const metadata = itemMetadata.metadata;
      const mcpbUrl =
        itemMetadata.mcpb_storage_url ||
        (typeof metadata['mcpb_storage_url'] === 'string' ? metadata['mcpb_storage_url'] : null);

      const configuration = (
        typeof metadata['configuration'] === 'object' && metadata['configuration'] !== null
          ? metadata['configuration']
          : {}
      ) as Record<string, unknown>;
      const requiresAuth = Boolean(metadata['requires_auth']);
      const tools = (Array.isArray(metadata['tools']) ? metadata['tools'] : []) as Array<{
        name?: string;
        description?: string;
      }>;

      return {
        slug: item.slug || '',
        title: item.title || item.display_title || '',
        description: item.description?.substring(0, 200) || '',
        author: item.author || 'Unknown',
        dateAdded: item.date_added || '',
        tags: item.tags || [],
        mcpbUrl,
        requiresAuth,
        tools: tools.map((tool) => ({
          name: tool.name || '',
          description: tool.description || '',
        })),
        configuration,
        stats: {
          views: item.view_count || 0,
          bookmarks: item.bookmark_count || 0,
        },
      };
    });

    // Create text summary
    const textSummary = servers
      .map(
        (
          server: {
            title: string;
            author: string;
            description: string;
            tools: Array<{ name: string }>;
            requiresAuth: boolean;
            mcpbUrl: string | null;
            stats: { views: number; bookmarks: number };
          },
          idx: number
        ) => {
          const toolsList =
            server.tools.length > 0
              ? server.tools.map((t) => t.name).join(', ')
              : 'No tools listed';

          const downloadInfo = server.mcpbUrl
            ? `\n   Download: ${server.mcpbUrl}`
            : '\n   Download: Not available';

          return `${idx + 1}. ${server.title}
   Author: ${server.author}
   ${server.description}${server.description.length >= 200 ? '...' : ''}
   Tools: ${toolsList}
   Auth Required: ${server.requiresAuth ? 'Yes' : 'No'}${downloadInfo}
   Stats: ${server.stats.views} views, ${server.stats.bookmarks} bookmarks`;
        }
      )
      .join('\n\n');

    logger.info('getMcpServers completed successfully', {
      tool: 'getMcpServers',
      duration_ms: Date.now() - startTime,
      limit,
      resultCount: servers.length,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `MCP Servers in HeyClaude Directory:\n\n${textSummary}\n\nTotal: ${servers.length} servers`,
        },
      ],
      _meta: {
        servers,
        count: servers.length,
        limit,
        pagination: {
          total: servers.length,
          limit,
          hasMore: false, // MCP servers doesn't support pagination
        },
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getMcpServers tool failed');
    logger.error('getMcpServers tool error', normalized, { tool: 'getMcpServers', limit });
    throw normalized;
  }
}
