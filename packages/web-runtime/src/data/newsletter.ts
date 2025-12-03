'use server';

import { NewsletterService } from '@heyclaude/data-layer';

import { fetchCached } from '../cache/fetch-cached.ts';

export async function getNewsletterSubscriberCount(): Promise<null | number> {
  return fetchCached(
    (client) => new NewsletterService(client).getNewsletterSubscriberCount(),
    {
      keyParts: ['newsletter-count'],
      tags: ['newsletter', 'stats'],
      ttlKey: 'newsletter_count',
      fallback: 0,
      logMeta: { source: 'newsletter.actions' },
    }
  );
}
