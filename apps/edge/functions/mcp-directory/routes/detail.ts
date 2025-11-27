/**
 * getContentDetail Tool Handler
 *
 * Get complete metadata for a specific content item by slug and category.
 * Uses direct table query for content details.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime';
import type { GetContentDetailInput } from '../lib/types.ts';

export async function handleGetContentDetail(
  supabase: SupabaseClient<Database>,
  input: GetContentDetailInput
) {
  const { slug, category } = input;

  // Query the content table directly since get_content_detail_complete returns nested nulls
  const { data, error } = await supabase
    .from('content')
    .select(`
      slug,
      title,
      display_title,
      category,
      description,
      content,
      tags,
      author,
      author_profile_url,
      date_added,
      created_at,
      updated_at,
      metadata,
      view_count,
      bookmark_count,
      copy_count
    `)
    .eq('category', category)
    .eq('slug', slug)
    .single();

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('Database query failed in getContentDetail', {
      dbQuery: {
        table: 'content',
        operation: 'select',
        schema: 'public',
        args: {
          category,
          slug,
        },
      },
    }, error);
    throw new Error(`Failed to fetch content details: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Content not found: ${category}/${slug}`);
  }

  // Format the response - data is now a single object, not an array
  const details = {
    slug: data.slug,
    title: data.title,
    displayTitle: data.display_title || data.title,
    category: data.category,
    description: data.description || '',
    content: data.content || '',
    tags: data.tags || [],
    author: data.author || 'Unknown',
    authorProfileUrl: data.author_profile_url || null,
    dateAdded: data.date_added,
    dateUpdated: data.updated_at,
    createdAt: data.created_at,
    metadata: data.metadata || {},
    stats: {
      views: data.view_count || 0,
      bookmarks: data.bookmark_count || 0,
      copies: data.copy_count || 0,
    },
  };

  // Create detailed text summary
  const textSummary = `
# ${details.title}

**Category:** ${details.category}
**Author:** ${details.author}
**Added:** ${details.dateAdded}
**Tags:** ${details.tags.join(', ')}

## Description
${details.description}

## Stats
- Views: ${details.stats.views}
- Bookmarks: ${details.stats.bookmarks}
- Copies: ${details.stats.copies}

${details.content ? `## Content\n${details.content}` : ''}
`.trim();

  return {
    content: [
      {
        type: 'text' as const,
        text: textSummary,
      },
    ],
    _meta: details,
  };
}
