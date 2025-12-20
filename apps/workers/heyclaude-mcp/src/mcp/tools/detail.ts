/**
 * getContentDetail Tool Handler
 *
 * Get complete metadata for a specific content item by slug and category.
 */

import type { GetContentDetailInput } from '../../lib/types';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import { sanitizeString, isValidSlug } from '../../lib/utils';
import { getContentUsageHints } from '../../lib/usage-hints';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import type { ToolContext } from './categories';

/**
 * Get complete metadata for a specific content item by slug and category.
 *
 * @param input - Object containing slug and category
 * @param context - Tool handler context
 * @returns Content details with text summary and metadata
 */
export async function handleGetContentDetail(
  input: GetContentDetailInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    slug: string;
    title: string;
    displayTitle: string;
    category: string;
    description: string;
    content: string;
    tags: string[];
    author: string;
    authorProfileUrl: string | null;
    dateAdded: Date | null;
    dateUpdated: Date | null;
    createdAt: Date;
    metadata: Record<string, unknown>;
    stats: {
      views: number;
      bookmarks: number;
      copies: number;
    };
    usageHints: string[];
    relatedTools: string[];
  };
}> {
  const { prisma, logger } = context;
  const startTime = Date.now();

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

  // Validate category
  if (!category) {
    throw new Error('Category is required');
  }

  try {
    // Query the content table using Prisma
    const data = await prisma.content.findUnique({
      where: {
        slug_category: {
          slug,
          category,
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

    if (!data) {
      throw new Error(`Content not found: ${category}/${slug}`);
    }

    // Format the response
    const details = {
      slug: data.slug,
      title: data.title || 'Untitled',
      displayTitle: data.display_title || data.title || 'Untitled',
      category: data.category,
      description: data.description || '',
      content: data.content || '',
      tags: data.tags || [],
      author: data.author || 'Unknown',
      authorProfileUrl: data.author_profile_url || null,
      dateAdded: data.date_added,
      dateUpdated: data.updated_at,
      createdAt: data.created_at,
      metadata: (data.metadata as Record<string, unknown>) || {},
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

    const duration = Date.now() - startTime;
    logger.info(
      {
        tool: 'getContentDetail',
        duration_ms: duration,
        category,
        slug,
      },
      'getContentDetail completed successfully'
    );

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
        relatedTools: [
          'downloadContentForPlatform',
          'getRelatedContent',
          'getContentByTag',
          'searchContent',
        ],
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getContentDetail tool failed');
    logger.error(
      { error: normalized, tool: 'getContentDetail', category, slug },
      'getContentDetail tool error'
    );

    // Check if it's a "not found" error
    if (error instanceof Error && error.message.includes('not found')) {
      const errorResponse = createErrorResponse(McpErrorCode.CONTENT_NOT_FOUND, error.message);
      throw new Error(errorResponse.message);
    }

    throw normalized;
  }
}
