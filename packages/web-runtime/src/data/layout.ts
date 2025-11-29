'use server';

import { MiscService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';
import { cache } from 'react';

import { fetchCached } from '../cache/fetch-cached';
import { logger, normalizeError } from '../index';
import { generateRequestId } from '../utils/request-id';

import { getActiveAnnouncement } from './announcements';

/**
 * Promise status constant (JavaScript standard, not database enum)
 * Used to avoid lint rule false positives on Promise.allSettled status checks
 */
const PROMISE_REJECTED_STATUS = 'rejected' as const;

// Note: getLayoutFlags is exported from data-client.ts (client-safe entry point)
// Do not export from here to avoid 'use server' restrictions

const NAVIGATION_TTL_KEY = 'cache.navigation.ttl_seconds';

export async function getNavigationMenu(
  requestId?: string
): Promise<Database['public']['Functions']['get_navigation_menu']['Returns']> {
  // Use provided requestId or generate one as fallback
  const navRequestId = requestId ?? generateRequestId();
  const reqLogger = logger.child({
    requestId: navRequestId,
    operation: 'getNavigationMenu',
    module: 'data/layout',
  });

  try {
    return await fetchCached(
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
  } catch (error) {
    // Log error if fetchCached fails unexpectedly (e.g., cache system error)
    // Note: fetchCached handles service call errors internally and returns fallback
    const normalized = normalizeError(error, 'getNavigationMenu failed');
    reqLogger.error('getNavigationMenu: unexpected error', normalized);
    // Return fallback on unexpected errors
    return {
      primary: null,
      secondary: null,
      actions: null,
    };
  }
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
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getLayoutData',
    module: 'data/layout',
  });

  try {
    const [announcementResult, navigationResult] = await Promise.allSettled([
      getActiveAnnouncement(),
      getNavigationMenu(requestId),
    ]);

    const announcement =
      announcementResult.status === 'fulfilled' && announcementResult.value !== null
        ? announcementResult.value
        : null;

    if (announcementResult.status === PROMISE_REJECTED_STATUS) {
      // Log error for failed announcement fetch
      const normalized = normalizeError(
        announcementResult.reason,
        'Failed to load active announcement'
      );
      reqLogger.error('getLayoutData: announcement fetch failed', normalized, {
        source: 'layout-data',
        component: 'announcement',
      });
    }

    const navigationData =
      navigationResult.status === 'fulfilled'
        ? navigationResult.value
        : DEFAULT_LAYOUT_DATA.navigationData;

    if (navigationResult.status === PROMISE_REJECTED_STATUS) {
      // Log error for failed navigation fetch
      const normalized = normalizeError(navigationResult.reason, 'Failed to load navigation menu');
      reqLogger.error('getLayoutData: navigation fetch failed', normalized, {
        source: 'layout-data',
        component: 'navigation',
      });
    }

    return {
      announcement,
      navigationData,
    };
  } catch (error) {
    // Log error for catastrophic failure (unexpected error from Promise.allSettled itself)
    const normalized = normalizeError(error, 'Failed to fetch layout data');
    reqLogger.error('getLayoutData: catastrophic failure, using defaults', normalized, {
      source: 'layout-data',
      fallbackStrategy: 'defaults',
    });
    return DEFAULT_LAYOUT_DATA;
  }
});
