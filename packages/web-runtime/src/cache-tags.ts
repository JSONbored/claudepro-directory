import type { CacheConfigPromise, CacheInvalidateKey } from './cache-config.ts';
import { getCacheConfigSnapshot } from './cache-config.ts';
import { revalidateTag } from 'next/cache';

export type { CacheInvalidateKey };

export async function resolveInvalidateTags(
  keys: CacheInvalidateKey[] = [],
  cacheConfigPromise?: CacheConfigPromise
): Promise<string[]> {
  if (!keys.length) {
    return [];
  }

  const config = (await cacheConfigPromise) ?? (await getCacheConfigSnapshot());
  const tags = new Set<string>();
  for (const key of keys) {
    const entries = config[key] ?? [];
    for (const tag of entries) {
      tags.add(tag);
    }
  }
  return [...tags];
}

export interface InvalidateByKeysParams {
  cacheConfigPromise?: CacheConfigPromise;
  invalidateKeys?: CacheInvalidateKey[];
  extraTags?: string[];
}

export function createInvalidateByKeys(
  revalidate: (tags: string[]) => Promise<void> | void
) {
  return async function invalidateByKeys({
    cacheConfigPromise,
    invalidateKeys,
    extraTags,
  }: InvalidateByKeysParams = {}): Promise<void> {
    const tags = new Set(extraTags ?? []);

    if (invalidateKeys?.length) {
      const resolved = await resolveInvalidateTags(invalidateKeys, cacheConfigPromise);
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
