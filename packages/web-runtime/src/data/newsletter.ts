'use server';

import { createCachedDataFunction, generateResourceTags } from './cached-data-factory.ts';

/**
 * Get newsletter subscriber count
 *
 * Uses 'use cache' to cache newsletter count. This data is public and same for all users.
 * Newsletter count changes frequently, so we use the 'long' cacheLife profile.
 */
export const getNewsletterSubscriberCount = createCachedDataFunction<void, number>({
  serviceKey: 'newsletter',
  methodName: 'getNewsletterSubscriberCount',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: () => generateResourceTags('newsletter', undefined, ['stats']),
  module: 'data/newsletter',
  operation: 'getNewsletterSubscriberCount',
  transformResult: (result) => (result as number | null) ?? 0,
});
