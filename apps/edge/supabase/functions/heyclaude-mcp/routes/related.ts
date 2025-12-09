/**
 * getRelatedContent Tool Handler
 * Uses get_related_content RPC for consistent behavior with web app
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import type { GetRelatedContentInput } from '../lib/types.ts';

type RelatedContentItem = Database['public']['CompositeTypes']['related_content_item'];

/**
 * Retrieves related content for a given slug and category and returns a textual summary and metadata.
 *
 * @param input - Query parameters: `slug` of the source item, `category` to match, and optional `limit` for number of results.
 * @returns A payload containing a single text content block summarizing the related items and an `_meta` object with `items`, `source`, and `count` (when results exist) or an empty `items` array when none are found.
 * @throws Error when the backend RPC call to fetch related content fails.
 */
export async function handleGetRelatedContent(
  supabase: SupabaseClient<Database>,
  input: GetRelatedContentInput
) {
  const { slug, category, limit } = input;

  // Call get_related_content RPC directly with correct parameter order
  // Signature: p_category, p_slug, p_tags, p_limit, p_exclude_slugs
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
    p_tags: [],
    p_limit: limit,
    p_exclude_slugs: [],
  };
  const { data, error } = await supabase.rpc('get_related_content', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('RPC call failed in getRelatedContent', {
      dbQuery: {
        rpcName: 'get_related_content',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    }, error);
    throw new Error(`Failed to fetch related content: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No related content found for ${slug}.`,
        },
      ],
      _meta: {
        items: [],
        source: { slug, category },
        count: 0,
      },
    };
  }

  const items = data.map((item: RelatedContentItem) => ({
    slug: item.slug || '',
    title: item.title || '',
    category: item.category || '',
    description: item.description?.substring(0, 150) || '',
    tags: item.tags || [],
    relevanceScore: item.score || 0, // Fixed: function returns 'score', not 'relevance_score'
  }));

  const textSummary = items
    .map(
      (
        item: { title: string; category: string; description: string; relevanceScore: number },
        idx: number
      ) =>
        `${idx + 1}. ${item.title} (${item.category}) - Relevance: ${item.relevanceScore}\n   ${item.description}${item.description.length >= 150 ? '...' : ''}`
    )
    .join('\n\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: `Related Content:\n\n${textSummary}`,
      },
    ],
    _meta: {
      items,
      source: { slug, category },
      count: items.length,
      limit,
      pagination: {
        total: items.length,
        limit,
        hasMore: false, // Related doesn't support pagination
      },
    },
  };
}