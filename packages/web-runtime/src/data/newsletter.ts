'use server';

import { NewsletterService } from '@heyclaude/data-layer';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../build-time.ts';
import { getCacheTtl } from '../cache-config.ts';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';

/**
 * Get newsletter subscriber count
 *
 * Uses 'use cache' to cache newsletter count. This data is public and same for all users.
 */
export async function getNewsletterSubscriberCount(): Promise<null | number> {
  'use cache';

  // Configure cache
  const ttl = getCacheTtl('cache.newsletter_count_ttl_s');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  cacheTag('newsletter');
  cacheTag('stats');

  // Use admin client during build for better performance, anon client at runtime
  let client;
  if (isBuildTime()) {
    const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
    client = createSupabaseAdminClient();
  } else {
    client = createSupabaseAnonClient();
  }

  const service = new NewsletterService(client);
  const result = await service.getNewsletterSubscriberCount();
  return result ?? 0;
}
