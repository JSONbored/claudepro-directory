/**
 * Announcement Banner Server Data - ISR-compatible with edge-layer caching
 * Uses anonymous client for static/ISR pages
 * Database-first: Uses generated Tables<'announcements'> type directly
 * Edge caching: Statsig-controlled TTL for global cache
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getActiveAnnouncement as fetchActiveAnnouncement } from '@/src/lib/data/announcements';
import { getCacheTtl } from '@/src/lib/data/config/cache-config';
import { logger } from '@/src/lib/logger';
import type { Tables } from '@/src/types/database.types';

/**
 * Get active announcement from database using anonymous client (ISR-safe)
 * Edge-layer cached with Statsig-controlled TTL + React cache for deduplication
 */
export const getActiveAnnouncement = cache(async (): Promise<Tables<'announcements'> | null> => {
  const ttl = await getCacheTtl('cache.announcements.ttl_seconds');

  return unstable_cache(
    async () => {
      try {
        return await fetchActiveAnnouncement();
      } catch (error) {
        logger.error(
          'Failed to load announcement',
          error instanceof Error ? error : new Error(String(error)),
          { source: 'AnnouncementBanner' }
        );
        return null;
      }
    },
    ['active-announcement'],
    {
      revalidate: ttl,
      tags: ['announcements'],
    }
  )();
});
