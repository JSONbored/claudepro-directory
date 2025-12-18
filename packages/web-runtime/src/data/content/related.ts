import 'server-only';
import { type GetRelatedContentReturns } from '@heyclaude/database-types/postgres-types';
import { type content_category } from '@heyclaude/data-layer/prisma';

import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';

import { createDataFunction } from '../cached-data-factory.ts';

export interface RelatedContentInput {
  currentCategory: string;
  currentKeywords?: string[];
  currentPath: string;
  currentTags?: string[];
  exclude?: string[];
  featured?: boolean;
  limit?: number;
}

export interface RelatedContentResult {
  items: GetRelatedContentReturns;
}

/**
 * Get related content
 * Uses 'use cache' to cache related content. This data is public and same for all users.
 */
export const getRelatedContent = createDataFunction<RelatedContentInput, RelatedContentResult>({
  serviceKey: 'content',
  methodName: 'getRelatedContent',
  module: 'data/content/related',
  operation: 'getRelatedContent',
  validate: (input) => isValidCategory(input.currentCategory),
  transformArgs: (input) => {
    const currentSlug = input.currentPath.split('/').pop() ?? '';
    return {
      p_category: input.currentCategory as content_category,
      p_exclude_slugs: input.exclude ?? [],
      p_limit: input.limit ?? 3,
      p_slug: currentSlug,
      p_tags: input.currentTags ?? [],
    };
  },
  transformResult: (result) => {
    const data = result as GetRelatedContentReturns;
    const items = data.filter((item) => Boolean(item.title && item.slug && item.category));
    return { items };
  },
  onError: () => ({ items: [] }), // Return empty array on error
  logContext: (input) => {
    const currentSlug = input.currentPath.split('/').pop() ?? '';
    return {
      category: input.currentCategory,
      slug: currentSlug,
    };
  },
});
