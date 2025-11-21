/**
 * Cached RPC Helper Functions
 *
 * NOTE: This file does NOT have 'use server' because fetchCachedRpc is a helper function
 * used in server components, not a server action called from client components.
 * Removing 'use server' prevents Next.js from treating this as a server action module
 * during static generation, which was causing "Server Functions cannot be called" errors.
 */

import type { CacheTtlKey } from '@/src/lib/data/config/cache-config';
import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

type LoggerValue = string | number | boolean;

interface CachedRpcOptions<Result> {
  tags: string[];
  ttlKey: CacheTtlKey;
  keySuffix: string;
  useAuthClient?: boolean;
  fallback: Result;
  logMeta?: Record<string, LoggerValue>;
}

/**
 * Type-safe cached RPC helper
 * Uses centralized Database types for full type safety
 *
 * Note: When calling with explicit Result type, you may need to use `as const` on rpcName
 * for proper type inference, or specify both T and Result generics.
 *
 * @example
 * // Result type inferred from RPC return type (recommended)
 * const data = await fetchCachedRpc(
 *   { p_form_type: 'agents' },
 *   {
 *     rpcName: 'get_form_field_config',
 *     tags: ['templates'],
 *     ttlKey: 'cache.templates.ttl_seconds',
 *     keySuffix: 'agents',
 *     fallback: null,
 *   }
 * );
 *
 * @example
 * // Explicit Result type - specify both T and Result
 * const data = await fetchCachedRpc<'get_account_dashboard', GetGetAccountDashboardReturn | null>(
 *   { p_user_id: userId },
 *   {
 *     rpcName: 'get_account_dashboard',
 *     tags: ['users'],
 *     ttlKey: 'cache.account.ttl_seconds',
 *     keySuffix: userId,
 *     fallback: null,
 *   }
 * );
 */
export async function fetchCachedRpc<
  T extends keyof Database['public']['Functions'],
  Result = Database['public']['Functions'][T]['Returns'],
>(
  args: Database['public']['Functions'][T]['Args'],
  options: CachedRpcOptions<Result> & { rpcName: T }
): Promise<Result> {
  try {
    const data = await cachedRPCWithDedupe<T>(options.rpcName, args, {
      tags: options.tags,
      ttlConfigKey: options.ttlKey,
      keySuffix: options.keySuffix,
      useAuthClient: options.useAuthClient ?? false,
    });

    return (data ?? options.fallback) as Result;
  } catch (error) {
    const normalized = normalizeError(error, `Failed to run ${String(options.rpcName)}`);
    logger.error(String(options.rpcName), normalized, options.logMeta);
    return options.fallback;
  }
}
