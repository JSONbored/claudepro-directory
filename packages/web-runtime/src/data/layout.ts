'use server';

import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../build-time.ts';
import { logger } from '../logger.ts';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';
import { generateRequestId } from '../utils/request-id.ts';

import { getActiveAnnouncement } from './announcements';
import { DEFAULT_LAYOUT_DATA, type LayoutData } from './layout/constants';

/**
 * Promise status constant (JavaScript standard, not database enum)
 * Used to avoid lint rule false positives on Promise.allSettled status checks
 */
const PROMISE_REJECTED_STATUS = 'rejected' as const;

// Note: getLayoutFlags is exported from data-client.ts (client-safe entry point)
// Do not export from here to avoid 'use server' restrictions

/**
 * Get navigation menu
 * Uses 'use cache' to cache navigation menu data. This data is public and same for all users.
 * Navigation data changes very rarely, so we use the 'stable' cacheLife profile.
 */
export async function getNavigationMenu(): Promise<
  Database['public']['Functions']['get_navigation_menu']['Returns']
> {
  'use cache';

  // Configure cache - use 'stable' profile for rarely-changing navigation data
  cacheLife('stable'); // 6hr stale, 1hr revalidate, 7 days expire
  cacheTag('navigation');
  cacheTag('ui');

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getNavigationMenu',
    module: 'data/layout',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const service = new MiscService(client);
    const result = await service.getNavigationMenu();

    reqLogger.info('getNavigationMenu: fetched successfully', {
      hasPrimary: Boolean(result?.primary),
      hasSecondary: Boolean(result?.secondary),
      hasActions: Boolean(result?.actions),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    // Convert unknown error to Error | string for TypeScript
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getNavigationMenu: failed', errorForLogging);
    // Return fallback on errors
    return {
      primary: null,
      secondary: null,
      actions: null,
    };
  }
}

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

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getLayoutData',
    module: 'data/layout',
  });

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
      // logger.error() normalizes errors internally, so pass raw error
      // Convert unknown error to Error | string for TypeScript
      const errorForLogging: Error | string =
        announcementResult.reason instanceof Error
          ? announcementResult.reason
          : announcementResult.reason instanceof String
            ? announcementResult.reason.toString()
            : String(announcementResult.reason);
      reqLogger.error('getLayoutData: announcement fetch failed', errorForLogging, {
        source: 'layout-data',
        component: 'announcement',
      });
    }

    const navigationData =
      navigationResult.status === 'fulfilled'
        ? navigationResult.value
        : DEFAULT_LAYOUT_DATA.navigationData;

    if (navigationResult.status === PROMISE_REJECTED_STATUS) {
      // logger.error() normalizes errors internally, so pass raw error
      // Convert unknown error to Error | string for TypeScript
      const errorForLogging: Error | string =
        navigationResult.reason instanceof Error
          ? navigationResult.reason
          : navigationResult.reason instanceof String
            ? navigationResult.reason.toString()
            : String(navigationResult.reason);
      reqLogger.error('getLayoutData: navigation fetch failed', errorForLogging, {
        source: 'layout-data',
        component: 'navigation',
      });
    }

    reqLogger.info('getLayoutData: fetched successfully', {
      hasAnnouncement: Boolean(announcement),
      hasNavigation: Boolean(navigationData),
    });

    return {
      announcement,
      navigationData,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    // Convert unknown error to Error | string for TypeScript
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getLayoutData: catastrophic failure, using defaults', errorForLogging, {
      source: 'layout-data',
      fallbackStrategy: 'defaults',
    });
    return DEFAULT_LAYOUT_DATA;
  }
}
