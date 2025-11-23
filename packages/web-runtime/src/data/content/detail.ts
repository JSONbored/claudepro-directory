'use server';

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { generateContentCacheKey, generateContentTags } from '../content-helpers.ts';
import { logger } from '../../logger.ts';
import { normalizeError } from '../../errors.ts';
import { fetchCached } from '../../cache/fetch-cached.ts';
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

export type ContentDetailData = Database['public']['Functions']['get_content_detail_complete']['Returns'];

export async function getContentDetailComplete(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_detail_complete']['Returns'] | null> {
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const normalized = normalizeError('Invalid category', 'Invalid category in getContentDetailComplete');
    logger.error('Invalid category in getContentDetailComplete', normalized, {
      category,
      slug,
    });
    return null;
  }

  try {
    return await fetchCached(
      (client) => new ContentService(client).getContentDetailComplete({ p_category: category, p_slug: slug }),
      {
        key: generateContentCacheKey(category, slug),
        tags: generateContentTags(category, slug),
        ttlKey: 'cache.content_detail.ttl_seconds',
        fallback: null,
        logMeta: { category, slug },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load content detail');
    logger.error('getContentDetailComplete failed', normalized, { category, slug });
    throw normalized;
  }
}
