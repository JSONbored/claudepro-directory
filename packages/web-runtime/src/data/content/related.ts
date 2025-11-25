'use server';

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { generateContentTags } from '../content-helpers.ts';
import { ContentService } from '@heyclaude/data-layer';

const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isValidContentCategory(
  value: string
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
}

export interface RelatedContentInput {
  currentPath: string;
  currentCategory: string;
  currentTags?: string[];
  currentKeywords?: string[];
  featured?: boolean;
  limit?: number;
  exclude?: string[];
}

export interface RelatedContentResult {
  items: Database['public']['Functions']['get_related_content']['Returns'];
}

export async function getRelatedContent(input: RelatedContentInput): Promise<RelatedContentResult> {
  const currentSlug = input.currentPath.split('/').pop() || '';
  const category = input.currentCategory;

  if (!isValidContentCategory(category)) {
    return {
      items: [],
    };
  }

  const data = await fetchCached(
    (client) => new ContentService(client).getRelatedContent({
        p_category: category,
        p_slug: currentSlug,
        p_tags: input.currentTags || [],
        p_limit: input.limit || 3,
        p_exclude_slugs: input.exclude || []
    }),
    {
      keyParts: ['related-content', category, currentSlug, input.limit || 3],
      tags: generateContentTags(category, null, ['related-content']),
      ttlKey: 'cache.related_content.ttl_seconds',
      fallback: [],
      logMeta: { category: category, slug: currentSlug },
    }
  );

  const items = data.filter((item) => Boolean(item.title && item.slug && item.category));

  return {
    items,
  };
}
