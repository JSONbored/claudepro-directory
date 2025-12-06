'use server';

import { NewsletterService } from '@heyclaude/data-layer';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../build-time.ts';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';

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
