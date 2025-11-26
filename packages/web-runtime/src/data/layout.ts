'use server';

import { MiscService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';
import { cache } from 'react';

/**
 * Promise status constant (JavaScript standard, not database enum)
 * Used to avoid lint rule false positives on Promise.allSettled status checks
 */
const PROMISE_REJECTED_STATUS = 'rejected' as const;

import { fetchCached } from '../cache/fetch-cached.ts';
import { logger, normalizeError } from '../index.ts';
import { generateRequestId } from '../utils/request-context.ts';

import { getActiveAnnouncement } from './announcements.ts';

const NAVIGATION_TTL_KEY = 'cache.navigation.ttl_seconds';

export async function getNavigationMenu(): Promise<
  Database['public']['Functions']['get_navigation_menu']['Returns']
> {
  return fetchCached(
    (client) => new MiscService(client).getNavigationMenu(),
    {
      keyParts: ['navigation-menu'],
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

    if (announcementResult.status === PROMISE_REJECTED_STATUS) {
      const normalized = normalizeError(
        announcementResult.reason,
        'Failed to load active announcement'
      );
      logger.error('getLayoutData: announcement fetch failed', normalized, {
        requestId: generateRequestId(),
        operation: 'getLayoutData',
        source: 'layout-data',
      });
    }

    const navigationData =
      navigationResult.status === 'fulfilled'
        ? navigationResult.value
        : DEFAULT_LAYOUT_DATA.navigationData;

    if (navigationResult.status === PROMISE_REJECTED_STATUS) {
      const normalized = normalizeError(navigationResult.reason, 'Failed to load navigation menu');
      logger.error('getLayoutData: navigation fetch failed', normalized, {
        requestId: generateRequestId(),
        operation: 'getLayoutData',
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
      requestId: generateRequestId(),
      operation: 'getLayoutData',
      source: 'layout-data',
    });
    return DEFAULT_LAYOUT_DATA;
  }
});
