/**
 * Skeleton Keys Utility
 *
 * Production-grade solution for React key generation in skeleton loading states.
 *
 * WHY THIS EXISTS:
 * - Biome warns against using array index as key (noArrayIndexKey)
 * - For skeleton loaders, items are static and never reorder
 * - This utility generates stable, unique keys that satisfy linters
 *
 * ARCHITECTURE:
 * - Lazy-initialized: Keys generated only when needed
 * - Memoized: Same keys returned for same count (prevents reconciliation issues)
 * - Unique: Uses crypto.randomUUID() for guaranteed uniqueness
 * - Type-safe: TypeScript ensures correct usage
 *
 * @example
 * ```tsx
 * const keys = getSkeletonKeys(10);
 * return (
 *   <div>
 *     {Array.from({ length: 10 }, (_, i) => (
 *       <Skeleton key={keys[i]} />
 *     ))}
 *   </div>
 * );
 * ```
 */

/**
 * Cache of generated keys by count
 * Ensures consistent keys across renders for same skeleton count
 */
const keyCache = new Map<number, readonly string[]>();

/**
 * Get stable keys for skeleton loading items
 *
 * @param count - Number of skeleton items
 * @returns Array of stable, unique keys
 */
export function getSkeletonKeys(count: number): readonly string[] {
  // Return cached keys if available
  const cached = keyCache.get(count);
  if (cached) {
    return cached;
  }

  // Generate new keys using crypto.randomUUID() for uniqueness
  const keys = Array.from({ length: count }, () => `skeleton-${crypto.randomUUID()}`);

  // Freeze array to prevent accidental mutation
  Object.freeze(keys);

  // Cache for future use
  keyCache.set(count, keys);

  return keys;
}

/**
 * Clear the key cache (useful for testing)
 * @internal
 */
export function clearSkeletonKeyCache(): void {
  keyCache.clear();
}
