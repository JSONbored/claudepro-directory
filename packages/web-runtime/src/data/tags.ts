'use server';

/**
 * Tags Data Layer
 *
 * Server-side data fetching for tag browsing pages.
 * Provides functions to get all tags with counts and content filtered by tag.
 */

import { type Database } from '@heyclaude/database-types';

import { fetchCached } from '../cache/fetch-cached.ts';
import { logger, normalizeError } from '../index.ts';
import { generateRequestId } from '../utils/request-id.ts';

// Types from database
type TagWithCounts = Database['public']['CompositeTypes']['tag_with_counts'];
type ContentCategory = Database['public']['Enums']['content_category'];

/**
 * Normalized tag data for display
 */
export interface TagSummary {
  /** Categories this tag appears in */
  categories: ContentCategory[];
  /** Number of content items with this tag */
  count: number;
  /** Tag name (lowercase, hyphenated) */
  tag: string;
}

/**
 * Content item returned from tag-filtered queries
 */
export interface TaggedContentItem {
  author: null | string;
  author_profile_url: null | string;
  avg_rating: null | number;
  bookmark_count: number;
  category: ContentCategory;
  copy_count: number;
  date_added: null | string;
  description: null | string;
  id: string;
  review_count: number;
  slug: string;
  source: Database['public']['Enums']['content_source'] | null;
  tags: string[];
  title: null | string;
  updated_at: string;
  use_count: number;
  view_count: number;
}

/**
 * Result from getContentByTag including pagination info
 */
export interface TaggedContentResult {
  category: ContentCategory | null;
  items: TaggedContentItem[];
  tag: string;
  totalCount: number;
}

/**
 * Normalize database tag row to TagSummary
 */
function normalizeTagRow(row: TagWithCounts): null | TagSummary {
  if (!row.tag) return null;

  // row.categories can be null from the database, but individual elements are strings
  const categoriesArray = row.categories ?? [];

  return {
    tag: row.tag,
    count: row.usage_count ?? 0,
    // Cast to ContentCategory since we know these are valid category strings from the database
    categories: categoriesArray as ContentCategory[],
  };
}

/**
 * Get all unique tags with usage counts and categories
 *
 * @param options.minCount - Minimum usage count to include (default: 1)
 * @param options.limit - Maximum number of tags to return (default: 500)
 * @returns Array of tags sorted by usage count (descending)
 */
export async function getAllTagsWithCounts(options?: {
  limit?: number;
  minCount?: number;
}): Promise<TagSummary[]> {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getAllTagsWithCounts',
    module: 'data/tags',
  });

  const { minCount = 1, limit = 500 } = options ?? {};

  try {
    const tags = await fetchCached(
      async (client) => {
        const { data, error } = await client.rpc('get_all_tags_with_counts', {
          p_min_count: minCount,
          p_limit: limit,
        });

        if (error) {
          const normalized = normalizeError(error, 'RPC get_all_tags_with_counts failed');
          requestLogger.error('getAllTagsWithCounts: RPC call failed', normalized, {
            rpcName: 'get_all_tags_with_counts',
            minCount,
            limit,
          });
          throw normalized;
        }

        // RPC returns an array, map and filter to valid TagSummary objects
        return data
          .map((row) => normalizeTagRow(row))
          .filter((tag): tag is TagSummary => tag !== null);
      },
      {
        keyParts: ['all-tags', String(minCount), String(limit)],
        tags: ['tags', 'all-tags'],
        ttlKey: 'cache.search_facets.ttl_seconds', // Reuse search facets TTL
        fallback: [] as TagSummary[],
        logMeta: { source: 'getAllTagsWithCounts', minCount, limit },
      }
    );

    return tags;
  } catch (error) {
    const isRpcError =
      error instanceof Error &&
      (error.message.includes('RPC get_all_tags_with_counts failed') ||
        error.message.includes('get_all_tags_with_counts'));

    if (!isRpcError) {
      const normalized = normalizeError(error, 'getAllTagsWithCounts failed');
      requestLogger.error('getAllTagsWithCounts: fetchCached failed', normalized);
      throw normalized;
    }
    throw error;
  }
}

