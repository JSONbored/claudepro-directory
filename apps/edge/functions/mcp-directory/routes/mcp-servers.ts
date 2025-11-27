/**
 * getMcpServers Tool Handler
 * Uses ContentService.getContentPaginated to filter MCP servers (category='mcp')
 * Includes .mcpb download URLs and configuration details
 */

import { ContentService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime';
import type { GetMcpServersInput } from '../lib/types.ts';

type ContentPaginatedItem = Database['public']['CompositeTypes']['content_paginated_item'];

export async function handleGetMcpServers(
  supabase: SupabaseClient<Database>,
  input: GetMcpServersInput
) {
  const { limit } = input;

  // Use ContentService to get MCP content
  const contentService = new ContentService(supabase);

  const result = await contentService.getContentPaginated({
    p_category: 'mcp',
    p_order_by: 'created_at',
    p_order_direction: 'desc',
    p_limit: limit,
    p_offset: 0,
  });

  if (!(result && result.items) || result.items.length === 0) {
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
      },
    };
  }

  // Fetch metadata separately since content_paginated_item doesn't include it
  const slugs = result.items
    .map((item: ContentPaginatedItem) => item.slug)
    .filter((slug): slug is string => typeof slug === 'string' && slug !== null);

  const { data: metadataRows, error: metadataError } = await supabase
    .from('content')
    .select('slug, metadata, mcpb_storage_url')
    .in('slug', slugs)
    .eq('category', 'mcp');

  if (metadataError) {
    // Use dbQuery serializer for consistent database query formatting
    logError('Database query failed in getMcpServers', {
      dbQuery: {
        table: 'content',
        operation: 'select',
        schema: 'public',
        args: {
          slugs: slugs.slice(0, 10), // Log first 10 slugs to avoid huge logs
          category: 'mcp',
        },
      },
    }, metadataError);
    // Continue without metadata - not critical
  }

  // Create metadata map for quick lookup
  const metadataMap = new Map<
    string,
    { metadata: Record<string, unknown>; mcpb_storage_url: string | null }
  >();
  if (metadataRows && !metadataError) {
    for (const row of metadataRows) {
      metadataMap.set(row.slug, {
        metadata: (row.metadata as Record<string, unknown>) || {},
        mcpb_storage_url: row.mcpb_storage_url,
      });
    }
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
          server.tools.length > 0 ? server.tools.map((t) => t.name).join(', ') : 'No tools listed';

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
    },
  };
}
