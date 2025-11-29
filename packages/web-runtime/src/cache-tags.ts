import type { CacheConfig, CacheInvalidateKey, CacheInvalidateKeyLegacy } from './cache-config.ts';
import { getCacheInvalidateTags } from './cache-config.ts';
import { revalidateTag } from 'next/cache';

export type { CacheConfig, CacheInvalidateKey, CacheInvalidateKeyLegacy };

/**
 * Resolve invalidation keys to their tag arrays
 * Accepts both new format ('content_create') and legacy format ('cache.invalidate.content_create')
 * @param keys - Array of invalidation keys
 * @param _cacheConfig - Deprecated: config is now loaded internally
 */
export function resolveInvalidateTags(
  keys: (CacheInvalidateKey | CacheInvalidateKeyLegacy)[] = [],
  _cacheConfig?: CacheConfig
): string[] {
  if (!keys.length) {
    return [];
  }

  const tags = new Set<string>();
  for (const key of keys) {
    // Use getCacheInvalidateTags which handles both formats
    const entries = getCacheInvalidateTags(key);
    for (const tag of entries) {
      tags.add(tag);
    }
  }
  return [...tags];
}

export interface InvalidateByKeysParams {
  cacheConfig?: CacheConfig;
  invalidateKeys?: (CacheInvalidateKey | CacheInvalidateKeyLegacy)[];
  extraTags?: string[];
}

export function createInvalidateByKeys(
  revalidate: (tags: string[]) => Promise<void> | void
) {
  return async function invalidateByKeys({
    cacheConfig,
    invalidateKeys,
    extraTags,
  }: InvalidateByKeysParams = {}): Promise<void> {
    const tags = new Set(extraTags ?? []);

    if (invalidateKeys?.length) {
      const resolved = resolveInvalidateTags(invalidateKeys, cacheConfig);
      for (const tag of resolved) {
        tags.add(tag);
      }
    }

    if (tags.size) {
      await revalidate([...tags]);
    }
  };
}

export function revalidateCacheTags(tags: string[], cache: 'default' | 'layout' = 'default'): void {
  for (const tag of tags) {
    revalidateTag(tag, cache);
  }
}

export const nextInvalidateByKeys = createInvalidateByKeys(async (tags) => {
  revalidateCacheTags(tags);
});
