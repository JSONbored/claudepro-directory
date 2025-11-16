/**
 * Data Layer Helper Utilities
 * Shared utilities for common patterns across data layer helpers
 */

import type { ContentCategory } from '@/src/types/database-overrides';

/**
 * Generate content cache tags with category and optional slug
 * Common pattern: ['content', `content-${category}`, `content-${category}-${slug}`]
 */
export function generateContentTags(
  category?: ContentCategory | string | null,
  slug?: string | null,
  additionalTags: string[] = []
): string[] {
  const tags: string[] = ['content', ...additionalTags];

  if (category) {
    tags.push(`content-${category}`);
    if (slug) {
      tags.push(`content-${category}-${slug}`);
    }
  } else {
    tags.push('content-all');
  }

  return tags;
}

/**
 * Generate cache key suffix for content queries
 * Common patterns:
 * - `${category}-${slug}` for detail pages
 * - `${category ?? 'all'}-${limit}` for lists
 * - `${category ?? 'all'}-${limit}-${offset}` for pagination
 */
export function generateContentCacheKey(
  category?: ContentCategory | string | null,
  slug?: string | null,
  limit?: number | null,
  offset?: number | null,
  suffix?: string
): string {
  const parts: string[] = [];

  if (category) {
    parts.push(category);
  } else {
    parts.push('all');
  }

  if (slug) {
    parts.push(slug);
  }

  if (typeof limit === 'number') {
    parts.push(String(limit));
  }

  if (typeof offset === 'number') {
    parts.push(String(offset));
  }

  if (suffix) {
    parts.push(suffix);
  }

  return parts.join('-');
}

/**
 * Normalize RPC result that may return array to single item or null
 * Used when RPC returns array but we expect single item
 */
export function normalizeRpcResult<T>(result: T | T[] | null | undefined): T | null {
  if (result === null || result === undefined) {
    return null;
  }

  if (Array.isArray(result)) {
    return result.length > 0 ? (result[0] ?? null) : null;
  }

  return result;
}
