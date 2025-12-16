/**
 * getContentDetail Tool Handler
 *
 * Get complete metadata for a specific content item by slug and category.
 * Uses direct table query for content details.
 */

import { prisma } from '@heyclaude/data-layer/prisma/client.ts';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import { McpErrorCode, createErrorResponse } from '../lib/errors.ts';
import { sanitizeString, isValidSlug } from '../lib/utils.ts';
import { getContentUsageHints } from '../lib/usage-hints.ts';
import type { GetContentDetailInput } from '../lib/types.ts';

/**
 * Fetches a content item by slug and category and returns a markdown-like text summary plus a normalized `_meta` details object.
 *
 * Queries the `content` table for the specified item using Prisma, normalizes missing fields with sensible defaults, and builds a readable text block and metadata summary.
 *
 * @param input - Object containing `slug` and `category` of the content item to retrieve
 * @returns An object with `content` — an array containing a single text block (`type: 'text'`, `text`: string) — and `_meta` — a details object containing `slug`, `title`, `displayTitle`, `category`, `description`, `content`, `tags`, `author`, `authorProfileUrl`, `dateAdded`, `dateUpdated`, `createdAt`, `metadata`, and `stats` (`views`, `bookmarks`, `copies`)
 * @throws If no content is found for the provided category/slug, or if the database query fails (the error is logged and rethrown)
 */
export async function handleGetContentDetail(
  input: GetContentDetailInput
) {
  // Sanitize and validate inputs
  const slug = sanitizeString(input.slug);
  const category = input.category;
  
  // Validate slug format
  if (!isValidSlug(slug)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_SLUG,
      `Invalid slug format: ${slug}. Slugs must be alphanumeric with hyphens, underscores, or dots.`
    );
    throw new Error(error.message);
  }

  // Query the content table using Prisma
  let data;
  try {
    data = await prisma.content.findUnique({
      where: {
        category_slug: {
          category,
          slug,
        },
      },
      select: {
        slug: true,
        title: true,
        display_title: true,
        category: true,
        description: true,
        content: true,
        tags: true,
        author: true,
        author_profile_url: true,
        date_added: true,
        created_at: true,
        updated_at: true,
        metadata: true,
        view_count: true,
        bookmark_count: true,
        copy_count: true,
      },
    });
  } catch (error) {
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
    throw new Error(`Failed to fetch content details: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Get usage hints for this content
  const usageHints = getContentUsageHints(details.category, details.slug);

  return {
    content: [
      {
        type: 'text' as const,
        text: textSummary,
      },
    ],
    _meta: {
      ...details,
      usageHints,
      relatedTools: ['downloadContentForPlatform', 'getRelatedContent', 'getContentByTag', 'searchContent'],
    },
  };
}