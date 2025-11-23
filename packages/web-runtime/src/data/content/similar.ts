'use server';

import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { generateContentCacheKey } from '../content-helpers.ts';
import { ContentService } from '@heyclaude/data-layer';

export async function getSimilarContent(input: {
  contentType: Database['public']['Enums']['content_category'];
  contentSlug: string;
  limit?: number;
}): Promise<Database['public']['Functions']['get_similar_content']['Returns'] | null> {
  const { contentType, contentSlug, limit = 6 } = input;

  return fetchCached(
    (client) => new ContentService(client).getSimilarContent({
        p_content_type: contentType,
        p_content_slug: contentSlug,
        p_limit: limit
    }),
    {
      key: generateContentCacheKey(contentType, contentSlug, limit),
      tags: ['content', 'similar', `content-${contentSlug}`],
      ttlKey: 'cache.content_detail.ttl_seconds',
      fallback: null,
      logMeta: { contentType, contentSlug, limit },
    }
  );
}
