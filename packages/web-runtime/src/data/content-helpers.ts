import type { Database } from '@heyclaude/database-types';

export function generateContentTags(
  category?: Database['public']['Enums']['content_category'] | string | null,
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

export function generateContentCacheKey(
  category?: Database['public']['Enums']['content_category'] | string | null,
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

export function normalizeRpcResult<T>(result: T | T[] | null | undefined): T | null {
  if (result === null || result === undefined) {
    return null;
  }

  if (Array.isArray(result)) {
    return result.length > 0 ? (result[0] ?? null) : null;
  }

  return result;
}
