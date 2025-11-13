/**
 * Navigation Data Layer - Database-First Architecture
 * Uses get_navigation_menu() RPC with edge-layer caching
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';

export interface NavigationItem {
  path: string;
  title: string;
  description: string;
  iconName: string;
  group: 'primary' | 'secondary' | 'actions';
}

export interface NavigationData {
  primary: NavigationItem[];
  secondary: NavigationItem[];
  actions: NavigationItem[];
}

/**
 * Get navigation menu data via edge-cached RPC
 * Used by command palette and navigation components
 */
export async function getNavigationMenu(): Promise<NavigationData> {
  try {
    const data = await cachedRPCWithDedupe<NavigationData>(
      'get_navigation_menu',
      {},
      {
        tags: ['navigation', 'ui'],
        ttlConfigKey: 'cache.navigation.ttl_seconds',
        keySuffix: 'menu',
        useAuthClient: false, // Public data
      }
    );

    return (
      data || {
        primary: [],
        secondary: [],
        actions: [],
      }
    );
  } catch (error) {
    logger.error(
      'Error in getNavigationMenu',
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      primary: [],
      secondary: [],
      actions: [],
    };
  }
}
