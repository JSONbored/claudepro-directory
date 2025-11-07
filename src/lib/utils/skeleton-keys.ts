/**
 * Skeleton Keys - Stable unique keys for skeleton loading states
 */

const keyCache = new Map<number, readonly string[]>();

export function getSkeletonKeys(count: number): readonly string[] {
  const cached = keyCache.get(count);
  if (cached) {
    return cached;
  }

  const keys = Array.from({ length: count }, () => `skeleton-${crypto.randomUUID()}`);
  Object.freeze(keys);
  keyCache.set(count, keys);

  return keys;
}
