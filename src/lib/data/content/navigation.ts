/**
 * Navigation Data Layer - Database-First Architecture
 * Uses get_navigation_menu() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';

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
  return fetchCachedRpc<NavigationData>(
    {},
    {
      rpcName: 'get_navigation_menu',
      tags: ['navigation', 'ui'],
      ttlKey: 'cache.navigation.ttl_seconds',
      keySuffix: 'menu',
      useAuthClient: false,
      fallback: {
        primary: [],
        secondary: [],
        actions: [],
      },
      logMeta: { namespace: 'navigation' },
    }
  );
}
