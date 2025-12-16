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

  // Configure cache - use 'stable' profile for optimal SEO (6hr stale, 1hr revalidate, 7 days expire)
  cacheLife('stable'); // 6hr stale, 1hr revalidate, 7 days expire - optimized for SEO
  cacheTag('newsletter');
  cacheTag('stats');

  const service = new NewsletterService();
  const result = await service.getNewsletterSubscriberCount();
  return result ?? 0;
}
