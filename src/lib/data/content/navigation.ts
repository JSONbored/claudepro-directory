/**
 * Navigation Data Layer - Database-First Architecture
 * Uses get_navigation_menu() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

/**
 * Get navigation menu data via edge-cached RPC
 * Used by command palette and navigation components
 */
export async function getNavigationMenu(): Promise<
  Database['public']['Functions']['get_navigation_menu']['Returns']
> {
  return fetchCachedRpc<
    'get_navigation_menu',
    Database['public']['Functions']['get_navigation_menu']['Returns']
  >(undefined as never, {
    rpcName: 'get_navigation_menu',
    tags: ['navigation', 'ui'],
    ttlKey: 'cache.navigation.ttl_seconds',
    keySuffix: 'menu',
    useAuthClient: false,
    fallback: {
      primary: null,
      secondary: null,
      actions: null,
    },
    logMeta: { namespace: 'navigation' },
  });
}
