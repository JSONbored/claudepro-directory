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
import { createAnonClient } from '@/src/lib/supabase/server-anon';
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
        const supabase = createAnonClient();
        const now = new Date().toISOString();

        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('active', true)
          .or(`start_date.is.null,start_date.lte.${now}`)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .order('priority', { ascending: false })
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          logger.error('Failed to load announcement', error, { source: 'AnnouncementBanner' });
          return null;
        }

        return data;
      } catch (_error) {
        // Mock client or connection error - silently fail
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
