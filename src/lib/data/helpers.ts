'use server';

import type { CacheTtlKey } from '@/src/lib/data/config/cache-config';
import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { normalizeError } from '@/src/lib/utils/error.utils';

type LoggerValue = string | number | boolean;

interface CachedRpcOptions<Result> {
  rpcName: string;
  tags: string[];
  ttlKey: CacheTtlKey;
  keySuffix: string;
  useAuthClient?: boolean;
  fallback: Result;
  logMeta?: Record<string, LoggerValue>;
}

export async function fetchCachedRpc<Result>(
  args: Record<string, unknown>,
  options: CachedRpcOptions<Result>
): Promise<Result> {
  try {
    const data = await cachedRPCWithDedupe<Result>(options.rpcName, args, {
      tags: options.tags,
      ttlConfigKey: options.ttlKey,
      keySuffix: options.keySuffix,
      useAuthClient: options.useAuthClient ?? false,
    });

    return data ?? options.fallback;
  } catch (error) {
    const normalized = normalizeError(error, `Failed to run ${options.rpcName}`);
    logger.error(options.rpcName, normalized, options.logMeta);
    return options.fallback;
  }
}
