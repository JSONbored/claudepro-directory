'use server';

import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../build-time.ts';
import { getCacheTtl } from '../cache-config.ts';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';

const ANNOUNCEMENT_TTL_KEY = 'cache.announcements.ttl_seconds';

/**
 * Get active announcement
 *
 * Uses 'use cache' to cache announcement data. This data is public and same for all users.
 */
export async function getActiveAnnouncement(): Promise<
  Database['public']['Tables']['announcements']['Row'] | null
> {
  'use cache';

  // Configure cache
  const ttl = getCacheTtl(ANNOUNCEMENT_TTL_KEY);
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
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
