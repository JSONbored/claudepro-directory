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

/**
 * Fetches a content item by slug and category and returns a markdown-like text summary plus a normalized `_meta` details object.
 *
 * Queries the `content` table for the specified item, normalizes missing fields with sensible defaults, and builds a readable text block and metadata summary.
 *
 * @param input - Object containing `slug` and `category` of the content item to retrieve
 * @returns An object with `content` — an array containing a single text block (`type: 'text'`, `text`: string) — and `_meta` — a details object containing `slug`, `title`, `displayTitle`, `category`, `description`, `content`, `tags`, `author`, `authorProfileUrl`, `dateAdded`, `dateUpdated`, `createdAt`, `metadata`, and `stats` (`views`, `bookmarks`, `copies`)
 * @throws If no content is found for the provided category/slug, or if the database query fails (the error is logged and rethrown)
 */
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
    // PGRST116: JSON object requested, multiple (or no) rows returned
    if ((error as any).code === 'PGRST116') {
      throw new Error(`Content not found: ${category}/${slug}`);
    }

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
  const dateAddedText = details.dateAdded
    ? new Date(details.dateAdded).toLocaleDateString()
    : 'Unknown';

  const textSummary = `
# ${details.title}

**Category:** ${details.category}
**Author:** ${details.author}
**Added:** ${dateAddedText}
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