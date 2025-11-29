'use client';

import type { Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';

export type PinboardCategory = Database['public']['Enums']['content_category'];

export interface PinboardItem {
  category: PinboardCategory;
  slug: string;
  title: string;
  typeName?: string;
  description?: string | null;
  pinnedAt: string;
  tags?: string[];
  thumbnailUrl?: string | null;
}

interface PinboardState {
  pins: PinboardItem[];
  isLoaded: boolean;
  setPins: (updater: PinboardItem[] | ((current: PinboardItem[]) => PinboardItem[])) => void;
  setLoaded: (loaded: boolean) => void;
}

const STORAGE_KEY = 'heyclaude_pinboard';
const MAX_PINS = 20;
const DEBOUNCE_MS = 250;

const usePinboardStore = create<PinboardState>((set) => ({
  pins: [],
  isLoaded: false,
  setPins: (updater) =>
    set((state) => ({
      pins: typeof updater === 'function' ? updater(state.pins) : updater,
    })),
  setLoaded: (loaded) => set({ isLoaded: loaded }),
}));

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__pinboard_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function loadPinsFromStorage(): PinboardItem[] {
  if (!isStorageAvailable()) return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as PinboardItem[];
    if (!Array.isArray(parsed)) {
      logger.warn('usePinboard: invalid data structure, resetting pinboard');
      return [];
    }
    return parsed.slice(0, MAX_PINS);
  } catch (error) {
    logger.error(
      'usePinboard: failed to load pins',
      normalizeError(error, 'Failed to load pins')
    );
    return [];
  }
}

function savePinsToStorage(pins: PinboardItem[]): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pins.slice(0, MAX_PINS)));
  } catch (error) {
    logger.error(
      'usePinboard: failed to persist pins',
      normalizeError(error, 'Failed to persist pins')
    );
  }
}

export interface UsePinboardReturn {
  pinnedItems: PinboardItem[];
  isLoaded: boolean;
  pinItem: (item: Omit<PinboardItem, 'pinnedAt'>) => void;
  unpinItem: (category: PinboardCategory, slug: string) => void;
  togglePin: (item: Omit<PinboardItem, 'pinnedAt'>) => void;
  clearAll: () => void;
  isPinned: (category: PinboardCategory, slug: string) => boolean;
}

export function usePinboard(): UsePinboardReturn {
  const { pins, isLoaded, setPins, setLoaded } = usePinboardStore();
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const pulse = usePulse();

  const emitBookmarkPulse = useCallback(
    (action: 'add' | 'remove', payload: { category: PinboardCategory; slug: string }) => {
      if (!payload.slug) return;
      pulse.bookmark({ category: payload.category, slug: payload.slug, action }).catch((error) => {
        logger.warn('usePinboard: bookmark pulse failed', {
          error: normalizeError(error, "Operation failed").message,
        });
      });
    },
    [pulse]
  );

  useEffect(() => {
    if (isLoaded) return;
    const existingPins = loadPinsFromStorage();
    setPins(existingPins);
    setLoaded(true);
  }, [isLoaded, setPins, setLoaded]);

  const persistPins = useCallback((nextPins: PinboardItem[]) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(() => {
      savePinsToStorage(nextPins);
      saveTimeout.current = null;
    }, DEBOUNCE_MS);
  }, []);

  const pinItem = useCallback(
    (item: Omit<PinboardItem, 'pinnedAt'>) => {
      let pendingPin: PinboardItem | null = null;
      setPins((current) => {
        const sanitized: PinboardItem = {
          category: item.category,
          slug: item.slug,
          title: item.title.trim().slice(0, 140),
          ...(item.typeName ? { typeName: item.typeName.slice(0, 80) } : {}),
          ...(item.description ? { description: item.description.slice(0, 240) } : {}),
          ...(Array.isArray(item.tags) ? { tags: item.tags.slice(0, 6) } : {}),
          ...(item.thumbnailUrl ? { thumbnailUrl: item.thumbnailUrl } : {}),
          pinnedAt: new Date().toISOString(),
        };
        pendingPin = sanitized;

        const filtered = current.filter(
          (pin) => !(pin.category === sanitized.category && pin.slug === sanitized.slug)
        );
        const updated = [sanitized, ...filtered].slice(0, MAX_PINS);
        persistPins(updated);
        return updated;
      });
      if (pendingPin) {
        emitBookmarkPulse('add', pendingPin);
      }
    },
    [setPins, persistPins, emitBookmarkPulse]
  );

  const unpinItem = useCallback(
    (category: PinboardCategory, slug: string) => {
      setPins((current) => {
        const updated = current.filter((pin) => !(pin.category === category && pin.slug === slug));
        savePinsToStorage(updated);
        return updated;
      });
      emitBookmarkPulse('remove', { category, slug });
    },
    [setPins, emitBookmarkPulse]
  );

  const togglePin = useCallback(
    (item: Omit<PinboardItem, 'pinnedAt'>) => {
      const exists = pins.some((pin) => pin.category === item.category && pin.slug === item.slug);
      if (exists) {
        unpinItem(item.category, item.slug);
      } else {
        pinItem(item);
      }
    },
    [pins, pinItem, unpinItem]
  );

  const clearAll = useCallback(() => {
    setPins([]);
    savePinsToStorage([]);
  }, [setPins]);

  const isPinned = useCallback(
    (category: PinboardCategory, slug: string) =>
      pins.some((pin) => pin.category === category && pin.slug === slug),
    [pins]
  );

  return {
    pinnedItems: pins,
    isLoaded,
    pinItem,
    unpinItem,
    togglePin,
    clearAll,
    isPinned,
  };
}
