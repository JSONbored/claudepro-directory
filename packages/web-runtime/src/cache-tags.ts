import type { CacheConfig, CacheInvalidateKey } from './cache-config.ts';
import { getCacheInvalidateTags } from './cache-config.ts';
import { revalidateTag } from 'next/cache';

export type { CacheConfig, CacheInvalidateKey };

/**
 * Resolve invalidation keys to their tag arrays
 * @param keys - Array of invalidation keys (e.g., 'content_create')
 * @param _cacheConfig - Deprecated: config is now loaded internally
 */
export function resolveInvalidateTags(
  keys: CacheInvalidateKey[] = [],
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
  invalidateKeys?: CacheInvalidateKey[];
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
