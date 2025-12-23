import 'server-only';

import { type Prisma } from '@prisma/client';

import { createDataFunction } from './cached-data-factory.ts';
import { getService } from './service-factory.ts';

type newsletter_subscriptionsModel = Prisma.newsletter_subscriptionsGetPayload<{}>;

/**
 * Get newsletter subscriber count
 *
 * Uses 'use cache' to cache newsletter count. This data is public and same for all users.
 * Newsletter count changes frequently, so we use the 'long' cacheLife profile.
 */
export const getNewsletterSubscriberCount = createDataFunction<void, number>({
  methodName: 'getNewsletterSubscriberCount',
  module: 'data/newsletter',
  operation: 'getNewsletterSubscriberCount',
  serviceKey: 'newsletter',
  transformResult: (result) => (result as null | number) ?? 0,
});

/**
 * Get newsletter subscription by email
 *
 * Returns the full subscription record including topics, status, and preferences.
 * User-specific data - pages should use 'use cache: private' with appropriate cache tags.
 *
 * @param email - User's email address
 * @returns Subscription record or null if not found
 */
export async function getNewsletterSubscriptionByEmail(
  email: string
): Promise<newsletter_subscriptionsModel | null> {
  const newsletterService = await getService('newsletter');
  return newsletterService.getSubscriptionByEmail(email);
}
