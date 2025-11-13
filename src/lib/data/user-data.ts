/**
 * User Data Layer - Authenticated RPC calls with user-scoped edge caching
 * Centralized location for all user-specific data fetching
 */

import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { logger } from '@/src/lib/logger';

/**
 * Get user account dashboard data (bookmarks, profile, tier)
 */
export async function getAccountDashboard(userId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_account_dashboard',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `dashboard-${userId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getAccountDashboard',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return null;
  }
}

/**
 * Get user library (bookmarks + collections)
 */
export async function getUserLibrary(userId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_user_library',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`, 'user-bookmarks'],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `library-${userId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getUserLibrary',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return null;
  }
}

/**
 * Get user dashboard data (includes jobs)
 */
export async function getUserDashboard(userId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_user_dashboard',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`, 'jobs'],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `jobs-${userId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getUserDashboard',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return null;
  }
}
