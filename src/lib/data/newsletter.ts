'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';

// TODO: RPC 'get_newsletter_subscriber_count' does not exist
// Using get_active_subscribers and getting array length as workaround
// Consider creating a dedicated count RPC for better performance
export async function getNewsletterSubscriberCount(): Promise<number | null> {
  const result = await fetchCachedRpc<'get_active_subscribers', string[]>(undefined as never, {
    rpcName: 'get_active_subscribers',
    tags: ['newsletter', 'stats'],
    ttlKey: 'cache.newsletter_count_ttl_s',
    keySuffix: 'newsletter-count',
    fallback: [],
    logMeta: { source: 'newsletter.actions' },
  });

  return result ? result.length : null;
}
