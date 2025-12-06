/**
 * Announcement Banner Server Data - ISR-compatible with edge-layer caching
 * Uses anonymous client for static/ISR pages
 * Database-first: Uses generated types directly from @heyclaude/database-types
 * Edge caching: Static config-controlled TTL for global cache
 */

import { type Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  getActiveAnnouncement as fetchActiveAnnouncement,
  getCacheTtl,
} from '@heyclaude/web-runtime/server';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Get active announcement from database
 *
 * Uses 'use cache' to cache active announcement with config-controlled TTL.
 * This data is public and same for all users, so it can be cached at build time.
 */
export async function getActiveAnnouncement(): Promise<Database['public']['Tables']['announcements']['Row'] | null> {
  'use cache';
  const ttl = getCacheTtl('cache.announcements.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  cacheTag('announcements');

  try {
    return await fetchActiveAnnouncement();
  } catch (error) {
    logger.error(
      'Failed to load announcement',
      normalizeError(error, 'Failed to load announcement'),
      { source: 'AnnouncementBanner' }
    );
    return null;
  }
}
