'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey, generateContentTags } from '@/src/lib/data/helpers-utils';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { GetContentDetailCompleteReturn } from '@/src/types/database-overrides';

export async function getContentDetailComplete(input: {
  category: string;
  slug: string;
}): Promise<GetContentDetailCompleteReturn | null> {
  const { category, slug } = input;

  try {
    return fetchCachedRpc<GetContentDetailCompleteReturn | null>(
      {
        p_category: category,
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
