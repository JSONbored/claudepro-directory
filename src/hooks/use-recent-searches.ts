/**
 * useRecentSearches Hook
 *
 * Manages recent search queries in localStorage for quick access.
 * Shows last 5 searches with add/clear functionality.
 *
 * Features:
 * - Persists across sessions
 * - Deduplicates entries
 * - Auto-limits to maxItems
 * - Type-safe with error handling
 *
 * Usage:
 * ```tsx
 * const { recent, addSearch, clearRecent } = useRecentSearches();
 * ```
 */

import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/src/lib/logger';

const STORAGE_KEY = 'recent_searches';
const DEFAULT_MAX_ITEMS = 5;

interface UseRecentSearchesOptions {
  maxItems?: number;
  storageKey?: string;
}

export function useRecentSearches(options: UseRecentSearchesOptions = {}) {
  const { maxItems = DEFAULT_MAX_ITEMS, storageKey = STORAGE_KEY } = options;

  const [recent, setRecent] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecent(parsed.slice(0, maxItems));
        }
      }
    } catch (error) {
      logger.warn('useRecentSearches: Failed to load from localStorage', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Clear corrupted data
      localStorage.removeItem(storageKey);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, maxItems]);

  // Add new search query
  const addSearch = useCallback(
    (query: string) => {
      if (!query || typeof query !== 'string') return;

      const trimmed = query.trim();
      if (trimmed.length === 0 || trimmed.length > 100) return;

      setRecent((prev) => {
        // Remove duplicates and add to front
        const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, maxItems);

        // Persist to localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          logger.warn('useRecentSearches: Failed to save to localStorage', {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        return updated;
      });
    },
    [maxItems, storageKey]
  );

  // Remove specific search query
  const removeSearch = useCallback(
    (query: string) => {
      setRecent((prev) => {
        const updated = prev.filter((q) => q !== query);

        // Persist to localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          logger.warn('useRecentSearches: Failed to update localStorage', {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        return updated;
      });
    },
    [storageKey]
  );

  // Clear all recent searches
  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      logger.warn('useRecentSearches: Failed to clear localStorage', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [storageKey]);

  // Get top N searches
  const getTopSearches = useCallback(
    (count: number) => {
      return recent.slice(0, Math.min(count, recent.length));
    },
    [recent]
  );

  // Check if query exists in recent
  const hasSearch = useCallback(
    (query: string) => {
      return recent.some((q) => q.toLowerCase() === query.toLowerCase());
    },
    [recent]
  );

  return {
    recent,
    addSearch,
    removeSearch,
    clearRecent,
    getTopSearches,
    hasSearch,
    isLoaded,
  };
}

/**
 * Type definitions for external use
 */
export type RecentSearches = ReturnType<typeof useRecentSearches>;
