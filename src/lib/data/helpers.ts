'use server';

import type { CacheTtlKey } from '@/src/lib/data/config/cache-config';
import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database-overrides';

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
 *   { p_content_type: 'agents' },
 *   {
 *     rpcName: 'get_form_fields_for_content_type',
 *     tags: ['templates'],
 *     ttlKey: 'cache.templates.ttl_seconds',
 *     keySuffix: 'agents',
 *     fallback: null,
 *   }
 * );
 *
 * @example
 * // Explicit Result type - specify both T and Result
 * const data = await fetchCachedRpc<'get_account_dashboard', GetAccountDashboardReturn | null>(
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
  Result extends
    Database['public']['Functions'][T]['Returns'] = Database['public']['Functions'][T]['Returns'],
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
