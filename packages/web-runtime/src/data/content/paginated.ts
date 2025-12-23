import 'server-only';
import { Prisma } from '@prisma/client';
import { type content_category } from '@prisma/client';

import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';

import { createDataFunction } from '../cached-data-factory.ts';
type contentModel = Prisma.contentGetPayload<{}>;

// Local types for migrated RPC (RPC removed, using Prisma directly)
type ContentPaginatedSlimItem = contentModel;
export interface ContentPaginatedSlimResult {
  items: ContentPaginatedSlimItem[];
  pagination: {
    current_page: number;
    has_more: boolean;
    limit: number;
    offset: number;
    total_count: number;
    total_pages: number;
  };
}

export interface PaginatedContentParameters {
  category?: null | string;
  limit: number;
  offset: number;
}

/***
 **
 * Normalize a string value to a content_category or undefined.
 * Uses shared isValidCategory validation from @heyclaude/web-runtime/utils/category-validation.
 * @param {null | string | undefined} value
 * @returns {content_category | undefined} Return value description
 */
function toContentCategory(value: null | string | undefined): content_category | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return isValidCategory(normalized) ? (normalized as content_category) : undefined;
}

/**
 * Get paginated content.
 * Uses 'use cache' to cache paginated content lists. This data is public and same for all users.
 */
export const getPaginatedContent = createDataFunction<
  PaginatedContentParameters,
  ContentPaginatedSlimResult | null
>({
  logContext: (params) => {
    const normalizedCategory = params.category ? toContentCategory(params.category) : undefined;
    return {
      category: normalizedCategory ?? params.category ?? 'all',
      limit: params.limit,
      offset: params.offset,
    };
  },
  methodName: 'getContentPaginatedSlim',
  module: 'data/content/paginated',
  operation: 'getPaginatedContent',
  serviceKey: 'content',
  transformArgs: (params) => {
    const normalizedCategory = params.category ? toContentCategory(params.category) : undefined;
    return {
      ...(normalizedCategory ? { p_category: normalizedCategory } : {}),
      p_limit: params.limit,
      p_offset: params.offset,
    };
  },
});
