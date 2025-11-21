/**
 * Layout Data - Consolidated Data Fetching
 *
 * Consolidates layout-level data fetching with:
 * - Parallel fetching (Promise.allSettled)
 * - Error handling with fallbacks
 * - Request deduplication (React cache)
 * - Type-safe results
 */

'use server';

import { cache } from 'react';
import { getActiveAnnouncement as fetchActiveAnnouncement } from '@/src/components/core/layout/announcement-banner-server';
import { getNavigationMenu } from '@/src/lib/data/content/navigation';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

/**
 * Layout data result type
 */
export interface LayoutData {
  announcement: Database['public']['Tables']['announcements']['Row'] | null;
  navigationData: Database['public']['Functions']['get_navigation_menu']['Returns'];
}

/**
 * Default layout data (used as fallbacks on error)
 */
const DEFAULT_LAYOUT_DATA: LayoutData = {
  announcement: null,
  navigationData: {
    primary: null,
    secondary: null,
    actions: null,
  },
};

/**
 * Fetch all layout data in parallel with error handling
 * Uses Promise.allSettled to handle partial failures gracefully
 * Wrapped in React cache() for request deduplication
 */
export const getLayoutData = cache(async (): Promise<LayoutData> => {
  try {
    // Fetch both data sources in parallel
    const [announcementResult, navigationResult] = await Promise.allSettled([
      fetchActiveAnnouncement(),
      getNavigationMenu(),
    ]);

    // Extract announcement with fallback
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

    // Extract navigation data with fallback
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
    // Catastrophic failure - log and return all defaults
    const normalized = normalizeError(error, 'Failed to fetch layout data');
    logger.error('getLayoutData: catastrophic failure, using defaults', normalized, {
      source: 'layout-data',
    });
    return DEFAULT_LAYOUT_DATA;
  }
});
