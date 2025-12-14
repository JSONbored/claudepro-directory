'use server';

import { NewsletterService } from '@heyclaude/data-layer';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Get newsletter subscriber count
 *
 * Uses 'use cache' to cache newsletter count. This data is public and same for all users.
 * Newsletter count changes frequently, so we use the 'quarter' cacheLife profile.
 */
export async function getNewsletterSubscriberCount(): Promise<null | number> {
  'use cache';

  // Configure cache - use 'quarter' profile for newsletter count (changes every 5 minutes)
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2 hours expire
  cacheTag('newsletter');
  cacheTag('stats');

  const service = new NewsletterService();
  const result = await service.getNewsletterSubscriberCount();
  return result ?? 0;
}
