/**
 * Announcement Banner Server Data - ISR-compatible with edge-layer caching
 * Uses anonymous client for static/ISR pages
 * Database-first: Uses generated types directly from @heyclaude/database-types
 * Edge caching: Statsig-controlled TTL for global cache
 */

import type { Database } from '@heyclaude/database-types';
import { logger } from '@heyclaude/web-runtime/core';
import {
  getActiveAnnouncement as fetchActiveAnnouncement,
  getCacheTtl,
} from '@heyclaude/web-runtime/data';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

/**
 * Get active announcement from database using anonymous client (ISR-safe)
 * Edge-layer cached with Statsig-controlled TTL + React cache for deduplication
 */
export const getActiveAnnouncement = cache(
  async (): Promise<Database['public']['Tables']['announcements']['Row'] | null> => {
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
  }
);
