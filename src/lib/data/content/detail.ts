'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey, generateContentTags } from '@/src/lib/data/helpers-utils';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';
import { Constants } from '@/src/types/database.types';

// Use enum values directly from database.types.ts Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isValidContentCategory(
  value: string
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
}

export async function getContentDetailComplete(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_detail_complete']['Returns'] | null> {
  const { category, slug } = input;

  // Validate category is valid ENUM value
  // Database will also validate, but we check early for better error messages
  if (!isValidContentCategory(category)) {
    const normalized = normalizeError(
      'Invalid category',
      'Invalid category in getContentDetailComplete'
    );
    logger.error('Invalid category in getContentDetailComplete', normalized, {
      category,
      slug,
    });
    return null;
  }

  // Type guard has narrowed category to ENUM - database will validate
  try {
    return fetchCachedRpc<
      'get_content_detail_complete',
      Database['public']['Functions']['get_content_detail_complete']['Returns'] | null
    >(
      {
        p_category: category, // Type guard has narrowed this to ENUM
        p_slug: slug,
      },
      {
        rpcName: 'get_content_detail_complete',
        tags: generateContentTags(category, slug),
        ttlKey: 'cache.content_detail.ttl_seconds',
        keySuffix: generateContentCacheKey(category, slug),
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
