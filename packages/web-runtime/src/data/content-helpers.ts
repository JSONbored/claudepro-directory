import 'server-only';

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

export function normalizeRpcResult<T>(result: T | T[] | null | undefined): T | null {
  if (result === null || result === undefined) {
    return null;
  }

  if (Array.isArray(result)) {
    return result.length > 0 ? (result[0] ?? null) : null;
  }

  return result;
}
