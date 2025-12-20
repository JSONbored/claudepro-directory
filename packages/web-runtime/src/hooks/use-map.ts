'use client';

import { useCallback, useState } from 'react';

/**
 * React hook for Map state management with type-safe key-value operations.
 *
 * Provides a useState-like API specifically designed for Map operations with immutable
 * updates that trigger re-renders correctly. Better than objects for frequent
 * additions/deletions, non-string keys, and guaranteed iteration order.
 *
 * **When to use:**
 * - ✅ Entity management - Store collections of objects by ID with efficient lookups
 * - ✅ Caching systems - Cache computed values with complex keys and automatic cleanup
 * - ✅ Form field tracking - Dynamic form state management with unique field identifiers
 * - ✅ Lookup tables - Fast key-based data access for configuration or mapping data
 * - ✅ State normalization - Normalize nested data structures for predictable updates
 * - ✅ Live data feeds - Manage real-time data with frequent updates and deletions
 * - ❌ For simple static key-value data - objects with `useState` are simpler
 *
 * **Advantages over objects:**
 * - Better performance for frequent additions/deletions
 * - Any key type (not just strings) - numbers, objects, functions
 * - No prototype pollution from string keys
 * - Guaranteed insertion order (unlike objects)
 * - Cleaner iteration patterns
 *
 * **Performance:**
 * - Action functions are memoized with `useCallback` to prevent unnecessary
 *   child component re-renders when passed as props
 * - Immutable updates create new Map instances for proper React re-renders
 *
 * @typeParam K - Type of the Map keys
 * @typeParam V - Type of the Map values
 * @param initialState - Initial Map state (Map instance or array of [key, value] entries)
 * @returns Tuple `[map, actions]` where actions contains `set`, `setAll`, `remove`, and `reset`
 *
 * @example
 * ```tsx
 * // Entity management by ID
 * const [users, { set, remove }] = useMap<User>([
 *   ['user-1', { id: 'user-1', name: 'Alice' }],
 *   ['user-2', { id: 'user-2', name: 'Bob' }],
 * ]);
 *
 * set('user-3', { id: 'user-3', name: 'Charlie' });
 * remove('user-1');
 * ```
 *
 * @example
 * ```tsx
 * // Complex keys (objects)
 * const [cache, { set }] = useMap<number>();
 *
 * const key = { userId: 1, resource: 'profile' };
 * set(key, cachedData);
 * ```
 *
 * @example
 * ```tsx
 * // Replace entire Map
 * const [items, { setAll, reset }] = useMap<Item>();
 *
 * setAll(newItems); // Replace with new Map or entries array
 * reset(); // Clear all entries
 * ```
 */
export function useMap<K, V>(initialState: Map<K, V> | Array<[K, V]> = new Map()) {
  const [map, setMap] = useState<ReadonlyMap<K, V>>(() => {
    if (initialState instanceof Map) {
      return new Map(initialState);
    }
    return new Map(initialState);
  });

  const set = useCallback((key: K, value: V) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
  }, []);

  const setAll = useCallback((entries: Map<K, V> | Array<[K, V]>) => {
    setMap(() => {
      if (entries instanceof Map) {
        return new Map(entries);
      }
      return new Map(entries);
    });
  }, []);

  const remove = useCallback((key: K) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setMap(new Map());
  }, []);

  return [
    map,
    {
      set,
      setAll,
      remove,
      reset,
    },
  ] as const;
}
