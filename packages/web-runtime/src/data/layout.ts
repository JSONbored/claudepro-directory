'use server';

import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../logger.ts';

import { getActiveAnnouncement } from './announcements';
import { DEFAULT_LAYOUT_DATA, type LayoutData } from './layout/constants';

/**
 * Promise status constant (JavaScript standard, not database enum)
 * Used to avoid lint rule false positives on Promise.allSettled status checks
 */
const PROMISE_REJECTED_STATUS = 'rejected' as const;

// Note: getLayoutFlags is exported from data-client.ts (client-safe entry point)
// Do not export from here to avoid 'use server' restrictions

// LayoutData and DEFAULT_LAYOUT_DATA are exported from ./layout/constants
// to avoid 'use server' restrictions (constants cannot be exported from 'use server' files)

/**
 * Get layout data (announcements and navigation)
 * Uses 'use cache' to cache layout data. This data is public and same for all users.
 * Layout data (navigation + announcements) changes very rarely, so we use the 'stable' cacheLife profile.
 */
export async function getLayoutData(): Promise<LayoutData> {
  'use cache';

  // Configure cache - use 'stable' profile for rarely-changing layout data
  cacheLife('stable'); // 6hr stale, 1hr revalidate, 7 days expire
  cacheTag('layout');
  cacheTag('ui');
  cacheTag('navigation');
  cacheTag('announcements');

  const reqLogger = logger.child({
    operation: 'getLayoutData',
    module: 'data/layout',
  });

  try {
    const [announcementResult] = await Promise.allSettled([getActiveAnnouncement()]);

    const announcement =
      announcementResult.status === 'fulfilled' && announcementResult.value !== null
        ? announcementResult.value
        : null;

    if (announcementResult.status === PROMISE_REJECTED_STATUS) {
      // logger.error() normalizes errors internally, so pass raw error
      // Convert unknown error to Error | string for TypeScript
      const reason = announcementResult.reason;
      const errorForLogging: Error | string =
        typeof reason === 'object' && reason !== null && 'message' in reason && 'stack' in reason
          ? (reason as Error)
          : typeof reason === 'string'
            ? reason
            : typeof reason === 'object' &&
                reason !== null &&
                'toString' in reason &&
                typeof reason.toString === 'function'
              ? reason.toString()
              : String(reason);
      reqLogger.error('getLayoutData: announcement fetch failed', errorForLogging, {
        source: 'layout-data',
        component: 'announcement',
      });
    }

    reqLogger.info('getLayoutData: fetched successfully', {
      hasAnnouncement: Boolean(announcement),
    });

    return {
      announcement,
      navigationData: DEFAULT_LAYOUT_DATA.navigationData,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    // Convert unknown error to Error | string for TypeScript
    const errorForLogging: Error | string =
      typeof error === 'object' && error !== null && 'message' in error && 'stack' in error
        ? (error as Error)
        : typeof error === 'string'
          ? error
          : String(error);
    reqLogger.error('getLayoutData: catastrophic failure, using defaults', errorForLogging, {
      source: 'layout-data',
      fallbackStrategy: 'defaults',
    });
    return DEFAULT_LAYOUT_DATA;
  }
}
