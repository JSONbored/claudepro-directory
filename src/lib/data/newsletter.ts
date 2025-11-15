'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';

export async function getNewsletterSubscriberCount(): Promise<number | null> {
  const result = await fetchCachedRpc<number | null>(
    {},
    {
      rpcName: 'get_newsletter_subscriber_count',
      tags: ['newsletter', 'stats'],
      ttlKey: 'cache.newsletter_count_ttl_s',
      keySuffix: 'newsletter-count',
      fallback: null,
      logMeta: { source: 'newsletter.actions' },
    }
  );

  return result ?? null;
}
