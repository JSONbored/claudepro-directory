/**
 * getRelatedContent Tool Handler
 * Uses get_related_content RPC for consistent behavior with web app
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GetRelatedContentInput } from '../lib/types.ts';

type RelatedContentItem = Database['public']['CompositeTypes']['related_content_item'];

export async function handleGetRelatedContent(
  supabase: SupabaseClient<Database>,
  input: GetRelatedContentInput
) {
  const { slug, category, limit } = input;

  // Call get_related_content RPC directly with correct parameter order
  // Signature: p_category, p_slug, p_tags, p_limit, p_exclude_slugs
  const { data, error } = await supabase.rpc('get_related_content', {
    p_category: category,
    p_slug: slug,
    p_tags: [],
    p_limit: limit,
    p_exclude_slugs: [],
  });

  if (error) {
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
    },
  };
}
