/**
 * Navigation Data Layer - Database-First Architecture
 * Uses get_navigation_menu() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetNavigationMenuReturn } from '@/src/types/database-overrides';

/**
 * Get navigation menu data via edge-cached RPC
 * Used by command palette and navigation components
 */
export async function getNavigationMenu(): Promise<GetNavigationMenuReturn> {
  return fetchCachedRpc<'get_navigation_menu', GetNavigationMenuReturn>(undefined as never, {
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
  });
}
