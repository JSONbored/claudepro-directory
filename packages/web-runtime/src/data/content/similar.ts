'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';

import { fetchCached } from '../../cache/fetch-cached.ts';

export async function getSimilarContent(input: {
  contentSlug: string;
  contentType: Database['public']['Enums']['content_category'];
  limit?: number;
}): Promise<Database['public']['Functions']['get_similar_content']['Returns'] | null> {
  const { contentType, contentSlug, limit = 6 } = input;

  return fetchCached(
    (client) =>
      new ContentService(client).getSimilarContent({
        p_content_type: contentType,
        p_content_slug: contentSlug,
        p_limit: limit,
      }),
    {
      keyParts: ['similar-content', contentType, contentSlug, limit],
      tags: ['content', 'similar', `content-${contentSlug}`],
      ttlKey: 'cache.content_detail.ttl_seconds',
      fallback: null,
      logMeta: { contentType, contentSlug, limit },
    }
  );
}
