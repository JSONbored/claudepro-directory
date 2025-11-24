'use client';

/** Recently viewed content tracking with localStorage persistence and LRU eviction */

import { logClientWarning, logger } from '@heyclaude/web-runtime/core';
import { getRecentlyViewedConfig, getTimeoutConfig } from '@heyclaude/web-runtime/data';
import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';

export type RecentlyViewedCategory =
  | 'agent'
  | 'mcp'
  | 'hook'
  | 'command'
  | 'rule'
  | 'statusline'
  | 'skill'
  | 'job';

export interface RecentlyViewedItem {
  category: RecentlyViewedCategory;
  slug: string;
  title: string;
  description: string;
  viewedAt: string;
  tags?: string[];
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  isLoaded: boolean;
  setItems: (
    items: RecentlyViewedItem[] | ((currentItems: RecentlyViewedItem[]) => RecentlyViewedItem[])
  ) => void;
  setLoaded: (loaded: boolean) => void;
}

export interface UseRecentlyViewedReturn {
  recentlyViewed: RecentlyViewedItem[];
  isLoaded: boolean;
  addRecentlyViewed: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  removeItem: (category: RecentlyViewedCategory, slug: string) => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'heyclaude_recently_viewed';

// Configuration (loaded from Statsig via server actions)
let MAX_ITEMS = 10;
let TTL_DAYS = 30;
let DEBOUNCE_MS = 300;
let MAX_DESCRIPTION_LENGTH = 150;
let MAX_TAGS = 5;

// Load configs on module initialization
Promise.all([getRecentlyViewedConfig(), getTimeoutConfig()])
  .then(([recentlyViewedResult, timeoutResult]) => {
    if (recentlyViewedResult) {
      const recentlyViewed = recentlyViewedResult;
      MAX_ITEMS = recentlyViewed['recently_viewed.max_items'];
      TTL_DAYS = recentlyViewed['recently_viewed.ttl_days'];
      MAX_DESCRIPTION_LENGTH = recentlyViewed['recently_viewed.max_description_length'];
      MAX_TAGS = recentlyViewed['recently_viewed.max_tags'];
    }
    if (timeoutResult) {
      const timeout = timeoutResult;
      DEBOUNCE_MS = timeout['timeout.ui.form_debounce_ms'];
    }
  })
  .catch((error) => {
    logClientWarning('useRecentlyViewed: failed to load configs', error);
  });
const useRecentlyViewedStore = create<RecentlyViewedState>((set) => ({
  items: [],
  isLoaded: false,
  setItems: (itemsOrUpdater) =>
    set((state) => ({
      items: typeof itemsOrUpdater === 'function' ? itemsOrUpdater(state.items) : itemsOrUpdater,
    })),
  setLoaded: (loaded) => set({ isLoaded: loaded }),
}));

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

/**
 * Check if localStorage is available
 * Handles SSR and private browsing mode
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load items from localStorage
 * Handles errors and corrupted data gracefully
 */
function loadFromStorage(): RecentlyViewedItem[] {
  if (!isStorageAvailable()) return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as RecentlyViewedItem[];

    // Validate structure
    if (!Array.isArray(parsed)) {
      logger.warn('Invalid recently viewed data structure');
      return [];
    }

    // Filter out expired items (TTL check)
    const now = Date.now();
    const ttlMs = TTL_DAYS * 24 * 60 * 60 * 1000;

    const validItems = parsed.filter((item) => {
      if (!(item.slug && item.category && item.viewedAt)) return false;
      const age = now - new Date(item.viewedAt).getTime();
      return age < ttlMs;
    });

    return validItems.slice(0, MAX_ITEMS);
  } catch (error) {
    logger.error(
      'Failed to load recently viewed',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Save items to localStorage
 * Handles quota exceeded errors
 */
function saveToStorage(items: RecentlyViewedItem[]): void {
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    // Handle quota exceeded (unlikely with max 10 items, but defensive)
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      logger.warn('localStorage quota exceeded, clearing old items');
      // Try saving fewer items
      const reducedItems = items.slice(0, Math.floor(MAX_ITEMS / 2));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedItems));
      } catch {
        logger.error('Failed to save even after reduction');
      }
    } else {
      logger.error(
        'Failed to save recently viewed',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Recently Viewed Hook
 *
 * Returns an object with:
 * - recentlyViewed: List of recently viewed items (max 10)
 * - isLoaded: Whether data has been loaded from storage
 * - addRecentlyViewed: Add item to recently viewed
 * - removeItem: Remove specific item by slug
 * - clearAll: Clear all recently viewed items
 */
export function useRecentlyViewed(): UseRecentlyViewedReturn {
  const { items, isLoaded, setItems, setLoaded } = useRecentlyViewedStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (isLoaded) return;

    const loadedItems = loadFromStorage();
    setItems(loadedItems);
    setLoaded(true);
  }, [isLoaded, setItems, setLoaded]);

  /**
   * Debounced save to localStorage
   * Prevents excessive writes when rapidly adding items
   */
  const debouncedSave = useCallback((itemsToSave: RecentlyViewedItem[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(itemsToSave);
      saveTimeoutRef.current = null;
    }, DEBOUNCE_MS);
  }, []);

  /**
   * Add item to recently viewed
   * Implements LRU: moves existing item to front or adds new item
   */
  const addRecentlyViewed = useCallback(
    (item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
      setItems((currentItems) => {
        // Sanitize input
        const sanitizedItem: RecentlyViewedItem = {
          category: item.category,
          slug: item.slug,
          title: item.title,
          description: item.description.slice(0, MAX_DESCRIPTION_LENGTH),
          viewedAt: new Date().toISOString(),
          ...(item.tags && item.tags.length > 0 ? { tags: item.tags.slice(0, MAX_TAGS) } : {}),
        };

        // Remove existing entry if present (LRU)
        const filtered = currentItems.filter(
          (existing) => !(existing.category === item.category && existing.slug === item.slug)
        );

        // Add to front (most recent)
        const updated = [sanitizedItem, ...filtered].slice(0, MAX_ITEMS);

        // Debounced save
        debouncedSave(updated);

        return updated;
      });
    },
    [setItems, debouncedSave]
  );

  /**
   * Remove specific item by category + slug
   */
  const removeItem = useCallback(
    (category: RecentlyViewedCategory, slug: string) => {
      setItems((currentItems) => {
        const updated = currentItems.filter(
          (item) => !(item.category === category && item.slug === slug)
        );
        saveToStorage(updated);
        return updated;
      });
    },
    [setItems]
  );

  /**
   * Clear all recently viewed items
   */
  const clearAll = useCallback(() => {
    setItems([]);
    saveToStorage([]);
  }, [setItems]);

  return {
    recentlyViewed: items,
    isLoaded,
    addRecentlyViewed,
    removeItem,
    clearAll,
  };
}
