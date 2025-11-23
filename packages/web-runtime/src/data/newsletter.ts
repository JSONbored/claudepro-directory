'use server';

import { NewsletterService } from '@heyclaude/data-layer';
import { fetchCached } from '../cache/fetch-cached.ts';

export async function getNewsletterSubscriberCount(): Promise<number | null> {
  return fetchCached(
    (client) => new NewsletterService(client).getNewsletterSubscriberCount(),
    {
      key: 'newsletter-count',
      tags: ['newsletter', 'stats'],
      ttlKey: 'cache.newsletter_count_ttl_s',
      fallback: 0,
      logMeta: { source: 'newsletter.actions' },
    }
  );
}
