/**
 * Announcement Banner Server Data - ISR-compatible with edge-layer caching
 * Uses anonymous client for static/ISR pages
 * Database-first: Uses generated types directly from @heyclaude/database-types
 * Edge caching: Static config-controlled TTL for global cache
 */

import { type Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { getActiveAnnouncement as fetchActiveAnnouncement } from '@heyclaude/web-runtime/server';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Get active announcement from database
 *
 * Uses 'use cache' to cache active announcement with cacheLife profile.
 * This data is public and same for all users, so it can be cached at build time.
 */
export async function getActiveAnnouncement(): Promise<Database['public']['Tables']['announcements']['Row'] | null> {
  'use cache';
  // Use 'hours' profile: 1hr stale, 15min revalidate, 1 day expire
  cacheLife('hours');
  cacheTag('announcements');

  try {
    return await fetchActiveAnnouncement();
  } catch (error) {
    logger.error(
      {
        err: normalizeError(error, 'Failed to load announcement'),
        source: 'AnnouncementBanner',
      },
      'Failed to load announcement'
    );
    return null;
  }
}