/**
 * Get content items filtered by a specific tag
 *
 * @param tag - Tag to filter by (case-sensitive)
 * @param options.category - Optional category filter
 * @param options.limit - Maximum items to return (default: 50)
 * @param options.offset - Pagination offset (default: 0)
 * @returns Tagged content items with total count
 */
export async function getContentByTag(
  tag: string,
  options?: {
    category?: ContentCategory;
    limit?: number;
    offset?: number;
  }
): Promise<TaggedContentResult> {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getContentByTag',
    module: 'data/tags',
  });

  const { category, limit = 50, offset = 0 } = options ?? {};

  try {
    // Define fallback with proper type
    const fallbackResult: TaggedContentResult = {
      items: [],
      totalCount: 0,
      tag,
      category: category ?? null,
    };

    const result = await fetchCached(
      async (client) => {
        const rpcArgs: {
          p_category?: ContentCategory;
          p_limit?: number;
          p_offset?: number;
          p_tag: string;
        } = {
          p_tag: tag,
          p_limit: limit,
          p_offset: offset,
        };

        if (category) {
          rpcArgs.p_category = category;
        }

        const { data, error } = await client.rpc('get_content_by_tag', rpcArgs);

        if (error) {
          const normalized = normalizeError(error, 'RPC get_content_by_tag failed');
          requestLogger.error('getContentByTag: RPC call failed', normalized, {
            rpcName: 'get_content_by_tag',
            tag,
            category,
            limit,
            offset,
          });
          throw normalized;
        }

        // Extract total count from first row (all rows have same total_count)
        const firstRow = data[0];
        const totalCount = firstRow?.total_count ?? 0;

        const items: TaggedContentItem[] = data.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          category: row.category,
          tags: row.tags,
          author: row.author,
          author_profile_url: row.author_profile_url,
          source: row.source,
          date_added: row.date_added,
          updated_at: row.updated_at,
          view_count: row.view_count,
          copy_count: row.copy_count,
          bookmark_count: row.bookmark_count,
          use_count: row.use_count,
          avg_rating: row.avg_rating,
          review_count: row.review_count,
        }));

        return {
          items,
          totalCount: Number(totalCount),
          tag,
          category: category ?? null,
        } as TaggedContentResult;
      },
      {
        keyParts: ['content-by-tag', tag, category ?? 'all', String(limit), String(offset)],
        tags: ['tags', `tag-${tag}`, 'content'],
        ttlKey: 'cache.content_list.ttl_seconds',
        fallback: fallbackResult,
        logMeta: { source: 'getContentByTag', tag, category, limit, offset },
      }
    );

    return result;
  } catch (error) {
    const isRpcError =
      error instanceof Error &&
      (error.message.includes('RPC get_content_by_tag failed') ||
        error.message.includes('get_content_by_tag'));

    if (!isRpcError) {
      const normalized = normalizeError(error, 'getContentByTag failed');
      requestLogger.error('getContentByTag: fetchCached failed', normalized);
      throw normalized;
    }
    throw error;
  }
}

/**
 * Get a single tag's metadata (for SEO/display)
 * Returns null if tag doesn't exist
 */
export async function getTagMetadata(tag: string): Promise<null | TagSummary> {
  const allTags = await getAllTagsWithCounts({ minCount: 1, limit: 1000 });
  return allTags.find((t) => t.tag === tag) ?? null;
}

// Note: Utility functions (formatTagForDisplay, formatTagForUrl) are exported
// from tags-utils.ts via data-server.ts and data-client.ts entry points.
// They cannot be re-exported here because this file has 'use server' directive
// which only allows async function exports.
