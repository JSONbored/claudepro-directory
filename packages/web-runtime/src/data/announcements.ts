'use server';

import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../build-time.ts';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';

/**
 * Get active announcement
 *
 * Uses 'use cache' to cache announcement data. This data is public and same for all users.
 * Announcements change periodically, so we use the 'half' cacheLife profile.
 */
export async function getActiveAnnouncement(): Promise<
  Database['public']['Tables']['announcements']['Row'] | null
> {
  'use cache';

  // Configure cache - use 'half' profile for announcements (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('announcements');

  // Use admin client during build for better performance, anon client at runtime
  let client;
  if (isBuildTime()) {
    const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
    client = createSupabaseAdminClient();
  } else {
    client = createSupabaseAnonClient();
  }

  const service = new MiscService(client);
  return service.getActiveAnnouncement();
}
