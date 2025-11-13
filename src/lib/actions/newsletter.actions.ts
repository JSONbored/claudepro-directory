'use server';

/**
 * Newsletter Server Actions
 * Secure server-side RPC calls for newsletter operations
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';

/**
 * Get newsletter subscriber count with edge caching
 * Cached for 5 minutes (controlled by cache.newsletter_count_ttl_s)
 */
export async function getNewsletterCount(): Promise<number | null> {
  try {
    const data = await cachedRPCWithDedupe(
      'get_newsletter_subscriber_count',
      {},
      {
        tags: ['newsletter', 'stats'],
        ttlConfigKey: 'cache.newsletter_count_ttl_s',
        keySuffix: 'newsletter-count',
        useAuthClient: false, // Public endpoint
      }
    );
    return (data as number) || null;
  } catch (error) {
    logger.error(
      'Error in getNewsletterCount',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}
