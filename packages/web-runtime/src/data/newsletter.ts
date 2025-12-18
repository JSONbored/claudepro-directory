import 'server-only';

import { createDataFunction } from './cached-data-factory.ts';

/**
 * Get newsletter subscriber count
 *
 * Uses 'use cache' to cache newsletter count. This data is public and same for all users.
 * Newsletter count changes frequently, so we use the 'long' cacheLife profile.
 */
export const getNewsletterSubscriberCount = createDataFunction<void, number>({
  serviceKey: 'newsletter',
  methodName: 'getNewsletterSubscriberCount',
  module: 'data/newsletter',
  operation: 'getNewsletterSubscriberCount',
  transformResult: (result) => (result as number | null) ?? 0,
});
