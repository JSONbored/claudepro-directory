'use server';

import type { Database } from '@heyclaude/database-types';
import { cache } from 'react';
import { logger, normalizeError, getActiveAnnouncement } from '../index.ts';
import { fetchCached } from '../cache/fetch-cached.ts';
import { MiscService } from '@heyclaude/data-layer';

const NAVIGATION_TTL_KEY = 'cache.navigation.ttl_seconds';

export async function getNavigationMenu(): Promise<
  Database['public']['Functions']['get_navigation_menu']['Returns']
> {
  return fetchCached(
    (client) => new MiscService(client).getNavigationMenu(),
    {
      key: 'menu',
      tags: ['navigation', 'ui'],
      ttlKey: NAVIGATION_TTL_KEY,
      fallback: {
        primary: null,
        secondary: null,
        actions: null,
      },
      logMeta: { namespace: 'navigation' },
    }
  );
}

export interface LayoutData {
  announcement: Database['public']['Tables']['announcements']['Row'] | null;
  navigationData: Database['public']['Functions']['get_navigation_menu']['Returns'];
}

const DEFAULT_LAYOUT_DATA: LayoutData = {
  announcement: null,
  navigationData: {
    primary: null,
    secondary: null,
    actions: null,
  },
};

export const getLayoutData = cache(async (): Promise<LayoutData> => {
  try {
    const [announcementResult, navigationResult] = await Promise.allSettled([
      getActiveAnnouncement(),
      getNavigationMenu(),
    ]);

    const announcement =
      announcementResult.status === 'fulfilled' && announcementResult.value !== null
        ? announcementResult.value
        : null;

    if (announcementResult.status === 'rejected') {
      const normalized = normalizeError(
        announcementResult.reason,
        'Failed to load active announcement'
      );
      logger.error('getLayoutData: announcement fetch failed', normalized, {
        source: 'layout-data',
      });
    }

    const navigationData =
      navigationResult.status === 'fulfilled' && navigationResult.value
        ? navigationResult.value
        : DEFAULT_LAYOUT_DATA.navigationData;

    if (navigationResult.status === 'rejected') {
      const normalized = normalizeError(navigationResult.reason, 'Failed to load navigation menu');
      logger.error('getLayoutData: navigation fetch failed', normalized, {
        source: 'layout-data',
      });
    }

    return {
      announcement,
      navigationData,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch layout data');
    logger.error('getLayoutData: catastrophic failure, using defaults', normalized, {
      source: 'layout-data',
    });
    return DEFAULT_LAYOUT_DATA;
  }
});
