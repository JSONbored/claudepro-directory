'use server';

/**
 * Shared helpers for server actions.
 * Provides RPC execution, Statsig-driven cache invalidation, and trace metadata builders.
 */

import {
  type CacheConfigPromise,
  type CacheInvalidateKey,
  getCacheConfigSnapshot,
} from '@/src/lib/data/config/cache-config';
import { revalidateCacheTags } from '@/src/lib/supabase/cache-helpers';
import { createClient } from '@/src/lib/supabase/server';
import { logActionFailure } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database-overrides';

type PublicRpc = keyof Database['public']['Functions'] | 'ensure_user_record';

export interface RunRpcContext {
  action: string;
  userId?: string;
  meta?: Record<string, unknown>;
}

export async function resolveInvalidateTags(
  keys: CacheInvalidateKey[] = [],
  cacheConfigPromise?: CacheConfigPromise
): Promise<string[]> {
  if (!keys.length) {
    return [];
  }

  const config = await (cacheConfigPromise ?? getCacheConfigSnapshot());
  const tags = new Set<string>();
  for (const key of keys) {
    for (const tag of config[key]) {
      tags.add(tag);
    }
  }

  return [...tags];
}

export async function invalidateByKeys({
  cacheConfigPromise,
  invalidateKeys,
  extraTags,
}: {
  cacheConfigPromise?: CacheConfigPromise;
  invalidateKeys?: CacheInvalidateKey[];
  extraTags?: string[];
}): Promise<void> {
  const tags = new Set(extraTags ?? []);

  if (invalidateKeys?.length) {
    const resolved = await resolveInvalidateTags(invalidateKeys, cacheConfigPromise);
    for (const tag of resolved) {
      tags.add(tag);
    }
  }

  if (tags.size) {
    await revalidateCacheTags([...tags]);
  }
}

export async function runRpc<ResultType>(
  rpcName: PublicRpc,
  args: Record<string, unknown>,
  context: RunRpcContext
): Promise<ResultType> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc(rpcName, args);
    if (error) {
      throw new Error(error.message);
    }
    return data as ResultType;
  } catch (error) {
    throw logActionFailure(context.action, error, {
      rpc: rpcName,
      userId: context.userId,
      ...(context.meta ?? {}),
    });
  }
}

export function traceMeta<T extends Record<string, unknown>>(meta?: T): T & { traceId: string } {
  const traceId = `trace_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return {
    traceId,
    ...(meta ?? ({} as T)),
  };
}
