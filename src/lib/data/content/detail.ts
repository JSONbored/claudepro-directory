'use server';

import type { ContentItem } from '@/src/lib/data/content';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

export interface ContentDetailResult {
  content: ContentItem;
  analytics?: { view_count: number; copy_count: number } | null;
  related?: ContentItem[];
  collection?: ContentItem;
  collection_items?: ContentItem[];
}

export async function getContentDetailComplete(input: {
  category: string;
  slug: string;
}): Promise<ContentDetailResult | null> {
  const { category, slug } = input;

  try {
    return fetchCachedRpc<ContentDetailResult | null>(
      {
        p_category: category,
        p_slug: slug,
      },
      {
        rpcName: 'get_content_detail_complete',
        tags: ['content', `content-${slug}`],
        ttlKey: 'cache.content_detail.ttl_seconds',
        keySuffix: `${category}-${slug}`,
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
