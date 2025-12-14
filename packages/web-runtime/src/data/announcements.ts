'use server';

import { MiscService } from '@heyclaude/data-layer';
import { type announcements } from '@heyclaude/data-layer/prisma';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Get active announcement
 *
 * Uses 'use cache' to cache announcement data. This data is public and same for all users.
 * Announcements change periodically, so we use the 'half' cacheLife profile.
 */
export async function getActiveAnnouncement(): Promise<announcements | null> {
  'use cache';

  // Configure cache - use 'half' profile for announcements (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('announcements');

  const service = new MiscService();
  const result = await service.getActiveAnnouncement();

  // RPC returns data with string dates, convert to Prisma types (Date objects)
  if (!result) {
    return null;
  }

  // Convert RPC return data (string dates) to Prisma types (Date objects)
  // RPC returns: { created_at: string, updated_at: string, start_date: string | null, end_date: string | null, ... }
  // Prisma expects: { created_at: Date, updated_at: Date, start_date: Date | null, end_date: Date | null, ... }
  return {
    ...result,
    created_at: new Date(result.created_at),
    end_date: result.end_date ? new Date(result.end_date) : null,
    start_date: result.start_date ? new Date(result.start_date) : null,
    updated_at: new Date(result.updated_at),
  } as announcements;
}
