'use client';

/**
 * Recently Viewed Content Tracking Hook
 *
 * Provides localStorage-based tracking of recently viewed content with LRU eviction.
 * Persists across sessions and respects TTL and max items limits.
 *
 * Architecture:
 * - Client-side only (uses localStorage, Zustand state)
 * - Uses web-runtime config system for limits
 * - Structured logging for errors
 * - Generic category type (uses database content_category enum)
 *
 * Features:
 * - LRU eviction (moves existing items to front)
 * - TTL-based expiration
 * - Debounced localStorage writes
 * - Quota exceeded handling
 * - Type-safe with database enum types
 *
 * Usage:
 * ```tsx
 * import { useRecentlyViewed } from '@heyclaude/web-runtime/hooks';
 *
 * const { recentlyViewed, addRecentlyViewed, removeItem } = useRecentlyViewed();
 *
 * addRecentlyViewed({
 *   category: 'agents',
 *   slug: 'code-reviewer',
 *   title: 'Code Reviewer',
 *   description: 'AI code review assistant',
 * });
 * ```
 */

import {
  getRecentlyViewedConfig,
  getTimeoutConfig,
} from '../config/static-configs.ts';
import { normalizeError } from '../errors.ts';
import { logger } from '../entries/core.ts';
import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';

/**
 * Recently viewed category - subset of database content_category enum
 * Uses singular form for consistency with existing code
 * Maps to database enum: agent->agents, hook->hooks, etc.
 */
export type RecentlyViewedCategory =
  | 'agent' // maps to 'agents'
  | 'mcp'
  | 'hook' // maps to 'hooks'
  | 'command' // maps to 'commands'
  | 'rule' // maps to 'rules'
  | 'statusline' // maps to 'statuslines'
  | 'skill' // maps to 'skills'
  | 'job'; // maps to 'jobs'

/**
 * Maps singular RecentlyViewedCategory to plural route slug.
 * Used for generating correct URLs from recently viewed items.
 * 
 * @example
 * getCategoryRoute('agent') // returns 'agents'
 * getCategoryRoute('mcp') // returns 'mcp' (unchanged)
 */
const CATEGORY_TO_ROUTE: Record<RecentlyViewedCategory, string> = {
  agent: 'agents',
  mcp: 'mcp',
  hook: 'hooks',
  command: 'commands',
  rule: 'rules',
  statusline: 'statuslines',
  skill: 'skills',
  job: 'jobs',
};

/**
 * Map a singular recently-viewed category to its plural URL route segment.
 *
 * **⚠️ Client-Compatible**
 *
 * @param {RecentlyViewedCategory} category - The singular category name (e.g., 'agent', 'hook').
 * @returns {string} The plural route slug to use in URLs (e.g., '/agents', '/hooks').
 *
 * @example
 * getCategoryRoute('agent') // '/agents'
 * getCategoryRoute('hook')  // '/hooks'
 */
export function getCategoryRoute(category: RecentlyViewedCategory): string {
  return CATEGORY_TO_ROUTE[category];
}

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

// Configuration (loaded from static config)
let MAX_ITEMS = 10;
let TTL_DAYS = 30;
let DEBOUNCE_MS = 300;
let MAX_DESCRIPTION_LENGTH = 150;
let MAX_TAGS = 5;

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
      logger.warn('Invalid recently viewed data structure', undefined, {
        hook: 'useRecentlyViewed',
      });
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
    const normalized = normalizeError(error, 'Failed to load recently viewed');
    logger.error('Failed to load recently viewed', normalized, {
      hook: 'useRecentlyViewed',
    });
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
      logger.warn('localStorage quota exceeded, clearing old items', undefined, {
        hook: 'useRecentlyViewed',
      });
      // Try saving fewer items
      const reducedItems = items.slice(0, Math.floor(MAX_ITEMS / 2));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedItems));
      } catch {
        logger.error('Failed to save even after reduction', undefined, {
          hook: 'useRecentlyViewed',
        });
      }
    } else {
      const normalized = normalizeError(error, 'Failed to save recently viewed');
      logger.error('Failed to save recently viewed', normalized, {
        hook: 'useRecentlyViewed',
      });
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

    // Load configs from static defaults (only when not loaded)
    const recentlyViewed = getRecentlyViewedConfig();
    const timeout = getTimeoutConfig();
    
    const recentlyViewedConfig = recentlyViewed as {
      'recently_viewed.max_items': number;
      'recently_viewed.ttl_days': number;
      'recently_viewed.max_description_length': number;
      'recently_viewed.max_tags': number;
    };
    MAX_ITEMS = recentlyViewedConfig['recently_viewed.max_items'];
    TTL_DAYS = recentlyViewedConfig['recently_viewed.ttl_days'];
    MAX_DESCRIPTION_LENGTH = recentlyViewedConfig['recently_viewed.max_description_length'];
    MAX_TAGS = recentlyViewedConfig['recently_viewed.max_tags'];
    
    const timeoutConfig = timeout as { 'timeout.ui.form_debounce_ms': number };
    DEBOUNCE_MS = timeoutConfig['timeout.ui.form_debounce_ms'];

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