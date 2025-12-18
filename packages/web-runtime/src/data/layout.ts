import 'server-only';

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
 * Layout data (navigation + announcements) changes very rarely, so we use the 'long' cacheLife profile.
 */
export async function getLayoutData(): Promise<LayoutData> {
  // Simple data fetching function - pages control caching with 'use cache' directive

  const reqLogger = logger.child({
    module: 'data/layout',
    operation: 'getLayoutData',
  });

  try {
    const [announcementResult] = await Promise.allSettled([getActiveAnnouncement()]);

    const announcement =
      announcementResult.status === 'fulfilled' && announcementResult.value !== null
        ? announcementResult.value
        : null;

    if (announcementResult.status === PROMISE_REJECTED_STATUS) {
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
      reqLogger.error(
        { component: 'announcement', err: errorForLogging, source: 'layout-data' },
        'getLayoutData: announcement fetch failed'
      );
    }

    reqLogger.info(
      { hasAnnouncement: Boolean(announcement) },
      'getLayoutData: fetched successfully'
    );

    return {
      announcement,
      navigationData: DEFAULT_LAYOUT_DATA.navigationData,
    };
  } catch (error) {
    const errorForLogging: Error | string =
      typeof error === 'object' && error !== null && 'message' in error && 'stack' in error
        ? (error as Error)
        : typeof error === 'string'
          ? error
          : String(error);
    reqLogger.error(
      { err: errorForLogging, fallbackStrategy: 'defaults', source: 'layout-data' },
      'getLayoutData: catastrophic failure, using defaults'
    );
    return DEFAULT_LAYOUT_DATA;
  }
}
