/**
 * Announcement Banner Server Data - ISR-compatible with edge-layer caching
 * Uses anonymous client for static/ISR pages
 * Database-first: Uses generated Tables<'announcements'> type directly
 * Edge caching: Statsig-controlled TTL for global cache
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { cacheConfigs } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import type { Tables } from '@/src/types/database.types';

/**
 * Get active announcement from database using anonymous client (ISR-safe)
 * Edge-layer cached with Statsig-controlled TTL + React cache for deduplication
 */
export const getActiveAnnouncement = cache(async (): Promise<Tables<'announcements'> | null> => {
  const config = await cacheConfigs();
  const ttl = config['cache.announcements.ttl_seconds'] as number;

  return unstable_cache(
    async () => {
      try {
        const data = await cachedRPCWithDedupe<Tables<'announcements'> | null>(
          'get_active_announcement',
          {},
          {
            tags: ['announcements'],
            ttlConfigKey: 'cache.announcements.ttl_seconds',
            keySuffix: 'active',
          }
        );
        return data ?? null;
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
