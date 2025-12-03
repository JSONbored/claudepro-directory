'use server';

import { ContentService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cache } from 'react';

import { fetchCached } from '../../cache/fetch-cached.ts';
import { generateContentTags } from '../content-helpers.ts';

interface PaginatedContentParameters {
  category?: null | string;
  limit: number;
  offset: number;
}

const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function toContentCategory(
  value: null | string | undefined
): Database['public']['Enums']['content_category'] | undefined {
  if (!value) return undefined;
  const lowered = value.trim().toLowerCase();
  return CONTENT_CATEGORY_VALUES.includes(lowered as Database['public']['Enums']['content_category'])
    ? (lowered as Database['public']['Enums']['content_category'])
    : undefined;
}

// OPTIMIZATION: Wrapped with React.cache() for request-level deduplication
// This prevents duplicate calls within the same request (React Server Component tree)
export const getPaginatedContent = cache(
  async ({
    category,
    limit,
    offset,
  }: PaginatedContentParameters): Promise<
    Database['public']['Functions']['get_content_paginated_slim']['Returns'] | null
  > => {
  const normalizedCategory = category ? toContentCategory(category) : undefined;

  const result = await fetchCached<
    Database['public']['Functions']['get_content_paginated_slim']['Returns']
  >(
    (client) => new ContentService(client).getContentPaginatedSlim({
      ...(normalizedCategory ? { p_category: normalizedCategory } : {}),
      p_limit: limit,
      p_offset: offset
    }),
    {
      keyParts: ['content-paginated', normalizedCategory ?? category ?? 'all', limit, offset],
      tags: generateContentTags(normalizedCategory ?? null, null, ['content-paginated']),
      ttlKey: 'content_paginated',
      fallback: {
        items: null,
        pagination: null,
      },
      logMeta: { category: normalizedCategory ?? category ?? 'all', limit, offset },
    }
  );

    // Return null if no items (not found or empty)
    if (!result.items || result.items.length === 0) return null;
    return result;
  }
);
