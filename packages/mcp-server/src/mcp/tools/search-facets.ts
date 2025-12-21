/**
 * getSearchFacets Tool Handler
 *
 * Get available search facets (categories, tags, authors) for filtering content.
 * Helps AI agents understand what filters are available.
 */

import { SearchService } from '@heyclaude/data-layer';
import type { ToolContext } from '../../types/runtime.js';
import { normalizeError } from '@heyclaude/shared-runtime';

/**
 * Fetches available search facets (categories, tags, authors).
 *
 * @param context - Tool handler context
 * @returns Search facets with categories, tags, and authors
 */
export async function handleGetSearchFacets(
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    facets: Array<{
      category: string;
      contentCount: number;
      tags: string[];
      authors: string[];
    }>;
    summary: {
      totalCategories: number;
      totalContent: number;
      totalTags: number;
      totalAuthors: number;
    };
  };
}> {
  const { prisma, logger } = context;
  const startTime = Date.now();

  try {
    const searchService = new SearchService(prisma);
    const data = await searchService.getSearchFacets();

    // Format response
    interface FacetRow {
      all_tags?: null | readonly string[];
      authors?: null | readonly string[];
      category: null | string;
      content_count: null | number;
    }

    const rows: FacetRow[] = Array.isArray(data) ? (data as FacetRow[]) : [];
    const facets = rows.map((item) => ({
      category: item.category ?? 'unknown',
      contentCount: Number(item.content_count ?? 0),
      tags: Array.isArray(item.all_tags)
        ? item.all_tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      authors: Array.isArray(item.authors)
        ? item.authors.filter((author): author is string => typeof author === 'string')
        : [],
    }));

    // Create text summary
    const totalCategories = facets.length;
    const totalContent = facets.reduce((sum, f) => sum + f.contentCount, 0);
    const allTags = new Set<string>();
    const allAuthors = new Set<string>();

    facets.forEach((f) => {
      f.tags.forEach((tag) => allTags.add(tag));
      f.authors.forEach((author) => allAuthors.add(author));
    });

    const textSummary =
      `Available search facets:\n\n` +
      `**Categories:** ${totalCategories} categories with ${totalContent} total content items\n` +
      `**Tags:** ${allTags.size} unique tags available\n` +
      `**Authors:** ${allAuthors.size} unique authors\n\n` +
      `**By Category:**\n${facets.map((f) => `- ${f.category}: ${f.contentCount} items, ${f.tags.length} tags, ${f.authors.length} authors`).join('\n')}\n\n` +
      `Use these facets to filter content with searchContent or getContentByTag tools.`;

    const duration = Date.now() - startTime;
    logger.info('getSearchFacets completed successfully', {
      tool: 'getSearchFacets',
      duration_ms: duration,
      totalCategories,
      totalContent,
      totalTags: allTags.size,
      totalAuthors: allAuthors.size,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: textSummary,
        },
      ],
      _meta: {
        facets,
        summary: {
          totalCategories,
          totalContent,
          totalTags: allTags.size,
          totalAuthors: allAuthors.size,
        },
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getSearchFacets tool failed');
    logger.error('getSearchFacets tool error', normalized, { tool: 'getSearchFacets' });
    throw normalized;
  }
}
